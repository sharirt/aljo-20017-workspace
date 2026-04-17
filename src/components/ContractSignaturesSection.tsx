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
  SendContractToStaffAction,
  ContractTemplatesEntity,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FileSignature, ExternalLink, Copy, Loader2, Check, X, Clock, CheckCircle, Send, Eye, Download, FileText } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ContractSignaturesSectionProps {
  staffProfileId: string;
  staffEmail: string;
  staffName: string;
}

interface PreviewFile {
  blobUrl: string;
  name: string;
  mimeType: string;
  isImage: boolean;
  isPdf: boolean;
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
  const [viewLoadingId, setViewLoadingId] = useState<string | null>(null);
  const [previewLoadingId, setPreviewLoadingId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<PreviewFile | null>(null);

  const { data: signatureRequests, isLoading } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { executeFunction: approveSignature } = useExecuteAction(ApproveSignatureRequestActionAction);
  const { executeFunction: rejectSignature } = useExecuteAction(RejectSignatureRequestActionAction);
  const { executeFunction: resendSignature } = useExecuteAction(SendContractToStaffAction);
  const { executeFunction: getSignedUrl } = useExecuteAction(GetSignedFileUrlAction);

  const { data: templates } = useEntityGetAll(ContractTemplatesEntity);

  const getFileExtension = (url?: string, fileName?: string): string => {
    const source = fileName || url || "";
    const match = source.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    return match ? match[1].toLowerCase() : "";
  };

  const detectFileType = (mimeType: string, url?: string) => {
    const ext = getFileExtension(url);
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp"];
    const isImage = mimeType?.startsWith("image/") || imageExts.includes(ext);
    const isPdf = mimeType === "application/pdf" || ext === "pdf";
    return { isImage, isPdf };
  };

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

  const handleResend = async (request: any) => {
    if (!request.contractTemplateId) {
      toast.error("Missing contract template");
      return;
    }
    setActionLoadingId(request.id);
    try {
      await resendSignature({
        staffProfileId,
        staffEmail: request.staffEmail || staffEmail,
        staffName: request.staffName || staffName,
        contractTemplateId: request.contractTemplateId,
      });
      toast.success("Signature request re-sent");
    } catch {
      toast.error("Failed to re-send request");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleViewDocument = async (fileUrl?: string, requestId?: string) => {
    if (!fileUrl) return;
    if (requestId) setViewLoadingId(requestId);
    try {
      const result = await getSignedUrl({ fileUrl });
      if (result?.signedUrl) {
        window.open(result.signedUrl, "_blank");
      } else {
        toast.error("Failed to get document URL");
      }
    } catch {
      toast.error("Failed to open document");
    } finally {
      setViewLoadingId(null);
    }
  };

  const handleDownloadDocument = async (fileUrl?: string, fileName?: string, requestId?: string) => {
    if (!fileUrl) return;
    if (requestId) setViewLoadingId(requestId);
    try {
      const result = await getSignedUrl({ fileUrl });
      if (result?.signedUrl) {
        const a = document.createElement("a");
        a.href = result.signedUrl;
        a.download = fileName ? `${fileName}.pdf` : "document.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        toast.error("Failed to get document URL");
      }
    } catch {
      toast.error("Failed to download document");
    } finally {
      setViewLoadingId(null);
    }
  };

  const handlePreviewDocument = async (fileUrl: string, contractName: string, requestId: string) => {
    setPreviewLoadingId(requestId);
    try {
      const result = await getSignedUrl({ fileUrl });
      if (!result?.signedUrl) {
        toast.error("Failed to load document preview");
        return;
      }
      const response = await fetch(result.signedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const contentType = response.headers.get("Content-Type") || "";
      const { isImage, isPdf } = detectFileType(contentType, fileUrl);
      setPreviewFile({
        blobUrl,
        name: contractName || "Contract",
        mimeType: contentType,
        isImage,
        isPdf,
      });
    } catch {
      toast.error("Failed to load document preview");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Signing link copied");
  };

  const requests = (signatureRequests as any[]) || [];
  const hasDocument = (req: any) => !!req.signedDocumentUrl;

  return (
    <>
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
                <div
                  key={req.id}
                  className={cn(
                    "rounded-lg border p-3 flex flex-col gap-2",
                    req.status === "signed" && "border-l-4 border-l-chart-3",
                    req.status === "approved" && "border-l-4 border-l-accent",
                    req.status === "rejected" && "border-l-4 border-l-destructive"
                  )}
                >
                  {/* Header: name, date, badge, preview */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{req.contractTemplateName || "Contract"}</span>
                      {req.sentAt && (
                        <span className="text-xs text-muted-foreground">
                          Sent {format(parseISO(req.sentAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={req.status} />
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={!hasDocument(req) || previewLoadingId === req.id}
                        onClick={() =>
                          handlePreviewDocument(
                            req.signedDocumentUrl,
                            req.contractTemplateName || "Contract",
                            req.id
                          )
                        }
                      >
                        {previewLoadingId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* === SIGNED STATE: Awaiting Admin Review === */}
                  {req.status === "signed" && (
                    <>
                      {/* Amber banner */}
                      <div className="rounded-md bg-chart-3/10 border border-chart-3/20 p-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-chart-3 shrink-0" />
                        <span className="text-sm font-medium text-chart-3">Awaiting Admin Review</span>
                      </div>

                      {rejectingId !== req.id && (
                        <>
                          {/* Download Document - primary action */}
                          <Button
                            variant="outline"
                            className="w-full min-h-10"
                            onClick={() => handleDownloadDocument(req.signedDocumentUrl, req.contractTemplateName, req.id)}
                            disabled={viewLoadingId === req.id}
                          >
                            {viewLoadingId === req.id ? (
                              <Loader2 className="animate-spin" data-icon="inline-start" />
                            ) : (
                              <Download data-icon="inline-start" />
                            )}
                            Download Document
                          </Button>

                          {/* Approve / Reject side by side */}
                          <div className="flex gap-2">
                            <Button
                              className="flex-1 min-h-10 bg-accent text-accent-foreground hover:bg-accent/90"
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
                              variant="destructive"
                              className="flex-1 min-h-10"
                              onClick={() => setRejectingId(req.id)}
                            >
                              <X data-icon="inline-start" />
                              Reject
                            </Button>
                          </div>

                          {/* Info note */}
                          <p className="text-xs text-muted-foreground italic">
                            Approving allows staff to continue onboarding. Rejecting requires staff to re-sign.
                          </p>
                        </>
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
                              className="min-h-10"
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
                              className="min-h-10"
                              onClick={() => { setRejectingId(null); setRejectionReason(""); }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* === APPROVED STATE === */}
                  {req.status === "approved" && (
                    <>
                      <div className="rounded-md bg-accent/10 border border-accent/20 p-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-accent shrink-0" />
                        <span className="text-sm font-medium text-accent">Approved</span>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full min-h-10"
                        onClick={() => handleViewDocument(req.signedDocumentUrl, req.id)}
                        disabled={viewLoadingId === req.id}
                      >
                        {viewLoadingId === req.id ? (
                          <Loader2 className="animate-spin" data-icon="inline-start" />
                        ) : (
                          <ExternalLink data-icon="inline-start" />
                        )}
                        View Document
                      </Button>
                    </>
                  )}

                  {/* === REJECTED STATE === */}
                  {req.status === "rejected" && (
                    <>
                      {req.rejectionReason && (
                        <div className="rounded-md bg-chart-3/10 border border-chart-3/20 p-2">
                          <p className="text-xs text-chart-3">
                            <span className="font-medium">Rejection reason:</span> {req.rejectionReason}
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        className="w-full min-h-10"
                        onClick={() => handleResend(req)}
                        disabled={actionLoadingId === req.id}
                      >
                        {actionLoadingId === req.id ? (
                          <Loader2 className="animate-spin" data-icon="inline-start" />
                        ) : (
                          <Send data-icon="inline-start" />
                        )}
                        Re-send for Signing
                      </Button>
                    </>
                  )}

                  {/* === PENDING STATE === */}
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview Dialog */}
      <Dialog
        open={!!previewFile}
        onOpenChange={(open) => {
          if (!open) {
            if (previewFile?.blobUrl) {
              URL.revokeObjectURL(previewFile.blobUrl);
            }
            setPreviewFile(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          {previewFile && (
            <div className="flex flex-col gap-4">
              {previewFile.isImage ? (
                <div className="flex items-center justify-center">
                  <img
                    src={previewFile.blobUrl}
                    alt={previewFile.name}
                    className="max-h-[70vh] w-full object-contain rounded-lg"
                  />
                </div>
              ) : previewFile.isPdf ? (
                <iframe
                  src={previewFile.blobUrl}
                  title={previewFile.name}
                  className="w-full rounded-lg border"
                  style={{ height: "70vh", minHeight: "500px" }}
                />
              ) : (
                <div className="flex h-[300px] flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">This file type cannot be previewed</p>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!previewFile) return;
                    const a = document.createElement("a");
                    a.href = previewFile.blobUrl;
                    a.download = previewFile.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download data-icon="inline-start" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

function StatusBadge({ status }: { status?: string }) {
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