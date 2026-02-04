import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Copy, Check, Wallet, ArrowRight, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BinancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  amount: number;
}

const BINANCE_PAY_ID = "373628182"; // Your Binance Pay ID

const BinancePaymentModal = ({ isOpen, onClose, productName, amount }: BinancePaymentModalProps) => {
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"info" | "confirm">("info");

  const copyPayId = () => {
    navigator.clipboard.writeText(BINANCE_PAY_ID);
    setCopied(true);
    toast.success("Binance Pay ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToTelegram = () => {
    if (!transactionId.trim()) {
      toast.error("Please enter your Transaction ID");
      return;
    }

    const message = encodeURIComponent(
      `🪙 Binance Payment Verification\n\n` +
      `📦 Product: ${productName}\n` +
      `💰 Amount: $${(amount / 83).toFixed(2)} USD (~₹${amount})\n` +
      `🆔 Transaction ID: ${transactionId}\n\n` +
      `Please verify my Binance payment and activate my product.`
    );

    window.open(`https://t.me/codeninjavik1?text=${message}`, "_blank");
    onClose();
    toast.success("Redirecting to Telegram...");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-amber-500/30"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Binance Payment
              </h2>
              <p className="text-sm text-muted-foreground">For International Users</p>
            </div>
          </div>

          {step === "info" ? (
            <>
              {/* Product Info */}
              <div className="glass rounded-xl p-4 mb-4 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Product:</span>
                  <span className="font-display text-primary font-semibold">{productName}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-display text-foreground">
                    <span className="text-amber-400">${(amount / 83).toFixed(2)}</span>
                    <span className="text-muted-foreground text-sm ml-2">(~₹{amount})</span>
                  </span>
                </div>
              </div>

              {/* Binance Pay ID */}
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Send payment to this Binance Pay ID:
                </Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 glass rounded-lg p-3 font-mono text-lg text-amber-400 tracking-wider">
                    {BINANCE_PAY_ID}
                  </div>
                  <button
                    onClick={copyPayId}
                    className="p-3 rounded-lg glass hover:bg-white/10 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="glass rounded-xl p-4 mb-6 bg-amber-500/5 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <QrCode className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground mb-1">How to pay:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Open Binance App → Pay → Send</li>
                      <li>Enter Pay ID: <span className="text-amber-400">{BINANCE_PAY_ID}</span></li>
                      <li>Send <span className="text-primary">${(amount / 83).toFixed(2)} USDT</span></li>
                      <li>Copy your Transaction ID</li>
                    </ol>
                  </div>
                </div>
              </div>

              <Button
                variant="neonCyan"
                size="lg"
                className="w-full gap-2"
                onClick={() => setStep("confirm")}
              >
                I've Made the Payment
                <ArrowRight className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              {/* Transaction ID Input */}
              <div className="mb-6">
                <Label htmlFor="txnId" className="text-sm text-muted-foreground mb-2 block">
                  Enter your Binance Transaction ID:
                </Label>
                <Input
                  id="txnId"
                  placeholder="e.g., 1234567890123456"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="bg-background/50 border-primary/30 text-lg font-mono tracking-wide"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Find this in Binance App → Wallet → Transaction History
                </p>
              </div>

              {/* Summary */}
              <div className="glass rounded-xl p-4 mb-6 border border-primary/20">
                <h3 className="font-display text-sm font-semibold text-foreground mb-3">
                  Payment Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product:</span>
                    <span className="text-primary">{productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="text-amber-400">${(amount / 83).toFixed(2)} USDT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono text-foreground truncate max-w-[150px]">
                      {transactionId || "---"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="lg"
                  className="flex-1"
                  onClick={() => setStep("info")}
                >
                  Back
                </Button>
                <Button
                  variant="neonCyan"
                  size="lg"
                  className="flex-1 gap-2"
                  onClick={handleSendToTelegram}
                >
                  <Send className="w-4 h-4" />
                  Send to Admin
                </Button>
              </div>
            </>
          )}

          {/* Footer Note */}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Payment will be verified manually. Activation within 1 hour.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BinancePaymentModal;
