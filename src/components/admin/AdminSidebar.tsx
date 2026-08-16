"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Shield, KeyRound, Sparkles, Radio, AlertTriangle, BarChart3, Timer, Smartphone, Megaphone,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Shield;
}

interface NavSection {
  title: string | null;
  items: NavItem[];
}

// Every admin page used to duplicate its own row of "go to sibling page" buttons - one section
// here replaces all of those. Add a new admin page's link here and every page picks it up
// automatically via the shared layout (see src/app/admin/layout.tsx). Flattened once for the
// mobile strip below, which doesn't have room for section grouping.
const SECTIONS: NavSection[] = [
  {
    title: null,
    items: [{ href: "/admin", label: "Dashboard", icon: Shield }],
  },
  {
    title: "MYRA",
    items: [
      { href: "/admin/myra", label: "Subscriptions & Credits", icon: Sparkles },
      { href: "/admin/myra/live-devices", label: "Live Devices", icon: Radio },
      { href: "/admin/myra/diagnostics", label: "Diagnostics", icon: AlertTriangle },
      { href: "/admin/myra/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/myra/performance", label: "Performance", icon: Timer },
    ],
  },
  {
    title: "Site",
    items: [
      { href: "/admin/licenses", label: "Licenses", icon: KeyRound },
      { href: "/admin/app-release", label: "App Release", icon: Smartphone },
      { href: "/admin/banners", label: "Banners", icon: Megaphone },
    ],
  },
];

function isActive(pathname: string | null, href: string): boolean {
  // Exact match for /admin itself (otherwise every /admin/* route would also highlight
  // "Dashboard"); startsWith for everything else so a sub-route like /admin/myra/live-devices
  // still highlights "Live Devices" correctly.
  return href === "/admin" ? pathname === "/admin" : !!pathname?.startsWith(href);
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const flatItems = SECTIONS.flatMap((s) => s.items);

  return (
    <>
      {/* Desktop: persistent left sidebar, grouped into sections. */}
      <aside className="hidden md:block w-64 shrink-0 border-r border-white/10 bg-black/20">
        <nav className="sticky top-16 md:top-20 flex flex-col gap-6 p-4 pt-8 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-5rem)] overflow-y-auto">
          {SECTIONS.map((section, i) => (
            <div key={i}>
              {section.title && (
                <p className="px-3 mb-2 text-xs font-display font-bold tracking-wider text-muted-foreground uppercase">
                  {section.title}
                </p>
              )}
              <div className="flex flex-col gap-1">
                {section.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg shadow-primary/20"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      }`}
                    >
                      <Icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Mobile: no room for a fixed sidebar, so a horizontally-scrolling strip of the same
       *  links sits under the Navbar instead - otherwise small screens would have no way to
       *  move between admin pages at all. */}
      <nav className="md:hidden sticky top-16 z-40 flex gap-2 overflow-x-auto border-b border-white/10 bg-black/40 px-3 py-2 backdrop-blur-md">
        {flatItems.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-gradient-to-r from-primary to-secondary text-white"
                  : "text-muted-foreground bg-white/5 hover:text-foreground"
              }`}
            >
              <Icon size={13} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
