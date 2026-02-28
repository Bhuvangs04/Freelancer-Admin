import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertTriangle, Gavel, ArrowUpCircle, User, MessageSquare,
  Clock, ChevronLeft, FileText, Shield, DollarSign, RotateCcw,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL;

/* ──────────────── types ──────────────── */

interface Dispute {
  _id: string;
  disputeNumber: string;
  projectId: { _id: string; title: string; budget?: number; status?: string };
  clientId: { _id: string; username: string; email: string };
  freelancerId: { _id: string; username: string; email: string };
  filedBy: { _id?: string; username?: string } | string;
  filedAgainst: { _id?: string; username?: string } | string;
  filerRole: string;
  category: string;
  reason: string;
  amountInDispute: number;
  status: string;
  priority: string;
  assignedAdmin?: { _id: string; username: string } | null;
  arbitrationFeePaid: boolean;
  evidence: { _id: string; type: string; title: string; description?: string; url: string }[];
  chatLogs: { message: string; sender: string; senderRole: string; timestamp: string }[];
  respondentResponse?: { response: string; submittedAt: string; evidence: any[] };
  resolution?: {
    decision: string;
    awardedAmount: number;
    refundAmount: number;
    reasoning: string;
    resolvedAt: string;
  };
  responseDeadline?: string;
  resolutionDeadline?: string;
  createdAt: string;
}

interface AgreementRef {
  agreementNumber: string;
  agreedAmount: number;
  status: string;
  deliverables?: string;
  deadline?: string;
  clientSignature?: {
    signed: boolean;
    timestamp: string;
  };
  freelancerSignature?: {
    signed: boolean;
    timestamp: string;
  };
  createdAt: string;
}

interface EscrowRef {
  amount: number;
  originalAmount?: number;
  refundedAmount?: number;
  status: string;
}

/* ──────────────── helpers ──────────────── */

const statusColor: Record<string, string> = {
  pending_payment: "bg-gray-500",
  open: "bg-blue-600",
  under_review: "bg-yellow-600",
  awaiting_response: "bg-orange-500",
  resolved: "bg-green-600",
  escalated: "bg-red-600",
  withdrawn: "bg-gray-400",
};

const priorityColor: Record<string, string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-600",
};

const fmt = (d?: string) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/* ══════════════════════════════════════ */
/*              MAIN COMPONENT           */
/* ══════════════════════════════════════ */

export const DisputesView = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<Record<string, { count: number; totalAmount: number }>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  /* detail view */
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [agreementRef, setAgreementRef] = useState<AgreementRef | null>(null);
  const [escrowRef, setEscrowRef] = useState<EscrowRef | null>(null);

  /* resolution dialog */
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    decision: "",
    awardedAmount: 0,
    refundAmount: 0,
    reasoning: "",
    penaltyApplied: false,
  });

  /* clawback dialog */
  const [clawbackOpen, setClawbackOpen] = useState(false);
  const [clawbackForm, setClawbackForm] = useState({ amount: 0, reason: "" });
  const [clawbackLoading, setClawbackLoading] = useState(false);

  /* chat */
  const [chatMsg, setChatMsg] = useState("");

  /* ── fetch ── */
  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;

      const { data } = await axios.get(`${API}/api/vi/dispute/admin/dashboard`, {
        params,
        withCredentials: true,
      });
      setDisputes(data.disputes || []);
      setStats(data.stats || {});
    } catch {
      toast.error("Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, [statusFilter, priorityFilter]);

  /* ── fetch single detail ── */
  const openDetail = async (id: string) => {
    try {
      const { data } = await axios.get(`${API}/api/vi/dispute/${id}`, { withCredentials: true });
      setSelected(data.dispute);
      setAgreementRef(data.agreementRef || null);
      setEscrowRef(data.escrowRef || null);
    } catch {
      toast.error("Failed to load dispute details");
    }
  };

  /* ── actions ── */
  const assignToMe = async () => {
    if (!selected) return;
    try {
      await axios.post(`${API}/api/vi/dispute/admin/${selected._id}/assign`, {}, { withCredentials: true });
      toast.success("Dispute assigned to you");
      await openDetail(selected._id);
      fetchDisputes();
    } catch {
      toast.error("Failed to assign");
    }
  };

  const updatePriority = async (priority: string) => {
    if (!selected) return;
    try {
      await axios.put(`${API}/api/vi/dispute/admin/${selected._id}/priority`, { priority }, { withCredentials: true });
      toast.success(`Priority → ${priority}`);
      await openDetail(selected._id);
      fetchDisputes();
    } catch {
      toast.error("Failed to update priority");
    }
  };

  const escalate = async () => {
    if (!selected) return;
    try {
      await axios.post(`${API}/api/vi/dispute/admin/${selected._id}/escalate`, { note: "Escalated by admin" }, { withCredentials: true });
      toast.success("Dispute escalated");
      await openDetail(selected._id);
      fetchDisputes();
    } catch {
      toast.error("Failed to escalate");
    }
  };

  const submitResolution = async () => {
    if (!selected) return;
    if (!resolveForm.decision) { toast.error("Select a decision"); return; }
    if (!resolveForm.reasoning || resolveForm.reasoning.length < 20) { toast.error("Reasoning must be ≥ 20 chars"); return; }
    try {
      await axios.post(`${API}/api/vi/dispute/admin/${selected._id}/resolve`, resolveForm, { withCredentials: true });
      toast.success("Dispute resolved");
      setResolveOpen(false);
      setResolveForm({ decision: "", awardedAmount: 0, refundAmount: 0, reasoning: "", penaltyApplied: false });
      await openDetail(selected._id);
      fetchDisputes();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resolve");
    }
  };

  const doClawback = async () => {
    if (!selected) return;
    if (!clawbackForm.reason || clawbackForm.reason.trim().length < 10) {
      toast.error("Reason must be at least 10 characters"); return;
    }
    if (!clawbackForm.amount || clawbackForm.amount <= 0) {
      toast.error("Enter a valid amount"); return;
    }
    try {
      setClawbackLoading(true);
      const projectId = selected.projectId?._id;
      await axios.post(
        `${API}/admin/projects/${projectId}/clawback`,
        { amount: Number(clawbackForm.amount), reason: clawbackForm.reason },
        { withCredentials: true }
      );
      toast.success("Clawback processed successfully");
      setClawbackOpen(false);
      setClawbackForm({ amount: 0, reason: "" });
      await openDetail(selected._id);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Clawback failed");
    } finally {
      setClawbackLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!selected || !chatMsg.trim()) return;
    try {
      const { data } = await axios.post(`${API}/api/vi/dispute/${selected._id}/message`, { message: chatMsg }, { withCredentials: true });
      setSelected((prev) => prev ? { ...prev, chatLogs: data.chatLogs } : prev);
      setChatMsg("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  /* ────────────────── DETAIL VIEW ────────────────── */
  if (selected) {
    const d = selected;
    const isResolved = d.status === "resolved" || d.status === "withdrawn";
    return (
      <div className="space-y-6">
        {/* Back */}
        <Button variant="ghost" onClick={() => setSelected(null)} className="gap-1">
          <ChevronLeft className="h-4 w-4" /> Back to list
        </Button>

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">{d.disputeNumber}</h2>
            <p className="text-muted-foreground">{d.projectId?.title}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className={statusColor[d.status]}>{d.status.replace(/_/g, " ")}</Badge>
            <Badge className={priorityColor[d.priority]}>{d.priority}</Badge>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-1"><User className="h-4 w-4" /> Filed By</CardTitle></CardHeader>
            <CardContent>
              <p className="font-semibold">{typeof d.filedBy === "object" ? d.filedBy.username : "—"} ({d.filerRole})</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-1"><User className="h-4 w-4" /> Filed Against</CardTitle></CardHeader>
            <CardContent>
              <p className="font-semibold">{typeof d.filedAgainst === "object" ? d.filedAgainst.username : "—"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium flex items-center gap-1"><DollarSign className="h-4 w-4" /> Dispute Amount</CardTitle></CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">₹{d.amountInDispute?.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* Agreement & Escrow Reference (admin context) */}
        <div className="grid gap-4 md:grid-cols-2">
          {agreementRef && (
            <Card className="border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4 text-blue-500" /> Latest Agreement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>Agreement #:</strong> {agreementRef.agreementNumber}</p>
                <p><strong>Agreed Amount:</strong> ₹{agreementRef.agreedAmount?.toLocaleString()}</p>
                <p><strong>Status:</strong> <Badge variant="outline" className="capitalize">{agreementRef.status}</Badge></p>
                {agreementRef.deliverables && <p><strong>Deliverables:</strong> {agreementRef.deliverables.substring(0, 100)}{agreementRef.deliverables.length > 100 ? "…" : ""}</p>}
                {agreementRef.deadline && <p><strong>Deadline:</strong> {fmt(agreementRef.deadline)}</p>}
                <p className="text-xs text-muted-foreground">Client Signed: {agreementRef.clientSignature?.signed ? "✅" : "❌"} | Freelancer Signed: {agreementRef.freelancerSignature?.signed ? "✅" : "❌"}</p>
              </CardContent>
            </Card>
          )}
          {escrowRef && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-green-500" /> Escrow
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p><strong>Current Amount:</strong> ₹{escrowRef.amount?.toLocaleString()}</p>
                {escrowRef.originalAmount && <p><strong>Original Amount:</strong> ₹{escrowRef.originalAmount?.toLocaleString()}</p>}
                {(escrowRef.refundedAmount ?? 0) > 0 && <p><strong>Already Refunded:</strong> ₹{escrowRef.refundedAmount?.toLocaleString()}</p>}
                <p><strong>Status:</strong> <Badge variant="outline" className="capitalize">{escrowRef.status}</Badge></p>
              </CardContent>
            </Card>
          )}
          {!agreementRef && !escrowRef && (
            <Card className="md:col-span-2">
              <CardContent className="py-4 text-sm text-muted-foreground">No agreement or escrow found for this project.</CardContent>
            </Card>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="details" className="w-full">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="evidence">Evidence ({d.evidence?.length || 0})</TabsTrigger>
            <TabsTrigger value="chat">Chat ({d.chatLogs?.length || 0})</TabsTrigger>
            {d.resolution && <TabsTrigger value="resolution">Resolution</TabsTrigger>}
          </TabsList>

          {/* ── Details ── */}
          <TabsContent value="details" className="space-y-4 mt-4">
            <Card>
              <CardHeader><CardTitle>Dispute Reason</CardTitle></CardHeader>
              <CardContent>
                <Badge variant="outline" className="mb-2 capitalize">{d.category}</Badge>
                <p className="whitespace-pre-wrap text-sm">{d.reason}</p>
              </CardContent>
            </Card>

            {d.respondentResponse?.response && (
              <Card>
                <CardHeader><CardTitle>Respondent's Response</CardTitle></CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm">{d.respondentResponse.response}</p>
                  <p className="text-xs text-muted-foreground mt-2">Submitted: {fmt(d.respondentResponse.submittedAt)}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Clock className="h-4 w-4" /> Response Deadline</CardTitle></CardHeader>
                <CardContent><p className="font-mono">{fmt(d.responseDeadline)}</p></CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Clock className="h-4 w-4" /> Resolution Deadline</CardTitle></CardHeader>
                <CardContent><p className="font-mono">{fmt(d.resolutionDeadline)}</p></CardContent>
              </Card>
            </div>

            {/* Admin Actions */}
            {!isResolved && (
              <Card>
                <CardHeader><CardTitle>Admin Actions</CardTitle></CardHeader>
                <CardContent className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={assignToMe}><Shield className="h-4 w-4 mr-1" /> Assign to Me</Button>
                  <Select onValueChange={updatePriority}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Set Priority" /></SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "urgent"].map((p) => (
                        <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="destructive" onClick={escalate}><ArrowUpCircle className="h-4 w-4 mr-1" /> Escalate</Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => setResolveOpen(true)}>
                    <Gavel className="h-4 w-4 mr-1" /> Resolve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-500 text-orange-600 hover:bg-orange-50"
                    onClick={() => {
                      setClawbackForm({ amount: escrowRef?.amount ?? 0, reason: "" });
                      setClawbackOpen(true);
                    }}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" /> Clawback Payment
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* ── Evidence ── */}
          <TabsContent value="evidence" className="space-y-3 mt-4">
            {d.evidence?.length === 0 && <p className="text-muted-foreground">No evidence submitted yet.</p>}
            {d.evidence?.map((e) => (
              <Card key={e._id}>
                <CardContent className="flex items-start gap-4 py-4">
                  <FileText className="h-5 w-5 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <p className="font-medium">{e.title} <Badge variant="outline" className="ml-2 text-xs">{e.type}</Badge></p>
                    {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                    <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm underline">View file →</a>
                  </div>
                </CardContent>
              </Card>
            ))}
            {d.respondentResponse?.evidence?.length > 0 && (
              <>
                <h4 className="font-semibold mt-4">Respondent Evidence</h4>
                {d.respondentResponse.evidence.map((e: any, i: number) => (
                  <Card key={i}>
                    <CardContent className="flex items-start gap-4 py-4">
                      <FileText className="h-5 w-5 text-orange-500 mt-1" />
                      <div>
                        <p className="font-medium">{e.title} <Badge variant="outline" className="ml-2 text-xs">{e.type}</Badge></p>
                        {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
                        <a href={e.url} target="_blank" rel="noreferrer" className="text-blue-500 text-sm underline">View file →</a>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </TabsContent>

          {/* ── Chat ── */}
          <TabsContent value="chat" className="mt-4">
            <Card>
              <CardContent className="pt-4">
                <div className="max-h-80 overflow-y-auto space-y-3 mb-4 border rounded-md p-3 bg-muted/30">
                  {d.chatLogs?.length === 0 && <p className="text-muted-foreground text-sm text-center py-8">No messages yet.</p>}
                  {d.chatLogs?.map((m, i) => (
                    <div key={i} className={`flex flex-col ${m.senderRole === "admin" ? "items-end" : "items-start"}`}>
                      <span className="text-xs font-medium capitalize text-muted-foreground">{m.senderRole}</span>
                      <div className={`rounded-lg px-3 py-2 max-w-[80%] text-sm ${m.senderRole === "admin" ? "bg-blue-100 dark:bg-blue-900" : "bg-white dark:bg-gray-800 border"}`}>
                        {m.message}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{new Date(m.timestamp).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                {!isResolved && (
                  <div className="flex gap-2">
                    <Input placeholder="Type a message…" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()} className="flex-1" />
                    <Button size="sm" onClick={sendMessage}><MessageSquare className="h-4 w-4 mr-1" /> Send</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Resolution ── */}
          {d.resolution && (
            <TabsContent value="resolution" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2"><Gavel className="h-5 w-5" /> Resolution</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p><strong>Decision:</strong> <Badge className="capitalize">{d.resolution.decision?.replace(/_/g, " ")}</Badge></p>
                  {d.resolution.awardedAmount > 0 && <p><strong>Awarded:</strong> ₹{d.resolution.awardedAmount?.toLocaleString()}</p>}
                  {d.resolution.refundAmount > 0 && <p><strong>Refund:</strong> ₹{d.resolution.refundAmount?.toLocaleString()}</p>}
                  <p><strong>Reasoning:</strong></p>
                  <p className="text-sm whitespace-pre-wrap bg-muted p-3 rounded-md">{d.resolution.reasoning}</p>
                  <p className="text-xs text-muted-foreground">Resolved on: {fmt(d.resolution.resolvedAt)}</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* ── Clawback Dialog ── */}
        <Dialog open={clawbackOpen} onOpenChange={setClawbackOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-orange-600">
                <RotateCcw className="h-5 w-5" /> Clawback Payment
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                This will <strong>debit the freelancer's wallet</strong> and return the amount to the client,
                bypassing any wallet freeze. This action is <strong>irreversible</strong>.
              </p>
              {escrowRef && (
                <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 text-sm">
                  <p className="font-medium text-orange-700 dark:text-orange-400">Escrow Reference</p>
                  <p className="text-muted-foreground">Released amount: ₹{(escrowRef.originalAmount || escrowRef.amount)?.toLocaleString()} · Status: {escrowRef.status}</p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Amount to Claw Back (₹) *</label>
                <Input
                  type="number"
                  min={1}
                  value={clawbackForm.amount}
                  onChange={(e) => setClawbackForm((f) => ({ ...f, amount: Number(e.target.value) }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reason * (min 10 chars)</label>
                <Textarea
                  rows={3}
                  placeholder="e.g. Fraud detected — freezing and reversing payment as per investigation findings"
                  value={clawbackForm.reason}
                  onChange={(e) => setClawbackForm((f) => ({ ...f, reason: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setClawbackOpen(false)} disabled={clawbackLoading}>Cancel</Button>
              <Button
                className="bg-orange-600 hover:bg-orange-700 text-white"
                onClick={doClawback}
                disabled={clawbackLoading}
              >
                {clawbackLoading ? "Processing…" : "Confirm Clawback"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ── Resolve Dialog ── */}
        <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Resolve Dispute {d.disputeNumber}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {/* Escrow context */}
              {escrowRef && (
                <div className="rounded-md bg-muted/50 p-3 text-sm">
                  <p className="font-medium">Escrow Pool: ₹{(escrowRef.originalAmount || escrowRef.amount)?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Current: ₹{escrowRef.amount?.toLocaleString()} · Status: {escrowRef.status}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium">Decision *</label>
                <Select value={resolveForm.decision} onValueChange={(v) => {
                  const pool = escrowRef ? (escrowRef.originalAmount || escrowRef.amount) : d.amountInDispute;
                  let award = 0, refund = 0;
                  if (v === "freelancer_favor") { award = pool; refund = 0; }
                  else if (v === "client_favor") { award = 0; refund = pool; }
                  else if (v === "split") { award = Math.floor(pool / 2); refund = pool - Math.floor(pool / 2); }
                  setResolveForm((f) => ({ ...f, decision: v, awardedAmount: award, refundAmount: refund }));
                }}>
                  <SelectTrigger><SelectValue placeholder="Choose decision" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freelancer_favor">Freelancer Favor (full payout)</SelectItem>
                    <SelectItem value="client_favor">Client Favor (full refund)</SelectItem>
                    <SelectItem value="split">Split (custom amounts)</SelectItem>
                    <SelectItem value="dismissed">Dismissed (no money movement)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Amount fields — only show when relevant */}
              {resolveForm.decision && resolveForm.decision !== "dismissed" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">
                      {resolveForm.decision === "client_favor" ? "Award (₹) — N/A" : "Award to Freelancer (₹)"}
                    </label>
                    <Input
                      type="number" min={0}
                      value={resolveForm.awardedAmount}
                      disabled={resolveForm.decision === "client_favor" || resolveForm.decision === "freelancer_favor"}
                      onChange={(e) => setResolveForm((f) => ({ ...f, awardedAmount: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">
                      {resolveForm.decision === "freelancer_favor" ? "Refund (₹) — N/A" : "Refund to Client (₹)"}
                    </label>
                    <Input
                      type="number" min={0}
                      value={resolveForm.refundAmount}
                      disabled={resolveForm.decision === "freelancer_favor" || resolveForm.decision === "client_favor"}
                      onChange={(e) => setResolveForm((f) => ({ ...f, refundAmount: Number(e.target.value) }))}
                    />
                  </div>
                </div>
              )}

              {/* Split validation warning */}
              {resolveForm.decision === "split" && escrowRef && (resolveForm.awardedAmount + resolveForm.refundAmount) > (escrowRef.originalAmount || escrowRef.amount) && (
                <p className="text-sm text-red-500">⚠ Total (₹{(resolveForm.awardedAmount + resolveForm.refundAmount).toLocaleString()}) exceeds escrow (₹{(escrowRef.originalAmount || escrowRef.amount).toLocaleString()})</p>
              )}

              <div>
                <label className="text-sm font-medium">Reasoning * (≥20 chars)</label>
                <Textarea rows={4} value={resolveForm.reasoning}
                  onChange={(e) => setResolveForm((f) => ({ ...f, reasoning: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={resolveForm.penaltyApplied}
                  onChange={(e) => setResolveForm((f) => ({ ...f, penaltyApplied: e.target.checked }))} />
                Apply Penalty
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveOpen(false)}>Cancel</Button>
              <Button className="bg-green-600 hover:bg-green-700" onClick={submitResolution}>Submit Resolution</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ────────────────── LIST VIEW ────────────────── */

  const totalOpen = Object.entries(stats)
    .filter(([k]) => ["open", "under_review", "awaiting_response"].includes(k))
    .reduce((a, [, v]) => a + v.count, 0);
  const totalAmount = Object.values(stats).reduce((a, v) => a + v.totalAmount, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dispute Management</h2>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Open</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{totalOpen}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Resolved</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{stats.resolved?.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Escalated</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-600">{stats.escalated?.count || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total Amount</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {["open", "under_review", "awaiting_response", "resolved", "escalated", "withdrawn", "pending_payment"].map((s) => (
              <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            {["low", "medium", "high", "urgent"].map((p) => (
              <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispute #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Filed</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : disputes.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">No disputes found.</TableCell></TableRow>
              ) : disputes.map((d) => (
                <TableRow key={d._id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(d._id)}>
                  <TableCell className="font-mono text-sm">{d.disputeNumber}</TableCell>
                  <TableCell className="max-w-[160px] truncate">{d.projectId?.title || "—"}</TableCell>
                  <TableCell className="capitalize">{d.category}</TableCell>
                  <TableCell>₹{d.amountInDispute?.toLocaleString()}</TableCell>
                  <TableCell><Badge className={statusColor[d.status] + " text-white text-xs"}>{d.status.replace(/_/g, " ")}</Badge></TableCell>
                  <TableCell><Badge className={priorityColor[d.priority] + " text-white text-xs"}>{d.priority}</Badge></TableCell>
                  <TableCell className="text-sm">{fmt(d.createdAt)}</TableCell>
                  <TableCell><Button size="sm" variant="outline">View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
