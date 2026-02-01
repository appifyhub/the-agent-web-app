import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";

interface SettingInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  type?: React.HTMLInputTypeAttribute;
  autoComplete?: string;
  spellCheck?: boolean;
  onKeyboardConfirm?: () => void;
}

const SettingInput: React.FC<SettingInputProps> = ({
  id,
  label,
  value,
  onChange,
  onClear,
  disabled = false,
  placeholder,
  className,
  labelClassName,
  inputClassName,
  type = "text",
  autoComplete = "off",
  spellCheck = false,
  onKeyboardConfirm = () => {},
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !disabled) {
      onKeyboardConfirm();
    }
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange("");
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between w-full sm:w-md">
        <Label
          htmlFor={id}
          className={cn(
            "ps-2 text-[1.05rem] font-light",
            disabled ? "text-muted-foreground/50" : "",
            labelClassName
          )}
        >
          {label}
        </Label>
        {onClear !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="glass rounded-full cursor-pointer h-8 w-8 p-1.5 shrink-0"
                onClick={handleClear}
                disabled={disabled || !value}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("connections.clear_key")}</TooltipContent>
          </Tooltip>
        )}
      </div>
      <Input
        id={id}
        className={cn(
          "py-6 px-6 w-full sm:w-md text-[1.05rem] glass rounded-2xl",
          disabled ? "cursor-not-allowed" : "",
          inputClassName
        )}
        type={type}
        autoComplete={autoComplete}
        spellCheck={spellCheck}
        aria-autocomplete="none"
        placeholder={disabled ? "—" : placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
};

export default SettingInput;
