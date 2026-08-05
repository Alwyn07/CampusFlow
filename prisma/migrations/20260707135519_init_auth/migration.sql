-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'FACULTY', 'STUDENT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "FacultyType" AS ENUM ('PERMANENT', 'CONTRACT', 'GUEST', 'VISITING');

-- CreateEnum
CREATE TYPE "ClassStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('THEORY', 'PRACTICAL', 'LAB', 'PROJECT', 'VIVA');

-- CreateEnum
CREATE TYPE "ExamType" AS ENUM ('INTERNAL', 'MIDTERM', 'SEMESTER', 'SUPPLEMENTARY', 'IMPROVEMENT');

-- CreateEnum
CREATE TYPE "ExamStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'ONGOING', 'COMPLETED', 'RESULT_PROCESSING', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ScheduleStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('CLASSROOM', 'LAB', 'HALL', 'AUDITORIUM');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('CHIEF_SUPERINTENDENT', 'INVIGILATOR', 'RELIEVER', 'OBSERVER');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ASSIGNED', 'ACCEPTED', 'DECLINED', 'SWAPPED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MarksStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VERIFIED', 'LOCKED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "MarksSource" AS ENUM ('MANUAL', 'OCR', 'IMPORT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'MALPRACTICE', 'WITHHELD');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('EXAM_SCHEDULE', 'DUTY_ASSIGNED', 'DUTY_UPDATED', 'MARKS_SUBMITTED', 'RESULT_PUBLISHED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'EMAIL', 'SMS');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('QUEUED', 'SENT', 'READ', 'FAILED');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'CALCULATED', 'REVIEWED', 'PUBLISHED', 'WITHHELD');

-- CreateEnum
CREATE TYPE "OcrDocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REVIEWED', 'APPLIED');

-- CreateEnum
CREATE TYPE "OcrReviewStatus" AS ENUM ('PENDING', 'ACCEPTED', 'CORRECTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'IMPORT', 'EXPORT', 'OCR_PROCESS', 'APPROVE', 'REJECT', 'PUBLISH');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" TEXT,
    "name" VARCHAR(160) NOT NULL,
    "phone" VARCHAR(30),
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'INVITED',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" VARCHAR(80) NOT NULL,
    "provider" VARCHAR(80) NOT NULL,
    "providerAccountId" VARCHAR(160) NOT NULL,
    "refreshToken" TEXT,
    "accessToken" TEXT,
    "expiresAt" INTEGER,
    "tokenType" VARCHAR(80),
    "scope" TEXT,
    "idToken" TEXT,
    "sessionState" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" UUID NOT NULL,
    "sessionToken" VARCHAR(255) NOT NULL,
    "userId" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(40) NOT NULL,
    "program" VARCHAR(120) NOT NULL,
    "semester" INTEGER NOT NULL,
    "section" VARCHAR(20) NOT NULL DEFAULT 'A',
    "batchYear" INTEGER NOT NULL,
    "academicYear" VARCHAR(20) NOT NULL,
    "status" "ClassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "rollNumber" VARCHAR(50) NOT NULL,
    "registrationNumber" VARCHAR(80) NOT NULL,
    "admissionNumber" VARCHAR(80),
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "guardianName" VARCHAR(160),
    "guardianPhone" VARCHAR(30),
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "employeeCode" VARCHAR(60) NOT NULL,
    "designation" VARCHAR(120) NOT NULL,
    "facultyType" "FacultyType" NOT NULL DEFAULT 'PERMANENT',
    "maxDutiesPerDay" INTEGER NOT NULL DEFAULT 2,
    "maxDutiesPerWeek" INTEGER NOT NULL DEFAULT 8,
    "isAvailableForDuty" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "departmentId" UUID NOT NULL,
    "coordinatorFacultyId" UUID,
    "code" VARCHAR(40) NOT NULL,
    "name" VARCHAR(180) NOT NULL,
    "type" "SubjectType" NOT NULL DEFAULT 'THEORY',
    "credits" INTEGER NOT NULL DEFAULT 3,
    "maxMarks" DECIMAL(6,2) NOT NULL DEFAULT 100,
    "passingMarks" DECIMAL(6,2) NOT NULL DEFAULT 40,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "isCore" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" UUID NOT NULL,
    "title" VARCHAR(180) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "type" "ExamType" NOT NULL,
    "academicYear" VARCHAR(20) NOT NULL,
    "term" VARCHAR(40) NOT NULL,
    "status" "ExamStatus" NOT NULL DEFAULT 'DRAFT',
    "startsOn" TIMESTAMP(3),
    "endsOn" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSchedule" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "scheduleDate" TIMESTAMP(3) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "ScheduleStatus" NOT NULL DEFAULT 'DRAFT',
    "instructions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamRoom" (
    "id" UUID NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "building" VARCHAR(120),
    "floor" VARCHAR(30),
    "type" "RoomType" NOT NULL DEFAULT 'CLASSROOM',
    "capacity" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleRoom" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "capacityUsed" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScheduleRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvigilatorAssignment" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "facultyId" UUID NOT NULL,
    "role" "AssignmentRole" NOT NULL DEFAULT 'INVIGILATOR',
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ASSIGNED',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvigilatorAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Marks" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "enteredByUserId" UUID,
    "verifiedByUserId" UUID,
    "marksObtained" DECIMAL(6,2) NOT NULL,
    "maxMarks" DECIMAL(6,2) NOT NULL,
    "passingMarks" DECIMAL(6,2) NOT NULL,
    "grade" VARCHAR(10),
    "status" "MarksStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "MarksSource" NOT NULL DEFAULT 'MANUAL',
    "ocrConfidence" DECIMAL(5,2),
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Marks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "roomId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "markedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" UUID NOT NULL,
    "examId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "reviewedByUserId" UUID,
    "totalMarks" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "maxMarks" DECIMAL(8,2) NOT NULL DEFAULT 0,
    "percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "grade" VARCHAR(10),
    "rankInClass" INTEGER,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT',
    "calculatedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrDocument" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "uploadedByUserId" UUID,
    "storageBucket" VARCHAR(120) NOT NULL,
    "storagePath" TEXT NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "mimeType" VARCHAR(120) NOT NULL,
    "fileSizeBytes" INTEGER,
    "status" "OcrDocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "provider" VARCHAR(80),
    "providerJobId" VARCHAR(120),
    "confidenceScore" DECIMAL(5,2),
    "errorMessage" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OcrDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OcrExtraction" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "studentId" UUID,
    "marksId" UUID,
    "reviewedByUserId" UUID,
    "extractedRollNumber" VARCHAR(80),
    "extractedName" VARCHAR(180),
    "extractedMarks" DECIMAL(6,2),
    "rawText" TEXT,
    "rawPayload" JSONB,
    "confidenceScore" DECIMAL(5,2),
    "reviewStatus" "OcrReviewStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OcrExtraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "channel" "NotificationChannel" NOT NULL DEFAULT 'IN_APP',
    "status" "NotificationStatus" NOT NULL DEFAULT 'QUEUED',
    "title" VARCHAR(180) NOT NULL,
    "body" TEXT NOT NULL,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" "AuditAction" NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(120),
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "before" JSONB,
    "after" JSONB,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_expires_idx" ON "VerificationToken"("expires");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_expiresAt_idx" ON "PasswordResetToken"("userId", "expiresAt");

-- CreateIndex
CREATE INDEX "PasswordResetToken_usedAt_idx" ON "PasswordResetToken"("usedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "Department_isActive_idx" ON "Department"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Class_code_key" ON "Class"("code");

-- CreateIndex
CREATE INDEX "Class_departmentId_status_idx" ON "Class"("departmentId", "status");

-- CreateIndex
CREATE INDEX "Class_academicYear_semester_idx" ON "Class"("academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "Class_departmentId_program_semester_section_batchYear_key" ON "Class"("departmentId", "program", "semester", "section", "batchYear");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_registrationNumber_key" ON "Student"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");

-- CreateIndex
CREATE INDEX "Student_classId_isActive_idx" ON "Student"("classId", "isActive");

-- CreateIndex
CREATE INDEX "Student_rollNumber_idx" ON "Student"("rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Student_classId_rollNumber_key" ON "Student"("classId", "rollNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_userId_key" ON "Faculty"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_employeeCode_key" ON "Faculty"("employeeCode");

-- CreateIndex
CREATE INDEX "Faculty_departmentId_isAvailableForDuty_idx" ON "Faculty"("departmentId", "isAvailableForDuty");

-- CreateIndex
CREATE INDEX "Faculty_facultyType_idx" ON "Faculty"("facultyType");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE INDEX "Subject_departmentId_isActive_idx" ON "Subject"("departmentId", "isActive");

-- CreateIndex
CREATE INDEX "Subject_type_idx" ON "Subject"("type");

-- CreateIndex
CREATE INDEX "ClassSubject_subjectId_idx" ON "ClassSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_code_key" ON "Exam"("code");

-- CreateIndex
CREATE INDEX "Exam_academicYear_term_idx" ON "Exam"("academicYear", "term");

-- CreateIndex
CREATE INDEX "Exam_type_status_idx" ON "Exam"("type", "status");

-- CreateIndex
CREATE INDEX "Exam_startsOn_endsOn_idx" ON "Exam"("startsOn", "endsOn");

-- CreateIndex
CREATE INDEX "ExamSchedule_scheduleDate_startsAt_idx" ON "ExamSchedule"("scheduleDate", "startsAt");

-- CreateIndex
CREATE INDEX "ExamSchedule_examId_status_idx" ON "ExamSchedule"("examId", "status");

-- CreateIndex
CREATE INDEX "ExamSchedule_classId_scheduleDate_idx" ON "ExamSchedule"("classId", "scheduleDate");

-- CreateIndex
CREATE INDEX "ExamSchedule_subjectId_idx" ON "ExamSchedule"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSchedule_examId_classId_subjectId_key" ON "ExamSchedule"("examId", "classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamRoom_code_key" ON "ExamRoom"("code");

-- CreateIndex
CREATE INDEX "ExamRoom_building_floor_idx" ON "ExamRoom"("building", "floor");

-- CreateIndex
CREATE INDEX "ExamRoom_isActive_capacity_idx" ON "ExamRoom"("isActive", "capacity");

-- CreateIndex
CREATE INDEX "ScheduleRoom_roomId_idx" ON "ScheduleRoom"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "ScheduleRoom_scheduleId_roomId_key" ON "ScheduleRoom"("scheduleId", "roomId");

-- CreateIndex
CREATE INDEX "InvigilatorAssignment_facultyId_status_idx" ON "InvigilatorAssignment"("facultyId", "status");

-- CreateIndex
CREATE INDEX "InvigilatorAssignment_scheduleId_role_idx" ON "InvigilatorAssignment"("scheduleId", "role");

-- CreateIndex
CREATE INDEX "InvigilatorAssignment_roomId_idx" ON "InvigilatorAssignment"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "InvigilatorAssignment_scheduleId_roomId_facultyId_key" ON "InvigilatorAssignment"("scheduleId", "roomId", "facultyId");

-- CreateIndex
CREATE INDEX "Marks_studentId_examId_idx" ON "Marks"("studentId", "examId");

-- CreateIndex
CREATE INDEX "Marks_subjectId_status_idx" ON "Marks"("subjectId", "status");

-- CreateIndex
CREATE INDEX "Marks_enteredByUserId_idx" ON "Marks"("enteredByUserId");

-- CreateIndex
CREATE INDEX "Marks_verifiedByUserId_idx" ON "Marks"("verifiedByUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Marks_examId_studentId_subjectId_key" ON "Marks"("examId", "studentId", "subjectId");

-- CreateIndex
CREATE INDEX "Attendance_roomId_status_idx" ON "Attendance"("roomId", "status");

-- CreateIndex
CREATE INDEX "Attendance_studentId_status_idx" ON "Attendance"("studentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_scheduleId_studentId_key" ON "Attendance"("scheduleId", "studentId");

-- CreateIndex
CREATE INDEX "Result_classId_examId_status_idx" ON "Result"("classId", "examId", "status");

-- CreateIndex
CREATE INDEX "Result_studentId_status_idx" ON "Result"("studentId", "status");

-- CreateIndex
CREATE INDEX "Result_rankInClass_idx" ON "Result"("rankInClass");

-- CreateIndex
CREATE UNIQUE INDEX "Result_examId_studentId_key" ON "Result"("examId", "studentId");

-- CreateIndex
CREATE INDEX "OcrDocument_scheduleId_status_idx" ON "OcrDocument"("scheduleId", "status");

-- CreateIndex
CREATE INDEX "OcrDocument_uploadedByUserId_createdAt_idx" ON "OcrDocument"("uploadedByUserId", "createdAt");

-- CreateIndex
CREATE INDEX "OcrDocument_providerJobId_idx" ON "OcrDocument"("providerJobId");

-- CreateIndex
CREATE UNIQUE INDEX "OcrExtraction_marksId_key" ON "OcrExtraction"("marksId");

-- CreateIndex
CREATE INDEX "OcrExtraction_documentId_reviewStatus_idx" ON "OcrExtraction"("documentId", "reviewStatus");

-- CreateIndex
CREATE INDEX "OcrExtraction_studentId_idx" ON "OcrExtraction"("studentId");

-- CreateIndex
CREATE INDEX "OcrExtraction_reviewedByUserId_idx" ON "OcrExtraction"("reviewedByUserId");

-- CreateIndex
CREATE INDEX "OcrExtraction_extractedRollNumber_idx" ON "OcrExtraction"("extractedRollNumber");

-- CreateIndex
CREATE INDEX "Notification_userId_status_createdAt_idx" ON "Notification"("userId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_channel_idx" ON "Notification"("type", "channel");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_coordinatorFacultyId_fkey" FOREIGN KEY ("coordinatorFacultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSchedule" ADD CONSTRAINT "ExamSchedule_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRoom" ADD CONSTRAINT "ScheduleRoom_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRoom" ADD CONSTRAINT "ScheduleRoom_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvigilatorAssignment" ADD CONSTRAINT "InvigilatorAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvigilatorAssignment" ADD CONSTRAINT "InvigilatorAssignment_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvigilatorAssignment" ADD CONSTRAINT "InvigilatorAssignment_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_enteredByUserId_fkey" FOREIGN KEY ("enteredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Marks" ADD CONSTRAINT "Marks_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "ExamRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ExamSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrDocument" ADD CONSTRAINT "OcrDocument_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrExtraction" ADD CONSTRAINT "OcrExtraction_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "OcrDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrExtraction" ADD CONSTRAINT "OcrExtraction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrExtraction" ADD CONSTRAINT "OcrExtraction_marksId_fkey" FOREIGN KEY ("marksId") REFERENCES "Marks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OcrExtraction" ADD CONSTRAINT "OcrExtraction_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
