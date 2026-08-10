import Link from "next/link";

import { getCurrentFaculty } from "@/lib/faculty-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PendingEvaluationsPage() {
  const faculty = await getCurrentFaculty();
  const pending = await prisma.marks.findMany({
    where: {
      enteredByUserId: faculty.userId,
      status: { in: ["DRAFT", "SUBMITTED"] },
    },
    include: {
      exam: true,
      subject: true,
      student: { include: { user: true, class: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Pending Evaluations</p>
      <h1 className="mt-2 text-3xl font-semibold">Marks needing action</h1>
      <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {pending.map((mark) => (
            <div key={mark.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{mark.student.rollNumber} - {mark.student.user.name}</p>
                <p className="mt-1 text-sm text-slate-600">{mark.exam.code} · {mark.subject.code} · {Number(mark.marksObtained)}/{Number(mark.maxMarks)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">{mark.status}</span>
                <Link href="/faculty/marks" className="text-sm font-medium text-emerald-700">Review</Link>
              </div>
            </div>
          ))}
          {pending.length === 0 ? <p className="p-5 text-sm text-slate-500">No pending evaluations.</p> : null}
        </div>
      </section>
    </main>
  );
}
