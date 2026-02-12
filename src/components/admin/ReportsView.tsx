import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Users, FolderKanban, DollarSign, Briefcase } from "lucide-react";

const API = import.meta.env.VITE_API_URL;

const reports = [
  {
    title: "User List Report",
    description: "Export all registered users with their details",
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
    url: `${API}/admin/reports/users/excel`,
  },
  {
    title: "Project List Report",
    description: "Export all projects with client & freelancer details",
    icon: FolderKanban,
    color: "text-purple-600",
    bg: "bg-purple-50",
    url: `${API}/admin/reports/projects/excel`,
  },
  {
    title: "Transaction History",
    description: "Export all payment transactions",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
    url: `${API}/admin/reports/transactions/excel`,
  },
  {
    title: "Payout History",
    description: "Export all freelancer payout records",
    icon: Briefcase,
    color: "text-orange-600",
    bg: "bg-orange-50",
    url: `${API}/admin/reports/payouts/excel`,
  },
];

const ReportsView = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Reports</h2>
        <p className="text-muted-foreground">Download Excel reports for your records</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => (
          <Card key={report.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className={`p-3 rounded-lg ${report.bg}`}>
                <report.icon className={`h-6 w-6 ${report.color}`} />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <CardDescription>{report.description}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <a href={report.url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Excel
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsView;
