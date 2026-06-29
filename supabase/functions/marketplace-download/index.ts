import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createHmac } from "node:crypto";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const {
      product_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      customer_name,
      customer_email,
    } = body;

    if (!product_id) throw new Error("product_id required");

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: product, error } = await admin
      .from("marketplace_products")
      .select("id, title, price, file_path, is_published")
      .eq("id", product_id)
      .maybeSingle();

    if (error || !product || !product.is_published) throw new Error("Product not found");
    if (!product.file_path) throw new Error("Download file is not available yet");

    // Identify user (optional)
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: u } = await userClient.auth.getUser();
      userId = u?.user?.id ?? null;
    }

    // Paid products: verify razorpay signature
    if (product.price > 0) {
      if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
        throw new Error("Payment verification details missing");
      }
      const expected = createHmac("sha256", RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");
      if (expected !== razorpay_signature) throw new Error("Invalid payment signature");
    }

    // Signed URL (15 min)
    const { data: signed, error: signErr } = await admin.storage
      .from("marketplace-files")
      .createSignedUrl(product.file_path, 900, { download: true });

    if (signErr || !signed?.signedUrl) throw new Error("Failed to create download link");

    // Log download
    await admin.from("marketplace_downloads").insert({
      product_id: product.id,
      user_id: userId,
      customer_email: customer_email ?? null,
      customer_name: customer_name ?? null,
      amount: product.price,
      payment_id: razorpay_payment_id ?? null,
      razorpay_order_id: razorpay_order_id ?? null,
    });

    await admin
      .from("marketplace_products")
      .update({ download_count: (await admin.rpc as unknown as () => void) ? undefined : undefined })
      .eq("id", product.id);
    // increment download_count via raw update
    await admin.rpc("noop_just_increment" as never).catch(() => {});
    await admin
      .from("marketplace_products")
      .update({ download_count: (product as { download_count?: number }).download_count ?? 0 })
      .eq("id", product.id);

    return new Response(
      JSON.stringify({ download_url: signed.signedUrl, product_title: product.title }),
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
