"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadTrackedApps, updateTrackedApp, removeTrackedApp } from "@/lib/storage";
import { scholarshipDataset } from "@/lib/scholarships";
import type { TrackedApplication, ApplicationStatus } from "@/lib/types";

const statusOptions: { value: ApplicationStatus; label: string; color: string }[] = [
  { value: "saved", label: "Saved", color: "bg-navy-100 text-navy-700" },
  { value: "documents_gathering", label: "Gathering Documents", color: "bg-amber-100 text-amber-800" },
  { value: "application_ready", label: "Ready to Apply", color: "bg-teal-100 text-teal-800" },
  { value: "applied", label: "Applied", color: "bg-blue-100 text-blue-800" },
  { value: "under_review", label: "Under Review", color: "bg-purple-100 text-purple-800" },
  { value: "accepted", label: "Accepted 🎉", color: "bg-emerald-100 text-emerald-800" },
  { value: "rejected", label: "Not Awarded", color: "bg-rose-100 text-rose-800" },
];

export default function TrackerPage() {
  const [apps, setApps] = useState<TrackedApplication[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  useEffect(() => {
    setApps(loadTrackedApps());
  }, []);

  const handleStatusChange = (scholarshipId: string, newStatus: ApplicationStatus) => {
    const updated = updateTrackedApp(scholarshipId, {
      status: newStatus,
      appliedDate: newStatus === "applied" ? new Date().toISOString() : undefined,
    });
    setApps(updated);
  };

  const handleSaveNote = (scholarshipId: string) => {
    const updated = updateTrackedApp(scholarshipId, { notes: noteText });
    setApps(updated);
    setEditingId(null);
  };

  const handleToggleDocument = (scholarshipId: string, doc: string, isReady: boolean) => {
    const app = apps.find((a) => a.scholarshipId === scholarshipId);
    if (!app) return;

    let ready = [...(app.documentsReady || [])];
    let pending = [...(app.documentsPending || [])];

    if (isReady) {
      ready = ready.filter((d) => d !== doc);
      if (!pending.includes(doc)) pending.push(doc);
    } else {
      pending = pending.filter((d) => d !== doc);
      if (!ready.includes(doc)) ready.push(doc);
    }

    const updated = updateTrackedApp(scholarshipId, {
      documentsReady: ready,
      documentsPending: pending,
    });
    setApps(updated);
  };

  const handleRemove = (scholarshipId: string) => {
    if (confirm("Remove this scholarship from your tracker?")) {
      const updated = removeTrackedApp(scholarshipId);
      setApps(updated);
    }
  };

  const filteredApps = apps.filter((app) => {
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    const matchesSearch = app.scholarshipName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950">
            Application Tracker
          </h1>
          <p className="text-sm text-navy-600 mt-1">
            Organize documents, track preparation, and log your progress.
          </p>
        </div>
        <Link
          href="/dashboard/matches"
          className="btn-primary self-start sm:self-auto text-sm"
        >
          + Find More Scholarships
        </Link>
      </div>

      {/* Transparency / Non-government disclaimer banner */}
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
        <span className="text-lg">ℹ️</span>
        <div>
          <p className="font-semibold">Independent Preparation Workspace</p>
          <p className="mt-0.5 text-amber-800">
            Updating your status to &ldquo;Applied&rdquo; in this tracker does <strong>NOT</strong> submit your application to the official government or scholarship portal. You must apply directly on the verified official portal URL provided.
          </p>
        </div>
      </div>

      {/* Filters and search */}
      <div className="card p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search saved applications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-navy-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterStatus === "all"
                ? "bg-navy-900 text-white"
                : "bg-navy-100 text-navy-700 hover:bg-navy-200"
            }`}
          >
            All ({apps.length})
          </button>
          {statusOptions.map((opt) => {
            const count = apps.filter((a) => a.status === opt.value).length;
            return (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterStatus === opt.value
                    ? "bg-teal-600 text-white"
                    : "bg-navy-100 text-navy-700 hover:bg-navy-200"
                }`}
              >
                {opt.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Application list */}
      {filteredApps.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal-50 flex items-center justify-center text-3xl">
            📋
          </div>
          <h3 className="text-lg font-bold text-navy-900">No applications found</h3>
          <p className="text-sm text-navy-600 max-w-md mx-auto mt-1 mb-6">
            {apps.length === 0
              ? "You haven't saved any scholarships yet. Explore matched scholarships and click 'Track Application' to start."
              : "No applications match the current filter."}
          </p>
          <Link href="/dashboard/matches" className="btn-primary text-sm inline-block">
            Browse Matched Scholarships
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApps.map((app) => {
            const scholarship = scholarshipDataset.find((s) => s.id === app.scholarshipId);
            const totalDocs =
              (app.documentsReady?.length || 0) + (app.documentsPending?.length || 0);
            const readyDocsCount = app.documentsReady?.length || 0;
            const docPercent = totalDocs > 0 ? Math.round((readyDocsCount / totalDocs) * 100) : 0;

            return (
              <div key={app.scholarshipId} className="card p-5 sm:p-6 transition-all hover:shadow-md">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          statusOptions.find((s) => s.value === app.status)?.color ||
                          "bg-navy-100 text-navy-700"
                        }`}
                      >
                        {statusOptions.find((s) => s.value === app.status)?.label || app.status}
                      </span>
                      {scholarship && (
                        <span className="text-xs bg-navy-100 text-navy-700 px-2.5 py-0.5 rounded-full font-medium">
                          {scholarship.provider}
                        </span>
                      )}
                      {scholarship?.verificationStatus === "demo_data" && (
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                          DEMO DATA
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-navy-900">{app.scholarshipName}</h3>

                    {scholarship && (
                      <p className="text-xs text-navy-600 mt-1 line-clamp-2">
                        {scholarship.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-navy-500">
                      {scholarship && (
                        <div>
                          <strong>Award:</strong> {scholarship.amount}
                        </div>
                      )}
                      {scholarship?.applicationDeadline && (
                        <div>
                          <strong>Deadline:</strong> {scholarship.applicationDeadline}
                        </div>
                      )}
                      <div>
                        <strong>Updated:</strong>{" "}
                        {new Date(app.lastUpdated).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Quick Status Selector */}
                  <div className="flex flex-wrap lg:flex-col items-start lg:items-end gap-2">
                    <select
                      value={app.status}
                      onChange={(e) =>
                        handleStatusChange(
                          app.scholarshipId,
                          e.target.value as ApplicationStatus
                        )
                      }
                      className="px-3 py-1.5 border border-navy-300 rounded-lg text-xs font-semibold bg-white text-navy-800 focus:ring-2 focus:ring-teal-500"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          Status: {opt.label}
                        </option>
                      ))}
                    </select>

                    {scholarship?.sourceUrl && (
                      <a
                        href={scholarship.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-teal-600 hover:text-teal-700 font-semibold inline-flex items-center gap-1"
                      >
                        Official Portal ↗
                      </a>
                    )}

                    <button
                      onClick={() => handleRemove(app.scholarshipId)}
                      className="text-xs text-rose-500 hover:text-rose-700 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Document Readiness Progress */}
                {totalDocs > 0 && (
                  <div className="mt-4 pt-4 border-t border-navy-100">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-navy-800">
                        Document Checklist Readiness ({readyDocsCount}/{totalDocs})
                      </span>
                      <span className="font-bold text-teal-600">{docPercent}%</span>
                    </div>
                    <div className="w-full bg-navy-100 h-2 rounded-full overflow-hidden mb-3">
                      <div
                        className="bg-teal-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${docPercent}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {app.documentsReady?.map((doc) => (
                        <label
                          key={doc}
                          className="flex items-center gap-2 text-xs bg-teal-50 text-teal-900 p-2 rounded-lg cursor-pointer border border-teal-200"
                        >
                          <input
                            type="checkbox"
                            checked={true}
                            onChange={() => handleToggleDocument(app.scholarshipId, doc, true)}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="truncate">{doc} (Ready)</span>
                        </label>
                      ))}
                      {app.documentsPending?.map((doc) => (
                        <label
                          key={doc}
                          className="flex items-center gap-2 text-xs bg-navy-50 text-navy-700 p-2 rounded-lg cursor-pointer border border-navy-200"
                        >
                          <input
                            type="checkbox"
                            checked={false}
                            onChange={() => handleToggleDocument(app.scholarshipId, doc, false)}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span className="truncate">{doc} (Pending)</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes section */}
                <div className="mt-4 pt-3 border-t border-navy-100 text-xs">
                  {editingId === app.scholarshipId ? (
                    <div className="space-y-2">
                      <textarea
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Add personal notes, reference numbers, or portal login reminders..."
                        rows={3}
                        className="w-full p-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-xs text-navy-800"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1 text-navy-600 hover:text-navy-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveNote(app.scholarshipId)}
                          className="btn-primary text-xs px-3 py-1"
                        >
                          Save Note
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-navy-700">
                        <strong>My Notes:</strong>{" "}
                        <span className="text-navy-600">
                          {app.notes || "No notes added yet."}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setEditingId(app.scholarshipId);
                          setNoteText(app.notes || "");
                        }}
                        className="text-teal-600 hover:text-teal-700 font-semibold whitespace-nowrap"
                      >
                        {app.notes ? "Edit Note" : "+ Add Note"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
