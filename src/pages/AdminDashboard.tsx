import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  StaffProfilesEntity,
  ShiftsEntity,
  TimesheetsEntity,
  OrientationsEntity,
  FacilitiesEntity,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  Building2,
} from "lucide-react";
import { useMemo } from "react";
import { format, parseISO, isToday } from "date-fns";
import { StatsCard } from "@/components/StatsCard";
import { RoleUpgradeAlert } from "@/components/RoleUpgradeAlert";
import { PayPeriodBanner } from "@/components/PayPeriodBanner";
import { PendingReviewsSection } from "@/components/PendingReviewsSection";
import { GeneratePayrollDialog } from "@/components/GeneratePayrollDialog";
import { Link } from "react-router";
import { getPageUrl, cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getRoleBadgeColor } from "@/utils/shiftUtils";
import { AdminStaffManagementPage as AdminStaffManagementPageConfig } from "@/product-types";

export default function AdminDashboardPage() {
  const { data: staffProfiles, isLoading: loadingStaff } = useEntityGetAll(StaffProfilesEntity);
  const { data: shifts, isLoading: loadingShifts } = useEntityGetAll(ShiftsEntity);
  const { data: timesheets, isLoading: loadingTimesheets } = useEntityGetAll(TimesheetsEntity);
  const { data: orientations, isLoading: loadingOrientations } = useEntityGetAll(OrientationsEntity);
  const { data: facilities, isLoading: loadingFacilities } = useEntityGetAll(FacilitiesEntity);

  // Onboarding & Compliance stats
  const onboardingStats = useMemo(() => {
    const pendingOnboarding = staffProfiles?.filter(
      s => s.onboardingStatus === "incomplete" || s.onboardingStatus === "pending_review"
    )?.length || 0;

    const nonCompliant = staffProfiles?.filter(
      s => s.complianceStatus !== "compliant"
    )?.length || 0;

    return { pendingOnboarding, nonCompliant };
  }, [staffProfiles]);

  // Recent registrations (last 5 staff by id descending)
  const recentRegistrations = useMemo(() => {
    if (!staffProfiles) return [];

    return [...staffProfiles]
      .sort((a, b) => {
        const aId = (a as any).id || "";
        const bId = (b as any).id || "";
        return bId.localeCompare(aId);
      })
      .slice(0, 5);
  }, [staffProfiles]);

  const stats = useMemo(() => {
    const activeStaff = staffProfiles?.filter(s => s.complianceStatus === "compliant")?.length || 0;
    const openShifts = shifts?.filter(s => s.status === "open")?.length || 0;
    const pendingOnboarding = staffProfiles?.filter(s => s.onboardingStatus === "incomplete" || s.onboardingStatus === "pending_review")?.length || 0;
    const pendingPayroll = timesheets
      ?.filter(t => t.paymentStatus === "pending")
      ?.reduce((sum, t) => sum + (t.grossPay || 0), 0) || 0;

    return { activeStaff, openShifts, pendingOnboarding, pendingPayroll };
  }, [staffProfiles, shifts, timesheets]);

  const activeFacilitiesCount = useMemo(() => {
    return facilities?.filter(f => f.status === "active")?.length || 0;
  }, [facilities]);

  const orientationRequestsCount = useMemo(() => {
    return orientations?.filter(o => o.status === "scheduled")?.length || 0;
  }, [orientations]);

  const expiredStaff = useMemo(() => {
    return staffProfiles?.filter(s => s.complianceStatus === "expired") || [];
  }, [staffProfiles]);

  const todayOpenShifts = useMemo(() => {
    if (!shifts) return [];
    return shifts?.filter(shift => {
      if (shift.status !== "open" || !shift.startDateTime) return false;
      try {
        return isToday(parseISO(shift.startDateTime));
      } catch {
        return false;
      }
    });
  }, [shifts]);

  const getOnboardingBadge = (status?: string) => {
    if (status === "approved") {
      return (
        <Badge className="bg-accent/20 text-accent gap-1">
          <CheckCircle className="h-3 w-3" />
          Approved
        </Badge>
      );
    }
    if (status === "pending_review") {
      return (
        <Badge className="bg-chart-3/20 text-chart-3 gap-1">
          <Clock className="h-3 w-3" />
          Awaiting Review
        </Badge>
      );
    }
    if (status === "incomplete") {
      return (
        <Badge className="bg-destructive/20 text-destructive gap-1">
          <Clock className="h-3 w-3" />
          Incomplete
        </Badge>
      );
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getComplianceBadge = (status?: string) => {
    if (status === "compliant") {
      return (
        <Badge className="bg-accent/20 text-accent gap-1">
          <CheckCircle className="h-3 w-3" />
          Compliant
        </Badge>
      );
    }
    return (
      <Badge className="bg-destructive/20 text-destructive gap-1">
        <XCircle className="h-3 w-3" />
        Not Compliant
      </Badge>
    );
  };

  const getInitials = (staff: typeof StaffProfilesEntity['instanceType']) => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName.charAt(0)}${staff.lastName.charAt(0)}`.toUpperCase();
    }
    if (staff.email) {
      return staff.email.charAt(0).toUpperCase();
    }
    return "?";
  };

  const getStaffName = (staff: typeof StaffProfilesEntity['instanceType']) => {
    if (staff.firstName && staff.lastName) {
      return `${staff.firstName} ${staff.lastName}`;
    }
    return staff.email || "Unknown";
  };

  const isLoading = loadingStaff || loadingShifts || loadingTimesheets || loadingOrientations || loadingFacilities;

  const staffManagementPageUrl = getPageUrl(AdminStaffManagementPageConfig);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform-wide overview and metrics</p>
      </div>

      {/* Current Pay Period Banner */}
      <PayPeriodBanner />

      {/* Pending Reviews Section */}
      <PendingReviewsSection
        staffProfiles={staffProfiles as any}
        isLoading={loadingStaff}
      />

      {/* Onboarding & Compliance Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          <h2 className="text-lg font-semibold">Onboarding & Compliance</h2>
        </div>
        <div className="h-px bg-border" />

        {/* KPI Cards */}
        <div className="grid gap-4 grid-cols-2">
          {/* Pending Onboarding Card */}
          <Card className={cn(
            onboardingStats.pendingOnboarding > 0 ? "bg-chart-3/10" : "bg-accent/10"
          )}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  onboardingStats.pendingOnboarding > 0 ? "bg-chart-3/20" : "bg-accent/20"
                )}>
                  <UserCheck className={cn(
                    "h-5 w-5",
                    onboardingStats.pendingOnboarding > 0 ? "text-chart-3" : "text-accent"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Pending Onboarding</p>
                  <p className="text-3xl font-bold mt-1">{onboardingStats.pendingOnboarding}</p>
                  <p className="text-xs text-muted-foreground mt-1">Staff awaiting document review</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Non-Compliant Staff Card */}
          <Card className={cn(
            onboardingStats.nonCompliant > 0 ? "bg-destructive/10" : "bg-accent/10"
          )}>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-lg shrink-0",
                  onboardingStats.nonCompliant > 0 ? "bg-destructive/20" : "bg-accent/20"
                )}>
                  <ShieldAlert className={cn(
                    "h-5 w-5",
                    onboardingStats.nonCompliant > 0 ? "text-destructive" : "text-accent"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground">Non-Compliant Staff</p>
                  <p className="text-3xl font-bold mt-1">{onboardingStats.nonCompliant}</p>
                  <p className="text-xs text-muted-foreground mt-1">Missing or expired documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Registrations
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to={staffManagementPageUrl}>View All Staff →</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : recentRegistrations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <UserCheck className="h-10 w-10 text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm font-medium">No recent registrations</p>
                <p className="text-xs text-muted-foreground">No staff members found</p>
              </div>
            ) : (
              <div>
                {recentRegistrations.map((staff, index) => (
                  <Link
                    key={(staff as any).id}
                    to={staffManagementPageUrl}
                    className={cn(
                      "flex items-center gap-3 py-3 px-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors",
                      index !== recentRegistrations.length - 1 && "border-b"
                    )}
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                        {getInitials(staff)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getStaffName(staff)}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        <Badge variant="outline" className={getRoleBadgeColor(staff.roleType)}>
                          {staff.roleType || "N/A"}
                        </Badge>
                        {getOnboardingBadge(staff.onboardingStatus)}
                        {getComplianceBadge(staff.complianceStatus)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Active Staff"
          value={stats.activeStaff}
          icon={Users}
          isLoading={isLoading}
          iconClassName="text-accent"
        />
        <StatsCard
          title="Open Shifts"
          value={stats.openShifts}
          icon={Calendar}
          isLoading={isLoading}
          iconClassName="text-chart-1"
        />
        <StatsCard
          title="Pending Onboarding"
          value={stats.pendingOnboarding}
          icon={Clock}
          isLoading={isLoading}
          iconClassName="text-chart-3"
        />
        <StatsCard
          title="Pending Payroll"
          value={`$${stats.pendingPayroll.toFixed(2)}`}
          icon={DollarSign}
          isLoading={isLoading}
          iconClassName="text-chart-2"
        />
        <StatsCard
          title="Active Facilities"
          value={activeFacilitiesCount}
          icon={Building2}
          isLoading={isLoading}
          iconClassName="text-chart-2"
        />
        <StatsCard
          title="Orientation Requests"
          value={orientationRequestsCount}
          icon={GraduationCap}
          isLoading={isLoading}
          iconClassName="text-chart-3"
        />
      </div>

      {/* Generate Payroll Button */}
      <div className="flex justify-end">
        <GeneratePayrollDialog timesheets={timesheets as any} />
      </div>

      {/* Alerts Section */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Alerts</h2>

        {/* Expired Compliance Alert */}
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : expiredStaff.length > 0 ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Staff with Expired Compliance</AlertTitle>
            <AlertDescription>
              <div className="mt-2 flex flex-col gap-2">
                {expiredStaff?.map((staff) => (
                  <div key={(staff as any).id} className="flex items-center justify-between">
                    <span className="text-sm">{staff.email}</span>
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Expired
                    </Badge>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>All Staff Compliant</AlertTitle>
            <AlertDescription>
              No staff members have expired compliance documents
            </AlertDescription>
          </Alert>
        )}

        {/* Today's Open Shifts Alert */}
        {isLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : todayOpenShifts.length > 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Open Shifts Today</AlertTitle>
            <AlertDescription>
              <div className="mt-2 flex flex-col gap-2">
                {todayOpenShifts?.map((shift) => (
                  <div key={(shift as any).id} className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {shift.requiredRole || "Staff"} - {shift.headcount || 1} position{(shift.headcount || 1) > 1 ? "s" : ""}
                      </span>
                      {shift.startDateTime && (
                        <span className="text-xs text-muted-foreground">
                          {format(parseISO(shift.startDateTime), "h:mm a")}
                        </span>
                      )}
                    </div>
                    <Badge className="bg-chart-1/20 text-chart-1">
                      Open
                    </Badge>
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>No Open Shifts Today</AlertTitle>
            <AlertDescription>
              All shifts scheduled for today have been filled
            </AlertDescription>
          </Alert>
        )}

        {/* Role Upgrade Requests Alert */}
        <RoleUpgradeAlert />
      </div>
    </div>
  );
}