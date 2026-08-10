import { getCurrentFaculty, getFacultyAssignments, uniqueAssignedStudents } from "@/lib/faculty-data";

export const dynamic = "force-dynamic";

export default async function FacultyStudentsPage() {
  const faculty = await getCurrentFaculty();
  const assignments = await getFacultyAssignments(faculty.id);
  const students = uniqueAssignedStudents(assignments);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">View Students</p>
      <h1 className="mt-2 text-3xl font-semibold">Students in assigned classes</h1>
      <section className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3">Roll No.</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Class</th>
                <th className="px-5 py-3">Registration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-5 py-3">{student.rollNumber}</td>
                  <td className="px-5 py-3 font-medium">{student.name}</td>
                  <td className="px-5 py-3">{student.email}</td>
                  <td className="px-5 py-3">{student.classCode}</td>
                  <td className="px-5 py-3">{student.registrationNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
