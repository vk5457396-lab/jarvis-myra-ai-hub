import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { invokeBackendFunction } from "@/integrations/backend/invokeFunction";

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

        // Create order via backend function
        const { data, error } = await invokeBackendFunction<{
          key_id: string;
          amount: number;
          currency: string;
          order_id: string;
          error?: string;
        }>("create-razorpay-order", {
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

        // Configure Razorpay options
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: "AI Voice Assistant",
          description: `Purchase ${productName}`,
          order_id: data.order_id,
          handler: async function (response: any) {
            // Payment successful
            console.log("Payment successful:", response);
            
            // Determine product type for database
            let productType = 'bundle';
            const lowerName = productName.toLowerCase();
            if (lowerName.includes('jarvis') && !lowerName.includes('myra') && !lowerName.includes('bundle')) {
              productType = lowerName.includes('source') ? 'jarvis_source' : 'jarvis';
            } else if (lowerName.includes('myra') && !lowerName.includes('jarvis') && !lowerName.includes('bundle')) {
              productType = lowerName.includes('source') ? 'myra_source' : 'myra';
            } else if (lowerName.includes('bundle') || (lowerName.includes('jarvis') && lowerName.includes('myra'))) {
              productType = lowerName.includes('source') ? 'bundle_source' : 'bundle';
            }

            // Send Telegram notification (fire and forget)
            invokeBackendFunction("send-telegram-notification", {
              payment_id: response.razorpay_payment_id,
              product_name: productName,
              product_type: productType,
              amount,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
            }).catch((err) => console.error("Telegram notification error:", err));

            // Navigate with all details for Thank You page
            navigate(
              `/thank-you?product=${encodeURIComponent(productName)}&payment_id=${response.razorpay_payment_id}&amount=${amount}&phone=${encodeURIComponent(customerPhone || '')}`
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
