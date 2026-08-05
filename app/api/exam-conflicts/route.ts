import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { getScheduleConflicts } from "@/lib/exam-conflicts";

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const conflicts = await getScheduleConflicts({
    scheduleId: body.scheduleId,
    classId: body.classId,
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt),
    roomId: body.roomId,
    facultyId: body.facultyId,
  });

  return NextResponse.json({ conflicts });
}
