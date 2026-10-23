// ============================================================================
// ScholarshipSaathi AI - Deterministic Eligibility Engine
// This engine uses only verified, structured criteria. AI never overrides these.
// ============================================================================

import { StudentProfile, Scholarship, EligibilityResult, EligibilityStatus } from './types';
import { scholarshipDataset } from './scholarships';

/**
 * Run deterministic eligibility rules for a student profile against the full dataset.
 * Returns sorted results: eligible first, then potential, then not eligible.
 */
export function runEligibilityEngine(profile: Partial<StudentProfile>): EligibilityResult[] {
  const results: EligibilityResult[] = scholarshipDataset.map((scholarship) =>
    evaluateScholarship(profile, scholarship)
  );

  // Sort: eligible > potential > not eligible
  const order: Record<EligibilityStatus, number> = {
    eligible: 0,
    potential_match: 1,
    not_eligible: 2,
  };

  return results.sort((a, b) => order[a.status] - order[b.status]);
}

/**
 * Evaluate a single scholarship against a student profile.
 */
export function evaluateScholarship(
  profile: Partial<StudentProfile>,
  scholarship: Scholarship
): EligibilityResult {
  const matched: string[] = [];
  const failed: string[] = [];
  const missing: string[] = [];
  const criteria = scholarship.eligibility;

  // Check academic marks
  if (criteria.minMarks !== undefined) {
    if (profile.academicMarks !== undefined) {
      if (profile.academicMarks >= criteria.minMarks) {
        matched.push(`Academic marks (${profile.academicMarks}%) meet minimum ${criteria.minMarks}%`);
      } else {
        failed.push(`Academic marks (${profile.academicMarks}%) below required ${criteria.minMarks}%`);
      }
    } else {
      missing.push('Academic marks not provided');
    }
  }

  // Check income
  if (criteria.maxIncome !== undefined) {
    if (profile.familyIncome !== undefined) {
      if (profile.familyIncome <= criteria.maxIncome) {
        matched.push(
          `Family income (₹${profile.familyIncome.toLocaleString('en-IN')}) within limit ₹${criteria.maxIncome.toLocaleString('en-IN')}`
        );
      } else {
        failed.push(
          `Family income (₹${profile.familyIncome.toLocaleString('en-IN')}) exceeds limit ₹${criteria.maxIncome.toLocaleString('en-IN')}`
        );
      }
    } else {
      missing.push('Family income not provided');
    }
  }

  // Check category
  if (criteria.categories && criteria.categories.length > 0) {
    if (profile.category) {
      if (criteria.categories.includes(profile.category)) {
        matched.push(`Category (${profile.category}) is eligible`);
      } else {
        failed.push(
          `Category (${profile.category}) not in eligible list: ${criteria.categories.join(', ')}`
        );
      }
    } else {
      missing.push('Category not provided');
    }
  }

  // Check gender
  if (criteria.genders && criteria.genders.length > 0) {
    if (profile.gender) {
      if (criteria.genders.includes(profile.gender)) {
        matched.push(`Gender (${profile.gender}) is eligible`);
      } else {
        failed.push(
          `Gender (${profile.gender}) not eligible. Required: ${criteria.genders.join(', ')}`
        );
      }
    } else {
      missing.push('Gender not provided');
    }
  }

  // Check state
  if (criteria.states && criteria.states.length > 0) {
    if (profile.domicileState) {
      if (criteria.states.includes(profile.domicileState)) {
        matched.push(`Domicile state (${profile.domicileState}) is eligible`);
      } else {
        failed.push(
          `Domicile state (${profile.domicileState}) not eligible. Required: ${criteria.states.join(', ')}`
        );
      }
    } else {
      missing.push('Domicile state not provided');
    }
  }

  // Check course type
  if (criteria.courseTypes && criteria.courseTypes.length > 0) {
    if (profile.course) {
      if (criteria.courseTypes.includes(profile.course)) {
        matched.push(`Course (${profile.course}) is eligible`);
      } else {
        failed.push(
          `Course (${profile.course}) not eligible. Eligible courses: ${criteria.courseTypes.join(', ')}`
        );
      }
    } else {
      missing.push('Course not provided');
    }
  }

  // Check year
  if (criteria.minYear !== undefined || criteria.maxYear !== undefined) {
    if (profile.currentYear !== undefined) {
      const yearOk =
        (criteria.minYear === undefined || profile.currentYear >= criteria.minYear) &&
        (criteria.maxYear === undefined || profile.currentYear <= criteria.maxYear);
      if (yearOk) {
        matched.push(`Current year (${profile.currentYear}) is within range`);
      } else {
        failed.push(
          `Current year (${profile.currentYear}) outside range ${criteria.minYear ?? 1}-${criteria.maxYear ?? '∞'}`
        );
      }
    } else {
      missing.push('Current year not provided');
    }
  }

  // Check disability
  if (criteria.disability === true) {
    if (profile.disability !== undefined) {
      if (profile.disability) {
        matched.push('Disability status verified');
      } else {
        failed.push('Scholarship requires disability status');
      }
    } else {
      missing.push('Disability status not provided');
    }
  }

  // Check age
  if (criteria.maxAge !== undefined) {
    if (profile.age !== undefined) {
      if (profile.age <= criteria.maxAge) {
        matched.push(`Age (${profile.age}) within limit`);
      } else {
        failed.push(`Age (${profile.age}) exceeds maximum ${criteria.maxAge}`);
      }
    } else {
      missing.push('Age not provided');
    }
  }

  if (criteria.minAge !== undefined) {
    if (profile.age !== undefined) {
      if (profile.age >= criteria.minAge) {
        matched.push(`Age (${profile.age}) meets minimum`);
      } else {
        failed.push(`Age (${profile.age}) below minimum ${criteria.minAge}`);
      }
    } else {
      missing.push('Age not provided');
    }
  }

  // Determine status
  let status: EligibilityStatus;
  const totalCriteria = matched.length + failed.length + missing.length;

  if (failed.length > 0) {
    status = 'not_eligible';
  } else if (missing.length > 0) {
    status = 'potential_match';
  } else {
    status = 'eligible';
  }

  // Calculate confidence
  const confidence =
    totalCriteria > 0
      ? Math.round((matched.length / totalCriteria) * 100)
      : 0;

  return {
    scholarshipId: scholarship.id,
    scholarship,
    status,
    matchedCriteria: matched,
    failedCriteria: failed,
    missingInfo: missing,
    confidence,
  };
}

/**
 * Validate student profile input. Returns array of validation errors.
 */
export function validateProfileInput(profile: Record<string, unknown>): string[] {
  const errors: string[] = [];

  if (profile.name !== undefined) {
    if (typeof profile.name !== 'string' || profile.name.trim().length === 0) {
      errors.push('Name must be a non-empty string');
    } else if (profile.name.length > 200) {
      errors.push('Name too long (max 200 characters)');
    }
  }

  if (profile.email !== undefined) {
    if (typeof profile.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      errors.push('Invalid email format');
    }
  }

  for (const field of ['state', 'course', 'domicileState', 'id', 'createdAt', 'updatedAt']) {
    const value = profile[field];
    if (value !== undefined && (typeof value !== 'string' || value.length > 200)) {
      errors.push(`${field} must be a string of at most 200 characters`);
    }
  }

  if (profile.disability !== undefined && typeof profile.disability !== 'boolean') {
    errors.push('Disability must be a boolean');
  }

  if (profile.academicMarks !== undefined) {
    if (typeof profile.academicMarks !== 'number') {
      errors.push('Academic marks must be a number');
    }
    const marks = Number(profile.academicMarks);
    if (isNaN(marks) || marks < 0 || marks > 100) {
      errors.push('Academic marks must be between 0 and 100');
    }
  }

  if (profile.familyIncome !== undefined) {
    if (typeof profile.familyIncome !== 'number') {
      errors.push('Family income must be a number');
    }
    const income = Number(profile.familyIncome);
    if (isNaN(income) || income < 0 || income > 100000000) {
      errors.push('Family income must be a positive number (max ₹10 Cr)');
    }
  }

  if (profile.currentYear !== undefined) {
    if (typeof profile.currentYear !== 'number') {
      errors.push('Current year must be a number');
    }
    const year = Number(profile.currentYear);
    if (isNaN(year) || year < 1 || year > 7) {
      errors.push('Current year must be between 1 and 7');
    }
  }

  if (profile.age !== undefined) {
    if (typeof profile.age !== 'number') {
      errors.push('Age must be a number');
    }
    const age = Number(profile.age);
    if (isNaN(age) || age < 15 || age > 60) {
      errors.push('Age must be between 15 and 60');
    }
  }

  if (profile.category !== undefined) {
    const validCategories = ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'];
    if (!validCategories.includes(profile.category as string)) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }
  }

  if (profile.gender !== undefined) {
    const validGenders = ['Male', 'Female', 'Other'];
    if (!validGenders.includes(profile.gender as string)) {
      errors.push(`Gender must be one of: ${validGenders.join(', ')}`);
    }
  }

  return errors;
}
