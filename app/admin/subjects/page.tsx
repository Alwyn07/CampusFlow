import { CrudManager } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SubjectsPage() {
  const [subjects, departments, faculty] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { code: "asc" },
      include: { department: true, coordinator: { include: { user: true } } },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.faculty.findMany({ include: { user: true }, orderBy: { employeeCode: "asc" } }),
  ]);

  return (
    <CrudManager
      title="Subjects"
      description="Configure exam subjects, pass marks, credits, and optional faculty coordinators."
      apiPath="/api/subjects"
      initialRows={subjects.map((subject) => ({
        id: subject.id,
        departmentId: subject.departmentId,
        coordinatorFacultyId: subject.coordinatorFacultyId ?? "",
        code: subject.code,
        name: subject.name,
        type: subject.type,
        credits: subject.credits,
        maxMarks: Number(subject.maxMarks),
        passingMarks: Number(subject.passingMarks),
        isActive: subject.isActive,
        departmentName: subject.department.name,
        coordinatorName: subject.coordinator?.user.name ?? "-",
      }))}
      fields={[
        {
          name: "departmentId",
          label: "Department",
          type: "select",
          required: true,
          options: departments.map((department) => ({ label: `${department.code} - ${department.name}`, value: department.id })),
        },
        {
          name: "coordinatorFacultyId",
          label: "Coordinator",
          type: "select",
          options: faculty.map((item) => ({ label: `${item.employeeCode} - ${item.user.name}`, value: item.id })),
        },
        { name: "code", label: "Code", required: true, placeholder: "CSE401" },
        { name: "name", label: "Name", required: true, placeholder: "Discrete Mathematics" },
        {
          name: "type",
          label: "Type",
          type: "select",
          required: true,
          options: ["THEORY", "PRACTICAL", "LAB", "PROJECT", "VIVA"].map((value) => ({ label: value, value })),
        },
        { name: "credits", label: "Credits", type: "number", required: true },
        { name: "maxMarks", label: "Max marks", type: "number", required: true },
        { name: "passingMarks", label: "Passing marks", type: "number", required: true },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "departmentName", label: "Department" },
        { key: "type", label: "Type" },
        { key: "credits", label: "Credits" },
        { key: "passingMarks", label: "Pass" },
        { key: "isActive", label: "Active" },
      ]}
    />
  );
}
