"use client";

import { useState } from "react";

type StudentInfo = {
  id: string;
  rollNumber: string;
  user: { name: string; email: string };
};

type ExtractionItem = {
  id: string;
  studentId: string | null;
  extractedRollNumber: string | null;
  extractedName: string | null;
  extractedMarks: number | string | null;
  rawText: string | null;
  confidenceScore: number | string | null;
  reviewStatus: "PENDING" | "ACCEPTED" | "CORRECTED" | "REJECTED";
  student: StudentInfo | null;
};

type OcrDocumentDetail = {
  id: string;
  originalFileName: string;
  status: "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED" | "REVIEWED" | "APPLIED";
  provider: string | null;
  confidenceScore: number | string | null;
  schedule: {
    exam: { title: string; code: string };
    subject: { name: string; code: string; maxMarks: number | string };
    class: { name: string; code: string };
  };
  extractions: ExtractionItem[];
};

type OcrReviewTableProps = {
  document: OcrDocumentDetail;
  onRefresh: () => void;
};

export function OcrReviewTable({ document, onRefresh }: OcrReviewTableProps) {
  const [extractions, setExtractions] = useState<ExtractionItem[]>(document.extractions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    extractedRollNumber: string;
    extractedName: string;
    extractedMarks: string;
  }>({ extractedRollNumber: "", extractedName: "", extractedMarks: "" });

  const [savingId, setSavingId] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function startEditing(ext: ExtractionItem) {
    setEditingId(ext.id);
    setEditForm({
      extractedRollNumber: ext.extractedRollNumber || "",
      extractedName: ext.extractedName || "",
      extractedMarks: ext.extractedMarks !== null ? String(ext.extractedMarks) : "",
    });
  }

  async function updateStatus(id: string, reviewStatus: ExtractionItem["reviewStatus"], overrides?: Partial<typeof editForm>) {
    setSavingId(id);
    setMessage(null);

    const ext = extractions.find((e) => e.id === id);
    if (!ext) return;

    const payload = {
      reviewStatus,
      extractedRollNumber: overrides?.extractedRollNumber ?? (editingId === id ? editForm.extractedRollNumber : ext.extractedRollNumber),
      extractedName: overrides?.extractedName ?? (editingId === id ? editForm.extractedName : ext.extractedName),
      extractedMarks: overrides?.extractedMarks ?? (editingId === id ? editForm.extractedMarks : ext.extractedMarks),
    };

    try {
      const res = await fetch(`/api/admin/ocr/extractions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update record.");
      }

      setExtractions((prev) =>
        prev.map((item) => (item.id === id ? data.item : item))
      );
      setEditingId(null);
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Error updating extraction." });
    } finally {
      setSavingId(null);
    }
  }

  async function handleApplyToMarks() {
    const validCount = extractions.filter(
      (e) => e.reviewStatus === "ACCEPTED" || e.reviewStatus === "CORRECTED"
    ).length;

    if (validCount === 0) {
      setMessage({
        type: "error",
        text: "Please accept or correct at least one extracted record before applying to marks ledger.",
      });
      return;
    }

    setApplying(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/ocr/documents/${document.id}/apply`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to apply marks.");
      }

      setMessage({
        type: "success",
        text: `Successfully applied ${data.appliedCount} student mark(s) to the marks ledger!`,
      });
      onRefresh();
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error applying extractions.",
      });
    } finally {
      setApplying(false);
    }
  }

  function getConfidenceBadge(score: number | string | null) {
    const num = score ? Number(score) : 0;
    let color = "bg-red-100 text-red-800 border-red-200";
    if (num >= 85) color = "bg-emerald-100 text-emerald-800 border-emerald-200";
    else if (num >= 60) color = "bg-amber-100 text-amber-800 border-amber-200";

    return (
      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold border ${color}`}>
        {num}%
      </span>
    );
  }

  function getReviewStatusBadge(status: ExtractionItem["reviewStatus"]) {
    switch (status) {
      case "ACCEPTED":
        return <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Accepted</span>;
      case "CORRECTED":
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Corrected</span>;
      case "REJECTED":
        return <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Pending Review</span>;
    }
  }

  const isApplied = document.status === "APPLIED";

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-6 py-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{document.originalFileName}</h3>
            {isApplied && (
              <span className="rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                APPLIED TO MARKS LEDGER
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {document.schedule.exam.title} • {document.schedule.class.name} • Subject:{" "}
            <span className="font-medium text-slate-700">{document.schedule.subject.name}</span> (Max:{" "}
            {String(document.schedule.subject.maxMarks)})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleApplyToMarks}
            disabled={applying || isApplied}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {applying ? (
              <span>Applying...</span>
            ) : isApplied ? (
              <span>Marks Applied</span>
            ) : (
              <span>Apply to Marks Ledger</span>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`m-4 rounded-lg p-3.5 text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Verification Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Extracted Roll No.</th>
              <th className="px-6 py-3 font-semibold">Extracted Name</th>
              <th className="px-6 py-3 font-semibold">Matched Student</th>
              <th className="px-6 py-3 font-semibold">Extracted Marks</th>
              <th className="px-6 py-3 font-semibold">Confidence</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 text-right font-semibold">Verification Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {extractions.map((ext) => {
              const isEditing = editingId === ext.id;
              const isSaving = savingId === ext.id;

              return (
                <tr key={ext.id} className="transition hover:bg-slate-50/60">
                  {/* Roll Number */}
                  <td className="px-6 py-4 font-mono font-medium text-slate-900">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.extractedRollNumber}
                        onChange={(e) => setEditForm({ ...editForm, extractedRollNumber: e.target.value })}
                        className="w-32 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    ) : (
                      ext.extractedRollNumber || <span className="text-red-400 italic">Unrecognized</span>
                    )}
                  </td>

                  {/* Name */}
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.extractedName}
                        onChange={(e) => setEditForm({ ...editForm, extractedName: e.target.value })}
                        className="w-40 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    ) : (
                      ext.extractedName || <span className="text-slate-400 italic">N/A</span>
                    )}
                  </td>

                  {/* Matched Student */}
                  <td className="px-6 py-4">
                    {ext.student ? (
                      <div>
                        <div className="font-medium text-slate-900">{ext.student.user.name}</div>
                        <div className="text-xs text-slate-500 font-mono">Roll: {ext.student.rollNumber}</div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded bg-amber-50 px-2 py-0.5 text-xs text-amber-700 border border-amber-200">
                        No match found
                      </span>
                    )}
                  </td>

                  {/* Marks */}
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.5"
                        value={editForm.extractedMarks}
                        onChange={(e) => setEditForm({ ...editForm, extractedMarks: e.target.value })}
                        className="w-24 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
                      />
                    ) : ext.extractedMarks !== null ? (
                      <span>{String(ext.extractedMarks)}</span>
                    ) : (
                      <span className="text-red-400 italic">Missing</span>
                    )}
                  </td>

                  {/* Confidence */}
                  <td className="px-6 py-4">{getConfidenceBadge(ext.confidenceScore)}</td>

                  {/* Review Status */}
                  <td className="px-6 py-4">{getReviewStatusBadge(ext.reviewStatus)}</td>

                  {/* Actions */}
                  <td className="px-6 py-4 text-right">
                    {isSaving ? (
                      <span className="text-xs text-slate-400">Saving...</span>
                    ) : isEditing ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(ext.id, "CORRECTED")}
                          className="rounded bg-blue-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          Save Correction
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="rounded border border-slate-300 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateStatus(ext.id, "ACCEPTED")}
                          disabled={ext.reviewStatus === "ACCEPTED" || isApplied}
                          className="rounded border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => startEditing(ext)}
                          disabled={isApplied}
                          className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => updateStatus(ext.id, "REJECTED")}
                          disabled={ext.reviewStatus === "REJECTED" || isApplied}
                          className="rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
