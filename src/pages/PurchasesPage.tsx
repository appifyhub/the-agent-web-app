import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCent, Clipboard, ShoppingCart, ReceiptCent, X, Plus } from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { PageError, buildSponsoredBlockerError } from "@/lib/utils";
import { toast } from "sonner";
import { t } from "@/lib/translations";
import {
  fetchPurchaseRecords,
  fetchPurchaseStats,
  bindLicenseKey,
  fetchProducts,
  PurchaseRecord,
  PurchaseAggregates,
  Product,
} from "@/services/purchase-service";
import ProductPickerDialog from "@/components/ProductPickerDialog";
import { usePageSession } from "@/hooks/usePageSession";
import { useUserSettings } from "@/hooks/useUserSettings";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { TimeRange, calculateDateRange } from "@/services/usage-service";
import PurchaseRecordCard from "@/components/PurchaseRecordCard";
import PurchaseFilters from "@/components/PurchaseFilters";
import PurchaseStats from "@/components/PurchaseStats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const RECORDS_PER_PAGE = 50;

const PurchasesPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { userSettings, refreshSettings } = useUserSettings(
    user_id,
    accessToken?.raw,
  );

  const [purchaseRecords, setPurchaseRecords] = useState<PurchaseRecord[]>([]);
  const [stats, setStats] = useState<PurchaseAggregates | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [licenseKey, setLicenseKey] = useState<string>("");

  const [timeRange, setTimeRange] = useState<TimeRange>("all");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [filtersExpanded, setFiltersExpanded] = useState<boolean>(false);

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

        const dateRange = calculateDateRange(timeRange);

        const [records, statsData] = await Promise.all([
          fetchPurchaseRecords({
            apiBaseUrl,
            resource_id: user_id,
            rawToken: accessToken.raw,
            limit: RECORDS_PER_PAGE + 1,
            product_id: selectedProduct !== "all" ? selectedProduct : undefined,
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
          }),
          fetchPurchaseStats({
            apiBaseUrl,
            resource_id: user_id,
            rawToken: accessToken.raw,
            product_id: selectedProduct !== "all" ? selectedProduct : undefined,
            start_date: dateRange.start_date,
            end_date: dateRange.end_date,
          }),
        ]);

        console.info("Fetched purchase records!", records.length);
        console.info("Fetched purchase stats!", statsData);

        setStats(statsData);

        if (records.length > RECORDS_PER_PAGE) {
          setPurchaseRecords(records.slice(0, RECORDS_PER_PAGE));
          setHasMore(true);
        } else {
          setPurchaseRecords(records);
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
    selectedProduct,
  ]);

  const handleLoadMore = async () => {
    if (!accessToken || !user_id || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const dateRange = calculateDateRange(timeRange);
      const records = await fetchPurchaseRecords({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
        skip: purchaseRecords.length,
        limit: RECORDS_PER_PAGE + 1,
        product_id: selectedProduct !== "all" ? selectedProduct : undefined,
        start_date: dateRange.start_date,
        end_date: dateRange.end_date,
      });

      if (records.length > RECORDS_PER_PAGE) {
        setPurchaseRecords((prev) => [
          ...prev,
          ...records.slice(0, RECORDS_PER_PAGE),
        ]);
        setHasMore(true);
      } else {
        setPurchaseRecords((prev) => [...prev, ...records]);
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more records!", err);
      setError(PageError.simple("errors.fetch_failed"));
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleStartEditing = () => {
    if (userSettings?.is_sponsored) {
      setError(buildSponsoredBlockerError(lang_iso_code!, user_id!));
      return;
    }
    setIsEditing(true);
    setLicenseKey("");
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setLicenseKey("");
  };

  const handleSaveLicenseKey = async () => {
    const cleanKey = licenseKey.trim();
    if (!cleanKey || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await bindLicenseKey({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
        license_key: cleanKey,
      });

      const dateRange = calculateDateRange(timeRange);
      const [records, statsData] = await Promise.all([
        fetchPurchaseRecords({
          apiBaseUrl,
          resource_id: user_id,
          rawToken: accessToken.raw,
          limit: RECORDS_PER_PAGE + 1,
          product_id: selectedProduct !== "all" ? selectedProduct : undefined,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        }),
        fetchPurchaseStats({
          apiBaseUrl,
          resource_id: user_id,
          rawToken: accessToken.raw,
          product_id: selectedProduct !== "all" ? selectedProduct : undefined,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
        }),
      ]);

      setStats(statsData);
      if (records.length > RECORDS_PER_PAGE) {
        setPurchaseRecords(records.slice(0, RECORDS_PER_PAGE));
        setHasMore(true);
      } else {
        setPurchaseRecords(records);
        setHasMore(false);
      }

      await refreshSettings();

      setIsEditing(false);
      setLicenseKey("");
      toast(t("purchases.bind_success"));
    } catch (err) {
      console.error("Error binding license key!", err);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handlePaste = async () => {
    try {
      if (window.navigator?.clipboard?.readText && window.isSecureContext) {
        const text = await window.navigator.clipboard.readText();
        setLicenseKey(text.trim());
        toast.success(t("pasted"));
      }
    } catch (err) {
      if (err instanceof Error && err.name === "NotAllowedError") {
        toast.error(t("purchases.paste_permission_denied"));
      } else {
        toast.error(t("purchases.paste_failed"));
      }
    }
  };

  const getActionIcon = () => {
    return isEditing ? undefined : <ShoppingCart className="h-5 w-5" />;
  };

  const getActionButtonText = () => {
    return isEditing ? t("save") : t("purchases.buy");
  };

  const getActionHandler = () => {
    return isEditing ? handleSaveLicenseKey : handleBuyMore;
  };

  const isActionDisabled = () => {
    if (isEditing && !licenseKey.trim().length) {
      return true;
    }
    return false;
  };

  const shouldShowCancelButton = isEditing;
  const shouldShowSecondaryButton = !isEditing;

  const handleBuyMore = () => {
    if (userSettings?.is_sponsored) {
      setError(buildSponsoredBlockerError(lang_iso_code!, user_id!));
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
      page="purchases"
      cardTitle={isEditing ? t("purchases.use_license") : t("purchases.card_title")}
      onActionClicked={getActionHandler()}
      actionDisabled={isActionDisabled()}
      actionIcon={getActionIcon()}
      actionButtonText={getActionButtonText()}
      showSecondaryButton={shouldShowSecondaryButton}
      onSecondaryClicked={handleStartEditing}
      secondaryIcon={<Plus className="h-5 w-5" />}
      secondaryText={t("purchases.license")}
      secondaryTooltipText={t("purchases.use_license")}
      secondaryClassName="glass-purple text-white"
      showCancelButton={shouldShowCancelButton}
      onCancelClicked={handleCancelEditing}
      cancelIcon={<X className="h-6 w-6" />}
      isContentLoading={isLoadingState}
      externalError={error}
    >
      {isEditing ? (
        <>
          <div className="space-y-4">
            <div className="flex items-center justify-between w-full max-w-2xl">
              <Label className="ps-2 text-[1.05rem] font-light">
                {t("purchases.license_key_label")}
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePaste}
                disabled={!!error?.isBlocker}
                className="glass rounded-full cursor-pointer h-8 w-8 p-0 shrink-0"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
            <Input
              id="license-key"
              className="py-6 px-6 w-full max-w-2xl text-[1.05rem] glass rounded-2xl"
              placeholder={t("purchases.license_key_placeholder")}
              disabled={!!error?.isBlocker}
              value={licenseKey}
              onChange={(e) => setLicenseKey(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !error?.isBlocker) {
                  handleSaveLicenseKey();
                }
              }}
            />
          </div>
        </>
      ) : (
        <>
          {userSettings?.credit_balance !== undefined && (
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

          {stats && <PurchaseStats stats={stats} />}

          {stats && (
            <PurchaseFilters
              timeRange={timeRange}
              selectedProduct={selectedProduct}
              onTimeRangeChange={setTimeRange}
              onProductChange={setSelectedProduct}
              stats={stats}
              disabled={isLoadingState}
              isExpanded={filtersExpanded}
              onExpandedChange={setFiltersExpanded}
            />
          )}

          <div className="flex flex-col space-y-6">
            {purchaseRecords.length === 0 ? (
              <div className="flex flex-col items-center space-y-10 text-center mt-12">
                <ReceiptCent className="h-12 w-12 text-accent-amber" />
                <p className="text-foreground/80 font-light">
                  {t("purchases.no_records_found")}
                </p>
              </div>
            ) : (
              <>
                <div className="h-2" />
                <div className="w-full mx-auto">
                  {purchaseRecords.map((record, index) => {
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
                      <PurchaseRecordCard
                        key={index}
                        record={record}
                        isExpanded={isExpanded}
                        onToggleExpand={toggleExpanded}
                        isFirst={index === 0}
                        isLast={index === purchaseRecords.length - 1}
                        isSingleItem={purchaseRecords.length === 1}
                        locale={currentInterfaceLanguage.isoCode}
                        userId={user_id!}
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
                      {isLoadingMore ? t("loading_placeholder") : t("purchases.load_more")}
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

export default PurchasesPage;
