import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const TermsAndConditions = () => {
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
          <h1 className="text-4xl font-bold text-foreground mb-8">Terms and Conditions</h1>
          <p className="text-muted-foreground mb-6">Last updated: January 2, 2026</p>

          <div className="space-y-8 text-foreground/90">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using this website and making purchases, you accept and agree
                to be bound by these Terms and Conditions. If you do not agree, please do not
                use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Products and Services</h2>
              <p className="mb-4">
                We offer digital products and services. All products are delivered electronically
                after successful payment confirmation.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Product descriptions are provided for informational purposes</li>
                <li>We reserve the right to modify or discontinue products</li>
                <li>Prices are subject to change without prior notice</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Payment Terms</h2>
              <p className="mb-4">
                All payments are processed securely through Razorpay payment gateway.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Prices are displayed in Indian Rupees (INR)</li>
                <li>Payment must be completed before product delivery</li>
                <li>We accept UPI, credit/debit cards, net banking, and wallets</li>
                <li>All transactions are encrypted and secure</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Order Confirmation</h2>
              <p>
                After successful payment, you will receive an order confirmation. Please save
                your order ID and payment reference for future correspondence.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. User Responsibilities</h2>
              <p className="mb-4">As a user, you agree to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Use products for personal, non-commercial purposes only</li>
                <li>Not redistribute, resell, or share purchased products</li>
                <li>Comply with all applicable laws and regulations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Intellectual Property</h2>
              <p>
                All content, products, and materials on this website are protected by
                intellectual property rights. Unauthorized use, reproduction, or distribution
                is prohibited.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Limitation of Liability</h2>
              <p>
                We are not liable for any indirect, incidental, or consequential damages
                arising from the use of our products or services. Our maximum liability is
                limited to the amount paid for the product.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Governing Law</h2>
              <p>
                These terms are governed by the laws of India. Any disputes shall be subject
                to the exclusive jurisdiction of courts in India.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact</h2>
              <p>
                For questions about these terms, please visit our{" "}
                <a href="/contact" className="text-primary hover:underline">
                  Contact Page
                </a>
                .
              </p>
            </section>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsAndConditions;
