import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import logoVector from "@/assets/logo-vector.svg";
import Header from "@/components/Header";
import SettingControls from "@/components/SettingControls";
import TokenDataSheet from "@/components/TokenDataSheet";
import SettingSelector from "@/components/SettingSelector";
import ErrorMessage from "@/components/ErrorMessage";
import { toast } from "sonner";
import { PageError } from "@/lib/utils";
import SettingsPageSkeleton from "@/components/SettingsPageSkeleton";
import GenericPageSkeleton from "@/components/GenericPageSkeleton";
import {
  fetchChatSettings,
  saveChatSettings,
  ChatSettings,
} from "@/services/ChatSettingsService";
import {
  AccessToken,
  TokenExpiredError,
  TokenMissingError,
} from "@/lib/AccessToken";
import {
  DEFAULT_LANGUAGE,
  INTERFACE_LANGUAGES,
  LLM_LANGUAGES,
} from "@/lib/languages";

const ChatSettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { lang_iso_code, chat_id } = useParams<{
    lang_iso_code: string;
    chat_id: string;
  }>();

  const [error, setError] = useState<PageError | null>(null);
  const [accessToken, setAccessToken] = useState<AccessToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<ChatSettings | null>(
    null
  );

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError(PageError.blocker("Your session has expired."));
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
        setError(PageError.blocker("Your session is not found."));
      } else {
        console.warn("Error decoding token:", err);
        setError(PageError.blocker("Your session is not valid."));
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!accessToken || !chat_id) {
      console.warn(
        "Missing session parameters." +
          `\n\tAccessToken: ${accessToken}` +
          `\n\tChat ID: ${chat_id}`
      );
      setError(PageError.blocker("Your session is misconfigured."));
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
        const data = await fetchChatSettings({
          apiBaseUrl,
          chat_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched settings!", data);
        setChatSettings(data);
        setRemoteSettings(data);
      } catch (fetchError) {
        console.error("Error fetching settings!", fetchError);
        setError(PageError.blocker("Failed to load the settings."));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchSettings();
  }, [accessToken, chat_id]);

  const areSettingsChanged = !!(
    chatSettings &&
    remoteSettings &&
    (chatSettings.language_name !== remoteSettings.language_name ||
      chatSettings.language_iso_code !== remoteSettings.language_iso_code ||
      chatSettings.reply_chance_percent !== remoteSettings.reply_chance_percent)
  );

  const handleSave = async () => {
    if (!chatSettings || !remoteSettings) return;
    if (!chat_id || !accessToken) return;
    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await saveChatSettings({
        apiBaseUrl,
        chat_id,
        rawToken: accessToken.raw,
        chatSettings,
      });
      setRemoteSettings(chatSettings);
      toast("Saved!");
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple("Failed to save settings."));
    } finally {
      setIsLoadingState(false);
    }
  };

  if (!accessToken) {
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
        boldSectionContent={"Chat"}
        regularSectionContent={accessToken.decoded.aud}
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
              expiryTimestamp={accessToken.decoded.exp}
              onTokenExpired={handleTokenExpired}
              onSaveClicked={handleSave}
              saveLabel={"Save"}
              disabled={
                !areSettingsChanged || isLoadingState || !!error?.isBlocker
              }
            />

            {/* The Settings card */}
            <Card className="mt-4.5 mb-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
              <CardContent className="space-y-4">
                {isLoadingState ? (
                  <SettingsPageSkeleton />
                ) : (
                  <>
                    <CardTitle className="text-center mx-auto">
                      Configure {botName}'s Behavior
                    </CardTitle>
                    <div className="h-4" />
                    {/* The Preferred Language Dropdown */}
                    <SettingSelector
                      label={`${botName} tries to reply using:`}
                      value={chatSettings?.language_iso_code || undefined}
                      onChange={(val) => {
                        const newLanguageIsoCode = val;
                        const newLanguageName = LLM_LANGUAGES.find(
                          (lang) => lang.isoCode === newLanguageIsoCode
                        )?.defaultName as string;
                        setChatSettings((prev) =>
                          prev
                            ? {
                                ...prev,
                                language_iso_code: newLanguageIsoCode,
                                language_name: newLanguageName,
                              }
                            : prev
                        );
                      }}
                      options={LLM_LANGUAGES.map((lang) => ({
                        value: lang.isoCode,
                        label: (
                          <div className="flex items-center gap-2">
                            <span>{lang.flagEmoji}</span>
                            <span>{lang.localizedName}</span>
                            <span className="text-muted-foreground">
                              ({lang.defaultName})
                            </span>
                          </div>
                        ),
                        disabled:
                          lang.isoCode === chatSettings?.language_iso_code,
                      }))}
                      disabled={!!error?.isBlocker}
                      placeholder={error?.isBlocker ? "—" : "Select Language"}
                    />

                    {/* The Spontaneous Interaction Chance Dropdown */}
                    <SettingSelector
                      label={`${botName} replies without being tagged:`}
                      value={
                        String(chatSettings?.reply_chance_percent ?? "") ||
                        undefined
                      }
                      onChange={(val) =>
                        setChatSettings((prev) =>
                          prev
                            ? { ...prev, reply_chance_percent: Number(val) }
                            : prev
                        )
                      }
                      options={Array.from({ length: 11 }, (_, i) => ({
                        value: String(i * 10),
                        label:
                          i === 0
                            ? "Never"
                            : i === 10
                            ? "Always"
                            : `${i * 10}% of the time`,
                        disabled:
                          String(i * 10) ===
                          String(chatSettings?.reply_chance_percent ?? ""),
                      }))}
                      disabled={!!error?.isBlocker || chatSettings?.is_private}
                      placeholder={error?.isBlocker ? "—" : "Select Frequency"}
                      className="mt-9"
                    />
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
                    chatRole: "Chat role",
                    telegramUsername: "Telegram Username",
                    telegramUserId: "Telegram User ID",
                    profileId: "Profile ID",
                    chatId: "Chat ID",
                  }}
                  copiedMessage={"Copied!"}
                  iconClassName="w-4 h-4 text-blue-300/30"
                />
              )}
            </footer>
          </main>
        </div>
      </div>

      {error && (
        <ErrorMessage
          title={"Oh no!"}
          description={error?.text}
          genericMessage={"Check your access link and try again."}
        />
      )}
    </div>
  );
};

export default ChatSettingsPage;
