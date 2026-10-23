"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  loadProfile,
  loadTrackedApps,
  loadActivity,
  calculateProfileCompletion,
} from "@/lib/storage";
import { runEligibilityEngine } from "@/lib/engine";
import type { StudentProfile, DashboardStats, TrackedApplication, EligibilityResult } from "@/lib/types";

export default function DashboardPage() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<{ message: string; timestamp: string }[]>([]);
  const [topMatches, setTopMatches] = useState<EligibilityResult[]>([]);
  const [trackedApps, setTrackedApps] = useState<TrackedApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prof = loadProfile();
    setProfile(prof);

    const apps = loadTrackedApps();
    setTrackedApps(apps);

    const activity = loadActivity();
    setRecentActivity(activity.slice(0, 5));

    if (prof) {
      const results = runEligibilityEngine(prof);
      const eligible = results.filter((r) => r.status === "eligible");
      const potential = results.filter((r) => r.status === "potential_match");
      const notEligible = results.filter((r) => r.status === "not_eligible");

      setTopMatches(results.filter((r) => r.status !== "not_eligible").slice(0, 3));

      const docsReady = apps.reduce((acc, a) => acc + a.documentsReady.length, 0);
      const docsPending = apps.reduce((acc, a) => acc + a.documentsPending.length, 0);

      setStats({
        profileCompletion: calculateProfileCompletion(prof),
        totalMatches: results.length,
        eligibleCount: eligible.length,
        potentialCount: potential.length,
        notEligibleCount: notEligible.length,
        trackedApplications: apps.length,
        documentsReady: docsReady,
        documentsPending: docsPending,
      });
    } else {
      setStats({
        profileCompletion: 0,
        totalMatches: 0,
        eligibleCount: 0,
        potentialCount: 0,
        notEligibleCount: 0,
        trackedApplications: 0,
        documentsReady: 0,
        documentsPending: 0,
      });
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="skeleton h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const completion = stats?.profileCompletion ?? 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
            {profile ? `Welcome back, ${profile.name.split(" ")[0]}` : "Welcome to ScholarshipSaathi"}
          </h1>
          <p className="text-navy-500 mt-1">
            {profile
              ? "Here's your scholarship overview"
              : "Complete your profile to discover matching scholarships"}
          </p>
        </div>
        {!profile && (
          <Link href="/dashboard/profile" className="btn-primary">
            Complete Profile →
          </Link>
        )}
      </div>

      {/* Profile Completion Bar */}
      {completion < 100 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-navy-700">Profile Completion</span>
            <span className="text-sm font-bold text-teal-600">{completion}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${completion}%` }} />
          </div>
          <p className="text-xs text-navy-400 mt-2">
            {completion === 0
              ? "Start by filling out your profile to get scholarship matches"
              : "Complete all fields for the most accurate matches"}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card border-l-4 border-l-teal-400">
          <div className="stat-value text-teal-600">{stats?.eligibleCount ?? 0}</div>
          <div className="stat-label">Eligible</div>
        </div>
        <div className="stat-card border-l-4 border-l-amber-400">
          <div className="stat-value text-amber-600">{stats?.potentialCount ?? 0}</div>
          <div className="stat-label">Potential Matches</div>
        </div>
        <div className="stat-card border-l-4 border-l-navy-400">
          <div className="stat-value">{stats?.trackedApplications ?? 0}</div>
          <div className="stat-label">Tracked</div>
        </div>
        <div className="stat-card border-l-4 border-l-purple-400">
          <div className="stat-value text-purple-600">{stats?.totalMatches ?? 0}</div>
          <div className="stat-label">Total Evaluated</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Matches */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-navy-900">Top Matches</h2>
            <Link href="/dashboard/matches" className="text-sm text-teal-600 font-medium hover:text-teal-700">
              View All →
            </Link>
          </div>

          {topMatches.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-navy-500 font-medium">No matches yet</p>
              <p className="text-sm text-navy-400 mt-1">
                {profile ? "Try updating your profile for better results" : "Complete your profile to see matches"}
              </p>
              <Link href={profile ? "/dashboard/matches" : "/dashboard/profile"} className="btn-primary mt-4 text-sm py-2 px-4">
                {profile ? "View All Scholarships" : "Complete Profile"}
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topMatches.map((match) => (
                <div
                  key={match.scholarshipId}
                  className="p-4 rounded-xl border border-navy-100 hover:border-teal-200 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-navy-900 truncate">
                          {match.scholarship.name}
                        </h3>
                        <span
                          className={
                            match.status === "eligible" ? "badge-eligible" : "badge-potential"
                          }
                        >
                          {match.status === "eligible" ? "Eligible" : "Potential"}
                        </span>
                        <span className="badge-demo">Demo</span>
                      </div>
                      <p className="text-sm text-navy-500 mt-1">
                        {match.scholarship.amount} • {match.scholarship.provider}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-bold text-navy-900">{match.confidence}%</div>
                      <div className="text-xs text-navy-400">match</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy-50 transition-colors"
              >
                <span className="text-lg">👤</span>
                <span className="text-sm font-medium text-navy-700">
                  {profile ? "Update Profile" : "Create Profile"}
                </span>
              </Link>
              <Link
                href="/dashboard/matches"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy-50 transition-colors"
              >
                <span className="text-lg">🎯</span>
                <span className="text-sm font-medium text-navy-700">Run AI Analysis</span>
              </Link>
              <Link
                href="/dashboard/tracker"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy-50 transition-colors"
              >
                <span className="text-lg">📋</span>
                <span className="text-sm font-medium text-navy-700">
                  Application Tracker ({trackedApps.length})
                </span>
              </Link>
              <Link
                href="/evaluate"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-navy-50 transition-colors"
              >
                <span className="text-lg">🧪</span>
                <span className="text-sm font-medium text-navy-700">Run Tests</span>
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Recent Activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-navy-400 text-center py-4">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-2 h-2 rounded-full bg-teal-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-navy-700">{entry.message}</p>
                      <p className="text-xs text-navy-400">
                        {new Date(entry.timestamp).toLocaleString("en-IN", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
