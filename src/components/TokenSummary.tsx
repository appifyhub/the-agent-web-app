import React, { useState } from "react";
import CopyValue from "@/components/CopyValue";
import type { LucideIcon } from "lucide-react";
import {
  AtSign,
  Hash,
  Rocket,
  ChevronDown,
  ChevronRight,
  Gift,
  Radio,
} from "lucide-react";
import type { DecodedToken } from "@/lib/tokens";
import { t } from "@/lib/translations";

export interface TokenSummaryItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
}


interface TokenSummaryProps {
  decoded: DecodedToken;
}

const TokenSummary: React.FC<TokenSummaryProps> = ({ decoded }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const items: TokenSummaryItem[] = [
    { label: t("token_info.profile_id"), value: decoded.sub, icon: Hash },
    { label: t("token_info.platform"), value: decoded.platform?.charAt(0).toUpperCase() + decoded.platform?.slice(1) || decoded.platform, icon: Radio },
    decoded.platform_id && {
      label: t("token_info.platform_user_id"),
      value: decoded.platform_id,
      icon: Hash,
    },
    decoded.platform_handle && decoded.platform_handle !== decoded.platform_id && {
      label: t("token_info.platform_handle"),
      value: decoded.platform_handle,
      icon: AtSign,
    },
    decoded.sponsored_by && {
      label: t("token_info.sponsored_by"),
      value: decoded.sponsored_by,
      icon: Gift,
    },
    { label: t("token_info.version"), value: decoded.version, icon: Rocket },
  ].filter(Boolean) as TokenSummaryItem[];

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

export default TokenSummary;
