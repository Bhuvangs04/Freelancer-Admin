import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface BanUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (banType: "temporary" | "permanent") => void;
  username: string;
}

export function BanUserDialog({
  isOpen,
  onClose,
  onConfirm,
  username,
}: BanUserDialogProps) {
  const [banType, setBanType] = useState<"temporary" | "permanent">(
    "temporary"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ban User: {username}</DialogTitle>
          <DialogDescription>
            Select the type of ban you want to apply to this user.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup
            value={banType}
            onValueChange={(value) =>
              setBanType(value as "temporary" | "permanent")
            }
            className="flex flex-col space-y-3"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="temporary" id="temporary" />
              <Label htmlFor="temporary" className="text-sm font-medium">
                Temporary Ban (7 days)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="permanent" id="permanent" />
              <Label htmlFor="permanent" className="text-sm font-medium">
                Permanent Ban
              </Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter className="flex space-x-2 sm:justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(banType)}>
            Confirm Ban
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
