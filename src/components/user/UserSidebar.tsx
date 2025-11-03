import {
  LayoutDashboard,
  Wallet,
  Heart,
  PieChart,
  Users,
  Calendar,
  AlertCircle,
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
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface UserSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const UserSidebar = ({ activeSection, onSectionChange }: UserSidebarProps) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "loans", label: "Loans", icon: Wallet },
    { id: "welfare", label: "Welfare", icon: Heart },
    { id: "shares", label: "Shares", icon: PieChart },
    { id: "membership", label: "Membership", icon: Users },
    { id: "daily-deposit", label: "Daily Deposit", icon: Calendar },
    { id: "deductions", label: "Deductions", icon: AlertCircle },
    { id: "deposit", label: "Make Deposit", icon: ArrowUpCircle },
  ];

  return (
    <Sidebar>
      <SidebarTrigger className="m-2 self-end" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Member Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onSectionChange(item.id)}
                    isActive={activeSection === item.id}
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
    </Sidebar>
  );
};

export default UserSidebar;
