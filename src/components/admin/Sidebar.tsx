import {
  Users,
  LayoutDashboard,
  CreditCard,
  Briefcase,
  FolderKanban,
  Wallet,
  Settings,
  FileText,
  Star,
  BarChart3,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
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

const menuSections = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", icon: LayoutDashboard, id: "dashboard" },
    ],
  },
  {
    label: "Management",
    items: [
      { title: "Users", icon: Users, id: "users" },
      { title: "Projects", icon: FolderKanban, id: "projects" },
      { title: "Escrow", icon: Wallet, id: "escrow" },
      { title: "Disputes", icon: AlertTriangle, id: "disputes" },
    ],
  },
  {
    label: "Finance",
    items: [
      { title: "Payments", icon: CreditCard, id: "payments" },
      { title: "Payouts", icon: Briefcase, id: "payout" },
    ],
  },
  {
    label: "Platform",
    items: [
      { title: "Settings", icon: Settings, id: "settings" },
      { title: "Content", icon: FileText, id: "content" },
      { title: "Reviews", icon: Star, id: "reviews" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { title: "Reports", icon: BarChart3, id: "reports" },
      { title: "Activity Logs", icon: Activity, id: "logs" },
      { title: "Performance", icon: BarChart3, id: "performance" },
    ],
  },
];

export const Sidebar = ({
  setCurrentView,
  currentView,
}: {
  setCurrentView: (view: string) => void;
  currentView: string;
}) => {
  return (
    <ShadcnSidebar>
      <SidebarContent>
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Panel
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">FreelancerHub</p>
        </div>
        {menuSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setCurrentView(item.id)}
                      className={cn(
                        "transition-colors",
                        currentView === item.id &&
                        "bg-violet-50 text-violet-700 font-medium"
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
        ))}
      </SidebarContent>
    </ShadcnSidebar>
  );
};
