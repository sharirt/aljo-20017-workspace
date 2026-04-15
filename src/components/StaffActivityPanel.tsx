import type {
  IStaffProfilesEntity,
  ITimeLogsEntity,
  IShiftApplicationsEntity,
  IFacilitiesEntity,
} from "@/product-types";

interface StaffActivityPanelProps {
  shiftId: string;
  timeLogs?: (ITimeLogsEntity & { id: string })[];
  applications?: (IShiftApplicationsEntity & { id: string })[];
  staffMap?: Record<string, IStaffProfilesEntity & { id: string }>;
  facility?: (IFacilitiesEntity & { id: string }) | null;
}

export const StaffActivityPanel = ({
  shiftId,
  timeLogs,
  applications,
  staffMap,
  facility,
}: StaffActivityPanelProps) => {
  const shiftApps = (applications || []).filter(
    (a) => a.shiftProfileId === shiftId && a.status === "approved"
  );

  if (shiftApps.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        No assigned staff activity yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 pt-2">
      {shiftApps.map((app) => {
        const staff = staffMap?.[app.staffProfileId || ""];
        const log = (timeLogs || []).find(
          (t) =>
            t.shiftProfileId === shiftId &&
            t.staffProfileId === app.staffProfileId
        );
        const name = staff
          ? `${staff.firstName || ""} ${staff.lastName || ""}`.trim()
          : "Staff";

        return (
          <div
            key={app.id}
            className="flex items-center justify-between text-sm rounded-md border border-border px-3 py-2"
          >
            <span className="font-medium">{name}</span>
            <span className="text-muted-foreground">
              {log?.clockInTime
                ? log.clockOutTime
                  ? `${(log.totalHours ?? 0).toFixed(1)}h worked`
                  : "Clocked in"
                : "Not clocked in"}
            </span>
          </div>
        );
      })}
    </div>
  );
};