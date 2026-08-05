import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { scheduleSchema } from "@/lib/admin-validators";
import { getScheduleConflicts } from "@/lib/exam-conflicts";
import { notifyClassSchedule } from "@/lib/exam-notifications";
import { prisma } from "@/lib/prisma";

function scheduleData(data: ReturnType<typeof scheduleSchema.parse>) {
  return {
    ...data,
    scheduleDate: new Date(data.scheduleDate),
    startsAt: new Date(data.startsAt),
    endsAt: new Date(data.endsAt),
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.examSchedule.findMany({
    orderBy: [{ scheduleDate: "asc" }, { startsAt: "asc" }],
    include: {
      exam: true,
      class: true,
      subject: true,
      roomAllocations: { include: { room: true } },
      assignments: { include: { faculty: { include: { user: true } }, room: true } },
    },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid timetable data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = scheduleData(parsed.data);
  const conflicts = await getScheduleConflicts({
    classId: data.classId,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
  });

  if (conflicts.length > 0) {
    return NextResponse.json({ error: "Schedule conflict detected.", conflicts }, { status: 409 });
  }

  const item = await prisma.examSchedule.create({ data });

  if (item.status === "CONFIRMED") {
    await notifyClassSchedule(item.id, "Exam scheduled", "A new exam session has been scheduled.");
  }

  return NextResponse.json({ item }, { status: 201 });
}
