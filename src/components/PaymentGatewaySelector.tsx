"use client";

import { useEffect } from "react";
import { useRazorpay } from "@/hooks/useRazorpay";
import { useCurrency } from "@/hooks/useCurrency";

interface PaymentGatewaySelectorProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

const PaymentGatewaySelector = ({
  isOpen,
  onClose,
  productId,
  customerName,
  customerEmail,
  customerPhone,
}: PaymentGatewaySelectorProps) => {
  const { initiatePayment } = useRazorpay();
  const { isIndia } = useCurrency();

  useEffect(() => {
    if (isOpen) {
      initiatePayment({
        productId,
        customerName,
        customerEmail,
        customerPhone,
        isInternational: !isIndia,
      });
      onClose();
    }
  }, [isOpen, productId, customerName, customerEmail, customerPhone, isIndia, initiatePayment, onClose]);

  return null;
};

export default PaymentGatewaySelector;