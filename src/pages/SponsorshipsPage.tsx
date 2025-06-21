import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Check,
  CheckCheck,
  VenetianMask,
  AtSign,
  Link,
  UsersRound,
  Unlink,
  ChevronDown,
  UserRound,
} from "lucide-react";
import Header from "@/components/Header";
import TokenSummary from "@/components/TokenSummary";
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
  removeSelfSponsorship,
  SponsorshipResponse,
} from "@/services/sponsorships-service";
import {
  AccessToken,
  TokenExpiredError,
  TokenMissingError,
} from "@/lib/tokens";
import { Button } from "@/components/ui/button";

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

  const handleUnlinkSelf = async () => {
    if (!user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await removeSelfSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
      });

      // Redirect to the settings link provided by the API
      toast(t("saved"));
      window.location.href = response.settings_link;
    } catch (unlinkError) {
      console.error("Error unlinking self!", unlinkError);
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
            <AtSign className="h-5 w-5 text-accent-amber flex-shrink-0" />
          ) : (
            <UserRound className="h-5 w-5 text-accent-amber translate-y-0.5 flex-shrink-0" />
          )}
          <span className="font-normal truncate overflow-hidden whitespace-nowrap">
            {full_name || telegram_username}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center space-x-2 truncate overflow-hidden whitespace-nowrap">
        <VenetianMask className="h-5 w-5 text-accent-amber flex-shrink-0" />
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
        page="sponsorships"
        chats={chats}
        selectedLanguage={currentInterfaceLanguage}
        hasBlockerError={!!error?.isBlocker}
        userId={accessToken?.decoded?.sub}
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
                accessToken?.decoded?.sponsored_by
                  ? handleUnlinkSelf
                  : isEditing
                  ? handleSaveSponsorship
                  : handleStartEditing
              }
              actionDisabled={
                isLoadingState ||
                !!error?.isBlocker ||
                (!accessToken?.decoded?.sponsored_by &&
                  !isEditing &&
                  sponsorships.length >= maxSponsorships) ||
                (!accessToken?.decoded?.sponsored_by &&
                  isEditing &&
                  !cleanUsername(telegramUsername).length)
              }
              showActionButton={true}
              actionButtonText={
                accessToken?.decoded?.sponsored_by
                  ? t("sponsorship.unlink")
                  : isEditing
                  ? t("save")
                  : t("sponsorship.add_sponsorship")
              }
              showCancelButton={
                isEditing && !accessToken?.decoded?.sponsored_by
              }
              onCancelClicked={handleCancelEditing}
              cancelDisabled={isLoadingState || !!error?.isBlocker}
            />

            {/* The Sponsorships card */}
            <Card
              className={cn(
                "mt-4.5 mb-4.5",
                "md:px-6 px-2 md:py-12 py-8",
                "glass-static rounded-3xl"
              )}
            >
              <CardContent className="space-y-4 ">
                {isLoadingState ? (
                  <SettingsPageSkeleton />
                ) : accessToken?.decoded?.sponsored_by ? (
                  <>
                    <CardTitle className="text-center mx-auto">
                      {t("sponsorship.you_are_sponsored")}
                    </CardTitle>

                    {/* Sponsored user message */}
                    <div className="flex flex-col items-center space-y-10 text-center mt-12">
                      <Link className="h-12 w-12 text-accent-amber" />
                      <p className="text-foreground/80 font-light max-w-md">
                        {t("sponsorship.unlink_message", {
                          sponsorName: accessToken.decoded.sponsored_by,
                        })}
                      </p>
                    </div>
                  </>
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

                    {/* Sponsorships List */}
                    <div className="flex flex-col space-y-0">
                      {sponsorships.length === 0 ? (
                        <div className="flex flex-col items-center space-y-10 text-center mt-12">
                          <UsersRound className="h-12 w-12 text-accent-amber" />
                          <p className="text-foreground/80 font-light">
                            {t("sponsorship.no_sponsorships_found")}
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="h-6" />
                          {sponsorships.map((sponsorship, index) => {
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
                                  "transition-all duration-300 ease-in-out",
                                  expandedItems.size > 0
                                    ? "space-x-6"
                                    : "space-x-0"
                                )}
                              >
                                {/* Expanded sponsorship stack (vertical) - display name row and dates */}
                                <div
                                  className={cn(
                                    "flex flex-col px-5 py-3 items-start justify-center glass border cursor-pointer w-full min-w-0",
                                    isExpanded ? "space-y-2" : "space-y-0",
                                    roundedClasses,
                                    borderClasses
                                  )}
                                  onClick={toggleExpanded}
                                >
                                  {/* Display name row (horizontal) - display name block and status icon */}
                                  <div className="flex items-center w-full">
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                      <div className="min-w-0">
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
                                    {/* Right side: Chevron */}
                                    <ChevronDown
                                      className={cn(
                                        "h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform duration-300",
                                        isExpanded
                                          ? "text-foreground rotate-180"
                                          : "rotate-0"
                                      )}
                                    />
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
                                {(() => {
                                  const deleteButton = (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className={cn(
                                        "items-center justify-center glass rounded-full scale-130",
                                        "transition-all duration-300 ease-in-out",
                                        expandedItems.size > 0
                                          ? "flex"
                                          : "hidden",
                                        isExpanded
                                          ? "opacity-100 text-destructive cursor-pointer"
                                          : "opacity-0 text-destructive cursor-default",
                                        error?.isBlocker &&
                                          "text-muted-foreground cursor-not-allowed glass-static"
                                      )}
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        if (isExpanded && !error?.isBlocker) {
                                          handleUnsponsor(sponsorship);
                                        }
                                      }}
                                    >
                                      <Unlink
                                        className={cn(
                                          "text-destructive h-6 w-6",
                                          error?.isBlocker &&
                                            "text-muted-foreground"
                                        )}
                                      />
                                    </Button>
                                  );

                                  return isExpanded ? (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        {deleteButton}
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        {t("sponsorship.unlink")}
                                      </TooltipContent>
                                    </Tooltip>
                                  ) : (
                                    deleteButton
                                  );
                                })()}
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Token Information */}
            <footer className="mt-6 text-xs mb-9 text-blue-300/30">
              {accessToken && <TokenSummary decoded={accessToken.decoded} />}
            </footer>
          </main>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title={t("errors.oh_no")}
          description={error?.text}
          genericMessage={
            error?.showGenericAppendix ? t("errors.check_link") : undefined
          }
        />
      )}
    </div>
  );
};

export default SponsorshipsPage;
