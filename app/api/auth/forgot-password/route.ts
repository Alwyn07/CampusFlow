import { NextResponse } from "next/server";

import { createSecureToken, hashPassword, hoursFromNow } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a valid email address." },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true },
  });

  const genericResponse = {
    message:
      "If an active account exists for this email, password reset instructions will be sent.",
  };

  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json(genericResponse);
  }

  const token = createSecureToken();
  const tokenHash = await hashPassword(token);

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt: hoursFromNow(1),
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "CREATE",
      entityType: "PasswordResetToken",
      metadata: { source: "forgot-password" },
    },
  });

  return NextResponse.json({
    ...genericResponse,
    resetUrl:
      process.env.NODE_ENV === "production" ? undefined : resetUrl,
  });
}
