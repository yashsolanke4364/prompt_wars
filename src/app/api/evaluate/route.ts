// ============================================================================
// ScholarshipSaathi AI - Evaluation API
// Runs predefined test profiles through the matching engine and measures performance
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { runEligibilityEngine, validateProfileInput } from '@/lib/engine';
import { StudentProfile, TestProfile, TestResult, EvaluationResults } from '@/lib/types';

const testProfiles: TestProfile[] = [
  {
    name: 'SC Student - Low Income',
    description: 'SC student from UP with 78% marks and ₹1.5L income',
    profile: {
      name: 'Test Student A',
      category: 'SC',
      familyIncome: 150000,
      academicMarks: 78,
      course: 'B.Tech',
      currentYear: 2,
      domicileState: 'Uttar Pradesh',
      gender: 'Male',
      disability: false,
      age: 20,
    },
    expectedEligible: 2, // SC/ST scholarship + UP state scholarship
    expectedNotEligible: 4,
  },
  {
    name: 'Female Minority - Engineering',
    description: 'Female minority student in B.Tech with 82% and ₹1.8L income',
    profile: {
      name: 'Test Student B',
      category: 'Minority',
      familyIncome: 180000,
      academicMarks: 82,
      course: 'B.Tech',
      currentYear: 1,
      domicileState: 'Delhi',
      gender: 'Female',
      disability: false,
      age: 18,
    },
    expectedEligible: 3,
    expectedNotEligible: 4,
  },
  {
    name: 'General Category - High Income',
    description: 'General category student with high income (₹12L), 90% marks',
    profile: {
      name: 'Test Student C',
      category: 'General',
      familyIncome: 1200000,
      academicMarks: 90,
      course: 'B.Sc',
      currentYear: 1,
      domicileState: 'Maharashtra',
      gender: 'Male',
      disability: false,
      age: 18,
    },
    expectedEligible: 1, // INSPIRE
    expectedNotEligible: 8,
  },
  {
    name: 'OBC Student - Maharashtra',
    description: 'OBC student from Maharashtra with 72% marks and ₹4L income',
    profile: {
      name: 'Test Student D',
      category: 'OBC',
      familyIncome: 400000,
      academicMarks: 72,
      course: 'B.Com',
      currentYear: 2,
      domicileState: 'Maharashtra',
      gender: 'Male',
      disability: false,
      age: 19,
    },
    expectedEligible: 1,
    expectedNotEligible: 6,
  },
  {
    name: 'PwD Student - Engineering',
    description: 'Student with disability pursuing B.Tech with 65% and ₹3L income',
    profile: {
      name: 'Test Student E',
      category: 'General',
      familyIncome: 300000,
      academicMarks: 65,
      course: 'B.Tech',
      currentYear: 3,
      domicileState: 'Tamil Nadu',
      gender: 'Female',
      disability: true,
      age: 21,
    },
    expectedEligible: 2,
    expectedNotEligible: 6,
  },
  {
    name: 'Invalid Input - Negative Marks',
    description: 'Should reject: academic marks = -20',
    profile: {
      name: 'Invalid Student',
      academicMarks: -20,
      familyIncome: 300000,
    } as Partial<StudentProfile>,
    expectedEligible: 0,
    expectedNotEligible: 0,
  },
  {
    name: 'Invalid Input - Empty Name',
    description: 'Should reject: name is empty string',
    profile: {
      name: '',
      academicMarks: 80,
      familyIncome: 300000,
    } as Partial<StudentProfile>,
    expectedEligible: 0,
    expectedNotEligible: 0,
  },
  {
    name: 'Incomplete Profile',
    description: 'Only marks provided - should get potential matches',
    profile: {
      academicMarks: 88,
    } as Partial<StudentProfile>,
    expectedEligible: 0,
    expectedNotEligible: 0,
  },
];

export async function GET(request: NextRequest) {
  const results: TestResult[] = [];
  let totalResponseTime = 0;
  let validInputTests = 0;
  let invalidInputTests = 0;
  let invalidInputRejected = 0;
  let aiSuccessCount = 0;
  let aiFallbackCount = 0;
  let aiAttemptCount = 0;

  for (const test of testProfiles) {
    const isInvalid = test.name.startsWith('Invalid Input');
    const startTime = Date.now();

    // Validate input
    const validationErrors = validateProfileInput(
      test.profile as Record<string, unknown>
    );

    if (isInvalid) {
      invalidInputTests++;
      if (validationErrors.length > 0) {
        invalidInputRejected++;
        results.push({
          profileName: test.name,
          description: test.description,
          eligibleCount: 0,
          potentialCount: 0,
          notEligibleCount: 0,
          expectedEligible: 0,
          expectedNotEligible: 0,
          passed: true,
          responseTimeMs: Date.now() - startTime,
          invalidInputRejected: true,
          aiExplanationSuccess: false,
          details: `Correctly rejected: ${validationErrors.join('; ')}`,
        });
        continue;
      }
    }

    if (validationErrors.length > 0 && !isInvalid) {
      validInputTests++;
      results.push({
        profileName: test.name,
        description: test.description,
        eligibleCount: 0,
        potentialCount: 0,
        notEligibleCount: 0,
        expectedEligible: test.expectedEligible,
        expectedNotEligible: test.expectedNotEligible,
        passed: false,
        responseTimeMs: Date.now() - startTime,
        invalidInputRejected: false,
        aiExplanationSuccess: false,
        details: `Unexpected validation failure: ${validationErrors.join('; ')}`,
      });
      continue;
    }

    // Run engine
    const engineResults = runEligibilityEngine(test.profile);
    const responseTimeMs = Date.now() - startTime;
    totalResponseTime += responseTimeMs;
    validInputTests++;

    const eligibleCount = engineResults.filter((r) => r.status === 'eligible').length;
    const potentialCount = engineResults.filter((r) => r.status === 'potential_match').length;
    const notEligibleCount = engineResults.filter((r) => r.status === 'not_eligible').length;

    const passed =
      eligibleCount >= test.expectedEligible - 1 &&
      eligibleCount <= test.expectedEligible + 1;

    results.push({
      profileName: test.name,
      description: test.description,
      eligibleCount,
      potentialCount,
      notEligibleCount,
      expectedEligible: test.expectedEligible,
      expectedNotEligible: test.expectedNotEligible,
      passed,
      responseTimeMs,
      invalidInputRejected: false,
      aiExplanationSuccess: false,
      details: passed
        ? `Matched ${eligibleCount} eligible (expected ~${test.expectedEligible})`
        : `Expected ~${test.expectedEligible} eligible but got ${eligibleCount}`,
    });
  }

  // Exercise the same agent endpoint once per evaluation run. Deriving its URL
  // from the incoming request keeps this working on localhost and deployments.
  const firstValidProfile = testProfiles.find(
    (test) => !test.name.startsWith('Invalid Input') && !test.name.startsWith('Incomplete')
  );
  if (firstValidProfile) {
    aiAttemptCount++;
    try {
      const agentResponse = await fetch(new URL('/api/agent', request.url), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: firstValidProfile.profile }),
      });
      if (agentResponse.ok) {
        const agentData = await agentResponse.json();
        const analysis = agentData.aiAnalysis as { summary?: unknown; fallback?: unknown } | undefined;
        if (typeof analysis?.summary === 'string' && analysis.summary.length > 0) {
          aiSuccessCount++;
          if (analysis.fallback === true) aiFallbackCount++;
        } else {
          aiFallbackCount++;
        }
      } else {
        aiFallbackCount++;
      }
    } catch {
      aiFallbackCount++;
    }
  }

  const passedTests = results.filter((r) => r.passed).length;
  const avgResponseTime =
    validInputTests > 0 ? Math.round(totalResponseTime / validInputTests) : 0;

  const evaluation: EvaluationResults = {
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests: results.length - passedTests,
    avgResponseTimeMs: avgResponseTime,
    eligibilityPassRate: Math.round((passedTests / results.length) * 100),
    invalidInputRejectionRate:
      invalidInputTests > 0
        ? Math.round((invalidInputRejected / invalidInputTests) * 100)
        : 100,
    aiSuccessRate:
      aiAttemptCount > 0
        ? Math.round((aiSuccessCount / aiAttemptCount) * 100)
        : 0,
    aiFallbackRate:
      aiAttemptCount > 0
        ? Math.round((aiFallbackCount / aiAttemptCount) * 100)
        : 0,
    results,
  };

  return NextResponse.json(evaluation);
}
