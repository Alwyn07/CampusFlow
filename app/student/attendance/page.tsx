import { getCurrentStudent, getStudentTimetable } from "@/lib/student-data";

export const dynamic = "force-dynamic";

export default async function StudentAttendancePage() {
  const student = await getCurrentStudent();
  const timetable = await getStudentTimetable(student.id, student.classId);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Attendance</p>
      <h1 className="mt-2 text-3xl font-semibold">Exam attendance</h1>
      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Attendance</th>
                <th className="px-5 py-3">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetable.map((entry) => {
                const attendance = entry.attendance[0];
                return (
                  <tr key={entry.id}>
                    <td className="px-5 py-3">{entry.exam.code}</td>
                    <td className="px-5 py-3">{entry.subject.code}</td>
                    <td className="px-5 py-3">{entry.scheduleDate.toLocaleDateString()}</td>
                    <td className="px-5 py-3">{attendance?.status ?? "Not marked"}</td>
                    <td className="px-5 py-3">{attendance?.remarks ?? "-"}</td>
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
