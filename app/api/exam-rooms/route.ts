import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { roomSchema } from "@/lib/admin-validators";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.examRoom.findMany({ orderBy: { code: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = roomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid hall data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.examRoom.create({ data: parsed.data });
  return NextResponse.json({ item }, { status: 201 });
}
