"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { generateKey } from "@/lib/licenses";

export interface LicenseSettingsValue {
  prefix: string;
  random_length: number;
  max_activations: number;
  device_lock: boolean;
  offline_activation: boolean;
}

interface Props {
  value: LicenseSettingsValue;
  onSaved: () => void;
}

const LicenseSettings = ({ value, onSaved }: Props) => {
  const [form, setForm] = useState<LicenseSettingsValue>(value);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("license_settings")
      .update({
        prefix: form.prefix.trim().toUpperCase() || "MYRA",
        random_length: Math.max(8, Math.min(32, Number(form.random_length) || 16)),
        max_activations: Math.max(1, Number(form.max_activations) || 1),
        device_lock: form.device_lock,
        offline_activation: form.offline_activation,
      })
      .eq("id", true);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Settings saved");
    onSaved();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="license-glass mx-auto max-w-2xl p-6 sm:p-8">
      <h2 className="text-lg font-semibold">License Settings</h2>
      <p className="mb-6 text-sm text-muted-foreground">Control how new keys are generated and activated.</p>

      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="prefix">Key Prefix</Label>
            <Input id="prefix" value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="len">Key Length (random chars)</Label>
            <Input id="len" type="number" min={8} max={32} value={form.random_length}
              onChange={(e) => setForm({ ...form, random_length: Number(e.target.value) })} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Preview</p>
          <p className="mt-1 font-mono text-sm text-primary">
            {generateKey(form.prefix.trim().toUpperCase() || "MYRA", form.random_length || 16)}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="max">Max Activations per Key</Label>
          <Input id="max" type="number" min={1} value={form.max_activations}
            onChange={(e) => setForm({ ...form, max_activations: Number(e.target.value) })} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Device Lock</p>
            <p className="text-xs text-muted-foreground">Bind each key to the first device that activates it.</p>
          </div>
          <Switch checked={form.device_lock} onCheckedChange={(v) => setForm({ ...form, device_lock: v })} />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <div>
            <p className="text-sm font-medium">Offline Activation</p>
            <p className="text-xs text-muted-foreground">Allow MYRA to activate without a live connection.</p>
          </div>
          <Switch checked={form.offline_activation} onCheckedChange={(v) => setForm({ ...form, offline_activation: v })} />
        </div>

        <Button onClick={save} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </motion.div>
  );
};

export default LicenseSettings;