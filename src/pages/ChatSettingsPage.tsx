import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Header from "@/components/Header";
import CountdownTimer from "@/components/CountdownTimer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TokenExpiredError, TokenMissingError } from "@/lib/utils";
import {
  DEFAULT_LANGUAGE,
  INTERFACE_LANGUAGES,
  LLM_LANGUAGES,
} from "@/lib/languages";
import logoVector from "@/assets/logo-vector.svg";

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
      <div className="container mx-auto p-4">
        <div className="flex flex-col items-center space-y-6">
          <Skeleton className="h-[50px] w-[350px] rounded-xl" />
          <Skeleton className="h-[200px] w-[350px] rounded-xl" />
          <div className="flex space-x-4">
            <Skeleton className="h-[50px] w-[165px] rounded-xl" />
            <Skeleton className="h-[50px] w-[165px] rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  const currentInterfaceLanguage =
    INTERFACE_LANGUAGES.find((lang) => lang.isoCode === lang_iso_code) ||
    DEFAULT_LANGUAGE;
  const currentLanguage =
    LLM_LANGUAGES.find((lang) => lang.isoCode === languageChoice) || undefined;
  return (
    <div className="flex flex-col min-h-screen">
      <Header
        boldSectionContent={"Chat Settings"}
        regularSectionContent={decodedToken.aud}
        currentLanguage={currentInterfaceLanguage}
        supportedLanguages={INTERFACE_LANGUAGES}
        iconUrl={logoVector}
        // TODO: Implement language change logic
        onLangChange={(isoCode) =>
          console.info("Language changed to:", isoCode)
        }
      />
      <div className="container mx-auto p-9 flex-grow">
        <main>
          {/* Timer and Save Button Section */}
          <div className="flex justify-between items-center mb-6">
            <CountdownTimer
              expiryTimestamp={decodedToken.exp}
              onExpire={handleTokenExpired}
            />
            {/* TODO: Add form handling logic to Button onClick */}
            <Button disabled={!!error}>Save Changes</Button>
          </div>

          {/* Main content */}
          <Card className="p-9">
            <CardHeader>
              <CardTitle>Configure your chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingState ? (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  {/* Preferred Language Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="language-select">Preferred Language</Label>
                    <Select
                      value={languageChoice}
                      onValueChange={(val) =>
                        setLanguageChoice(val === "" ? undefined : val)
                      }
                    >
                      <SelectTrigger id="language-select" className="w-[300px]">
                        <SelectValue placeholder="Select Language" />
                      </SelectTrigger>
                      <SelectContent className="p-4">
                        {/* Add placeholder if no language is selected yet */}
                        {!currentLanguage && (
                          <SelectItem
                            value="Choose a language"
                            className="py-4 px-4"
                          >
                            Select Language
                          </SelectItem>
                        )}
                        {/* Map over language options */}
                        {LLM_LANGUAGES.map((lang) => (
                          <SelectItem
                            key={lang.isoCode}
                            value={lang.isoCode}
                            className="py-4 px-4"
                          >
                            <div className="flex items-center gap-2">
                              <span>{lang.flagEmoji}</span>
                              <span>{lang.defaultName}</span>
                              <span className="text-xs text-muted-foreground">
                                ({lang.localizedName})
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Spontaneous Interaction Chance Dropdown */}
                  <div className="space-y-2">
                    <Label htmlFor="interaction-chance-select">
                      Spontaneous Interaction Chance
                    </Label>
                    <Select
                      value={String(responseChance)}
                      onValueChange={(value) => setResponseChance(value)}
                    >
                      <SelectTrigger id="interaction-chance-select" className="w-[300px]">
                        <SelectValue placeholder="Loading..." />
                      </SelectTrigger>
                      <SelectContent className="p-4">
                        {/* Generate options 0% to 100% in steps of 10 */}
                        {[...Array(11)].map((_, i) => (
                          <SelectItem
                            className="py-4 px-4"
                            key={i * 10}
                            value={String(i * 10)}
                          >
                            {i * 10}%
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

      {error && (
        <div className="max-w-md mx-auto fixed bottom-4 inset-x-0 px-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>There has been an error</AlertTitle>
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
