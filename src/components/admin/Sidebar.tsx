import { 
  Users, 
  LayoutDashboard, 
  Mail, 
  AlertCircle, 
  CreditCard,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
  { title: "Users", icon: Users, id: "users" },
  { title: "Payments", icon: CreditCard, id: "payments" },
  { title: "Reports", icon: AlertCircle, id: "reports" },
  { title: "Email", icon: Mail, id: "email" },
];

export const Sidebar = ({ 
  setCurrentView, 
  currentView 
}: { 
  setCurrentView: (view: string) => void;
  currentView: string;
}) => {
  return (
    <ShadcnSidebar>
      <SidebarContent>
        <div className="p-4">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setCurrentView(item.id)}
                    className={cn(
                      currentView === item.id && "bg-secondary"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
};