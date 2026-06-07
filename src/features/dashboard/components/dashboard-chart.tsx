import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export function DashboardChart({ title, type, data }: { title: string; type: string; data: Array<Record<string, unknown>> }) {
  if (!data?.length) {
    return (
      <div className="dashboard-chart-empty">
        <h4>{title}</h4>
        <p className="muted">No chart data available yet.</p>
      </div>
    );
  }

  const series = data.map((item) => ({
    label: String(item.label ?? item.name ?? "-"),
    count: Number(item.count ?? item.value ?? 0)
  }));

  return (
    <div className="dashboard-chart">
      <h4>{title}</h4>
      <div style={{ width: "100%", height: 240 }}>
        <ResponsiveContainer>
          {type === "pie" ? (
            <PieChart>
              <Pie data={series} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                {series.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          ) : type === "bar" ? (
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
