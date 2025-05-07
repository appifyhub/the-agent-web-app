import React from "react";
import CopyValue from "@/components/CopyValue";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { User, AtSign, Hash } from "lucide-react";
import type { DecodedToken } from "@/lib/tokens";

export interface TokenDataSheetItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export interface TokenDataSheetLabels {
  chatRole: string;
  telegramUsername: string;
  telegramUserId: string;
  profileId: string;
  chatId: string;
}

interface TokenDataSheetProps {
  decoded: DecodedToken;
  labels: TokenDataSheetLabels;
  className?: string;
  iconClassName?: string;
  copiedMessage: string;
}

const TokenDataSheet: React.FC<TokenDataSheetProps> = ({
  decoded,
  labels,
  className,
  iconClassName = "w-4 h-4 text-blue-300/30",
  copiedMessage,
}) => {
  const items: TokenDataSheetItem[] = [
    { label: labels.chatRole, value: decoded.role, icon: User },
    decoded.telegram_username && {
      label: labels.telegramUsername,
      value: decoded.telegram_username,
      icon: AtSign,
    },
    {
      label: labels.telegramUserId,
      value: decoded.telegram_user_id,
      icon: Hash,
    },
    { label: labels.profileId, value: decoded.sub, icon: Hash },
    { label: labels.chatId, value: decoded.chat_id, icon: Hash },
  ].filter(Boolean) as TokenDataSheetItem[];

  return (
    <div
      className={cn(
        `flex flex-col gap-x-4 gap-y-1 items-baseline px-2`,
        className
      )}
    >
      {items.map((item, idx) => (
        <div
          key={item.label + item.value + idx}
          className="flex items-center justify-between gap-1"
        >
          {React.createElement(item.icon, { className: iconClassName })}
          <div className="flex items-baseline gap-1">
            <span className="font-light">{item.label}:</span>
            <CopyValue value={item.value} copiedMessage={copiedMessage} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TokenDataSheet;
