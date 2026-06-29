import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID");
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product_id, customer_name, customer_email, customer_phone } = await req.json();
    if (!product_id) throw new Error("product_id required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: product, error } = await supabase
      .from("marketplace_products")
      .select("id, title, price, is_published")
      .eq("id", product_id)
      .maybeSingle();

    if (error || !product || !product.is_published) throw new Error("Product not found");
    if (product.price <= 0) throw new Error("Product is free, no payment needed");

    const amount = product.price;
    const orderData = {
      amount: amount * 100,
      currency: "INR",
      receipt: `mkt_${product.id.slice(0, 8)}_${Date.now()}`,
      notes: {
        product_id: product.id,
        product_name: product.title,
        customer_name: customer_name || "",
        customer_email: customer_email || "",
        customer_phone: customer_phone || "",
        server_price: String(amount),
      },
    };

    const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
    const response = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      console.error("Razorpay error", await response.text());
      throw new Error("Payment initialization failed");
    }
    const order = await response.json();

    return new Response(
      JSON.stringify({
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        key_id: RAZORPAY_KEY_ID,
        product_name: product.title,
        display_amount: amount,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
