"use client";

import { useEffect, useState, useCallback } from "react";
import { OcrUploadForm } from "./ocr-upload-form";
import { OcrDocumentList } from "./ocr-document-list";
import { OcrReviewTable } from "./ocr-review-table";

type ScheduleOption = {
  id: string;
  examTitle: string;
  classCode: string;
  subjectCode: string;
  subjectName: string;
  scheduleDate: string;
};

type OcrDocItem = {
  id: string;
  originalFileName: string;
  mimeType: string;
  status: "UPLOADED" | "PROCESSING" | "PROCESSED" | "FAILED" | "REVIEWED" | "APPLIED";
  provider: string | null;
  confidenceScore: number | string | null;
  errorMessage: string | null;
  createdAt: string;
  schedule: {
    exam: { title: string; code: string };
    subject: { name: string; code: string };
    class: { name: string; code: string };
  };
  uploadedBy: { name: string; email: string } | null;
  _count?: { extractions: number };
};

type DocumentDetail = {
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
  extractions: Array<{
    id: string;
    studentId: string | null;
    extractedRollNumber: string | null;
    extractedName: string | null;
    extractedMarks: number | string | null;
    rawText: string | null;
    confidenceScore: number | string | null;
    reviewStatus: "PENDING" | "ACCEPTED" | "CORRECTED" | "REJECTED";
    student: {
      id: string;
      rollNumber: string;
      user: { name: string; email: string };
    } | null;
  }>;
};

type OcrWorkspaceProps = {
  initialSchedules: ScheduleOption[];
  initialDocuments: OcrDocItem[];
};

export function OcrWorkspace({ initialSchedules, initialDocuments }: OcrWorkspaceProps) {
  const [documents, setDocuments] = useState<OcrDocItem[]>(initialDocuments);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
    initialDocuments[0]?.id || null
  );
  const [selectedDocDetail, setSelectedDocDetail] = useState<DocumentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const refreshDocuments = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/ocr/documents");
      const data = await res.json();
      if (res.ok) {
        setDocuments(data.items || []);
      }
    } catch (err) {
      console.error("Failed to refresh OCR documents:", err);
    }
  }, []);

  const loadDocumentDetail = useCallback(async (docId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/ocr/documents/${docId}`);
      const data = await res.json();
      if (res.ok) {
        setSelectedDocDetail(data.item);
      }
    } catch (err) {
      console.error("Failed to load document detail:", err);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    let isSubscribed = true;
    if (selectedDocumentId) {
      fetch(`/api/admin/ocr/documents/${selectedDocumentId}`)
        .then((res) => res.json())
        .then((data) => {
          if (isSubscribed && data.item) {
            setSelectedDocDetail(data.item);
          }
        })
        .catch((err) => console.error("Failed to load doc detail:", err));
    }
    return () => {
      isSubscribed = false;
    };
  }, [selectedDocumentId]);

  function handleUploadSuccess(newDocId: string) {
    refreshDocuments();
    setSelectedDocumentId(newDocId);
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <OcrUploadForm
        schedules={initialSchedules}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Review Workspace section if a document is selected */}
      {selectedDocumentId && (
        <div>
          {loadingDetail ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm text-slate-500">
              Loading extractions workspace...
            </div>
          ) : selectedDocDetail ? (
            <OcrReviewTable
              document={selectedDocDetail}
              onRefresh={() => {
                refreshDocuments();
                loadDocumentDetail(selectedDocumentId);
              }}
            />
          ) : null}
        </div>
      )}

      {/* Document History Table */}
      <OcrDocumentList
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={(id) => setSelectedDocumentId(id)}
      />
    </div>
  );
}
