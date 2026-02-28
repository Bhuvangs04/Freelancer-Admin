import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Snowflake, AlertTriangle } from "lucide-react";

interface Props {
  isOpen: boolean;
  username: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export const WalletFreezeDialog = ({
  isOpen,
  username,
  onClose,
  onConfirm,
  isLoading,
}: Props) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (reason.trim().length >= 5) {
      onConfirm(reason.trim());
      setReason("");
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-orange-100">
              <Snowflake className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle>Freeze Wallet Withdrawals</DialogTitle>
              <DialogDescription className="mt-1">
                This will block <strong>{username}</strong> from making any withdrawal requests.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-start gap-2 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
            <p className="text-sm text-orange-700">
              The user will see a "withdrawals blocked" error when they try to withdraw. 
              Existing pending withdrawals are <strong>not</strong> automatically rejected.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="freeze-reason">
              Reason <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="freeze-reason"
              placeholder="e.g. Dispute under investigation, suspicious activity detected..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">Minimum 5 characters required</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={reason.trim().length < 5 || isLoading}
          >
            <Snowflake className="h-4 w-4 mr-2" />
            {isLoading ? "Freezing..." : "Freeze Withdrawals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
