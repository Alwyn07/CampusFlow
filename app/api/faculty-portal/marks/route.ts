import { NextResponse } from "next/server";

import { requireFaculty } from "@/lib/faculty-auth";
import { facultyMarksSchema } from "@/lib/faculty-validators";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { faculty, error } = await requireFaculty();
  if (error) return error;

  const assignments = await prisma.invigilatorAssignment.findMany({
    where: { facultyId: faculty.id, status: { not: "CANCELLED" } },
    include: {
      schedule: {
        include: {
          exam: true,
          class: { include: { students: { include: { user: true } } } },
          subject: true,
        },
      },
    },
  });

  const marks = await prisma.marks.findMany({
    where: {
      enteredByUserId: faculty.userId,
    },
    include: {
      exam: true,
      subject: true,
      student: { include: { user: true, class: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const studentMap = new Map<string, {
    id: string;
    name: string;
    rollNumber: string;
    classCode: string;
  }>();
  const examMap = new Map<string, { id: string; label: string }>();
  const subjectMap = new Map<string, {
    id: string;
    label: string;
    maxMarks: number;
    passingMarks: number;
  }>();

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
    assignment.schedule.class.students.forEach((student) => {
      studentMap.set(student.id, {
        id: student.id,
        name: student.user.name,
        rollNumber: student.rollNumber,
        classCode: assignment.schedule.class.code,
      });
    });
  });

  return NextResponse.json({
    options: {
      exams: Array.from(examMap.values()),
      subjects: Array.from(subjectMap.values()),
      students: Array.from(studentMap.values()),
    },
    marks: marks.map((mark) => ({
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
      updatedAt: mark.updatedAt,
    })),
  });
}

export async function POST(request: Request) {
  const { faculty, error } = await requireFaculty();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = facultyMarksSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid marks data.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const item = await prisma.marks.upsert({
    where: {
      examId_studentId_subjectId: {
        examId: parsed.data.examId,
        studentId: parsed.data.studentId,
        subjectId: parsed.data.subjectId,
      },
    },
    create: {
      ...parsed.data,
      grade: parsed.data.grade || null,
      source: "MANUAL",
      enteredByUserId: faculty.userId,
      submittedAt: parsed.data.status === "SUBMITTED" ? new Date() : null,
    },
    update: {
      marksObtained: parsed.data.marksObtained,
      maxMarks: parsed.data.maxMarks,
      passingMarks: parsed.data.passingMarks,
      grade: parsed.data.grade || null,
      status: parsed.data.status,
      enteredByUserId: faculty.userId,
      submittedAt: parsed.data.status === "SUBMITTED" ? new Date() : undefined,
    },
  });

  if (parsed.data.status === "SUBMITTED") {
    await prisma.notification.create({
      data: {
        userId: faculty.userId,
        type: "MARKS_SUBMITTED",
        title: "Marks submitted",
        body: "Marks have been submitted and are ready for approval.",
        metadata: { marksId: item.id },
      },
    });
  }

  return NextResponse.json({ item });
}
