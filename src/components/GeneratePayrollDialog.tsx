import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { getAnchorAlignedPeriod } from "@/utils/payPeriodUtils";
import { useGeneratePayroll } from "@/hooks/useGeneratePayroll";
import type { ITimesheetsEntity } from "@/product-types";

interface GeneratePayrollDialogProps {
  timesheets: (ITimesheetsEntity & { id?: string })[] | undefined;
}

export const GeneratePayrollDialog = ({ timesheets }: GeneratePayrollDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedOffset, setSelectedOffset] = useState(0);
  const { executeFunction: generatePayroll, isLoading: generatingPayroll } = useGeneratePayroll();

  const periods = useMemo(() => [
    { offset: -1, badge: null, badgeLabel: "" },
    { offset: 0, badge: "Active", badgeLabel: "Active" },
    { offset: 1, badge: "Upcoming", badgeLabel: "Upcoming" },
  ], []);

  const periodData = useMemo(() => periods.map(p => ({
    ...p,
    period: getAnchorAlignedPeriod(p.offset),
  })), [periods]);

  const selectedPeriod = useMemo(() => getAnchorAlignedPeriod(selectedOffset), [selectedOffset]);

  const existingTimesheetCount = useMemo(() => {
    if (!timesheets) return 0;
    return timesheets.filter(
      ts => ts.periodStart === selectedPeriod.startStr && ts.periodEnd === selectedPeriod.endStr
    ).length;
  }, [timesheets, selectedPeriod]);

  const handleGenerate = async () => {
    try {
      const result = await generatePayroll({
        periodStart: selectedPeriod.startStr,
        periodEnd: selectedPeriod.endStr,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const earlyPayMessage =
        result.totalEarlyPayDeducted > 0
          ? ` Early pay deducted: $${result.totalEarlyPayDeducted.toFixed(2)} (${result.earlyPayRequestsMarkedPaid} request${result.earlyPayRequestsMarkedPaid !== 1 ? "s" : ""} marked paid).`
          : "";

      toast.success(
        `Payroll generated for ${selectedPeriod.label} (Period #${selectedPeriod.periodNumber}). Created ${result.timesheetsCreated} timesheets totaling $${result.totalGrossPay.toFixed(2)}.${earlyPayMessage}`
      );
      setOpen(false);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to generate payroll";
      toast.error(message);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedOffset(0);
    }
  };

  const labelMap: Record<number, string> = { [-1]: "Previous Period", 0: "Current Period", 1: "Next Period" };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Wallet data-icon="inline-start" />
          Generate Payroll
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Payroll</DialogTitle>
          <DialogDescription>
            Select a pay period to generate timesheets for completed shifts
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Explanation box */}
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">How Pay Periods Work</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pay periods are bi-weekly (14 days), starting every other Monday. The cycle began on January 6, 2025. Each period runs Monday to Sunday (13 days later). Payroll must be generated for exact period boundaries — custom dates are not supported.
                </p>
              </div>
            </div>
          </div>

          {/* Period selector cards */}
          <div className="flex flex-col gap-2 sm:flex-row">
            {periodData.map(({ offset, badge, period }) => {
              const isSelected = selectedOffset === offset;
              const isCurrent = offset === 0;

              return (
                <button
                  key={offset}
                  type="button"
                  onClick={() => setSelectedOffset(offset)}
                  className={cn(
                    "flex-1 rounded-lg border p-3 text-left cursor-pointer transition-all",
                    isCurrent && "border-l-4 border-l-primary",
                    isSelected && "ring-2 ring-primary bg-primary/5",
                    !isSelected && "hover:bg-muted/50"
                  )}
                >
                  <p className="text-xs text-muted-foreground">{labelMap[offset]}</p>
                  <p className="text-sm font-medium mt-0.5">{period.label}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">Period #{period.periodNumber}</span>
                    {badge === "Active" && (
                      <Badge className="text-xs bg-primary/15 text-primary">Active</Badge>
                    )}
                    {badge === "Upcoming" && (
                      <Badge className="text-xs bg-chart-3/15 text-chart-3">Upcoming</Badge>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected period summary */}
          <p className="text-xs text-muted-foreground">
            Selected: {selectedPeriod.label} · Period #{selectedPeriod.periodNumber} · {selectedPeriod.startStr} to {selectedPeriod.endStr}
          </p>

          {/* Duplicate warning */}
          {existingTimesheetCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-chart-3/30 bg-chart-3/10 p-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-chart-3" />
              <p className="text-xs text-chart-3">
                Payroll already generated for this period ({existingTimesheetCount} timesheets exist). Generating again may create duplicates.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generatingPayroll}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={generatingPayroll}>
            {generatingPayroll ? "Generating..." : "Generate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};