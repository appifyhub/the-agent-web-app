import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { toast } from "sonner";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import ProvidersCarousel from "@/components/ProvidersCarousel";
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
      setRemoteSettings(userSettings);
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
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
      />
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
