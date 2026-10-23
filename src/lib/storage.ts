// ============================================================================
// ScholarshipSaathi AI - localStorage persistence layer
// Demo persistence with clear labeling. Architecture ready for Firebase.
// ============================================================================

import { StudentProfile, TrackedApplication } from './types';

const STORAGE_KEYS = {
  PROFILE: 'scholarshipsaathi_profile',
  TRACKED_APPS: 'scholarshipsaathi_tracked',
  ACTIVITY_LOG: 'scholarshipsaathi_activity',
} as const;

// ---- Profile ----

export function saveProfile(profile: StudentProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  logActivity('Profile updated');
}

export function loadProfile(): StudentProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STORAGE_KEYS.PROFILE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentProfile;
  } catch {
    return null;
  }
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.PROFILE);
}

// ---- Tracked Applications ----

export function saveTrackedApps(apps: TrackedApplication[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TRACKED_APPS, JSON.stringify(apps));
}

export function loadTrackedApps(): TrackedApplication[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.TRACKED_APPS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as TrackedApplication[];
  } catch {
    return [];
  }
}

export function addTrackedApp(app: TrackedApplication): TrackedApplication[] {
  const apps = loadTrackedApps();
  const existing = apps.findIndex((a) => a.scholarshipId === app.scholarshipId);
  if (existing >= 0) {
    apps[existing] = { ...apps[existing], ...app, lastUpdated: new Date().toISOString() };
  } else {
    apps.push(app);
  }
  saveTrackedApps(apps);
  logActivity(`Saved: ${app.scholarshipName}`);
  return apps;
}

export function updateTrackedApp(
  scholarshipId: string,
  updates: Partial<TrackedApplication>
): TrackedApplication[] {
  const apps = loadTrackedApps();
  const idx = apps.findIndex((a) => a.scholarshipId === scholarshipId);
  if (idx >= 0) {
    apps[idx] = { ...apps[idx], ...updates, lastUpdated: new Date().toISOString() };
    saveTrackedApps(apps);
    logActivity(`Updated: ${apps[idx].scholarshipName}`);
  }
  return apps;
}

export function removeTrackedApp(scholarshipId: string): TrackedApplication[] {
  const apps = loadTrackedApps().filter((a) => a.scholarshipId !== scholarshipId);
  saveTrackedApps(apps);
  logActivity('Removed a tracked scholarship');
  return apps;
}

// ---- Activity Log ----

interface ActivityEntry {
  message: string;
  timestamp: string;
}

export function logActivity(message: string): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  let entries: ActivityEntry[] = [];
  try {
    entries = raw ? JSON.parse(raw) : [];
  } catch {
    entries = [];
  }
  entries.unshift({ message, timestamp: new Date().toISOString() });
  // Keep only last 50
  if (entries.length > 50) entries = entries.slice(0, 50);
  localStorage.setItem(STORAGE_KEYS.ACTIVITY_LOG, JSON.stringify(entries));
}

export function loadActivity(): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEYS.ACTIVITY_LOG);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ActivityEntry[];
  } catch {
    return [];
  }
}

// ---- Profile completion calculator ----

export function calculateProfileCompletion(profile: Partial<StudentProfile> | null): number {
  if (!profile) return 0;
  const fields = [
    'name', 'email', 'state', 'course', 'currentYear',
    'familyIncome', 'category', 'gender', 'academicMarks',
    'domicileState', 'age',
  ];
  const filled = fields.filter((f) => {
    const val = profile[f as keyof StudentProfile];
    return val !== undefined && val !== null && val !== '';
  }).length;
  return Math.round((filled / fields.length) * 100);
}
