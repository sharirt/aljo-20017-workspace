import { useState, useEffect } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  ContractTemplatesEntity,
  SignatureRequestsEntity,
  SendSignatureRequestActionAction,
  StaffProfilesEntity,
  StaffAvailableShiftsPage,
  StaffMyProfilePage,
} from "@/product-types";
import { CheckCircle, FileSignature, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router";
import { getPageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const OnboardingStepComplete = () => {
  const user = useUser();
  const [sending, setSending] = useState(false);
  const [sentTemplates, setSentTemplates] = useState<string[]>([]);

  const { data: staffProfiles } = useEntityGetAll(StaffProfilesEntity, {
    email: user.email,
  });
  const staffProfile = staffProfiles?.[0] as any;

  const { data: activeTemplates } = useEntityGetAll(ContractTemplatesEntity);
  const { data: existingRequests } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId: staffProfile?.id },
    { enabled: !!staffProfile?.id }
  );

  const { executeFunction: sendSignature } = useExecuteAction(
    SendSignatureRequestActionAction
  );

  const activeList = ((activeTemplates as any[]) || []).filter(
    (t: any) => t.isActive
  );
  const requestsList = (existingRequests as any[]) || [];

  useEffect(() => {
    if (!staffProfile?.id || !activeList.length || sending) return;

    const missingTemplates = activeList.filter(
      (t: any) =>
        !requestsList.some(
          (r: any) => r.contractTemplateId === t.id
        )
    );

    if (missingTemplates.length === 0) return;

    const sendAll = async () => {
      setSending(true);
      const sent: string[] = [];
      for (const template of missingTemplates) {
        if (!template.docusealTemplateId) continue;
        try {
          await sendSignature({
            staffProfileId: staffProfile.id,
            staffEmail: staffProfile.email || user.email || "",
            staffName: `${staffProfile.firstName || ""} ${staffProfile.lastName || ""}`.trim() || user.name || "",
            contractTemplateId: template.id,
            contractTemplateName: template.name || "Contract",
            docusealTemplateId: template.docusealTemplateId,
            roleName: template.roleName || "Staff",
          });
          sent.push(template.name || "Contract");
        } catch {
          // silently skip failures
        }
      }
      setSentTemplates(sent);
      setSending(false);
    };

    sendAll();
  }, [staffProfile?.id, activeList.length, requestsList.length]);

  // Check contract statuses
  const allSignedOrApproved =
    requestsList.length > 0 &&
    requestsList.every(
      (r: any) => r.status === "signed" || r.status === "approved"
    );

  return (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center text-center gap-6">
          {/* Success icon */}
          <div className="rounded-full bg-accent/10 p-4">
            <CheckCircle className="h-16 w-16 text-accent" />
          </div>

          {/* Title & message */}
          <div className="flex flex-col gap-2 max-w-md">
            <h2 className="text-2xl font-bold">Welcome Aboard!</h2>
            <p className="text-muted-foreground">
              Your profile is complete and your documents are being reviewed.
              You&apos;ll receive a notification when your account is fully
              approved. In the meantime, you can browse available shifts.
            </p>
          </div>

          {/* Contracts section */}
          {(sending || sentTemplates.length > 0 || requestsList.length > 0) && (
            <Card className="w-full max-w-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileSignature className="h-5 w-5" />
                  <span className="text-sm font-semibold">Contracts for Signing</span>
                </div>

                {sending ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending contract(s) for signing...
                  </div>
                ) : allSignedOrApproved ? (
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <CheckCircle className="h-4 w-4" />
                    All contracts signed
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {requestsList.map((req: any) => (
                      <div
                        key={req.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="truncate">
                          {req.contractTemplateName || "Contract"}
                        </span>
                        <Badge
                          className={cn(
                            "text-xs shrink-0",
                            req.status === "pending"
                              ? "bg-chart-3/20 text-chart-3"
                              : req.status === "signed"
                              ? "bg-chart-1/20 text-chart-1"
                              : req.status === "approved"
                              ? "bg-accent/20 text-accent"
                              : "bg-destructive/20 text-destructive"
                          )}
                        >
                          {req.status}
                        </Badge>
                      </div>
                    ))}
                    {sentTemplates
                      .filter(
                        (name) =>
                          !requestsList.some(
                            (r: any) => r.contractTemplateName === name
                          )
                      )
                      .map((name) => (
                        <div
                          key={name}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate">{name}</span>
                          <Badge className="bg-chart-3/20 text-chart-3 text-xs">
                            pending
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3 w-full max-w-sm sm:flex-row">
            <Button className="h-12 flex-1" asChild>
              <Link to={getPageUrl(StaffAvailableShiftsPage)}>
                Browse Available Shifts
              </Link>
            </Button>
            <Button variant="outline" className="h-12 flex-1" asChild>
              <Link to={getPageUrl(StaffMyProfilePage)}>View My Profile</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};