import { useState } from "react";
import {
  useEntityGetAll,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilityAgreementsEntity } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartPulse, FileSignature, RefreshCw, Loader2, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default function FacilityAgreementSignPage() {
  const user = useUser();
  const [refreshing, setRefreshing] = useState(false);

  const { data: agreements, isLoading, refetch } = useEntityGetAll(
    FacilityAgreementsEntity,
    { facilityManagerEmail: user.email }
  );

  const allAgreements = (agreements as any[]) || [];
  // Find the most recent pending or expired agreement
  const pendingAgreement = allAgreements
    .filter(
      (a: any) =>
        a.status === "pending_fm_signature" || a.status === "expired"
    )
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  // Check if FM already signed (pending admin)
  const pendingAdminAgreement = allAgreements
    .filter((a: any) => a.status === "pending_admin_signature" || a.status === "signed")
    .sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSign = () => {
    if (pendingAgreement?.fmSigningUrl) {
      window.open(pendingAgreement.fmSigningUrl, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="w-full max-w-lg mx-4">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="size-16 rounded-xl" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-12 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If FM already signed, show success
  if (!pendingAgreement && pendingAdminAgreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-xl bg-accent/10">
                <CheckCircle className="size-8 text-accent" />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Thank You!</h1>
                <p className="text-muted-foreground">
                  Your signature has been received. The admin will countersign shortly.
                </p>
              </div>
              {pendingAdminAgreement.facilityName && (
                <p className="text-sm text-muted-foreground">
                  Facility: {pendingAdminAgreement.facilityName}
                </p>
              )}
              <Button
                variant="outline"
                className="h-11"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No pending agreement at all
  if (!pendingAgreement) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="p-8">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10">
                <Clock className="size-8 text-primary" />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold">Waiting for Agreement</h1>
                <p className="text-muted-foreground">
                  The admin has not yet sent a facility agreement. Please check back later.
                </p>
              </div>
              <Button
                variant="outline"
                className="h-11"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                {refreshing ? (
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                ) : (
                  <RefreshCw data-icon="inline-start" />
                )}
                Refresh Status
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExpired = pendingAgreement.status === "expired";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex size-16 items-center justify-center rounded-xl bg-primary/10">
              <HeartPulse className="size-8 text-primary" />
            </div>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold">Facility Agreement Required</h1>
              <p className="text-muted-foreground">
                You must sign the facility agreement before accessing the portal.
              </p>
            </div>

            {isExpired && (
              <div className="flex items-center gap-2 rounded-lg bg-chart-3/10 px-4 py-3 text-sm text-chart-3">
                <AlertTriangle className="size-4 shrink-0" />
                <span>The previous agreement has expired. Please sign the new one.</span>
              </div>
            )}

            {pendingAgreement.facilityName && (
              <div className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">
                  Facility: <span className="font-medium text-foreground">{pendingAgreement.facilityName}</span>
                </span>
                {pendingAgreement.contractTemplateName && (
                  <span className="text-muted-foreground">
                    Template: <span className="font-medium text-foreground">{pendingAgreement.contractTemplateName}</span>
                  </span>
                )}
              </div>
            )}

            <Button
              className="h-12 w-full text-base"
              onClick={handleSign}
            >
              <FileSignature data-icon="inline-start" />
              Sign Agreement
            </Button>

            <Button
              variant="outline"
              className="h-11"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="animate-spin" data-icon="inline-start" />
              ) : (
                <RefreshCw data-icon="inline-start" />
              )}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}