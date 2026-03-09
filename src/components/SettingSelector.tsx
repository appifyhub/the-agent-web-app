import React from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export interface SettingSelectorOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface SettingSelectorProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  onUndo?: () => void;
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
  onUndo,
  options,
  disabled = false,
  placeholder = t("select_placeholder"),
  className = "",
  labelClassName = "",
  triggerClassName = "",
  contentClassName = "",
}) => {
  const validOption = options.find((opt) => opt.value === value);
  const selectValue = validOption ? value : undefined;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between w-full sm:w-md">
        <Label
          className={cn(
            "text-[1.05rem] font-light",
            disabled ? "text-muted-foreground/50" : "",
            labelClassName
          )}
        >
          {label}
        </Label>
        {onUndo !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="glass rounded-full cursor-pointer h-8 w-8 p-1.5 shrink-0"
                onClick={onUndo}
                disabled={disabled || !selectValue}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("restore")}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Select value={selectValue} disabled={disabled} onValueChange={onChange}>
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
          {options.map((opt) => (
            <SelectItem
              key={opt.value}
              value={opt.value}
              disabled={opt.disabled || opt.value === value}
              className={cn(
                "py-4 px-4 cursor-pointer text-foreground",
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
