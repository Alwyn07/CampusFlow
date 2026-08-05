import { ExaminationModule } from "@/components/admin/examination-module";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ExaminationsPage() {
  const [exams, schedules, rooms, classes, subjects, faculty] = await Promise.all([
    prisma.exam.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { schedules: true } } },
    }),
    prisma.examSchedule.findMany({
      orderBy: [{ scheduleDate: "asc" }, { startsAt: "asc" }],
      include: {
        exam: true,
        class: true,
        subject: true,
        roomAllocations: { include: { room: true } },
        assignments: { include: { faculty: { include: { user: true } } } },
      },
    }),
    prisma.examRoom.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.class.findMany({ where: { status: "ACTIVE" }, orderBy: { code: "asc" } }),
    prisma.subject.findMany({ where: { isActive: true }, orderBy: { code: "asc" } }),
    prisma.faculty.findMany({
      where: { isAvailableForDuty: true },
      include: { user: true },
      orderBy: { employeeCode: "asc" },
    }),
  ]);

  return (
    <ExaminationModule
      exams={exams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        code: exam.code,
        type: exam.type,
        academicYear: exam.academicYear,
        term: exam.term,
        status: exam.status,
        startsOn: exam.startsOn?.toISOString() ?? "",
        endsOn: exam.endsOn?.toISOString() ?? "",
        schedules: exam._count.schedules,
      }))}
      schedules={schedules.map((schedule) => ({
        id: schedule.id,
        examId: schedule.examId,
        classId: schedule.classId,
        subjectId: schedule.subjectId,
        scheduleDate: schedule.scheduleDate.toISOString(),
        startsAt: schedule.startsAt.toISOString(),
        endsAt: schedule.endsAt.toISOString(),
        status: schedule.status,
        instructions: schedule.instructions ?? "",
        examTitle: schedule.exam.title,
        classCode: schedule.class.code,
        subjectCode: schedule.subject.code,
        rooms: schedule.roomAllocations.map((item) => item.room.code).join(", "),
        invigilators: schedule.assignments
          .filter((item) => item.status !== "CANCELLED")
          .map((item) => item.faculty.user.name)
          .join(", "),
      }))}
      rooms={rooms.map((room) => ({
        id: room.id,
        label: `${room.code} - ${room.name}`,
        capacity: room.capacity,
      }))}
      classes={classes.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` }))}
      subjects={subjects.map((item) => ({ id: item.id, label: `${item.code} - ${item.name}` }))}
      faculty={faculty.map((item) => ({
        id: item.id,
        label: `${item.employeeCode} - ${item.user.name}`,
      }))}
    />
  );
}
