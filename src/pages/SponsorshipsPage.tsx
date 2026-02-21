import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
  UserX,
  ChevronDown,
  UserRound,
  Phone,
} from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
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
import { Platform } from "@/lib/platform";
import { usePageSession } from "@/hooks/usePageSession";
import { useUserSettings } from "@/hooks/useUserSettings";
import PlatformDropdown from "@/components/PlatformDropdown";
import PlatformIcon from "@/components/PlatformIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { fetchExternalTools } from "@/services/external-tools-service";

const SponsorshipsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { userSettings, refreshSettings } = useUserSettings(user_id, accessToken?.raw);

  const [sponsorships, setSponsorships] = useState<SponsorshipResponse[]>([]);
  const [maxSponsorships, setMaxSponsorships] = useState<number>(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [platformHandle, setPlatformHandle] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    Platform.TELEGRAM
  );
  const [hasApiKeysConfigured, setHasApiKeysConfigured] =
    useState<boolean>(false);

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

  // Fetch sponsorships and external tools when session is ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const [sponsorshipsData, externalTools] = await Promise.all([
          fetchUserSponsorships({
            apiBaseUrl,
            resource_id: user_id,
            rawToken: accessToken.raw,
          }),
          fetchExternalTools({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
          }),
        ]);
        console.info("Fetched sponsorships!", sponsorshipsData);
        console.info("Fetched external tools!", externalTools);
        setSponsorships(sortSponsorships(sponsorshipsData.sponsorships));
        setMaxSponsorships(sponsorshipsData.max_sponsorships);

        // Check if any provider has API keys configured
        const hasConfiguredProviders = externalTools.providers.some(
          (provider) => provider.is_configured
        );
        setHasApiKeysConfigured(hasConfiguredProviders);
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
    setSelectedPlatform(Platform.TELEGRAM);
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
        platform: selectedPlatform,
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
      setSelectedPlatform(Platform.TELEGRAM);
      toast(t("saved"));
    } catch (err) {
      console.error("Error saving sponsorship!", err);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleUnsponsor = async (sponsorship: SponsorshipResponse) => {
    if (!sponsorship.platform_handle || !sponsorship.platform || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await removeSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        platform_handle: cleanUsername(sponsorship.platform_handle),
        platform: sponsorship.platform,
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
      await removeSelfSponsorship({
        apiBaseUrl,
        resource_id: user_id,
        rawToken: accessToken.raw,
      });
      toast(t("saved"));
      await refreshSettings();
    } catch (err) {
      console.error("Error saving sponsorship!", err);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const getDisplayName = (sponsorship: SponsorshipResponse) => {
    const { full_name, platform_handle, platform } = sponsorship;

    if (full_name || platform_handle) {
      let prefixIcon = null;
      let prefixChar = "";

      if (!full_name && platform_handle) {
        if (platform === Platform.WHATSAPP) {
          prefixIcon = <Phone className="h-5 w-5 text-accent-amber shrink-0" />;
          prefixChar = "+";
        } else if (platform === Platform.TELEGRAM) {
          prefixIcon = (
            <AtSign className="h-5 w-5 text-accent-amber shrink-0" />
          );
        } else {
          prefixIcon = (
            <UserRound className="h-5 w-5 text-accent-amber translate-y-0.5 shrink-0" />
          );
        }
      } else if (full_name) {
        prefixIcon = (
          <UserRound className="h-5 w-5 text-accent-amber translate-y-0.5 shrink-0" />
        );
      }

      return (
        <div
          className={cn(
            "flex justify-center space-x-3 truncate overflow-hidden whitespace-nowrap",
            prefixIcon !== null ? "items-center" : "items-stretch"
          )}
        >
          {prefixIcon}
          <span className="font-normal truncate overflow-hidden whitespace-nowrap">
            {prefixChar}
            {full_name || platform_handle}
          </span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center space-x-2 truncate overflow-hidden whitespace-nowrap">
        <VenetianMask className="h-5 w-5 text-accent-amber shrink-0" />
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
    if (userSettings?.is_sponsored) {
      return t("sponsorship.unlink");
    }
    return isEditing ? t("save") : t("sponsorship.add_sponsorship");
  };

  const getActionHandler = () => {
    if (userSettings?.is_sponsored) {
      return handleUnlinkSelf;
    }
    return isEditing ? handleSaveSponsorship : handleStartEditing;
  };

  const isActionDisabled = () => {
    // Disable if no API keys configured (only when trying to sponsor, not when unlinking)
    if (
      !userSettings?.is_sponsored &&
      !isEditing &&
      !hasApiKeysConfigured
    ) {
      return true;
    }
    if (
      !userSettings?.is_sponsored &&
      !isEditing &&
      sponsorships.length >= maxSponsorships
    ) {
      return true;
    }
    if (
      !userSettings?.is_sponsored &&
      isEditing &&
      !cleanUsername(platformHandle).length
    ) {
      return true;
    }
    return false;
  };

  const shouldShowCancelButton =
    isEditing && !userSettings?.is_sponsored;

  // Get platform-specific placeholder
  const getPlatformPlaceholder = (): string => {
    if (error?.isBlocker) return "—";

    switch (selectedPlatform) {
      case Platform.TELEGRAM:
        return t("sponsorship.platform_handle_placeholder_telegram");
      case Platform.WHATSAPP:
        return t("sponsorship.platform_handle_placeholder_whatsapp");
      default:
        return t("sponsorship.platform_handle_placeholder");
    }
  };

  return (
    <BaseSettingsPage
      page="sponsorships"
      cardTitle={
        userSettings?.is_sponsored
          ? t("sponsorship.you_are_sponsored")
          : isEditing
          ? t("sponsorship.add_sponsorship")
          : t("sponsorship.users_you_sponsor")
      }
      onActionClicked={getActionHandler()}
      actionDisabled={isActionDisabled()}
      actionButtonText={getActionButtonText()}
      showCancelButton={shouldShowCancelButton}
      onCancelClicked={handleCancelEditing}
      isContentLoading={isLoadingState}
    >
      {userSettings?.is_sponsored ? (
        <>
          {/* Sponsored user message */}
          <div className="flex flex-col items-center space-y-10 text-center mt-12">
            <Link className="h-12 w-12 text-accent-amber" />
            <p className="text-[1.05rem] font-light text-justify md:text-left [hyphens:auto] opacity-80">
              {t("sponsorship.unlink_message")}
            </p>
          </div>
        </>
      ) : isEditing ? (
        <>
          {/* New sponsorship input with platform dropdown */}
          <div className="space-y-4">
            <Label className="ps-2 text-[1.05rem] font-light">
              {t("sponsorship.platform_handle_label")}
            </Label>
            <div className="flex space-x-3">
              <PlatformDropdown
                selectedPlatform={selectedPlatform}
                onPlatformChange={setSelectedPlatform}
              />
              <Input
                id="platform-handle"
                className="py-6 px-6 w-full max-w-2xl text-[1.05rem] glass rounded-2xl"
                placeholder={getPlatformPlaceholder()}
                disabled={!!error?.isBlocker}
                value={platformHandle}
                onChange={(e) => setPlatformHandle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !error?.isBlocker) {
                    handleSaveSponsorship();
                  }
                }}
              />
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Sponsorships List */}
          <div className="flex flex-col space-y-0">
            {sponsorships.length === 0 ? (
              <div className="flex flex-col items-center space-y-10 text-center mt-12">
                <UsersRound className="h-12 w-12 text-accent-amber" />
                <p className="text-foreground/80 font-light">
                  {!hasApiKeysConfigured
                    ? t("sponsorship.configure_ai_access_first")
                    : t("sponsorship.no_sponsorships_found")}
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
                    <div
                      key={index}
                      className={cn(
                        "flex flex-col px-5 items-start justify-center glass-muted border cursor-pointer w-full",
                        isExpanded ? "space-y-4 py-4" : "space-y-0 py-3",
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
                              <CheckCheck className="h-4 w-4 text-success shrink-0" />
                            ) : (
                              <Check className="h-4 w-4 text-success shrink-0" />
                            ))}
                        </div>
                        {/* Right side: Chevron */}
                        <ChevronDown
                          className={cn(
                            "h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300",
                            isExpanded
                              ? "text-foreground rotate-180"
                              : "rotate-0"
                          )}
                        />
                      </div>

                      <div
                        className={cn(
                          "flex items-center justify-between w-full",
                          isExpanded ? "flex" : "hidden"
                        )}
                      >
                        <div className="flex flex-col space-y-1 px-0.5 flex-1 min-w-0">
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <PlatformIcon
                              platform={sponsorship.platform ?? Platform.UNKNOWN}
                              className="h-4 w-4 shrink-0"
                            />
                            <span className="text-sm text-muted-foreground truncate">
                              {Platform.getName(sponsorship.platform ?? Platform.UNKNOWN)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3.5 min-w-0">
                            <Check className="h-4 w-4 text-success shrink-0" />
                            <span className="text-sm text-muted-foreground truncate">
                              {formatDate(
                                sponsorship.sponsored_at,
                                currentInterfaceLanguage.isoCode
                              )}
                            </span>
                          </div>
                          {sponsorship.accepted_at && (
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <CheckCheck className="h-4 w-4 text-success shrink-0" />
                              <span className="text-sm text-muted-foreground truncate">
                                {formatDate(
                                  sponsorship.accepted_at,
                                  currentInterfaceLanguage.isoCode
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className={cn(
                                "shrink-0 rounded-full cursor-pointer glass",
                                error?.isBlocker
                                  ? "text-muted-foreground cursor-not-allowed"
                                  : "text-destructive"
                              )}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                if (!error?.isBlocker) {
                                  handleUnsponsor(sponsorship);
                                }
                              }}
                              disabled={!!error?.isBlocker}
                            >
                              <UserX
                                className={cn(
                                  "h-5 w-5",
                                  error?.isBlocker && "text-muted-foreground"
                                )}
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {t("sponsorship.unlink")}
                          </TooltipContent>
                        </Tooltip>
                      </div>
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
