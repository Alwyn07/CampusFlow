import { NextResponse } from "next/server";

import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid password reset request.", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const candidates = await prisma.passwordResetToken.findMany({
    where: {
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: {
      user: {
        select: {
          id: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const resetToken = (
    await Promise.all(
      candidates.map(async (candidate) => {
        const matches = await verifyPassword(parsed.data.token, candidate.tokenHash);
        return matches ? candidate : null;
      }),
    )
  ).find(Boolean);

  if (!resetToken || resetToken.user.status !== "ACTIVE") {
    return NextResponse.json(
      { error: "The reset link is invalid or expired." },
      { status: 400 },
    );
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash: await hashPassword(parsed.data.password),
      },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
    prisma.auditLog.create({
      data: {
        actorUserId: resetToken.userId,
        action: "UPDATE",
        entityType: "User",
        entityId: resetToken.userId,
        metadata: { source: "reset-password" },
      },
    }),
  ]);

  return NextResponse.json({
    message: "Password updated successfully. You can sign in now.",
  });
}
