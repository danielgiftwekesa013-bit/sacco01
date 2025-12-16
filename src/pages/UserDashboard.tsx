import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { SidebarProvider } from "@/components/ui/sidebar";
import UserSidebar from "@/components/user/UserSidebar";
import DashboardOverview from "@/components/user/DashboardOverview";
import LoansSection from "@/components/user/LoansSection";
import WelfareSection from "@/components/user/WelfareSection";
import SharesSection from "@/components/user/SharesSection";
import MembershipSection from "@/components/user/MembershipSection";
import DailyDepositSection from "@/components/user/DailyDepositSection";
import DeductionsSection from "@/components/user/DeductionsSection";
import DepositSection from "@/components/user/DepositSection";

const UserDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false); // new
  const navigate = useNavigate();

  const handleLogout = () => navigate("/");

  const renderSection = () => {
    switch (activeSection) {
      case "loans":
        return <LoansSection />;
      case "welfare":
        return <WelfareSection />;
      case "shares":
        return <SharesSection />;
      case "membership":
        return <MembershipSection />;
      case "daily-deposit":
        return <DailyDepositSection />;
      case "deductions":
        return <DeductionsSection />;
      case "deposit":
        return <DepositSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col">
        <Header
          isLoggedIn
          onLogout={handleLogout}
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} // toggles sidebar on mobile
        />

        <div className="flex flex-1">
          <UserSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            isOpen={sidebarOpen} // pass open state
            onClose={() => setSidebarOpen(false)} // allow sidebar to close on mobile
          />

          <main className="flex-1 overflow-y-auto bg-muted/30 p-4 md:p-6">
            {renderSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default UserDashboard;
