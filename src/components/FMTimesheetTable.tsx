import { Fragment } from "react";
import { format, parseISO } from "date-fns";
import { MapPin, AlertTriangle, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GeofenceBadge, type GeofenceStatusType } from "@/components/GeofenceBadge";
import { calculateHaversineDistance } from "@/utils/GeofenceUtils";

export interface FMTimesheetRow {
  shiftId: string;
  date: string;
  staffName: string;
  shiftStart: string;
  shiftEnd: string;
  timeLogId?: string;
  clockInTime?: string;
  clockOutTime?: string;
  breakMinutes?: number;
  totalHours?: number;
  clockInLat?: number;
  clockInLng?: number;
  clockOutLat?: number;
  clockOutLng?: number;
  geofenceStatus?: "within" | "outside_flagged" | "outside_blocked";
  clockOutOutsideGeofence?: boolean;
}

interface FMTimesheetTableProps {
  rows: FMTimesheetRow[];
  isLoading: boolean;
  facilityLat?: number;
  facilityLng?: number;
  facilityRadius?: number;
}

function formatTime(isoString?: string): string {
  if (!isoString) return "—";
  try {
    return format(parseISO(isoString), "h:mm a");
  } catch {
    return "—";
  }
}

function resolveClockInGeofence(
  row: FMTimesheetRow,
  facilityLat?: number,
  facilityLng?: number,
  facilityRadius?: number
): { status: GeofenceStatusType; distance?: number } {
  if (row.geofenceStatus) {
    const dist =
      row.clockInLat != null && row.clockInLng != null && facilityLat != null && facilityLng != null
        ? calculateHaversineDistance(row.clockInLat, row.clockInLng, facilityLat, facilityLng)
        : undefined;
    return { status: row.geofenceStatus, distance: dist };
  }

  if (
    row.clockInLat != null &&
    row.clockInLng != null &&
    facilityLat != null &&
    facilityLng != null
  ) {
    const dist = calculateHaversineDistance(row.clockInLat, row.clockInLng, facilityLat, facilityLng);
    const radius = facilityRadius ?? 200;
    return {
      status: dist <= radius ? "within" : "outside_flagged",
      distance: dist,
    };
  }

  return { status: null };
}

function resolveClockOutGeofence(
  row: FMTimesheetRow,
  facilityLat?: number,
  facilityLng?: number,
  facilityRadius?: number
): { status: GeofenceStatusType; distance?: number } {
  if (
    row.clockOutLat != null &&
    row.clockOutLng != null &&
    facilityLat != null &&
    facilityLng != null
  ) {
    const dist = calculateHaversineDistance(row.clockOutLat, row.clockOutLng, facilityLat, facilityLng);
    const radius = facilityRadius ?? 200;

    if (row.clockOutOutsideGeofence === true) {
      return { status: "outside_flagged", distance: dist };
    }

    if (dist <= radius) {
      return { status: "within", distance: dist };
    }

    return { status: "outside_flagged", distance: dist };
  }

  if (row.clockOutOutsideGeofence === true) {
    return { status: "outside_flagged" };
  }

  return { status: null };
}

export const FMTimesheetTable = ({
  rows,
  isLoading,
  facilityLat,
  facilityLng,
  facilityRadius,
}: FMTimesheetTableProps) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded" />
        ))}
      </div>
    );
  }

  const groupedByDate: { dateKey: string; dateLabel: string; rows: FMTimesheetRow[] }[] = [];
  const seenDates: Record<string, number> = {};

  for (const row of rows) {
    let dateKey = "";
    let dateLabel = "";
    try {
      dateKey = format(parseISO(row.date), "yyyy-MM-dd");
      dateLabel = format(parseISO(row.date), "EEEE, MMMM d");
    } catch {
      dateKey = row.date ?? "unknown";
      dateLabel = row.date ?? "Unknown Date";
    }

    if (seenDates[dateKey] === undefined) {
      seenDates[dateKey] = groupedByDate.length;
      groupedByDate.push({ dateKey, dateLabel, rows: [] });
    }
    groupedByDate[seenDates[dateKey]].rows.push(row);
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[140px]">
              Staff
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Shift Start
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Shift End
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[120px]">
              Clock In
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[120px]">
              Clock Out
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[80px]">
              Break
            </TableHead>
            <TableHead className="text-xs uppercase tracking-wide text-muted-foreground min-w-[90px]">
              Net Hours
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedByDate.map(({ dateKey, dateLabel, rows: dayRows }) => {
            const dayTotal = dayRows.reduce((sum, row) => {
              if (!row.timeLogId) return sum;
              return sum + (row.totalHours ?? 0);
            }, 0);

            return (
              <Fragment key={dateKey}>
                <TableRow className="bg-muted/50 border-b-0">
                  <TableCell colSpan={7} className="py-2 px-4">
                    <span className="font-bold text-sm text-foreground">{dateLabel}</span>
                  </TableCell>
                </TableRow>

                {dayRows.map((row) => {
                  const clockIn = resolveClockInGeofence(row, facilityLat, facilityLng, facilityRadius);
                  const clockOut = resolveClockOutGeofence(row, facilityLat, facilityLng, facilityRadius);

                  return (
                    <TableRow
                      key={row.shiftId}
                      className="border-b hover:bg-muted/30 text-sm"
                    >
                      <TableCell className="py-3">{row.staffName}</TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatTime(row.shiftStart)}
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {formatTime(row.shiftEnd)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <span>{formatTime(row.clockInTime)}</span>
                          <GeofenceBadge status={clockIn.status} distanceMeters={clockIn.distance} />
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <span>{formatTime(row.clockOutTime)}</span>
                          <GeofenceBadge status={clockOut.status} distanceMeters={clockOut.distance} />
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-muted-foreground">
                        {row.timeLogId
                          ? row.breakMinutes !== undefined && row.breakMinutes !== null
                            ? `${row.breakMinutes} min`
                            : "0 min"
                          : "—"}
                      </TableCell>
                      <TableCell className="py-3">
                        {row.timeLogId ? (
                          <span className="text-accent font-medium">
                            {row.totalHours !== undefined && row.totalHours !== null
                              ? `${row.totalHours} hrs`
                              : "—"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}

                <TableRow className="border-b bg-background">
                  <TableCell colSpan={7} className="py-2 px-4 text-right">
                    <span className="text-sm text-accent font-medium">
                      Day Total: {Math.round(dayTotal * 10) / 10} hrs
                    </span>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>

      {/* Geofence legend */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 border-t text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPin className="size-3 text-accent" />
          Inside geofence
        </span>
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="size-3 text-chart-3" />
          Outside geofence (flagged)
        </span>
        <span className="inline-flex items-center gap-1">
          <XCircle className="size-3 text-destructive" />
          Outside geofence (blocked)
        </span>
      </div>
    </div>
  );
};