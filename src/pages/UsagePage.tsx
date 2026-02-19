import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChartNoAxesCombined, BadgeCent, ShoppingCart } from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  fetchUsageRecords,
  fetchUsageStats,
  UsageRecord,
  UsageAggregatesResponse,
} from "@/services/usage-service";
import { fetchProducts, Product } from "@/services/purchase-service";
import ProductPickerDialog from "@/components/ProductPickerDialog";
import {
  fetchUserSponsorships,
  SponsorshipResponse,
} from "@/services/sponsorships-service";
import { usePageSession } from "@/hooks/usePageSession";
import { useChats } from "@/hooks/useChats";
import { useUserSettings } from "@/hooks/useUserSettings";
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

  const { userSettings } = useUserSettings(
    accessToken?.decoded?.sub,
    accessToken?.raw,
  );

  const [shopOpen, setShopOpen] = useState<boolean>(false);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);

  const shopUrl = useMemo(() => {
    if (!user_id) return undefined;
    const storeUrl = import.meta.env.VITE_STORE_URL;
    if (!storeUrl) return undefined;
    try {
      const url = new URL(storeUrl);
      url.searchParams.set("user_id", user_id.replace(/-/g, ""));
      return url.toString();
    } catch {
      return undefined;
    }
  }, [user_id]);

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
    if (!accessToken || !user_id) return;

    const loadProducts = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const { products } = await fetchProducts({
          apiBaseUrl,
          user_id,
          rawToken: accessToken.raw,
        });
        setShopProducts(products);
      } catch (err) {
        console.error("Error fetching products!", err);
      }
    };
    loadProducts();
  }, [accessToken, user_id]);

  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        const dateRange = getDateRange(timeRange);

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
            start_date: dateRange.start?.toISOString(),
            end_date: dateRange.end?.toISOString(),
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
            start_date: dateRange.start?.toISOString(),
            end_date: dateRange.end?.toISOString(),
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

  const getDateRange = (range: TimeRange): { start: Date | null; end: Date | null } => {
    const now = new Date();

    if (range === "all") {
      return { start: null, end: null };
    }

    const msPerMinute = 60 * 1000;
    const msPerHour = 60 * msPerMinute;
    const msPerDay = 24 * msPerHour;

    switch (range) {
      case "10min":
        return { start: new Date(Date.now() - 10 * msPerMinute), end: now };
      case "30min":
        return { start: new Date(Date.now() - 30 * msPerMinute), end: now };
      case "1h":
        return { start: new Date(Date.now() - msPerHour), end: now };
      case "3h":
        return { start: new Date(Date.now() - 3 * msPerHour), end: now };
      case "6h":
        return { start: new Date(Date.now() - 6 * msPerHour), end: now };
      case "12h":
        return { start: new Date(Date.now() - 12 * msPerHour), end: now };
      case "today": {
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        return { start: startOfToday, end: now };
      }
      case "yesterday": {
        const startOfToday = new Date();
        startOfToday.setUTCHours(0, 0, 0, 0);
        const startOfYesterday = new Date(startOfToday.getTime() - msPerDay);
        return { start: startOfYesterday, end: startOfToday };
      }
      case "week":
        return { start: new Date(Date.now() - 7 * msPerDay), end: now };
      case "2weeks":
        return { start: new Date(Date.now() - 14 * msPerDay), end: now };
      case "month":
        return { start: new Date(Date.now() - 30 * msPerDay), end: now };
      default:
        return { start: null, end: null };
    }
  };

  const handleLoadMore = async () => {
    if (!accessToken || !user_id || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const dateRange = getDateRange(timeRange);
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
        start_date: dateRange.start?.toISOString(),
        end_date: dateRange.end?.toISOString(),
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

  const handleBuyMore = () => {
    const isSponsored = !!accessToken?.decoded.sponsored_by;
    if (isSponsored) {
      const sponsorName = accessToken!.decoded.sponsored_by!;
      const sponsorshipsUrl = `/${lang_iso_code}/user/${user_id}/sponsorships${window.location.search}`;
      const sponsorshipsTitle = t("sponsorships");

      const boldSponsorNameHtml = `<span class="font-bold font-mono">${sponsorName}</span>`;
      const linkStyle = "underline text-amber-100 hover:text-white";
      const sponsorshipsLinkHtml = `<a href="${sponsorshipsUrl}" class="${linkStyle}" >${sponsorshipsTitle}</a>`;

      const htmlMessage = t("errors.sponsored_user", {
        sponsorName: boldSponsorNameHtml,
        sponsorshipsLink: sponsorshipsLinkHtml,
      });

      const errorMessage = (
        <span dangerouslySetInnerHTML={{ __html: htmlMessage }} />
      );

      setError(PageError.blockerWithHtml(errorMessage, false));
      return;
    }
    setShopOpen(true);
  };

  return (
    <>
      <ProductPickerDialog
        products={shopProducts}
        open={shopOpen}
        onOpenChange={setShopOpen}
        shopUrl={shopUrl}
      />
      <BaseSettingsPage
        page="usage"
      cardTitle={t("usage.card_title")}
      onActionClicked={handleBuyMore}
      actionIcon={<ShoppingCart className="h-5 w-5" />}
      actionButtonText={t("purchases.buy_credits")}
      isContentLoading={isLoadingState}
      externalError={error}
    >
      {userSettings && (
        <div className="flex items-center justify-center gap-2 text-lg mt-2">
          <span className="text-muted-foreground font-light">
            {t("usage.credit_balance", { balance: "" }).trim()}
          </span>
          <span className="text-accent-amber font-mono font-medium">
            {userSettings.credit_balance.toFixed(2)}
          </span>
          <BadgeCent strokeWidth={1.5} className="h-5 w-5 text-accent-amber" />
        </div>
      )}

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
            <div className="w-full mx-auto">
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
    </>
  );
};

export default UsagePage;
