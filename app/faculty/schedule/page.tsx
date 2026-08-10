import { getCurrentFaculty, getFacultyAssignments } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function InvigilationSchedulePage() {
  const faculty = await getCurrentFaculty();
  const assignments = await getFacultyAssignments(faculty.id);
  const grouped = assignments.reduce<
    Array<{ date: string; items: typeof assignments }>
  >((acc, assignment) => {
    const date = assignment.schedule.scheduleDate.toDateString();
    const existing = acc.find((group) => group.date === date);
    if (existing) {
      existing.items.push(assignment);
    } else {
      acc.push({ date, items: [assignment] });
    }
    return acc;
  }, []);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Invigilation Schedule</p>
      <h1 className="mt-2 text-3xl font-semibold">Calendar</h1>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {grouped.map(({ date, items }) => (
          <div key={date} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold">{date}</h2>
            <div className="mt-4 space-y-3">
              {items.map((assignment) => (
                <div key={assignment.id} className="rounded-md bg-slate-50 p-3 text-sm">
                  <p className="font-medium">{assignment.schedule.exam.code} · {assignment.schedule.subject.code}</p>
                  <p className="text-slate-600">{assignment.schedule.startsAt.toLocaleTimeString()} - {assignment.schedule.endsAt.toLocaleTimeString()}</p>
                  <p className="text-slate-600">{assignment.schedule.class.code} · {assignment.room.name}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
        {assignments.length === 0 ? <p className="text-sm text-slate-500">No invigilation schedule yet.</p> : null}
      </section>
    </main>
  );
}
