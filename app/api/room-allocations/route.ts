import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { roomAllocationSchema } from "@/lib/admin-validators";
import { getScheduleConflicts } from "@/lib/exam-conflicts";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = roomAllocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hall allocation data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const schedule = await prisma.examSchedule.findUnique({ where: { id: parsed.data.scheduleId } });
  if (!schedule) return NextResponse.json({ error: "Schedule not found." }, { status: 404 });

  const conflicts = await getScheduleConflicts({
    scheduleId: schedule.id,
    classId: schedule.classId,
    startsAt: schedule.startsAt,
    endsAt: schedule.endsAt,
    roomId: parsed.data.roomId,
  });

  if (conflicts.some((conflict) => conflict.type === "ROOM")) {
    return NextResponse.json({ error: "Hall conflict detected.", conflicts }, { status: 409 });
  }

  const item = await prisma.scheduleRoom.upsert({
    where: { scheduleId_roomId: { scheduleId: parsed.data.scheduleId, roomId: parsed.data.roomId } },
    create: parsed.data,
    update: { capacityUsed: parsed.data.capacityUsed },
  });

  return NextResponse.json({ item });
}
