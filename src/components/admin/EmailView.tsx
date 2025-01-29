import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail } from "lucide-react";

export const EmailView = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Email Communication</h2>
        <Button>View Email History</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4">Send Bulk Email</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Recipient Group</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="freelancers">Freelancers</SelectItem>
                    <SelectItem value="clients">Clients</SelectItem>
                    <SelectItem value="new">New Users</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Email subject" />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea placeholder="Type your message here" className="h-32" />
              </div>
              <Button className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Bulk Email
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border p-4">
            <h3 className="text-lg font-semibold mb-4">Email Templates</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">Welcome Email</p>
                  <p className="text-sm text-gray-500">For new users</p>
                </div>
                <Button variant="outline" size="sm">Use</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">Payment Confirmation</p>
                  <p className="text-sm text-gray-500">Transaction receipt</p>
                </div>
                <Button variant="outline" size="sm">Use</Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 cursor-pointer">
                <div>
                  <p className="font-medium">Account Warning</p>
                  <p className="text-sm text-gray-500">Policy violations</p>
                </div>
                <Button variant="outline" size="sm">Use</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};