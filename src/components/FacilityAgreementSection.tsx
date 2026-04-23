import { useState } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  FacilityAgreementsEntity,
  ContractTemplatesEntity,
  GetSignedFileUrlAction,
  SendFacilityAgreementAction,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSignature, ExternalLink, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface FacilityAgreementSectionProps {
  facilityId: string;
  facilityName: string;
}

export const FacilityAgreementSection = ({
  facilityId,
  facilityName,
}: FacilityAgreementSectionProps) => {
  const user = useUser();
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sending, setSending] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(false);

  const { data: agreements, isLoading: loadingAgreements } = useEntityGetAll(
    FacilityAgreementsEntity,
    { facilityProfileId: facilityId }
  );

  const { data: templates } = useEntityGetAll(ContractTemplatesEntity);

  const { executeFunction: sendAgreement } = useExecuteAction(
    SendFacilityAgreementAction
  );
  const { executeFunction: getSignedUrl } = useExecuteAction(
    GetSignedFileUrlAction
  );

  const facilityAgreementTemplates = (templates as any[])?.filter(
    (t: any) => t.templateType === "facility_agreement" && t.isActive && t.docusealTemplateId
  ) || [];

  // Get the latest agreement for this facility
  const allAgreements = (agreements as any[]) || [];
  const latestAgreement = allAgreements.sort(
    (a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const status = latestAgreement?.status || null;

  const getStatusBadge = () => {
    if (!status) {
      return <Badge className="bg-muted text-muted-foreground">No Agreement</Badge>;
    }
    switch (status) {
      case "pending_fm_signature":
        return <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30">Pending FM Signature</Badge>;
      case "pending_admin_signature":
        return <Badge className="bg-primary/20 text-primary border-primary/30">Pending Admin Signature</Badge>;
      case "signed":
        return <Badge className="bg-accent/20 text-accent border-accent/30">Signed</Badge>;
      case "expired":
        return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Expired</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  const handleSendAgreement = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template");
      return;
    }
    setSending(true);
    try {
      await sendAgreement({
        facilityProfileId: facilityId,
        facilityName,
        contractTemplateId: selectedTemplateId,
        sentByEmail: user.email || "",
        adminEmail: user.email || "",
        adminName: user.name || "",
      });
      toast.success("Facility agreement sent successfully");
      setSendDialogOpen(false);
      setSelectedTemplateId("");
    } catch {
      toast.error("Failed to send facility agreement");
    } finally {
      setSending(false);
    }
  };

  const handleViewDocument = async () => {
    if (!latestAgreement?.signedDocumentUrl) return;
    setViewingDoc(true);
    try {
      const result = await getSignedUrl({
        fileUrl: latestAgreement.signedDocumentUrl,
      });
      if (result?.signedUrl) {
        window.open(result.signedUrl, "_blank");
      } else {
        toast.error("Failed to get document URL");
      }
    } catch {
      toast.error("Failed to open document");
    } finally {
      setViewingDoc(false);
    }
  };

  const handleAdminSign = () => {
    if (latestAgreement?.adminSigningUrl) {
      window.open(latestAgreement.adminSigningUrl, "_blank");
    }
  };

  if (loadingAgreements) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-chart-4" />
              <CardTitle className="text-lg">Facility Agreement</CardTitle>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {/* Signed state */}
          {status === "signed" && latestAgreement && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-sm">
                {latestAgreement.fmSignedAt && (
                  <p className="text-muted-foreground">
                    FM signed: {format(parseISO(latestAgreement.fmSignedAt), "MMM d, yyyy")}
                    {latestAgreement.facilityManagerName && ` by ${latestAgreement.facilityManagerName}`}
                  </p>
                )}
                {latestAgreement.adminSignedAt && (
                  <p className="text-muted-foreground">
                    Admin signed: {format(parseISO(latestAgreement.adminSignedAt), "MMM d, yyyy")}
                  </p>
                )}
                {latestAgreement.expiresAt && (
                  <p className="text-muted-foreground">
                    Expires: {format(parseISO(latestAgreement.expiresAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
              {latestAgreement.signedDocumentUrl && (
                <Button
                  variant="outline"
                  className="h-11 w-fit"
                  onClick={handleViewDocument}
                  disabled={viewingDoc}
                >
                  {viewingDoc ? (
                    <Loader2 className="animate-spin" data-icon="inline-start" />
                  ) : (
                    <ExternalLink data-icon="inline-start" />
                  )}
                  View Signed Document
                </Button>
              )}
            </div>
          )}

          {/* Pending admin signature */}
          {status === "pending_admin_signature" && latestAgreement && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1 text-sm">
                {latestAgreement.fmSignedAt && (
                  <p className="text-muted-foreground">
                    FM signed: {format(parseISO(latestAgreement.fmSignedAt), "MMM d, yyyy")}
                  </p>
                )}
                <p className="text-muted-foreground">
                  Awaiting your countersignature
                </p>
              </div>
              <Button className="h-11 w-fit" onClick={handleAdminSign}>
                <FileSignature data-icon="inline-start" />
                Sign Now (Admin)
              </Button>
            </div>
          )}

          {/* Pending FM signature */}
          {status === "pending_fm_signature" && latestAgreement && (
            <div className="flex flex-col gap-2 text-sm">
              <p className="text-muted-foreground">
                Sent to: {latestAgreement.facilityManagerEmail}
              </p>
              {latestAgreement.sentAt && (
                <p className="text-muted-foreground">
                  Sent on: {format(parseISO(latestAgreement.sentAt), "MMM d, yyyy")}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Waiting for the facility manager to sign. They will receive an email with the signing link.
              </p>
            </div>
          )}

          {/* Expired or no agreement */}
          {(status === "expired" || !status) && (
            <div className="flex flex-col gap-3">
              {status === "expired" && (
                <p className="text-sm text-destructive">
                  The previous agreement has expired. Send a new one.
                </p>
              )}
              {!status && (
                <p className="text-sm text-muted-foreground">
                  No facility agreement has been sent yet.
                </p>
              )}
              <Button
                className="h-11 w-fit"
                onClick={() => setSendDialogOpen(true)}
              >
                <Send data-icon="inline-start" />
                Send Agreement
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Agreement Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Facility Agreement</DialogTitle>
            <DialogDescription>
              Select a facility agreement template to send to the facility
              manager for signing.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-1.5">
              <Label>Agreement Template</Label>
              <Select
                value={selectedTemplateId}
                onValueChange={setSelectedTemplateId}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {facilityAgreementTemplates.length === 0 ? (
                    <SelectItem value="_none" disabled>
                      No facility agreement templates available
                    </SelectItem>
                  ) : (
                    facilityAgreementTemplates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSendDialogOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendAgreement}
              disabled={sending || !selectedTemplateId}
            >
              {sending ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Sending...
                </>
              ) : (
                <>
                  <Send data-icon="inline-start" />
                  Send Agreement
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};