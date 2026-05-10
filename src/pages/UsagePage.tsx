import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ChartNoAxesCombined, BadgeCent, ShoppingCart, ArrowRightLeft } from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { ApiError } from "@/lib/api-error";
import { PageError, buildSponsoredBlockerError, cleanUsername } from "@/lib/utils";
import { toast } from "sonner";
import { t } from "@/lib/translations";
import {
  fetchUsageRecords,
  fetchUsageStats,
  createTransfer,
  UsageRecord,
  UsageAggregatesResponse,
} from "@/services/usage-service";
import { fetchProducts, Product } from "@/services/purchase-service";
import { Platform } from "@/lib/platform";
import ProductPickerDialog from "@/components/ProductPickerDialog";
import PlatformHandleInput from "@/components/PlatformHandleInput";
import SettingInput from "@/components/SettingInput";
import SettingTextarea from "@/components/SettingTextarea";
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

  const { userSettings, refreshSettings } = useUserSettings(
    user_id,
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
  const [includeTransfers, setIncludeTransfers] = useState<boolean>(true);
  const [onlyTransfers, setOnlyTransfers] = useState<boolean>(false);
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

  const [dataRefreshCounter, setDataRefreshCounter] = useState<number>(0);

  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [transferPlatform, setTransferPlatform] = useState<Platform>(Platform.TELEGRAM);
  const [transferHandle, setTransferHandle] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferNote, setTransferNote] = useState<string>("");
  const [isTransferSaving, setIsTransferSaving] = useState<boolean>(false);

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

  useEffect(() => {
    if (!accessToken || !user_id || error) return;

    const fetchData = async () => {
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        const dateRange = getDateRange(timeRange);

        const [records, statsData] = await Promise.all([
          fetchUsageRecords({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
            limit: RECORDS_PER_PAGE + 1,
            include_sponsored: includeSponsored,
            exclude_self: excludeSelf,
            include_transfers: includeTransfers,
            only_transfers: onlyTransfers,
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
            include_transfers: includeTransfers,
            only_transfers: onlyTransfers,
            tool_id: selectedTool !== "all" ? selectedTool : undefined,
            purpose: selectedPurpose !== "all" ? selectedPurpose : undefined,
            provider_id: selectedProvider !== "all" ? selectedProvider : undefined,
            start_date: dateRange.start?.toISOString(),
            end_date: dateRange.end?.toISOString(),
          }),
        ]);

        console.info("Fetched usage records!", records.length);
        console.info("Fetched usage stats!", statsData);

        setStats(statsData);

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
        setError(
          err instanceof ApiError
            ? PageError.fromApiError(err, true)
            : PageError.blocker("errors.fetch_failed"),
        );
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
    includeTransfers,
    onlyTransfers,
    dataRefreshCounter,
  ]);

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
        include_transfers: includeTransfers,
        only_transfers: onlyTransfers,
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
      setError(
        err instanceof ApiError
          ? PageError.fromApiError(err)
          : PageError.simple("errors.fetch_failed"),
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleBuyMore = () => {
    if (userSettings?.is_sponsored) {
      setError(buildSponsoredBlockerError(lang_iso_code!, user_id!));
      return;
    }
    setShopOpen(true);
  };

  const handleStartTransfer = () => {
    setIsTransferring(true);
    setTransferHandle("");
    setTransferAmount("");
    setTransferNote("");
    setTransferPlatform(Platform.TELEGRAM);
  };

  const handleCancelTransfer = () => {
    setIsTransferring(false);
    setTransferHandle("");
    setTransferAmount("");
    setTransferNote("");
    setTransferPlatform(Platform.TELEGRAM);
  };

  const parsedTransferAmount = parseFloat(transferAmount);
  const isTransferValid =
    cleanUsername(transferHandle).length > 0 &&
    !isNaN(parsedTransferAmount) &&
    parsedTransferAmount >= 1.0;

  const handleSaveTransfer = async () => {
    if (!isTransferValid || !user_id || !accessToken) return;

    setIsTransferSaving(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await createTransfer({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        payload: {
          platform: transferPlatform,
          platform_handle: cleanUsername(transferHandle),
          amount: parsedTransferAmount,
          note: transferNote.trim() || undefined,
        },
      });
      handleCancelTransfer();
      setDataRefreshCounter((c) => c + 1);
      await refreshSettings();
      toast(t("saved"));
    } catch (err) {
      console.error("Error transferring credits!", err);
      setError(
        err instanceof ApiError
          ? PageError.fromApiError(err)
          : PageError.simple("errors.save_failed"),
      );
    } finally {
      setIsTransferSaving(false);
    }
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
        cardTitle={isTransferring ? t("usage.transfer.card_title") : t("usage.card_title")}
        onActionClicked={isTransferring ? handleSaveTransfer : handleBuyMore}
        actionDisabled={isTransferring ? !isTransferValid : false}
        actionIcon={isTransferring ? undefined : <ShoppingCart className="h-5 w-5" />}
        actionButtonText={isTransferring ? t("save") : t("purchases.buy_credits")}
        showSecondaryButton={!isTransferring}
        onSecondaryClicked={handleStartTransfer}
        secondaryIcon={<ArrowRightLeft className="h-5 w-5" />}
        secondaryTooltipText={t("usage.transfer.button")}
        showCancelButton={isTransferring}
        onCancelClicked={handleCancelTransfer}
        isContentLoading={isLoadingState || isTransferSaving}
        externalError={error}
        onExternalErrorDismiss={() => setError(null)}
      >
      {isTransferring ? (
        <div className="flex flex-col items-center gap-6">
          <PlatformHandleInput
            label={t("usage.transfer.handle_label")}
            selectedPlatform={transferPlatform}
            onPlatformChange={setTransferPlatform}
            platformHandle={transferHandle}
            onPlatformHandleChange={setTransferHandle}
            disabled={!!error?.isBlocker}
            className="w-full sm:w-auto"
            onKeyboardConfirm={() => {
              if (!error?.isBlocker && isTransferValid) {
                handleSaveTransfer();
              }
            }}
          />
          <SettingInput
            id="transfer-amount"
            label={t("usage.transfer.amount_label")}
            value={transferAmount}
            onChange={setTransferAmount}
            disabled={!!error?.isBlocker}
            placeholder={t("usage.transfer.amount_placeholder")}
            type="number"
            className="w-full sm:w-auto"
            onKeyboardConfirm={() => {
              if (!error?.isBlocker && isTransferValid) {
                handleSaveTransfer();
              }
            }}
          />
          <SettingTextarea
            id="transfer-note"
            label={t("usage.transfer.note_label")}
            value={transferNote}
            onChange={setTransferNote}
            disabled={!!error?.isBlocker}
            placeholder={t("usage.transfer.note_placeholder")}
            minRows={2}
            maxRows={6}
            className="w-full sm:w-auto"
          />
        </div>
      ) : (
        <>
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
              includeTransfers={includeTransfers}
              onIncludeTransfersChange={setIncludeTransfers}
              onlyTransfers={onlyTransfers}
              onOnlyTransfersChange={setOnlyTransfers}
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
        </>
      )}
    </BaseSettingsPage>
    </>
  );
};

export default UsagePage;
