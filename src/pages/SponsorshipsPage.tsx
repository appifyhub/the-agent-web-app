import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
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
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import SettingInput from "@/components/SettingInput";
import { PageError, cn, formatDate, cleanUsername } from "@/lib/utils";
import { toast } from "sonner";
import { t } from "@/lib/translations";
import {
  fetchUserSponsorships,
  createSponsorship,
  removeSponsorship,
  removeSelfSponsorship,
  SponsorshipResponse,
} from "@/services/sponsorships-service";
import { usePageSession } from "@/hooks/usePageSession";
import { Button } from "@/components/ui/button";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";

const SponsorshipsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession(user_id, undefined);

  const [sponsorships, setSponsorships] = useState<SponsorshipResponse[]>([]);
  const [maxSponsorships, setMaxSponsorships] = useState<number>(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [platformHandle, setPlatformHandle] = useState<string>("");

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
      const aName = (a.full_name || a.platform_handle || "").toLowerCase();
      const bName = (b.full_name || b.platform_handle || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  // Fetch sponsorships when session is ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const sponsorshipsData = await fetchUserSponsorships({
          apiBaseUrl,
          resource_id: user_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched sponsorships!", sponsorshipsData);
        setSponsorships(sortSponsorships(sponsorshipsData.sponsorships));
        setMaxSponsorships(sponsorshipsData.max_sponsorships);
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchData();
  }, [accessToken, user_id, error, setError, setIsLoadingState]);

  const handleStartEditing = () => {
    setIsEditing(true);
    setPlatformHandle("");
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setPlatformHandle("");
  };

  const handleSaveSponsorship = async () => {
    const cleanPlatformHandle = cleanUsername(platformHandle);
    if (!cleanPlatformHandle || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await createSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
        platform_handle: cleanPlatformHandle,
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
      setPlatformHandle("");
      toast(t("saved"));
    } catch (err) {
      console.error("Error saving sponsorship!", err);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleUnsponsor = async (sponsorship: SponsorshipResponse) => {
    if (!sponsorship.platform_handle || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await removeSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        platform_handle: sponsorship.platform_handle,
        rawToken: accessToken.raw,
      });

      // Remove the sponsorship from local state
      setSponsorships((prev) =>
        sortSponsorships(prev.filter((s) => s !== sponsorship))
      );

      // Collapse expanded items since the list changed
      setExpandedItems(new Set());
      toast(t("saved"));
    } catch (err) {
      console.error("Error saving sponsorship!", err);
      setError(PageError.simple("errors.save_failed"));
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
    } catch (err) {
      console.error("Error saving sponsorship!", err);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const getDisplayName = (sponsorship: SponsorshipResponse) => {
    const { full_name, platform_handle } = sponsorship;

    if (full_name || platform_handle) {
      const showAtSign = !full_name && platform_handle;

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
            {full_name || platform_handle}
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

  // Action button logic
  const getActionButtonText = () => {
    if (accessToken?.decoded?.sponsored_by) {
      return t("sponsorship.unlink");
    }
    return isEditing ? t("save") : t("sponsorship.add_sponsorship");
  };

  const getActionHandler = () => {
    if (accessToken?.decoded?.sponsored_by) {
      return handleUnlinkSelf;
    }
    return isEditing ? handleSaveSponsorship : handleStartEditing;
  };

  const isActionDisabled = () => {
    if (
      !accessToken?.decoded?.sponsored_by &&
      !isEditing &&
      sponsorships.length >= maxSponsorships
    ) {
      return true;
    }
    if (
      !accessToken?.decoded?.sponsored_by &&
      isEditing &&
      !cleanUsername(platformHandle).length
    ) {
      return true;
    }
    return false;
  };

  const shouldShowCancelButton =
    isEditing && !accessToken?.decoded?.sponsored_by;

  return (
    <BaseSettingsPage
      page="sponsorships"
      onActionClicked={getActionHandler()}
      actionDisabled={isActionDisabled()}
      actionButtonText={getActionButtonText()}
      showCancelButton={shouldShowCancelButton}
      onCancelClicked={handleCancelEditing}
      isContentLoading={isLoadingState}
    >
      {accessToken?.decoded?.sponsored_by ? (
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
            id="platform-handle"
            label={t("sponsorship.platform_handle_label")}
            value={platformHandle}
            onChange={setPlatformHandle}
            disabled={!!error?.isBlocker}
            placeholder={t("sponsorship.platform_handle_placeholder")}
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
                        expandedItems.size > 0 ? "space-x-6" : "space-x-0"
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
                              expandedItems.size > 0 ? "flex" : "hidden",
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
                                error?.isBlocker && "text-muted-foreground"
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
    </BaseSettingsPage>
  );
};

export default SponsorshipsPage;
