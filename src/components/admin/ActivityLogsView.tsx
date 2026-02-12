import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Activity, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface Log {
  _id: string;
  action: string;
  targetType?: string;
  targetId?: string;
  reason?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  createdAt: string;
  adminId?: { username: string; email: string };
}

const actionColors: Record<string, string> = {
  LOGIN: "bg-blue-100 text-blue-800",
  LOGOUT: "bg-gray-100 text-gray-800",
  PASSWORD_CHANGE: "bg-yellow-100 text-yellow-800",
  USER_BLOCK: "bg-red-100 text-red-800",
  USER_UNBLOCK: "bg-green-100 text-green-800",
  PROJECT_DELETE: "bg-red-100 text-red-800",
  ESCROW_EDIT: "bg-orange-100 text-orange-800",
  ESCROW_RELEASE: "bg-emerald-100 text-emerald-800",
  ESCROW_REFUND: "bg-amber-100 text-amber-800",
  ESCROW_BLOCK: "bg-red-100 text-red-800",
  REVIEW_DELETE: "bg-pink-100 text-pink-800",
  SETTINGS_UPDATE: "bg-violet-100 text-violet-800",
  CONTENT_UPDATE: "bg-indigo-100 text-indigo-800",
  CATEGORY_CREATE: "bg-teal-100 text-teal-800",
  CATEGORY_UPDATE: "bg-sky-100 text-sky-800",
  CATEGORY_DELETE: "bg-rose-100 text-rose-800",
  OTHER: "bg-gray-100 text-gray-800",
};

const actionTypes = [
  "LOGIN", "LOGOUT", "PASSWORD_CHANGE",
  "USER_BLOCK", "USER_UNBLOCK",
  "PROJECT_DELETE",
  "ESCROW_EDIT", "ESCROW_RELEASE", "ESCROW_REFUND", "ESCROW_BLOCK",
  "REVIEW_DELETE",
  "SETTINGS_UPDATE", "CONTENT_UPDATE",
  "CATEGORY_CREATE", "CATEGORY_UPDATE", "CATEGORY_DELETE",
];

const ActivityLogsView = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-logs", page, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "50");
      if (actionFilter !== "all") params.set("action", actionFilter);
      const res = await axios.get(`${API}/admin/activity-logs?${params}`, {
        withCredentials: true,
      });
      return res.data;
    },
    placeholderData: { logs: [], pagination: { total: 0, pages: 1 } },
  });

  const { logs = [], pagination = { total: 0, pages: 1 } } = data || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-8 w-8 text-violet-600" />
        <div>
          <h2 className="text-3xl font-bold">Activity Logs</h2>
          <p className="text-muted-foreground">{pagination.total} total log entries</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Filter by action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            {actionTypes.map((a) => (
              <SelectItem key={a} value={a}>{a.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {logs.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Date & Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log: Log) => (
                <TableRow key={log._id}>
                  <TableCell className="font-medium">{log.adminId?.username || "System"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || actionColors.OTHER}`}>
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {log.targetType && (
                      <Badge variant="outline" className="mr-1">{log.targetType}</Badge>
                    )}
                    {log.targetId ? String(log.targetId).substring(0, 8) + "..." : "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                    {log.reason || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {log.ipAddress || "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">No activity logs found</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
};

export default ActivityLogsView;
