import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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

  return (
    <div className={cn("space-y-4", className)}>
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
      <Input
        id={id}
        className={cn(
          "py-6 px-6 w-full sm:w-sm text-[1.05rem] glass rounded-xl",
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
