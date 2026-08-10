import { getCurrentStudent, getStudentTimetable } from "@/lib/student-data";

export const dynamic = "force-dynamic";

export default async function StudentTimetablePage() {
  const student = await getCurrentStudent();
  const timetable = await getStudentTimetable(student.id, student.classId);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Timetable</p>
      <h1 className="mt-2 text-3xl font-semibold">Exam timetable</h1>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {timetable.map((entry) => (
          <div key={entry.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">{entry.exam.code}</p>
            <h2 className="mt-1 text-lg font-semibold">{entry.subject.code} - {entry.subject.name}</h2>
            <p className="mt-2 text-sm text-slate-600">{entry.scheduleDate.toLocaleDateString()} · {entry.startsAt.toLocaleTimeString()} - {entry.endsAt.toLocaleTimeString()}</p>
            <p className="mt-2 text-sm text-slate-600">Hall: {entry.roomAllocations.map((room) => room.room.name).join(", ") || "Pending"}</p>
            <p className="mt-2 text-sm text-slate-500">{entry.instructions || "Follow college examination rules."}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
