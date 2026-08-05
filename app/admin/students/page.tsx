import { CrudManager } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const [students, classes] = await Promise.all([
    prisma.student.findMany({
      orderBy: { rollNumber: "asc" },
      include: { user: true, class: true },
    }),
    prisma.class.findMany({ where: { status: "ACTIVE" }, orderBy: [{ academicYear: "desc" }, { code: "asc" }] }),
  ]);

  return (
    <CrudManager
      title="Students"
      description="Manage student accounts, roll numbers, registration details, and class membership."
      apiPath="/api/students"
      initialRows={students.map((student) => ({
        id: student.id,
        classId: student.classId,
        rollNumber: student.rollNumber,
        registrationNumber: student.registrationNumber,
        admissionNumber: student.admissionNumber ?? "",
        gender: student.gender ?? "",
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
        address: student.address,
        isActive: student.isActive,
        name: student.user.name,
        email: student.user.email,
        phone: student.user.phone,
        classCode: student.class.code,
      }))}
      fields={[
        {
          name: "classId",
          label: "Class",
          type: "select",
          required: true,
          options: classes.map((item) => ({ label: `${item.code} - ${item.name}`, value: item.id })),
        },
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone" },
        { name: "rollNumber", label: "Roll number", required: true },
        { name: "registrationNumber", label: "Registration number", required: true },
        { name: "admissionNumber", label: "Admission number" },
        {
          name: "gender",
          label: "Gender",
          type: "select",
          options: ["FEMALE", "MALE", "OTHER", "PREFER_NOT_TO_SAY"].map((value) => ({ label: value, value })),
        },
        { name: "guardianName", label: "Guardian name" },
        { name: "guardianPhone", label: "Guardian phone" },
        { name: "address", label: "Address", type: "textarea" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { key: "rollNumber", label: "Roll No." },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "classCode", label: "Class" },
        { key: "registrationNumber", label: "Registration" },
        { key: "isActive", label: "Active" },
      ]}
    />
  );
}
