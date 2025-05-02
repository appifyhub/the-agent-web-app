import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, TokenExpiredError, TokenMissingError } from "@/lib/utils";
import {
  DEFAULT_LANGUAGE,
  INTERFACE_LANGUAGES,
  LLM_LANGUAGES,
} from "@/lib/languages";
import logoVector from "@/assets/logo-vector.svg";
import Header from "@/components/Header";
import CountdownTimer from "@/components/CountdownTimer";

// Define the expected structure of the decoded JWT payload
interface DecodedToken {
  iss: string;
  sub: string;
  aud: string;
  role: string;
  chat_id: number | string;
  telegram_user_id: number | string;
  telegram_username?: string;
  exp: number;
  iat: number;
}

const ChatSettingsPage: React.FC = () => {
  const { lang_iso_code, chat_id } = useParams<{
    lang_iso_code: string;
    chat_id: string;
  }>();

  const [searchParams] = useSearchParams();
  const [rawToken, setRawToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [isLoadingState, setIsLoadingState] = useState<boolean>(false);
  const [languageChoice, setLanguageChoice] = useState<string | undefined>(
    undefined
  );
  const [responseChance, setResponseChance] = useState<number | string>("");
  const [error, setError] = useState<string | null>(null);

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
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${rawToken}`,
        };
        const response = await fetch(`${apiBaseUrl}/settings/chat/${chat_id}`, {
          headers: headers,
        });

        if (!response.ok) {
          console.error("Response was not ok!", response);
          throw new Error(
            "Network error!" +
              `\n\tStatus: ${response.status}` +
              `\n\tError: ${response.statusText}`
          );
        }

        const data = await response.json();
        console.info("Fetched settings!", data);

        setLanguageChoice(data.language_iso_code || undefined);
        setResponseChance(String(data.reply_chance_percent));
      } catch (fetchError) {
        console.error("Error fetching settings!", fetchError);
        setError("Failed to load the settings.");
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchSettings();
  }, [decodedToken, chat_id, rawToken]);

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
  const currentLanguage =
    LLM_LANGUAGES.find((lang) => lang.isoCode === languageChoice) || undefined;

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
                disabled={!!error}
                className={cn(
                  "bg-primary hover:bg-purple-200 text-primary-foreground hover:text-zinc-900",
                  "px-6 py-6 text-[1.05rem] rounded-full cursor-pointer"
                )}
              >
                Save
              </Button>
            </div>

            {/* The Settings card */}
            <Card className="mt-3.5 mb-4.5 md:px-6 px-2 md:py-12 py-8 glass-static rounded-3xl">
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
                    <div className="space-y-4">
                      <Label
                        htmlFor="language-select"
                        className="text-base font-light"
                      >
                        {botName} tries to reply using:
                      </Label>
                      <Select
                        value={currentLanguage?.isoCode || undefined}
                        disabled={!!error}
                        onValueChange={(val) =>
                          setLanguageChoice(val === "" ? undefined : val)
                        }
                      >
                        <SelectTrigger
                          id="language-select"
                          className="py-6 px-6 w-full sm:w-xs text-[1.05rem] glass overflow-hidden rounded-full cursor-pointer"
                        >
                          <SelectValue
                            placeholder={error ? "—" : "Select Language"}
                          />
                        </SelectTrigger>
                        <SelectContent className="p-4 glass-dark-static rounded-2xl">
                          {LLM_LANGUAGES.map((lang) => (
                            <SelectItem
                              key={lang.isoCode}
                              value={lang.isoCode}
                              disabled={
                                lang.isoCode === currentLanguage?.isoCode
                              }
                              className={cn(
                                "py-4 px-4 cursor-pointer",
                                lang.isoCode === currentLanguage?.isoCode
                                  ? "bg-accent/70"
                                  : ""
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span>{lang.flagEmoji}</span>
                                <span>{lang.localizedName}</span>
                                <span className="text-muted-foreground">
                                  ({lang.defaultName})
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* The Spontaneous Interaction Chance Dropdown */}
                    <div className="space-y-4 mt-9">
                      <Label
                        htmlFor="interaction-chance-select"
                        className="text-base font-light"
                      >
                        {botName} replies without being asked:
                      </Label>
                      <Select
                        value={String(responseChance) || undefined}
                        disabled={!!error}
                        onValueChange={(value) => setResponseChance(value)}
                      >
                        <SelectTrigger
                          id="interaction-chance-select"
                          className="py-6 px-6 w-full sm:w-xs text-[1.05rem] glass overflow-hidden rounded-full cursor-pointer"
                        >
                          <SelectValue
                            placeholder={error ? "—" : "Select Chance"}
                          />
                        </SelectTrigger>
                        <SelectContent className="p-4 glass-dark-static rounded-2xl">
                          {[...Array(11)].map((_, i) => (
                            <SelectItem
                              key={i * 10}
                              value={String(i * 10)}
                              disabled={String(i * 10) === responseChance}
                              className={cn(
                                "py-4 px-4 cursor-pointer",
                                String(i * 10) === responseChance
                                  ? "bg-accent/70"
                                  : ""
                              )}
                            >
                              {i === 0
                                ? "Never"
                                : i === 10
                                ? "Always"
                                : `${i * 10}% of the time`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <footer className="mt-6 text-sm text-muted-foreground">
              <div>Role: {decodedToken.role}</div>
              <div>Chat ID: {decodedToken.chat_id}</div>
              <div>User ID (Hex): {decodedToken.sub}</div>
              <div>Telegram User ID: {decodedToken.telegram_user_id}</div>
              {decodedToken.telegram_username && (
                <div>Telegram Username: {decodedToken.telegram_username}</div>
              )}
              <hr className="my-2" />
              <div>
                Raw Params: lang={lang_iso_code}, type={"Chat"}, id={chat_id}
              </div>
            </footer>
          </main>
        </div>
      </div>

      {error && (
        <div className="max-w-md mx-auto fixed bottom-12 inset-x-0 px-6 z-50">
          <Alert
            variant="destructive"
            className="space-y-2 bg-gray-50 border-red-300 border-4"
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
