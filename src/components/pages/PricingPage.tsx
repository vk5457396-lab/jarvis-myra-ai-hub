"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ShieldCheck, Infinity as InfinityIcon, RefreshCw, Send, Smartphone, Monitor, Code2, Layers } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import BinancePaymentModal from "@/components/BinancePaymentModal";
import ContactFormModal from "@/components/ContactFormModal";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import MyraAndroidDownload from "@/components/MyraAndroidDownload";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCurrency } from "@/hooks/useCurrency";

/** Prices must match PRODUCT_PRICES in /api/payments/create-order — the server charges its own copy. */
type Offer = {
  productId: string;
  name: string;
  detail: string;
  price: number;
  icon: typeof Smartphone;
  hsl: string;
  note?: string;
};

const MYRA_PRICE = 999;

const APPS: Offer[] = [
  {
    productId: "aria",
    name: "ARIA 1.0 for Windows",
    detail: "AI music creator. Ready-to-run .exe, no setup beyond install.",
    price: 899,
    icon: Monitor,
    hsl: "160 70% 50%",
  },
];

const SOURCE: Offer[] = [
  {
    productId: "source_jarvis",
    name: "Jarvis 2.0 source code",
    detail: "Full project source. Modify it, rebrand it, ship your own build.",
    price: 3900,
    icon: Code2,
    hsl: "0 72% 51%",
  },
  {
    productId: "source_myra",
    name: "MYRA 2.0 source code",
    detail: "Full project source for the MYRA desktop assistant.",
    price: 3900,
    icon: Code2,
    hsl: "350 65% 45%",
  },
  {
    productId: "source_bundle",
    name: "Jarvis 2.0 + MYRA 2.0 source code",
    detail: "Both projects together.",
    price: 6999,
    icon: Layers,
    hsl: "40 95% 55%",
    note: "bundle",
  },
];

const BUNDLE_SAVING = SOURCE[0].price + SOURCE[1].price - SOURCE[2].price;

const INCLUDED = [
  { icon: InfinityIcon, title: "One payment", desc: "No subscription. You pay once and keep it." },
  { icon: RefreshCw, title: "Future updates", desc: "New versions of what you bought are included." },
  { icon: Send, title: "Fast delivery", desc: "MYRA unlocks instantly. Other products are sent on Telegram after payment." },
  { icon: ShieldCheck, title: "Secure checkout", desc: "Razorpay for UPI, cards and netbanking, or USDT via Binance." },
];

const FAQS = [
  {
    q: "Is this really a one-time payment?",
    a: "Yes. Every product on this page is a single payment with lifetime access. There are no renewals.",
  },
  {
    q: "How do I get my product after paying?",
    a: "MYRA for Android gives you an access key and the APK download right away, and the key stays on your dashboard. For ARIA and source code, you'll land on a confirmation page with a Telegram link to verify the payment and receive your files.",
  },
  {
    q: "What's the difference between the app and the source code?",
    a: "The app is ready to install and use. Source code is the full project for developers who want to change features, rebrand it, or build their own version.",
  },
  {
    q: "Can I pay from outside India?",
    a: "Yes. Prices are shown in your local currency, and you can pay by card through Razorpay or with USDT through Binance.",
  },
  {
    q: "Can I get a refund?",
    a: "Refunds are handled case by case under our refund policy, since digital products are delivered instantly.",
    link: { href: "/refund-policy", label: "Read the refund policy" },
  },
];

const PriceRow = ({
  offer,
  formatPrice,
  onBuy,
  onCrypto,
}: {
  offer: Offer;
  formatPrice: (n: number) => string;
  onBuy: () => void;
  onCrypto: () => void;
}) => {
  const Icon = offer.icon;
  const isBundle = offer.note === "bundle";
  return (
    <li
      className={`group relative grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-3 py-5 sm:grid-cols-[auto_1fr_auto_auto] sm:gap-x-6 ${
        isBundle ? "rounded-2xl border border-amber-400/30 bg-amber-400/[0.04] px-4 sm:px-5 my-2" : "border-b border-white/[0.07] px-1"
      }`}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl"
        style={{ background: `hsla(${offer.hsl}, 0.12)`, color: `hsl(${offer.hsl})` }}
        aria-hidden="true"
      >
        <Icon size={20} />
      </span>
      <div className="min-w-0">
        <h3 className="font-display text-base sm:text-lg font-bold text-foreground">{offer.name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{offer.detail}</p>
        {isBundle && (
          <p className="text-sm font-semibold text-amber-300 mt-1">{formatPrice(BUNDLE_SAVING)} less than buying both separately</p>
        )}
      </div>
      <p className="col-start-2 sm:col-start-auto font-display text-2xl font-extrabold tabular-nums text-foreground sm:text-right">
        {formatPrice(offer.price)}
      </p>
      <div className="col-span-2 flex gap-2 sm:col-span-1">
        <button
          type="button"
          onClick={onBuy}
          className="flex-1 sm:flex-none min-h-11 rounded-xl bg-primary px-5 font-display text-sm font-bold text-white hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Buy now
        </button>
        <button
          type="button"
          onClick={onCrypto}
          aria-label={`Pay for ${offer.name} with USDT`}
          className="min-h-11 rounded-xl border border-white/10 px-4 text-sm text-muted-foreground hover:text-foreground hover:border-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          USDT
        </button>
      </div>
    </li>
  );
};

const Pricing = () => {
  const { formatPrice } = useCurrency();
  const reduceMotion = useReducedMotion();

  const [selected, setSelected] = useState<Offer | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [crypto, setCrypto] = useState<{ name: string; amount: number } | null>(null);

  const buy = (offer: Offer) => {
    setSelected(offer);
    setShowContact(true);
  };

  const rise = (delay: number) =>
    reduceMotion
      ? {}
      : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } };

  const section = (title: string, desc: string, offers: Offer[]) => (
    <section className="py-10 md:py-14" aria-labelledby={`h-${title}`}>
      <div className="max-w-2xl">
        <h2 id={`h-${title}`} className="font-display text-2xl md:text-3xl font-extrabold text-foreground">{title}</h2>
        <p className="mt-2 text-muted-foreground">{desc}</p>
      </div>
      <ul className="mt-6">
        {offers.map((o) => (
          <PriceRow
            key={o.productId}
            offer={o}
            formatPrice={formatPrice}
            onBuy={() => buy(o)}
            onCrypto={() => setCrypto({ name: o.name, amount: o.price })}
          />
        ))}
      </ul>
    </section>
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-4 max-w-6xl">
        {/* Hero: the flagship price is the headline */}
        <section className="pt-28 md:pt-36 pb-12 md:pb-16 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <motion.h1
              {...rise(0)}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-foreground text-balance"
            >
              Pay once. Keep it forever.
            </motion.h1>
            <motion.p {...rise(0.08)} className="mt-5 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Every CodeNinjaVik product is a single payment with lifetime access and free updates. No subscriptions, no renewals.
            </motion.p>

            <motion.div {...rise(0.16)} className="mt-10 flex items-end gap-4">
              <p className="font-display font-extrabold leading-none tracking-tighter text-[4.5rem] sm:text-[6.5rem] lg:text-[7.5rem] tabular-nums bg-gradient-to-b from-white to-white/55 bg-clip-text text-transparent">
                {formatPrice(MYRA_PRICE)}
              </p>
              <div className="pb-3 sm:pb-5">
                <p className="flex items-center gap-2 font-display text-lg font-bold text-emerald-400">
                  <Smartphone size={18} aria-hidden="true" /> MYRA for Android
                </p>
                <p className="text-sm text-muted-foreground">Lifetime access, paid once</p>
              </div>
            </motion.div>

            <div className="mt-8 max-w-md">
              <FlashSaleBanner />
            </div>
          </div>

          <motion.div {...rise(0.24)}>
            <MyraAndroidDownload variant="card" showReleaseNotes={false} />
          </motion.div>
        </section>

        {section("Apps you install", "Ready to use. Download, install and run.", APPS)}

        {/* Free companion — not a purchase, so it links out instead of using a price row */}
        <div className="-mt-6 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/[0.07] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400" aria-hidden="true">
              <Monitor size={20} />
            </span>
            <div>
              <p className="font-display font-bold text-foreground">MYRA PC Controller</p>
              <p className="text-sm text-muted-foreground">Free Windows companion that lets MYRA control your PC.</p>
            </div>
          </div>
          <Link
            href="/download"
            className="inline-flex min-h-11 items-center rounded-xl border border-emerald-500/30 px-5 text-sm font-bold text-emerald-300 hover:bg-emerald-500/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            Download free
          </Link>
        </div>

        {section("Source code you own", "For developers. Change it, rebrand it, build your own version.", SOURCE)}

        {/* What every purchase includes */}
        <section className="py-12 md:py-16 border-t border-white/[0.07]" aria-labelledby="h-included">
          <h2 id="h-included" className="font-display text-2xl md:text-3xl font-extrabold text-foreground">Every purchase includes</h2>
          <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <dt className="flex items-center gap-2.5 font-display font-bold text-foreground">
                  <Icon size={18} className="text-primary" aria-hidden="true" /> {title}
                </dt>
                <dd className="mt-2 text-sm text-muted-foreground leading-relaxed">{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* FAQ */}
        <section className="py-12 md:py-16 border-t border-white/[0.07] grid gap-8 lg:grid-cols-[1fr_2fr]" aria-labelledby="h-faq">
          <div>
            <h2 id="h-faq" className="font-display text-2xl md:text-3xl font-extrabold text-foreground">Questions before you buy</h2>
            <p className="mt-3 text-muted-foreground">
              Something else?{" "}
              <Link href="/contact" className="text-foreground underline underline-offset-4 hover:text-primary">
                Contact us
              </Link>
              .
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`faq-${i}`} className="border-white/[0.07]">
                <AccordionTrigger className="text-left font-display text-base font-semibold hover:no-underline min-h-11">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-[0.95rem]">
                  {f.a}
                  {f.link && (
                    <>
                      {" "}
                      <Link href={f.link.href} className="text-foreground underline underline-offset-4 hover:text-primary">
                        {f.link.label}
                      </Link>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </main>

      <Footer />

      <ContactFormModal
        isOpen={showContact}
        onClose={() => setShowContact(false)}
        onSubmit={(data) => {
          setCustomer(data);
          setShowContact(false);
          setShowPayment(true);
        }}
        productName={selected?.name || ""}
        accentHsl={selected?.hsl.replace(/ /g, ", ") || "0, 72%, 51%"}
      />
      {selected && (
        <PaymentGatewaySelector
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          productId={selected.productId}
          customerName={customer.name}
          customerEmail={customer.email}
          customerPhone={customer.phone}
        />
      )}
      <BinancePaymentModal
        isOpen={!!crypto}
        onClose={() => setCrypto(null)}
        productName={crypto?.name || ""}
        amount={crypto?.amount || 0}
      />
    </div>
  );
};

export default Pricing;
