import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  DollarSign,
  TrendingUp,
  UserX,
  CheckCircle,
  Clock,
  FolderKanban,
  Wallet,
  UserCheck,
  Briefcase,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface DashboardData {
  totalUsers: number;
  totalFreelancers: number;
  totalClients: number;
  totalProjects: number;
  totalEscrowHeld: number;
  totalRevenue: number;
  quickStats: {
    activeFreelancers: number;
    suspendedAccounts: number;
    completedProjects: number;
    pendingProjects: number;
    openProjects: number;
  };
}

export const Overview = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get(`${API}/admin/dashboard-overview`, {
          withCredentials: true,
        });
        setData(res.data);
      } catch (err) {
        console.error("Error fetching dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Failed to load dashboard data
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: data.totalUsers,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      title: "Freelancers",
      value: data.totalFreelancers,
      icon: Briefcase,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      title: "Clients",
      value: data.totalClients,
      icon: UserCheck,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      title: "Total Projects",
      value: data.totalProjects,
      icon: FolderKanban,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      title: "Escrow Held",
      value: `₹${data.totalEscrowHeld.toLocaleString()}`,
      icon: Wallet,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      title: "Total Revenue",
      value: `₹${data.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  const quickStats = [
    {
      label: "Active Freelancers",
      value: data.quickStats.activeFreelancers,
      icon: TrendingUp,
      color: "text-green-500",
    },
    {
      label: "Suspended Accounts",
      value: data.quickStats.suspendedAccounts,
      icon: UserX,
      color: "text-red-500",
    },
    {
      label: "Completed Projects",
      value: data.quickStats.completedProjects,
      icon: CheckCircle,
      color: "text-green-500",
    },
    {
      label: "In Progress",
      value: data.quickStats.pendingProjects,
      icon: Clock,
      color: "text-yellow-500",
    },
    {
      label: "Open Projects",
      value: data.quickStats.openProjects,
      icon: FolderKanban,
      color: "text-blue-500",
    },
  ];

  const chartData = [
    { name: "Users", value: data.totalUsers },
    { name: "Freelancers", value: data.totalFreelancers },
    { name: "Clients", value: data.totalClients },
    { name: "Projects", value: data.totalProjects },
    { name: "Completed", value: data.quickStats.completedProjects },
    { name: "Open", value: data.quickStats.openProjects },
  ];

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">
            Platform statistics at a glance
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts & Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
            <CardDescription>Users & Projects breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <span className="font-medium">{stat.label}</span>
                  </div>
                  <span className="text-xl font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
