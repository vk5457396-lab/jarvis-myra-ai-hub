import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const RefundPolicy = () => {
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
          <h1 className="text-4xl font-bold text-foreground mb-8">Refund & Cancellation Policy</h1>
          <p className="text-muted-foreground mb-6">Last updated: January 2, 2026</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Digital Products</h2>
              <p>
                Due to the nature of digital products, all sales are final once the product
                has been delivered or access has been granted. We cannot offer refunds for
                digital products that have been accessed or downloaded.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Eligibility for Refund</h2>
              <p className="mb-4">Refunds may be considered in the following cases:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Duplicate payment made in error</li>
                <li>Technical issues preventing product access (not resolved within 48 hours)</li>
                <li>Product significantly different from description</li>
                <li>Payment processed but product not delivered within 24 hours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Refund Request Process</h2>
              <p className="mb-4">To request a refund:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Contact us within 7 days of purchase via our Contact Page</li>
                <li>Provide your Order ID and Payment Reference</li>
                <li>Explain the reason for the refund request</li>
                <li>Our team will review and respond within 3-5 business days</li>
              </ol>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Refund Timeline</h2>
              <p className="mb-4">If your refund is approved:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>UPI/Wallet: 3-5 business days</li>
                <li>Credit/Debit Card: 5-7 business days</li>
                <li>Net Banking: 5-10 business days</li>
              </ul>
              <p className="mt-4 text-muted-foreground">
                Note: Refund timelines may vary based on your bank's processing time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cancellation Policy</h2>
              <p className="mb-4">
                Orders can be cancelled only before the product is delivered or access is granted.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Contact us immediately after placing the order</li>
                <li>Cancellation requests are processed within 24 hours</li>
                <li>Full refund will be initiated for approved cancellations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Non-Refundable Cases</h2>
              <p className="mb-4">Refunds will NOT be provided for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Change of mind after product delivery</li>
                <li>Failure to use the product</li>
                <li>Incompatibility with user's system (check requirements before purchase)</li>
                <li>Requests made after 7 days of purchase</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Contact for Refunds</h2>
              <p>
                For refund requests or queries, please contact us via our{" "}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Page
                </a>{" "}
                with your order details.
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default RefundPolicy;
