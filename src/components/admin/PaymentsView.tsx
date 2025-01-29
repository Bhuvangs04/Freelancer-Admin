import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const mockPayments = [
  { 
    id: "INV001",
    date: "2024-02-20",
    amount: 500.00,
    status: "completed",
    user: "John Doe"
  },
  { 
    id: "INV002",
    date: "2024-02-19",
    amount: 250.00,
    status: "pending",
    user: "Jane Smith"
  },
  { 
    id: "INV003",
    date: "2024-02-18",
    amount: 750.00,
    status: "refunded",
    user: "Bob Johnson"
  },
];

export const PaymentsView = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Payments</h2>
        <div className="flex gap-2">
          <Button variant="outline">Export CSV</Button>
          <Button>Process Refunds</Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mockPayments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{payment.id}</TableCell>
                <TableCell>{payment.user}</TableCell>
                <TableCell>{payment.date}</TableCell>
                <TableCell>${payment.amount.toFixed(2)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    payment.status === "completed" ? "bg-green-100 text-green-800" :
                    payment.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  }`}>
                    {payment.status}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">Details</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};