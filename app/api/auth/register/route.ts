import { NextResponse } from "next/server";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration data.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { email, name, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "An account already exists for this email." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name,
      passwordHash,
      role,
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      metadata: { source: "self-registration", role },
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
