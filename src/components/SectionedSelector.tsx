import React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import ProviderIcon from "@/components/ProviderIcon";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { CostEstimate } from "@/services/external-tools-service";
import CostEstimateDialog from "@/components/CostEstimateDialog";
import { CircleHelp } from "lucide-react";

export interface SectionedSelectorSection {
  sectionTitle: string;
  providerId?: string; // for navigation
  isConfigured: boolean;
  options: SectionedSelectorOption[];
}

export interface SectionedSelectorOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
  isConfigured?: boolean;
  providerId?: string; // for provider logos
  costEstimate?: CostEstimate;
  toolName?: string;
}

interface SectionedSelectorProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  sections: SectionedSelectorSection[];
  disabled?: boolean;
  placeholder?: string;
  notConfiguredLabel?: string;
  onProviderNavigate?: (providerId: string) => void;
  hasCredits?: boolean;
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  hideCostEstimateButton?: boolean;
}

const SectionedSelector: React.FC<SectionedSelectorProps> = ({
  label,
  value,
  onChange,
  sections,
  disabled = false,
  placeholder = "Select...",
  notConfiguredLabel = "– Not Configured",
  onProviderNavigate,
  hasCredits = false,
  className = "",
  labelClassName = "",
  triggerClassName = "",
  contentClassName = "",
  hideCostEstimateButton = false,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [costEstimateTarget, setCostEstimateTarget] = React.useState<{
    toolName: string;
    estimate: CostEstimate;
    providerId?: string;
    providerName?: string;
  } | null>(null);

  // Find if the current value exists in any section
  const validOption = sections
    .flatMap((section) => section.options)
    .find((opt) => opt.value === value);
  const selectValue = validOption ? value : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <Label
        className={cn(
          "text-[1.05rem] font-light",
          disabled ? "text-muted-foreground/50" : "",
          labelClassName
        )}
      >
        {label}
      </Label>
      <Select
        value={selectValue}
        disabled={disabled}
        onValueChange={onChange}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger
          className={cn(
            "py-6 px-6 w-full sm:w-md text-[1.05rem] overflow-hidden rounded-2xl cursor-pointer",
            disabled ? "text-muted-foreground/80 glass-static" : "glass",
            triggerClassName
          )}
        >
          <div className="flex items-center justify-between w-full min-w-0 pr-2">
            <SelectValue placeholder={placeholder} />
            {!hideCostEstimateButton && validOption?.costEstimate && validOption.toolName && (
              <div
                className="flex items-center gap-2 z-50 pointer-events-auto ml-2 shrink-0 cursor-pointer"
                onPointerDown={(e) => e.stopPropagation()}
                onPointerUp={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const validOptionSection = sections.find((s) =>
                    s.options.some((o) => o.value === value)
                  );
                  setCostEstimateTarget({
                    toolName: validOption.toolName!,
                    estimate: validOption.costEstimate!,
                    providerId: validOption.providerId,
                    providerName: validOptionSection?.sectionTitle,
                  });
                }}
              >
                <CircleHelp className="size-5 text-blue-300 hover:text-blue-400 transition-colors" />
              </div>
            )}
          </div>
        </SelectTrigger>
        <SelectContent
          className={cn(
            "p-4 glass-dark-static rounded-2xl text-foreground",
            contentClassName
          )}
        >
          {sections.map((section) => (
            <div key={section.sectionTitle}>
              {/* Section Header */}
              <div className="py-2 px-4 text-sm font-medium text-muted-foreground/90 flex items-center justify-between pointer-events-auto">
                <span>{section.sectionTitle}</span>
                {!section.isConfigured && !hasCredits && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (section.providerId) {
                        if (onProviderNavigate) {
                          onProviderNavigate(section.providerId);
                          // Close the select dropdown
                          setIsOpen(false);
                          // Scroll to top to show the carousel
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        } else {
                          console.warn(
                            "Provider navigation not available yet for:",
                            section.providerId
                          );
                        }
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    disabled={!section.providerId}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full border transition-colors font-medium pointer-events-auto",
                      !section.providerId
                        ? "text-muted-foreground/60 border-muted-foreground/20 cursor-not-allowed"
                        : "text-accent-amber border-accent-amber/30 bg-accent-amber/5 hover:bg-accent-amber/15 hover:border-accent-amber/50 cursor-pointer active:scale-95 transition-transform"
                    )}
                  >
                    {notConfiguredLabel}
                  </button>
                )}
              </div>

              {/* Section Options */}
              {section.options.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={
                    opt.disabled ||
                    !section.isConfigured ||
                    (!opt.isConfigured && !opt.costEstimate) ||
                    (opt.value === value && false)
                  }
                  className={cn(
                    "py-4 px-8 pr-12! cursor-pointer text-foreground", // Remove nested span width overrides as structure changed
                    opt.value === value ? "bg-accent/70" : "",
                    (!section.isConfigured || !opt.isConfigured) ? "text-muted-foreground/50" : ""
                  )}
                  addon={
                    <>
                      {opt.costEstimate && opt.toolName && (
                        <div
                          className={cn(
                            "flex items-center gap-2 z-50 pointer-events-auto ml-auto shrink-0 mr-4",
                            "cursor-pointer"
                          )}
                          onPointerDown={(e) => e.stopPropagation()}
                          onPointerUp={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsOpen(false);
                            setCostEstimateTarget({
                              toolName: opt.toolName!,
                              estimate: opt.costEstimate!,
                              providerId: opt.providerId,
                              providerName: section.sectionTitle,
                            });
                          }}
                        >
                          <CircleHelp className="size-5 text-blue-300 hover:text-blue-400 transition-colors" />
                        </div>
                      )}

                      {section.isConfigured && !opt.isConfigured && (
                        <div className="flex items-center gap-2 ml-auto pl-2">
                          <span className="text-xs text-muted-foreground/60 ml-2">
                            {notConfiguredLabel}
                          </span>
                        </div>
                      )}
                    </>
                  }
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {opt.providerId && (
                      <ProviderIcon
                        providerId={opt.providerId}
                        className="w-4 h-4 opacity-70 shrink-0"
                        alt="Provider logo"
                      />
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
      {costEstimateTarget && (
        <CostEstimateDialog
          toolName={costEstimateTarget.toolName}
          costEstimate={costEstimateTarget.estimate}
          providerId={costEstimateTarget.providerId}
          providerName={costEstimateTarget.providerName}
          open={!!costEstimateTarget}
          onOpenChange={(open) => {
            if (!open) setCostEstimateTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default SectionedSelector;
