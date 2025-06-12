import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Check,
  CheckCheck,
  VenetianMask,
  AtSign,
  CircleUserRound,
  CircleMinus,
} from "lucide-react";
import Header from "@/components/Header";
import TokenDataSheet from "@/components/TokenDataSheet";
import SettingInput from "@/components/SettingInput";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import ErrorMessage from "@/components/ErrorMessage";
import { PageError, cn, formatDate, cleanUsername } from "@/lib/utils";
import SettingControls from "@/components/SettingControls";
import SettingsPageSkeleton from "@/components/SettingsPageSkeleton";
import GenericPageSkeleton from "@/components/GenericPageSkeleton";
import { toast } from "sonner";
import { t } from "@/lib/translations";
import { fetchUserChats, ChatInfo } from "@/services/user-settings-service";
import {
  fetchUserSponsorships,
  createSponsorship,
  removeSponsorship,
  SponsorshipResponse,
} from "@/services/sponsorships-service";
import {
  AccessToken,
  TokenExpiredError,
  TokenMissingError,
} from "@/lib/tokens";

const SponsorshipsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { lang_iso_code, user_id } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const [error, setError] = useState<PageError | null>(null);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [sponsorships, setSponsorships] = useState<SponsorshipResponse[]>([]);
  const [maxSponsorships, setMaxSponsorships] = useState<number>(0);
  const [chats, setChats] = useState<ChatInfo[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [telegramUsername, setTelegramUsername] = useState<string>("");

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError(PageError.blocker(t("errors.expired")));
  };

  const sortSponsorships = (
    sponsorships: SponsorshipResponse[]
  ): SponsorshipResponse[] => {
    return [...sponsorships].sort((a, b) => {
      // 1. accepted_at (null goes first, then newest first)
      if (a.accepted_at === null && b.accepted_at !== null) return -1;
      if (a.accepted_at !== null && b.accepted_at === null) return 1;
      if (a.accepted_at !== null && b.accepted_at !== null) {
        const acceptedCompare =
          new Date(b.accepted_at).getTime() - new Date(a.accepted_at).getTime();
        if (acceptedCompare !== 0) return acceptedCompare;
      }

      // 2. sponsored_at (newest first)
      const sponsoredCompare =
        new Date(b.sponsored_at).getTime() - new Date(a.sponsored_at).getTime();
      if (sponsoredCompare !== 0) return sponsoredCompare;

      // 3. Display name (full_name or username)
      const aName = (a.full_name || a.telegram_username || "").toLowerCase();
      const bName = (b.full_name || b.telegram_username || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setTelegramUsername("");
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setTelegramUsername("");
  };

  const handleSaveSponsorship = async () => {
    const cleanTelegramUsername = cleanUsername(telegramUsername);
    if (!cleanTelegramUsername || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await createSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
        receiver_telegram_username: cleanTelegramUsername,
      });

      // Refresh the sponsorships list
      const sponsorshipsData = await fetchUserSponsorships({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
      });
      setSponsorships(sortSponsorships(sponsorshipsData.sponsorships));
      setMaxSponsorships(sponsorshipsData.max_sponsorships);

      // Exit editing mode and show success
      setIsEditing(false);
      setTelegramUsername("");
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error creating sponsorship!", saveError);
      setError(PageError.simple(t("errors.save_failed")));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleUnsponsor = async (sponsorship: SponsorshipResponse) => {
    if (!sponsorship.telegram_username || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await removeSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        receiver_telegram_username: sponsorship.telegram_username,
        rawToken: accessToken.raw,
      });

      // Remove the sponsorship from local state
      setSponsorships((prev) =>
        sortSponsorships(prev.filter((s) => s !== sponsorship))
      );

      // Collapse expanded items since the list changed
      setExpandedItems(new Set());
      toast(t("saved"));
    } catch (removeError) {
      console.error("Error removing sponsorship!", removeError);
      setError(PageError.simple(t("errors.save_failed")));
    } finally {
      setIsLoadingState(false);
    }
  };

  useEffect(() => {
    try {
      const rawToken = searchParams.get("token");
      const token = rawToken ? new AccessToken(rawToken) : null;
      setAccessToken(token);
      setError(null);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        handleTokenExpired();
      } else if (err instanceof TokenMissingError) {
        console.warn("No token found in the URL.");
        setError(PageError.blocker(t("errors.not_found")));
      } else {
        console.warn("Error decoding token:", err);
        setError(PageError.blocker(t("errors.not_valid")));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!accessToken || !user_id) {
      console.warn(
        "Missing session parameters." +
          `\n\tAccessToken: ${accessToken}` +
          `\n\tUser ID: ${user_id}`
      );
      setError(PageError.blocker(t("errors.misconfigured")));
      return;
    }

    if (accessToken.isExpired()) {
      handleTokenExpired();
      return;
    }

    console.info("Session parameters are available!", accessToken.decoded);
    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const [sponsorshipsData, chats] = await Promise.all([
          fetchUserSponsorships({
            apiBaseUrl,
            resource_id: user_id,
            rawToken: accessToken.raw,
          }),
          fetchUserChats({ apiBaseUrl, user_id, rawToken: accessToken.raw }),
        ]);
        console.info("Fetched sponsorships!", sponsorshipsData);
        setSponsorships(sortSponsorships(sponsorshipsData.sponsorships));
        setMaxSponsorships(sponsorshipsData.max_sponsorships);
        setChats(chats);
      } catch (err) {
        console.error("Error fetching sponsorships or chats!", err);
        setError(PageError.blocker(t("errors.fetch_failed")));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchData();
  }, [accessToken, user_id]);

  if (!accessToken && !error) {
    console.info("Rendering the loading state!");
    return (
      <div className="container mx-auto p-4 h-screen">
        <div className="flex flex-col items-center space-y-6 h-full justify-center p-9">
          <GenericPageSkeleton />
        </div>
      </div>
    );
  }

  const getDisplayName = (sponsorship: SponsorshipResponse) => {
    const { full_name, telegram_username } = sponsorship;

    if (full_name || telegram_username) {
      const showAtSign = !full_name && telegram_username;

      return (
        <div
          className={cn(
            "flex justify-center space-x-3 truncate overflow-hidden whitespace-nowrap",
            showAtSign ? "items-center" : "items-stretch"
          )}
        >
          {showAtSign ? (
            <AtSign className="h-5 w-5 text-blue-300 flex-shrink-0" />
          ) : (
            <CircleUserRound className="h-5 w-5 text-blue-300 translate-y-0.5 flex-shrink-0" />
          )}
          <span className="font-normal truncate overflow-hidden whitespace-nowrap">
            {full_name || telegram_username}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center space-x-2 truncate overflow-hidden whitespace-nowrap">
        <VenetianMask className="h-5 w-5 text-blue-300 flex-shrink-0" />
        <span className="font-normal truncate overflow-hidden whitespace-nowrap">
          {t("sponsorship.incognito")}
        </span>
      </div>
    );
  };

  const currentInterfaceLanguage =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;

  return (
    <div className="flex flex-col min-h-screen">
      {/* The Header section */}
      <Header
        pageTitle={t("sponsorships")}
        chats={chats}
        selectedChat={undefined}
        selectedLanguage={currentInterfaceLanguage}
        disabled={!!error?.isBlocker}
        onLangChange={(isoCode) => {
          console.info("Interface language changed to:", isoCode);
          const replacedHref = window.location.href.replace(
            `/${lang_iso_code}/`,
            `/${isoCode}/`
          );
          console.info("Replaced href:", replacedHref);
          window.location.href = replacedHref;
        }}
        onChatChange={(chatId) => {
          if (!chatId) {
            console.log("Chat deselected in Header (Sponsorships)");
            return;
          }
          const replacedHref = window.location.href.replace(
            `/user/${user_id}/sponsorships`,
            `/chat/${chatId}/settings`
          );
          console.info("Replaced href:", replacedHref);
          window.location.href = replacedHref;
        }}
      />

      {/* The Main content section */}
      <div className="mx-auto w-full max-w-3xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
          <main>
            {/* The Session Expiry timer */}
            <SettingControls
              expiryTimestamp={accessToken?.decoded?.exp || 0}
              onTokenExpired={handleTokenExpired}
              onActionClicked={
                isEditing ? handleSaveSponsorship : handleStartEditing
              }
              actionDisabled={
                isLoadingState ||
                !!error?.isBlocker ||
                (!isEditing && sponsorships.length >= maxSponsorships) ||
                (isEditing && !cleanUsername(telegramUsername).length)
              }
              showActionButton={true}
              actionButtonText={
                isEditing ? t("save") : t("sponsorship.add_sponsorship")
              }
              showCancelButton={isEditing}
              onCancelClicked={handleCancelEditing}
              cancelDisabled={isLoadingState || !!error?.isBlocker}
            />

            {/* The Sponsorships card */}
            <Card className="mt-4.5 mb-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
              <CardContent className="space-y-4">
                {isLoadingState ? (
                  <SettingsPageSkeleton />
                ) : isEditing ? (
                  <>
                    <CardTitle className="text-center mx-auto">
                      {t("sponsorship.add_sponsorship")}
                    </CardTitle>
                    <div className="h-4" />

                    {/* New sponsorship input */}
                    <SettingInput
                      id="telegram-username"
                      label={t("sponsorship.telegram_username_label")}
                      value={telegramUsername}
                      onChange={setTelegramUsername}
                      disabled={!!error?.isBlocker}
                      placeholder="@username"
                      onKeyboardConfirm={handleSaveSponsorship}
                    />
                  </>
                ) : (
                  <>
                    <CardTitle className="text-center mx-auto">
                      {t("sponsorship.users_you_sponsor")}
                    </CardTitle>
                    <div className="h-4" />

                    {/* Sponsorships List */}
                    <div className="flex flex-col space-y-0">
                      {sponsorships.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          {t("sponsorship.no_sponsorships_found")}
                        </div>
                      ) : (
                        sponsorships.map((sponsorship, index) => {
                          // Expanded state management
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

                          // Border classes
                          const isFirst = index === 0;
                          const isLast = index === sponsorships.length - 1;
                          let roundedClasses = "";
                          let borderClasses = "border-t-0";
                          if (sponsorships.length === 1) {
                            roundedClasses = "rounded-2xl";
                            borderClasses = "border-t-1";
                          } else if (isFirst) {
                            roundedClasses = "rounded-t-2xl";
                            borderClasses = "border-t-1";
                          } else if (isLast) {
                            roundedClasses = "rounded-b-2xl";
                          }

                          return (
                            // Full horizontal row - sponsorship item and delete button
                            <div
                              key={index}
                              className={cn(
                                "flex items-center justify-between w-full sm:w-sm mx-auto",
                                expandedItems.size > 0
                                  ? "space-x-4"
                                  : "space-x-0"
                              )}
                            >
                              {/* Expanded sponsorship stack (vertical) - display name row and dates */}
                              <div
                                className={cn(
                                  "flex flex-col px-5 py-4 items-start justify-center border glass cursor-pointer w-full min-w-0",
                                  isExpanded ? "space-y-2" : "space-y-0",
                                  roundedClasses,
                                  borderClasses
                                )}
                                onClick={toggleExpanded}
                              >
                                {/* Display name row (horizontal) - display name block and status icon */}
                                <div className="flex items-center justify-start max-w-full min-w-0 space-x-3">
                                  {/* Display name block (horizontal) */}
                                  <div className="flex-1 min-w-0">
                                    {getDisplayName(sponsorship)}
                                  </div>
                                  {/* Sponsorship status icon */}
                                  {!isExpanded &&
                                    (sponsorship.accepted_at ? (
                                      <CheckCheck className="h-4 w-4 text-success flex-shrink-0" />
                                    ) : (
                                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                                    ))}
                                </div>

                                {/* Bottom sponsorship stack (vertical) - status icons and dates */}
                                <div
                                  className={cn(
                                    "flex flex-col space-y-0 px-0.5",
                                    isExpanded ? "block" : "hidden"
                                  )}
                                >
                                  {/* Sponsored-at row (horizontal) */}
                                  <div className="flex items-center space-x-3.5">
                                    <Check className="h-4 w-4 text-success" />
                                    <span className="text-sm text-muted-foreground">
                                      {formatDate(
                                        sponsorship.sponsored_at,
                                        currentInterfaceLanguage.isoCode
                                      )}
                                    </span>
                                  </div>
                                  {/* Accepted-at row (horizontal) */}
                                  {sponsorship.accepted_at && (
                                    <div className="flex items-center space-x-3.5">
                                      <CheckCheck className="h-4 w-4 text-success" />
                                      <span className="text-sm text-muted-foreground">
                                        {formatDate(
                                          sponsorship.accepted_at,
                                          currentInterfaceLanguage.isoCode
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* Delete button */}
                              <CircleMinus
                                className={cn(
                                  "h-6 w-6 text-destructive flex-shrink-0",
                                  expandedItems.size > 0 ? "block" : "hidden",
                                  isExpanded
                                    ? "opacity-100 cursor-pointer hover:scale-110"
                                    : "opacity-0 cursor-default"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isExpanded) {
                                    handleUnsponsor(sponsorship);
                                  }
                                }}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Token Information */}
            <footer className="mt-6 text-xs mb-9 text-blue-300/30">
              {accessToken && <TokenDataSheet decoded={accessToken.decoded} />}
            </footer>
          </main>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title={t("errors.oh_no")}
          description={error?.text}
          genericMessage={t("errors.check_link")}
        />
      )}
    </div>
  );
};

export default SponsorshipsPage;
