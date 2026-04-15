import { useState, useEffect, useRef } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ContractTemplatesEntity,
  SignatureRequestsEntity,
  SendSignatureRequestActionAction,
} from "@/product-types";
import type { ISignatureRequestsEntity, IContractTemplatesEntity } from "@/product-types";
import {
  FileSignature,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
  ExternalLink,
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
import { cn } from "@/lib/utils";

interface OnboardingStepSigningProps {
  staffProfileId: string;
  staffEmail: string;
  staffName: string;
  onNext: () => void;
  onBack: () => void;
}

type TemplateWithId = IContractTemplatesEntity & { id: string };
type RequestWithId = ISignatureRequestsEntity & { id: string };

export const OnboardingStepSigning = ({
  staffProfileId,
  staffEmail,
  staffName,
  onNext,
  onBack,
}: OnboardingStepSigningProps) => {
  const [sending, setSending] = useState(false);
  const [polling, setPolling] = useState(false);
  const sentRef = useRef(false);

  const { data: allTemplates } = useEntityGetAll(ContractTemplatesEntity);
  const {
    data: signatureRequests,
    refetch: refetchRequests,
  } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { executeFunction: sendSignature } = useExecuteAction(
    SendSignatureRequestActionAction
  );

  const activeTemplates = ((allTemplates as TemplateWithId[]) || []).filter(
    (t) => t.isActive
  );
  const requests = (signatureRequests as RequestWithId[]) || [];

  // Send signature requests for templates that don't have one yet
  useEffect(() => {
    if (!staffProfileId || !activeTemplates.length || sending || sentRef.current) return;

    const missing = activeTemplates.filter(
      (t) => !requests.some((r) => r.contractTemplateId === t.id)
    );

    if (missing.length === 0) {
      sentRef.current = true;
      return;
    }

    const sendAll = async () => {
      setSending(true);
      for (const template of missing) {
        if (!template.docusealTemplateId) continue;
        try {
          await sendSignature({
            staffProfileId,
            staffEmail,
            staffName,
            contractTemplateId: template.id,
            contractTemplateName: template.name || "Contract",
            docusealTemplateId: template.docusealTemplateId,
            roleName: template.roleName || "Staff",
          });
        } catch {
          // skip failures silently
        }
      }
      sentRef.current = true;
      setSending(false);
      refetchRequests();
    };

    sendAll();
  }, [staffProfileId, activeTemplates.length, requests.length]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setPolling(true);
      refetchRequests().finally(() => setPolling(false));
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchRequests]);

  const noContracts = activeTemplates.length === 0;

  const allSignedOrApproved =
    noContracts ||
    (activeTemplates.length > 0 &&
      activeTemplates.every((t) => {
        const req = requests.find((r) => r.contractTemplateId === t.id);
        return req && (req.status === "signed" || req.status === "approved");
      }));

  const getRequestForTemplate = (templateId: string) =>
    requests.find((r) => r.contractTemplateId === templateId);

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
        return (
          <Badge className="bg-muted text-muted-foreground">Preparing</Badge>
        );
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
          {sending ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="animate-spin text-primary" />
              <span className="text-muted-foreground">
                Preparing your contracts...
              </span>
            </div>
          ) : noContracts ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
              <Info className="shrink-0 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                No contracts required at this time
              </span>
            </div>
          ) : (
            activeTemplates.map((template) => {
              const req = getRequestForTemplate(template.id);
              const status = req?.status;

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
                    {status === "pending" && (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm text-muted-foreground">
                          Check your email for the signing link, or use the
                          button below
                        </p>
                        {req?.signingUrl && (
                          <Button
                            className="h-12"
                            asChild
                          >
                            <a
                              href={req.signingUrl}
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
                        {req?.signingUrl && (
                          <Button
                            variant="outline"
                            className="h-12"
                            asChild
                          >
                            <a
                              href={req.signingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink data-icon="inline-start" />
                              Re-sign
                            </a>
                          </Button>
                        )}
                      </div>
                    )}

                    {!status && !sending && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="shrink-0 animate-spin" />
                        Preparing...
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Polling indicator */}
          {polling && !sending && (
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" />
              Checking for updates...
            </div>
          )}

          {/* Help text when not all signed */}
          {!allSignedOrApproved && !sending && !noContracts && (
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