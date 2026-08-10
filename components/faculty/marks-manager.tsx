"use client";

import { FormEvent, useState } from "react";

type Option = { id: string; label?: string; name?: string; rollNumber?: string; classCode?: string; maxMarks?: number; passingMarks?: number };
type MarkRow = {
  id: string;
  examId: string;
  studentId: string;
  subjectId: string;
  exam: string;
  subject: string;
  student: string;
  rollNumber: string;
  classCode: string;
  marksObtained: number;
  maxMarks: number;
  passingMarks: number;
  grade: string;
  status: string;
};

type MarksManagerProps = {
  exams: Option[];
  subjects: Option[];
  students: Option[];
  marks: MarkRow[];
};

export function MarksManager(props: MarksManagerProps) {
  const [marks, setMarks] = useState(props.marks);
  const [editing, setEditing] = useState<MarkRow | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState(props.subjects[0]?.id ?? "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSubject = props.subjects.find((subject) => subject.id === selectedSubjectId);

  async function refresh() {
    const response = await fetch("/api/faculty-portal/marks");
    const data = await response.json();
    setMarks(data.marks ?? []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const payload = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(
      editing ? `/api/faculty-portal/marks/${editing.id}` : "/api/faculty-portal/marks",
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const fieldErrors = data?.issues?.fieldErrors;
      const firstValidationError = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : null;
      setError(String(firstValidationError ?? data?.error ?? "Unable to save marks."));
      return;
    }

    setEditing(null);
    await refresh();
    setMessage("Marks saved.");
    event.currentTarget.reset();
  }

  async function approve(id: string) {
    setError("");
    setMessage("");
    const response = await fetch(`/api/faculty-portal/marks/${id}/approve`, { method: "POST" });
    if (!response.ok) {
      setError("Unable to approve marks.");
      return;
    }
    await refresh();
    setMessage("Marks approved.");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
      <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">{editing ? "Edit marks" : "Upload marks"}</h2>
        <div className="mt-4 space-y-4">
          <select name="examId" required defaultValue={editing?.examId ?? ""} className="h-11 w-full rounded-md border px-3">
            <option value="">Exam</option>
            {props.exams.map((exam) => <option key={exam.id} value={exam.id}>{exam.label}</option>)}
          </select>
          <select name="studentId" required defaultValue={editing?.studentId ?? ""} className="h-11 w-full rounded-md border px-3">
            <option value="">Student</option>
            {props.students.map((student) => (
              <option key={student.id} value={student.id}>{student.rollNumber} - {student.name} ({student.classCode})</option>
            ))}
          </select>
          <select
            name="subjectId"
            required
            value={editing?.subjectId ?? selectedSubjectId}
            onChange={(event) => {
              setSelectedSubjectId(event.target.value);
              if (editing) {
                setEditing({ ...editing, subjectId: event.target.value });
              }
            }}
            className="h-11 w-full rounded-md border px-3"
          >
            <option value="">Subject</option>
            {props.subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.label}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-3">
            <input name="marksObtained" type="number" step="0.01" required placeholder="Marks" defaultValue={editing?.marksObtained} className="h-11 rounded-md border px-3" />
            <input name="maxMarks" type="number" step="0.01" required placeholder="Max" defaultValue={editing?.maxMarks ?? selectedSubject?.maxMarks ?? 100} className="h-11 rounded-md border px-3" />
            <input name="passingMarks" type="number" step="0.01" required placeholder="Pass" defaultValue={editing?.passingMarks ?? selectedSubject?.passingMarks ?? 40} className="h-11 rounded-md border px-3" />
          </div>
          <input name="grade" placeholder="Grade" defaultValue={editing?.grade} className="h-11 w-full rounded-md border px-3" />
          <select name="status" required defaultValue={editing?.status ?? "DRAFT"} className="h-11 w-full rounded-md border px-3">
            <option value="DRAFT">DRAFT</option>
            <option value="SUBMITTED">SUBMITTED</option>
            <option value="VERIFIED">VERIFIED</option>
          </select>
        </div>
        {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
        {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}
        <div className="mt-4 flex gap-3">
          <button className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">
            {editing ? "Update marks" : "Save marks"}
          </button>
          {editing ? <button type="button" onClick={() => setEditing(null)} className="rounded-md border px-4 py-2 text-sm">Cancel</button> : null}
        </div>
      </form>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold">Marks entries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Marks</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks.map((mark) => (
                <tr key={mark.id}>
                  <td className="px-5 py-3">{mark.rollNumber} - {mark.student}</td>
                  <td className="px-5 py-3">{mark.exam}</td>
                  <td className="px-5 py-3">{mark.subject}</td>
                  <td className="px-5 py-3">{mark.marksObtained}/{mark.maxMarks}</td>
                  <td className="px-5 py-3">{mark.grade || "-"}</td>
                  <td className="px-5 py-3">{mark.status}</td>
                  <td className="whitespace-nowrap px-5 py-3">
                    <button type="button" onClick={() => setEditing(mark)} className="mr-3 font-medium text-emerald-700">Edit</button>
                    {mark.status === "SUBMITTED" ? (
                      <button type="button" onClick={() => approve(mark.id)} className="font-medium text-blue-700">Approve</button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
