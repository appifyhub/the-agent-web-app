import React from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SettingSelectorOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SettingSelectorProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: SettingSelectorOption[];
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

const SettingSelector: React.FC<SettingSelectorProps> = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder = "Select...",
  className = "",
  labelClassName = "",
  triggerClassName = "",
  contentClassName = "",
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <Label
        className={cn(
          "text-[1.05rem] font-light",
          disabled ? "text-muted-foreground/50" : "",
          labelClassName
        )}
      >
        {label}
      </Label>
      <Select value={value} disabled={disabled} onValueChange={onChange}>
        <SelectTrigger
          className={cn(
            "py-6 px-6 w-full sm:w-xs text-[1.05rem] overflow-hidden rounded-full cursor-pointer",
            disabled ? "text-muted-foreground/80 glass-static" : "glass",
            triggerClassName
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          className={cn("p-4 glass-dark-static rounded-2xl", contentClassName)}
        >
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled || opt.value === value}
              className={cn(
                "py-4 px-4 cursor-pointer",
                opt.value === value ? "bg-accent/70" : ""
              )}
            >
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default SettingSelector;
