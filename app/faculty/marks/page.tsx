import { MarksManager } from "@/components/faculty/marks-manager";
import { getCurrentFaculty, getFacultyAssignments, uniqueAssignedStudents } from "@/lib/faculty-data";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FacultyMarksPage() {
  const faculty = await getCurrentFaculty();
  const assignments = await getFacultyAssignments(faculty.id);
  const students = uniqueAssignedStudents(assignments);
  const examMap = new Map<string, { id: string; label: string }>();
  const subjectMap = new Map<string, { id: string; label: string; maxMarks: number; passingMarks: number }>();

  assignments.forEach((assignment) => {
    examMap.set(assignment.schedule.examId, {
      id: assignment.schedule.examId,
      label: `${assignment.schedule.exam.code} - ${assignment.schedule.exam.title}`,
    });
    subjectMap.set(assignment.schedule.subjectId, {
      id: assignment.schedule.subjectId,
      label: `${assignment.schedule.subject.code} - ${assignment.schedule.subject.name}`,
      maxMarks: Number(assignment.schedule.subject.maxMarks),
      passingMarks: Number(assignment.schedule.subject.passingMarks),
    });
  });

  const marks = await prisma.marks.findMany({
    where: { enteredByUserId: faculty.userId },
    include: {
      exam: true,
      subject: true,
      student: { include: { user: true, class: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Upload Marks</p>
      <h1 className="mt-2 text-3xl font-semibold">Upload, edit, and approve marks</h1>
      <div className="mt-6">
        <MarksManager
          exams={Array.from(examMap.values())}
          subjects={Array.from(subjectMap.values())}
          students={students}
          marks={marks.map((mark) => ({
            id: mark.id,
            examId: mark.examId,
            studentId: mark.studentId,
            subjectId: mark.subjectId,
            exam: mark.exam.code,
            subject: mark.subject.code,
            student: mark.student.user.name,
            rollNumber: mark.student.rollNumber,
            classCode: mark.student.class.code,
            marksObtained: Number(mark.marksObtained),
            maxMarks: Number(mark.maxMarks),
            passingMarks: Number(mark.passingMarks),
            grade: mark.grade ?? "",
            status: mark.status,
          }))}
        />
      </div>
    </main>
  );
}
