import Link from "next/link";

import { getCurrentStudent, getStudentMarks, summarizeGpa } from "@/lib/student-data";

export const dynamic = "force-dynamic";

export default async function StudentResultsPage() {
  const student = await getCurrentStudent();
  const marks = await getStudentMarks(student.id);
  const summary = summarizeGpa(marks);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Results</p>
      <h1 className="mt-2 text-3xl font-semibold">Semester GPA and CGPA</h1>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">CGPA</p>
          <p className="mt-3 text-3xl font-semibold">{summary.cgpa}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Result exams</p>
          <p className="mt-3 text-3xl font-semibold">{summary.semesters.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Subjects</p>
          <p className="mt-3 text-3xl font-semibold">{marks.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Class</p>
          <p className="mt-3 text-2xl font-semibold">{student.class.code}</p>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold">Semester summary</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {summary.semesters.map((semester) => (
            <div key={semester.examId} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{semester.examCode} - {semester.examTitle}</p>
                <p className="mt-1 text-sm text-slate-600">
                  GPA {semester.gpa} · {semester.percentage}% · {semester.totalMarks}/{semester.maxMarks}
                </p>
              </div>
              <Link
                href={`/api/student-portal/marksheet/${semester.examId}`}
                className="rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white"
              >
                Download marksheet PDF
              </Link>
            </div>
          ))}
          {summary.semesters.length === 0 ? <p className="p-5 text-sm text-slate-500">No published results yet.</p> : null}
        </div>
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-base font-semibold">Subject marks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Marks</th>
                <th className="px-5 py-3">%</th>
                <th className="px-5 py-3">Grade</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marks.map((mark) => {
                const percentage = Number(mark.maxMarks) > 0
                  ? ((Number(mark.marksObtained) / Number(mark.maxMarks)) * 100).toFixed(2)
                  : "0";
                return (
                  <tr key={mark.id}>
                    <td className="px-5 py-3">{mark.exam.code}</td>
                    <td className="px-5 py-3">{mark.subject.code} - {mark.subject.name}</td>
                    <td className="px-5 py-3">{Number(mark.marksObtained)}/{Number(mark.maxMarks)}</td>
                    <td className="px-5 py-3">{percentage}</td>
                    <td className="px-5 py-3">{mark.grade ?? "-"}</td>
                    <td className="px-5 py-3">{mark.status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
