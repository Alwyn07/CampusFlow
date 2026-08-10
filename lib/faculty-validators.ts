import { z } from "zod";

export const facultyMarksSchema = z.object({
  examId: z.string().uuid(),
  studentId: z.string().uuid(),
  subjectId: z.string().uuid(),
  marksObtained: z.coerce.number().min(0).max(999),
  maxMarks: z.coerce.number().min(1).max(999),
  passingMarks: z.coerce.number().min(0).max(999),
  grade: z.string().trim().max(10).optional().or(z.literal("")),
  status: z.enum(["DRAFT", "SUBMITTED", "VERIFIED"]).default("DRAFT"),
});
