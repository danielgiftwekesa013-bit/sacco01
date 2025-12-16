import { useState, useEffect, useRef } from "react";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/admin/AdminSidebar";

import AdminDashboardOverview from "@/components/admin/AdminDashboardOverview";
import AdminMembership from "@/components/admin/AdminMembership";
import AdminWelfare from "@/components/admin/AdminWelfare";
import AdminShares from "@/components/admin/AdminShares";
import AdminLoans from "@/components/admin/AdminLoans";
import AdminDailyDeposits from "@/components/admin/AdminDailyDeposits";
import AdminDeductions from "@/components/admin/AdminDeductions";
import AdminCashAnalysis from "@/components/admin/AdminCashAnalysis";

interface AdminDashboardLayoutProps {
  onLogout: () => void;
}

const AdminDashboardLayout = ({ onLogout }: AdminDashboardLayoutProps) => {
  const [activeSection, setActiveSection] = useState("dashboard");

  // Sidebar mobile open/close
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Close sidebar when clicking outside (mobile only)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isSidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSidebarOpen]);

  const renderSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <AdminDashboardOverview />;
      case "membership":
        return <AdminMembership />;
      case "welfare":
        return <AdminWelfare />;
      case "shares":
        return <AdminShares />;
      case "loans":
        return <AdminLoans />;
      case "daily-deposits":
        return <AdminDailyDeposits />;
      case "deductions":
        return <AdminDeductions />;
      case "cash-analysis":
        return <AdminCashAnalysis />;
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/20">
        {/* Header */}
        <Header
          isLoggedIn
          onLogout={onLogout}
          onMenuClick={() => setIsSidebarOpen(true)}
        />

        <div className="flex flex-1 relative">
          {/* --- Mobile Sidebar Overlay --- */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/40 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* --- Sidebar --- */}
          <div
            ref={sidebarRef}
            className={`
              fixed top-20 left-0 z-50 h-[calc(100vh-80px)] w-64 bg-white shadow-lg
              transform transition-transform duration-300
              ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
              md:translate-x-0 overflow-y-auto
            `}
          >
            <AdminSidebar
              activeSection={activeSection}
              onSectionChange={(section) => {
                setActiveSection(section);
                setIsSidebarOpen(false);
              }}
            />
          </div>

          {/* --- Main content --- */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 md:ml-64">
            {renderSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardLayout;
