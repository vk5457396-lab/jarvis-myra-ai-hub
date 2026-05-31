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
  productId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  isInternational?: boolean;
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
      productId,
      customerName,
      customerEmail,
      customerPhone,
      isInternational,
    }: PaymentOptions) => {
      try {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          toast.error("Failed to load payment gateway");
          return;
        }

        toast.loading("Initializing payment...", { id: "payment-init" });

        // Backend controls the price — we only send product_id
        const { data, error } = await invokeBackendFunction<{
          key_id: string;
          amount: number;
          currency: string;
          order_id: string;
          product_name: string;
          display_amount: number;
          error?: string;
        }>("create-razorpay-order", {
          product_id: productId,
          customer_name: customerName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          is_international: isInternational || false,
        });

        toast.dismiss("payment-init");

        if (error || data?.error) {
          toast.error("Failed to initialize payment. Please try again.");
          return;
        }

        const productName = data.product_name;
        const amount = data.display_amount;

        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: data.currency,
          name: "AI Voice Assistant",
          description: `Purchase ${productName}`,
          order_id: data.order_id,
          handler: async function (response: any) {
            
            let productType = 'bundle';
            const lowerName = productName.toLowerCase();
            if (lowerName.includes('aria') && !lowerName.includes('source')) {
              productType = 'aria';
            } else if (lowerName.includes('jarvis') && !lowerName.includes('myra') && !lowerName.includes('bundle')) {
              productType = lowerName.includes('source') ? 'jarvis_source' : 'jarvis';
            } else if (lowerName.includes('myra') && !lowerName.includes('jarvis') && !lowerName.includes('bundle')) {
              productType = lowerName.includes('source') ? 'myra_source' : 'myra';
            } else if (lowerName.includes('bundle') || (lowerName.includes('jarvis') && lowerName.includes('myra'))) {
              productType = lowerName.includes('source') ? 'bundle_source' : 'bundle';
            }

            // Check if user was referred
            const refCode = new URLSearchParams(window.location.search).get("ref") || localStorage.getItem("referral_code");
            
            invokeBackendFunction("send-telegram-notification", {
              payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              product_name: productName,
              product_type: productType,
              amount,
              customer_name: customerName,
              customer_email: customerEmail,
              customer_phone: customerPhone,
              referral_code: refCode || undefined,
            }).catch(() => {});


            try {
              sessionStorage.setItem(
                'payment_confirmation',
                JSON.stringify({
                  product: productName,
                  payment_id: response.razorpay_payment_id,
                  amount,
                  phone: customerPhone || '',
                  ts: Date.now(),
                })
              );
            } catch {
              // ignore storage errors
            }
            navigate('/thank-you');
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
          toast.error(`Payment failed: ${response?.error?.description ?? "Please try again."}`);
        });

        razorpay.open();
      } catch {
        toast.error("Something went wrong. Please try again.");
      }
    },
    [navigate]
  );

  return { initiatePayment };
};
