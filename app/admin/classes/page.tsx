import { CrudManager } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ClassesPage() {
  const [classes, departments] = await Promise.all([
    prisma.class.findMany({
      orderBy: [{ academicYear: "desc" }, { semester: "asc" }],
      include: { department: true, _count: { select: { students: true } } },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <CrudManager
      title="Classes"
      description="Manage academic batches, semesters, sections, and yearly class groups."
      apiPath="/api/classes"
      initialRows={classes.map((item) => ({
        id: item.id,
        departmentId: item.departmentId,
        code: item.code,
        name: item.name,
        program: item.program,
        semester: item.semester,
        section: item.section,
        batchYear: item.batchYear,
        academicYear: item.academicYear,
        status: item.status,
        departmentName: item.department.name,
        studentCount: item._count.students,
      }))}
      fields={[
        {
          name: "departmentId",
          label: "Department",
          type: "select",
          required: true,
          options: departments.map((department) => ({ label: `${department.code} - ${department.name}`, value: department.id })),
        },
        { name: "code", label: "Code", required: true, placeholder: "CSE-S4-2026-A" },
        { name: "name", label: "Name", required: true, placeholder: "CSE Semester 4 - A" },
        { name: "program", label: "Program", required: true, placeholder: "B.Tech Computer Science" },
        { name: "semester", label: "Semester", type: "number", required: true },
        { name: "section", label: "Section", required: true, placeholder: "A" },
        { name: "batchYear", label: "Batch year", type: "number", required: true },
        { name: "academicYear", label: "Academic year", required: true, placeholder: "2025-2026" },
        {
          name: "status",
          label: "Status",
          type: "select",
          required: true,
          options: ["ACTIVE", "COMPLETED", "ARCHIVED"].map((value) => ({ label: value, value })),
        },
      ]}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "departmentName", label: "Department" },
        { key: "semester", label: "Semester" },
        { key: "academicYear", label: "Year" },
        { key: "studentCount", label: "Students" },
        { key: "status", label: "Status" },
      ]}
    />
  );
}
