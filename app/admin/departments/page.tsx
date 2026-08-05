import { CrudManager } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DepartmentsPage() {
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { classes: true, subjects: true, faculty: true } } },
  });

  return (
    <CrudManager
      title="Departments"
      description="Create and maintain academic departments used across classes, subjects, faculty, and analytics."
      apiPath="/api/departments"
      initialRows={departments.map((department) => ({
        id: department.id,
        code: department.code,
        name: department.name,
        description: department.description,
        isActive: department.isActive,
        classes: department._count.classes,
        subjects: department._count.subjects,
        faculty: department._count.faculty,
      }))}
      fields={[
        { name: "code", label: "Code", required: true, placeholder: "CSE" },
        { name: "name", label: "Name", required: true, placeholder: "Computer Science and Engineering" },
        { name: "description", label: "Description", type: "textarea" },
        { name: "isActive", label: "Active", type: "checkbox" },
      ]}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "classes", label: "Classes" },
        { key: "subjects", label: "Subjects" },
        { key: "faculty", label: "Faculty" },
        { key: "isActive", label: "Active" },
      ]}
    />
  );
}
