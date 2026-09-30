"use client";

import { ExternalLink, Loader2, Star } from "lucide-react";
import PlayStoreListing, { MoreByDeveloper, playButtonClass, type Shot } from "@/components/download/PlayStoreListing";
import { useMyraPurchase, MYRA_LIFETIME_PRICE } from "@/hooks/useMyraPurchase";
import { usePcRelease } from "@/hooks/usePcRelease";
import { openDownload } from "@/lib/appDownload";
import RatingsAndReviews, { useReviews, type ReviewsState } from "@/components/download/RatingsAndReviews";

const MYRA_ICON = "/assets/myra-app/icon.webp";
const PC_ICON = "/assets/myra-pc/icon.webp";
const JARVIS_ICON = "/assets/thumb-jarvis.png";

const MYRA_SHOTS: Shot[] = [
  { src: "/assets/myra-app/shots/01.webp", alt: "MYRA home screen with the voice orb and quick actions", ratio: 0.4089 },
  { src: "/assets/myra-app/shots/02.webp", alt: "Modes: Voice Mode, Visual Lens, JARVIS Mode and Aura Control", ratio: 0.4078 },
  { src: "/assets/myra-app/shots/03.webp", alt: "Aura Control: launcher core, haptics and system modes", ratio: 0.4233 },
  { src: "/assets/myra-app/shots/04.webp", alt: "Orb customization with Classic, Energy and Neon styles", ratio: 0.43 },
  { src: "/assets/myra-app/shots/05.webp", alt: "Connectors for Gemini, Groq, OpenAI, Claude, Perplexity and more", ratio: 0.4133 },
  { src: "/assets/myra-app/shots/06.webp", alt: "Onboarding: Discover intelligence with MYRA AI", ratio: 0.4778 },
  { src: "/assets/myra-app/shots/07.webp", alt: "Sign in with email or Google", ratio: 0.49 },
  { src: "/assets/myra-app/shots/08.webp", alt: "MYRA splash screen", ratio: 0.4044 },
];

const PC_SHOTS: Shot[] = [
  { src: "/assets/myra-pc/shots/01.webp", alt: "MYRA PC Controller connects the Android app to your Windows PC", ratio: 1.7759 },
  { src: "/assets/myra-pc/shots/02.webp", alt: "Desktop dashboard: desktop control, file manager, web control, WhatsApp, apps", ratio: 1.413 },
  { src: "/assets/myra-pc/shots/03.webp", alt: "MYRA on the phone, connected to the PC", ratio: 0.5511 },
];

/** Play Store style download buckets: 1+, 5+, 10+, 50+, 100+, 500+, 1K+, 5K+ ... */
function downloadsBucket(n: number): string {
  const steps = [1, 5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 500000, 1000000];
  const b = [...steps].reverse().find((s) => n >= s) ?? 1;
  const label = b >= 1000000 ? `${b / 1000000}M` : b >= 1000 ? `${b / 1000}K` : String(b);
  return `${label}+`;
}

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : null;

/** Play shows the rating first in the stat strip — only once there are real reviews. */
function ratingStat(rv: ReviewsState) {
  const s = rv.summary;
  if (!s || s.count === 0) return null;
  return {
    value: (
      <span className="inline-flex items-center gap-1">
        {s.average.toFixed(1)} <Star size={12} className="text-[#e3e3e3]" fill="currentColor" strokeWidth={0} aria-hidden="true" />
      </span>
    ),
    label: `${s.count.toLocaleString("en-IN")} ${s.count === 1 ? "review" : "reviews"}`,
  };
}

const Spinner = () => <Loader2 size={18} className="animate-spin" aria-hidden="true" />;

export function MyraAndroidListing() {
  const m = useMyraPurchase();
  const r = m.release;
  const rv = useReviews("myra-android");

  let action;
  if (m.loading || m.status === "loading" || (m.session?.user && m.hasAccess === null)) {
    action = (
      <button type="button" disabled className={playButtonClass} aria-busy="true">
        <Spinner /> Checking
      </button>
    );
  } else if (!r) {
    action = (
      <button type="button" disabled className={playButtonClass}>
        Coming soon
      </button>
    );
  } else if (m.session?.user && m.hasAccess) {
    action = (
      <button type="button" onClick={m.download} disabled={m.downloading} className={playButtonClass}>
        {m.downloading ? <Spinner /> : null} {m.downloading ? "Getting your link" : "Install"}
      </button>
    );
  } else {
    action = (
      <button
        type="button"
        onClick={m.session?.user ? m.buy : m.login}
        disabled={m.buying}
        className={playButtonClass}
        aria-label={m.session?.user ? `Buy MYRA for ₹${MYRA_LIFETIME_PRICE}` : `Sign in to buy MYRA for ₹${MYRA_LIFETIME_PRICE}`}
      >
        {m.buying ? <Spinner /> : null}{" "}
        {m.buying ? "Opening payment" : m.session?.user ? `Buy for ₹${MYRA_LIFETIME_PRICE}` : "Sign in to buy"}
      </button>
    );
  }

  const hint =
    m.session?.user && m.hasAccess ? (
      <>
        After it downloads, open the file and allow &ldquo;Install unknown apps&rdquo; if Android asks.
        {m.fallbackUrl && (
          <button type="button" onClick={() => openDownload(m.fallbackUrl!)} className="ml-2 inline-flex items-center gap-1 text-[#6dd58c] underline-offset-2 hover:underline">
            <ExternalLink size={12} aria-hidden="true" /> Download didn&apos;t start?
          </button>
        )}
        {m.issuedKey && <span className="mt-1 block">Your access key {m.issuedKey} is also on your dashboard.</span>}
      </>
    ) : m.session?.user ? (
      "One-time payment. You get an access key and the APK right away."
    ) : (
      "Sign in with your codeninjavik.in account to buy and install."
    );

  const stats = [
    ratingStat(rv),
    r?.version_name ? { value: r.version_name, label: "Version" } : null,
    r?.file_size_mb ? { value: `${r.file_size_mb} MB`, label: "Size" } : null,
    r?.download_count ? { value: downloadsBucket(r.download_count), label: "Downloads" } : null,
    { value: "8.0+", label: "Android" },
    { value: `₹${MYRA_LIFETIME_PRICE}`, label: "Lifetime" },
  ].filter(Boolean) as { value: React.ReactNode; label: string }[];

  return (
    <PlayStoreListing
      id="myra-android"
      icon={MYRA_ICON}
      title="MYRA: AI Voice Assistant"
      developer="CodeNinjaVik"
      note="Lifetime purchase, includes access key"
      stats={stats}
      action={action}
      actionHint={hint}
      shots={MYRA_SHOTS}
      about={
        "MYRA is a voice assistant for your Android phone. Ask out loud and it makes calls, sends WhatsApp messages and SMS, opens and controls apps, and reads what's on your screen.\n\nIt remembers your preferences, lets you connect AI models like Gemini, Groq, OpenAI, Claude and Perplexity, and you can style the voice orb and launcher to your taste. Use the same account you use on codeninjavik.in."
      }
      tags={["Productivity", "AI assistant", "Voice control", "Automation"]}
      updatedOn={formatDate(r?.updated_at)}
      whatsNew={r?.release_notes}
      reviews={
        <RatingsAndReviews
          app="myra-android"
          appName="MYRA"
          state={rv}
          canReview={m.session?.user ? (m.hasAccess === null ? undefined : m.hasAccess) : undefined}
          cannotReviewReason={`Buy MYRA for ₹${MYRA_LIFETIME_PRICE} to rate and review it.`}
        />
      }
      sidebar={
        <MoreByDeveloper
          items={[
            { href: "#myra-pc", icon: PC_ICON, title: "MYRA PC Controller", subtitle: "Free for Windows" },
            { href: "/pricing", icon: JARVIS_ICON, title: "Jarvis 2.0", subtitle: "AI assistant for Windows" },
          ]}
        />
      }
    />
  );
}

export function MyraPcListing() {
  const { release, loading } = usePcRelease();
  const rv = useReviews("myra-pc");

  const action = loading ? (
    <button type="button" disabled className={playButtonClass} aria-busy="true">
      <Spinner /> Checking
    </button>
  ) : release?.download_url ? (
    <button
      type="button"
      onClick={() => window.open(release.download_url, "_blank", "noopener,noreferrer")}
      className={playButtonClass}
    >
      Install
    </button>
  ) : (
    <button type="button" disabled className={playButtonClass}>
      Coming soon
    </button>
  );

  const stats = [
    ratingStat(rv),
    release?.version_name ? { value: release.version_name, label: "Version" } : null,
    release?.file_size_mb ? { value: `${release.file_size_mb} MB`, label: "Size" } : null,
    { value: "Free", label: "Price" },
    { value: "10 / 11", label: "Windows" },
  ].filter(Boolean) as { value: React.ReactNode; label: string }[];

  return (
    <PlayStoreListing
      id="myra-pc"
      icon={PC_ICON}
      title="MYRA PC Controller"
      developer="CodeNinjaVik"
      note="Free companion for the MYRA Android app"
      stats={stats}
      action={action}
      actionHint={<>If Windows SmartScreen appears, choose &ldquo;More info&rdquo; and then &ldquo;Run anyway&rdquo;.</>}
      shots={PC_SHOTS}
      about={
        "Control your Windows PC from MYRA on your phone. See and control the PC screen, browse and manage files, send WhatsApp messages from the PC, and open apps and websites with a voice command.\n\nIt connects straight to the MYRA Android app. Free, with no plan and no login required on the PC."
      }
      tags={["Tools", "Remote control", "Windows", "Free"]}
      updatedOn={formatDate(release?.updated_at)}
      reviews={<RatingsAndReviews app="myra-pc" appName="MYRA PC Controller" state={rv} canReview />}
      sidebar={
        <MoreByDeveloper
          items={[
            { href: "#myra-android", icon: MYRA_ICON, title: "MYRA: AI Voice Assistant", subtitle: `₹${MYRA_LIFETIME_PRICE} lifetime` },
            { href: "/pricing", icon: JARVIS_ICON, title: "Jarvis 2.0", subtitle: "AI assistant for Windows" },
          ]}
        />
      }
    />
  );
}
