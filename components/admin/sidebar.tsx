"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/examinations", label: "Examinations" },
  { href: "/admin/ocr", label: "Mark Sheet OCR" },
  { href: "/admin/departments", label: "Departments" },
  { href: "/admin/classes", label: "Classes" },
  { href: "/admin/subjects", label: "Subjects" },
  { href: "/admin/faculty", label: "Faculty" },
  { href: "/admin/students", label: "Students" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-slate-200 bg-white lg:min-h-screen lg:border-r">
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
          ED
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-950">CampusFlow</p>
          <p className="text-xs text-slate-500">Admin Portal</p>
        </div>
      </div>
      <nav className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:overflow-visible">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="hidden p-3 lg:block">
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-left text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
