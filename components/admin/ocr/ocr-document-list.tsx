"use client";

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

type OcrDocumentListProps = {
  documents: OcrDocItem[];
  selectedDocumentId: string | null;
  onSelectDocument: (id: string) => void;
};

export function OcrDocumentList({ documents, selectedDocumentId, onSelectDocument }: OcrDocumentListProps) {
  function getStatusBadge(status: OcrDocItem["status"]) {
    switch (status) {
      case "PROCESSED":
        return <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">Processed</span>;
      case "APPLIED":
        return <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200">Applied</span>;
      case "REVIEWED":
        return <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700 border border-purple-200">Reviewed</span>;
      case "PROCESSING":
        return <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 border border-amber-200 animate-pulse">Processing</span>;
      case "FAILED":
        return <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 border border-red-200">Failed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Uploaded</span>;
    }
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500 text-sm">No OCR mark sheet documents uploaded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-4">
        <h3 className="text-base font-semibold text-slate-900">Uploaded Mark Sheets & Batch History</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-semibold">Document Name</th>
              <th className="px-6 py-3 font-semibold">Exam / Class</th>
              <th className="px-6 py-3 font-semibold">Subject</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold">Confidence</th>
              <th className="px-6 py-3 font-semibold">Rows</th>
              <th className="px-6 py-3 font-semibold">Uploaded</th>
              <th className="px-6 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((doc) => {
              const isSelected = doc.id === selectedDocumentId;
              const conf = doc.confidenceScore ? Number(doc.confidenceScore) : 0;
              return (
                <tr
                  key={doc.id}
                  className={`transition hover:bg-slate-50 ${isSelected ? "bg-emerald-50/40" : ""}`}
                >
                  <td className="px-6 py-4 font-medium text-slate-900">
                    <div className="truncate max-w-[200px]" title={doc.originalFileName}>
                      {doc.originalFileName}
                    </div>
                    {doc.provider && (
                      <span className="text-[11px] text-slate-400 font-mono block">
                        {doc.provider}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{doc.schedule.exam.title}</div>
                    <div className="text-xs text-slate-500">{doc.schedule.class.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-900 font-medium">{doc.schedule.subject.code}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[150px]">
                      {doc.schedule.subject.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(doc.status)}</td>
                  <td className="px-6 py-4">
                    {doc.status === "FAILED" ? (
                      <span className="text-xs text-red-600 font-medium">Error</span>
                    ) : (
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded ${
                          conf >= 85
                            ? "bg-emerald-100 text-emerald-800"
                            : conf >= 60
                            ? "bg-amber-100 text-amber-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {conf}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">
                    {doc._count?.extractions ?? 0}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onSelectDocument(doc.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {isSelected ? "Viewing" : "Review Extractions"}
                    </button>
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
