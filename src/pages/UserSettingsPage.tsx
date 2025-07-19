import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import SettingInput from "@/components/SettingInput";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn, PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
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
  formatToolsForDisplay as format,
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
      {externalToolProviders.length > 0 ? (
        <Tabs
          defaultValue={externalToolProviders[0]?.id}
          className="w-full sm:w-x"
        >
          <TabsList
            className={cn(
              "flex flex-nowrap w-full rounded-full border-1",
              "border-muted-foreground/5 overflow-x-auto overflow-y-hidden",
              "justify-start px-0"
            )}
          >
            {externalToolProviders.map((provider) => (
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
          <div className="h-2" />
          {externalToolProviders.map((provider) => (
            <TabsContent key={provider.id} value={provider.id}>
              <SettingInput
                id={`token-${provider.id}`}
                label={t("provider_needed_for", {
                  botName,
                  tools: format(provider.tools),
                })}
                value={
                  (userSettings?.[
                    getSettingsFieldName(
                      provider.id
                    ) as keyof typeof userSettings
                  ] as string) || ""
                }
                onChange={(value) => {
                  const key = getSettingsFieldName(provider.id);
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
                placeholder={provider.token_format}
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
      ) : (
        <div className="text-center text-muted-foreground">
          {isLoadingState ? t("loading_placeholder") : t("errors.not_found")}
        </div>
      )}
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
