import { useState } from "react";
import {
  useEntityGetAll,
  useEntityUpdate,
  useEntityDelete,
  useExecuteAction,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import { ContractTemplatesEntity, PublishContractToDocuSealAction } from "@/product-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FileSignature, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Loader2, CloudUpload, CheckCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { UploadTemplateDialog } from "@/components/UploadTemplateDialog";
import type { FieldPlacement } from "@/components/FieldPlacementEditor";

export default function AdminContractTemplatesPage() {
  const user = useUser();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editTemplate, setEditTemplate] = useState<any>(null);
  const [toggleConfirm, setToggleConfirm] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const { data: templates, isLoading } = useEntityGetAll(ContractTemplatesEntity);
  const { updateFunction } = useEntityUpdate(ContractTemplatesEntity);
  const { deleteFunction } = useEntityDelete(ContractTemplatesEntity);
  const { executeFunction: publishToDocuSeal } = useExecuteAction(PublishContractToDocuSealAction);

  const handlePublish = async (template: any) => {
    setPublishingId(template.id);
    try {
      await publishToDocuSeal({ contractTemplateId: template.id });
      toast.success("Template published to DocuSeal successfully");
    } catch {
      toast.error("Failed to publish template to DocuSeal");
    } finally {
      setPublishingId(null);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleConfirm) return;
    setActionLoading(true);
    try {
      await updateFunction({
        id: toggleConfirm.id,
        data: { isActive: !toggleConfirm.isActive },
      });
      toast.success(
        toggleConfirm.isActive ? "Template deactivated" : "Template activated"
      );
      setToggleConfirm(null);
    } catch {
      toast.error("Failed to update template");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setActionLoading(true);
    try {
      await deleteFunction({ id: deleteConfirm.id });
      toast.success("Template deleted");
      setDeleteConfirm(null);
    } catch {
      toast.error("Failed to delete template");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditFields = (template: any) => {
    const existingFields: FieldPlacement[] =
      template.fields?.items?.map((f: any) => ({
        id: f.id || `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        x: f.x || 0,
        y: f.y || 0,
        w: f.w || 0.1,
        h: f.h || 0.05,
        page: f.page || 1,
        type: f.type || "text",
        role: f.role || template.roleName || "Staff",
      })) || [];

    setEditTemplate({
      id: template.id,
      name: template.name || "Template",
      fileUrl: template.fileUrl || "",
      roleName: template.roleName || "Staff",
      fields: existingFields,
    });
  };

  const allTemplates = (templates as any[]) || [];

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Contract Templates</h1>
          <p className="text-sm text-muted-foreground">
            Manage e-signature contract templates for staff onboarding
          </p>
        </div>
        <Button className="h-11" onClick={() => setUploadOpen(true)}>
          <Plus data-icon="inline-start" />
          Upload New Template
        </Button>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      ) : allTemplates.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed p-12 flex flex-col items-center gap-3 text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground" />
          <p className="text-lg font-medium text-muted-foreground">
            No contract templates yet
          </p>
          <p className="text-sm text-muted-foreground">
            Upload your first PDF contract template to get started
          </p>
          <Button className="h-11 mt-2" onClick={() => setUploadOpen(true)}>
            <Plus data-icon="inline-start" />
            Upload Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template: any) => {
            const fieldCount = template.fields?.items?.length || 0;
            return (
              <Card key={template.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base leading-tight flex items-center gap-2">
                      {template.name || "Untitled"}
                      {template.docusealTemplateId && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent">
                          <CheckCircle className="size-3" />
                          Published
                        </span>
                      )}
                    </CardTitle>
                    <Badge
                      className={
                        template.isActive
                          ? "bg-accent/20 text-accent border-accent/30"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {template.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  {template.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{fieldCount} field{fieldCount !== 1 ? "s" : ""}</span>
                    {template.createdAt && (
                      <>
                        <span>&middot;</span>
                        <span>
                          Uploaded {format(parseISO(template.createdAt), "MMM d, yyyy")}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => handleEditFields(template)}
                    >
                      <Pencil data-icon="inline-start" />
                      Edit Fields
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      onClick={() => setToggleConfirm(template)}
                    >
                      {template.isActive ? (
                        <ToggleRight data-icon="inline-start" />
                      ) : (
                        <ToggleLeft data-icon="inline-start" />
                      )}
                      {template.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9"
                      disabled={publishingId === template.id}
                      onClick={() => handlePublish(template)}
                    >
                      {publishingId === template.id ? (
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                      ) : (
                        <CloudUpload data-icon="inline-start" />
                      )}
                      {template.docusealTemplateId ? "Re-publish" : "Publish to DocuSeal"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-9 text-destructive hover:text-destructive"
                      onClick={() => setDeleteConfirm(template)}
                    >
                      <Trash2 data-icon="inline-start" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload / New Template Dialog */}
      <UploadTemplateDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSuccess={() => {}}
      />

      {/* Edit Fields Dialog */}
      {editTemplate && (
        <UploadTemplateDialog
          open={!!editTemplate}
          onOpenChange={(val) => { if (!val) setEditTemplate(null); }}
          onSuccess={() => setEditTemplate(null)}
          editTemplate={editTemplate}
        />
      )}

      {/* Toggle Active Confirmation */}
      <AlertDialog
        open={!!toggleConfirm}
        onOpenChange={(val) => { if (!val) setToggleConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleConfirm?.isActive ? "Deactivate" : "Activate"} Template
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleConfirm?.isActive
                ? "This template will no longer be sent to new staff during onboarding."
                : "This template will be sent to new staff during onboarding."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleActive} disabled={actionLoading}>
              {actionLoading ? "Updating..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteConfirm}
        onOpenChange={(val) => { if (!val) setDeleteConfirm(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{deleteConfirm?.name}&rdquo;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}