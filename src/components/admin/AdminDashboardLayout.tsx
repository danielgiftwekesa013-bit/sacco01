import { useState } from "react";
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

interface AdminDashboardLayoutProps {
  onLogout: () => void;
}

const AdminDashboardLayout = ({ onLogout }: AdminDashboardLayoutProps) => {
  const [activeSection, setActiveSection] = useState("dashboard");

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
      default:
        return <AdminDashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header isLoggedIn onLogout={onLogout} />
        <div className="flex flex-1">
          <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboardLayout;
