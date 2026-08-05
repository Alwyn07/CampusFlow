import { prisma } from "@/lib/prisma";

export async function getScheduleConflicts(input: {
  scheduleId?: string;
  classId: string;
  startsAt: Date;
  endsAt: Date;
  roomId?: string;
  facultyId?: string;
}) {
  const orFilters = [{ classId: input.classId }];

  if (input.roomId) {
    orFilters.push({ roomAllocations: { some: { roomId: input.roomId } } } as never);
  }

  if (input.facultyId) {
    orFilters.push({
      assignments: { some: { facultyId: input.facultyId, status: { not: "CANCELLED" } } },
    } as never);
  }

  const overlappingSchedules = await prisma.examSchedule.findMany({
    where: {
      id: input.scheduleId ? { not: input.scheduleId } : undefined,
      status: { not: "CANCELLED" },
      startsAt: { lt: input.endsAt },
      endsAt: { gt: input.startsAt },
      OR: orFilters,
    },
    include: {
      class: true,
      subject: true,
      roomAllocations: { include: { room: true } },
      assignments: { include: { faculty: { include: { user: true } } } },
    },
  });

  return overlappingSchedules.flatMap((schedule) => {
    const conflicts: Array<{ type: string; message: string }> = [];

    if (schedule.classId === input.classId) {
      conflicts.push({
        type: "CLASS",
        message: `${schedule.class.code} already has ${schedule.subject.code} in this time slot.`,
      });
    }

    if (input.roomId && schedule.roomAllocations.some((allocation) => allocation.roomId === input.roomId)) {
      conflicts.push({
        type: "ROOM",
        message: `Selected hall is already allocated during this time slot.`,
      });
    }

    if (input.facultyId && schedule.assignments.some((assignment) => assignment.facultyId === input.facultyId)) {
      conflicts.push({
        type: "FACULTY",
        message: `Selected invigilator already has duty during this time slot.`,
      });
    }

    return conflicts;
  });
}
