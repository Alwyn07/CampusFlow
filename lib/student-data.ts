import { redirect } from "next/navigation";

import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentStudent() {
  const { student, error } = await requireStudent();

  if (error || !student) {
    redirect("/login");
  }

  return student;
}

export async function getStudentTimetable(studentId: string, classId: string) {
  return prisma.examSchedule.findMany({
    where: {
      classId,
      status: { not: "CANCELLED" },
    },
    orderBy: [{ scheduleDate: "asc" }, { startsAt: "asc" }],
    include: {
      exam: true,
      subject: true,
      roomAllocations: { include: { room: true } },
      attendance: { where: { studentId } },
    },
  });
}

export async function getStudentMarks(studentId: string) {
  return prisma.marks.findMany({
    where: {
      studentId,
      status: { in: ["VERIFIED", "PUBLISHED"] },
    },
    include: {
      exam: true,
      subject: true,
    },
    orderBy: [{ exam: { academicYear: "desc" } }, { subject: { code: "asc" } }],
  });
}

export async function getStudentNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 25,
  });
}

export function gradePoint(percentage: number) {
  if (percentage >= 90) return 10;
  if (percentage >= 80) return 9;
  if (percentage >= 70) return 8;
  if (percentage >= 60) return 7;
  if (percentage >= 50) return 6;
  if (percentage >= 40) return 5;
  return 0;
}

export function summarizeGpa(
  marks: Awaited<ReturnType<typeof getStudentMarks>>,
) {
  const examGroups = new Map<string, {
    examId: string;
    examCode: string;
    examTitle: string;
    credits: number;
    points: number;
    totalMarks: number;
    maxMarks: number;
  }>();

  marks.forEach((mark) => {
    const percentage = Number(mark.maxMarks) > 0
      ? (Number(mark.marksObtained) / Number(mark.maxMarks)) * 100
      : 0;
    const credits = mark.subject.credits || 1;
    const current = examGroups.get(mark.examId) ?? {
      examId: mark.examId,
      examCode: mark.exam.code,
      examTitle: mark.exam.title,
      credits: 0,
      points: 0,
      totalMarks: 0,
      maxMarks: 0,
    };

    current.credits += credits;
    current.points += gradePoint(percentage) * credits;
    current.totalMarks += Number(mark.marksObtained);
    current.maxMarks += Number(mark.maxMarks);
    examGroups.set(mark.examId, current);
  });

  const semesters = Array.from(examGroups.values()).map((group) => ({
    ...group,
    gpa: group.credits > 0 ? Number((group.points / group.credits).toFixed(2)) : 0,
    percentage: group.maxMarks > 0
      ? Number(((group.totalMarks / group.maxMarks) * 100).toFixed(2))
      : 0,
  }));

  const totalCredits = semesters.reduce((sum, item) => sum + item.credits, 0);
  const totalPoints = semesters.reduce((sum, item) => sum + item.points, 0);

  return {
    semesters,
    cgpa: totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0,
  };
}
