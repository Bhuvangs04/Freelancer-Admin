import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  Gift,
  AlertTriangle,
  Wallet,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCcw,
} from "lucide-react";

interface BonusSummary {
  summary: {
    totalBonusesPaid: number;
    totalPenaltiesApplied: number;
    totalDeficitAmount: number;
    pendingDeficitCount: number;
    netImpact: number;
  };
  pendingDeficits: Array<{
    _id: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    milestoneTitle: string;
    description: string;
    createdAt: string;
  }>;
  recentBonuses: Array<{
    _id: string;
    userName: string;
    role: string;
    amount: number;
    milestoneTitle: string;
    createdAt: string;
  }>;
}

export const BonusPenaltyView = () => {
  const [data, setData] = useState<BonusSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [remindingId, setRemindingId] = useState<string | null>(null);

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/api/vi/finance/admin/bonus-penalty-summary");
      setData(response.data);
    } catch (err: any) {
      console.error("Failed to fetch bonus summary", err);
      setError(err.response?.data?.message || "Failed to load bonus and penalty tracking data.");
    } finally {
      setLoading(false);
    }
  };

  const resolveDeficit = async (deficitId: string) => {
    setResolvingId(deficitId);
    try {
      const response = await api.post(`/api/vi/finance/admin/deficits/${deficitId}/resolve`);
      // Update UI immediately or just refetch
      await fetchSummary();
      alert(response.data.message || "Deficit successfully resolved!");
    } catch (err: any) {
      console.error("Failed to resolve deficit", err);
      alert(err.response?.data?.message || "Failed to resolve deficit. The client may not have enough balance.");
    } finally {
      setResolvingId(null);
    }
  };

  const remindDeficit = async (deficitId: string) => {
    setRemindingId(deficitId);
    try {
      const response = await api.post(`/api/vi/finance/admin/deficits/${deficitId}/remind`);
      alert(response.data.message || "Reminder email sent successfully!");
    } catch (err: any) {
      console.error("Failed to send reminder", err);
      alert(err.response?.data?.message || "Failed to send reminder email.");
    } finally {
      setRemindingId(null);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 text-violet-600 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="text-slate-600 font-medium">{error}</p>
        <Button onClick={fetchSummary} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">
            Bonus & Penalty Tracking
          </h2>
          <p className="text-muted-foreground mt-1">
            Track milestone early-delivery bonuses, late penalties, and resolve client deficits.
          </p>
        </div>
        <Button onClick={fetchSummary} variant="outline" size="sm" className="hidden sm:flex">
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Bonuses Paid</CardTitle>
            <Gift className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.summary.totalBonusesPaid || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ArrowUpRight className="h-3 w-3 text-emerald-500" />
              Paid to freelancers
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Penalties Applied</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {formatCurrency(data?.summary.totalPenaltiesApplied || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-orange-500" />
              Refunded to clients
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-red-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Pending Deficits</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(data?.summary.totalDeficitAmount || 0)}
            </div>
            <p className="text-xs text-red-600/80 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {data?.summary.pendingDeficitCount} clients owe money
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border-violet-100 dark:border-violet-900/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-violet-700 dark:text-violet-400">Net Platform Impact</CardTitle>
            <Wallet className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(data?.summary.netImpact || 0) < 0 ? "text-emerald-600" : "text-violet-700 dark:text-violet-400"}`}>
              {formatCurrency(data?.summary.netImpact || 0)}
            </div>
            <p className="text-xs text-violet-600/80 dark:text-violet-400/80 mt-1 flex items-center gap-1">
              Bonuses minus penalties
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Deficits Table */}
        <Card className="md:col-span-2 border-red-200 shadow-sm shadow-red-100 dark:shadow-none dark:border-red-900/50">
          <CardHeader className="bg-red-50/50 dark:bg-red-950/20 border-b border-red-100 dark:border-red-900/50 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-900 dark:text-red-100 text-lg">Action Required: Client Deficits</CardTitle>
                <CardDescription className="text-red-700/70 dark:text-red-400/70">
                  Bonuses paid to freelancers where the client had insufficient wallet balance. Clients must be contacted to top up, then click Resolve.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {data?.pendingDeficits && data.pendingDeficits.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b-red-100">
                    <TableHead className="font-semibold">Client</TableHead>
                    <TableHead className="font-semibold">Milestone</TableHead>
                    <TableHead className="font-semibold text-right">Owed Amount</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.pendingDeficits.map((deficit) => (
                    <TableRow key={deficit._id}>
                      <TableCell>
                        <div className="font-medium text-slate-900">{deficit.clientName}</div>
                        <div className="text-xs text-slate-500">{deficit.clientEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate max-w-[200px]">
                          {deficit.milestoneTitle}
                          {deficit.description.includes("[LEGACY DEFICIT]") && (
                            <Badge variant="outline" className="ml-2 text-[10px] bg-amber-50 text-amber-600 border-amber-200">LEGACY</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200">
                          {formatCurrency(deficit.amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(deficit.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 hover:text-indigo-800"
                            onClick={() => remindDeficit(deficit._id)}
                            disabled={remindingId === deficit._id}
                            title="Send email reminder to client"
                          >
                            {remindingId === deficit._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                            onClick={() => resolveDeficit(deficit._id)}
                            disabled={resolvingId === deficit._id}
                            title="Resolve deficit after client tops up"
                          >
                            {resolvingId === deficit._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-1" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                            )}
                            Resolve
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-8 text-center flex flex-col items-center justify-center">
                <div className="h-12 w-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-medium text-slate-900">All clear!</h3>
                <p className="text-sm text-slate-500 max-w-sm mt-1">
                  There are no pending client deficits. All milestone bonuses have been successfully charged from client wallets.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Bonuses List */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Recent Early-Delivery Bonuses</CardTitle>
            <CardDescription>
              Latest bonuses successfully awarded to freelancers for early milestone completion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data?.recentBonuses && data.recentBonuses.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Milestone</TableHead>
                    <TableHead className="text-right">Bonus Amount</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentBonuses.map((bonus) => (
                    <TableRow key={bonus._id}>
                      <TableCell>
                        <div className="font-medium">{bonus.userName}</div>
                        <div className="text-xs text-slate-500 capitalize">{bonus.role?.replace("_", " ")}</div>
                      </TableCell>
                      <TableCell className="text-sm truncate max-w-[250px]">
                        {bonus.milestoneTitle}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium text-emerald-600">
                          +{formatCurrency(bonus.amount)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(bonus.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">
                No recent bonuses found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
