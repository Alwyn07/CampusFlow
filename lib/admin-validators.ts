import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const departmentSchema = z.object({
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(160),
  description: optionalText,
  isActive: z.boolean().default(true),
});

export const classSchema = z.object({
  departmentId: z.string().uuid(),
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  program: z.string().trim().min(2).max(120),
  semester: z.coerce.number().int().min(1).max(12),
  section: z.string().trim().min(1).max(20).default("A"),
  batchYear: z.coerce.number().int().min(2000).max(2100),
  academicYear: z.string().trim().min(4).max(20),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]).default("ACTIVE"),
});

export const subjectSchema = z.object({
  departmentId: z.string().uuid(),
  coordinatorFacultyId: z.string().uuid().optional().or(z.literal("")),
  code: z.string().trim().min(2).max(40).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(180),
  type: z.enum(["THEORY", "PRACTICAL", "LAB", "PROJECT", "VIVA"]).default("THEORY"),
  credits: z.coerce.number().int().min(0).max(30),
  maxMarks: z.coerce.number().min(0).max(999),
  passingMarks: z.coerce.number().min(0).max(999),
  isActive: z.boolean().default(true),
});

export const facultySchema = z.object({
  departmentId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone: optionalText,
  employeeCode: z.string().trim().min(2).max(60).transform((value) => value.toUpperCase()),
  designation: z.string().trim().min(2).max(120),
  facultyType: z.enum(["PERMANENT", "CONTRACT", "GUEST", "VISITING"]).default("PERMANENT"),
  maxDutiesPerDay: z.coerce.number().int().min(0).max(10),
  maxDutiesPerWeek: z.coerce.number().int().min(0).max(40),
  isAvailableForDuty: z.boolean().default(true),
});

export const studentSchema = z.object({
  classId: z.string().uuid(),
  name: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(255).transform((value) => value.toLowerCase()),
  phone: optionalText,
  rollNumber: z.string().trim().min(1).max(50),
  registrationNumber: z.string().trim().min(2).max(80),
  admissionNumber: optionalText,
  gender: z.enum(["FEMALE", "MALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional().or(z.literal("")),
  guardianName: optionalText,
  guardianPhone: optionalText,
  address: optionalText,
  isActive: z.boolean().default(true),
});

export const examSchema = z.object({
  title: z.string().trim().min(2).max(180),
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  type: z.enum(["INTERNAL", "MIDTERM", "SEMESTER", "SUPPLEMENTARY", "IMPROVEMENT"]),
  academicYear: z.string().trim().min(4).max(20),
  term: z.string().trim().min(2).max(40),
  status: z
    .enum(["DRAFT", "SCHEDULED", "ONGOING", "COMPLETED", "RESULT_PROCESSING", "PUBLISHED", "ARCHIVED"])
    .default("DRAFT"),
  startsOn: optionalText,
  endsOn: optionalText,
});

export const roomSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(120),
  building: optionalText,
  floor: optionalText,
  type: z.enum(["CLASSROOM", "LAB", "HALL", "AUDITORIUM"]).default("CLASSROOM"),
  capacity: z.coerce.number().int().min(1).max(10000),
  isActive: z.boolean().default(true),
});

export const scheduleSchema = z.object({
  examId: z.string().uuid(),
  classId: z.string().uuid(),
  subjectId: z.string().uuid(),
  scheduleDate: z.string().min(10),
  startsAt: z.string().min(10),
  endsAt: z.string().min(10),
  status: z.enum(["DRAFT", "CONFIRMED", "RESCHEDULED", "CANCELLED", "COMPLETED"]).default("DRAFT"),
  instructions: optionalText,
});

export const roomAllocationSchema = z.object({
  scheduleId: z.string().uuid(),
  roomId: z.string().uuid(),
  capacityUsed: z.coerce.number().int().min(1).max(10000),
});

export const invigilatorAssignmentSchema = z.object({
  scheduleId: z.string().uuid(),
  roomId: z.string().uuid(),
  facultyId: z.string().uuid(),
  role: z.enum(["CHIEF_SUPERINTENDENT", "INVIGILATOR", "RELIEVER", "OBSERVER"]).default("INVIGILATOR"),
  status: z.enum(["ASSIGNED", "ACCEPTED", "DECLINED", "SWAPPED", "COMPLETED", "CANCELLED"]).default("ASSIGNED"),
  notes: optionalText,
});
