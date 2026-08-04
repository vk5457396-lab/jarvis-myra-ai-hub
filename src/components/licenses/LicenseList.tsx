"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Copy, Trash2, Ban, RotateCcw, Search, Download, FileSpreadsheet, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  LicenseRow, effectiveStatus, planLabel, fmtDate, downloadFile, licensesToCsv,
} from "@/lib/licenses";

interface Props {
  licenses: LicenseRow[];
  onRefresh: () => void;
}

const PAGE_SIZE = 10;

const statusStyles: Record<string, string> = {
  available: "bg-accent/15 text-accent border-accent/30",
  activated: "bg-secondary/15 text-secondary border-secondary/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
  disabled: "bg-muted text-muted-foreground border-border",
};

const LicenseList = ({ licenses, onRefresh }: Props) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return licenses.filter((l) => {
      const st = effectiveStatus(l);
      if (statusFilter !== "all" && st !== statusFilter) return false;
      if (planFilter !== "all" && l.plan !== planFilter) return false;
      if (!q) return true;
      return (
        l.license_key.toLowerCase().includes(q) ||
        (l.device_id ?? "").toLowerCase().includes(q)
      );
    });
  }, [licenses, search, statusFilter, planFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const toggleAll = () =>
    setSelected(allChecked ? selected.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...selected, ...rows.map((r) => r.id)])]);

  const toggleOne = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const runUpdate = async (ids: string[], payload: Record<string, unknown>, message: string) => {
    const { error } = await supabase.from("licenses").update(payload as never).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(message);
    setSelected([]);
    onRefresh();
  };

  const runDelete = async (ids: string[]) => {
    const { error } = await supabase.from("licenses").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success(`${ids.length} license(s) deleted`);
    setSelected([]);
    onRefresh();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="license-glass p-4 sm:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search license key or device ID..."
            className="pl-9"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="activated">Activated</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={(v) => { setPlanFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Plan" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="1_month">1 Month</SelectItem>
              <SelectItem value="2_months">2 Months</SelectItem>
              <SelectItem value="lifetime">Lifetime</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" size="icon" title="Export CSV"
            onClick={() => downloadFile("licenses.csv", licensesToCsv(filtered), "text/csv")}>
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" title="Export TXT"
            onClick={() => downloadFile("licenses.txt", filtered.map((l) => l.license_key).join("\n"))}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2">
          <span className="text-sm">{selected.length} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => runUpdate(selected, { status: "disabled" }, "Licenses disabled")}>
              <Ban className="mr-1 h-3.5 w-3.5" /> Disable
            </Button>
            <Button size="sm" variant="secondary"
              onClick={() => runUpdate(selected, { status: "available", device_id: null, activated_at: null, expires_at: null }, "Licenses reset")}>
              <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset Device
            </Button>
            <Button size="sm" variant="destructive" onClick={() => runDelete(selected)}>
              <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={toggleAll} /></TableHead>
              <TableHead>License Key</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Activated</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  No licenses found.
                </TableCell>
              </TableRow>
            )}
            {rows.map((l) => {
              const st = effectiveStatus(l);
              return (
                <TableRow key={l.id} className="hover:bg-primary/5">
                  <TableCell><Checkbox checked={selected.includes(l.id)} onCheckedChange={() => toggleOne(l.id)} /></TableCell>
                  <TableCell className="font-mono text-xs">{l.license_key}</TableCell>
                  <TableCell className="text-sm">{planLabel(l.plan)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full border px-2 py-0.5 text-xs capitalize ${statusStyles[st] ?? ""}`}>{st}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(l.created_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmtDate(l.activated_at)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.plan === "lifetime" ? "Never" : fmtDate(l.expires_at)}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-xs text-muted-foreground">{l.device_id ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Copy key"
                        onClick={() => { navigator.clipboard.writeText(l.license_key); toast.success("Key copied"); }}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" title={st === "disabled" ? "Enable" : "Disable"}
                        onClick={() => runUpdate([l.id], { status: st === "disabled" ? "available" : "disabled" }, "Status updated")}>
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Reset device"
                        onClick={() => runUpdate([l.id], { status: "available", device_id: null, activated_at: null, expires_at: null }, "Device reset")}>
                        <RotateCcw className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" title="Delete" onClick={() => runDelete([l.id])}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>{filtered.length} license(s)</span>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="secondary" disabled={current === 0} onClick={() => setPage(current - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>Page {current + 1} / {pageCount}</span>
          <Button size="icon" variant="secondary" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default LicenseList;