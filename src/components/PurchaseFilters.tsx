import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import InlineSettingSelector from "@/components/InlineSettingSelector";
import { t } from "@/lib/translations";
import { PurchaseAggregates } from "@/services/purchase-service";
import { TimeRange } from "@/services/usage-service";
import { cn } from "@/lib/utils";

interface PurchaseFiltersProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  selectedProduct: string;
  onProductChange: (value: string) => void;
  stats: PurchaseAggregates;
  disabled?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const PurchaseFilters: React.FC<PurchaseFiltersProps> = ({
  timeRange,
  onTimeRangeChange,
  selectedProduct,
  onProductChange,
  stats,
  disabled = false,
  isExpanded: externalIsExpanded,
  onExpandedChange,
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const isExpanded = externalIsExpanded ?? internalIsExpanded;
  const setIsExpanded = (value: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(value);
    } else {
      setInternalIsExpanded(value);
    }
  };

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: "all", label: t("usage.filters.time_range_all") },
    { value: "10min", label: t("usage.filters.time_range_10min") },
    { value: "30min", label: t("usage.filters.time_range_30min") },
    { value: "1h", label: t("usage.filters.time_range_1h") },
    { value: "3h", label: t("usage.filters.time_range_3h") },
    { value: "6h", label: t("usage.filters.time_range_6h") },
    { value: "12h", label: t("usage.filters.time_range_12h") },
    { value: "today", label: t("usage.filters.time_range_today") },
    { value: "yesterday", label: t("usage.filters.time_range_yesterday") },
    { value: "week", label: t("usage.filters.time_range_week") },
    { value: "2weeks", label: t("usage.filters.time_range_2weeks") },
    { value: "month", label: t("usage.filters.time_range_month") },
  ];

  const filtersContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border-1 border-muted-foreground/30 rounded-xl space-y-4 p-[1rem]">
        <InlineSettingSelector
          label={t("purchases.filters.time_range_label")}
          value={timeRange}
          onChange={(value) => onTimeRangeChange(value as TimeRange)}
          options={timeRangeOptions.map((opt) => ({
            ...opt,
            disabled: opt.value === timeRange,
          }))}
          disabled={disabled}
          placeholder={disabled ? "—" : t("usage.filters.time_range_all")}
          className="-mt-2"
        />
      </div>

      <div className="border-1 border-muted-foreground/30 rounded-xl space-y-4 p-[1rem]">
        <InlineSettingSelector
          label={t("purchases.filters.product_label")}
          value={selectedProduct}
          onChange={onProductChange}
          options={[
            { value: "all", label: t("purchases.filters.product_all"), disabled: selectedProduct === "all" },
            ...stats.all_products_used.map((product) => ({
              value: product.id,
              label: product.name,
              disabled: selectedProduct === product.id,
            })),
          ]}
          disabled={disabled}
          placeholder={disabled ? "—" : t("purchases.filters.product_all")}
          className="-mt-2"
        />
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full flex items-center justify-between py-3 px-2 border-b border-muted-foreground/20 text-[1.05rem]",
          isExpanded
            ? "font-medium text-accent-amber underline underline-offset-4"
            : "font-light"
        )}
      >
        <span>
          {isExpanded
            ? t("purchases.filters.hide_filters")
            : t("purchases.filters.show_filters")}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            isExpanded ? "rotate-180" : "rotate-0"
          )}
        />
      </button>
      {isExpanded && <div className="mt-6">{filtersContent}</div>}
    </>
  );
};

export default PurchaseFilters;
