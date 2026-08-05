import { CrudManager } from "@/components/admin/crud-manager";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FacultyPage() {
  const [faculty, departments] = await Promise.all([
    prisma.faculty.findMany({
      orderBy: { employeeCode: "asc" },
      include: { user: true, department: true },
    }),
    prisma.department.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <CrudManager
      title="Faculty"
      description="Maintain faculty accounts and availability used for invigilation duty allocation."
      apiPath="/api/faculty"
      initialRows={faculty.map((item) => ({
        id: item.id,
        departmentId: item.departmentId,
        employeeCode: item.employeeCode,
        designation: item.designation,
        facultyType: item.facultyType,
        maxDutiesPerDay: item.maxDutiesPerDay,
        maxDutiesPerWeek: item.maxDutiesPerWeek,
        isAvailableForDuty: item.isAvailableForDuty,
        name: item.user.name,
        email: item.user.email,
        phone: item.user.phone,
        departmentName: item.department.name,
      }))}
      fields={[
        {
          name: "departmentId",
          label: "Department",
          type: "select",
          required: true,
          options: departments.map((department) => ({ label: `${department.code} - ${department.name}`, value: department.id })),
        },
        { name: "name", label: "Name", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        { name: "phone", label: "Phone" },
        { name: "employeeCode", label: "Employee code", required: true },
        { name: "designation", label: "Designation", required: true },
        {
          name: "facultyType",
          label: "Faculty type",
          type: "select",
          required: true,
          options: ["PERMANENT", "CONTRACT", "GUEST", "VISITING"].map((value) => ({ label: value, value })),
        },
        { name: "maxDutiesPerDay", label: "Max duties/day", type: "number", required: true },
        { name: "maxDutiesPerWeek", label: "Max duties/week", type: "number", required: true },
        { name: "isAvailableForDuty", label: "Available for duty", type: "checkbox" },
      ]}
      columns={[
        { key: "employeeCode", label: "Code" },
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "departmentName", label: "Department" },
        { key: "designation", label: "Designation" },
        { key: "isAvailableForDuty", label: "Available" },
      ]}
    />
  );
}
