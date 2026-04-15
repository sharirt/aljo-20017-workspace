import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Loader2, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  hintText: string;
  isUploading: boolean;
  onSubmit: (file: File, expiryDate?: string) => void;
}

export const UploadDocumentDialog = ({
  open,
  onOpenChange,
  title,
  subtitle,
  hintText,
  isUploading,
  onSubmit,
}: UploadDocumentDialogProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resetState = () => {
    setSelectedFile(null);
    setExpiryDate(undefined);
    setExpiryOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetState();
    }
    onOpenChange(nextOpen);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!selectedFile) return;
    const expiryStr = expiryDate ? format(expiryDate, "yyyy-MM-dd") : undefined;
    onSubmit(selectedFile, expiryStr);
    resetState();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* File picker area */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors",
                "hover:border-primary/50 hover:bg-accent/50",
                selectedFile
                  ? "border-primary bg-primary/5"
                  : "border-border text-muted-foreground"
              )}
            >
              <Upload className="h-6 w-6" />
              {selectedFile ? (
                <p className="text-sm font-medium text-foreground truncate max-w-full">
                  {selectedFile.name}
                </p>
              ) : (
                <p className="text-sm">Click to choose file</p>
              )}
            </button>
          </div>

          {/* Expiry date picker */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-medium flex items-center gap-1">
              Expiry Date
              <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Popover open={expiryOpen} onOpenChange={setExpiryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-11 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-sm ring-offset-background",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "transition-colors",
                    expiryDate ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className={cn("h-4 w-4 shrink-0", expiryDate ? "text-primary" : "text-muted-foreground")} />
                  {expiryDate ? format(expiryDate, "MMM dd, yyyy") : "Select expiry date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 rounded-xl shadow-lg border" align="start">
                <Calendar
                  mode="single"
                  selected={expiryDate}
                  onSelect={(date) => {
                    setExpiryDate(date);
                    setExpiryOpen(false);
                  }}
                  captionLayout="dropdown"
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 10}
                  initialFocus
                  classNames={{
                    caption_dropdowns: "flex gap-2 items-center justify-center",
                    dropdown: "border border-input rounded-md bg-background text-sm px-2 py-1 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
                  }}
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">{hintText}</p>
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
            className="w-full h-11"
          >
            {isUploading ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                Uploading...
              </>
            ) : (
              "Submit"
            )}
          </Button>

          {/* Cancel button */}
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="w-full h-11"
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};