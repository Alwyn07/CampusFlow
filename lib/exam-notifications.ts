import { prisma } from "@/lib/prisma";

export async function notifyClassSchedule(scheduleId: string, title: string, body: string) {
  const schedule = await prisma.examSchedule.findUnique({
    where: { id: scheduleId },
    include: {
      class: { include: { students: { include: { user: true } } } },
      exam: true,
      subject: true,
    },
  });

  if (!schedule) return;

  await prisma.notification.createMany({
    data: schedule.class.students.map((student) => ({
      userId: student.userId,
      type: "EXAM_SCHEDULE",
      title,
      body,
      metadata: {
        examId: schedule.examId,
        scheduleId: schedule.id,
        subjectId: schedule.subjectId,
      },
    })),
  });
}

export async function notifyFacultyDuty(assignmentId: string) {
  const assignment = await prisma.invigilatorAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      faculty: true,
      room: true,
      schedule: { include: { exam: true, subject: true, class: true } },
    },
  });

  if (!assignment) return;

  await prisma.notification.create({
    data: {
      userId: assignment.faculty.userId,
      type: "DUTY_ASSIGNED",
      title: "Invigilation duty assigned",
      body: `${assignment.schedule.exam.title}: ${assignment.schedule.subject.code} for ${assignment.schedule.class.code} in ${assignment.room.code}.`,
      metadata: {
        assignmentId: assignment.id,
        scheduleId: assignment.scheduleId,
        roomId: assignment.roomId,
      },
    },
  });
}
