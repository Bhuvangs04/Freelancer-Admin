import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowDownToLine, CheckCircle } from "lucide-react";



const Payout = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch payouts
  useEffect(() => {
    const fetchPayouts = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/pay-out/freelancers`,{
            credentials:"include"
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setPayouts(data.payouts);
      } catch (error) {
        console.error("Failed to fetch payouts:", error);
        toast({
          title: "Error fetching payouts",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPayouts();
  }, [toast]);

  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      toast({
        title: "Export started",
        description: "Your Excel file is being generated",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/payout/excel`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Set the file name from content-disposition header or use default
      const contentDisposition = response.headers.get("content-disposition");
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : "payouts.xlsx";

      a.download = fileName;

      // Append to the document, click it, and remove it
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export completed",
        description: "Your Excel file has been downloaded",
      });
    } catch (error) {
      console.error("Failed to export Excel:", error);
      toast({
        title: "Error exporting Excel",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Process single payout
  const processPayout = async (userId: string) => {
    try {
      toast({
        title: "Processing payout",
        description: "Please wait...",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/pay-out/freelancers/${userId}`,
        {
          method: "POST",
          credentials:"include",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      setPayouts((prev) =>
        prev.map((payout) =>
          payout.freelancerId._id === userId
            ? { ...payout, status: "processed" }
            : payout
        )
      );

      toast({
        title: "Payout processed",
        description: "The payout has been successfully processed",
      });
    } catch (error) {
      console.error(`Failed to process payout for user ${userId}:`, error);
      toast({
        title: "Error processing payout",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // View payout details
  const viewPayoutDetails = (payout) => {
    setSelectedPayout(payout);
    setDetailsModalOpen(true);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">User Payouts</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              <ArrowDownToLine className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Skeleton className="h-9 w-20 rounded" />
                      <Skeleton className="h-9 w-20 rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : payouts.length > 0 ? (
                payouts.map((payout) => (
                  <TableRow key={payout._id}>
                    <TableCell className="font-medium">
                      {payout.freelancerId._id}
                    </TableCell>
                    <TableCell>{payout.freelancerId.username}</TableCell>
                    <TableCell>
                      {new Date(payout.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>₹{payout.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          payout.status === "processed"
                            ? "bg-green-100 text-green-800"
                            : payout.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {payout.status}
                      </span>
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewPayoutDetails(payout)}
                      >
                        Details
                      </Button>
                      {payout.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => processPayout(payout.freelancerId._id)}
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Process
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No pending payouts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Payout Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Payout Details</DialogTitle>
            </DialogHeader>

            {selectedPayout ? (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">User ID</div>
                  <div>{selectedPayout.freelancerId._id}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div>{selectedPayout.freelancerId.username}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">
                    Request Date
                  </div>
                  <div>{selectedPayout.createdAt}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div>₹{selectedPayout.amount.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedPayout.status === "processed"
                          ? "bg-green-100 text-green-800"
                          : selectedPayout.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedPayout.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">
                    Account Details:
                  </div>
                  <ol>
                    <li className="text-sm text-blue-500">
                      Account Name: {selectedPayout.bankDetails.accountName}
                    </li>
                    <li className="text-sm text-blue-500">
                      Account Number: {selectedPayout.bankDetails.accountNumber}
                    </li>
                    <li className="text-sm text-blue-500">
                      Bank Ifsc code: {selectedPayout.bankDetails.ifscCode}
                    </li>
                  </ol>
                </div>

                {selectedPayout.status === "pending" && (
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={() => {
                        processPayout(selectedPayout.freelancerId._id);
                        setDetailsModalOpen(false);
                      }}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Process Payout
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">Loading payout details...</div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Payout;
