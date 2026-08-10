import { StatCard } from "@/components/admin/stat-card";
import { getCurrentFaculty, getFacultyAssignments, uniqueAssignedStudents } from "@/lib/faculty-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FacultyDashboardPage() {
  const faculty = await getCurrentFaculty();
  const assignments = await getFacultyAssignments(faculty.id);
  const students = uniqueAssignedStudents(assignments);
  const [draftMarks, submittedMarks, verifiedMarks] = await Promise.all([
    prisma.marks.count({ where: { enteredByUserId: faculty.userId, status: "DRAFT" } }),
    prisma.marks.count({ where: { enteredByUserId: faculty.userId, status: "SUBMITTED" } }),
    prisma.marks.count({ where: { enteredByUserId: faculty.userId, status: "VERIFIED" } }),
  ]);

  const upcoming = assignments.filter(
    (assignment) => assignment.schedule.startsAt >= new Date(),
  );

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Faculty Dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold">Welcome, {faculty.user.name}</h1>
      <p className="mt-2 text-sm text-slate-600">{faculty.department.name} · {faculty.designation}</p>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Assigned duties" value={assignments.length} detail="Active invigilation duties" />
        <StatCard label="Upcoming" value={upcoming.length} detail="Future sessions" />
        <StatCard label="Students" value={students.length} detail="In assigned classes" />
        <StatCard label="Submitted" value={submittedMarks} detail="Awaiting approval" />
        <StatCard label="Verified" value={verifiedMarks} detail={`Drafts: ${draftMarks}`} />
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Next duties</h2>
        <div className="mt-4 grid gap-3">
          {upcoming.slice(0, 5).map((assignment) => (
            <div key={assignment.id} className="rounded-md border border-slate-100 p-4">
              <p className="font-medium">{assignment.schedule.exam.title}</p>
              <p className="mt-1 text-sm text-slate-600">
                {assignment.schedule.class.code} · {assignment.schedule.subject.code} · {assignment.room.code} · {assignment.role}
              </p>
              <p className="mt-1 text-sm text-slate-500">{assignment.schedule.startsAt.toLocaleString()}</p>
            </div>
          ))}
          {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming duties.</p> : null}
        </div>
      </section>
    </main>
  );
}
