import React from "react";
import CopyValue from "@/components/CopyValue";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { User, AtSign, Hash, Rocket } from "lucide-react";
import type { DecodedToken } from "@/lib/tokens";
import { t } from "@/lib/translations";

export interface TokenDataSheetItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export interface TokenDataSheetLabels {
  profileId: string;
  chatId: string;
  telegramUserId: string;
  telegramUsername: string;
  chatRole: string;
  version: string;
}

interface TokenDataSheetProps {
  decoded: DecodedToken;
  className?: string;
  iconClassName?: string;
  copiedMessage: string;
}

const TokenDataSheet: React.FC<TokenDataSheetProps> = ({
  decoded,
  className,
  iconClassName = "w-4 h-4 text-blue-300/30",
  copiedMessage,
}) => {
  const items: TokenDataSheetItem[] = [
    { label: t("token_info.profile_id"), value: decoded.sub, icon: Hash },
    {
      label: t("token_info.telegram_user_id"),
      value: decoded.telegram_user_id,
      icon: Hash,
    },
    decoded.telegram_username && {
      label: t("token_info.telegram_username"),
      value: decoded.telegram_username,
      icon: AtSign,
    },
    { label: t("token_info.chat_role"), value: decoded.role, icon: User },
    { label: t("token_info.version"), value: decoded.version, icon: Rocket },
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
