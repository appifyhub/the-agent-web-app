import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import BaseSettingsPage from "@/components/BaseSettingsPage";
import SettingInput from "@/components/SettingInput";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SERVICE_PROVIDERS } from "@/lib/service-providers";
import { cn, maskSecret, PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  PROVIDER_KEY_MAP,
} from "@/services/user-settings-service";
import { usePageSession } from "@/hooks/usePageSession";

const UserSettingsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const {
    error,
    accessToken,
    isLoadingState,
    setError,
    setIsLoadingState,
  } = usePageSession(user_id, undefined);

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(null);

  // Fetch user settings when session is ready
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

        setError(PageError.blocker(errorMessage, false));
      };

      handleSponsoredUser(accessToken.decoded.sponsored_by!);
      return;
    }

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const settings = await fetchUserSettings({
          apiBaseUrl,
          user_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched settings!", settings);
        setUserSettings(settings);
        setRemoteSettings(settings);
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker(t("errors.fetch_failed")));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchData();
  }, [accessToken, user_id, lang_iso_code, error?.isBlocker, setError, setIsLoadingState]);

  const isMaskedPropertyChanged = (
    localProperty: string | null | undefined,
    remoteProperty: string | null | undefined
  ): boolean => {
    if (!!localProperty !== !!remoteProperty) return true;
    if (!localProperty || !remoteProperty) return false;
    if (localProperty === remoteProperty) return false;
    if (maskSecret(localProperty) === remoteProperty) return false;
    return true;
  };

  const areSettingsChanged = !!(
    userSettings &&
    remoteSettings &&
    (isMaskedPropertyChanged(userSettings.open_ai_key, remoteSettings.open_ai_key) ||
      isMaskedPropertyChanged(userSettings.anthropic_key, remoteSettings.anthropic_key) ||
      isMaskedPropertyChanged(userSettings.rapid_api_key, remoteSettings.rapid_api_key) ||
      isMaskedPropertyChanged(userSettings.coin_api_key, remoteSettings.coin_api_key))
  );

  const handleSave = async () => {
    if (!userSettings || !remoteSettings || !user_id || !accessToken) return;
    
    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await saveUserSettings({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        open_ai_key: userSettings.open_ai_key ?? "",
        anthropic_key: userSettings.anthropic_key ?? "",
        rapid_api_key: userSettings.rapid_api_key ?? "",
        coin_api_key: userSettings.coin_api_key ?? "",
      });
      setRemoteSettings(userSettings);
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple(t("errors.save_failed")));
    } finally {
      setIsLoadingState(false);
    }
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  return (
    <BaseSettingsPage
      page="profile"
      expectedUserId={user_id}
      onActionClicked={handleSave}
      actionDisabled={!areSettingsChanged}
      isContentLoading={isLoadingState}
    >
      <div className="h-2" />
      <CardTitle className="text-center mx-auto">
        {t("configure_keys_title", { botName })}
      </CardTitle>
      <div className="h-10" />
      <Tabs
        defaultValue={SERVICE_PROVIDERS[0].id}
        className="w-full sm:w-x"
      >
        <TabsList
          className={cn(
            "flex flex-nowrap w-full rounded-full border-1",
            "border-muted-foreground/5 overflow-x-auto overflow-y-hidden",
            "justify-start px-0",
            "hidden" // for later use
          )}
        >
          {SERVICE_PROVIDERS.map((provider) => (
            <TabsTrigger
              className="min-w-max px-2 sm:px-4 py-4 text-[0.9rem] sm:text-[1.05rem] truncate cursor-pointer rounded-full transition-all"
              key={provider.id}
              value={provider.id}
              disabled={!!error?.isBlocker}
            >
              {provider.name}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="h-6" />
        {SERVICE_PROVIDERS.map((provider) => (
          <TabsContent key={provider.id} value={provider.id}>
            <SettingInput
              id={`token-${provider.id}`}
              label={t("provider_needed_for", {
                botName,
                tools: provider.tools,
              })}
              value={
                (userSettings?.[ 
                  PROVIDER_KEY_MAP[provider.id] as keyof typeof userSettings
                ] as string) || ""
              }
              onChange={(value) => {
                const key = PROVIDER_KEY_MAP[provider.id];
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
              placeholder={provider.placeholder}
              type="text"
              autoComplete="off"
              spellCheck={false}
              inputClassName="font-mono"
            />
            <div className="h-3" />
            <div className="flex items-center space-x-2 ps-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 text-accent-amber/70" />
              <a
                href={provider.token_management_url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-3 decoration-accent-amber/70 text-accent-amber/70"
              >
                {t("where_is_my_key", {
                  providerName: provider.name,
                })}
              </a>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
