import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin-auth";
import { facultySchema } from "@/lib/admin-validators";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const defaultFacultyPassword = "Faculty@123";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const items = await prisma.faculty.findMany({
    orderBy: { employeeCode: "asc" },
    include: { user: true, department: true },
  });

  return NextResponse.json({
    items: items.map((item) => ({
      ...item,
      name: item.user.name,
      email: item.user.email,
      phone: item.user.phone,
      departmentName: item.department.name,
    })),
  });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json().catch(() => null);
  const parsed = facultySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid faculty data.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, ...faculty } = parsed.data;
  const passwordHash = await hashPassword(defaultFacultyPassword);

  const item = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: "FACULTY",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });

    return tx.faculty.create({
      data: { ...faculty, userId: user.id },
      include: { user: true, department: true },
    });
  });

  return NextResponse.json({ item, defaultPassword: defaultFacultyPassword }, { status: 201 });
}
