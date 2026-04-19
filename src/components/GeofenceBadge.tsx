import { MapPin, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type GeofenceStatusType = "within" | "outside_flagged" | "outside_blocked" | null;

interface GeofenceBadgeProps {
  status: GeofenceStatusType;
  distanceMeters?: number;
}

export const GeofenceBadge = ({ status, distanceMeters }: GeofenceBadgeProps) => {
  if (!status) return null;

  if (status === "within") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/15 px-1.5 py-0.5 text-xs text-accent">
        <MapPin className="size-3" />
        Inside
      </span>
    );
  }

  if (status === "outside_flagged") {
    const dist = distanceMeters != null ? `${Math.round(distanceMeters)}m` : "";
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-chart-3/30 bg-chart-3/15 px-1.5 py-0.5 text-xs text-chart-3">
        <AlertTriangle className="size-3" />
        Outside{dist ? ` · ${dist}` : ""}
      </span>
    );
  }

  if (status === "outside_blocked") {
    const dist = distanceMeters != null ? `${Math.round(distanceMeters)}m` : "";
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/15 px-1.5 py-0.5 text-xs text-destructive">
        <XCircle className="size-3" />
        Blocked{dist ? ` · ${dist}` : ""}
      </span>
    );
  }

  return null;
};