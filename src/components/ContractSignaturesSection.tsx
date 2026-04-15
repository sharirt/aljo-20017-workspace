import { useState } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  SignatureRequestsEntity,
  GetSignedFileUrlAction,
  ApproveSignatureRequestActionAction,
  RejectSignatureRequestActionAction,
  ResendSignatureRequestActionAction,
  ContractTemplatesEntity,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { FileSignature, ExternalLink, Copy, Loader2, Check, X } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function getStatusBadge(status?: string) {
  switch (status) {
    case "pending":
      return <Badge className="bg-chart-3/20 text-chart-3 border-chart-3/30">Pending</Badge>;
    case "signed":
      return <Badge className="bg-chart-1/20 text-chart-1 border-chart-1/30">Signed</Badge>;
    case "approved":
      return <Badge className="bg-accent/20 text-accent border-accent/30">Approved</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

interface ContractSignaturesSectionProps {
  staffProfileId: string;
  staffEmail: string;
  staffName: string;
}

export const ContractSignaturesSection = ({
  staffProfileId,
  staffEmail,
  staffName,
}: ContractSignaturesSectionProps) => {
  const currentUser = useUser();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const { data: signatureRequests, isLoading } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { executeFunction: approveSignature } = useExecuteAction(ApproveSignatureRequestActionAction);
  const { executeFunction: rejectSignature } = useExecuteAction(RejectSignatureRequestActionAction);
  const { executeFunction: resendSignature } = useExecuteAction(ResendSignatureRequestActionAction);
  const { executeFunction: getSignedUrl } = useExecuteAction(GetSignedFileUrlAction);

  const { data: templates } = useEntityGetAll(ContractTemplatesEntity);

  const handleApprove = async (requestId: string) => {
    setActionLoadingId(requestId);
    try {
      await approveSignature({
        signatureRequestId: requestId,
        reviewedByEmail: currentUser.email || "",
      });
      toast.success("Signature approved");
    } catch {
      toast.error("Failed to approve signature");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setActionLoadingId(requestId);
    try {
      await rejectSignature({
        signatureRequestId: requestId,
        reviewedByEmail: currentUser.email || "",
        rejectionReason: rejectionReason.trim(),
      });
      toast.success("Signature rejected");
      setRejectingId(null);
      setRejectionReason("");
    } catch {
      toast.error("Failed to reject signature");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResend = async (request: typeof SignatureRequestsEntity.instanceType & { id: string }) => {
    const template = templates?.find((t: any) => t.id === request.contractTemplateId);
    if (!request.docusealTemplateId) {
      toast.error("Missing template ID");
      return;
    }
    setActionLoadingId(request.id);
    try {
      await resendSignature({
        signatureRequestId: request.id,
        staffEmail: request.staffEmail || staffEmail,
        staffName: request.staffName || staffName,
        docusealTemplateId: request.docusealTemplateId,
        roleName: template?.roleName || "Staff",
      });
      toast.success("Signature request re-sent");
    } catch {
      toast.error("Failed to re-send request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDocument = async (fileUrl?: string) => {
    if (!fileUrl) return;
    try {
      const result = await getSignedUrl({ fileUrl });
      if (result?.signedUrl) {
        window.open(result.signedUrl, "_blank");
      } else {
        toast.error("Failed to get document URL");
      }
    } catch {
      toast.error("Failed to open document");
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Signing link copied");
  };

  const requests = (signatureRequests as any[]) || [];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileSignature className="h-5 w-5" />
            Contract Signatures
          </CardTitle>
          {requests.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {requests.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ) : requests.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">No contracts sent yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {requests.map((req: any) => (
              <div key={req.id} className="rounded-lg border p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{req.contractTemplateName || "Contract"}</span>
                    {req.sentAt && (
                      <span className="text-xs text-muted-foreground">
                        Sent {format(parseISO(req.sentAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(req.status)}
                </div>

                {/* Rejection reason */}
                {req.status === "rejected" && req.rejectionReason && (
                  <div className="rounded-md bg-chart-3/10 border border-chart-3/20 p-2">
                    <p className="text-xs text-chart-3">
                      <span className="font-medium">Rejection reason:</span> {req.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Inline rejection input */}
                {rejectingId === req.id && (
                  <div className="flex flex-col gap-2">
                    <Input
                      placeholder="Rejection reason..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="h-9 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-9"
                        onClick={() => handleReject(req.id)}
                        disabled={actionLoadingId === req.id}
                      >
                        {actionLoadingId === req.id ? (
                          <Loader2 className="animate-spin" data-icon="inline-start" />
                        ) : (
                          <X data-icon="inline-start" />
                        )}
                        Confirm Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2">
                  {req.status === "signed" && rejectingId !== req.id && (
                    <>
                      <Button
                        size="sm"
                        className="h-9"
                        onClick={() => handleApprove(req.id)}
                        disabled={actionLoadingId === req.id}
                      >
                        {actionLoadingId === req.id ? (
                          <Loader2 className="animate-spin" data-icon="inline-start" />
                        ) : (
                          <Check data-icon="inline-start" />
                        )}
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => setRejectingId(req.id)}
                      >
                        <X data-icon="inline-start" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9"
                        onClick={() => handleViewDocument(req.signedDocumentUrl)}
                      >
                        <ExternalLink data-icon="inline-start" />
                        View Document
                      </Button>
                    </>
                  )}

                  {req.status === "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => handleResend(req)}
                      disabled={actionLoadingId === req.id}
                    >
                      {actionLoadingId === req.id ? (
                        <Loader2 className="animate-spin" data-icon="inline-start" />
                      ) : null}
                      Re-send
                    </Button>
                  )}

                  {req.status === "approved" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => handleViewDocument(req.signedDocumentUrl)}
                    >
                      <ExternalLink data-icon="inline-start" />
                      View Document
                    </Button>
                  )}

                  {req.status === "pending" && (
                    <div className="flex flex-col gap-1.5 w-full">
                      <span className="text-xs text-muted-foreground">Pending signature...</span>
                      {req.signingUrl && (
                        <div className="flex items-center gap-2">
                          <Input
                            readOnly
                            value={req.signingUrl}
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 shrink-0"
                            onClick={() => handleCopyLink(req.signingUrl)}
                          >
                            <Copy data-icon="inline-start" />
                            Copy
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};