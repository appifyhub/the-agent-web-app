import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { toast } from "sonner";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import WarningBanner from "@/components/WarningBanner";
import ProvidersCarousel from "@/components/ProvidersCarousel";
import ProviderTabs from "@/components/ProviderTabs";
import {
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  getSettingsFieldName,
  buildChangedPayload,
  areSettingsChanged,
} from "@/services/user-settings-service";
import {
  fetchExternalTools,
  ExternalToolProvider,
} from "@/services/external-tools-service";
import { usePageSession } from "@/hooks/usePageSession";
import { useNavigation } from "@/hooks/useNavigation";
import { CarouselApi } from "@/components/ui/carousel";

const AccessSettingsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { navigateToIntelligence } = useNavigation();

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(
    null
  );
  const [externalToolProviders, setExternalToolProviders] = useState<
    ExternalToolProvider[]
  >([]);
  const [providerConfigStatus, setProviderConfigStatus] = useState<
    Map<string, boolean>
  >(new Map());
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentProviderIndex, setCurrentProviderIndex] = useState(0);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);
  const isRestoringPosition = useRef(false);
  const hasLoadedOnce = useRef(false);
  const indexToRestore = useRef<number | null>(null);

  // Fetch user settings and service providers when session is ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const isSponsored = !!accessToken.decoded.sponsored_by;

    if (isSponsored) {
      // Handle sponsored user with error after session is established
      const handleSponsoredUser = (sponsorName: string) => {
        console.warn("User is sponsored by:", sponsorName);
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
      };

      handleSponsoredUser(accessToken.decoded.sponsored_by!);
      return;
    }

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        // Fetch both user settings and external tools in parallel
        const [settings, externalTools] = await Promise.all([
          fetchUserSettings({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
          }),
          fetchExternalTools({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
          }),
        ]);

        console.info("Fetched settings!", settings);
        console.info("Fetched external tools!", externalTools);

        setUserSettings(settings);
        setRemoteSettings(settings);
        setExternalToolProviders(
          externalTools.providers.map((p) => p.definition)
        );
        // Store provider configuration status
        const statusMap = new Map<string, boolean>();
        externalTools.providers.forEach((p) => {
          statusMap.set(p.definition.id, p.is_configured);
        });
        setProviderConfigStatus(statusMap);
        hasLoadedOnce.current = true;
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchData();
  }, [accessToken, user_id, lang_iso_code, error, setError, setIsLoadingState]);

  // Track carousel position (only on user interaction, not programmatic scrolls)
  useEffect(() => {
    if (!carouselApi) return;

    const updateIndex = () => {
      const currentIndex = carouselApi.selectedScrollSnap();
      setCurrentProviderIndex(currentIndex);

      if (!isRestoringPosition.current) {
        // Store index for potential restore after save
        indexToRestore.current = currentIndex;
      }
      isRestoringPosition.current = false;
    };

    // Set initial index
    updateIndex();

    carouselApi.on("select", updateIndex);

    return () => {
      carouselApi.off("select", updateIndex);
    };
  }, [carouselApi]);

  // Restore carousel position when providers change (only after save/refetch, not on user navigation)
  useEffect(() => {
    if (!carouselApi || externalToolProviders.length === 0) return;

    const scrollToProviderId = sessionStorage.getItem("scrollToProvider");
    if (scrollToProviderId) {
      // Navigation from Intelligence page - scroll to that provider (works on first load too)
      const index = externalToolProviders.findIndex(
        (p) => p.id === scrollToProviderId
      );
      if (index !== -1) {
        isRestoringPosition.current = true;
        setTimeout(() => {
          carouselApi.scrollTo(index);
          indexToRestore.current = index;
          sessionStorage.removeItem("scrollToProvider");
        }, 100);
      } else {
        sessionStorage.removeItem("scrollToProvider");
      }
    } else if (hasLoadedOnce.current && indexToRestore.current !== null) {
      // Restore position after save/refetch (only if we have a stored index)
      // Use jump=true to restore instantly without animation
      const targetIndex = Math.min(
        indexToRestore.current,
        externalToolProviders.length - 1
      );
      if (targetIndex >= 0 && targetIndex < externalToolProviders.length) {
        isRestoringPosition.current = true;
        setTimeout(() => {
          carouselApi.scrollTo(targetIndex, true);
        }, 50);
      }
    }
  }, [carouselApi, externalToolProviders]);

  const hasSettingsChanged = !!(
    userSettings &&
    remoteSettings &&
    areSettingsChanged(userSettings, remoteSettings)
  );

  const handleSave = async () => {
    if (!userSettings || !remoteSettings || !user_id || !accessToken) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      // Only send fields that have actually changed (smart diffing)
      const payload = buildChangedPayload(userSettings, remoteSettings);

      await saveUserSettings({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        payload,
      });

      // Refetch external tools data to get updated is_configured status
      const updatedExternalTools = await fetchExternalTools({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
      });

      setRemoteSettings(userSettings);
      setExternalToolProviders(
        updatedExternalTools.providers.map((p) => p.definition)
      );
      // Update provider configuration status
      const statusMap = new Map<string, boolean>();
      updatedExternalTools.providers.forEach((p) => {
        statusMap.set(p.definition.id, p.is_configured);
      });
      setProviderConfigStatus(statusMap);
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleProviderTabClick = (index: number) => {
    if (carouselApi) {
      carouselApi.scrollTo(index);
    }
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  // Check if any API keys are configured in local state
  const hasAnyApiKey = !!(
    userSettings?.open_ai_key ||
    userSettings?.anthropic_key ||
    userSettings?.google_ai_key ||
    userSettings?.perplexity_key ||
    userSettings?.replicate_key ||
    userSettings?.rapid_api_key ||
    userSettings?.coinmarketcap_key
  );

  // Check if user has credits
  const hasCredits = (userSettings?.credit_balance ?? 0) > 0;

  // Show warning only if user has credits AND API keys AND hasn't dismissed it
  const showCreditsWarning = hasCredits && hasAnyApiKey && !isWarningDismissed;

  const handleRemoveAllApiKeys = () => {
    if (!userSettings) return;

    const clearedSettings = { ...userSettings };
    // Clear all API keys
    delete clearedSettings.open_ai_key;
    delete clearedSettings.anthropic_key;
    delete clearedSettings.google_ai_key;
    delete clearedSettings.perplexity_key;
    delete clearedSettings.replicate_key;
    delete clearedSettings.rapid_api_key;
    delete clearedSettings.coinmarketcap_key;

    setUserSettings(clearedSettings);
    toast(t("access_keys_cleared_message"));
  };

  return (
    <BaseSettingsPage
      page="access"
      cardTitle={t("access_card_title", { botName })}
      onActionClicked={handleSave}
      actionDisabled={!hasSettingsChanged}
      isContentLoading={isLoadingState}
      externalError={error}
    >
      {showCreditsWarning && (
        <WarningBanner
          message={t("access_use_credits_warning_prefix")}
          destructiveLabel={t("access_remove_all_keys")}
          destructiveOnClick={handleRemoveAllApiKeys}
          onDismiss={() => setIsWarningDismissed(true)}
        />
      )}
      {showCreditsWarning && <div className="h-7" />}

      <ProviderTabs
        providers={externalToolProviders}
        selectedIndex={currentProviderIndex}
        onProviderClick={handleProviderTabClick}
        disabled={!!error?.isBlocker}
      />

      <ProvidersCarousel
        providers={externalToolProviders}
        userSettings={userSettings}
        providerConfigStatus={providerConfigStatus}
        onSettingChange={(providerId, value) => {
          const key = getSettingsFieldName(providerId);
          if (!key) return;
          setUserSettings((prev) =>
            prev
              ? {
                  ...prev,
                  [key]: value,
                }
              : prev,
          );
        }}
        disabled={!!error?.isBlocker}
        setApi={setCarouselApi}
        onNavigateToIntelligence={() => {
          if (user_id && lang_iso_code) {
            navigateToIntelligence(user_id, lang_iso_code);
          }
        }}
      />
    </BaseSettingsPage>
  );
};

export default AccessSettingsPage;
