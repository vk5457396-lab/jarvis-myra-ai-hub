import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Copy, Check, Wallet, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import binanceQR from "@/assets/binance-qr.png";

interface BinancePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  amount: number;
}

const BINANCE_PAY_ID = "373628182";

const BinancePaymentModal = ({ isOpen, onClose, productName, amount }: BinancePaymentModalProps) => {
  const [transactionId, setTransactionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<"qr" | "confirm">("qr");

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
    setStep("qr");
    setTransactionId("");
    toast.success("Redirecting to Telegram...");
  };

  const handleClose = () => {
    onClose();
    setStep("qr");
    setTransactionId("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative w-full max-w-md glass-card rounded-2xl p-6 border border-amber-500/30 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
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
              <p className="text-sm text-muted-foreground">Scan QR to Pay</p>
            </div>
          </div>

          {step === "qr" ? (
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
                    <span className="text-amber-400 text-lg font-bold">${(amount / 83).toFixed(2)} USDT</span>
                    <span className="text-muted-foreground text-sm ml-2">(~₹{amount})</span>
                  </span>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="flex flex-col items-center mb-4">
                <div className="relative p-4 bg-white rounded-2xl shadow-lg shadow-amber-500/20">
                  <img 
                    src={binanceQR} 
                    alt="Binance Pay QR Code" 
                    className="w-48 h-48 object-contain"
                  />
                  {/* Binance Logo Overlay Effect */}
                  <div className="absolute inset-0 rounded-2xl ring-2 ring-amber-500/30 pointer-events-none" />
                </div>
                <p className="text-sm text-muted-foreground mt-3 text-center">
                  Scan with <span className="text-amber-400 font-semibold">Binance App</span> to pay
                </p>
              </div>

              {/* Pay ID Section */}
              <div className="mb-4">
                <Label className="text-sm text-muted-foreground mb-2 block text-center">
                  Or send to Pay ID:
                </Label>
                <div className="flex items-center gap-2 justify-center">
                  <div className="glass rounded-lg px-4 py-2 font-mono text-lg text-amber-400 tracking-wider">
                    {BINANCE_PAY_ID}
                  </div>
                  <button
                    onClick={copyPayId}
                    className="p-2 rounded-lg glass hover:bg-white/10 transition-colors"
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
                <p className="text-sm text-muted-foreground text-center">
                  <span className="font-semibold text-foreground">Steps:</span> Open Binance → Pay → Scan QR → 
                  Send <span className="text-amber-400 font-semibold">${(amount / 83).toFixed(2)} USDT</span> → 
                  Copy Transaction ID
                </p>
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
                  onClick={() => setStep("qr")}
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
            Payment verified manually. Activation within 1 hour.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BinancePaymentModal;
