import { useEffect } from "react";
import { useRazorpay } from "@/hooks/useRazorpay";

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
  const { initiatePayment } = useRazorpay();

  useEffect(() => {
    if (isOpen) {
      initiatePayment({
        amount,
        productName,
        customerName,
        customerEmail,
        customerPhone,
      });
      onClose();
    }
  }, [isOpen, amount, productName, customerName, customerEmail, customerPhone, initiatePayment, onClose]);

  return null;
};

export default PaymentGatewaySelector;
