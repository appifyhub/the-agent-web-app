import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import InlineSettingSelector from "@/components/InlineSettingSelector";
import SettingToggle from "@/components/SettingToggle";
import { t } from "@/lib/translations";
import { TranslationKey } from "@/lib/translation-keys";
import { UsageAggregatesResponse } from "@/services/usage-service";
import { cn } from "@/lib/utils";

export type TimeRange =
  | "all"
  | "10min"
  | "30min"
  | "1h"
  | "3h"
  | "6h"
  | "12h"
  | "today"
  | "yesterday"
  | "week"
  | "2weeks"
  | "month";

interface UsageFiltersProps {
  timeRange: TimeRange;
  onTimeRangeChange: (value: TimeRange) => void;
  selectedTool: string;
  onToolChange: (value: string) => void;
  selectedPurpose: string;
  onPurposeChange: (value: string) => void;
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  includeSponsored: boolean;
  onIncludeSponsoredChange: (value: boolean) => void;
  excludeSelf: boolean;
  onExcludeSelfChange: (value: boolean) => void;
  stats: UsageAggregatesResponse;
  disabled?: boolean;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const UsageFilters: React.FC<UsageFiltersProps> = ({
  timeRange,
  onTimeRangeChange,
  selectedTool,
  onToolChange,
  selectedPurpose,
  onPurposeChange,
  selectedProvider,
  onProviderChange,
  includeSponsored,
  onIncludeSponsoredChange,
  excludeSelf,
  onExcludeSelfChange,
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

  const getPurposeLabel = (purpose: string): string => {
    const key = `tools.types.${purpose}.title` as TranslationKey;
    return t(key);
  };

  const filtersContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="border-1 border-muted-foreground/30 rounded-xl space-y-4 p-[1rem]">
        <h3 className="text-md font-medium text-blue-300/80 uppercase truncate">
          {t("usage.filters.scope_section")}
        </h3>

        <InlineSettingSelector
          label={t("usage.filters.time_range_label")}
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

        <SettingToggle
          id="include-sponsored"
          label={t("usage.filters.include_sponsored_label")}
          checked={includeSponsored}
          onChange={onIncludeSponsoredChange}
          disabled={disabled}
        />

        {includeSponsored && (
          <SettingToggle
            id="exclude-self"
            label={t("usage.filters.exclude_self_label")}
            checked={excludeSelf}
            onChange={onExcludeSelfChange}
            disabled={disabled}
          />
        )}
      </div>

      <div className="border-1 border-muted-foreground/30 rounded-xl space-y-4 p-[1rem]">
        <h3 className="text-md font-medium text-blue-300/80 uppercase truncate">
          {t("usage.filters.filters_section")}
        </h3>

        <InlineSettingSelector
          label={t("usage.filters.tool_label")}
          value={selectedTool}
          onChange={onToolChange}
          options={[
            { value: "all", label: t("usage.filters.tool_all"), disabled: selectedTool === "all" },
            ...stats.all_tools_used.map((tool) => ({
              value: tool.id,
              label: tool.name,
              disabled: selectedTool === tool.id,
            })),
          ]}
          disabled={disabled}
          placeholder={disabled ? "—" : t("usage.filters.tool_all")}
          className="-mt-2"
        />

        <InlineSettingSelector
          label={t("usage.filters.purpose_label")}
          value={selectedPurpose}
          onChange={onPurposeChange}
          options={[
            { value: "all", label: t("usage.filters.purpose_all"), disabled: selectedPurpose === "all" },
            ...stats.all_purposes_used.map((purpose) => ({
              value: purpose,
              label: getPurposeLabel(purpose),
              disabled: selectedPurpose === purpose,
            })),
          ]}
          disabled={disabled}
          placeholder={disabled ? "—" : t("usage.filters.purpose_all")}
          className="-mt-2"
        />

        <InlineSettingSelector
          label={t("usage.filters.provider_label")}
          value={selectedProvider}
          onChange={onProviderChange}
          options={[
            { value: "all", label: t("usage.filters.provider_all"), disabled: selectedProvider === "all" },
            ...stats.all_providers_used.map((provider) => ({
              value: provider.id,
              label: provider.name,
              disabled: selectedProvider === provider.id,
            })),
          ]}
          disabled={disabled}
          placeholder={disabled ? "—" : t("usage.filters.provider_all")}
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
            ? t("usage.filters.hide_scope_and_filters")
            : t("usage.filters.show_scope_and_filters")}
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

export default UsageFilters;
