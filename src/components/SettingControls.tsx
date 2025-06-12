import React from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";

interface SettingControlsProps {
  expiryTimestamp: number;
  onTokenExpired: () => void;
  onActionClicked: () => void;
  disabled: boolean;
  showActionButton?: boolean;
  actionButtonText?: string;
}

const SettingControls: React.FC<SettingControlsProps> = ({
  expiryTimestamp,
  onTokenExpired,
  onActionClicked,
  disabled,
  showActionButton = true,
  actionButtonText = t("save"),
}) => (
  <div className="flex justify-between items-center">
    <CountdownTimer
      expiryTimestamp={expiryTimestamp}
      onExpire={onTokenExpired}
    />
    {showActionButton && (
      <Button
        className={cn(
          "bg-primary hover:bg-purple-200 text-primary-foreground hover:text-zinc-900 px-6 py-3 text-[1.05rem] rounded-full cursor-pointer h-10",
          disabled
            ? "text-muted-foreground bg-foreground/20 border border-foreground/20"
            : ""
        )}
        disabled={disabled}
        onClick={onActionClicked}
      >
        {actionButtonText}
      </Button>
    )}
  </div>
);

export default SettingControls;
