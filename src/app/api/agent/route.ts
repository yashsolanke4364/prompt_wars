// ============================================================================
// ScholarshipSaathi AI - Server-side AI Agent API Route
// Multi-step workflow: Validate → Match → Rule check → AI explain → Validate output
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { validateProfileInput, runEligibilityEngine } from '@/lib/engine';
import { StudentProfile, EligibilityResult, AIAnalysis, DocumentCheckItem } from '@/lib/types';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MAX_INPUT_LENGTH = 5000;
const MAX_OUTPUT_LENGTH = 8000;

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Invalid request: profile object required' },
        { status: 400 }
      );
    }

    const profile = (body as Record<string, unknown>).profile;

    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      return NextResponse.json(
        { error: 'Invalid request: profile object required' },
        { status: 400 }
      );
    }

    const rawProfile = profile as Record<string, unknown>;
    const validationErrors = validateProfileInput(rawProfile);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }

    // Sanitize string fields only after validating their original types.
    const sanitized = sanitizeProfile(rawProfile as Partial<StudentProfile>);

    // Step 2: Run deterministic eligibility engine
    const startTime = Date.now();
    const results = runEligibilityEngine(sanitized);
    const engineTimeMs = Date.now() - startTime;

    const eligible = results.filter((r) => r.status === 'eligible');
    const potential = results.filter((r) => r.status === 'potential_match');
    const notEligible = results.filter((r) => r.status === 'not_eligible');

    // Step 3: Try AI explanation
    let aiAnalysis: AIAnalysis;

    try {
      if (!GEMINI_API_KEY) {
        throw new Error('API key not configured');
      }
      aiAnalysis = await generateAIAnalysis(sanitized, results);
    } catch (aiError) {
      // Fallback: generate deterministic explanation without AI
      console.warn('AI unavailable, using fallback:', aiError);
      aiAnalysis = generateFallbackAnalysis(sanitized, results);
    }

    // Step 4: Return combined results
    return NextResponse.json({
      success: true,
      engineTimeMs,
      summary: {
        total: results.length,
        eligible: eligible.length,
        potential: potential.length,
        notEligible: notEligible.length,
      },
      results,
      aiAnalysis,
    });
  } catch (error) {
    console.error('Agent API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function sanitizeProfile(profile: Partial<StudentProfile>): Partial<StudentProfile> {
  const sanitized: Partial<StudentProfile> = {};

  if (profile.name) sanitized.name = String(profile.name).trim().slice(0, 200);
  if (profile.email) sanitized.email = String(profile.email).trim().slice(0, 200);
  if (profile.state) sanitized.state = String(profile.state).trim().slice(0, 100);
  if (profile.course) sanitized.course = String(profile.course).trim().slice(0, 50);
  if (profile.domicileState) sanitized.domicileState = String(profile.domicileState).trim().slice(0, 100);
  if (profile.currentYear !== undefined) sanitized.currentYear = Number(profile.currentYear);
  if (profile.familyIncome !== undefined) sanitized.familyIncome = Number(profile.familyIncome);
  if (profile.academicMarks !== undefined) sanitized.academicMarks = Number(profile.academicMarks);
  if (profile.age !== undefined) sanitized.age = Number(profile.age);
  if (profile.category) sanitized.category = profile.category;
  if (profile.gender) sanitized.gender = profile.gender;
  if (profile.disability !== undefined) sanitized.disability = Boolean(profile.disability);

  return sanitized;
}

async function generateAIAnalysis(
  profile: Partial<StudentProfile>,
  results: EligibilityResult[]
): Promise<AIAnalysis> {
  const eligible = results.filter((r) => r.status === 'eligible');
  const potential = results.filter((r) => r.status === 'potential_match');

  const prompt = buildPrompt(profile, eligible, potential);

  // Bound input size
  if (prompt.length > MAX_INPUT_LENGTH) {
    throw new Error('Input too large for AI processing');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: prompt,
    config: {
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
    },
  });
  const text = response.text;

  if (!text || text.length > MAX_OUTPUT_LENGTH) {
    throw new Error('Invalid or oversized AI response');
  }

  // Parse and validate AI output
  const parsed = JSON.parse(text);

  // Step 5: Validate AI output against retrieved records
  const analysis = validateAIOutput(parsed, results);
  analysis.modelUsed = 'gemini-2.0-flash';
  analysis.fallback = false;
  analysis.generatedAt = new Date().toISOString();

  return analysis;
}

function buildPrompt(
  profile: Partial<StudentProfile>,
  eligible: EligibilityResult[],
  potential: EligibilityResult[]
): string {
  return `You are an educational counselor helping an Indian student understand their scholarship eligibility results.

STUDENT PROFILE:
- Course: ${profile.course || 'Not specified'}
- Year: ${profile.currentYear || 'Not specified'}
- Category: ${profile.category || 'Not specified'}
- Gender: ${profile.gender || 'Not specified'}
- State: ${profile.domicileState || 'Not specified'}
- Marks: ${profile.academicMarks !== undefined ? profile.academicMarks + '%' : 'Not specified'}
- Family Income: ${profile.familyIncome !== undefined ? '₹' + profile.familyIncome.toLocaleString('en-IN') : 'Not specified'}

ELIGIBLE SCHOLARSHIPS (${eligible.length}):
${eligible.map((r) => `- ${r.scholarship.name}: ${r.scholarship.amount}`).join('\n')}

POTENTIAL MATCHES (${potential.length}, need more info):
${potential.map((r) => `- ${r.scholarship.name}: Missing - ${r.missingInfo.join(', ')}`).join('\n')}

Respond in JSON format:
{
  "summary": "A 2-3 sentence plain-language summary of the student's scholarship situation. Be encouraging but accurate.",
  "actionPlan": ["Step 1...", "Step 2...", "..."],
  "documentChecklist": [{"document": "Document name", "required": true, "description": "Why needed"}],
  "tips": ["Tip 1...", "Tip 2..."],
  "warnings": ["Warning about any time-sensitive items or common mistakes"]
}

RULES:
- Do NOT invent scholarships or amounts not listed above.
- Do NOT claim any scholarship is currently accepting applications unless deadline info is provided.
- Keep language simple and student-friendly.
- Focus on actionable next steps.
- All demo scholarships should be noted as illustrative examples.`;
}

function validateAIOutput(
  parsed: Record<string, unknown>,
  results: EligibilityResult[]
): AIAnalysis {
  // Ensure all required fields exist with safe defaults
  const knownScholarshipNames = results.map((r) => r.scholarship.name);

  const summary = typeof parsed.summary === 'string'
    ? parsed.summary.slice(0, 2000)
    : generateFallbackSummary(results);

  const actionPlan = Array.isArray(parsed.actionPlan)
    ? (parsed.actionPlan as string[]).filter((s) => typeof s === 'string').slice(0, 10).map((s) => String(s).slice(0, 500))
    : ['Complete your profile to get more accurate results'];

  const documentChecklist = Array.isArray(parsed.documentChecklist)
    ? (parsed.documentChecklist as DocumentCheckItem[]).filter(
        (d) => d && typeof d.document === 'string'
      ).slice(0, 20)
    : [];

  const tips = Array.isArray(parsed.tips)
    ? (parsed.tips as string[]).filter((s) => typeof s === 'string').slice(0, 10).map((s) => String(s).slice(0, 500))
    : [];

  const warnings = Array.isArray(parsed.warnings)
    ? (parsed.warnings as string[]).filter((s) => typeof s === 'string').slice(0, 5).map((s) => String(s).slice(0, 500))
    : [];

  const mandatoryDisclaimer = 'Transparency Notice: AI advice is for preparatory guidance only and does not submit or approve applications. Official submissions must be completed on verified government portals.';
  if (!warnings.includes(mandatoryDisclaimer)) {
    warnings.push(mandatoryDisclaimer);
  }

  const suspiciousContent =
    knownScholarshipNames.length > 0 &&
    !knownScholarshipNames.some((name) =>
      summary.toLowerCase().includes(name.toLowerCase())
    );

  if (suspiciousContent && summary.length > 100) {
    // AI may have hallucinated - add warning
    warnings.push(
      'Notice: AI summary referenced items outside verified records. Please verify with official scholarship sources.'
    );
  }

  return {
    summary,
    actionPlan,
    documentChecklist,
    tips,
    warnings,
    generatedAt: new Date().toISOString(),
    modelUsed: 'gemini-2.0-flash',
    fallback: false,
  };
}

function generateFallbackSummary(results: EligibilityResult[]): string {
  const eligible = results.filter((r) => r.status === 'eligible').length;
  const potential = results.filter((r) => r.status === 'potential_match').length;

  if (eligible > 0) {
    return `Based on your profile, you appear eligible for ${eligible} scholarship(s) in our demo dataset. ${potential > 0 ? `Additionally, ${potential} scholarship(s) could be potential matches if you provide more information.` : ''} Note: These are illustrative examples only. Please verify with official scholarship portals.`;
  }
  if (potential > 0) {
    return `We found ${potential} potential scholarship match(es) that may suit your profile. Complete your profile to get more accurate results. Note: These are illustrative examples only.`;
  }
  return 'Based on the information provided, we could not find matching scholarships in our current demo dataset. Try updating your profile or check official scholarship portals for more options.';
}

function generateFallbackAnalysis(
  profile: Partial<StudentProfile>,
  results: EligibilityResult[]
): AIAnalysis {
  const eligible = results.filter((r) => r.status === 'eligible');
  const potential = results.filter((r) => r.status === 'potential_match');

  const allDocs = new Set<string>();
  [...eligible, ...potential].forEach((r) => {
    r.scholarship.requiredDocuments.forEach((d) => allDocs.add(d));
  });

  const missingFields: string[] = [];
  if (!profile.academicMarks) missingFields.push('academic marks');
  if (!profile.familyIncome) missingFields.push('family income');
  if (!profile.category) missingFields.push('category');
  if (!profile.course) missingFields.push('course');
  if (!profile.domicileState) missingFields.push('domicile state');

  return {
    summary: generateFallbackSummary(results),
    actionPlan: [
      ...(missingFields.length > 0
        ? [`Complete your profile: add ${missingFields.join(', ')}`]
        : []),
      eligible.length > 0
        ? 'Gather required documents for eligible scholarships'
        : 'Explore more scholarship options on official portals',
      'Visit https://scholarships.gov.in for verified government scholarships',
      'Keep your academic records and certificates ready',
      'Check application deadlines regularly on official portals',
    ],
    documentChecklist: Array.from(allDocs).map((doc) => ({
      document: doc,
      required: true,
      description: 'Required for scholarship application',
    })),
    tips: [
      'Apply early — many scholarships are first-come, first-served',
      'Keep scanned copies of all documents ready',
      'Create accounts on NSP (scholarships.gov.in) and state scholarship portals',
    ],
    warnings: [
      'This is a demo analysis. Verify all information from official sources before applying.',
      'AI assistant was unavailable. Results are based on deterministic matching only.',
    ],
    generatedAt: new Date().toISOString(),
    modelUsed: 'fallback-deterministic',
    fallback: true,
  };
}
