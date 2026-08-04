"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Copy, Download, FileSpreadsheet, Printer, Loader2, Sparkles } from "lucide-react";
import {
  LicensePlan, PLAN_OPTIONS, downloadFile,
} from "@/lib/licenses";

interface Props {
  onGenerated: () => void;
  settings: { prefix: string; random_length: number };
}

const QUICK = [1, 5, 10, 50, 100];

const GenerateLicense = ({ onGenerated, settings }: Props) => {
  const [plan, setPlan] = useState<LicensePlan>("lifetime");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const handleGenerate = async () => {
    const qty = Math.max(1, Math.min(500, Math.floor(quantity) || 1));
    setLoading(true);
    try {
      const res = await fetch("/api/license/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          plan,
          quantity: qty,
          prefix: settings.prefix || undefined,
          length: settings.random_length || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to generate licenses");

      const keys: string[] = json.data.keys;
      setGenerated(keys);
      setOpen(true);
      onGenerated();
      toast.success(`${keys.length} license${keys.length > 1 ? "s" : ""} generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to generate licenses");
    } finally {
      setLoading(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(generated.join("\n"));
    toast.success("All keys copied");
  };

  const printKeys = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<pre style="font-family:Inter,monospace;font-size:14px">${generated.join("\n")}</pre>`
    );
    w.document.close();
    w.print();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="license-glass mx-auto max-w-2xl p-6 sm:p-8"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-primary/15 p-3">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Generate License Keys</h2>
            <p className="text-sm text-muted-foreground">Secure, unique, ready to distribute.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label>License Type</Label>
            <Select value={plan} onValueChange={(v) => setPlan(v as LicensePlan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PLAN_OPTIONS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="qty">Quantity</Label>
            <Input
              id="qty"
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              {QUICK.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setQuantity(q)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    quantity === q
                      ? "border-primary bg-primary/20 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={loading} className="w-full" size="lg">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Generate License
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Expiry starts only after the first device activation. Lifetime keys never expire.
          </p>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="license-admin max-w-lg">
          <DialogHeader>
            <DialogTitle>{generated.length} licenses generated</DialogTitle>
            <DialogDescription>Copy or export the keys now — they're saved in your database.</DialogDescription>
          </DialogHeader>
          <div className="max-h-64 overflow-auto rounded-xl border border-border bg-muted/40 p-3 font-mono text-xs">
            {generated.map((k) => <div key={k} className="py-0.5">{k}</div>)}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Button variant="secondary" size="sm" onClick={copyAll}>
              <Copy className="mr-1 h-3.5 w-3.5" /> Copy All
            </Button>
            <Button variant="secondary" size="sm" onClick={() => downloadFile("myra-licenses.txt", generated.join("\n"))}>
              <Download className="mr-1 h-3.5 w-3.5" /> TXT
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => downloadFile("myra-licenses.csv", ["License Key", ...generated].join("\n"), "text/csv")}
            >
              <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={printKeys}>
              <Printer className="mr-1 h-3.5 w-3.5" /> Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GenerateLicense;