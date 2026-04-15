import { useState } from "react";
import {
  useEntityGetAll,
  useExecuteAction,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  SignatureRequestsEntity,
  GetSignedFileUrlAction,
} from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileSignature, ExternalLink, ChevronDown } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SignedContractsSectionProps {
  staffProfileId: string;
}

export const SignedContractsSection = ({ staffProfileId }: SignedContractsSectionProps) => {
  const [expanded, setExpanded] = useState(false);

  const { data: signatureRequests, isLoading } = useEntityGetAll(
    SignatureRequestsEntity,
    { staffProfileId },
    { enabled: !!staffProfileId }
  );

  const { executeFunction: getSignedUrl } = useExecuteAction(GetSignedFileUrlAction);

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

  const signedOrApproved = ((signatureRequests as any[]) || []).filter(
    (req: any) => req.status === "signed" || req.status === "approved"
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          onClick={() => setExpanded((prev) => !prev)}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSignature className="h-5 w-5" />
              Signed Contracts
            </CardTitle>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground shrink-0 ml-2 transition-transform duration-200",
              expanded && "rotate-180"
            )}
          />
        </button>
      </CardHeader>

      {expanded && (
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          ) : signedOrApproved.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No signed contracts yet
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {signedOrApproved.map((req: any) => (
                <div key={req.id} className="rounded-lg border p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{req.contractTemplateName || "Contract"}</span>
                    {req.signedAt && (
                      <span className="text-xs text-muted-foreground">
                        Signed {format(parseISO(req.signedAt), "MMM d, yyyy")}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={cn(
                      req.status === "approved"
                        ? "bg-accent/20 text-accent border-accent/30"
                        : "bg-chart-1/20 text-chart-1 border-chart-1/30"
                    )}>
                      {req.status === "approved" ? "Approved" : "Signed"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => handleViewDocument(req.signedDocumentUrl)}
                    >
                      <ExternalLink data-icon="inline-start" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};