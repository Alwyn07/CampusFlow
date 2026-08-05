import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { examSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

function examData(data: ReturnType<typeof examSchema.parse>) {
  return {
    ...data,
    startsOn: data.startsOn ? new Date(data.startsOn) : null,
    endsOn: data.endsOn ? new Date(data.endsOn) : null,
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.exam.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { schedules: true, marks: true, results: true } } },
  });

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = examSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid exam data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.exam.create({ data: examData(parsed.data) });
  return NextResponse.json({ item }, { status: 201 });
}
