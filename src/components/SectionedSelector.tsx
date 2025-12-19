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
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
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
  className = "",
  labelClassName = "",
  triggerClassName = "",
  contentClassName = "",
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

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
          <SelectValue placeholder={placeholder} />
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
                {!section.isConfigured && (
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
                    !opt.isConfigured ||
                    opt.value === value
                  }
                  className={cn(
                    "py-4 px-8 pr-16! cursor-pointer text-foreground [&>span:first-child]:right-4!", // Extra left padding for indentation, override right padding and checkbox position
                    opt.value === value ? "bg-accent/70" : "",
                    !section.isConfigured || !opt.isConfigured
                      ? "text-muted-foreground/50"
                      : ""
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {opt.providerId && (
                        <ProviderIcon
                          providerId={opt.providerId}
                          className="w-4 h-4 opacity-70"
                          alt="Provider logo"
                        />
                      )}
                      <span>{opt.label}</span>
                    </div>
                    {section.isConfigured && !opt.isConfigured && (
                      <span className="text-xs text-muted-foreground/60 ml-2">
                        {notConfiguredLabel}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SectionedSelector;
