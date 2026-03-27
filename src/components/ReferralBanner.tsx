import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ReferralBanner = () => {
  const [searchParams] = useSearchParams();
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (!refCode) return;

    const fetchReferrer = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, referral_code")
        .eq("referral_code", refCode)
        .maybeSingle();

      if (data?.full_name) {
        setReferrerName(data.full_name);
        setVisible(true);
      }
    };

    fetchReferrer();
  }, [refCode]);

  if (!visible || !referrerName) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-16 md:top-20 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none"
        >
          <div className="pointer-events-auto flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-primary/20 border border-emerald-500/30 backdrop-blur-xl shadow-lg shadow-emerald-500/10 max-w-md">
            <Gift className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-sm text-foreground">
              <span className="font-bold text-emerald-400">{referrerName}</span>{" "}
              invited you! 🎉
            </p>
            <button
              onClick={() => setVisible(false)}
              className="text-muted-foreground hover:text-foreground ml-auto shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReferralBanner;
