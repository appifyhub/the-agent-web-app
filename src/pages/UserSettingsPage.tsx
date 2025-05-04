import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Hash, AtSign } from "lucide-react";
import logoVector from "@/assets/logo-vector.svg";
import Header from "@/components/Header";
import CountdownTimer from "@/components/CountdownTimer";
import TokenDataSheet from "@/components/TokenDataSheet";
import { toast } from "sonner";
import { DEFAULT_LANGUAGE, INTERFACE_LANGUAGES } from "@/lib/languages";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SERVICE_PROVIDERS } from "@/lib/service-providers";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ErrorMessage from "@/components/ErrorMessage";
import {
  cn,
  TokenExpiredError,
  TokenMissingError,
  maskSecret,
} from "@/lib/utils";
import {
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  PROVIDER_KEY_MAP,
} from "@/services/UserSettingsService";

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

const UserSettingsPage: React.FC = () => {
  const { lang_iso_code, user_id } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(
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
    if (!decodedToken || !rawToken || !user_id) {
      console.warn(
        "Missing session parameters." +
          `\n\tDecoded Token: ${decodedToken}` +
          `\n\tRaw Token: ${rawToken}` +
          `\n\tUser ID: ${user_id}`
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
        const data = await fetchUserSettings({
          apiBaseUrl,
          user_id,
          rawToken,
        });
        console.info("Fetched settings!", data);
        setUserSettings(data);
        setRemoteSettings(data);
      } catch (fetchError) {
        console.error("Error fetching settings!", fetchError);
        setError("Failed to load the settings.");
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchSettings();
  }, [decodedToken, rawToken, user_id]);

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
    if (!user_id || !rawToken) return;
    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await saveUserSettings({
        apiBaseUrl,
        user_id,
        rawToken,
        open_ai_key: userSettings.open_ai_key ?? "",
        anthropic_key: userSettings.anthropic_key ?? "",
        rapid_api_key: userSettings.rapid_api_key ?? "",
        coin_api_key: userSettings.coin_api_key ?? "",
      });
      setRemoteSettings(userSettings);
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
        boldSectionContent={"Profile"}
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
              <Button
                className={cn(
                  "bg-primary hover:bg-purple-200 text-primary-foreground hover:text-zinc-900",
                  "px-6 py-6 text-[1.05rem] rounded-full cursor-pointer"
                )}
                disabled={!areSettingsChanged || isLoadingState || !!error}
                onClick={handleSave}
              >
                Save
              </Button>
            </div>

            {/* The Settings card */}
            <Card className="mt-4.5 mb-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
              <CardContent className="flex flex-col h-full justify-center">
                {isLoadingState ? (
                  <div className="flex flex-col gap-4">
                    <Skeleton className="h-10" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-10" />
                    <Skeleton className="h-20" />
                  </div>
                ) : (
                  <>
                    <div className="h-2" />
                    <CardTitle className="text-center mx-auto">
                      Configure {botName}'s Access Keys
                    </CardTitle>
                    <div className="h-10" />
                    <Tabs
                      defaultValue={SERVICE_PROVIDERS[0].id}
                      className="w-full sm:w-x"
                    >
                      <TabsList
                        className={cn(
                          "flex flex-nowrap w-full overflow-x-auto overflow-y-hidden justify-start",
                          "glass-static py-5 rounded-full transition-all"
                        )}
                      >
                        {SERVICE_PROVIDERS.map((provider) => (
                          <TabsTrigger
                            className={cn(
                              "min-w-max px-2 sm:px-4 py-4 text-[0.9rem] sm:text-[1.05rem] truncate cursor-pointer rounded-full transition-all",
                              "disabled:text-muted-foreground/50 disabled:data-[state=active]:text-muted-foreground/50 hover:bg-primary/10 hover:text-primary"
                            )}
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
                                error ? "text-muted-foreground/50" : ""
                              )}
                            >
                              {botName} needs this for {provider.tools}
                            </Label>
                            <Input
                              id={`token-${provider.id}`}
                              className="py-6 px-6 w-full sm:w-xs text-[1.05rem] glass rounded-xl font-mono"
                              type="none"
                              autoComplete="off"
                              spellCheck={false}
                              aria-autocomplete="none"
                              placeholder={error ? "—" : provider.placeholder}
                              disabled={!!error}
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
                            <Info className="h-4 w-4 text-blue-400/50" />
                            <a
                              href={provider.token_management_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="dotted-underline text-blue-400/50"
                            >
                              Where is my {provider.name} key?
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
        <ErrorMessage
          title={"Oh no!"}
          description={error}
          genericMessage={"Double-check your access link and try again."}
        />
      )}
    </div>
  );
};

export default UserSettingsPage;
