"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { EvaluationResults } from "@/lib/types";

export default function EvaluatePage() {
  const [data, setData] = useState<EvaluationResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const runEvaluation = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/evaluate");
      if (!res.ok) throw new Error("Evaluation run failed");
      const json: EvaluationResults = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load evaluation");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runEvaluation();
  }, []);

  return (
    <div className="min-h-screen bg-cream-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-navy-200 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-100 text-teal-800">
                Engineering Benchmark
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-100 text-navy-700">
                Build Beyond AI Challenge
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-navy-950">
              Measurable Performance &amp; Evaluation
            </h1>
            <p className="text-sm text-navy-600 mt-1 max-w-2xl">
              Automated testing suite verifying deterministic eligibility rules, input rejection safety, sub-millisecond matching latency, and AI fallback resilience.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-semibold text-navy-700 hover:text-navy-900 bg-white border border-navy-200 rounded-lg shadow-sm hover:bg-navy-50"
            >
              ← Back to App
            </Link>
            <button
              onClick={runEvaluation}
              disabled={loading}
              className="btn-primary text-sm shadow-sm disabled:opacity-50"
            >
              {loading ? "Running Suite..." : "🔄 Re-run Test Suite"}
            </button>
          </div>
        </div>

        {/* Disclaimer Distinction Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-xs sm:text-sm flex items-start gap-3">
          <span className="text-xl">📊</span>
          <div>
            <p className="font-semibold text-blue-900">
              Benchmark Transparency Notice
            </p>
            <p className="text-blue-800 mt-0.5">
              These are <strong>actual measured results</strong> executed in real-time against deterministic test matrices and synthetic edge cases. They represent engine benchmark performance and must not be confused with live production user traffic metrics.
            </p>
          </div>
        </div>

        {loading && !data && (
          <div className="card p-12 text-center">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-navy-700 font-semibold">Running automated evaluation profiles...</p>
            <p className="text-xs text-navy-500 mt-1">
              Executing eligibility rule passes, boundary validations, and rejection checks.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm">
            <p className="font-bold">Error loading evaluation suite</p>
            <p className="text-xs mt-1">{error}</p>
            <button
              onClick={runEvaluation}
              className="mt-3 text-xs bg-rose-600 text-white px-3 py-1.5 rounded font-semibold"
            >
              Try Again
            </button>
          </div>
        )}

        {data && (
          <>
            {/* 4 Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card p-5 border-l-4 border-teal-500">
                <div className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                  Rule Test Pass Rate
                </div>
                <div className="text-3xl font-black text-navy-900 mt-2">
                  {data.eligibilityPassRate}%
                </div>
                <div className="text-xs text-teal-600 font-semibold mt-1 flex items-center gap-1">
                  <span>✓</span> {data.passedTests} of {data.totalTests} tests passed
                </div>
              </div>

              <div className="card p-5 border-l-4 border-blue-500">
                <div className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                  Engine Response Time
                </div>
                <div className="text-3xl font-black text-navy-900 mt-2">
                  {data.avgResponseTimeMs.toFixed(2)} ms
                </div>
                <div className="text-xs text-blue-600 font-semibold mt-1">
                  Deterministic sub-millisecond execution
                </div>
              </div>

              <div className="card p-5 border-l-4 border-indigo-500">
                <div className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                  Invalid Input Rejection
                </div>
                <div className="text-3xl font-black text-navy-900 mt-2">
                  {data.invalidInputRejectionRate}%
                </div>
                <div className="text-xs text-indigo-600 font-semibold mt-1">
                  Server-side boundary sanitization
                </div>
              </div>

              <div className="card p-5 border-l-4 border-emerald-500">
                <div className="text-xs font-semibold text-navy-500 uppercase tracking-wider">
                  Measured AI Fallback Rate
                </div>
                <div className="text-3xl font-black text-navy-900 mt-2">
                  {data.aiFallbackRate}%
                </div>
                <div className="text-xs text-emerald-600 font-semibold mt-1">
                  {data.aiFallbackRate === 0
                    ? "AI response succeeded without fallback"
                    : "Deterministic fallback used for the agent response"}
                </div>
              </div>
            </div>

            {/* Test Results Table */}
            <div className="card overflow-hidden">
              <div className="p-5 border-b border-navy-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-navy-900">
                    Evaluation Matrix Test Profiles
                  </h3>
                  <p className="text-xs text-navy-500 mt-0.5">
                    Profiles evaluated on: {new Date(data.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className="text-xs bg-navy-100 text-navy-800 px-3 py-1 rounded-full font-bold">
                  {data.totalTests} Profiles Executed
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-navy-50/80 text-navy-700 text-xs uppercase tracking-wider border-b border-navy-200">
                    <tr>
                      <th className="py-3 px-4">Profile &amp; Case</th>
                      <th className="py-3 px-4">Expected vs Actual</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Safety Check</th>
                      <th className="py-3 px-4 text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {data.results.map((r, i) => (
                      <tr key={i} className="hover:bg-navy-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-navy-900">{r.profileName}</div>
                          <div className="text-xs text-navy-500 mt-0.5">{r.description}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-navy-700">
                          {r.invalidInputRejected ? (
                            <span className="text-navy-500">N/A (Rejected at Gateway)</span>
                          ) : (
                            <div>
                              <div>Eligible: {r.eligibleCount} (exp: {r.expectedEligible})</div>
                              <div className="text-navy-500">
                                Potential: {r.potentialCount} | Not Eligible: {r.notEligibleCount}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-mono text-navy-600">
                          {r.responseTimeMs} ms
                        </td>
                        <td className="py-3.5 px-4 text-xs">
                          <span className="text-navy-700">{r.details}</span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                              r.passed
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {r.passed ? "PASS ✓" : "FAIL ✗"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Verification Architecture Deep-dive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h4 className="font-bold text-navy-900 text-sm mb-2">
                  🛡️ Deterministic Eligibility Invariant
                </h4>
                <p className="text-xs text-navy-600 leading-relaxed">
                  The matching core executes purely deterministic TypeScript checks (income ceilings, state domicile, caste/category quota, minimum academic marks, gender and year of study). The AI explanation agent is strictly downstream and has zero permission to override or alter deterministic eligibility decisions.
                </p>
              </div>

              <div className="card p-5">
                <h4 className="font-bold text-navy-900 text-sm mb-2">
                  ⚡ Autonomous Fallback Guarantee
                </h4>
                <p className="text-xs text-navy-600 leading-relaxed">
                  Even during network outages, Gemini rate limits, or missing API credentials, the matching engine continues functioning seamlessly. Synthesized checklists and actionable guidance automatically activate via rule-based heuristic fallback generators.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
