"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadProfile, saveProfile, calculateProfileCompletion } from "@/lib/storage";
import { indianStates, courseTypes } from "@/lib/scholarships";
import type { StudentProfile } from "@/lib/types";

const categories = ["General", "OBC", "SC", "ST", "EWS", "Minority"] as const;
const genders = ["Male", "Female", "Other"] as const;

export default function ProfilePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "",
    email: "",
    state: "",
    course: "",
    currentYear: "",
    familyIncome: "",
    category: "",
    gender: "",
    academicMarks: "",
    domicileState: "",
    age: "",
    disability: false,
  });

  useEffect(() => {
    const existing = loadProfile();
    if (existing) {
      setForm({
        name: existing.name || "",
        email: existing.email || "",
        state: existing.state || "",
        course: existing.course || "",
        currentYear: existing.currentYear?.toString() || "",
        familyIncome: existing.familyIncome?.toString() || "",
        category: existing.category || "",
        gender: existing.gender || "",
        academicMarks: existing.academicMarks?.toString() || "",
        domicileState: existing.domicileState || "",
        age: existing.age?.toString() || "",
        disability: existing.disability || false,
      });
    }
  }, []);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.name.trim()) newErrors.name = "Name is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Invalid email format";
    if (form.academicMarks) {
      const marks = parseFloat(form.academicMarks);
      if (isNaN(marks) || marks < 0 || marks > 100)
        newErrors.academicMarks = "Marks must be 0-100";
    }
    if (form.familyIncome) {
      const income = parseFloat(form.familyIncome);
      if (isNaN(income) || income < 0)
        newErrors.familyIncome = "Income must be positive";
    }
    if (form.currentYear) {
      const year = parseInt(form.currentYear);
      if (isNaN(year) || year < 1 || year > 7)
        newErrors.currentYear = "Year must be 1-7";
    }
    if (form.age) {
      const age = parseInt(form.age);
      if (isNaN(age) || age < 15 || age > 60)
        newErrors.age = "Age must be 15-60";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);

    const existing = loadProfile();
    const profile: StudentProfile = {
      id: existing?.id || `student-${Date.now()}`,
      name: form.name.trim(),
      email: form.email.trim(),
      state: form.state,
      course: form.course,
      currentYear: form.currentYear ? parseInt(form.currentYear) : 0,
      familyIncome: form.familyIncome ? parseFloat(form.familyIncome) : 0,
      category: form.category as StudentProfile["category"],
      gender: form.gender as StudentProfile["gender"],
      academicMarks: form.academicMarks ? parseFloat(form.academicMarks) : 0,
      domicileState: form.domicileState,
      age: form.age ? parseInt(form.age) : 0,
      disability: form.disability,
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveProfile(profile);

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/dashboard/matches");
    }, 1500);
  };

  const completion = calculateProfileCompletion({
    name: form.name || undefined,
    email: form.email || undefined,
    state: form.state || undefined,
    course: form.course || undefined,
    currentYear: form.currentYear ? parseInt(form.currentYear) : undefined,
    familyIncome: form.familyIncome ? parseFloat(form.familyIncome) : undefined,
    category: (form.category as StudentProfile["category"]) || undefined,
    gender: (form.gender as StudentProfile["gender"]) || undefined,
    academicMarks: form.academicMarks ? parseFloat(form.academicMarks) : undefined,
    domicileState: form.domicileState || undefined,
    age: form.age ? parseInt(form.age) : undefined,
  } as Partial<StudentProfile>);

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <div className="max-w-3xl animate-fadeIn">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Student Profile</h1>
          <p className="text-navy-500 mt-1">
            Fill in your details to find matching scholarships
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 bg-navy-50 rounded-xl px-4 py-2">
          <span className="text-sm font-medium text-navy-600">{completion}%</span>
          <div className="w-20 progress-bar">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-scaleIn">
          <span className="text-emerald-600 text-xl">✅</span>
          <span className="text-emerald-700 font-medium">
            Profile saved! Redirecting to matches...
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy-900 mb-6 flex items-center gap-2">
            <span className="text-xl">👤</span> Personal Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="name">Full Name *</label>
              <input
                id="name"
                type="text"
                className={`input-field ${errors.name ? "border-red-400 focus:ring-red-400" : ""}`}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Enter your full name"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="label" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                className={`input-field ${errors.email ? "border-red-400 focus:ring-red-400" : ""}`}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="your@email.com"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="label" htmlFor="age">Age</label>
              <input
                id="age"
                type="number"
                className={`input-field ${errors.age ? "border-red-400 focus:ring-red-400" : ""}`}
                value={form.age}
                onChange={(e) => updateField("age", e.target.value)}
                placeholder="18"
                min="15"
                max="60"
              />
              {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
            </div>

            <div>
              <label className="label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                className="select-field"
                value={form.gender}
                onChange={(e) => updateField("gender", e.target.value)}
              >
                <option value="">Select gender</option>
                {genders.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="category">Category</label>
              <select
                id="category"
                className="select-field"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                id="disability"
                type="checkbox"
                className="w-5 h-5 rounded-md border-navy-300 text-teal-500 focus:ring-teal-400"
                checked={form.disability}
                onChange={(e) => updateField("disability", e.target.checked)}
              />
              <label htmlFor="disability" className="text-sm font-medium text-navy-700">
                Person with Disability (PwD)
              </label>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy-900 mb-6 flex items-center gap-2">
            <span className="text-xl">📚</span> Academic Information
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="course">Course</label>
              <select
                id="course"
                className="select-field"
                value={form.course}
                onChange={(e) => updateField("course", e.target.value)}
              >
                <option value="">Select course</option>
                {courseTypes.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="currentYear">Current Year</label>
              <select
                id="currentYear"
                className="select-field"
                value={form.currentYear}
                onChange={(e) => updateField("currentYear", e.target.value)}
              >
                <option value="">Select year</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
              {errors.currentYear && <p className="text-red-500 text-xs mt-1">{errors.currentYear}</p>}
            </div>

            <div>
              <label className="label" htmlFor="academicMarks">Academic Marks (%)</label>
              <input
                id="academicMarks"
                type="number"
                className={`input-field ${errors.academicMarks ? "border-red-400 focus:ring-red-400" : ""}`}
                value={form.academicMarks}
                onChange={(e) => updateField("academicMarks", e.target.value)}
                placeholder="85"
                min="0"
                max="100"
                step="0.1"
              />
              {errors.academicMarks && <p className="text-red-500 text-xs mt-1">{errors.academicMarks}</p>}
            </div>
          </div>
        </div>

        {/* Location & Financial */}
        <div className="card p-6 sm:p-8">
          <h2 className="text-lg font-bold text-navy-900 mb-6 flex items-center gap-2">
            <span className="text-xl">📍</span> Location & Financial
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="label" htmlFor="state">Current State</label>
              <select
                id="state"
                className="select-field"
                value={form.state}
                onChange={(e) => updateField("state", e.target.value)}
              >
                <option value="">Select state</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="label" htmlFor="domicileState">Domicile State</label>
              <select
                id="domicileState"
                className="select-field"
                value={form.domicileState}
                onChange={(e) => updateField("domicileState", e.target.value)}
              >
                <option value="">Select domicile state</option>
                {indianStates.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="label" htmlFor="familyIncome">Annual Family Income (₹)</label>
              <input
                id="familyIncome"
                type="number"
                className={`input-field ${errors.familyIncome ? "border-red-400 focus:ring-red-400" : ""}`}
                value={form.familyIncome}
                onChange={(e) => updateField("familyIncome", e.target.value)}
                placeholder="300000"
                min="0"
              />
              {errors.familyIncome && <p className="text-red-500 text-xs mt-1">{errors.familyIncome}</p>}
              <p className="text-xs text-navy-400 mt-1">Enter total annual household income in rupees</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              <>Save & Find Matches</>
            )}
          </button>
          <p className="text-xs text-navy-400">
            ⚠️ Demo mode: Data stored locally in your browser
          </p>
        </div>
      </form>
    </div>
  );
}
