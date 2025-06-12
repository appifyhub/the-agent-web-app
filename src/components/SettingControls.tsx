import React from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";

interface SettingControlsProps {
  expiryTimestamp: number;
  onTokenExpired: () => void;
  onActionClicked: () => void;
  actionDisabled: boolean;
  showActionButton?: boolean;
  actionButtonText?: string;
  showCancelButton?: boolean;
  onCancelClicked?: () => void;
  cancelDisabled?: boolean;
}

const SettingControls: React.FC<SettingControlsProps> = ({
  expiryTimestamp,
  onTokenExpired,
  onActionClicked,
  actionDisabled,
  showActionButton = true,
  actionButtonText = t("save"),
  showCancelButton = false,
  onCancelClicked = () => {},
  cancelDisabled = false,
}) => (
  <div className="flex justify-between items-center gap-2">
    <CountdownTimer
      expiryTimestamp={expiryTimestamp}
      onExpire={onTokenExpired}
    />
    <div className="flex items-center space-x-2">
      {showActionButton && (
        <Button
          className={cn(
            "bg-primary hover:bg-purple-200 text-primary-foreground hover:text-zinc-900 px-6 py-3 text-[1.05rem] rounded-full cursor-pointer h-10",
            actionDisabled
              ? "text-muted-foreground bg-foreground/20 border border-foreground/20"
              : ""
          )}
          disabled={actionDisabled}
          onClick={onActionClicked}
        >
          {actionButtonText}
        </Button>
      )}
      {showCancelButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={cancelDisabled ? "default" : "outline"}
              size="icon"
              className={cn(
                cancelDisabled
                  ? "text-muted-foreground bg-foreground/20 border border-foreground/20 h-10 w-10 rounded-full cursor-pointer"
                  : "glass rounded-full cursor-pointer h-10 w-10"
              )}
              disabled={cancelDisabled}
              onClick={onCancelClicked}
            >
              <CloseIcon className="h-6 w-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t("close")}</TooltipContent>
        </Tooltip>
      )}
    </div>
  </div>
);

export default SettingControls;
