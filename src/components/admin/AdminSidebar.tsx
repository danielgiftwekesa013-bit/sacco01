import {
  LayoutDashboard,
  Users,
  Heart,
  PieChart,
  Wallet,
  Calendar,
  AlertCircle,
  TrendingUp,
  DollarSign,
  UserCheck,
} from "lucide-react";

import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "membership", label: "Membership", icon: Users },
    { id: "welfare", label: "Welfare", icon: Heart },
    { id: "shares", label: "Shares", icon: PieChart },
    { id: "loans", label: "Loans", icon: Wallet },
    { id: "daily-deposits", label: "Daily Deposits", icon: Calendar },
    { id: "deductions", label: "Deductions", icon: AlertCircle },
    { id: "cash-analysis", label: "Cash Analysis", icon: TrendingUp },
    { id: "cashflow", label: "Cashflow", icon: DollarSign },
    { id: "user-management", label: "Members & Accounts", icon: UserCheck },
  ];

  return (
    <SidebarContent className="h-full bg-black text-yellow-400">
      <SidebarGroup>
        <SidebarGroupLabel className="text-lg font-semibold text-yellow-400">
          Admin Portal
        </SidebarGroupLabel>

        <SidebarGroupContent>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton
                  onClick={() => onSectionChange(item.id)}
                  isActive={activeSection === item.id}
                  className={`flex items-center gap-3 text-base ${
                    activeSection === item.id ? "bg-yellow-400 text-black" : ""
                  }`}
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
  );
};

export default AdminSidebar;
