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

interface SettingActionBarProps {
  expiryTimestamp: number;
  onTokenExpired: () => void;
  onActionClicked: () => void;
  actionDisabled: boolean;
  showActionButton?: boolean;
  actionIcon?: React.ReactNode;
  actionButtonText?: string;
  showSecondaryButton?: boolean;
  onSecondaryClicked?: () => void;
  secondaryDisabled?: boolean;
  secondaryIcon?: React.ReactNode;
  secondaryText?: string;
  secondaryTooltipText?: string;
  secondaryClassName?: string;
  showCancelButton?: boolean;
  onCancelClicked?: () => void;
  cancelDisabled?: boolean;
  cancelIcon?: React.ReactNode;
  cancelTooltipText?: string;
}

const SettingActionBar: React.FC<SettingActionBarProps> = ({
  expiryTimestamp,
  onTokenExpired,
  onActionClicked,
  actionDisabled,
  showActionButton = true,
  actionIcon,
  actionButtonText = t("save"),
  showSecondaryButton = false,
  onSecondaryClicked = () => {},
  secondaryDisabled = false,
  secondaryIcon,
  secondaryText,
  secondaryTooltipText,
  secondaryClassName = "",
  showCancelButton = false,
  onCancelClicked = () => {},
  cancelDisabled = false,
  cancelIcon,
  cancelTooltipText = t("close"),
}) => (
  <div className="flex justify-between items-center gap-2">
    <CountdownTimer
      expiryTimestamp={expiryTimestamp}
      onExpire={onTokenExpired}
    />
    <div className="flex items-center space-x-2">
      {showSecondaryButton && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={secondaryDisabled ? "default" : "outline"}
              size={secondaryText ? "default" : "icon"}
              className={cn(
                secondaryDisabled
                  ? "text-muted-foreground bg-foreground/20 border border-foreground/20 rounded-full cursor-pointer"
                  : "glass rounded-full cursor-pointer",
                secondaryText ? "h-10 px-6 text-[1.05rem]" : "h-10 w-10",
                secondaryClassName
              )}
              disabled={secondaryDisabled}
              onClick={onSecondaryClicked}
            >
              {secondaryIcon}
              {secondaryText && <span className="ml-2">{secondaryText}</span>}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{secondaryTooltipText}</TooltipContent>
        </Tooltip>
      )}
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
          {actionIcon}
          {actionIcon && actionButtonText && <span className="ml-2">{actionButtonText}</span>}
          {!actionIcon && actionButtonText}
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
              {cancelIcon ?? <CloseIcon className="h-6 w-6" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{cancelTooltipText}</TooltipContent>
        </Tooltip>
      )}
    </div>
  </div>
);

export default SettingActionBar;
