import { redirect } from "next/navigation";

import { requireFaculty } from "@/lib/faculty-auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentFaculty() {
  const { faculty, error } = await requireFaculty();

  if (error || !faculty) {
    redirect("/login");
  }

  return faculty;
}

export async function getFacultyAssignments(facultyId: string) {
  return prisma.invigilatorAssignment.findMany({
    where: { facultyId, status: { not: "CANCELLED" } },
    orderBy: { schedule: { startsAt: "asc" } },
    include: {
      room: true,
      schedule: {
        include: {
          exam: true,
          class: { include: { students: { include: { user: true } } } },
          subject: true,
        },
      },
    },
  });
}

export function uniqueAssignedStudents(
  assignments: Awaited<ReturnType<typeof getFacultyAssignments>>,
) {
  const students = new Map<string, {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    classCode: string;
    registrationNumber: string;
  }>();

  assignments.forEach((assignment) => {
    assignment.schedule.class.students.forEach((student) => {
      students.set(student.id, {
        id: student.id,
        name: student.user.name,
        email: student.user.email,
        rollNumber: student.rollNumber,
        classCode: assignment.schedule.class.code,
        registrationNumber: student.registrationNumber,
      });
    });
  });

  return Array.from(students.values());
}
