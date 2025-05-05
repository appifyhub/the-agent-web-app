import React from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SettingControlsProps {
  expiryTimestamp: number;
  onTokenExpired: () => void;
  onSaveClicked: () => void;
  saveLabel: string;
  disabled: boolean;
  className?: string;
  buttonClassName?: string;
}

const SettingControls: React.FC<SettingControlsProps> = ({
  expiryTimestamp,
  onTokenExpired,
  onSaveClicked,
  saveLabel,
  disabled,
  className = "",
  buttonClassName = "",
}) => (
  <div className={cn("flex justify-between items-center", className)}>
    <CountdownTimer
      expiryTimestamp={expiryTimestamp}
      onExpire={onTokenExpired}
    />
    <Button
      className={cn(
        "bg-primary hover:bg-purple-200 text-primary-foreground hover:text-zinc-900 px-6 py-6 text-[1.05rem] rounded-full cursor-pointer",
        disabled
          ? "text-muted-foreground bg-foreground/20 border border-foreground/20"
          : "",
        buttonClassName
      )}
      disabled={disabled}
      onClick={onSaveClicked}
    >
      {saveLabel}
    </Button>
  </div>
);

export default SettingControls;
