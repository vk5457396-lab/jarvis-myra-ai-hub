import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from "recharts";
import { LicenseRow, effectiveStatus, planLabel } from "@/lib/licenses";

const COLORS = ["#8b5cf6", "#06b6d4", "#a78bfa", "#ef4444", "#22d3ee"];

const LicenseAnalytics = ({ licenses }: { licenses: LicenseRow[] }) => {
  const byPlan = useMemo(() => {
    const map = new Map<string, number>();
    licenses.forEach((l) => map.set(l.plan, (map.get(l.plan) ?? 0) + 1));
    return [...map].map(([plan, value]) => ({ name: planLabel(plan), value }));
  }, [licenses]);

  const byStatus = useMemo(() => {
    const map = new Map<string, number>();
    licenses.forEach((l) => {
      const s = effectiveStatus(l);
      map.set(s, (map.get(s) ?? 0) + 1);
    });
    return [...map].map(([name, count]) => ({ name, count }));
  }, [licenses]);

  const timeline = useMemo(() => {
    const days: { date: string; generated: number; activated: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        generated: licenses.filter((l) => l.created_at.slice(0, 10) === key).length,
        activated: licenses.filter((l) => (l.activated_at ?? "").slice(0, 10) === key).length,
      });
    }
    return days;
  }, [licenses]);

  const card = "license-glass p-5";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-2">
      <div className={card}>
        <h3 className="mb-4 text-sm font-semibold">Licenses by Plan</h3>
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={byPlan} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={4}>
              {byPlan.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(222 35% 10%)", border: "1px solid hsl(222 25% 20%)", borderRadius: 12 }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className={card}>
        <h3 className="mb-4 text-sm font-semibold">Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={byStatus}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 20%)" />
            <XAxis dataKey="name" stroke="hsl(215 20% 65%)" fontSize={12} />
            <YAxis stroke="hsl(215 20% 65%)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(222 35% 10%)", border: "1px solid hsl(222 25% 20%)", borderRadius: 12 }} />
            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`${card} lg:col-span-2`}>
        <h3 className="mb-4 text-sm font-semibold">Last 14 Days — Generated vs Activated</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={timeline}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 25% 20%)" />
            <XAxis dataKey="date" stroke="hsl(215 20% 65%)" fontSize={12} />
            <YAxis stroke="hsl(215 20% 65%)" fontSize={12} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "hsl(222 35% 10%)", border: "1px solid hsl(222 25% 20%)", borderRadius: 12 }} />
            <Legend />
            <Line type="monotone" dataKey="generated" stroke="#8b5cf6" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="activated" stroke="#06b6d4" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

export default LicenseAnalytics;
