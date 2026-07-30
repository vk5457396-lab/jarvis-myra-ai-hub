import { motion } from "framer-motion";
import { KeyRound, CheckCircle2, ShieldCheck, TimerOff, Infinity as InfinityIcon, CalendarClock } from "lucide-react";
import { LicenseRow, effectiveStatus } from "@/lib/licenses";

interface Props {
  licenses: LicenseRow[];
}

const LicenseStats = ({ licenses }: Props) => {
  const statuses = licenses.map(effectiveStatus);
  const stats = [
    { label: "Total Licenses", value: licenses.length, icon: KeyRound, tone: "text-primary" },
    { label: "Available", value: statuses.filter((s) => s === "available").length, icon: ShieldCheck, tone: "text-accent" },
    { label: "Activated", value: statuses.filter((s) => s === "activated").length, icon: CheckCircle2, tone: "text-secondary" },
    { label: "Expired", value: statuses.filter((s) => s === "expired").length, icon: TimerOff, tone: "text-destructive" },
    { label: "Lifetime", value: licenses.filter((l) => l.plan === "lifetime").length, icon: InfinityIcon, tone: "text-primary" },
    { label: "Monthly", value: licenses.filter((l) => l.plan !== "lifetime").length, icon: CalendarClock, tone: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className="license-glass p-4"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
            <s.icon className={`h-4 w-4 ${s.tone}`} />
          </div>
          <motion.p
            key={s.value}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-3 text-2xl font-semibold tracking-tight"
          >
            {s.value.toLocaleString("en-IN")}
          </motion.p>
        </motion.div>
      ))}
    </div>
  );
};

export default LicenseStats;
