import { getCurrentFaculty, getFacultyAssignments } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function AssignedDutiesPage() {
  const faculty = await getCurrentFaculty();
  const assignments = await getFacultyAssignments(faculty.id);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Assigned Duties</p>
      <h1 className="mt-2 text-3xl font-semibold">Invigilation duties</h1>
      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Exam</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Hall</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {assignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="px-5 py-3">{assignment.schedule.startsAt.toLocaleString()}</td>
                  <td className="px-5 py-3">{assignment.schedule.exam.title}</td>
                  <td className="px-5 py-3">{assignment.schedule.class.code}</td>
                  <td className="px-5 py-3">{assignment.schedule.subject.code}</td>
                  <td className="px-5 py-3">{assignment.room.code}</td>
                  <td className="px-5 py-3">{assignment.role}</td>
                  <td className="px-5 py-3">{assignment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
