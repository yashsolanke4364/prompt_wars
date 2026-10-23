"use client";

import { useState, useEffect } from "react";
import { loadProfile, addTrackedApp, loadTrackedApps } from "@/lib/storage";
import { runEligibilityEngine } from "@/lib/engine";
import type { StudentProfile, EligibilityResult, AIAnalysis, TrackedApplication } from "@/lib/types";
import Link from "next/link";

type FilterStatus = "all" | "eligible" | "potential_match" | "not_eligible";

export default function MatchesPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [results, setResults] = useState<EligibilityResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<EligibilityResult[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prof = loadProfile();
    setProfile(prof);

    if (prof) {
      const res = runEligibilityEngine(prof);
      setResults(res);
      setFilteredResults(res);
    }

    const tracked = loadTrackedApps();
    setTrackedIds(new Set(tracked.map((t) => t.scholarshipId)));

    setLoading(false);
  }, []);

  useEffect(() => {
    let filtered = results;

    if (filter !== "all") {
      filtered = filtered.filter((r) => r.status === filter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.scholarship.name.toLowerCase().includes(q) ||
          r.scholarship.provider.toLowerCase().includes(q) ||
          r.scholarship.tags.some((t) => t.includes(q))
      );
    }

    setFilteredResults(filtered);
  }, [filter, search, results]);

  const runAIAnalysis = async () => {
    if (!profile) return;
    setAiLoading(true);
    setAiError(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "AI analysis failed");
      }

      const data = await res.json();
      setAiAnalysis(data.aiAnalysis);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  };

  const trackScholarship = (result: EligibilityResult) => {
    const app: TrackedApplication = {
      id: `app-${Date.now()}`,
      scholarshipId: result.scholarshipId,
      scholarshipName: result.scholarship.name,
      status: "saved",
      notes: "",
      appliedDate: null,
      lastUpdated: new Date().toISOString(),
      documentsReady: [],
      documentsPending: result.scholarship.requiredDocuments,
    };

    addTrackedApp(app);
    setTrackedIds((prev) => new Set(prev).add(result.scholarshipId));
  };

  const eligible = results.filter((r) => r.status === "eligible").length;
  const potential = results.filter((r) => r.status === "potential_match").length;
  const notEligible = results.filter((r) => r.status === "not_eligible").length;

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="skeleton h-10 w-64" />
        <div className="skeleton h-20 rounded-2xl" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20 animate-fadeIn">
        <div className="text-6xl mb-4">📝</div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">Profile Required</h2>
        <p className="text-navy-500 mb-6">Complete your profile first to see scholarship matches</p>
        <Link href="/dashboard/profile" className="btn-primary">
          Complete Profile →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">Scholarship Matches</h1>
          <p className="text-navy-500 mt-1">
            {results.length} scholarships evaluated for your profile
          </p>
        </div>
        <button
          onClick={runAIAnalysis}
          disabled={aiLoading}
          className="btn-primary"
        >
          {aiLoading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing...
            </>
          ) : (
            <>🤖 Run AI Analysis</>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter(filter === "eligible" ? "all" : "eligible")}
          className={`stat-card cursor-pointer transition-all ${filter === "eligible" ? "ring-2 ring-teal-400" : ""}`}
        >
          <div className="stat-value text-emerald-600">{eligible}</div>
          <div className="stat-label">Eligible</div>
        </button>
        <button
          onClick={() => setFilter(filter === "potential_match" ? "all" : "potential_match")}
          className={`stat-card cursor-pointer transition-all ${filter === "potential_match" ? "ring-2 ring-amber-400" : ""}`}
        >
          <div className="stat-value text-amber-600">{potential}</div>
          <div className="stat-label">Potential</div>
        </button>
        <button
          onClick={() => setFilter(filter === "not_eligible" ? "all" : "not_eligible")}
          className={`stat-card cursor-pointer transition-all ${filter === "not_eligible" ? "ring-2 ring-red-400" : ""}`}
        >
          <div className="stat-value text-red-500">{notEligible}</div>
          <div className="stat-label">Not Eligible</div>
        </button>
      </div>

      {/* AI Analysis Section */}
      {aiError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-scaleIn">
          <p className="text-red-700 font-medium">⚠️ {aiError}</p>
          <p className="text-red-600 text-sm mt-1">
            The matching engine results above are still valid. AI adds explanations but doesn&apos;t affect eligibility.
          </p>
        </div>
      )}

      {aiAnalysis && (
        <div className="card-elevated p-6 sm:p-8 animate-scaleIn">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🤖</span>
            <div>
              <h2 className="text-lg font-bold text-navy-900">AI Analysis</h2>
              <p className="text-xs text-navy-400">
                Model: {aiAnalysis.modelUsed} • {aiAnalysis.fallback ? "Fallback mode" : "Live"}
              </p>
            </div>
          </div>

          <p className="text-navy-700 leading-relaxed mb-6">{aiAnalysis.summary}</p>

          {aiAnalysis.actionPlan.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-navy-900 mb-3">📋 Action Plan</h3>
              <ol className="space-y-2">
                {aiAnalysis.actionPlan.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-navy-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {aiAnalysis.documentChecklist.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-navy-900 mb-3">📄 Document Checklist</h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {aiAnalysis.documentChecklist.map((doc, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-navy-50 rounded-lg">
                    <span className="text-navy-400 mt-0.5">☐</span>
                    <div>
                      <p className="text-sm font-medium text-navy-700">{doc.document}</p>
                      <p className="text-xs text-navy-400">{doc.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.tips.length > 0 && (
            <div className="mb-4">
              <h3 className="font-semibold text-navy-900 mb-2">💡 Tips</h3>
              <ul className="space-y-1">
                {aiAnalysis.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-navy-600 flex gap-2">
                    <span className="text-teal-400">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {aiAnalysis.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              {aiAnalysis.warnings.map((w, i) => (
                <p key={i} className="text-sm text-amber-700">⚠️ {w}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-navy-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          className="input-field pl-12"
          placeholder="Search scholarships by name, provider, or tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Results */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <div className="text-center py-12 card">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-navy-500 font-medium">No scholarships match your filter</p>
            <button onClick={() => { setFilter("all"); setSearch(""); }} className="btn-ghost mt-2 text-teal-600">
              Clear filters
            </button>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result.scholarshipId}
              className="card p-5 sm:p-6 hover:border-teal-200 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <h3 className="font-bold text-navy-900">{result.scholarship.name}</h3>
                    <span
                      className={
                        result.status === "eligible"
                          ? "badge-eligible"
                          : result.status === "potential_match"
                          ? "badge-potential"
                          : "badge-not-eligible"
                      }
                    >
                      {result.status === "eligible"
                        ? "Eligible"
                        : result.status === "potential_match"
                        ? "Potential Match"
                        : "Not Eligible"}
                    </span>
                    <span className="badge-demo">Demo Data</span>
                  </div>

                  <p className="text-sm text-navy-500 mb-3">{result.scholarship.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <span className="text-navy-600">
                      <strong>Amount:</strong> {result.scholarship.amount}
                    </span>
                    <span className="text-navy-600">
                      <strong>Provider:</strong> {result.scholarship.provider}
                    </span>
                    <span className="text-navy-600">
                      <strong>Category:</strong> {result.scholarship.category}
                    </span>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-bold text-navy-900">{result.confidence}%</div>
                  <div className="text-xs text-navy-400">confidence</div>
                </div>
              </div>

              {/* Expand/Collapse Details */}
              <button
                onClick={() =>
                  setExpandedCard(
                    expandedCard === result.scholarshipId ? null : result.scholarshipId
                  )
                }
                className="mt-3 text-sm text-teal-600 font-medium hover:text-teal-700 transition-colors"
              >
                {expandedCard === result.scholarshipId ? "Hide Details ▲" : "Show Details ▼"}
              </button>

              {expandedCard === result.scholarshipId && (
                <div className="mt-4 pt-4 border-t border-navy-100 animate-fadeIn">
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Criteria Results */}
                    <div>
                      {result.matchedCriteria.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-emerald-700 mb-1">✅ Matched</h4>
                          <ul className="space-y-1">
                            {result.matchedCriteria.map((c, i) => (
                              <li key={i} className="text-xs text-emerald-600">• {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.failedCriteria.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-semibold text-red-700 mb-1">❌ Failed</h4>
                          <ul className="space-y-1">
                            {result.failedCriteria.map((c, i) => (
                              <li key={i} className="text-xs text-red-600">• {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {result.missingInfo.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-amber-700 mb-1">⚠️ Missing Info</h4>
                          <ul className="space-y-1">
                            {result.missingInfo.map((c, i) => (
                              <li key={i} className="text-xs text-amber-600">• {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Documents & Source */}
                    <div>
                      <h4 className="text-sm font-semibold text-navy-700 mb-2">📄 Required Documents</h4>
                      <ul className="space-y-1 mb-4">
                        {result.scholarship.requiredDocuments.map((doc, i) => (
                          <li key={i} className="text-xs text-navy-600 flex items-center gap-1">
                            <span className="text-navy-400">☐</span> {doc}
                          </li>
                        ))}
                      </ul>

                      <div className="p-3 bg-navy-50 rounded-lg text-xs">
                        <p className="text-navy-500">
                          <strong>Source:</strong>{" "}
                          <a
                            href={result.scholarship.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 underline"
                          >
                            {result.scholarship.sourceUrl}
                          </a>
                        </p>
                        <p className="text-navy-400 mt-1">
                          Verification: {result.scholarship.verificationStatus === "demo_data"
                            ? "⚠️ Demo/Illustrative data"
                            : result.scholarship.verificationStatus === "verified"
                            ? `✅ Verified (${result.scholarship.verificationDate})`
                            : "❓ Unverified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-4">
                    {trackedIds.has(result.scholarshipId) ? (
                      <span className="btn-ghost text-sm text-emerald-600 cursor-default">
                        ✅ Saved to Tracker
                      </span>
                    ) : (
                      <button
                        onClick={() => trackScholarship(result)}
                        className="btn-outline text-sm py-2 px-4"
                      >
                        📌 Save to Tracker
                      </button>
                    )}
                    <a
                      href={result.scholarship.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost text-sm"
                    >
                      🔗 Visit Source
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
