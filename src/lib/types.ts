// ============================================================================
// ScholarshipSaathi AI - Core Type Definitions
// ============================================================================

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  state: string;
  course: string;
  currentYear: number;
  familyIncome: number; // Annual income in INR
  category: 'General' | 'OBC' | 'SC' | 'ST' | 'EWS' | 'Minority';
  gender: 'Male' | 'Female' | 'Other';
  academicMarks: number; // Percentage
  disability: boolean;
  domicileState: string;
  age: number;
  createdAt: string;
  updatedAt: string;
}

export interface Scholarship {
  id: string;
  name: string;
  provider: string;
  description: string;
  sourceUrl: string;
  amount: string; // e.g., "₹50,000 per year"
  eligibility: EligibilityCriteria;
  requiredDocuments: string[];
  applicationDeadline: string | null; // null if unknown
  verificationStatus: 'verified' | 'demo_data' | 'unverified';
  verificationDate: string | null;
  category: ScholarshipCategory;
  courseTypes: string[];
  states: string[]; // empty = all India
  tags: string[];
}

export interface EligibilityCriteria {
  minMarks?: number;
  maxIncome?: number;
  categories?: string[];
  genders?: string[];
  states?: string[];
  courseTypes?: string[];
  minYear?: number;
  maxYear?: number;
  disability?: boolean;
  maxAge?: number;
  minAge?: number;
}

export type ScholarshipCategory =
  | 'Central Government'
  | 'State Government'
  | 'Private'
  | 'NGO'
  | 'University'
  | 'Corporate';

export type EligibilityStatus =
  | 'eligible'
  | 'potential_match'
  | 'not_eligible';

export interface EligibilityResult {
  scholarshipId: string;
  scholarship: Scholarship;
  status: EligibilityStatus;
  matchedCriteria: string[];
  failedCriteria: string[];
  missingInfo: string[];
  confidence: number; // 0-100
}

export interface TrackedApplication {
  id: string;
  scholarshipId: string;
  scholarshipName: string;
  status: ApplicationStatus;
  notes: string;
  appliedDate: string | null;
  lastUpdated: string;
  documentsReady: string[];
  documentsPending: string[];
}

export type ApplicationStatus =
  | 'saved'
  | 'documents_gathering'
  | 'application_ready'
  | 'applied'
  | 'under_review'
  | 'accepted'
  | 'rejected';

export interface AIAnalysis {
  summary: string;
  actionPlan: string[];
  documentChecklist: DocumentCheckItem[];
  tips: string[];
  warnings: string[];
  generatedAt: string;
  modelUsed: string;
  fallback: boolean;
}

export interface DocumentCheckItem {
  document: string;
  required: boolean;
  description: string;
}

export interface DashboardStats {
  profileCompletion: number;
  totalMatches: number;
  eligibleCount: number;
  potentialCount: number;
  notEligibleCount: number;
  trackedApplications: number;
  documentsReady: number;
  documentsPending: number;
}

export interface TestProfile {
  name: string;
  profile: Partial<StudentProfile>;
  expectedEligible: number;
  expectedNotEligible: number;
  description: string;
}

export interface TestResult {
  profileName: string;
  description: string;
  eligibleCount: number;
  potentialCount: number;
  notEligibleCount: number;
  expectedEligible: number;
  expectedNotEligible: number;
  passed: boolean;
  responseTimeMs: number;
  invalidInputRejected: boolean;
  aiExplanationSuccess: boolean;
  details: string;
}

export interface EvaluationResults {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  avgResponseTimeMs: number;
  eligibilityPassRate: number;
  invalidInputRejectionRate: number;
  aiSuccessRate: number;
  aiFallbackRate: number;
  results: TestResult[];
}
