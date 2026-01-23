import { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCashfree } from "@/hooks/useCashfree";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaymentGateway = "razorpay" | "cashfree";

interface PaymentGatewaySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  productName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

const PaymentGatewaySelector = ({
  isOpen,
  onClose,
  amount,
  productName,
  customerName,
  customerEmail,
  customerPhone,
}: PaymentGatewaySelectorProps) => {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>("razorpay");
  const { initiatePayment: initiateRazorpay } = useRazorpay();
  const { initiatePayment: initiateCashfree } = useCashfree();

  const handlePayment = () => {
    const paymentOptions = {
      amount,
      productName,
      customerName,
      customerEmail,
      customerPhone,
    };

    if (selectedGateway === "razorpay") {
      initiateRazorpay(paymentOptions);
    } else {
      initiateCashfree(paymentOptions);
    }
    
    onClose();
  };

  const gateways = [
    {
      id: "razorpay" as const,
      name: "Razorpay",
      description: "UPI, Cards, Netbanking, Wallets",
      icon: CreditCard,
      color: "primary",
    },
    {
      id: "cashfree" as const,
      name: "Cashfree",
      description: "UPI, Cards, Netbanking, EMI",
      icon: Wallet,
      color: "secondary",
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-background/95 backdrop-blur-xl border-white/10">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-center">
            Choose Payment Method
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Display */}
          <div className="text-center mb-6">
            <p className="text-muted-foreground text-sm">Total Amount</p>
            <p className="font-display text-3xl font-bold text-foreground">
              ₹{amount.toLocaleString()}
            </p>
            <p className="text-muted-foreground text-xs mt-1">{productName}</p>
          </div>

          {/* Gateway Options */}
          <div className="space-y-3">
            {gateways.map((gateway) => (
              <motion.button
                key={gateway.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedGateway(gateway.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 flex items-center gap-4 ${
                  selectedGateway === gateway.id
                    ? gateway.id === "razorpay"
                      ? "border-primary bg-primary/10"
                      : "border-secondary bg-secondary/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    selectedGateway === gateway.id
                      ? gateway.id === "razorpay"
                        ? "bg-primary/20"
                        : "bg-secondary/20"
                      : "bg-white/10"
                  }`}
                >
                  <gateway.icon
                    size={24}
                    className={
                      selectedGateway === gateway.id
                        ? gateway.id === "razorpay"
                          ? "text-primary"
                          : "text-secondary"
                        : "text-muted-foreground"
                    }
                  />
                </div>
                <div className="text-left flex-1">
                  <p
                    className={`font-display font-semibold ${
                      selectedGateway === gateway.id
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {gateway.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {gateway.description}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedGateway === gateway.id
                      ? gateway.id === "razorpay"
                        ? "border-primary"
                        : "border-secondary"
                      : "border-white/30"
                  }`}
                >
                  {selectedGateway === gateway.id && (
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        gateway.id === "razorpay" ? "bg-primary" : "bg-secondary"
                      }`}
                    />
                  )}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Pay Button */}
          <Button
            variant={selectedGateway === "razorpay" ? "neonCyan" : "neonPurple"}
            size="xl"
            className="w-full mt-6"
            onClick={handlePayment}
          >
            Pay ₹{amount.toLocaleString()} with {selectedGateway === "razorpay" ? "Razorpay" : "Cashfree"}
          </Button>

          {/* Security Note */}
          <p className="text-center text-xs text-muted-foreground mt-4">
            🔒 Secure payment powered by {selectedGateway === "razorpay" ? "Razorpay" : "Cashfree"}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentGatewaySelector;
