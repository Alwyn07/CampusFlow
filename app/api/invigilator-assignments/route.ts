import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { invigilatorAssignmentSchema } from "@/lib/admin-validators";
import { getScheduleConflicts } from "@/lib/exam-conflicts";
import { notifyFacultyDuty } from "@/lib/exam-notifications";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = invigilatorAssignmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid invigilator assignment data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const schedule = await prisma.examSchedule.findUnique({ where: { id: parsed.data.scheduleId } });
  if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });

  const conflicts = await getScheduleConflicts({
    scheduleId: schedule.id,
    classId: schedule.classId,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    facultyId: parsed.data.facultyId,
  });

  if (conflicts.some((conflict) => conflict.type === "FACULTY")) {
    return NextResponse.json({ error: "Invigilator conflict detected.", conflicts }, { status: 409 });
  }

  const item = await prisma.invigilatorAssignment.upsert({
    where: {
      scheduleId_roomId_facultyId: {
        scheduleId: parsed.data.scheduleId,
        roomId: parsed.data.roomId,
        facultyId: parsed.data.facultyId,
      },
    },
    create: parsed.data,
    update: {
      role: parsed.data.role,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  await notifyFacultyDuty(item.id);
  return NextResponse.json({ item });
}
