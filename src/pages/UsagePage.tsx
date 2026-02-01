import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import { ChartNoAxesCombined } from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import { fetchUsageRecords, UsageRecord } from "@/services/usage-service";
import {
  fetchUserSponsorships,
  SponsorshipResponse,
} from "@/services/sponsorships-service";
import { usePageSession } from "@/hooks/usePageSession";
import { useChats } from "@/hooks/useChats";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import UsageRecordCard from "@/components/UsageRecordCard";
import { Button } from "@/components/ui/button";

const RECORDS_PER_PAGE = 50;

const UsagePage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { chats } = useChats(accessToken?.decoded?.sub, accessToken?.raw);

  const [usageRecords, setUsageRecords] = useState<UsageRecord[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipResponse[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);

  const currentInterfaceLanguage =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;

  // Fetch usage records and supporting data
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        const [records, sponsorshipsData] = await Promise.all([
          fetchUsageRecords({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
            limit: RECORDS_PER_PAGE + 1,
            include_sponsored: true,
          }),
          fetchUserSponsorships({
            apiBaseUrl,
            resource_id: user_id,
            rawToken: accessToken.raw,
          }),
        ]);

        console.info("Fetched usage records!", records.length);
        console.info("Fetched sponsorships!", sponsorshipsData);

        setSponsorships(sponsorshipsData.sponsorships);

        if (records.length > RECORDS_PER_PAGE) {
          setUsageRecords(records.slice(0, RECORDS_PER_PAGE));
          setHasMore(true);
        } else {
          setUsageRecords(records);
          setHasMore(false);
        }
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchData();
  }, [accessToken, user_id, error, setError, setIsLoadingState]);

  // Load more records
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
        include_sponsored: true,
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

      {/* Usage Records List */}
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
            <div className="h-6" />
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
