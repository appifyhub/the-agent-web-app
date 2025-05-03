import React from "react";
import CopyValue from "@/components/CopyValue";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface TokenDataSheetItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

interface TokenDataSheetProps {
  items: TokenDataSheetItem[];
  className?: string;
  iconClassName?: string;
  copiedMessage: string;
}

const TokenDataSheet: React.FC<TokenDataSheetProps> = ({
  items,
  className,
  iconClassName = "w-4 h-4 text-blue-300/30",
  copiedMessage,
}) => {
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
