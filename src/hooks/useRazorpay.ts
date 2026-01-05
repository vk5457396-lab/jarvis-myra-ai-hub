import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getSupabaseClient } from "@/integrations/supabase/getClient";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentOptions {
  amount: number;
  productName: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export const useRazorpay = () => {
  const navigate = useNavigate();

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
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
        // Load Razorpay script
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway");
          return;
        }

        toast.loading("Initializing payment...", { id: "payment-init" });

        const supabase = await getSupabaseClient();
        if (!supabase) {
          toast.dismiss("payment-init");
          toast.error("Site configuration missing. Please redeploy with environment variables.");
          return;
        }

        // Create order via backend function
        const { data, error } = await supabase.functions.invoke("create-razorpay-order", {
          body: {
            amount,
            product_name: productName,
            customer_name: customerName,
            customer_email: customerEmail,
            customer_phone: customerPhone,
          },
        });

        toast.dismiss("payment-init");

        if (error || data?.error) {
          console.error("Order creation error:", error || data?.error);
          toast.error("Failed to initialize payment. Please try again.");
          return;
        }

        // Configure Razorpay options
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: "AI Voice Assistant",
          description: `Purchase ${productName}`,
          order_id: data.order_id,
          handler: function (response: any) {
            // Payment successful
            console.log("Payment successful:", response);
            navigate(
              `/thank-you?product=${encodeURIComponent(productName)}&payment_id=${response.razorpay_payment_id}`
            );
          },
          prefill: {
            name: customerName || "",
            email: customerEmail || "",
            contact: customerPhone || "",
          },
          theme: {
            color: "#00D4FF",
          },
          modal: {
            ondismiss: function () {
              toast.info("Payment cancelled");
            },
          },
        };

        const razorpay = new window.Razorpay(options);
        razorpay.on("payment.failed", function (response: any) {
          console.error("Payment failed:", response.error);
          toast.error(`Payment failed: ${response.error.description}`);
        });

        razorpay.open();
      } catch (error) {
        console.error("Payment error:", error);
        toast.error("Something went wrong. Please try again.");
      }
    },
    [navigate]
  );

  return { initiatePayment };
};
