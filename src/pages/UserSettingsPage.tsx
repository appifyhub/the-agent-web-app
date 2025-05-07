import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import logoVector from "@/assets/logo-vector.svg";
import Header from "@/components/Header";
import TokenDataSheet from "@/components/TokenDataSheet";
import { toast } from "sonner";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SERVICE_PROVIDERS } from "@/lib/service-providers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorMessage from "@/components/ErrorMessage";
import { cn, maskSecret, PageError } from "@/lib/utils";
import SettingControls from "@/components/SettingControls";
import SettingsPageSkeleton from "@/components/SettingsPageSkeleton";
import GenericPageSkeleton from "@/components/GenericPageSkeleton";
import { t } from "@/lib/translations";
import {
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  PROVIDER_KEY_MAP,
} from "@/services/UserSettingsService";
import {
  AccessToken,
  TokenExpiredError,
  TokenMissingError,
} from "@/lib/tokens";

const UserSettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { lang_iso_code, user_id } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const [error, setError] = useState<PageError | null>(null);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(
    null
  );

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError(PageError.blocker(t("errors.expired")));
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

    console.info("Session parameters are available!");
    const fetchSettings = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const data = await fetchUserSettings({
          apiBaseUrl,
          user_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched settings!", data);
        setUserSettings(data);
        setRemoteSettings(data);
      } catch (fetchError) {
        console.error("Error fetching settings!", fetchError);
        setError(PageError.blocker(t("errors.fetch_failed")));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchSettings();
  }, [accessToken, user_id]);

  const isMaskedPropertyChanged = (
    localProperty: string | null | undefined,
    remoteProperty: string | null | undefined
  ): boolean => {
    if (!!localProperty !== !!remoteProperty) return true; // one is missing and the other is there
    if (!localProperty || !remoteProperty) return false; // both are missing (because of the first line)
    if (localProperty === remoteProperty) return false; // same exact value
    if (maskSecret(localProperty) === remoteProperty) return false; // masked value is the same
    return true; // different values
  };

  const areSettingsChanged = !!(
    userSettings &&
    remoteSettings &&
    (isMaskedPropertyChanged(
      userSettings.open_ai_key,
      remoteSettings.open_ai_key
    ) ||
      isMaskedPropertyChanged(
        userSettings.anthropic_key,
        remoteSettings.anthropic_key
      ) ||
      isMaskedPropertyChanged(
        userSettings.rapid_api_key,
        remoteSettings.rapid_api_key
      ) ||
      isMaskedPropertyChanged(
        userSettings.coin_api_key,
        remoteSettings.coin_api_key
      ))
  );

  const handleSave = async () => {
    if (!userSettings || !remoteSettings) return;
    if (!user_id || !accessToken) return;
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

  const botName = import.meta.env.VITE_APP_NAME_SHORT;
  const currentInterfaceLanguage =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;

  return (
    <div className="flex flex-col min-h-screen">
      {/* The Header section */}
      <Header
        boldSectionContent={t("profile")}
        regularSectionContent={accessToken?.decoded?.aud || ""}
        currentLanguage={currentInterfaceLanguage}
        supportedLanguages={INTERFACE_LANGUAGES}
        iconUrl={logoVector}
        onLangChange={(isoCode) => {
          console.info("Interface language changed to:", isoCode);
          const replacedHref = window.location.href.replace(
            `/${lang_iso_code}/`,
            `/${isoCode}/`
          );
          console.info("Replaced href:", replacedHref);
          window.location.href = replacedHref;
        }}
      />

      {/* The Main content section */}
      <div className="mx-auto w-full max-w-3xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
          <main>
            {/* The Session Expiry timer and Save button */}
            <SettingControls
              expiryTimestamp={accessToken?.decoded?.exp || 0}
              onTokenExpired={handleTokenExpired}
              onSaveClicked={handleSave}
              saveLabel={"Save"}
              disabled={
                !areSettingsChanged || isLoadingState || !!error?.isBlocker
              }
            />
            {/* The Settings card */}
            <Card className="mt-4.5 mb-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
              <CardContent className="flex flex-col h-full justify-center">
                {isLoadingState ? (
                  <SettingsPageSkeleton />
                ) : (
                  <>
                    <div className="h-2" />
                    <CardTitle className="text-center mx-auto">
                      {t("configure_keys_title", { botName })}
                    </CardTitle>
                    <div className="h-10" />
                    <Tabs
                      defaultValue={SERVICE_PROVIDERS[0].id}
                      className="w-full sm:w-x"
                    >
                      <TabsList className="flex flex-nowrap w-full rounded-full border-1 border-muted-foreground/5 overflow-x-auto overflow-y-hidden justify-start px-0">
                        {SERVICE_PROVIDERS.map((provider) => (
                          <TabsTrigger
                            className="min-w-max px-2 sm:px-4 py-4 text-[0.9rem] sm:text-[1.05rem] truncate cursor-pointer rounded-full transition-all"
                            key={provider.id}
                            value={provider.id}
                            disabled
                          >
                            {provider.name}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                      <div className="h-6" />
                      {SERVICE_PROVIDERS.map((provider) => (
                        <TabsContent key={provider.id} value={provider.id}>
                          <div className="space-y-4">
                            <Label
                              htmlFor={`token-${provider.id}`}
                              className={cn(
                                "ps-2 text-[1.05rem] font-light",
                                error?.isBlocker
                                  ? "text-muted-foreground/50"
                                  : ""
                              )}
                            >
                              {t("provider_needed_for", {
                                botName,
                                tools: provider.tools,
                              })}
                            </Label>
                            <Input
                              id={`token-${provider.id}`}
                              className="py-6 px-6 w-full sm:w-xs text-[1.05rem] glass rounded-xl font-mono"
                              type="none"
                              autoComplete="off"
                              spellCheck={false}
                              aria-autocomplete="none"
                              placeholder={
                                error?.isBlocker ? "—" : provider.placeholder
                              }
                              disabled={!!error?.isBlocker}
                              value={
                                userSettings?.[
                                  PROVIDER_KEY_MAP[
                                    provider.id
                                  ] as keyof typeof userSettings
                                ] || ""
                              }
                              onChange={(e) => {
                                const key = PROVIDER_KEY_MAP[provider.id];
                                if (!key) return;
                                setUserSettings((prev) =>
                                  prev
                                    ? {
                                        ...prev,
                                        [key]: e.target.value,
                                      }
                                    : prev
                                );
                              }}
                            />
                          </div>
                          <div className="h-2" />
                          <div className="flex items-center space-x-2 ps-2 text-sm text-muted-foreground">
                            <Info className="h-4 w-4 text-blue-300/50" />
                            <a
                              href={provider.token_management_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dotted-underline text-blue-300/50"
                            >
                              {t("where_is_my_key", {
                                providerName: provider.name,
                              })}
                            </a>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Token Information */}
            <footer className="mt-6 text-xs mb-9 text-blue-300/30">
              {accessToken && (
                <TokenDataSheet
                  decoded={accessToken.decoded}
                  labels={{
                    chatRole: t("token_info.chat_role"),
                    telegramUsername: t("token_info.telegram_username"),
                    telegramUserId: t("token_info.telegram_user_id"),
                    profileId: t("token_info.profile_id"),
                    chatId: t("token_info.chat_id"),
                  }}
                  copiedMessage={t("copied")}
                  iconClassName="w-4 h-4 text-blue-300/30"
                />
              )}
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

export default UserSettingsPage;
