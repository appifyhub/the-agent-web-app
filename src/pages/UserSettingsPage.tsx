import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import Header from "@/components/Header";
import TokenSummary from "@/components/TokenSummary";
import SettingInput from "@/components/SettingInput";
import { toast } from "sonner";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SERVICE_PROVIDERS } from "@/lib/service-providers";
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
  fetchUserChats,
  ChatInfo,
} from "@/services/user-settings-service";
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
  const [chats, setChats] = useState<ChatInfo[]>([]);

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

    console.info("Session parameters are available!", accessToken.decoded);

    const isSponsored = !!accessToken.decoded.sponsored_by;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

        if (isSponsored) {
          // For sponsored users, only fetch chats
          const chats = await fetchUserChats({
            apiBaseUrl,
            user_id,
            rawToken: accessToken.raw,
          });
          setChats(chats);

          // Set sponsored users, error after fetching chats
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
        } else {
          // For autonomous users, fetch both settings and chats
          const [settings, chats] = await Promise.all([
            fetchUserSettings({
              apiBaseUrl,
              user_id,
              rawToken: accessToken.raw,
            }),
            fetchUserChats({ apiBaseUrl, user_id, rawToken: accessToken.raw }),
          ]);
          console.info("Fetched settings!", settings);
          setUserSettings(settings);
          setRemoteSettings(settings);
          setChats(chats);
        }
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker(t("errors.fetch_failed")));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchData();
  }, [accessToken, user_id, lang_iso_code]);

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
        page="profile"
        chats={chats}
        selectedLanguage={currentInterfaceLanguage}
        hasBlockerError={!!error?.isBlocker}
        userId={accessToken?.decoded?.sub}
      />

      {/* The Main content section */}
      <div className="mx-auto w-full max-w-3xl">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow">
          <main>
            {/* The Session Expiry timer and Save button */}
            <SettingControls
              expiryTimestamp={accessToken?.decoded?.exp || 0}
              onTokenExpired={handleTokenExpired}
              onActionClicked={handleSave}
              actionDisabled={
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
                                PROVIDER_KEY_MAP[
                                  provider.id
                                ] as keyof typeof userSettings
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

export default UserSettingsPage;
