import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  IndianRupee,
  Clock,
  Ban,
} from "lucide-react";
import api from "@/lib/api";

interface BankDetails {
  accountNumber: string;
  accountName: string;
  ifscCode: string;
}

interface Withdrawal {
  _id: string;
  freelancerId: { _id: string; username: string; email: string } | string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  description?: string;
  bankDetails: BankDetails;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const PayoutPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [page, setPage] = useState(1);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<Withdrawal | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  // ── Fetch withdrawals ──────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["withdrawals", statusFilter, page],
    queryFn: async () => {
      const res = await api.get(
        `/admin/withdrawals?status=${statusFilter}&page=${page}&limit=20`
      );
      return res.data;
    },
    placeholderData: { requests: [], pagination: { total: 0, pages: 1 } },
  });

  const { requests = [], pagination = { total: 0, pages: 1 } } = data || {};

  // ── Approve mutation ───────────────────────────────────────────────────────
  const approveMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note?: string }) => {
      const res = await api.post(`/admin/withdrawals/${id}/approve`, { note });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      setDetailsOpen(false);
      toast({
        title: "✅ Payout Approved",
        description: "Withdrawal marked as approved. Remember to process the bank transfer.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to approve payout",
        variant: "destructive",
      });
    },
  });

  // ── Reject mutation ────────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const res = await api.post(`/admin/withdrawals/${id}/reject`, { reason });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      setRejectOpen(false);
      setRejectReason("");
      setRejectTarget(null);
      toast({
        title: "❌ Payout Rejected",
        description: data.message || "Withdrawal rejected. Funds returned to freelancer's wallet.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err.response?.data?.message || "Failed to reject payout",
        variant: "destructive",
      });
    },
  });

  const openRejectDialog = (w: Withdrawal) => {
    setRejectTarget(w);
    setRejectReason("");
    setRejectOpen(true);
  };

  const confirmReject = () => {
    if (rejectTarget && rejectReason.trim().length >= 5) {
      rejectMutation.mutate({ id: rejectTarget._id, reason: rejectReason.trim() });
    }
  };

  const getFreelancerName = (w: Withdrawal) =>
    typeof w.freelancerId === "string" ? w.freelancerId : w.freelancerId.username;

  const getFreelancerEmail = (w: Withdrawal) =>
    typeof w.freelancerId === "string" ? "—" : w.freelancerId.email;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Withdrawal Requests</h2>
          <p className="text-muted-foreground mt-1">
            {pagination.total} total · approve or reject payout requests
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["withdrawals"] })}
            disabled={isFetching}
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Pending", color: "yellow", icon: Clock, filter: "pending" },
          { label: "Approved", color: "green", icon: CheckCircle, filter: "approved" },
          { label: "Rejected", color: "red", icon: Ban, filter: "rejected" },
        ].map(({ label, color, icon: Icon, filter }) => (
          <button
            key={filter}
            onClick={() => { setStatusFilter(filter); setPage(1); }}
            className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${statusFilter === filter
                ? `border-${color}-400 bg-${color}-50`
                : "border-border bg-card hover:border-border/60"
              }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`h-4 w-4 text-${color}-600`} />
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <p className="text-2xl font-bold">{statusFilter === filter ? pagination.total : "—"}</p>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead>Freelancer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Bank Account</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    ))}
                </TableRow>
              ))
              : requests.length > 0
                ? requests.map((w: Withdrawal) => (
                  <TableRow key={w._id} className="hover:bg-muted/20">
                    <TableCell>
                    <div>
                      <p className="font-medium">{getFreelancerName(w)}</p>
                      <p className="text-xs text-muted-foreground">{getFreelancerEmail(w)}</p>
                    </div>
                    </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(w.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    </TableCell>
                    <TableCell>
                    <div className="flex items-center gap-1 font-semibold text-green-700">
                      <IndianRupee className="h-3.5 w-3.5" />
                      {w.amount.toLocaleString("en-IN")}
                    </div>
                  </TableCell>
                    <TableCell>
                    <p className="text-sm">{w.bankDetails.accountName}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      ···{w.bankDetails.accountNumber.slice(-4)} · {w.bankDetails.ifscCode}
                    </p>
                  </TableCell>
                    <TableCell>
                      <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[w.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                      {w.status}
                      </span>
                    </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { setSelectedWithdrawal(w); setDetailsOpen(true); }}
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Details
                      </Button>
                      {w.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => approveMutation.mutate({ id: w._id })}
                            disabled={approveMutation.isPending}
                          >
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => openRejectDialog(w)}
                            disabled={rejectMutation.isPending}
                          >
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                    </TableCell>
                  </TableRow>
                ))
                : (
                <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <IndianRupee className="h-10 w-10 opacity-20" />
                        <p>No {statusFilter} withdrawal requests</p>
                      </div>
                  </TableCell>
                </TableRow>
              )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {pagination.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* Details Modal */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdrawal Details</DialogTitle>
          </DialogHeader>
          {selectedWithdrawal && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Freelancer</span>
                <span className="font-medium">{getFreelancerName(selectedWithdrawal)}</span>

                <span className="text-muted-foreground">Email</span>
                <span>{getFreelancerEmail(selectedWithdrawal)}</span>

                <span className="text-muted-foreground">Amount</span>
                <span className="font-semibold text-green-700">
                  ₹{selectedWithdrawal.amount.toLocaleString("en-IN")}
                </span>

                <span className="text-muted-foreground">Status</span>
                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border w-fit ${statusColors[selectedWithdrawal.status]}`}>
                  {selectedWithdrawal.status}
                </span>

                <span className="text-muted-foreground">Requested</span>
                <span>{new Date(selectedWithdrawal.createdAt).toLocaleString("en-IN")}</span>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg space-y-1">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Bank Details</p>
                <p className="text-sm font-medium">{selectedWithdrawal.bankDetails.accountName}</p>
                <p className="text-sm font-mono">{selectedWithdrawal.bankDetails.accountNumber}</p>
                <p className="text-sm text-muted-foreground">IFSC: {selectedWithdrawal.bankDetails.ifscCode}</p>
              </div>

              {selectedWithdrawal.description && (
                <div className="text-sm text-muted-foreground border-t pt-3">
                  <p className="font-medium text-foreground mb-1">Notes</p>
                  <p>{selectedWithdrawal.description}</p>
                </div>
              )}

              {selectedWithdrawal.status === "pending" && (
                <DialogFooter className="gap-2 pt-2">
                  <Button
                    variant="destructive"
                    onClick={() => { setDetailsOpen(false); openRejectDialog(selectedWithdrawal); }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject & Refund
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => approveMutation.mutate({ id: selectedWithdrawal._id })}
                    disabled={approveMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {approveMutation.isPending ? "Approving..." : "Approve Payout"}
                  </Button>
                </DialogFooter>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={rejectOpen} onOpenChange={(o) => { if (!o) { setRejectOpen(false); setRejectReason(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Reject Withdrawal
            </DialogTitle>
            <DialogDescription>
              This will reject the withdrawal of{" "}
              <strong>₹{rejectTarget?.amount?.toLocaleString("en-IN")}</strong> and
              automatically return the funds to the freelancer's wallet balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label htmlFor="reject-reason">
              Rejection Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Bank details are incorrect, suspicious account, dispute pending..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Minimum 5 characters required</p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setRejectOpen(false); setRejectReason(""); }}
              disabled={rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={rejectReason.trim().length < 5 || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PayoutPage;
