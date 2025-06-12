import React from "react";
import { toast } from "sonner";
import { t } from "@/lib/translations";

interface CopyValueProps {
  value: string | number;
}

// We'll use dynamic import to avoid SSR issues or circular deps
// and to keep this component decoupled from toast provider location
const CopyValue: React.FC<CopyValueProps> = ({ value }) => {
  const fullValue = String(value);
  const displayValue =
    fullValue.length > 16
      ? `${fullValue.slice(0, 8)}...${fullValue.slice(-6)}`
      : fullValue;

  const spanRef = React.useRef<HTMLSpanElement>(null);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (window.navigator && window.navigator.clipboard) {
      await window.navigator.clipboard.writeText(fullValue);
      toast(t("copied"));
    } else {
      if (spanRef.current) {
        const range = document.createRange();
        range.selectNodeContents(spanRef.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  };

  return (
    <span
      className="relative cursor-pointer select-all outline-none"
      onClick={handleCopy}
      tabIndex={0}
      title={fullValue}
      ref={spanRef}
    >
      <span className="dotted-underline text-blue-300/40 font-mono font-light">
        {displayValue}
      </span>
    </span>
  );
};

export default CopyValue;
