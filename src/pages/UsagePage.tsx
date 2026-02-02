import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import { ChartNoAxesCombined } from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  fetchUsageRecords,
  fetchUsageStats,
  UsageRecord,
  UsageAggregatesResponse,
} from "@/services/usage-service";
import {
  fetchUserSponsorships,
  SponsorshipResponse,
} from "@/services/sponsorships-service";
import { usePageSession } from "@/hooks/usePageSession";
import { useChats } from "@/hooks/useChats";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import UsageRecordCard from "@/components/UsageRecordCard";
import UsageFilters, { TimeRange } from "@/components/UsageFilters";
import UsageStats from "@/components/UsageStats";
import { Button } from "@/components/ui/button";

const RECORDS_PER_PAGE = 50;

const UsagePage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError } =
    usePageSession();

  const { chats } = useChats(accessToken?.decoded?.sub, accessToken?.raw);

  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipResponse[]>([]);
  const [stats, setStats] = useState<UsageAggregatesResponse | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [timeRange, setTimeRange] = useState<TimeRange>("today");
  const [selectedTool, setSelectedTool] = useState<string>("all");
  const [selectedPurpose, setSelectedPurpose] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [includeSponsored, setIncludeSponsored] = useState<boolean>(true);
  const [excludeSelf, setExcludeSelf] = useState<boolean>(false);
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  const currentInterfaceLanguage =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;

  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        const [records, statsData, sponsorshipsData] = await Promise.all([
          fetchUsageRecords({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
            limit: RECORDS_PER_PAGE + 1,
            include_sponsored: includeSponsored,
            exclude_self: excludeSelf,
            tool_id: selectedTool !== "all" ? selectedTool : undefined,
            purpose: selectedPurpose !== "all" ? selectedPurpose : undefined,
            provider_id: selectedProvider !== "all" ? selectedProvider : undefined,
            start_date: timeRange !== "all" ? new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString() : undefined,
            end_date: timeRange !== "all" ? new Date().toISOString() : undefined,
          }),
          fetchUsageStats({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
            include_sponsored: includeSponsored,
            exclude_self: excludeSelf,
            tool_id: selectedTool !== "all" ? selectedTool : undefined,
            purpose: selectedPurpose !== "all" ? selectedPurpose : undefined,
            provider_id: selectedProvider !== "all" ? selectedProvider : undefined,
            start_date: timeRange !== "all" ? new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString() : undefined,
            end_date: timeRange !== "all" ? new Date().toISOString() : undefined,
          }),
          fetchUserSponsorships({
            apiBaseUrl,
            resource_id: user_id,
            rawToken: accessToken.raw,
          }),
        ]);

        console.info("Fetched usage records!", records.length);
        console.info("Fetched usage stats!", statsData);
        console.info("Fetched sponsorships!", sponsorshipsData);

        setStats(statsData);
        setSponsorships(sponsorshipsData.sponsorships);

        if (records.length > RECORDS_PER_PAGE) {
          setUsageRecords(records.slice(0, RECORDS_PER_PAGE));
          setHasMore(true);
        } else {
          setUsageRecords(records);
          setHasMore(false);
        }

        if (records.length === 0) {
          setFiltersExpanded(true);
        }
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      }
    };
    fetchData();
  }, [
    accessToken,
    user_id,
    error,
    setError,
    timeRange,
    selectedTool,
    selectedPurpose,
    selectedProvider,
    includeSponsored,
    excludeSelf,
  ]);

  const getTimeRangeMs = (range: string): number => {
    const ranges: Record<string, number> = {
      "10min": 10 * 60 * 1000,
      "30min": 30 * 60 * 1000,
      "1h": 60 * 60 * 1000,
      "3h": 3 * 60 * 60 * 1000,
      "6h": 6 * 60 * 60 * 1000,
      "12h": 12 * 60 * 60 * 1000,
      "today": new Date().setHours(0, 0, 0, 0) - Date.now(),
      "yesterday": 24 * 60 * 60 * 1000,
      "week": 7 * 24 * 60 * 60 * 1000,
      "2weeks": 14 * 24 * 60 * 60 * 1000,
      "month": 30 * 24 * 60 * 60 * 1000,
    };
    return ranges[range] || 0;
  };

  const handleLoadMore = async () => {
    if (!accessToken || !user_id || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const records = await fetchUsageRecords({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        skip: usageRecords.length,
        limit: RECORDS_PER_PAGE + 1,
        include_sponsored: includeSponsored,
        exclude_self: excludeSelf,
        tool_id: selectedTool !== "all" ? selectedTool : undefined,
        purpose: selectedPurpose !== "all" ? selectedPurpose : undefined,
        provider_id: selectedProvider !== "all" ? selectedProvider : undefined,
        start_date: timeRange !== "all" ? new Date(Date.now() - getTimeRangeMs(timeRange)).toISOString() : undefined,
        end_date: timeRange !== "all" ? new Date().toISOString() : undefined,
      });

      if (records.length > RECORDS_PER_PAGE) {
        setUsageRecords((prev) => [
          ...prev,
          ...records.slice(0, RECORDS_PER_PAGE),
        ]);
        setHasMore(true);
      } else {
        setUsageRecords((prev) => [...prev, ...records]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more records!", err);
      setError(PageError.simple("errors.fetch_failed"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <BaseSettingsPage
      page="usage"
      showActionButton={false}
      isContentLoading={isLoadingState}
    >
      <CardTitle className="text-center mx-auto">
        {t("usage.card_title")}
      </CardTitle>

      <div className="h-2" />

      {stats && <UsageStats stats={stats} />}

      {stats && (
        <UsageFilters
          timeRange={timeRange}
          selectedTool={selectedTool}
          selectedPurpose={selectedPurpose}
          selectedProvider={selectedProvider}
          includeSponsored={includeSponsored}
          excludeSelf={excludeSelf}
          onTimeRangeChange={setTimeRange}
          onToolChange={setSelectedTool}
          onPurposeChange={setSelectedPurpose}
          onProviderChange={setSelectedProvider}
          onIncludeSponsoredChange={setIncludeSponsored}
          onExcludeSelfChange={setExcludeSelf}
          stats={stats}
          disabled={isLoadingState}
          isExpanded={filtersExpanded}
          onExpandedChange={setFiltersExpanded}
        />
      )}

      <div className="flex flex-col space-y-6">
        {usageRecords.length === 0 ? (
          <div className="flex flex-col items-center space-y-10 text-center mt-12">
            <ChartNoAxesCombined className="h-12 w-12 text-accent-amber" />
            <p className="text-foreground/80 font-light">
              {t("usage.no_records_found")}
            </p>
          </div>
        ) : (
          <>
            <div className="h-2" />
            <div className="w-full max-w-2xl mx-auto">
              {usageRecords.map((record, index) => {
                const isExpanded = expandedItems.has(index);
                const toggleExpanded = () => {
                  const newExpandedItems = new Set(expandedItems);
                  if (isExpanded) {
                    newExpandedItems.delete(index);
                  } else {
                    newExpandedItems.add(index);
                  }
                  setExpandedItems(newExpandedItems);
                };

                return (
                  <UsageRecordCard
                    key={index}
                    record={record}
                    isExpanded={isExpanded}
                    onToggleExpand={toggleExpanded}
                    isFirst={index === 0}
                    isLast={index === usageRecords.length - 1}
                    isSingleItem={usageRecords.length === 1}
                    currentUserId={accessToken?.decoded?.sub || ""}
                    chats={chats}
                    sponsorships={sponsorships}
                    locale={currentInterfaceLanguage.isoCode}
                  />
                );
              })}
            </div>

            {hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? t("loading_placeholder") : t("usage.load_more")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </BaseSettingsPage>
  );
};

export default UsagePage;
