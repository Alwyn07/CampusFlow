"use client";

import { useState } from "react";

type ScheduleOption = {
  id: string;
  examTitle: string;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  scheduleDate: string;
};

type OcrUploadFormProps = {
  schedules: ScheduleOption[];
  onUploadSuccess: (documentId: string) => void;
};

export function OcrUploadForm({ schedules, onUploadSuccess }: OcrUploadFormProps) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(schedules[0]?.id || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedScheduleId) {
      setError("Please select an exam schedule.");
      return;
    }
    if (!file) {
      setError("Please select a mark sheet file to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scheduleId", selectedScheduleId);

      const res = await fetch("/api/admin/ocr/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      setFile(null);
      onUploadSuccess(data.document.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setUploading(false);
    }
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Upload Mark Sheet / Answer Sheet</h3>
        <p className="text-sm text-slate-500">
          Upload scanned mark sheets (PNG, JPG, PDF) to automatically extract student marks via AI OCR.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3.5 text-sm text-red-700 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Select Exam Schedule</label>
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            disabled={uploading}
            className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
          >
            {schedules.length === 0 ? (
              <option value="">No exam schedules available</option>
            ) : (
              schedules.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.examTitle} — {s.classCode} ({s.subjectCode}: {s.subjectName}) [{new Date(s.scheduleDate).toLocaleDateString()}]
                </option>
              ))
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Document File</label>
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition ${
              dragActive
                ? "border-emerald-500 bg-emerald-50/50"
                : file
                ? "border-emerald-300 bg-slate-50"
                : "border-slate-300 hover:border-slate-400 bg-slate-50/50"
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-xs">
                  {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-4 text-xs text-red-600 hover:underline font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div className="text-center">
                <svg
                  className="mx-auto h-10 w-10 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                  />
                </svg>
                <p className="mt-2 text-sm text-slate-600">
                  <label className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-700">
                    <span>Click to browse</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf,.csv,.txt"
                      className="hidden"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>{" "}
                  or drag and drop your mark sheet scan
                </p>
                <p className="mt-1 text-xs text-slate-500">PNG, JPG, PDF, or text scan formats up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={uploading || !file || !selectedScheduleId}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span>Processing Document with AI...</span>
              </>
            ) : (
              <span>Upload & Scan Document</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
