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
      <div className="flex pt-16 md:pt-20">
        <AdminSidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
