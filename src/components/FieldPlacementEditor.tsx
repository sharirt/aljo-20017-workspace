import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FieldPlacement {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  page: number;
  type: string;
  role: string;
}

const FIELD_TYPES = ["signature", "date", "text", "initials", "checkbox"] as const;

const FIELD_TYPE_COLORS: Record<string, string> = {
  signature: "bg-primary/30 border-primary",
  date: "bg-chart-3/30 border-chart-3",
  text: "bg-chart-2/30 border-chart-2",
  initials: "bg-chart-4/30 border-chart-4",
  checkbox: "bg-chart-5/30 border-chart-5",
};

const FIELD_TYPE_BADGE_COLORS: Record<string, string> = {
  signature: "bg-primary/20 text-primary",
  date: "bg-chart-3/20 text-chart-3",
  text: "bg-chart-2/20 text-chart-2",
  initials: "bg-chart-4/20 text-chart-4",
  checkbox: "bg-chart-5/20 text-chart-5",
};

interface FieldPlacementEditorProps {
  pdfUrl: string;
  fields: FieldPlacement[];
  onFieldsChange: (fields: FieldPlacement[]) => void;
  roleName: string;
}

export const FieldPlacementEditor = ({
  pdfUrl,
  fields,
  onFieldsChange,
  roleName,
}: FieldPlacementEditorProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<string>("signature");
  const [currentPage] = useState(1);

  const generateId = () =>
    `field_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDrawing({ startX: x, startY: y, currentX: x, currentY: y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!drawing || !overlayRef.current) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDrawing({ ...drawing, currentX: x, currentY: y });
  };

  const handleMouseUp = () => {
    if (!drawing) return;
    const x = Math.min(drawing.startX, drawing.currentX);
    const y = Math.min(drawing.startY, drawing.currentY);
    const w = Math.abs(drawing.currentX - drawing.startX);
    const h = Math.abs(drawing.currentY - drawing.startY);

    if (w > 0.02 && h > 0.01) {
      const newField: FieldPlacement = {
        id: generateId(),
        x,
        y,
        w,
        h,
        page: currentPage,
        type: selectedType,
        role: roleName,
      };
      onFieldsChange([...fields, newField]);
    }
    setDrawing(null);
  };

  const handleDeleteField = (id: string) => {
    onFieldsChange(fields.filter((f) => f.id !== id));
  };

  const drawingBox = drawing
    ? {
        left: `${Math.min(drawing.startX, drawing.currentX) * 100}%`,
        top: `${Math.min(drawing.startY, drawing.currentY) * 100}%`,
        width: `${Math.abs(drawing.currentX - drawing.startX) * 100}%`,
        height: `${Math.abs(drawing.currentY - drawing.startY) * 100}%`,
      }
    : null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      {/* PDF viewer with overlay */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium">Field type:</span>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground ml-2">
            Click and drag on PDF to place fields
          </span>
        </div>

        <div className="relative border rounded-lg overflow-hidden">
          <iframe
            src={pdfUrl}
            title="PDF Template"
            className="w-full pointer-events-none"
            style={{ height: "60vh", minHeight: "400px" }}
          />
          {/* Transparent overlay for drawing */}
          <div
            ref={overlayRef}
            className="absolute inset-0 cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => drawing && handleMouseUp()}
          >
            {/* Placed fields */}
            {fields
              .filter((f) => f.page === currentPage)
              .map((field) => (
                <div
                  key={field.id}
                  className={cn(
                    "absolute border-2 rounded-sm flex items-center justify-between px-1",
                    FIELD_TYPE_COLORS[field.type] || "bg-primary/30 border-primary"
                  )}
                  style={{
                    left: `${field.x * 100}%`,
                    top: `${field.y * 100}%`,
                    width: `${field.w * 100}%`,
                    height: `${field.h * 100}%`,
                  }}
                >
                  <span className="text-[10px] font-medium truncate text-foreground">
                    {field.type}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteField(field.id);
                    }}
                    className="shrink-0 rounded-full bg-destructive/80 p-0.5 text-destructive-foreground hover:bg-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

            {/* Drawing box */}
            {drawingBox && (
              <div
                className={cn(
                  "absolute border-2 border-dashed rounded-sm",
                  FIELD_TYPE_COLORS[selectedType] || "bg-primary/30 border-primary"
                )}
                style={drawingBox}
              />
            )}
          </div>
        </div>
      </div>

      {/* Fields sidebar */}
      <div className="w-full lg:w-56 shrink-0">
        <div className="text-sm font-medium mb-2">
          Placed Fields ({fields.length})
        </div>
        <ScrollArea className="h-64 lg:h-[60vh] rounded-lg border">
          <div className="p-2 flex flex-col gap-1.5">
            {fields.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                No fields placed yet. Draw on the PDF to add fields.
              </p>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <Badge
                      className={cn(
                        "text-[10px] w-fit",
                        FIELD_TYPE_BADGE_COLORS[field.type] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {field.type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      Page {field.page}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0"
                    onClick={() => handleDeleteField(field.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};