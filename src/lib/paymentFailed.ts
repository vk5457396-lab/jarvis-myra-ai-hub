import { toast } from "sonner";

/**
 * Shown when Razorpay reports `payment.failed`. No key or product is issued for a failed payment
 * (verify only runs on success and re-checks the payment status server-side). We don't promise
 * "no money was taken": banks occasionally debit a failed payment and refund it automatically.
 */
export function showPaymentFailed(response?: { error?: { description?: string; reason?: string } }) {
  const reason = response?.error?.description;
  toast.error("Payment failed", {
    id: "payment-failed", // Razorpay can fire this more than once per attempt; show one toast
    description: `${reason ? `${reason} ` : ""}Nothing was purchased. If money was deducted, your bank will refund it automatically (usually within 5–7 working days). Please try again.`,
    duration: 10000,
  });
}
