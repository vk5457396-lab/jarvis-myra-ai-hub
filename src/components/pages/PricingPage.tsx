"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  Check,
  Globe,
  Infinity as InfinityIcon,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Monitor,
  Code2,
  Layers,
  Download,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FlashSaleBanner from "@/components/FlashSaleBanner";
import BinancePaymentModal from "@/components/BinancePaymentModal";
import ContactFormModal from "@/components/ContactFormModal";
import PaymentGatewaySelector from "@/components/PaymentGatewaySelector";
import MyraAndroidDownload from "@/components/MyraAndroidDownload";
import { Tilt3D, Layer } from "@/components/pricing/Tilt3D";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useCurrency, CURRENCIES } from "@/hooks/useCurrency";
import { jarvisFeatures } from "@/data/features";
import { chargedInr, PRODUCT_PRICES } from "@/lib/pricing";

/** MYRA for Android is always charged ₹999 in INR by /api/myra/website-purchase (no international tier). */
const MYRA_INR = 999;

type Product = {
  productId: string;
  name: string;
  tagline: string;
  thumb?: string;
  icon: typeof Monitor;
  hsl: string;
  features: string[];
  featured?: boolean;
};

const JARVIS_EXE: Product = {
  productId: "jarvis",
  name: "Jarvis 2.0",
  tagline: "AI desktop assistant for Windows. Install the .exe and talk to your PC.",
  thumb: "/assets/thumb-jarvis.png",
  icon: Monitor,
  hsl: "0 72% 51%",
  features: jarvisFeatures,
};

const SOURCE: Product[] = [
  {
    productId: "source_jarvis",
    name: "Jarvis 2.0 source code",
    tagline: "The full Jarvis project to modify, rebrand and build on.",
    thumb: "/assets/thumb-jarvis.png",
    icon: Code2,
    hsl: "0 72% 51%",
    features: ["Complete Jarvis 2.0 source", "Python & automation scripts", "Documentation & customization guide", "Future code updates"],
  },
  {
    productId: "source_myra",
    name: "MYRA 2.0 source code",
    tagline: "The full MYRA desktop assistant project.",
    thumb: "/assets/thumb-myra.png",
    icon: Code2,
    hsl: "330 80% 60%",
    features: ["Complete MYRA 2.0 source", "Python & automation scripts", "Documentation & customization guide", "Future code updates"],
  },
  {
    productId: "source_bundle",
    name: "Jarvis + MYRA source code",
    tagline: "Both projects together, with a commercial license.",
    icon: Layers,
    hsl: "40 95% 55%",
    features: ["Jarvis 2.0 + MYRA 2.0 source", "Commercial license", "Documentation & customization guide", "Developer support"],
    featured: true,
  },
];

const INCLUDED = [
  { icon: InfinityIcon, title: "One payment", desc: "No subscription. You pay once and keep it." },
  { icon: RefreshCw, title: "Future updates", desc: "New versions of what you bought are included." },
  { icon: Send, title: "Fast delivery", desc: "MYRA unlocks instantly. Other products are sent on Telegram after payment." },
  { icon: ShieldCheck, title: "Secure checkout", desc: "Razorpay for UPI, cards and netbanking, or USDT via Binance." },
];

const FAQS: { q: string; a: string; link?: { href: string; label: string } }[] = [
  { q: "Is this really a one-time payment?", a: "Yes. Every product on this page is a single payment with lifetime access. There are no renewals." },
  {
    q: "How do I get my product after paying?",
    a: "MYRA for Android gives you an access key and the APK download right away, and the key stays on your dashboard. For Jarvis and source code, you'll land on a confirmation page with a Telegram link to verify the payment and receive your files.",
  },
  {
    q: "What's the difference between the app and the source code?",
    a: "The app is ready to install and use. Source code is the full project for developers who want to change features, rebrand it, or build their own version.",
  },
  {
    q: "Why is the price different in my country?",
    a: "Prices outside India are set separately and charged in rupees; your bank converts them. The amount shown in your currency is an estimate at today's rate.",
  },
  {
    q: "Can I get a refund?",
    a: "Refunds are handled case by case under our refund policy, since digital products are delivered instantly.",
    link: { href: "/refund-policy", label: "Read the refund policy" },
  },
];

const ease = [0.34, 1.4, 0.64, 1] as const; // back-out: a small settle at the end of the entrance

/** Accessible native select, styled — lists every supported currency. */
function CountryPicker({
  value,
  onChange,
  id = "price-country",
  compact = false,
}: {
  value: string;
  onChange: (code: string) => void;
  id?: string;
  /** Smaller, full-width variant used inside each product card. */
  compact?: boolean;
}) {
  const current = CURRENCIES[value];
  return (
    <div className={compact ? "flex w-full flex-col gap-1" : "inline-flex flex-col gap-1.5"}>
      <label htmlFor={id} className={compact ? "text-xs text-muted-foreground" : "text-sm text-muted-foreground"}>
        {compact ? "Price for your country" : "Show prices for"}
      </label>
      <div className="relative flex items-center">
        <Globe size={compact ? 14 : 16} className="pointer-events-none absolute left-3.5 text-primary" aria-hidden="true" />
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full cursor-pointer appearance-none rounded-xl border border-white/15 bg-white/[0.04] pr-10 font-display font-semibold text-foreground backdrop-blur hover:border-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            compact ? "min-h-11 pl-9 text-[13px]" : "min-h-11 pl-10 text-sm"
          }`}
        >
          {Object.entries(CURRENCIES).map(([code, c]) => (
            <option key={code} value={code} className="bg-background">
              {c.name} ({c.code})
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3.5 text-xs text-muted-foreground" aria-hidden="true">
          {current?.symbol}
        </span>
      </div>
    </div>
  );
}

/** Rotating conic edge — reserved for the featured card so it is the one moving thing in its row. */
function LiveEdge({ hsl, animate }: { hsl: string; animate: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
      <motion.div
        className="absolute inset-[-150%]"
        animate={animate ? { rotate: 360 } : undefined}
        transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        style={{ background: `conic-gradient(from 0deg, hsl(${hsl} / 0.9), transparent 25%, transparent 50%, hsl(${hsl} / 0.9) 75%, transparent)` }}
      />
    </div>
  );
}

function ProductCard3D({
  product,
  price,
  priceNote,
  children,
  animateEdge,
  country,
}: {
  product: Product;
  price: string;
  priceNote?: ReactNode;
  children: ReactNode;
  animateEdge: boolean;
  /** Shared country state — every card's picker changes all prices on the page. */
  country: { value: string; onChange: (code: string) => void };
}) {
  const Icon = product.icon;
  const { hsl, featured } = product;
  return (
    <Tilt3D className="h-full" max={featured ? 7 : 9}>
      <div
        className={`relative h-full rounded-3xl ${featured ? "p-[1.5px]" : "p-px"}`}
        style={{
          background: featured
            ? `hsl(${hsl} / 0.25)`
            : `linear-gradient(160deg, hsl(${hsl} / 0.75), hsl(${hsl} / 0.4) 50%, hsl(${hsl} / 0.55))`,
          boxShadow: featured
            ? `0 50px 90px -30px hsl(${hsl} / 0.55), 0 0 60px -20px hsl(${hsl} / 0.45)`
            : `0 40px 70px -35px hsl(${hsl} / 0.55), 0 0 40px -25px hsl(${hsl} / 0.4)`,
          transformStyle: "preserve-3d",
        }}
      >
        {featured && <LiveEdge hsl={hsl} animate={animateEdge} />}
        <div
          className="relative flex h-full flex-col rounded-[calc(1.5rem-1px)] p-6 sm:p-7"
          style={{
            background: `radial-gradient(130% 90% at 100% 0%, hsl(${hsl} / 0.22), transparent 55%), linear-gradient(180deg, hsl(0 0% 13%), hsl(0 0% 8%))`,
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
            transformStyle: "preserve-3d",
          }}
        >
          {featured && (
            <Layer depth={50} className="absolute -top-3.5 left-6">
              <span className="inline-block rounded-full px-3 py-1 font-display text-xs font-extrabold text-black" style={{ background: `hsl(${hsl})` }}>
                Best value
              </span>
            </Layer>
          )}

          <div className="flex items-start justify-between gap-4" style={{ transformStyle: "preserve-3d" }}>
            <Layer depth={40}>
              <h3 className="font-display text-xl font-extrabold text-foreground">{product.name}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{product.tagline}</p>
            </Layer>
            <Layer depth={70} className="shrink-0">
              {product.thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumb}
                  alt=""
                  width={72}
                  height={72}
                  loading="lazy"
                  className="h-16 w-16 rounded-2xl object-cover sm:h-[72px] sm:w-[72px]"
                  style={{ boxShadow: `0 18px 30px -12px hsl(${hsl} / 0.7)`, background: `hsl(${hsl} / 0.12)` }}
                />
              ) : (
                <span
                  className="flex h-16 w-16 items-center justify-center rounded-2xl sm:h-[72px] sm:w-[72px]"
                  style={{ background: `hsl(${hsl} / 0.14)`, color: `hsl(${hsl})`, boxShadow: `0 18px 30px -12px hsl(${hsl} / 0.7)` }}
                  aria-hidden="true"
                >
                  <Icon size={30} />
                </span>
              )}
            </Layer>
          </div>

          <Layer depth={25} className="mt-5">
            <ul className="space-y-2">
              {product.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/80">
                  <Check size={16} className="mt-0.5 shrink-0" style={{ color: `hsl(${hsl})` }} aria-hidden="true" />
                  {f}
                </li>
              ))}
            </ul>
          </Layer>

          <Layer depth={55} className="mt-auto pt-6">
            <p className="font-display text-4xl font-extrabold tabular-nums tracking-tight text-foreground">{price}</p>
            <div className="mt-1 min-h-5 text-sm text-muted-foreground">{priceNote ?? "One-time payment"}</div>
          </Layer>

          <Layer depth={35} className="mt-4">
            <CountryPicker compact id={`country-${product.productId}`} value={country.value} onChange={country.onChange} />
          </Layer>

          <Layer depth={45} className="mt-4">
            {children}
          </Layer>
        </div>
      </div>
    </Tilt3D>
  );
}

const buyBtn =
  "flex-1 min-h-12 cursor-pointer rounded-xl bg-primary px-5 font-display text-sm font-bold text-white shadow-[0_12px_24px_-10px_hsl(var(--primary)/0.8)] transition-colors hover:bg-primary/90 active:bg-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const cryptoBtn =
  "min-h-12 cursor-pointer rounded-xl border border-white/15 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:border-white/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const Pricing = () => {
  const { countryCode, isIndia, currency, setSelectedCountry, formatExact } = useCurrency();
  const reduceMotion = useReducedMotion();

  const [selected, setSelected] = useState<Product | null>(null);
  const [showContact, setShowContact] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "" });
  const [crypto, setCrypto] = useState<{ name: string; amount: number } | null>(null);

  const intl = !isIndia;
  const country = { value: countryCode, onChange: setSelectedCountry };
  const inrFor = (id: string) => chargedInr(id, intl);
  const priceFor = (id: string) => formatExact(inrFor(id));
  const approx = (id: string) => (intl ? `≈ estimate · charged as ₹${inrFor(id).toLocaleString("en-IN")}` : undefined);
  const bundleSaving = inrFor("source_jarvis") + inrFor("source_myra") - inrFor("source_bundle");

  const buy = (p: Product) => {
    setSelected(p);
    setShowContact(true);
  };
  const payCrypto = (p: Product) => setCrypto({ name: PRODUCT_PRICES[p.productId]?.name || p.name, amount: inrFor(p.productId) });

  const grid = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } },
  };
  const item = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 28, scale: 0.94, rotateX: 12 },
        show: { opacity: 1, y: 0, scale: 1, rotateX: 0, transition: { duration: 0.55, ease } },
      };

  const actions = (p: Product) => (
    <div className="flex gap-2">
      <button type="button" onClick={() => buy(p)} className={buyBtn}>
        Buy now
      </button>
      <button type="button" onClick={() => payCrypto(p)} className={cryptoBtn} aria-label={`Pay for ${p.name} with USDT`}>
        USDT
      </button>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4">
        {/* Hero */}
        <section className="grid gap-12 pb-14 pt-28 md:pb-20 md:pt-36 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center">
          <div>
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-balance font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Pay once. Keep it forever.
            </motion.h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Every CodeNinjaVik product is a single payment with lifetime access and free updates. No subscriptions, no renewals.
            </p>

            <div className="mt-7">
              <CountryPicker value={countryCode} onChange={setSelectedCountry} />
            </div>

            {/* 3D price: extruded with stacked shadows, gently floating */}
            <div className="mt-10 [perspective:900px]">
              <motion.div
                animate={reduceMotion ? undefined : { rotateX: [10, 4, 10], rotateY: [-14, -6, -14], y: [0, -6, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d", rotateX: 8, rotateY: -10 }}
                className="inline-flex flex-wrap items-end gap-x-4 gap-y-2"
              >
                <p
                  className="font-display text-[4.5rem] font-extrabold leading-none tracking-tighter text-white tabular-nums sm:text-[6.5rem] lg:text-[7.25rem]"
                  style={{
                    textShadow:
                      "0 1px 0 #d4d4d4, 0 2px 0 #b5b5b5, 0 3px 0 #9a9a9a, 0 4px 0 #7f1d1d, 0 5px 0 #7f1d1d, 0 6px 0 #6b1717, 0 8px 1px rgba(0,0,0,.4), 0 20px 30px rgba(220,38,38,.35)",
                  }}
                >
                  {formatExact(MYRA_INR)}
                </p>
                <div className="pb-3 sm:pb-5" style={{ transform: "translateZ(40px)" }}>
                  <p className="flex items-center gap-2 whitespace-nowrap font-display text-lg font-bold text-emerald-400">
                    <Smartphone size={18} aria-hidden="true" /> MYRA for Android
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {intl ? `Charged as ₹${MYRA_INR} · lifetime` : "Lifetime access, paid once"}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="mt-8 max-w-md">
              <FlashSaleBanner />
            </div>
          </div>

          <Tilt3D max={6}>
            <MyraAndroidDownload variant="card" showReleaseNotes={false} />
          </Tilt3D>
        </section>

        {/* Apps */}
        <section className="py-10 md:py-14" aria-labelledby="h-apps">
          <h2 id="h-apps" className="font-display text-2xl font-extrabold text-foreground md:text-3xl">Apps you install</h2>
          <p className="mt-2 text-muted-foreground">Ready to use. Download, install and run.</p>
          <motion.div
            variants={grid}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-8 grid gap-6 md:grid-cols-2 [perspective:1400px]"
          >
            <motion.div variants={item}>
              <ProductCard3D product={JARVIS_EXE} price={priceFor("jarvis")} priceNote={approx("jarvis")} animateEdge={false} country={country}>
                {actions(JARVIS_EXE)}
              </ProductCard3D>
            </motion.div>
            <motion.div variants={item}>
              <Tilt3D className="h-full">
                <div className="relative h-full overflow-hidden rounded-3xl border border-emerald-500/40 bg-[linear-gradient(180deg,hsl(0_0%_13%),hsl(0_0%_8%))] shadow-[0_40px_70px_-35px_hsla(152,70%,50%,0.5),inset_0_1px_0_rgba(255,255,255,0.12)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/assets/myra-pc/promo-banner.png" alt="MYRA PC Controller connecting the Android app to a Windows PC" loading="lazy" className="aspect-[16/9] w-full object-cover" />
                  <div className="p-6 sm:p-7">
                    <h3 className="font-display text-xl font-extrabold text-foreground">MYRA PC Controller</h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">Free Windows companion that lets MYRA on your phone control your PC.</p>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <p className="font-display text-3xl font-extrabold text-emerald-400">Free</p>
                      <Link
                        href="/download"
                        className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-emerald-500/40 px-5 font-display text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                      >
                        <Download size={16} aria-hidden="true" /> Download
                      </Link>
                    </div>
                  </div>
                </div>
              </Tilt3D>
            </motion.div>
          </motion.div>
        </section>

        {/* Source code */}
        <section className="py-10 md:py-14" aria-labelledby="h-source">
          <h2 id="h-source" className="font-display text-2xl font-extrabold text-foreground md:text-3xl">Source code you own</h2>
          <p className="mt-2 text-muted-foreground">For developers. Change it, rebrand it, build your own version.</p>
          <motion.div
            variants={grid}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3 [perspective:1400px]"
          >
            {SOURCE.map((p) => (
              <motion.div key={p.productId} variants={item} className={p.featured ? "md:col-span-2 lg:col-span-1" : ""}>
                <ProductCard3D
                  product={p}
                  price={priceFor(p.productId)}
                  animateEdge={!reduceMotion}
                  country={country}
                  priceNote={
                    p.featured && bundleSaving > 0 ? (
                      <span className="font-semibold text-amber-300">{formatExact(bundleSaving)} less than buying both</span>
                    ) : (
                      approx(p.productId)
                    )
                  }
                >
                  {actions(p)}
                </ProductCard3D>
              </motion.div>
            ))}
          </motion.div>
          {intl && (
            <p className="mt-6 text-sm text-muted-foreground">
              Prices in {currency.name} are estimates. You're charged in Indian rupees and your bank converts the amount.
            </p>
          )}
        </section>

        {/* Included */}
        <section className="border-t border-white/[0.07] py-12 md:py-16" aria-labelledby="h-included">
          <h2 id="h-included" className="font-display text-2xl font-extrabold text-foreground md:text-3xl">Every purchase includes</h2>
          <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {INCLUDED.map(({ icon: Icon, title, desc }) => (
              <div key={title}>
                <dt className="flex items-center gap-2.5 font-display font-bold text-foreground">
                  <Icon size={18} className="text-primary" aria-hidden="true" /> {title}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* FAQ */}
        <section className="grid gap-8 border-t border-white/[0.07] py-12 md:py-16 lg:grid-cols-[1fr_2fr]" aria-labelledby="h-faq">
          <div>
            <h2 id="h-faq" className="font-display text-2xl font-extrabold text-foreground md:text-3xl">Questions before you buy</h2>
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
                <AccordionTrigger className="min-h-11 text-left font-display text-base font-semibold hover:no-underline">{f.q}</AccordionTrigger>
                <AccordionContent className="text-[0.95rem] leading-relaxed text-muted-foreground">
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
      <BinancePaymentModal isOpen={!!crypto} onClose={() => setCrypto(null)} productName={crypto?.name || ""} amount={crypto?.amount || 0} />
    </div>
  );
};

export default Pricing;
