import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { studentSchema } from "@/lib/admin-validators";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const defaultStudentPassword = "Student@123";

function studentData(data: ReturnType<typeof studentSchema.parse>) {
  const { name, email, phone, gender, admissionNumber, ...student } = data;
  return {
    user: { name, email, phone },
    student: {
      ...student,
      admissionNumber: admissionNumber || null,
      gender: gender || null,
    },
  };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.student.findMany({
    orderBy: { rollNumber: "asc" },
    include: { user: true, class: true },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      name: item.user.name,
      email: item.user.email,
      phone: item.user.phone,
      classCode: item.class.code,
      gender: item.gender ?? "",
      admissionNumber: item.admissionNumber ?? "",
    })),
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = studentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid student data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data = studentData(parsed.data);
  const passwordHash = await hashPassword(defaultStudentPassword);

  const item = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        ...data.user,
        passwordHash,
        role: "STUDENT",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    return tx.student.create({
      data: { ...data.student, userId: user.id },
      include: { user: true, class: true },
    });
  });

  return NextResponse.json({ item, defaultPassword: defaultStudentPassword }, { status: 201 });
}
