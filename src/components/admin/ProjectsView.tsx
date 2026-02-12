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
import { Loader2, Search, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface Project {
  _id: string;
  title: string;
  budget: number;
  status: string;
  deadline: string;
  createdAt: string;
  clientId?: { username: string; email: string };
  freelancerId?: { username: string; email: string };
}

const ProjectsView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false, project: null,
  });
  const [deleteReason, setDeleteReason] = useState("");
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; project: Project | null }>({
    open: false, project: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-projects", page, search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await axios.get(`${API}/admin/projects?${params}`, {
        withCredentials: true,
      });
      return res.data;
    },
    placeholderData: { projects: [], pagination: { total: 0, pages: 1 } },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await axios.delete(`${API}/admin/projects/${id}`, {
        data: { reason },
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast({ title: "Project Deleted" });
      setDeleteDialog({ open: false, project: null });
      setDeleteReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete project", variant: "destructive" });
    },
  });

  const { projects = [], pagination = { total: 0, pages: 1 } } = data || {};

  const statusColor: Record<string, string> = {
    open: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    rejected: "bg-gray-100 text-gray-800",
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
          <h2 className="text-3xl font-bold">Project Management</h2>
          <p className="text-muted-foreground">{pagination.total} total projects</p>
        </div>
        <a href={`${API}/admin/reports/projects/excel`} target="_blank" rel="noopener noreferrer">
          <Button variant="outline">Export Excel</Button>
        </a>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." className="pl-9" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {projects.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Freelancer</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p: Project) => (
                <TableRow key={p._id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{p.title}</TableCell>
                  <TableCell>₹{p.budget?.toLocaleString()}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor[p.status] || ""}`}>
                      {p.status}
                    </span>
                  </TableCell>
                  <TableCell>{p.clientId?.username || "N/A"}</TableCell>
                  <TableCell>{p.freelancerId?.username || "N/A"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm"
                        onClick={() => setDetailDialog({ open: true, project: p })}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600"
                        onClick={() => setDeleteDialog({ open: true, project: p })}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">No projects found</p>
        </div>
      )}

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">Page {page} of {pagination.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, project: open ? deleteDialog.project : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deleteDialog.project?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for deletion..." value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, project: null })}>Cancel</Button>
            <Button variant="destructive"
              onClick={() => deleteDialog.project && deleteMutation.mutate({ id: deleteDialog.project._id, reason: deleteReason })}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => setDetailDialog({ open, project: open ? detailDialog.project : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          {detailDialog.project && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><strong>Title:</strong> {detailDialog.project.title}</div>
                <div><strong>Budget:</strong> ₹{detailDialog.project.budget?.toLocaleString()}</div>
                <div><strong>Status:</strong> {detailDialog.project.status}</div>
                <div><strong>Client:</strong> {detailDialog.project.clientId?.username || "N/A"}</div>
                <div><strong>Freelancer:</strong> {detailDialog.project.freelancerId?.username || "N/A"}</div>
                <div><strong>Deadline:</strong> {detailDialog.project.deadline ? new Date(detailDialog.project.deadline).toLocaleDateString() : "N/A"}</div>
                <div><strong>Created:</strong> {new Date(detailDialog.project.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectsView;
