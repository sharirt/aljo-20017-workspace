import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ChevronDown, Lightbulb } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WalkthroughSectionProps {
  title: string;
  icon: LucideIcon;
  steps: string[];
  tip: string;
  accentClass: string;
  badgeClass: string;
}

export const WalkthroughSection = ({
  title,
  icon: Icon,
  steps,
  tip,
  accentClass,
  badgeClass,
}: WalkthroughSectionProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full min-h-[44px] items-center gap-3 p-4 text-left hover:bg-muted/50 transition-colors"
      >
        <div className={cn("shrink-0", accentClass)}>
          <Icon className="size-5" />
        </div>
        <span className="flex-1 text-base font-semibold text-foreground">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <CardContent className="border-t px-4 pb-4 pt-3">
          <div className="flex flex-col gap-0">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-3 border-b border-border/50 py-3 last:border-b-0",
                  i % 2 === 1 && "bg-muted/30 -mx-4 px-4"
                )}
              >
                <div
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold mt-0.5",
                    badgeClass
                  )}
                >
                  {i + 1}
                </div>
                <p className="text-sm leading-relaxed text-foreground md:text-base">
                  {step}
                </p>
              </div>
            ))}
          </div>

          {/* Tip box */}
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-chart-3/30 bg-chart-3/10 p-3">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-chart-3" />
            <p className="text-sm text-foreground">
              <span className="font-bold">💡 Tip: </span>
              {tip}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};