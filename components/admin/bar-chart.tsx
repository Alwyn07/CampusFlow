type BarDatum = {
  label: string;
  value: number;
};

export function BarChart({ title, data }: { title: string; data: BarDatum[] }) {
  const max = Math.max(...data.map((item) => item.value), 1);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 space-y-4">
        {data.map((item) => (
          <div key={item.label}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600">{item.label}</span>
              <span className="text-slate-500">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-emerald-600"
                style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
