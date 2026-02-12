import { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Activity, Clock, AlertTriangle, List, PieChart as PieChartIcon, Users, Monitor, TrendingUp } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
  LineChart,
  Line,
} from "recharts";

interface SummaryStats {
  totalRequests: number;
  avgLatency: number;
  maxLatency: number;
  slowRequests: number;
  slowPercent: number;
}

interface EndpointMetric {
  method: string;
  route: string;
  count: number;
  avgLatency: number;
  maxLatency: number;
}

interface SlowRequest {
  _id: string;
  method: string;
  path: string;
  latency: number;
  statusCode: number;
  createdAt: string;
  userId?: string;
}

interface TimeSeriesPoint {
  time: string;
  requests: number;
  latency: number;
  errors: number;
}

interface AdvancedStats {
  statusCodes: { code: number; count: number }[];
  userRoles: { role: string; count: number; avgLatency: number }[];
  platforms: { ua: string; count: number }[];
  timeSeries?: TimeSeriesPoint[];
}

export default function PerformanceView() {
  const [period, setPeriod] = useState("24h");
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [topEndpoints, setTopEndpoints] = useState<EndpointMetric[]>([]);
  const [slowRequests, setSlowRequests] = useState<SlowRequest[]>([]);
  const [advanced, setAdvanced] = useState<AdvancedStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${import.meta.env.VITE_API_URL}/admin/metrics/summary?period=${period}`,
        { withCredentials: true }
      );
      if (data.success) {
        setSummary(data.summary);
        setTopEndpoints(data.topEndpoints);
        setSlowRequests(data.slowestRequests);
        setAdvanced(data.advanced);
      }
    } catch (error) {
      console.error("Failed to fetch metrics", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [period]);

  const downloadReport = () => {
    const report = {
      period,
      generatedAt: new Date().toISOString(),
      summary,
      advanced,
      topEndpoints,
      slowRequests,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance-report-${period}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Performance</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of API latency, throughput, and user activity.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last 1 Hour</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={downloadReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Requests"
          value={summary?.totalRequests.toLocaleString() || "0"}
          icon={<List className="h-4 w-4 text-muted-foreground" />}
          description={`In the last ${period}`}
        />
        <StatsCard
          title="Avg Latency"
          value={`${summary?.avgLatency || 0} ms`}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
          description="Average response time"
        />
        <StatsCard
          title="Max Latency"
          value={`${summary?.maxLatency || 0} ms`}
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
          description="Slowest request peak"
        />
        <StatsCard
          title="Slow Requests"
          value={summary?.slowRequests.toLocaleString() || "0"}
          icon={<AlertTriangle className="h-4 w-4 text-yellow-500" />}
          description={`${summary?.slowPercent}% of total traffic`}
        />
      </div>

      {/* Time Series Charts - The "Real System" Metrics */}
      {advanced?.timeSeries && advanced.timeSeries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Traffic & Errors Trend */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" /> Traffic Volume & Errors
              </CardTitle>
              <CardDescription>Requests per time interval</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={advanced.timeSeries}>
                  <defs>
                    <linearGradient id="colorReqs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorErrs" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="requests" stroke="#3b82f6" fillOpacity={1} fill="url(#colorReqs)" name="Requests" />
                  <Area type="monotone" dataKey="errors" stroke="#ef4444" fillOpacity={1} fill="url(#colorErrs)" name="Errors" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Latency Trend */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" /> API Latency Trend
              </CardTitle>
              <CardDescription>Average response time (ms)</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={advanced.timeSeries}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="latency" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 8 }} name="Avg Latency (ms)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Advanced Distribution Charts Section */}
      {advanced && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Status Codes Distribution */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-4 w-4" /> Response Codes
              </CardTitle>
              <CardDescription>Distribution of HTTP status codes</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px] flex justify-center items-center">
              {advanced.statusCodes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={advanced.statusCodes}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="count"
                      nameKey="code"
                    >
                      {advanced.statusCodes.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.code >= 500 ? "#ef4444" : entry.code >= 400 ? "#f59e0b" : "#22c55e"} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm">No data available</p>
              )}
            </CardContent>
          </Card>

          {/* User Role Traffic */}
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-4 w-4" /> Traffic by Role
              </CardTitle>
              <CardDescription>Who is using the platform?</CardDescription>
            </CardHeader>
            <CardContent className="h-[250px]">
               {advanced.userRoles.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={advanced.userRoles}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="#3b82f6" name="Requests" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
               ) : (
                <div className="flex h-full items-center justify-center">
                   <p className="text-muted-foreground text-sm">No user role data</p>
                </div>
               )}
            </CardContent>
          </Card>

           {/* Platform/OS */}
           <Card className="col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-4 w-4" /> Top Platforms
              </CardTitle>
              <CardDescription>Most common user agents</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2">
                {advanced.platforms.map((p, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                      <span className="text-sm truncate max-w-[150px]" title={p.ua}>
                        {p.ua || "Unknown"}
                      </span>
                    </div>
                    <Badge variant="secondary">{p.count}</Badge>
                  </div>
                ))}
                {advanced.platforms.length === 0 && (
                   <p className="text-center text-muted-foreground text-sm py-8">No platform data</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Endpoints */}
        <Card className="col-span-1 border-t-4 border-t-primary/20">
          <CardHeader>
            <CardTitle>Top Endpoints (by Load)</CardTitle>
            <CardDescription>Most frequently accessed API routes</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead className="text-right">Reqs</TableHead>
                  <TableHead className="text-right">Lat(ms)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topEndpoints.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  topEndpoints.slice(0, 5).map((ep, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <MethodBadge method={ep.method} />
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]" title={ep.route}>
                        {ep.route}
                      </TableCell>
                      <TableCell className="text-right">{ep.count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {ep.avgLatency}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Slowest Requests Table */}
        <Card className="col-span-1 border-t-4 border-t-yellow-500/20">
          <CardHeader>
            <CardTitle>Recent Slow Requests</CardTitle>
            <CardDescription>Requests taking longer than expected</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Method</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead className="text-right">Lat(ms)</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slowRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                      No slow requests recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  slowRequests.slice(0, 5).map((req) => (
                    <TableRow key={req._id}>
                      <TableCell>
                        <MethodBadge method={req.method} />
                      </TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[200px]" title={req.path}>
                        {req.path}
                      </TableCell>
                      <TableCell className="text-right font-medium text-yellow-600">
                        {req.latency}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleTimeString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    POST: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
    DELETE: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${colors[method] || "bg-gray-100 text-gray-800"}`}>
      {method}
    </span>
  );
}
