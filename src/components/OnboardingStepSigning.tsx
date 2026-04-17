import { useState, useEffect } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ContractTemplatesEntity,
  SignatureRequestsEntity,
  SendContractToStaffAction,
} from "@/product-types";
import type { ISignatureRequestsEntity, IContractTemplatesEntity } from "@/product-types";
import {
  FileSignature,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getCanonicalSignatureRequestForTemplate } from "@/utils/onboardingUtils";

interface OnboardingStepSigningProps {
  staffProfileId: string;
  staffEmail: string;
  staffName: string;
  staffPhone?: string;
  onNext: () => void;
  onBack: () => void;
}

type TemplateWithId = IContractTemplatesEntity & { id: string };
type RequestWithId = ISignatureRequestsEntity & { id: string };

export const OnboardingStepSigning = ({
  staffProfileId,
  staffEmail,
  staffName,
  staffPhone,
  onNext,
  onBack,
}: OnboardingStepSigningProps) => {
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [resendingIds, setResendingIds] = useState<Set<string>>(new Set());
  const [polling, setPolling] = useState(false);
  const [optimisticPendingIds, setOptimisticPendingIds] = useState<Set<string>>(new Set());

  const { data: allTemplates, isLoading: isLoadingTemplates } = useEntityGetAll(ContractTemplatesEntity);
  const {
    data: signatureRequests,
    refetch: refetchRequests,
    isLoading: isLoadingRequests,
  } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const isDataReady = !isLoadingTemplates && !isLoadingRequests;

  const { executeFunction: sendSignature } = useExecuteAction(
    SendContractToStaffAction
  );

  const activeTemplates = ((allTemplates as TemplateWithId[]) || []).filter(
    (t) => t.isActive
  );
  const requests = (signatureRequests as RequestWithId[]) || [];

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPolling(true);
      refetchRequests().finally(() => setPolling(false));
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchRequests]);

  const noContracts = isDataReady && activeTemplates.length === 0;

  const allSignedOrApproved =
    isDataReady &&
    (noContracts ||
      (activeTemplates.length > 0 &&
        activeTemplates.every((t) => {
          const req = getCanonicalSignatureRequestForTemplate(requests, t.id);
          return req?.status === "approved";
        })));

  const handleSendContract = async (template: TemplateWithId) => {
    setSendingIds((prev) => new Set(prev).add(template.id));
    try {
      await sendSignature({
        staffProfileId,
        staffEmail,
        staffName,
        contractTemplateId: template.id,
        ...(staffPhone ? { staffPhone } : {}),
      });
      refetchRequests();
    } catch {
      toast.error("Failed to send contract. Please try again.");
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(template.id);
        return next;
      });
    }
  };

  const handleResendContract = async (template: TemplateWithId) => {
    setResendingIds((prev) => new Set(prev).add(template.id));
    try {
      await sendSignature({
        staffProfileId,
        staffEmail,
        staffName,
        contractTemplateId: template.id,
        ...(staffPhone ? { staffPhone } : {}),
      });
      setOptimisticPendingIds((prev) => new Set(prev).add(template.id));
      await refetchRequests();
      toast.success("New signing link sent!");
    } catch {
      toast.error("Failed to re-send contract. Please try again.");
    } finally {
      setResendingIds((prev) => {
        const next = new Set(prev);
        next.delete(template.id);
        return next;
      });
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-chart-3/20 text-chart-3">
            Pending Signature
          </Badge>
        );
      case "signed":
        return (
          <Badge className="bg-chart-1/20 text-chart-1">
            Signed — Awaiting Approval
          </Badge>
        );
      case "approved":
        return <Badge className="bg-accent/20 text-accent">Approved</Badge>;
      case "rejected":
        return (
          <Badge className="bg-destructive/20 text-destructive">Rejected</Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2">
            <FileSignature className="text-primary" />
          </div>
          <div>
            <CardTitle>Sign Your Contracts</CardTitle>
            <CardDescription>
              Review and sign the required employment contracts
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {noContracts ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <Info className="shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                No contracts required at this time
              </span>
            </div>
          ) : (
            activeTemplates.map((template) => {
              const req = getCanonicalSignatureRequestForTemplate(requests, template.id);
              const isOptimisticPending = optimisticPendingIds.has(template.id);
              const status = isOptimisticPending && (req?.status === "rejected" || !req) ? "pending" : req?.status;
              const isSending = sendingIds.has(template.id);
              const optimisticSigningUrl = isOptimisticPending && (req?.status === "rejected" || !req) ? undefined : req?.signingUrl;

              return (
                <div
                  key={template.id}
                  className="rounded-lg border border-border p-4"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-semibold">
                      {template.name || "Contract"}
                    </span>
                    {getStatusBadge(status)}
                  </div>

                  <div className="mt-3">
                    {!status && (
                      <Button
                        className="h-12 w-full"
                        disabled={isSending}
                        onClick={() => handleSendContract(template)}
                      >
                        {isSending ? (
                          <>
                            <Loader2 data-icon="inline-start" className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <FileSignature data-icon="inline-start" />
                            Send Contract
                          </>
                        )}
                      </Button>
                    )}

                    {status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">
                          Check your email for the signing link{optimisticSigningUrl ? ", or use the button below" : ""}
                        </p>
                        {optimisticSigningUrl && (
                          <Button
                            className="h-12"
                            asChild
                          >
                            <a
                              href={optimisticSigningUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink data-icon="inline-start" />
                              Open Signing Link
                            </a>
                          </Button>
                        )}
                      </div>
                    )}

                    {status === "signed" && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="shrink-0 text-accent" />
                        Signed! Waiting for admin approval...
                      </div>
                    )}

                    {status === "approved" && (
                      <div className="flex items-center gap-2 text-sm text-accent">
                        <CheckCircle className="shrink-0" />
                        Approved
                      </div>
                    )}

                    {status === "rejected" && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <XCircle className="shrink-0" />
                          {req?.rejectionReason || "Document was rejected"}
                        </div>
                        <Button
                          variant="outline"
                          className="h-12 w-full"
                          disabled={resendingIds.has(template.id)}
                          onClick={() => handleResendContract(template)}
                        >
                          {resendingIds.has(template.id) ? (
                            <>
                              <Loader2 data-icon="inline-start" className="animate-spin" />
                              Resending...
                            </>
                          ) : (
                            <>
                              <RefreshCw data-icon="inline-start" />
                              Re-send Contract
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Polling indicator */}
          {polling && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Checking for updates...
            </div>
          )}

          {/* Help text when not all signed */}
          {!allSignedOrApproved && !noContracts && (
            <p className="text-center text-sm text-muted-foreground">
              Waiting for you to sign all contracts above
            </p>
          )}

          {/* Action buttons */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button
              className="h-12"
              disabled={!allSignedOrApproved}
              onClick={onNext}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};