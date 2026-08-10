import { NextResponse } from "next/server";

import { createSimplePdf } from "@/lib/simple-pdf";
import { summarizeGpa } from "@/lib/student-data";
import { requireStudent } from "@/lib/student-auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ examId: string }> };

export async function GET(_: Request, context: Context) {
  const { student, error } = await requireStudent();
  if (error) return error;

  const { examId } = await context.params;
  const marks = await prisma.marks.findMany({
    where: {
      studentId: student.id,
      examId,
      status: { in: ["VERIFIED", "PUBLISHED"] },
    },
    include: { exam: true, subject: true },
    orderBy: { subject: { code: "asc" } },
  });

  if (marks.length === 0) {
    return NextResponse.json({ error: "No verified marks found for this exam." }, { status: 404 });
  }

  const summary = summarizeGpa(marks);
  const semester = summary.semesters[0];
  const exam = marks[0].exam;
  const lines = [
    "CampusFlow",
    "Official Marksheet",
    "",
    `Student: ${student.user.name}`,
    `Roll No.: ${student.rollNumber}`,
    `Registration: ${student.registrationNumber}`,
    `Class: ${student.class.code} - ${student.class.name}`,
    `Exam: ${exam.code} - ${exam.title}`,
    `Academic Year: ${exam.academicYear}`,
    "",
    "Subject                         Marks      Max    Grade",
    "----------------------------------------------------------",
    ...marks.map((mark) =>
      `${mark.subject.code} ${mark.subject.name}`.padEnd(32).slice(0, 32) +
      `${Number(mark.marksObtained)}`.padStart(8) +
      `${Number(mark.maxMarks)}`.padStart(9) +
      `    ${mark.grade ?? "-"}`,
    ),
    "",
    `Total: ${semester.totalMarks}/${semester.maxMarks}`,
    `Percentage: ${semester.percentage}%`,
    `Semester GPA: ${semester.gpa}`,
    `CGPA: ${summary.cgpa}`,
    "",
    `Generated: ${new Date().toLocaleString()}`,
  ];

  const pdf = createSimplePdf(lines);

  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="marksheet-${exam.code}-${student.rollNumber}.pdf"`,
    },
  });
}
