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

const PaymentsView = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/admin/all/transaction`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast({
          title: "Error fetching transactions",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [toast]);

  // Fetch transaction details
  const fetchTransactionDetails = async (id: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/transaction/${id}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setSelectedTransaction(data);
      setDetailsModalOpen(true);
    } catch (error) {
      console.error(`Failed to fetch transaction details for ID ${id}:`, error);
      toast({
        title: "Error fetching transaction details",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Handle Excel export
  const handleExportExcel = async () => {
    try {
      toast({
        title: "Export started",
        description: "Your Excel file is being generated",
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/admin/get/trasacntion/excel`,
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
        : "transactions.xlsx";

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

  // Handle refund
  const handleRefund = () => {
    toast({
      title: "Currently Refund operation is unavailable",
      description: "This feature will be implemented soon",
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Transactions</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportExcel}>
              Export Excel
            </Button>
            <Button onClick={handleRefund}>Process Refunds</Button>
          </div>
        </div>

        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction ID</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
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
                    <TableCell>
                      <Skeleton className="h-9 w-20 rounded" />
                    </TableCell>
                  </TableRow>
                ))
              ) : transactions.length > 0 ? (
                transactions.map((transaction) => (
                  <TableRow key={transaction.transactionId}>
                    <TableCell className="font-medium">
                      {transaction.transactionId}
                    </TableCell>
                    <TableCell>{transaction?.userId?.username || "Unknown"}</TableCell>
                    <TableCell>
                      {new Date(transaction.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>₹{transaction.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          transaction.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : transaction.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          fetchTransactionDetails(transaction.projectId)
                        }
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-8 text-muted-foreground"
                  >
                    No transactions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Transaction Details Modal */}
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Transaction Details</DialogTitle>
            </DialogHeader>

            {selectedTransaction ? (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">
                    Transaction ID
                  </div>
                  <div>{selectedTransaction.transactionId}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">User</div>
                  <div>{selectedTransaction?.userId?.username || "Unknown"}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">
                    Project :{" "}
                  </div>
                  <div>{selectedTransaction?.projectId?.title || "Unknown"}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Budget : </div>
                  <div>₹{selectedTransaction?.projectId?.budget.toFixed(2) || "Unknown"}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Date</div>
                  <div>
                    {" "}
                    {new Date(selectedTransaction.createdAt).toLocaleString()}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Amount</div>
                  <div>₹{selectedTransaction.amount.toFixed(2)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-blue-500">
                    Commission earned:
                  </div>
                  <div>
                    ₹
                    {(
                      selectedTransaction.amount.toFixed(2) -
                      selectedTransaction.projectId.budget.toFixed(2)
                    ).toFixed(2)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedTransaction.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : selectedTransaction.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {selectedTransaction.status}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center">
                Loading transaction details...
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default PaymentsView;
