import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const SITE_URL = "https://www.codeninjavik.in";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "CodeNinjaVik — Jarvis & MYRA 2.0 AI Voice Assistant for Windows PC",
  description:
    "CodeNinjaVik builds India's #1 AI voice assistants. Jarvis 2.0 & MYRA 2.0 control your Windows PC with voice — WhatsApp automation, system commands, music & news. From ₹799.",
  keywords: [
    "codeninjavik", "code ninja vik", "codeninja vik", "codeninjavik.in", "code ninja", "vikash", "vik ai",
    "code with vik", "jarvis", "jarvis ai", "jarvis 2.0", "jarvis voice assistant", "jarvis ai for pc",
    "jarvis windows", "jarvis like ai", "jarvis clone", "real jarvis", "iron man jarvis", "buy jarvis ai",
    "jarvis ai price", "jarvis source code", "myra", "myra ai", "myra 2.0", "myra voice assistant",
    "myra ai assistant", "pip install myra-ai-assistant", "aria", "aria ai", "ai music assistant",
    "ai voice assistant", "voice assistant for pc", "windows voice assistant", "ai assistant india",
    "best ai assistant india", "ai automation", "pc automation", "system automation", "whatsapp automation",
    "voice control pc", "voice control windows", "ai chatbot", "chatgpt alternative", "openai alternative",
    "ai for windows", "ai for laptop", "hindi ai assistant", "indian ai assistant", "ai assistant in hindi",
    "python ai assistant", "ai assistant source code", "ai project", "ai final year project", "jarvis project",
    "college ai project", "ai companion", "voice automation", "voice commands pc", "ai desktop assistant",
    "ai personal assistant", "smart assistant", "voice ai india", "ai software india", "ai tools india",
    "desktop ai", "pc ai assistant", "free ai assistant", "ai assistant download", "jarvis myra ai hub",
  ],
  authors: [{ name: "CodeNinjaVik" }],
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
    googleBot: { index: true, follow: true },
  },
  other: {
    bingbot: "index, follow",
    "revisit-after": "1 days",
    rating: "general",
    distribution: "global",
    language: "English, Hindi",
    "geo.region": "IN",
    "geo.placename": "India",
    coverage: "Worldwide",
    target: "all",
    audience: "all",
    HandheldFriendly: "True",
    MobileOptimized: "320",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=yes",
    "msapplication-TileColor": "#DC2626",
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/image.png", type: "image/png" }],
    apple: [{ url: "/image.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "CodeNinjaVik - AI Voice Assistants",
    title: "Jarvis & MYRA 2.0 — India's #1 AI Voice Assistant | CodeNinjaVik",
    description:
      "🚀 Control your Windows PC with voice! Jarvis & MYRA 2.0 AI Voice Assistant — WhatsApp automation, system control, music & news. Buy now from ₹799!",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Jarvis & MYRA AI Voice Assistants" }],
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    site: "@CodeNinjaVik",
    creator: "@CodeNinjaVik",
    title: "Jarvis & MYRA 2.0 — India's #1 AI Voice Assistant",
    description:
      "🚀 Control your Windows PC with voice! Jarvis & MYRA 2.0 AI Voice Assistant — WhatsApp automation, system control, music & news. Buy now from ₹799!",
    images: [{ url: "/og-image.png", alt: "Jarvis & MYRA AI Voice Assistants" }],
  },
  verification: {
    google: "9uQyQn6lykt0eO_wdxM9Fj-CC1D_8H3xYnNYXhKZvSE",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#DC2626",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "CodeNinjaVik",
  alternateName: ["Code Ninja Vik", "Jarvis AI", "MYRA AI"],
  url: SITE_URL,
  logo: `${SITE_URL}/favicon.png`,
  description: "India's #1 AI Voice Assistant Developer - Creating Jarvis & MYRA AI for PC automation",
  foundingDate: "2024",
  founder: { "@type": "Person", name: "CodeNinjaVik" },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-9876543210",
    contactType: "customer service",
    areaServed: ["IN", "Worldwide"],
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [
    "https://t.me/codeninjavik",
    "https://instagram.com/codeninjavik",
    "https://youtube.com/@codeninjavik",
  ],
};

const softwareApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Jarvis & MYRA 2.0 AI Voice Assistant",
  alternateName: ["Jarvis AI", "MYRA AI", "AI Voice Assistant"],
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Windows 10, Windows 11",
  offers: {
    "@type": "Offer",
    price: "799",
    priceCurrency: "INR",
    availability: "https://schema.org/InStock",
    seller: { "@type": "Organization", name: "CodeNinjaVik" },
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1247",
    bestRating: "5",
    worstRating: "1",
  },
  description:
    "Control your Windows PC with voice commands. Features include WhatsApp automation, system control, ChatGPT integration, app & file management, music and news.",
  screenshot: `${SITE_URL}/og-image.png`,
  featureList: [
    "Voice Control PC",
    "WhatsApp Automation",
    "System Commands",
    "ChatGPT Integration",
    "App Control",
    "File Management",
    "Browser Control",
    "Music Control",
    "News Updates",
    "Screenshot & Recording",
  ],
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "CodeNinjaVik - Jarvis & MYRA AI",
  alternateName: "CodeNinjaVik",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/?search={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is Jarvis AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jarvis 2.0 is an advanced AI voice assistant that lets you control your Windows PC using voice commands. It features WhatsApp automation, system control, app management and ChatGPT integration.",
      },
    },
    {
      "@type": "Question",
      name: "What is MYRA AI?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "MYRA 2.0 is a human-like AI personal voice assistant for Windows that handles daily life automation — music, news, volume, brightness, smart tasks and more. Install with: pip install myra-ai-assistant.",
      },
    },
    {
      "@type": "Question",
      name: "How much does Jarvis AI cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jarvis 2.0 and MYRA 2.0 are available individually from ₹899. The Jarvis + MYRA bundle is ₹1599 (one-time, lifetime access).",
      },
    },
    {
      "@type": "Question",
      name: "Is Jarvis AI better than ChatGPT?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Jarvis AI offers unique features like PC voice control, WhatsApp automation, and system commands that ChatGPT doesn't provide. It's a complete desktop AI assistant.",
      },
    },
    {
      "@type": "Question",
      name: "Can I get the source code?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Individual source code is ₹3900 and the Jarvis + MYRA source code bundle is ₹6999, with full documentation, automation scripts and developer support.",
      },
    },
  ],
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Features", item: `${SITE_URL}/features` },
    { "@type": "ListItem", position: 3, name: "Pricing", item: `${SITE_URL}/pricing` },
    { "@type": "ListItem", position: 4, name: "Demo Videos", item: `${SITE_URL}/demos` },
    { "@type": "ListItem", position: 5, name: "Contact", item: `${SITE_URL}/contact` },
  ],
};

const jsonLdBlocks = [organizationJsonLd, softwareApplicationJsonLd, websiteJsonLd, faqJsonLd, breadcrumbJsonLd];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {jsonLdBlocks.map((block, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
          />
        ))}
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
