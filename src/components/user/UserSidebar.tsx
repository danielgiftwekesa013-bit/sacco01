import {
  LayoutDashboard,
  Wallet,
  Heart,
  PieChart,
  Users,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowUpCircle,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface UserSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen?: boolean;       // new
  onClose?: () => void;    // new
}

const UserSidebar = ({ activeSection, onSectionChange, isOpen, onClose }: UserSidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "loans", label: "Loans", icon: Wallet },
    { id: "welfare", label: "Welfare", icon: Heart },
    { id: "shares", label: "Shares", icon: PieChart },
    { id: "membership", label: "Membership", icon: Users },
    { id: "daily-deposit", label: "Daily Deposit", icon: Calendar },
    { id: "deductions", label: "Deductions", icon: AlertCircle },
    { id: "financial-reports", label: "Financial Reports", icon: TrendingUp, },
    { id: "deposit", label: "Make Deposit", icon: ArrowUpCircle },
  ];

  return (
    <>
      {/* Overlay on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed z-50 top-0 left-0 h-full w-64 bg-white shadow-lg
          transform transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:flex-shrink-0
        `}
      >
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-lg font-semibold text-primary">
              Member Portal
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => {
                        onSectionChange(item.id);
                        onClose?.(); // close sidebar on mobile after click
                      }}
                      isActive={activeSection === item.id}
                      className="flex items-center gap-3 text-base"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </aside>
    </>
  );
};

export default UserSidebar;
