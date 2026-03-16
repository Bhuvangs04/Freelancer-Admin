import { useState, useEffect, useCallback } from "react";
import {
  KeyRound, Plus, Loader2, Copy, Check, ShieldAlert,
  ShieldCheck, Trash2, Ban, ShieldOff, Activity, Hash, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

interface AiApiKey {
  _id: string;
  key: string;
  label: string;
  status: "active" | "blocked" | "revoked";
  requestLimit: number;
  usageCount: number;
  lastUsedAt: string | null;
  blockedReason: string | null;
  blockedAt: string | null;
  createdBy: { username: string } | null;
  createdAt: string;
  recentRequests: number;
}

interface Stats {
  totalKeys: number;
  activeKeys: number;
  blockedKeys: number;
  totalUsage: number;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export const AiApiKeysView = () => {
  const [keys, setKeys] = useState<AiApiKey[]>([]);
  const [stats, setStats] = useState<Stats>({ totalKeys: 0, activeKeys: 0, blockedKeys: 0, totalUsage: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [creating, setCreating] = useState(false);

  // Created key display
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Block dialog
  const [blockTarget, setBlockTarget] = useState<AiApiKey | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [blocking, setBlocking] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<AiApiKey | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch keys ──────────────────────────────────────
  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/ai-keys");
      setKeys(res.data.keys || []);
      setStats(res.data.stats || { totalKeys: 0, activeKeys: 0, blockedKeys: 0, totalUsage: 0 });
    } catch {
      setMsg({ type: "error", text: "Failed to load API keys" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKeys(); }, [fetchKeys]);

  // ─── Create key ──────────────────────────────────────
  const handleCreate = async () => {
    if (!newLabel.trim()) return;
    setCreating(true);
    setMsg(null);
    try {
      const res = await api.post("/admin/ai-keys", {
        label: newLabel.trim(),
        requestLimit: parseInt(newLimit) || 0,
      });
      setCreatedKey(res.data.apiKey.key);
      setNewLabel("");
      setNewLimit("");
      setShowCreate(false);
      fetchKeys();
      setMsg({ type: "success", text: "API key created successfully. Copy it now — it won't be shown again." });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to create key" });
    } finally {
      setCreating(false);
    }
  };

  // ─── Block key ───────────────────────────────────────
  const handleBlock = async () => {
    if (!blockTarget || !blockReason.trim()) return;
    setBlocking(true);
    try {
      await api.put(`/admin/ai-keys/${blockTarget._id}/block`, { reason: blockReason.trim() });
      setBlockTarget(null);
      setBlockReason("");
      fetchKeys();
      setMsg({ type: "success", text: "API key blocked" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to block key" });
    } finally {
      setBlocking(false);
    }
  };

  // ─── Unblock key ─────────────────────────────────────
  const handleUnblock = async (key: AiApiKey) => {
    try {
      await api.put(`/admin/ai-keys/${key._id}/unblock`);
      fetchKeys();
      setMsg({ type: "success", text: "API key unblocked" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to unblock key" });
    }
  };

  // ─── Delete key ──────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/ai-keys/${deleteTarget._id}`);
      setDeleteTarget(null);
      fetchKeys();
      setMsg({ type: "success", text: "API key deleted" });
    } catch (err: any) {
      setMsg({ type: "error", text: err.response?.data?.message || "Failed to delete key" });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Clipboard ───────────────────────────────────────
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── Status badge ────────────────────────────────────
  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200"><ShieldCheck className="h-3 w-3 mr-1" />Active</Badge>;
      case "blocked":
        return <Badge className="bg-red-100 text-red-800 border-red-200"><ShieldAlert className="h-3 w-3 mr-1" />Blocked</Badge>;
      case "revoked":
        return <Badge className="bg-gray-100 text-gray-600 border-gray-200"><ShieldOff className="h-3 w-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // ─── Usage progress ──────────────────────────────────
  const usageProgress = (key: AiApiKey) => {
    if (key.requestLimit === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          {key.usageCount.toLocaleString()} <span className="text-xs">/ Unlimited</span>
        </div>
      );
    }
    const pct = Math.min((key.usageCount / key.requestLimit) * 100, 100);
    return (
      <div className="space-y-1 min-w-[120px]">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{key.usageCount.toLocaleString()}</span>
          <span>{key.requestLimit.toLocaleString()}</span>
        </div>
        <Progress
          value={pct}
          className={`h-2 ${pct >= 90 ? "[&>div]:bg-red-500" : pct >= 70 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500"}`}
        />
      </div>
    );
  };

  // ─── Render ──────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage API keys for AI microservice authentication
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" /> Create Key
        </Button>
      </div>

      {/* Alert */}
      {msg && (
        <Alert
          variant={msg.type === "error" ? "destructive" : "default"}
          className={msg.type === "success" ? "border-green-200 bg-green-50 text-green-800" : ""}
        >
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 rounded-lg">
                <KeyRound className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalKeys}</p>
                <p className="text-xs text-muted-foreground">Total Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeKeys}</p>
                <p className="text-xs text-muted-foreground">Active Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldAlert className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.blockedKeys}</p>
                <p className="text-xs text-muted-foreground">Blocked Keys</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalUsage.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total API Calls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keys Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Hash className="h-5 w-5 text-violet-600" /> API Keys
          </CardTitle>
          <CardDescription>All AI gateway API keys and their usage</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
            </div>
          ) : keys.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <KeyRound className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>No API keys yet. Create one to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Label</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Usage / Limit</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((k) => (
                    <TableRow key={k._id}>
                      <TableCell className="font-medium">{k.label}</TableCell>
                      <TableCell>
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{k.key}</code>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {statusBadge(k.status)}
                          {k.blockedReason && (
                            <p className="text-xs text-red-500 mt-1">{k.blockedReason}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{usageProgress(k)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {k.lastUsedAt
                          ? new Date(k.lastUsedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {k.createdBy?.username || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          {k.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() => { setBlockTarget(k); setBlockReason(""); }}
                            >
                              <Ban className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          {k.status === "blocked" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleUnblock(k)}
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setDeleteTarget(k)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Create Key Dialog ─── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create AI API Key</DialogTitle>
            <DialogDescription>
              Generate a new API key for AI microservice authentication.
              The key will only be shown once after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Label *</Label>
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g., Recommender Service"
              />
            </div>
            <div className="space-y-2">
              <Label>Request Limit</Label>
              <Input
                type="number"
                min="0"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                placeholder="0 = Unlimited"
              />
              <p className="text-xs text-muted-foreground">
                Maximum number of requests allowed. Set to 0 for unlimited.
                The key will be automatically blocked when the limit is reached.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !newLabel.trim()}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Show Created Key Dialog ─── */}
      <Dialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-violet-600" /> API Key Created
            </DialogTitle>
            <DialogDescription>
              Copy this key now. For security, it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 p-3 bg-violet-50 border border-violet-200 rounded-lg">
              <code className="flex-1 text-sm font-mono break-all text-violet-900">
                {createdKey}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(createdKey!)}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Alert className="border-amber-200 bg-amber-50 text-amber-800">
              <AlertDescription className="text-sm">
                ⚠️ Store this key securely. It cannot be retrieved after closing this dialog.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedKey(null)} className="bg-violet-600 hover:bg-violet-700">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Block Key Dialog ─── */}
      <Dialog open={!!blockTarget} onOpenChange={() => setBlockTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-amber-700">Block API Key</DialogTitle>
            <DialogDescription>
              Block "{blockTarget?.label}" — it will no longer be able to make requests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label>Reason *</Label>
            <Textarea
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Why is this key being blocked?"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleBlock}
              disabled={blocking || !blockReason.trim()}
            >
              {blocking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Ban className="h-4 w-4 mr-2" />}
              Block Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Key Dialog ─── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete "{deleteTarget?.label}"? This cannot be undone.
              Any service using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AiApiKeysView;
