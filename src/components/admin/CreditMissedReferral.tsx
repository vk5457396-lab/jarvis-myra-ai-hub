"use client";

import { useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const fieldClass =
  "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-foreground text-sm font-mono placeholder:text-muted-foreground/60 focus:outline-none focus:border-emerald-500/50 focus-visible:ring-2 focus-visible:ring-emerald-500/30";

/** Backfills a referral commission that was missed at checkout. Amount + buyer come from Razorpay. */
const CreditMissedReferral = ({ onCredited }: { onCredited: () => void }) => {
  const [paymentId, setPaymentId] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId.trim() || !code.trim()) {
      toast.error("Payment ID aur referral code dono daalo");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/referrals/credit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ payment_id: paymentId.trim(), referral_code: code.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Could not credit commission");
        return;
      }
      toast.success(json.message);
      setPaymentId("");
      setCode("");
      onCredited();
    } catch {
      toast.error("Could not credit commission");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5">
      <h2 className="font-display font-bold text-foreground flex items-center gap-2 mb-1">
        <Gift size={18} className="text-emerald-400" aria-hidden="true" /> Credit missed referral commission
      </h2>
      <p className="text-xs text-muted-foreground mb-4">
        For a sale made via a referral link that didn&apos;t earn commission. The amount is read from Razorpay; each payment can only be credited once.
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <label htmlFor="mr-payment" className="block text-xs text-foreground mb-1.5">Razorpay Payment ID</label>
          <input id="mr-payment" placeholder="pay_XXXXXXXXXXXXXX" value={paymentId} onChange={e => setPaymentId(e.target.value)} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="mr-code" className="block text-xs text-foreground mb-1.5">Referral code</label>
          <input id="mr-code" placeholder="63o9c073" value={code} onChange={e => setCode(e.target.value)} className={fieldClass} />
        </div>
        <Button type="submit" disabled={busy} className="min-h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 font-display font-bold">
          {busy ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : "Credit 5%"}
        </Button>
      </div>
    </form>
  );
};

export default CreditMissedReferral;
