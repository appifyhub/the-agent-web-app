import React from "react";
import { AlertTriangle, X, Trash2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface WarningBannerProps {
  message: string;
  icon?: React.ReactNode;
  borderColor?: string;
  onDismiss?: () => void;
  destructiveLabel?: string;
  destructiveOnClick?: () => void;
  destructiveIcon?: React.ReactNode;
  primaryLabel?: string;
  primaryOnClick?: () => void;
  primaryIcon?: React.ReactNode;
  secondaryLabel?: string;
  secondaryOnClick?: () => void;
  secondaryIcon?: React.ReactNode;
}

const WarningBanner: React.FC<WarningBannerProps> = ({
  message,
  icon,
  borderColor = "border-red-300/40",
  onDismiss,
  destructiveLabel,
  destructiveOnClick,
  destructiveIcon,
  primaryLabel,
  primaryOnClick,
  primaryIcon,
  secondaryLabel,
  secondaryOnClick,
  secondaryIcon,
}) => {
  const defaultIcon = <AlertTriangle className="h-5 w-5 text-red-300/60 shrink-0" />;
  const buttons = [
    {
      type: "destructive" as const,
      label: destructiveLabel,
      onClick: destructiveOnClick,
      icon: destructiveIcon ?? <Trash2 className="h-3.5 w-3.5 mb-0.5" />,
      className: "glass-red text-red-200 hover:text-red-100",
    },
    {
      type: "primary" as const,
      label: primaryLabel,
      onClick: primaryOnClick,
      icon: primaryIcon ?? <Plus className="h-3.5 w-3.5 mb-0.5" />,
      className: "glass-muted text-foreground/90 hover:text-foreground",
    },
    {
      type: "secondary" as const,
      label: secondaryLabel,
      onClick: secondaryOnClick,
      icon: secondaryIcon ?? <Check className="h-3.5 w-3.5 mb-0.5" />,
      className: "glass-purple text-purple-200 hover:text-purple-100",
    },
  ].filter((btn) => btn.label && btn.onClick);

  return (
    <div
      className={cn(
        "w-full max-w-xl mx-auto mb-6 flex flex-col gap-4 border rounded-xl",
        borderColor,
      )}
    >
      <div className="h-0" />
      <div className="flex items-start gap-3">
        <div className="w-1" />
        {icon ?? defaultIcon}
        <p className="text-sm text-foreground/80 leading-relaxed flex-1">
          {message}
        </p>
        <div className="w-1" />
        <button
          onClick={onDismiss}
          className="glass rounded-full cursor-pointer h-7 w-7 flex items-center justify-center shrink-0"
          type="button"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        <div className="w-0" />
      </div>
      <div className="flex">
        {buttons.map((button, index) => (
          <button
            key={button.type}
            onClick={button.onClick}
            className={cn(
              "flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium border cursor-pointer flex-1",
              index === 0 && "rounded-bl-xl",
              index === buttons.length - 1 && "rounded-br-xl",
              button.className,
            )}
            type="button"
          >
            {button.icon}
            {button.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default WarningBanner;
