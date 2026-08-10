import { getCurrentStudent, getStudentTimetable } from "@/lib/student-data";

export const dynamic = "force-dynamic";

export default async function HallTicketPage() {
  const student = await getCurrentStudent();
  const timetable = await getStudentTimetable(student.id, student.classId);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Hall Ticket</p>
      <h1 className="mt-2 text-3xl font-semibold">Exam admission card</h1>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 pb-5 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Student</p>
            <p className="text-lg font-semibold">{student.user.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Roll No.</p>
            <p className="text-lg font-semibold">{student.rollNumber}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Class</p>
            <p className="font-medium">{student.class.code} - {student.class.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Registration</p>
            <p className="font-medium">{student.registrationNumber}</p>
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Hall</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {timetable.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3">{entry.scheduleDate.toLocaleDateString()}</td>
                  <td className="px-4 py-3">{entry.subject.code} - {entry.subject.name}</td>
                  <td className="px-4 py-3">{entry.startsAt.toLocaleTimeString()} - {entry.endsAt.toLocaleTimeString()}</td>
                  <td className="px-4 py-3">{entry.roomAllocations.map((room) => room.room.code).join(", ") || "Pending"}</td>
                  <td className="px-4 py-3">{entry.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
