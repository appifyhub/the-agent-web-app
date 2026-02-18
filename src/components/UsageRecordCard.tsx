import React from "react";
import { ChevronDown, BadgeCent, Gift, Key, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/translations";
import { TranslationKey } from "@/lib/translation-keys";
import { UsageRecord } from "@/services/usage-service";
import { ChatInfo } from "@/services/user-settings-service";
import { SponsorshipResponse } from "@/services/sponsorships-service";
import { Badge } from "@/components/ui/badge";
import ProviderIcon from "@/components/ProviderIcon";

interface UsageRecordCardProps {
  record: UsageRecord;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isFirst: boolean;
  isLast: boolean;
  isSingleItem: boolean;
  currentUserId: string;
  chats?: ChatInfo[];
  sponsorships?: SponsorshipResponse[];
  locale: string;
}

const UsageRecordCard: React.FC<UsageRecordCardProps> = ({
  record,
  isExpanded,
  onToggleExpand,
  isFirst,
  isLast,
  isSingleItem,
  currentUserId,
  chats,
  sponsorships,
  locale,
}) => {
  // Border/rounded classes
  let roundedClasses = "";
  let borderClasses = "border-t-0";
  if (isSingleItem) {
    roundedClasses = "rounded-2xl";
    borderClasses = "border-t-1";
  } else if (isFirst) {
    roundedClasses = "rounded-t-2xl";
    borderClasses = "border-t-1";
  } else if (isLast) {
    roundedClasses = "rounded-b-2xl";
  }

  // Format timestamp
  const date = new Date(record.timestamp);
  const timeStr = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dateStr = date.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
  });

  // Calculate sponsorship type
  const normalizedCurrentId = currentUserId.replace(/-/g, "");
  const normalizedUserId = record.user_id.replace(/-/g, "");
  const normalizedPayerId = record.payer_id?.replace(/-/g, "");

  const isSponsoredByOthersForMe = normalizedPayerId !== normalizedUserId && normalizedUserId === normalizedCurrentId;
  const isSponsoredByMeForOthers = normalizedPayerId === normalizedCurrentId && normalizedUserId !== normalizedCurrentId;

  // Get translated purpose title
  const getPurposeTitle = (): string => {
    const key = `tools.types.${record.tool_purpose}.title` as TranslationKey;
    const translated = t(key);
    // If translation returns the key itself, fall back to raw purpose
    if (translated === key) {
      return record.tool_purpose;
    }
    return translated;
  };

  const getUserDisplayName = (): React.ReactNode => {
    const normalizedRecordId = record.user_id.replace(/-/g, "");
    const isCurrentUserRecord = normalizedRecordId === normalizedCurrentId;

    let displayName = t("usage.context_ids.user_me");
    if (!isCurrentUserRecord) {
      displayName = t("usage.context_ids.user_sponsored");
      const sponsorship = sponsorships?.find(
        (s) => s.user_id_hex.replace(/-/g, "") === normalizedRecordId
      );

      if (sponsorship) {
        displayName = sponsorship.full_name || sponsorship.platform_handle || displayName;
      }
    }

    return (
      <span className="flex items-center gap-1.5">
        {isSponsoredByMeForOthers && (
          <Gift className="h-3.5 w-3.5 text-blue-300 mb-0.5" />
        )}
        {displayName}
        {isSponsoredByOthersForMe && (
          <Gift className="h-3.5 w-3.5 text-blue-300 mb-0.5" />
        )}
      </span>
    );
  };

  // Get chat display - try to find chat name from chats list
  const getChatDisplay = (): string => {
    if (!record.chat_id) {
      return t("usage.context_ids.chat_background");
    }
    const normalizedRecordChatId = record.chat_id.replace(/-/g, "");
    const chat = chats?.find((c) => c.chat_id.replace(/-/g, "") === normalizedRecordChatId);
    if (chat?.title) {
      let displayName = chat.title;
      if (displayName.includes("·")) {
        displayName = displayName.split("·")[0].trim();
      }
      return displayName.length > 10 ? `${displayName.slice(0, 10).trim()}…` : displayName;
    }
    return t("usage.context_ids.chat_in_chat");
  };

  // Format runtime
  const formatRuntime = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  // Format credits
  const formatCredits = (credits: number): string => {
    return credits.toFixed(1);
  };

  // Check if cost breakdown has any non-zero values
  const hasCostBreakdown =
    record.model_cost_credits > 0 ||
    record.remote_runtime_cost_credits > 0 ||
    record.api_call_cost_credits > 0 ||
    record.maintenance_fee_credits > 0;

  // Check if token stats has any values (use != null to catch both null and undefined)
  const hasTokenStats =
    record.input_tokens != null ||
    record.output_tokens != null ||
    record.search_tokens != null ||
    record.total_tokens != null;

  const visibleColumnCount = [hasCostBreakdown, hasTokenStats, true].filter(Boolean).length;
  const gridColsClass = visibleColumnCount === 3 ? "md:grid-cols-3" : visibleColumnCount === 2 ? "md:grid-cols-2" : "md:grid-cols-1";

  return (
    <div
      className={cn(
        "flex flex-col px-5 glass-muted border cursor-pointer w-full space-y-4",
        isExpanded ? "py-8" : "py-3",
        roundedClasses,
        borderClasses
      )}
      onClick={onToggleExpand}
    >
      {/* Collapsed view - always visible */}
      <div className="flex items-center w-full">
        <div className="hidden md:flex items-center justify-center w-6 h-6 shrink-0 mr-2">
          <ProviderIcon
            providerId={record.tool.provider.id}
            alt={record.tool.provider.name}
            className="w-6 h-6"
          />
        </div>

        <div className="hidden md:block md:w-5 md:h-5" />

        <div className="hidden md:flex flex-col justify-center items-start shrink-0">
          <span className="text-md font-medium">{timeStr}</span>
          <span className="text-sm text-muted-foreground">{dateStr}</span>
        </div>

        <div className="flex flex-col flex-1 min-w-0 pr-4 md:px-4">
          <span className="text-md font-medium truncate">
            {record.tool.name}
          </span>
          <span className="text-sm text-muted-foreground truncate">
            {getPurposeTitle()}
          </span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className={cn(
            "flex items-center min-w-[4rem] justify-end",
            !isSponsoredByOthersForMe && "space-x-1"
          )}>
            {isSponsoredByOthersForMe ? (
              <Gift className="h-4 w-4 text-blue-300" />
            ) : (
              <>
                {record.uses_credits !== false ? (
                  <BadgeCent className="h-4 w-4 text-accent-amber" />
                ) : (
                  <Key className="h-4 w-4 text-accent-amber" />
                )}
                <span
                  className={cn(
                    "text-base font-medium font-mono",
                    record.uses_credits === false
                      ? "text-accent-amber line-through"
                      : "text-accent-amber"
                  )}
                >
                  {formatCredits(record.total_cost_credits)}
                </span>
              </>
            )}
          </div>
          <div className="hidden md:flex items-center space-x-1 min-w-[4.5rem] justify-end">
            <Clock className="h-4 w-4 text-blue-300" />
            <span className="text-base font-mono text-blue-300">
              {formatRuntime(record.runtime_seconds)}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 mb-0.5",
              isExpanded ? "text-foreground rotate-180" : "rotate-0"
            )}
          />
        </div>
      </div>

      {/* Expanded view */}
      {isExpanded && (
        <div className={`flex flex-col gap-y-2 gap-x-2 md:grid ${gridColsClass}`}>
          {/* Cost Breakdown */}
          {hasCostBreakdown && (
            <div className="border-1 border-muted-foreground/30 rounded-md space-y-1 p-[0.5rem]">
              <h4 className="text-sm font-medium text-blue-300/80 uppercase truncate">
                {t("usage.cost_breakdown.title")}
              </h4>
              <div className="flex flex-col gap-y-1 text-sm">
                {record.model_cost_credits > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.cost_breakdown.model_cost")}
                    </span>
                    <span className="shrink-0">{formatCredits(record.model_cost_credits)}</span>
                  </div>
                )}
                {record.remote_runtime_cost_credits > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.cost_breakdown.remote_cost")}
                    </span>
                    <span className="shrink-0">
                      {formatCredits(record.remote_runtime_cost_credits)}
                    </span>
                  </div>
                )}
                {record.api_call_cost_credits > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.cost_breakdown.api_call_cost")}
                    </span>
                    <span className="shrink-0">{formatCredits(record.api_call_cost_credits)}</span>
                  </div>
                )}
                {record.maintenance_fee_credits > 0 && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.cost_breakdown.maintenance_fee")}
                    </span>
                    <span className="shrink-0">{formatCredits(record.maintenance_fee_credits)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 font-medium pt-[0.4rem] border-t border-muted-foreground/20">
                  <span className={cn(
                    "min-w-0 truncate",
                    record.uses_credits === false && "line-through"
                  )}>
                    {t("usage.cost_breakdown.total")}
                  </span>
                  <span className="shrink-0 flex items-center gap-1">
                    <span className={cn(
                      "font-mono",
                      record.uses_credits === false && "line-through",
                      isSponsoredByOthersForMe ? "text-blue-300" : "text-accent-amber"
                    )}>
                      {formatCredits(record.total_cost_credits)}
                    </span>
                    {record.uses_credits !== false ? (
                      <BadgeCent className={cn(
                        "h-3.5 w-3.5",
                        isSponsoredByOthersForMe ? "text-blue-300" : "text-accent-amber"
                      )} />
                    ) : (
                      <Key className={cn(
                        "h-3.5 w-3.5",
                        isSponsoredByOthersForMe ? "text-blue-300" : "text-accent-amber"
                      )} />
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Token Stats */}
          {hasTokenStats && (
            <div className="border-1 border-muted-foreground/30 rounded-md space-y-1 p-[0.5rem]">
              <h4 className="text-sm font-medium text-blue-300/80 uppercase truncate">
                {t("usage.token_stats.title")}
              </h4>
              <div className="flex flex-col space-y-1 text-sm">
                {record.input_tokens != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.token_stats.input_tokens")}
                    </span>
                    <span className="shrink-0">{record.input_tokens.toLocaleString()}</span>
                  </div>
                )}
                {record.output_tokens != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.token_stats.output_tokens")}
                    </span>
                    <span className="shrink-0">{record.output_tokens.toLocaleString()}</span>
                  </div>
                )}
                {record.search_tokens != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground min-w-0 truncate">
                      {t("usage.token_stats.search_tokens")}
                    </span>
                    <span className="shrink-0">{record.search_tokens.toLocaleString()}</span>
                  </div>
                )}
                {record.total_tokens != null && (
                  <div className="flex justify-between gap-4 font-medium pt-[0.4rem] border-t border-muted-foreground/20">
                    <span className="min-w-0 truncate">{t("usage.token_stats.total")}</span>
                    <span className="shrink-0">{record.total_tokens.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Context & IDs */}
          <div className="border-1 border-muted-foreground/30 rounded-md space-y-1 p-[0.5rem]">
            <h4 className="text-sm font-medium text-blue-300/80 uppercase truncate">
              {t("usage.context_ids.title")}
            </h4>
            <div className="flex flex-col space-y-1 text-sm">
              <div className="flex md:hidden justify-between gap-4">
                <span className="text-muted-foreground min-w-0 truncate">
                  {t("usage.context_ids.date_label")}
                </span>
                <span className="shrink-0">{dateStr}</span>
              </div>
              <div className="flex md:hidden justify-between gap-4">
                <span className="text-muted-foreground min-w-0 truncate">
                  {t("usage.context_ids.time_label")}
                </span>
                <span className="shrink-0">{timeStr}</span>
              </div>
              <div className="flex md:hidden justify-between gap-4">
                <span className="text-muted-foreground min-w-0 truncate">
                  {t("usage.context_ids.runtime_label")}
                </span>
                <span className="shrink-0">{formatRuntime(record.runtime_seconds)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground min-w-0 truncate">
                  {t("usage.context_ids.user_label")}
                </span>
                <span className="shrink-0">{getUserDisplayName()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground shrink-0">
                  {t("usage.context_ids.chat_label")}
                </span>
                <span className="min-w-0 truncate">{getChatDisplay()}</span>
              </div>
              {record.remote_runtime_seconds != null && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground min-w-0 truncate">
                    {t("usage.context_ids.remote_runtime")}
                  </span>
                  <span className="shrink-0">{formatRuntime(record.remote_runtime_seconds)}</span>
                </div>
              )}
              {record.output_image_sizes &&
                record.output_image_sizes.length > 0 && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground shrink-0">
                      {t("usage.context_ids.output_image_sizes")}
                    </span>
                    <div className="flex flex-wrap gap-1 min-w-0 justify-end">
                      {record.output_image_sizes.map((size, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {record.input_image_sizes &&
                record.input_image_sizes.length > 0 && (
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-muted-foreground shrink-0">
                      {t("usage.context_ids.input_image_sizes")}
                    </span>
                    <div className="flex flex-wrap gap-1 min-w-0 justify-end">
                      {record.input_image_sizes.map((size, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="text-xs px-1.5 py-0"
                        >
                          {size}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsageRecordCard;
