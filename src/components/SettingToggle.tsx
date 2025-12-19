import React from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface SettingToggleProps {
  id: string;
  label: string;
  helperText?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  switchClassName?: string;
  onProfileLinkClick?: () => void;
  profileLinkText?: string; // Should be provided when onProfileLinkClick is set
}

const SettingToggle: React.FC<SettingToggleProps> = ({
  id,
  label,
  helperText,
  checked,
  onChange,
  disabled = false,
  className,
  labelClassName,
  switchClassName,
  onProfileLinkClick,
  profileLinkText,
}) => {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <div className="flex items-center gap-4">
          <Switch
            id={id}
            checked={checked}
            onCheckedChange={onChange}
            disabled={disabled}
            className={cn(
              "shrink-0",
              "data-[state=checked]:bg-accent-amber",
              "data-[state=checked]:shadow-[0_0_4px_rgba(147,197,253,0.3)]",
              "data-[state=unchecked]:bg-foreground/20",
              switchClassName
            )}
          />
          <Label
            htmlFor={id}
            className={cn(
              "text-[1.05rem] font-light cursor-pointer flex-1",
              disabled ? "text-muted-foreground/50 cursor-not-allowed" : "",
              labelClassName
            )}
          >
            {label}
          </Label>
        </div>
        {helperText && (
          <p
            className={cn(
              "text-sm font-light opacity-80",
              disabled ? "text-muted-foreground/50" : "text-muted-foreground"
            )}
          >
            {helperText}
            {onProfileLinkClick && (
              <>
                {" "}
                <button
                  onClick={onProfileLinkClick}
                  disabled={disabled}
                  className={cn(
                    "inline-flex items-center space-x-1 underline underline-offset-3 decoration-accent-amber/60 text-accent-amber/60 hover:text-accent-amber cursor-pointer",
                    disabled && "cursor-not-allowed opacity-50"
                  )}
                >
                  {profileLinkText}
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  );
};

export default SettingToggle;
