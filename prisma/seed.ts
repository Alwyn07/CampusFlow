import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { Pool } from "pg";
import {
  AuditAction,
  ExamStatus,
  ExamType,
  NotificationType,
  PrismaClient,
  ScheduleStatus,
  UserRole,
  UserStatus,
} from "@prisma/client";

const SALT_ROUNDS = 12;
const DEV_PASSWORDS = {
  admin: "Admin@123",
  faculty: "Faculty@123",
  student: "Student@123",
} as const;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

function resolveSslOptions(
  connectionString: string,
): { rejectUnauthorized: boolean } | undefined {
  const lower = connectionString.toLowerCase();

  if (lower.includes("sslmode=disable")) return undefined;
  if (lower.includes("sslmode=no-verify")) return { rejectUnauthorized: false };
  if (lower.includes("sslmode=require") || lower.includes("sslmode=prefer")) {
    return { rejectUnauthorized: false };
  }
  if (lower.includes("sslmode=verify-ca") || lower.includes("sslmode=verify-full")) {
    return undefined;
  }

  const host = connectionString.match(/@([^:/]+)/)?.[1]?.toLowerCase();
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";

  return isLocal ? undefined : { rejectUnauthorized: false };
}

const pool = new Pool({
  connectionString,
  ssl: resolveSslOptions(connectionString),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminPasswordHash = await bcrypt.hash(DEV_PASSWORDS.admin, SALT_ROUNDS);
  const facultyPasswordHash = await bcrypt.hash(DEV_PASSWORDS.faculty, SALT_ROUNDS);
  const studentPasswordHash = await bcrypt.hash(DEV_PASSWORDS.student, SALT_ROUNDS);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@campusflow.local" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@campusflow.local",
      name: "CampusFlow Administrator",
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      passwordHash: adminPasswordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const cse = await prisma.department.upsert({
    where: { code: "CSE" },
    update: {},
    create: {
      code: "CSE",
      name: "Computer Science and Engineering",
      description: "Seed department for CampusFlow setup.",
    },
  });

  const s4 = await prisma.class.upsert({
    where: { code: "CSE-S4-2026-A" },
    update: {},
    create: {
      departmentId: cse.id,
      code: "CSE-S4-2026-A",
      name: "CSE Semester 4 - A",
      program: "B.Tech Computer Science",
      semester: 4,
      section: "A",
      batchYear: 2024,
      academicYear: "2025-2026",
    },
  });

  const facultyUser = await prisma.user.upsert({
    where: { email: "faculty@campusflow.local" },
    update: { passwordHash: facultyPasswordHash },
    create: {
      email: "faculty@campusflow.local",
      name: "Demo Faculty",
      role: UserRole.FACULTY,
      status: UserStatus.ACTIVE,
      passwordHash: facultyPasswordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const faculty = await prisma.faculty.upsert({
    where: { employeeCode: "FAC001" },
    update: {},
    create: {
      userId: facultyUser.id,
      departmentId: cse.id,
      employeeCode: "FAC001",
      designation: "Assistant Professor",
    },
  });

  const studentUser = await prisma.user.upsert({
    where: { email: "student@campusflow.local" },
    update: { passwordHash: studentPasswordHash },
    create: {
      email: "student@campusflow.local",
      name: "Demo Student",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      passwordHash: studentPasswordHash,
      emailVerifiedAt: new Date(),
    },
  });

  const student = await prisma.student.upsert({
    where: { registrationNumber: "REG-CSE-2024-001" },
    update: {},
    create: {
      userId: studentUser.id,
      classId: s4.id,
      rollNumber: "CSE401",
      registrationNumber: "REG-CSE-2024-001",
      admissionNumber: "ADM-2024-001",
      guardianName: "Demo Guardian",
    },
  });

  const maths = await prisma.subject.upsert({
    where: { code: "CSE401" },
    update: {},
    create: {
      departmentId: cse.id,
      coordinatorFacultyId: faculty.id,
      code: "CSE401",
      name: "Discrete Mathematics",
      credits: 4,
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  await prisma.classSubject.upsert({
    where: { classId_subjectId: { classId: s4.id, subjectId: maths.id } },
    update: {},
    create: {
      classId: s4.id,
      subjectId: maths.id,
      isCore: true,
    },
  });

  const exam = await prisma.exam.upsert({
    where: { code: "INT-2026-MAR-CSE-S4" },
    update: {},
    create: {
      code: "INT-2026-MAR-CSE-S4",
      title: "Second Internal Examination - March 2026",
      type: ExamType.INTERNAL,
      academicYear: "2025-2026",
      term: "March 2026",
      status: ExamStatus.SCHEDULED,
      startsOn: new Date("2026-03-23T09:30:00.000Z"),
      endsOn: new Date("2026-03-28T12:30:00.000Z"),
    },
  });

  const room = await prisma.examRoom.upsert({
    where: { code: "B1-101" },
    update: {},
    create: {
      code: "B1-101",
      name: "Block 1 Room 101",
      building: "Block 1",
      floor: "1",
      capacity: 60,
    },
  });

  const schedule = await prisma.examSchedule.upsert({
    where: { examId_classId_subjectId: { examId: exam.id, classId: s4.id, subjectId: maths.id } },
    update: {},
    create: {
      examId: exam.id,
      classId: s4.id,
      subjectId: maths.id,
      scheduleDate: new Date("2026-03-23T00:00:00.000Z"),
      startsAt: new Date("2026-03-23T09:30:00.000Z"),
      endsAt: new Date("2026-03-23T11:30:00.000Z"),
      status: ScheduleStatus.CONFIRMED,
    },
  });

  await prisma.scheduleRoom.upsert({
    where: { scheduleId_roomId: { scheduleId: schedule.id, roomId: room.id } },
    update: {},
    create: {
      scheduleId: schedule.id,
      roomId: room.id,
      capacityUsed: 45,
    },
  });

  await prisma.invigilatorAssignment.upsert({
    where: {
      scheduleId_roomId_facultyId: {
        scheduleId: schedule.id,
        roomId: room.id,
        facultyId: faculty.id,
      },
    },
    update: {},
    create: {
      scheduleId: schedule.id,
      roomId: room.id,
      facultyId: faculty.id,
    },
  });

  await prisma.attendance.upsert({
    where: { scheduleId_studentId: { scheduleId: schedule.id, studentId: student.id } },
    update: {},
    create: {
      scheduleId: schedule.id,
      roomId: room.id,
      studentId: student.id,
    },
  });

  await prisma.marks.upsert({
    where: { examId_studentId_subjectId: { examId: exam.id, studentId: student.id, subjectId: maths.id } },
    update: {},
    create: {
      examId: exam.id,
      studentId: student.id,
      subjectId: maths.id,
      enteredByUserId: adminUser.id,
      marksObtained: 82,
      maxMarks: 100,
      passingMarks: 40,
    },
  });

  await prisma.result.upsert({
    where: { examId_studentId: { examId: exam.id, studentId: student.id } },
    update: {},
    create: {
      examId: exam.id,
      classId: s4.id,
      studentId: student.id,
      totalMarks: 82,
      maxMarks: 100,
      percentage: 82,
      grade: "A",
      rankInClass: 1,
    },
  });

  await prisma.notification.create({
    data: {
      userId: facultyUser.id,
      type: NotificationType.DUTY_ASSIGNED,
      title: "Invigilation duty assigned",
      body: "You have been assigned to Block 1 Room 101 for Discrete Mathematics.",
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: adminUser.id,
      action: AuditAction.CREATE,
      entityType: "SeedData",
      metadata: { seed: "initial-demo-data" },
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
