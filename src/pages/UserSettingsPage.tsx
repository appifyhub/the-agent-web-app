import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { toast } from "sonner";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import ProvidersCarousel from "@/components/ProvidersCarousel";
import AdvancedToolsPanel from "@/components/AdvancedToolsPanel";
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
  ExternalToolsResponse,
  ToolType,
} from "@/services/external-tools-service";
import { usePageSession } from "@/hooks/usePageSession";
import { CarouselApi } from "@/components/ui/carousel";

const UserSettingsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession(user_id, undefined);

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(
    null
  );
  const [externalToolProviders, setExternalToolProviders] = useState<
    ExternalToolProvider[]
  >([]);
  const [externalToolsData, setExternalToolsData] =
    useState<ExternalToolsResponse | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  // Create navigation function that will be passed to the carousel
  const [providerNavigate, setProviderNavigate] = useState<
    ((providerId: string) => void) | null
  >(null);

  // Update navigation function when carousel API becomes available
  useEffect(() => {
    if (carouselApi && externalToolProviders.length > 0) {
      const navigationFn = (providerId: string) => {
        console.log("Navigation called for:", providerId);
        const index = externalToolProviders.findIndex(
          (p) => p.id === providerId
        );
        console.log("Provider index:", index);
        if (index !== -1) {
          carouselApi.scrollTo(index);
        }
      };
      setProviderNavigate(() => navigationFn);
    }
  }, [carouselApi, externalToolProviders]);

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
        setExternalToolsData(externalTools);
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchData();
  }, [accessToken, user_id, lang_iso_code, error, setError, setIsLoadingState]);

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
      setExternalToolsData(updatedExternalTools);
      setExternalToolProviders(
        updatedExternalTools.providers.map((p) => p.definition)
      );
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handleToolChoiceChange = (toolType: ToolType, toolId: string) => {
    const fieldName = `tool_choice_${toolType}` as keyof UserSettings;
    setUserSettings((prev) =>
      prev
        ? {
            ...prev,
            [fieldName]: toolId,
          }
        : prev
    );
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  return (
    <BaseSettingsPage
      page="profile"
      onActionClicked={handleSave}
      actionDisabled={!hasSettingsChanged}
      isContentLoading={isLoadingState}
      externalError={error}
    >
      <div className="h-2" />
      <CardTitle className="text-center mx-auto">
        {t("configure_keys_title", { botName })}
      </CardTitle>
      <div className="h-4" />
      <ProvidersCarousel
        providers={externalToolProviders}
        userSettings={userSettings}
        onSettingChange={(providerId, value) => {
          const key = getSettingsFieldName(providerId);
          if (!key) return;
          setUserSettings((prev) =>
            prev
              ? {
                  ...prev,
                  [key]: value,
                }
              : prev
          );
        }}
        disabled={!!error?.isBlocker}
        setApi={setCarouselApi}
        setNavigationApi={setProviderNavigate}
      />

      <div className="h-8" />

      {/* Advanced Options Section */}
      {!showAdvancedOptions ? (
        <div className="text-center">
          <button
            onClick={() => setShowAdvancedOptions(true)}
            disabled={!!error?.isBlocker}
            className="text-accent-amber hover:text-white text-sm px-4 py-2 font-normal transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("tools.show_options")}
          </button>
        </div>
      ) : (
        externalToolsData && (
          <AdvancedToolsPanel
            tools={externalToolsData.tools}
            providers={externalToolsData.providers}
            userSettings={userSettings}
            onToolChoiceChange={handleToolChoiceChange}
            disabled={!!error?.isBlocker}
            onProviderNavigate={providerNavigate || undefined}
          />
        )
      )}
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
