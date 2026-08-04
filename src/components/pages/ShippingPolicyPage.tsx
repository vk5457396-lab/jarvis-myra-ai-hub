"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl font-bold text-foreground mb-8">Shipping & Delivery Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: January 2, 2026</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Digital Product Delivery</h2>
              <p>
                We primarily offer digital products that are delivered electronically. No
                physical shipping is involved for digital products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Delivery Method</h2>
              <p className="mb-4">Digital products are delivered through:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Instant access after successful payment confirmation</li>
                <li>Download links sent to your registered email</li>
                <li>Access credentials provided via Telegram</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Delivery Timeline</h2>
              <p className="mb-4">Expected delivery times:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Instant Delivery:</strong> Most digital products are delivered immediately after payment</li>
                <li><strong>Manual Processing:</strong> Some products may require up to 24 hours for delivery</li>
                <li><strong>Support Response:</strong> Contact us if not received within 24 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Order Confirmation</h2>
              <p className="mb-4">After successful payment:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>You will be redirected to a Thank You page with order details</li>
                <li>Order confirmation will be displayed with your Order ID</li>
                <li>Instructions for accessing your product will be provided</li>
                <li>Contact information for support will be shared</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Delivery Support</h2>
              <p className="mb-4">
                If you haven't received your product within the expected timeframe:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Check your email spam/junk folder</li>
                <li>Verify the email address used during purchase</li>
                <li>Contact us via Telegram with your Order ID</li>
                <li>Use our Contact Page for additional support</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Technical Requirements</h2>
              <p className="mb-4">
                Please ensure you have the following before purchase:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Stable internet connection for downloads</li>
                <li>Compatible device to access digital content</li>
                <li>Valid email address for delivery notifications</li>
                <li>Telegram account for product access (if applicable)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact Us</h2>
              <p>
                For delivery-related queries, please contact us via our{" "}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Page
                </a>{" "}
                or reach out on Telegram.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ShippingPolicy;