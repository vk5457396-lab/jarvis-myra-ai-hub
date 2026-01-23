import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { invokeBackendFunction } from "@/integrations/backend/invokeFunction";

declare global {
  interface Window {
    Cashfree: any;
  }
}

interface PaymentOptions {
  amount: number;
  productName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export const useCashfree = () => {
  const navigate = useNavigate();

  const loadCashfreeScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Cashfree) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = useCallback(
    async ({
      amount,
      productName,
      customerName,
      customerEmail,
      customerPhone,
    }: PaymentOptions) => {
      try {
        // Load Cashfree script
        const scriptLoaded = await loadCashfreeScript();
        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway");
          return;
        }

        toast.loading("Initializing payment...", { id: "payment-init" });

        // Create order via backend function
        const { data, error } = await invokeBackendFunction<{
          order_id: string;
          payment_session_id: string;
          order_amount: number;
          order_currency: string;
          error?: string;
        }>("create-cashfree-order", {
          amount,
          product_name: productName,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        });

        toast.dismiss("payment-init");

        if (error || data?.error) {
          console.error("Order creation error:", error || data?.error);
          toast.error("Failed to initialize payment. Please try again.");
          return;
        }

        // Initialize Cashfree checkout
        const cashfree = window.Cashfree({
          mode: "production", // Use "sandbox" for testing
        });

        const checkoutOptions = {
          paymentSessionId: data.payment_session_id,
          redirectTarget: "_modal",
        };

        cashfree.checkout(checkoutOptions).then((result: any) => {
          if (result.error) {
            console.error("Cashfree payment error:", result.error);
            toast.error(`Payment failed: ${result.error.message}`);
          } else if (result.paymentDetails) {
            console.log("Payment successful:", result.paymentDetails);
            navigate(
              `/thank-you?product=${encodeURIComponent(productName)}&payment_id=${result.paymentDetails.paymentId || data.order_id}`
            );
          } else if (result.redirect) {
            // Payment requires redirect, handled automatically
            console.log("Payment redirecting...");
          }
        });
      } catch (error) {
        console.error("Payment error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    },
    [navigate]
  );

  return { initiatePayment };
};
