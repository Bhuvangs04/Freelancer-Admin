import { useState, useEffect, useCallback } from "react";
import {
  UserPlus, Shield, Trash2, Ban, CheckCircle, RotateCcw,
  Loader2, Search, Mail, AlertTriangle, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface AdminData {
  _id: string;
  username: string;
  email: string;
  role: "admin" | "super_admin";
  isActive: boolean;
  twoFactorEnabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  mustChangePassword: boolean;
}

// ─────────────────────────────────────────────────────────
// Admin Management View (Super Admin Only)
// ─────────────────────────────────────────────────────────

export const AdminManagementView = () => {
  const [admins, setAdmins] = useState<AdminData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Create admin state
  const [createOpen, setCreateOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // ─── Load Admins ──────────────────────────────────────
  const loadAdmins = useCallback(async () => {
    try {
      const res = await api.get("/admin/management/admins");
      setAdmins(res.data.admins);
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to load admins" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdmins();
  }, [loadAdmins]);

  // ─── Create Admin ─────────────────────────────────────
  const handleCreateAdmin = async () => {
    setCreateLoading(true);
    setMessage(null);
    try {
      await api.post("/admin/management/admins", {
        username: newUsername,
        email: newEmail,
      });
      setMessage({ type: "success", text: "Admin created. Credentials (including auto-generated secret code) sent via email." });
      setCreateOpen(false);
      setNewUsername("");
      setNewEmail("");
      loadAdmins();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || "Failed to create admin" });
    } finally {
      setCreateLoading(false);
    }
  };

  // ─── Admin Actions ────────────────────────────────────
  const handleAction = async (adminId: string, action: string, label: string) => {
    if (!confirm(`Are you sure you want to ${label}?`)) return;
    setActionLoading(adminId + action);
    setMessage(null);
    try {
      switch (action) {
        case "block":
          await api.put(`/admin/management/admins/${adminId}/block`, { reason: "Blocked by Super Admin" });
          break;
        case "unblock":
          await api.put(`/admin/management/admins/${adminId}/unblock`);
          break;
        case "delete":
          await api.delete(`/admin/management/admins/${adminId}`, { data: { reason: "Deleted by Super Admin" } });
          break;
        case "reset-password":
          await api.post(`/admin/management/admins/${adminId}/reset-password`);
          break;
        case "reset-mfa":
          await api.post(`/admin/management/admins/${adminId}/reset-mfa`);
          break;
      }
      setMessage({ type: "success", text: `Action "${label}" completed successfully` });
      loadAdmins();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.message || `Failed: ${label}` });
    } finally {
      setActionLoading(null);
    }
  };

  // ─── Filter admins ────────────────────────────────────
  const filtered = admins.filter(
    (a) =>
      a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-violet-600" />
            Admin Management
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage admin accounts, roles, and security
          </p>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-violet-600 hover:bg-violet-700">
              <UserPlus className="mr-2 h-4 w-4" /> Add Admin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Admin</DialogTitle>
              <DialogDescription>
                The new admin will receive credentials via email and must enable 2FA on first login.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="e.g., john_doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="admin@example.com" />
              </div>
              <p className="text-xs text-muted-foreground bg-blue-50 border border-blue-200 rounded-md p-3">A secure secret code, temporary password, and login instructions will be auto-generated and sent to the admin's email.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateAdmin} disabled={createLoading || !newUsername || !newEmail} className="bg-violet-600 hover:bg-violet-700">
                {createLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Admin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"} className={message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search admins..." className="pl-9" />
      </div>

      {/* Admin Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Administrators ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>2FA</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((admin) => (
                <TableRow key={admin._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{admin.username}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={admin.role === "super_admin" ? "border-amber-300 text-amber-700 bg-amber-50" : "border-violet-200 text-violet-700"}>
                      {admin.role === "super_admin" ? "Super Admin" : "Admin"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={admin.isActive ? "default" : "destructive"} className={admin.isActive ? "bg-green-100 text-green-800 border-green-200" : ""}>
                      {admin.isActive ? "Active" : "Blocked"}
                    </Badge>
                    {admin.mustChangePassword && (
                      <Badge variant="outline" className="ml-1 text-amber-600 border-amber-200 text-[10px]">
                        Must Change PW
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {admin.twoFactorEnabled ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <Shield className="h-3 w-3 mr-1" /> ON
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-50 text-red-600 border-red-200">
                        <AlertTriangle className="h-3 w-3 mr-1" /> OFF
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {admin.lastLoginAt
                      ? new Date(admin.lastLoginAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "Never"}
                  </TableCell>
                  <TableCell className="text-right">
                    {admin.role !== "super_admin" && (
                      <div className="flex items-center justify-end gap-1">
                        {admin.isActive ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(admin._id, "block", `block ${admin.username}`)}
                            disabled={actionLoading === admin._id + "block"}
                            className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 h-8 px-2"
                            title="Block"
                          >
                            {actionLoading === admin._id + "block" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAction(admin._id, "unblock", `unblock ${admin.username}`)}
                            disabled={actionLoading === admin._id + "unblock"}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 h-8 px-2"
                            title="Unblock"
                          >
                            {actionLoading === admin._id + "unblock" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(admin._id, "reset-password", `reset password for ${admin.username}`)}
                          disabled={actionLoading === admin._id + "reset-password"}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 h-8 px-2"
                          title="Reset Password"
                        >
                          {actionLoading === admin._id + "reset-password" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(admin._id, "reset-mfa", `reset MFA for ${admin.username}`)}
                          disabled={actionLoading === admin._id + "reset-mfa"}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 h-8 px-2"
                          title="Reset MFA"
                        >
                          {actionLoading === admin._id + "reset-mfa" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAction(admin._id, "delete", `permanently delete ${admin.username}`)}
                          disabled={actionLoading === admin._id + "delete"}
                          className="text-red-500 hover:text-red-800 hover:bg-red-50 h-8 px-2"
                          title="Delete"
                        >
                          {actionLoading === admin._id + "delete" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No admins found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
