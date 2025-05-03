import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, TokenExpiredError, TokenMissingError } from "@/lib/utils";
import { User, Hash, AtSign } from "lucide-react";
import logoVector from "@/assets/logo-vector.svg";
import Header from "@/components/Header";
import CountdownTimer from "@/components/CountdownTimer";
import TokenDataSheet from "@/components/TokenDataSheet";
import SettingSelector from "@/components/SettingSelector";
import {
  DEFAULT_LANGUAGE,
  INTERFACE_LANGUAGES,
  LLM_LANGUAGES,
} from "@/lib/languages";
import { toast } from "sonner";
import {
  fetchChatSettings,
  saveChatSettings,
  ChatSettings,
} from "@/services/ChatSettingsService";

interface DecodedToken {
  aud: string; // display name
  iss: string; // bot name
  sub: string; // profile ID
  role: string; // chat role
  chat_id: number | string; // chat ID
  telegram_user_id: number | string; // TID
  telegram_username?: string; // TUN
  exp: number; // expiry timestamp
  iat: number; // issue timestamp
}

const ChatSettingsPage: React.FC = () => {
  const { lang_iso_code, chat_id } = useParams<{
    lang_iso_code: string;
    chat_id: string;
  }>();

  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<ChatSettings | null>(
    null
  );

  const handleTokenExpired = () => {
    console.warn("Settings token expired");
    setError("Your session has expired.");
  };

  const isExpired = (decodedToken: DecodedToken | null) => {
    // let's enforce: if there is no expiry time, the token is expired
    if (!decodedToken || !decodedToken.exp) return true;
    const nowInSeconds = Date.now() / 1000;
    return decodedToken.exp < nowInSeconds;
  };

  useEffect(() => {
    try {
      const token = searchParams.get("token");
      if (!token) throw new TokenMissingError();
      console.info("Found a raw token!", token);
      setRawToken(token);

      const decoded = jwtDecode<DecodedToken>(token);
      console.info("Decoded a JWT token!", decoded);
      setDecodedToken(decoded);
      if (isExpired(decoded)) throw new TokenExpiredError();

      console.info("Token is valid!");
      setError(null);
    } catch (err) {
      if (err instanceof TokenExpiredError) {
        handleTokenExpired();
      } else if (err instanceof TokenMissingError) {
        console.warn("No token found in the URL.");
        setError("Your session is not found.");
      } else {
        console.warn("Error decoding token:", err);
        setError("Your session is not valid.");
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (!decodedToken || !rawToken || !chat_id) {
      console.warn(
        "Missing session parameters." +
          `\n\tDecoded Token: ${decodedToken}` +
          `\n\tRaw Token: ${rawToken}` +
          `\n\tChat ID: ${chat_id}`
      );
      setError("Your session is misconfigured.");
      return;
    }

    console.info("Session parameters are available!");
    if (isExpired(decodedToken)) {
      handleTokenExpired();
      return;
    }

    const fetchSettings = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const data = await fetchChatSettings({
          apiBaseUrl,
          chat_id,
          rawToken,
        });
        console.info("Fetched settings!", data);
        setChatSettings(data);
        setRemoteSettings(data);
      } catch (fetchError) {
        console.error("Error fetching settings!", fetchError);
        setError("Failed to load the settings.");
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchSettings();
  }, [decodedToken, rawToken, chat_id]);

  const isSettingsChanged = !!(
    chatSettings &&
    remoteSettings &&
    (chatSettings.language_name !== remoteSettings.language_name ||
      chatSettings.language_iso_code !== remoteSettings.language_iso_code ||
      chatSettings.reply_chance_percent !== remoteSettings.reply_chance_percent)
  );

  const handleSave = async () => {
    if (!chatSettings || !remoteSettings) return;
    if (!chat_id || !rawToken) return;
    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await saveChatSettings({
        apiBaseUrl,
        chat_id,
        rawToken,
        chatSettings,
      });
      setRemoteSettings(chatSettings);
      toast("Saved!");
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError("Failed to save settings.");
    } finally {
      setIsLoadingState(false);
    }
  };

  if (!decodedToken) {
    console.info("Rendering the loading state!");
    return (
      <div className="container mx-auto p-4 h-screen">
        <div className="flex flex-col items-center space-y-6 h-full justify-center p-9">
          <Skeleton className="h-[70px]" />
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[40px]" />
          <Skeleton className="h-[40px]" />
        </div>
      </div>
    );
  }

  const botName = import.meta.env.VITE_APP_NAME_SHORT;
  const currentInterfaceLanguage =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;

  const itemizedToken = [
    { label: "Chat role", value: decodedToken.role, icon: User },
    decodedToken.telegram_username && {
      label: "Telegram Username",
      value: decodedToken.telegram_username,
      icon: AtSign,
    },
    {
      label: "Telegram User ID",
      value: decodedToken.telegram_user_id,
      icon: Hash,
    },
    { label: "Profile ID", value: decodedToken.sub, icon: Hash },
    { label: "Chat ID", value: decodedToken.chat_id, icon: Hash },
  ].filter(
    (item): item is import("@/components/TokenDataSheet").TokenDataSheetItem =>
      !!item
  );

  return (
    <div className="flex flex-col min-h-screen">
      {/* The Header section */}
      <Header
        boldSectionContent={"Chat"}
        regularSectionContent={decodedToken.aud}
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
            {/* Timer and Save Button Section */}
            <div className="flex justify-between items-center">
              <CountdownTimer
                expiryTimestamp={decodedToken.exp}
                onExpire={handleTokenExpired}
              />
              {/* TODO: Add form handling logic to Button onClick */}
              <Button
                className={cn(
                  "bg-primary hover:bg-purple-200 text-primary-foreground hover:text-zinc-900",
                  "px-6 py-6 text-[1.05rem] rounded-full cursor-pointer"
                )}
                disabled={!isSettingsChanged || isLoadingState || !!error}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>

            {/* The Settings card */}
            <Card className="mt-4.5 mb-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
              <CardContent className="space-y-4">
                {isLoadingState ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-20" />
                  </div>
                ) : (
                  <>
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
                      disabled={!!error}
                      placeholder={error ? "—" : "Select Language"}
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
                      disabled={!!error || chatSettings?.is_private}
                      placeholder={error ? "—" : "Select Chance"}
                      className="mt-9"
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Token Information */}
            <footer className="mt-6 text-xs mb-9 text-blue-300/30">
              {decodedToken && (
                <TokenDataSheet
                  iconClassName="w-4 h-4 text-blue-300/30"
                  items={itemizedToken}
                  copiedMessage="Copied!"
                />
              )}
            </footer>
          </main>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto fixed bottom-12 inset-x-0 px-6 z-50">
          <Alert
            variant="destructive"
            className="space-y-2 bg-gray-50 border-red-400 border-4"
          >
            <AlertCircle className="h-6 w-6" />
            <AlertTitle className="font-mono">Oh no!</AlertTitle>
            <AlertDescription>
              {error}
              <br />
              Double-check your access link and try again.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );
};

export default ChatSettingsPage;
