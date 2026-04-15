import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DocumentStatusBadge } from "@/components/DocumentStatusBadge";
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
import {
  Upload,
  FileText,
  Loader2,
  Eye,
  Download,
  RefreshCw,
  AlertCircle,
  Calendar as CalendarIcon,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useEntityDelete } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { StaffDocumentsEntity } from "@/product-types";
import type { StaffDocumentsEntityDocumentTypeEnum, IStaffDocumentsEntity } from "@/product-types";
import {
  type DocumentStatus,
  getDocumentStatus,
  getStatusBorderClass,
  isImageFile,
  DOCUMENT_TYPE_LABELS,
  getExpiryHintText,
} from "@/utils/documentUtils";
import { UploadDocumentDialog } from "@/components/UploadDocumentDialog";

interface RequiredDocumentCardProps {
  docType: StaffDocumentsEntityDocumentTypeEnum;
  cardStatus: DocumentStatus;
  docs: IStaffDocumentsEntity[];
  isBusy: boolean;
  uploadingType: string | null;
  replacingDocId: string | null;
  loadingPreviewId: string | null;
  loadingDownloadId: string | null;
  onNewUpload: (docType: StaffDocumentsEntityDocumentTypeEnum, file: File, expiryDate?: string) => void;
  onReplaceUpload: (docId: string, docType: StaffDocumentsEntityDocumentTypeEnum, file: File, expiryDate?: string) => void;
  onViewDocument: (doc: IStaffDocumentsEntity) => void;
  onDownloadDocument: (doc: IStaffDocumentsEntity) => void;
  onDeleteDocument?: () => void;
}

export const RequiredDocumentCard = ({
  docType,
  cardStatus,
  docs,
  isBusy,
  uploadingType,
  replacingDocId,
  loadingPreviewId,
  loadingDownloadId,
  onNewUpload,
  onReplaceUpload,
  onViewDocument,
  onDownloadDocument,
  onDeleteDocument,
}: RequiredDocumentCardProps) => {
  const { deleteFunction } = useEntityDelete(StaffDocumentsEntity);

  // Delete state
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [replaceDialogDocId, setReplaceDialogDocId] = useState<string | null>(null);

  const label = DOCUMENT_TYPE_LABELS[docType];
  const hintText = getExpiryHintText(docType);

  const handleConfirmDelete = async () => {
    if (!confirmDeleteDocId) return;
    setDeletingDocId(confirmDeleteDocId);
    setConfirmDeleteDocId(null);
    try {
      await deleteFunction({ id: confirmDeleteDocId });
      toast.success("Document deleted successfully");
      onDeleteDocument?.();
    } catch {
      toast.error("Failed to delete document");
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleNewUploadSubmit = (file: File, expiryDate?: string) => {
    onNewUpload(docType, file, expiryDate);
    setUploadDialogOpen(false);
  };

  const handleReplaceSubmit = (file: File, expiryDate?: string) => {
    if (!replaceDialogDocId) return;
    onReplaceUpload(replaceDialogDocId, docType, file, expiryDate);
    setReplaceDialogDocId(null);
  };

  return (
    <div className={cn("rounded-lg p-4 flex flex-col gap-3", getStatusBorderClass(cardStatus))}>
      {/* Header row */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{label}</h4>
        <DocumentStatusBadge status={cardStatus} />
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!confirmDeleteDocId} onOpenChange={(open) => { if (!open) setConfirmDeleteDocId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this document?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upload dialog for new uploads */}
      <UploadDocumentDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        title={docs.length > 0 ? "Upload New Version" : "Upload Document"}
        subtitle={label}
        hintText={hintText}
        isUploading={uploadingType === docType}
        onSubmit={handleNewUploadSubmit}
      />

      {/* Upload dialog for replacements */}
      <UploadDocumentDialog
        open={!!replaceDialogDocId}
        onOpenChange={(open) => { if (!open) setReplaceDialogDocId(null); }}
        title="Replace Document"
        subtitle={label}
        hintText={hintText}
        isUploading={!!replaceDialogDocId && replacingDocId === replaceDialogDocId}
        onSubmit={handleReplaceSubmit}
      />

      {/* Uploaded documents list */}
      {docs.length > 0 ? (
        <div className="flex flex-col gap-3">
          {docs.map((doc) => {
            const docStatus = getDocumentStatus(doc);
            const isReplacing = replacingDocId === doc.id;
            const showReplaceBtn =
              docStatus === "rejected" || docStatus === "expired";
            const isDeletingThis = deletingDocId === doc.id;

            return (
              <div key={doc.id} className="flex flex-col gap-2">
                {/* File row */}
                <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                  {/* Thumbnail / Icon */}
                  {isImageFile(doc.fileUrl, doc.fileName) ? (
                    <img
                      src={doc.fileUrl}
                      alt={doc.fileName || "Document"}
                      className="h-10 w-10 rounded object-cover border shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted border shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {doc.fileName || "Unnamed file"}
                    </p>
                    {docStatus === "approved" && doc.expiryDate && (
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Expires: {format(parseISO(doc.expiryDate), "MMM dd, yyyy")}
                      </p>
                    )}
                    {docStatus === "expired" && doc.expiryDate && (
                      <p className="text-xs text-chart-3 mt-0.5 flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        Expired: {format(parseISO(doc.expiryDate), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    {doc.fileUrl && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDocument(doc)}
                          className="h-8 w-8 p-0"
                          disabled={loadingPreviewId === doc.id}
                        >
                          {loadingPreviewId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadDocument(doc)}
                          className="h-8 w-8 p-0"
                          disabled={loadingDownloadId === doc.id}
                        >
                          {loadingDownloadId === doc.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteDocId(doc.id ?? "")}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isBusy || isDeletingThis}
                    >
                      {isDeletingThis ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Rejection reason */}
                {docStatus === "rejected" && doc.rejectionReason && (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">
                      {doc.rejectionReason}
                    </p>
                  </div>
                )}

                {/* Replace button for rejected/expired docs */}
                {showReplaceBtn && (
                  <Button
                    variant="outline"
                    onClick={() => setReplaceDialogDocId(doc.id ?? "")}
                    disabled={isBusy || isReplacing}
                    className="w-full h-11"
                  >
                    {isReplacing ? (
                      <>
                        <Loader2 data-icon="inline-start" className="animate-spin" />
                        Replacing...
                      </>
                    ) : (
                      <>
                        <RefreshCw data-icon="inline-start" />
                        Choose Replacement File
                      </>
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty state for missing */
        <div className="flex items-center justify-center rounded-lg border border-dashed bg-background p-4">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-6 w-6" />
            <p className="text-sm">No document uploaded yet</p>
          </div>
        </div>
      )}

      {/* Upload button */}
      <Button
        onClick={() => setUploadDialogOpen(true)}
        disabled={isBusy || uploadingType === docType}
        variant={cardStatus === "missing" ? "default" : "outline"}
        className="w-full h-12 text-base"
      >
        {uploadingType === docType ? (
          <>
            <Loader2 data-icon="inline-start" className="animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload data-icon="inline-start" />
            {docs.length > 0 ? "Upload New Version" : "Upload Document"}
          </>
        )}
      </Button>
    </div>
  );
};