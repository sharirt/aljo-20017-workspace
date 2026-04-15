import { useState, useEffect } from "react";
import {
  useFileUpload,
  useExecuteAction,
  useEntityUpdate,
  useUser,
} from "@blocksdiy/blocks-client-sdk/reactSdk";
import {
  UploadContractTemplateActionAction,
  GetSignedFileUrlAction,
  ContractTemplatesEntity,
} from "@/product-types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { FieldPlacementEditor, type FieldPlacement } from "@/components/FieldPlacementEditor";

interface UploadTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  /** If provided, we're editing fields on an existing template */
  editTemplate?: {
    id: string;
    name: string;
    fileUrl: string;
    roleName: string;
    fields: FieldPlacement[];
  };
}

export const UploadTemplateDialog = ({
  open,
  onOpenChange,
  onSuccess,
  editTemplate,
}: UploadTemplateDialogProps) => {
  const user = useUser();
  const isEditMode = !!editTemplate;

  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(isEditMode ? 2 : 1);

  // Step 1 state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roleName, setRoleName] = useState("Staff");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Step 2 state
  const [fields, setFields] = useState<FieldPlacement[]>(editTemplate?.fields || []);
  const [pdfSignedUrl, setPdfSignedUrl] = useState<string>("");
  const [templateRecordId, setTemplateRecordId] = useState<string>(editTemplate?.id || "");

  // Step 3 state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const { uploadFunction } = useFileUpload();
  const { executeFunction: uploadTemplate } = useExecuteAction(UploadContractTemplateActionAction);
  const { executeFunction: getSignedUrl } = useExecuteAction(GetSignedFileUrlAction);
  const { updateFunction: updateTemplate } = useEntityUpdate(ContractTemplatesEntity);

  // Reset when dialog closes
  const handleOpenChange = (val: boolean) => {
    if (!val) {
      setStep(isEditMode ? 2 : 1);
      setName("");
      setDescription("");
      setRoleName("Staff");
      setFile(null);
      setUploading(false);
      setFields(editTemplate?.fields || []);
      setPdfSignedUrl("");
      setTemplateRecordId(editTemplate?.id || "");
      setSaving(false);
      setSaved(false);
    }
    onOpenChange(val);
  };

  // Load PDF signed URL for edit mode
  const loadPdfUrl = async (fileUrl: string) => {
    try {
      const result = await getSignedUrl({ fileUrl });
      if (result?.signedUrl) {
        setPdfSignedUrl(result.signedUrl);
      }
    } catch {
      toast.error("Failed to load PDF preview");
    }
  };

  // Initialize edit mode - load PDF URL
  useEffect(() => {
    if (isEditMode && open && editTemplate?.fileUrl && !pdfSignedUrl) {
      loadPdfUrl(editTemplate.fileUrl);
    }
  }, [isEditMode, open, editTemplate?.fileUrl]);

  // Reset step when dialog opens with different mode
  useEffect(() => {
    if (open && isEditMode) {
      setStep(2);
    } else if (open && !isEditMode) {
      setStep(1);
    }
  }, [open, isEditMode]);

  const handleStep1Submit = async () => {
    if (!file || !name.trim()) {
      toast.error("Please provide a name and select a PDF file");
      return;
    }
    setUploading(true);
    try {
      const fileUrl = await uploadFunction(file);
      const result = await uploadTemplate({
        name: name.trim(),
        description: description.trim(),
        fileUrl,
        roleName: roleName.trim() || "Staff",
        fields: [],
        uploadedByEmail: user.email || "",
      });
      const created = result?.items?.[0];
      if (created?.id) {
        setTemplateRecordId(created.id);
        // Get signed URL for the PDF
        const signedResult = await getSignedUrl({ fileUrl });
        if (signedResult?.signedUrl) {
          setPdfSignedUrl(signedResult.signedUrl);
        }
        setStep(2);
      } else {
        toast.error("Failed to create template");
      }
    } catch {
      toast.error("Failed to upload template");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveFields = async () => {
    if (!templateRecordId) return;
    setSaving(true);
    try {
      await updateTemplate({
        id: templateRecordId,
        data: {
          fields: {
            items: fields.map((f) => ({
              id: f.id,
              x: f.x,
              y: f.y,
              w: f.w,
              h: f.h,
              page: f.page,
              type: f.type,
              role: f.role,
            })),
          },
        },
      });
      setSaved(true);
      setStep(3);
      toast.success("Template fields saved");
    } catch {
      toast.error("Failed to save fields");
    } finally {
      setSaving(false);
    }
  };

  const handleDone = () => {
    handleOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode
              ? `Edit Fields — ${editTemplate?.name}`
              : step === 1
              ? "Upload New Template — Step 1: Upload PDF"
              : step === 2
              ? `${isEditMode ? "Edit" : "Step 2:"} Place Fields`
              : "Step 3: Save Complete"}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Upload PDF */}
        {step === 1 && !isEditMode && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g. Staff Employment Agreement 2026"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="template-desc">Description</Label>
              <Textarea
                id="template-desc"
                placeholder="Brief description of this contract..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="role-name">Signing Role Name</Label>
              <Input
                id="role-name"
                placeholder="Staff"
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pdf-file">PDF File</Label>
              <Input
                id="pdf-file"
                type="file"
                accept=".pdf"
                className="h-11"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>
            <Button
              className="h-11"
              onClick={handleStep1Submit}
              disabled={uploading || !file || !name.trim()}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload data-icon="inline-start" />
                  Upload & Continue
                </>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Place fields */}
        {step === 2 && pdfSignedUrl && (
          <div className="flex flex-col gap-4">
            <FieldPlacementEditor
              pdfUrl={pdfSignedUrl}
              fields={fields}
              onFieldsChange={setFields}
              roleName={isEditMode ? editTemplate?.roleName || "Staff" : roleName}
            />
            <Button
              className="h-11"
              onClick={handleSaveFields}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Loader2 className="animate-spin" data-icon="inline-start" />
                  Saving...
                </>
              ) : (
                "Save Template"
              )}
            </Button>
          </div>
        )}

        {step === 2 && !pdfSignedUrl && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-full bg-accent/10 p-4">
              <CheckCircle className="h-12 w-12 text-accent" />
            </div>
            <p className="text-lg font-semibold">Template Saved Successfully</p>
            <p className="text-sm text-muted-foreground text-center">
              The contract template has been saved with {fields.length} field(s).
            </p>
            <Button className="h-11" onClick={handleDone}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};