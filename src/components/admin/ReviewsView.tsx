import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

interface Review {
  _id: string;
  rating: number;
  comments: string;
  createdAt: string;
  reviewerId?: { username: string; email: string };
  reviewedId?: { username: string; email: string };
  projectId?: { title: string };
}

const ReviewsView = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; review: Review | null }>({
    open: false, review: null,
  });
  const [deleteReason, setDeleteReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews", page],
    queryFn: async () => {
      const res = await axios.get(`${API}/admin/reviews?page=${page}&limit=20`, {
        withCredentials: true,
      });
      return res.data;
    },
    placeholderData: { reviews: [], pagination: { total: 0, pages: 1 } },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await axios.delete(`${API}/admin/reviews/${id}`, {
        data: { reason },
        withCredentials: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast({ title: "Review Deleted" });
      setDeleteDialog({ open: false, review: null });
      setDeleteReason("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete", variant: "destructive" });
    },
  });

  const { reviews = [], pagination = { total: 0, pages: 1 } } = data || {};

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Review Moderation</h2>
        <p className="text-muted-foreground">{pagination.total} total reviews</p>
      </div>

      {reviews.length > 0 ? (
        <div className="rounded-md border shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reviewer</TableHead>
                <TableHead>Reviewed</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="max-w-[300px]">Comment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((r: Review) => (
                <TableRow key={r._id}>
                  <TableCell>{r.reviewerId?.username || "N/A"}</TableCell>
                  <TableCell>{r.reviewedId?.username || "N/A"}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{r.projectId?.title || "N/A"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < r.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm">{r.comments}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-red-600"
                      onClick={() => setDeleteDialog({ open: true, review: r })}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-8 bg-muted/30 rounded-lg border">
          <p className="text-muted-foreground">No reviews found</p>
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
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, review: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Review</DialogTitle>
            <DialogDescription>
              Delete review by {deleteDialog.review?.reviewerId?.username}: "{deleteDialog.review?.comments?.substring(0, 100)}..."
            </DialogDescription>
          </DialogHeader>
          <Textarea placeholder="Reason for deletion (e.g., abusive content)..."
            value={deleteReason} onChange={(e) => setDeleteReason(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, review: null })}>Cancel</Button>
            <Button variant="destructive"
              onClick={() => deleteDialog.review && deleteMutation.mutate({
                id: deleteDialog.review._id, reason: deleteReason,
              })}>
              Delete Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsView;
