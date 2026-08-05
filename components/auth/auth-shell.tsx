type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 lg:grid-cols-[1fr_440px]">
        <section className="flex flex-col justify-between px-6 py-8 sm:px-10 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
              ED
            </div>
            <div>
              <p className="text-sm font-semibold">CampusFlow</p>
              <p className="text-xs text-slate-500">College Examination Management</p>
            </div>
          </div>

          <div className="max-w-2xl py-16">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
              {eyebrow}
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              {title}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              {description}
            </p>
          </div>

          <p className="text-xs text-slate-500">
            Secure access for administrators, faculty, and students.
          </p>
        </section>

        <section className="flex items-center px-6 py-8 sm:px-10 lg:px-0">
          <div className="w-full rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
