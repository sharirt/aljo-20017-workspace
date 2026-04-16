import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { IShiftsEntity, IFacilitiesEntity } from "@/product-types";
import {
  formatShiftDateTime,
  getShiftDurationHours,
  getStatusBadgeColor,
  getRoleBadgeColor,
  formatStatusLabel,
} from "@/utils/shiftUtils";
import { cn } from "@/lib/utils";
import { Pencil, UserPlus } from "lucide-react";

type ShiftWithId = IShiftsEntity & { id: string };
type FacilityWithId = IFacilitiesEntity & { id: string };

interface AdminShiftListViewProps {
  shifts: ShiftWithId[];
  facilityMap: Map<string, FacilityWithId>;
  onAssignStaff: (shift: ShiftWithId) => void;
  onEditShift?: (shift: ShiftWithId) => void;
}

export const AdminShiftListView = ({
  shifts,
  facilityMap,
  onAssignStaff,
}: AdminShiftListViewProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs uppercase tracking-wide">Facility</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Role</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Date & Time</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Duration</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Status</TableHead>
              <TableHead className="text-xs uppercase tracking-wide">Headcount</TableHead>
              <TableHead className="text-xs uppercase tracking-wide text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shifts.map((shift, index) => {
              const facility = facilityMap.get(shift.facilityProfileId || "");
              const duration = getShiftDurationHours(shift.startDateTime, shift.endDateTime);
              const filled = shift.filledCount ?? 0;
              const total = shift.headcount ?? 1;
              const isFull = filled >= total;
              const canAssign = shift.status === "open" || shift.status === "claimed";

              return (
                <TableRow
                  key={shift.id}
                  className={cn(
                    "cursor-pointer hover:bg-muted/30 transition-colors",
                    index % 2 === 1 && "bg-muted/20"
                  )}
                  onClick={() => {
                    if (canAssign) onAssignStaff(shift);
                  }}
                >
                  <TableCell className="font-medium">
                    {facility?.name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getRoleBadgeColor(shift.requiredRole))}>
                      {shift.requiredRole || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatShiftDateTime(shift.startDateTime, shift.endDateTime) || "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {duration > 0 ? `${duration}h` : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={cn("text-xs", getStatusBadgeColor(shift.status))}>
                      {formatStatusLabel(shift.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className={cn("text-sm font-medium", isFull && "text-primary")}>
                      {filled} / {total}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                      {canAssign && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => onAssignStaff(shift)}
                        >
                          <UserPlus />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};