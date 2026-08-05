"use client";

import { FormEvent, useMemo, useState } from "react";

type FieldOption = {
  label: string;
  value: string;
};

type FieldConfig = {
  name: string;
  label: string;
  type?: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  required?: boolean;
  options?: FieldOption[];
  placeholder?: string;
};

type CrudRow = Record<string, string | number | boolean | null | undefined> & {
  id: string;
};

type CrudManagerProps = {
  title: string;
  description: string;
  apiPath: string;
  fields: FieldConfig[];
  columns: Array<{ key: string; label: string }>;
  initialRows: CrudRow[];
};

function emptyRecord(fields: FieldConfig[]) {
  return fields.reduce<Record<string, string | boolean>>((acc, field) => {
    acc[field.name] = field.type === "checkbox" ? false : "";
    return acc;
  }, {});
}

export function CrudManager({
  title,
  description,
  apiPath,
  fields,
  columns,
  initialRows,
}: CrudManagerProps) {
  const [rows, setRows] = useState<CrudRow[]>(initialRows);
  const [editing, setEditing] = useState<CrudRow | null>(null);
  const [formState, setFormState] = useState<Record<string, string | boolean>>(
    () => emptyRecord(fields),
  );
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const formTitle = editing ? `Edit ${title.slice(0, -1)}` : `Add ${title.slice(0, -1)}`;

  const sortedRows = useMemo(
    () => [...rows].sort((a, b) => String(a.name ?? a.code ?? "").localeCompare(String(b.name ?? b.code ?? ""))),
    [rows],
  );

  function resetForm() {
    setEditing(null);
    setFormState(emptyRecord(fields));
    setError("");
    setMessage("");
  }

  function startEdit(row: CrudRow) {
    setEditing(row);
    setError("");
    setMessage("");
    setFormState(
      fields.reduce<Record<string, string | boolean>>((acc, field) => {
        const value = row[field.name];
        acc[field.name] = field.type === "checkbox" ? Boolean(value) : String(value ?? "");
        return acc;
      }, {}),
    );
  }

  async function refreshRows() {
    const response = await fetch(apiPath);
    const data = await response.json();
    setRows(data.items ?? []);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const response = await fetch(editing ? `${apiPath}/${editing.id}` : apiPath, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formState),
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      const fieldErrors = data?.issues?.fieldErrors;
      const firstValidationError = fieldErrors
        ? Object.values(fieldErrors).flat().find(Boolean)
        : null;
      setError(String(firstValidationError ?? data?.error ?? "Unable to save record."));
      return;
    }

    await refreshRows();
    resetForm();
    setMessage(editing ? "Record updated." : "Record created.");
  }

  async function deleteRow(row: CrudRow) {
    if (!confirm("Delete this record? This cannot be undone.")) {
      return;
    }

    setError("");
    setMessage("");
    const response = await fetch(`${apiPath}/${row.id}`, { method: "DELETE" });
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      setError(data?.error ?? "Unable to delete record.");
      return;
    }

    await refreshRows();
    if (editing?.id === row.id) {
      resetForm();
    }
    setMessage("Record deleted.");
  }

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
            Master Data
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      <section className="mt-6 grid gap-5 xl:grid-cols-[420px_1fr]">
        <form onSubmit={onSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-950">{formTitle}</h2>
            {editing ? (
              <button type="button" onClick={resetForm} className="text-sm font-medium text-slate-500 hover:text-slate-950">
                Cancel
              </button>
            ) : null}
          </div>

          <div className="space-y-4">
            {fields.map((field) => (
              <label key={field.name} className="block text-sm font-medium text-slate-700">
                {field.type === "checkbox" ? (
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(formState[field.name])}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          [field.name]: event.target.checked,
                        }))
                      }
                    />
                    {field.label}
                  </span>
                ) : (
                  <>
                    {field.label}
                    {field.type === "select" ? (
                      <select
                        required={field.required}
                        value={String(formState[field.name] ?? "")}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="">Select</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === "textarea" ? (
                      <textarea
                        required={field.required}
                        value={String(formState[field.name] ?? "")}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="mt-2 min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      />
                    ) : (
                      <input
                        required={field.required}
                        type={field.type ?? "text"}
                        value={String(formState[field.name] ?? "")}
                        placeholder={field.placeholder}
                        onChange={(event) =>
                          setFormState((current) => ({
                            ...current,
                            [field.name]: event.target.value,
                          }))
                        }
                        className="mt-2 h-11 w-full rounded-md border border-slate-300 px-3 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                      />
                    )}
                  </>
                )}
              </label>
            ))}
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-red-600">{error}</p> : null}
          {message ? <p className="mt-4 text-sm font-medium text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving..." : editing ? "Update record" : "Create record"}
          </button>
        </form>

        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-base font-semibold text-slate-950">Records</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  {columns.map((column) => (
                    <th key={column.key} className="px-5 py-3 font-medium">
                      {column.label}
                    </th>
                  ))}
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedRows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-5 py-3 text-slate-600">
                        {typeof row[column.key] === "boolean"
                          ? row[column.key]
                            ? "Yes"
                            : "No"
                          : String(row[column.key] ?? "-")}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-5 py-3">
                      <button type="button" onClick={() => startEdit(row)} className="mr-3 font-medium text-emerald-700">
                        Edit
                      </button>
                      <button type="button" onClick={() => deleteRow(row)} className="font-medium text-red-600">
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {sortedRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-5 py-8 text-center text-slate-500">
                      No records yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}
