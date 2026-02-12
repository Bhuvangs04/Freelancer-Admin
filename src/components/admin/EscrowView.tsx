import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, DollarSign, Lock, Undo2, ArrowUpRight, Pencil } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface Escrow {
  _id: string;
  amount: number;
  originalAmount?: number;
  status: string;
  createdAt: string;
  projectId?: { _id: string; title: string; budget: number; status: string };
  clientId?: { username: string; email: string };
  freelancerId?: { username: string; email: string };
}

type ActionType = "edit" | "release" | "refund" | "block" | null;

const EscrowView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    escrow: Escrow | null;
    action: ActionType;
  }>({ open: false, escrow: null, action: null });
  const [reason, setReason] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-escrow", page, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await axios.get(`${API}/admin/escrow?${params}`, {
        withCredentials: true,
      });
      return res.data;
    },
    placeholderData: { escrows: [], pagination: { total: 0, pages: 1 } },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ escrowId, action, payload }: {
      escrowId: string; action: ActionType; payload: Record<string, any>;
    }) => {
      const url = `${API}/admin/escrow/${escrowId}/${action}`;
      const res = await axios.put(url, payload, { withCredentials: true });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-escrow"] });
      toast({ title: "Success", description: data.message });
      closeDialog();
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Action failed",
        variant: "destructive",
      });
    },
  });

  const closeDialog = () => {
    setActionDialog({ open: false, escrow: null, action: null });
    setReason("");
    setNewAmount("");
  };

  const handleAction = () => {
    if (!actionDialog.escrow || !actionDialog.action) return;
    const payload: Record<string, any> = { reason };
    if (actionDialog.action === "edit") payload.newAmount = parseFloat(newAmount);
    actionMutation.mutate({
      escrowId: actionDialog.escrow._id,
      action: actionDialog.action,
      payload,
    });
  };

  const { escrows = [], pagination = { total: 0, pages: 1 } } = data || {};

  const statusColor: Record<string, string> = {
    funded: "bg-green-100 text-green-800",
    released: "bg-blue-100 text-blue-800",
    refunded: "bg-orange-100 text-orange-800",
    paid: "bg-emerald-100 text-emerald-800",
    adjusted: "bg-red-100 text-red-800",
    partial_refund: "bg-yellow-100 text-yellow-800",
  };

  const actionLabels: Record<string, string> = {
    edit: "Edit Amount",
    release: "Release to Freelancer",
    refund: "Refund to Client",
    block: "Block (Dispute)",
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Escrow Management</h2>
          <p className="text-muted-foreground">{pagination.total} escrow records</p>
        </div>
      </div>

      <div className="flex gap-3">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="funded">Funded (Held)</SelectItem>
            <SelectItem value="released">Released</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
            <SelectItem value="adjusted">Blocked</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {escrows.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Freelancer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {escrows.map((e: Escrow) => (
                <TableRow key={e._id}>
                  <TableCell className="font-medium max-w-[180px] truncate">
                    {e.projectId?.title || "N/A"}
                  </TableCell>
                  <TableCell className="font-semibold">₹{e.amount?.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[e.status] || ""}`}>
                      {e.status === "adjusted" ? "BLOCKED" : e.status.toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>{e.clientId?.username || "N/A"}</TableCell>
                  <TableCell>{e.freelancerId?.username || "N/A"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(e.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    {e.status === "funded" && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" title="Edit Amount"
                          onClick={() => setActionDialog({ open: true, escrow: e, action: "edit" })}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-green-600" title="Release"
                          onClick={() => setActionDialog({ open: true, escrow: e, action: "release" })}>
                          <ArrowUpRight className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-orange-600" title="Refund"
                          onClick={() => setActionDialog({ open: true, escrow: e, action: "refund" })}>
                          <Undo2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600" title="Block"
                          onClick={() => setActionDialog({ open: true, escrow: e, action: "block" })}>
                          <Lock className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">No escrow records found</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.action ? actionLabels[actionDialog.action] : ""}</DialogTitle>
            <DialogDescription>
              {actionDialog.escrow && (
                <>Project: {actionDialog.escrow.projectId?.title} — Current Amount: ₹{actionDialog.escrow.amount?.toLocaleString()}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {actionDialog.action === "edit" && (
              <div>
                <label className="text-sm font-medium">New Amount (₹)</label>
                <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Enter new amount" className="mt-1" />
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Reason *</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Provide a reason for this action..." className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleAction} disabled={!reason || (actionDialog.action === "edit" && !newAmount)}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EscrowView;
