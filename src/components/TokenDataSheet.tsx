import React, { useState } from "react";
import CopyValue from "@/components/CopyValue";
import type { LucideIcon } from "lucide-react";
import { AtSign, Hash, Rocket, ChevronDown, ChevronRight } from "lucide-react";
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
  version: string;
}

interface TokenDataSheetProps {
  decoded: DecodedToken;
}

const TokenDataSheet: React.FC<TokenDataSheetProps> = ({ decoded }) => {
  const [isRevealed, setIsRevealed] = useState(false);

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
    { label: t("token_info.version"), value: decoded.version, icon: Rocket },
  ].filter(Boolean) as TokenDataSheetItem[];

  return (
    <div className="flex flex-col gap-x-4 gap-y-1 items-baseline px-2">
      {/* Reveal button */}
      <button
        onClick={() => setIsRevealed(!isRevealed)}
        className="flex items-center gap-1 hover:text-blue-300/50 transition-colors cursor-pointer text-left"
      >
        {React.createElement(isRevealed ? ChevronDown : ChevronRight, {
          className: "w-4 h-4 text-blue-300/30",
        })}
        <span className="font-light">{t("token_info.reveal_placeholder")}</span>
      </button>

      {/* Token details (shown when revealed) */}
      {isRevealed && (
        <div className="flex flex-col gap-y-1 w-full pl-6">
          {items.map((item, idx) => (
            <div
              key={item.label + item.value + idx}
              className="flex items-center gap-1"
            >
              {React.createElement(item.icon, {
                className: "w-4 h-4 text-blue-300/30",
              })}
              <div className="flex items-baseline gap-1">
                <span className="font-light">{item.label}:</span>
                <CopyValue value={item.value} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TokenDataSheet;
