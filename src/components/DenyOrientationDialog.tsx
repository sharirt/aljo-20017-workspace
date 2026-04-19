import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { IOrientationsEntity } from "@/product-types";

interface DenyOrientationDialogProps {
  orientation: (IOrientationsEntity & { id: string }) | null;
  staffName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (orientationId: string) => Promise<void>;
  isDenying: boolean;
}

export const DenyOrientationDialog = ({
  orientation,
  staffName,
  open,
  onOpenChange,
  onConfirm,
  isDenying,
}: DenyOrientationDialogProps) => {
  const handleConfirm = async () => {
    if (!orientation) return;
    await onConfirm(orientation.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Orientation Request</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove the orientation request from{" "}
            <span className="font-medium text-foreground">{staffName}</span>.
            The staff member will be able to request orientation again.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDenying}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDenying}
          >
            {isDenying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Removing...
              </>
            ) : (
              "Remove Request"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};