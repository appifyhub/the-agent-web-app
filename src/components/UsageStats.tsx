import React, { useState } from "react";
import { ChevronDown, BadgeCent, Hourglass, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";
import { TranslationKey } from "@/lib/translation-keys";
import { UsageAggregatesResponse, AggregateStats } from "@/services/usage-service";

interface UsageStatsProps {
  stats: UsageAggregatesResponse | null;
  isLoading?: boolean;
}

const UsageStats: React.FC<UsageStatsProps> = ({ stats, isLoading = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading || !stats) {
    return null;
  }

  const formatCredits = (credits: number): string => {
    return credits.toFixed(credits % 1 === 0 ? 0 : 1);
  };

  const formatRuntime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds.toFixed(seconds % 1 === 0 ? 0 : 1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
      return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getPurposeLabel = (purpose: string): string => {
    const key = `tools.types.${purpose}.title` as TranslationKey;
    return t(key);
  };

  const getToolName = (toolId: string): string => {
    const tool = stats.all_tools_used.find((t) => t.id === toolId);
    return tool?.name || toolId;
  };

  const getProviderName = (providerId: string): string => {
    const provider = stats.all_providers_used.find((p) => p.id === providerId);
    return provider?.name || providerId;
  };

  const hasBreakdowns =
    Object.keys(stats.by_tool).length > 0 ||
    Object.keys(stats.by_purpose).length > 0 ||
    Object.keys(stats.by_provider).length > 0;

  const renderBreakdown = (
    title: string,
    data: Record<string, AggregateStats>,
    type: "tool" | "purpose" | "provider"
  ) => {
    if (Object.keys(data).length === 0) {
      return null;
    }

    return (
      <div className="border-1 border-muted-foreground/30 rounded-md space-y-1 p-[0.5rem]">
        <h4 className="text-sm font-medium text-blue-300/80 uppercase truncate">
          {title}
        </h4>
        <div className="flex flex-col space-y-1 text-sm">
          {Object.entries(data).map(([name, aggregateStats]) => {
            const displayName =
              type === "purpose"
                ? getPurposeLabel(name)
                : type === "tool"
                  ? getToolName(name)
                  : getProviderName(name);

            return (
              <div key={name} className="flex justify-between gap-4">
                <span className="text-muted-foreground min-w-0 truncate">
                  {displayName}
                </span>
                <span className="shrink-0 text-xs flex items-center gap-1">
                  <span className="text-accent-amber">{formatCredits(aggregateStats.total_cost)}</span>
                  <BadgeCent className="h-3 w-3 text-accent-amber inline" />
                  <span className="text-muted-foreground">({aggregateStats.record_count})</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-static rounded-lg px-[1.5rem] md:px-[1rem] py-[1rem] flex items-center justify-between gap-3">
          <BadgeCent strokeWidth={1.5} className="h-10 w-10 shrink-0 text-accent-amber" />
          <div className="text-right space-y-0.5 min-w-0 flex-1">
            <p className="md:text-sm text-md text-foreground truncate">
              {t("usage.stats.total_cost")}
            </p>
            <p className="text-2xl font-medium text-accent-amber truncate">
              {formatCredits(stats.total_cost_credits)}
            </p>
          </div>
        </div>

        <div className="glass-static rounded-lg px-[1.5rem] md:px-[1rem] py-[1rem] flex items-center justify-between gap-3">
          <Hourglass strokeWidth={1.5} className="h-9 w-9 shrink-0 text-blue-300" />
          <div className="text-right space-y-0.5 min-w-0 flex-1">
            <p className="md:text-sm text-md text-foreground truncate">
              {t("usage.stats.total_runtime")}
            </p>
            <p className="text-2xl font-medium text-blue-300 truncate">
              {formatRuntime(stats.total_runtime_seconds)}
            </p>
          </div>
        </div>

        <div className="glass-static rounded-lg px-[1.5rem] md:px-[1rem] py-[1rem] flex items-center justify-between gap-3">
          <ListOrdered strokeWidth={1.5} className="h-10 w-10 shrink-0 text-blue-300" />
          <div className="text-right space-y-0.5 min-w-0 flex-1">
            <p className="md:text-sm text-md text-foreground truncate">
              {t("usage.stats.total_records")}
            </p>
            <p className="text-2xl font-medium text-blue-300 truncate">
              {stats.total_records.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {hasBreakdowns && (
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
              ? t("usage.stats.hide_breakdowns")
              : t("usage.stats.show_breakdowns")}
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded ? "rotate-180" : "rotate-0"
            )}
          />
        </button>
      )}

      {isExpanded && hasBreakdowns && (
        <div className="mt-4 flex flex-col gap-y-2 gap-x-2 md:grid md:grid-cols-3">
          {renderBreakdown(t("usage.stats.by_tool"), stats.by_tool, "tool")}
          {renderBreakdown(t("usage.stats.by_purpose"), stats.by_purpose, "purpose")}
          {renderBreakdown(t("usage.stats.by_provider"), stats.by_provider, "provider")}
        </div>
      )}
    </div>
  );
};

export default UsageStats;
