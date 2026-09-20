import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AdminSidebar from "@/components/admin/AdminSidebar";

/**
 * Shared chrome for every /admin/* page. Before this, each admin page duplicated its own row of
 * "go to sibling page" buttons (or, in a couple of cases, its own Navbar/Footer too) - one
 * persistent sidebar here replaces all of that. Individual pages (AdminDashboardPage,
 * MyraAdminPage, etc.) should render only their own content now, not their own Navbar/Footer/
 * cross-link buttons.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-legacy min-h-screen">
      <Navbar />
      {/*
       * flex-col md:flex-row is load-bearing, not cosmetic. AdminSidebar renders a Fragment - the
       * desktop <aside> (hidden below md) and the mobile <nav> strip (hidden at md and up) are
       * both DIRECT flex children here alongside <main>, no wrapper div.
       *
       * A plain `flex` (row, the old value) forces the mobile nav strip and <main> to share ONE
       * horizontal line even on phones. The strip's un-wrapped content (9 links, ~1100px) exceeds
       * the viewport, so the flex row enters "shrink" mode - and `<main className="flex-1">`'s
       * `flex-basis: 0%` means its hypothetical size is already 0, so it has nothing to shrink;
       * `flex-grow` is simply never consulted while the line is shrinking, not growing. Net
       * result: <main> gets 0px, and all of the page's real content collapses into a column a few
       * pixels wide, wrapping almost every word onto its own line - discovered 2026-09-18 on a
       * real phone (content-heavy pages like /admin/myra only, since short pages never accumulate
       * enough nav-vs-content width pressure to reveal it - desktop and DevTools' device emulation
       * never hit this either, since neither actually recomputes the row this way).
       *
       * `flex-col` on mobile makes the nav strip and <main> stack as two independent rows instead
       * of competing for one shared line - each gets the full container width via the default
       * cross-axis stretch (which is WIDTH in a column flex container), with no shrink/grow
       * negotiation between them at all. `md:flex-row` restores the original side-by-side
       * sidebar+content layout at the breakpoint where the mobile nav strip is `md:hidden` anyway.
       */}
      <div className="flex flex-col md:flex-row pt-16 md:pt-20">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
