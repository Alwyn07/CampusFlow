import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { notifyClassSchedule } from "@/lib/exam-notifications";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ id: string }> };

export async function POST(_: Request, context: Context) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const schedules = await prisma.examSchedule.findMany({ where: { examId: id }, select: { id: true } });

  const exam = await prisma.$transaction(async (tx) => {
    await tx.invigilatorAssignment.updateMany({
      where: { schedule: { examId: id } },
      data: { status: "CANCELLED" },
    });
    await tx.examSchedule.updateMany({
      where: { examId: id },
      data: { status: "CANCELLED" },
    });
    return tx.exam.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  });

  await Promise.all(
    schedules.map((schedule) =>
      notifyClassSchedule(schedule.id, "Exam cancelled", `${exam.title} has been cancelled.`),
    ),
  );

  return NextResponse.json({ item: exam });
}
