import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { scheduleSchema } from "@/lib/admin-validators";
import { getScheduleConflicts } from "@/lib/exam-conflicts";
import { notifyClassSchedule } from "@/lib/exam-notifications";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

function scheduleData(data: ReturnType<typeof scheduleSchema.parse>) {
  return {
    ...data,
    scheduleDate: new Date(data.scheduleDate),
    startsAt: new Date(data.startsAt),
    endsAt: new Date(data.endsAt),
  };
}

export async function PATCH(request: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid timetable data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = scheduleData(parsed.data);
  const conflicts = await getScheduleConflicts({
    scheduleId: id,
    classId: data.classId,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
  });

  if (conflicts.length > 0) {
    return NextResponse.json({ error: "Schedule conflict detected.", conflicts }, { status: 409 });
  }

  const item = await prisma.examSchedule.update({ where: { id }, data });

  if (item.status === "CONFIRMED" || item.status === "RESCHEDULED") {
    await notifyClassSchedule(item.id, "Exam timetable updated", "An exam timetable entry has been updated.");
  }

  return NextResponse.json({ item });
}

export async function DELETE(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const item = await prisma.examSchedule.update({
    where: { id },
    data: { status: "CANCELLED", assignments: { updateMany: { where: {}, data: { status: "CANCELLED" } } } },
  });

  await notifyClassSchedule(item.id, "Exam session cancelled", "An exam timetable session has been cancelled.");
  return NextResponse.json({ item });
}
