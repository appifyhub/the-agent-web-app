import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { t } from "@/lib/translations";
import { usePageSession } from "@/hooks/usePageSession";
import { PageError } from "@/lib/utils";
import { toast } from "sonner";
import {
  getConnectKey,
  regenerateConnectKey,
  connectProfiles,
} from "@/services/connect-key-service";
import {
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Share2,
  ClipboardPaste,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Allowed characters for connect key (excludes confusing characters like I, O, 1, 0)
const ALLOWED_CONNECT_KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const ConnectionsPage: React.FC = () => {
  const { user_id } = useParams<{
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const [connectKey, setConnectKey] = useState<string | null>(null);
  const [isMyKeySectionOpen, setIsMyKeySectionOpen] = useState(false);
  const [inputConnectKey, setInputConnectKey] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isShareDisabled, setIsShareDisabled] = useState(false);
  const [isCopyDisabled, setIsCopyDisabled] = useState(false);

  const copyKeyRef = useRef<HTMLSpanElement>(null);
  const copyCommandRef = useRef<HTMLSpanElement>(null);
  const copyChatRef = useRef<HTMLSpanElement>(null);

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  // Format connect key for display (XXXX-XXXX-XXXX)
  const formatDisplayKey = (key: string) => {
    const clean = key.replace(/-/g, "");
    return `${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  };

  // Fetch connect key when session is ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const response = await getConnectKey({
          apiBaseUrl,
          user_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched connect key!");
        setConnectKey(response.connect_key);
      } catch (err) {
        console.error("Error fetching connect key!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchData();
  }, [accessToken, user_id, error, setError, setIsLoadingState]);

  const handleCopy = async (text: string) => {
    try {
      // Check if Clipboard API is available
      if (
        window.navigator &&
        window.navigator.clipboard &&
        window.navigator.clipboard.writeText
      ) {
        await window.navigator.clipboard.writeText(text);
        toast(t("copied"));
      } else {
        // Fallback for browsers without clipboard API
        // Create a temporary textarea element
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        try {
          const successful = document.execCommand("copy");
          if (successful) {
            toast(t("copied"));
          } else {
            throw new Error("execCommand('copy') failed");
          }
        } finally {
          document.body.removeChild(textarea);
        }
      }
    } catch (err) {
      console.error("Failed to copy", err);
      setIsCopyDisabled(true);
      toast.error(t("connections.copy_failed"));
    }
  };

  const handleCopyKey = () => {
    if (!connectKey) return;
    // Copy the formatted key (as displayed) since that's what user sees
    handleCopy(formatDisplayKey(connectKey));
  };

  const handlePaste = async () => {
    try {
      // Check if Clipboard API is available and has readText method
      if (
        window.navigator &&
        window.navigator.clipboard &&
        window.navigator.clipboard.readText
      ) {
        // Check if we're in a secure context (required for clipboard API)
        if (!window.isSecureContext) {
          throw new Error("Clipboard API requires secure context (HTTPS)");
        }

        // Request permission and read from clipboard
        // Chrome requires this to be called directly from a user gesture
        const text = await window.navigator.clipboard.readText();

        // Strip any non-allowed characters (including hyphens) and convert to uppercase
        const clean = text
          .replace(new RegExp(`[^${ALLOWED_CONNECT_KEY_CHARS}]`, "gi"), "")
          .toUpperCase();
        // Limit to 12 characters
        const limited = clean.slice(0, 12);
        setInputConnectKey(limited);
        if (limited.length > 0) {
          toast.success(t("copied"));
        } else {
          toast.error(t("connections.invalid_format"));
        }
      } else {
        // Fallback: Try to use a temporary textarea with paste event
        const textarea = document.createElement("textarea");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        textarea.style.left = "-999999px";
        document.body.appendChild(textarea);
        textarea.focus();

        // Try to paste using execCommand
        const successful = document.execCommand("paste");
        if (successful && textarea.value) {
          const text = textarea.value;
          // Strip any non-allowed characters (including hyphens) and convert to uppercase
          const clean = text
            .replace(new RegExp(`[^${ALLOWED_CONNECT_KEY_CHARS}]`, "gi"), "")
            .toUpperCase();
          // Limit to 12 characters
          const limited = clean.slice(0, 12);
          setInputConnectKey(limited);
          if (limited.length > 0) {
            toast.success(t("copied"));
          } else {
            toast.error(t("connections.invalid_format"));
          }
        } else {
          throw new Error("execCommand('paste') not supported or failed");
        }
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error("Failed to paste", err);

      // If Clipboard API failed, try execCommand as fallback
      if (
        err instanceof Error &&
        (err.name === "NotAllowedError" ||
          err.name === "SecurityError" ||
          err.message.includes("permission") ||
          err.message.includes("denied"))
      ) {
        // Try execCommand fallback for Chrome when permission is denied
        try {
          const textarea = document.createElement("textarea");
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          textarea.style.left = "-999999px";
          document.body.appendChild(textarea);
          textarea.focus();

          const successful = document.execCommand("paste");
          if (successful && textarea.value) {
            const text = textarea.value;
            const clean = text
              .replace(new RegExp(`[^${ALLOWED_CONNECT_KEY_CHARS}]`, "gi"), "")
              .toUpperCase();
            const limited = clean.slice(0, 12);
            setInputConnectKey(limited);
            if (limited.length > 0) {
              toast.success(t("copied"));
              document.body.removeChild(textarea);
              return;
            }
          }
          document.body.removeChild(textarea);
        } catch {
          // Fallback also failed, show error
        }

        // Provide more helpful error message for Chrome
        const isChrome =
          /Chrome/.test(navigator.userAgent) &&
          /Google Inc/.test(navigator.vendor);
        if (isChrome) {
          toast.error(t("connections.paste_chrome_permission"));
        } else {
          toast.error(t("connections.paste_permission_denied"));
        }
      } else {
        toast.error(t("connections.paste_failed"));
      }
    }
  };

  const handleCopyCommand = () => {
    if (!connectKey) return;
    handleCopy(`/connect ${formatDisplayKey(connectKey)}`);
  };

  const handleCopyChat = () => {
    if (!connectKey) return;
    handleCopy(
      t("connections.chat_command_example", {
        connectKey: formatDisplayKey(connectKey),
      })
    );
  };

  const handleRegenerateKey = async () => {
    if (!user_id || !accessToken) return;

    setIsRegenerating(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const response = await regenerateConnectKey({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
      });
      console.info("Regenerated connect key!");
      setConnectKey(response.connect_key);
      toast.success(t("connections.regenerate_success"));
    } catch (err) {
      console.error("Error regenerating connect key!", err);
      toast.error(
        err instanceof Error ? err.message : t("connections.generic_error")
      );
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleShareKey = async (text: string) => {
    if (!navigator.share) {
      setIsShareDisabled(true);
      toast.error(t("connections.share_not_supported"));
      return;
    }

    try {
      await navigator.share({ text });
    } catch (err) {
      // Check if user cancelled (AbortError) vs actual error
      if (err instanceof Error && err.name === "AbortError") {
        // User cancelled, don't show error or disable
        return;
      }
      console.error("Error sharing", err);
      setIsShareDisabled(true);
      toast.error(t("connections.share_failed"));
    }
  };

  const handleShareCommand = () => {
    if (!connectKey) return;
    handleShareKey(`/connect ${formatDisplayKey(connectKey)}`);
  };

  const handleShareChat = () => {
    if (!connectKey) return;
    handleShareKey(
      t("connections.chat_command_example", {
        connectKey: formatDisplayKey(connectKey),
      })
    );
  };

  const handleConnect = async () => {
    if (!user_id || !accessToken || !inputConnectKey) return;

    // Use already validated cleanInputKey
    if (!isInputValid) {
      toast.error(t("connections.invalid_format"));
      return;
    }

    // Check if trying to connect to self
    if (connectKey) {
      const currentKeyClean = connectKey.replace(/-/g, "").toUpperCase();
      if (cleanInputKey === currentKeyClean) {
        toast.error(t("connections.cannot_connect_to_self"));
        return;
      }
    }

    setIsConnecting(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

      // Format the key with hyphens (XXXX-XXXX-XXXX)
      const leftSlice = cleanInputKey.slice(0, 4);
      const middleSlice = cleanInputKey.slice(4, 8);
      const rightSlice = cleanInputKey.slice(8, 12);
      const formattedKey = `${leftSlice}-${middleSlice}-${rightSlice}`;

      const response = await connectProfiles({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        connect_key: formattedKey,
      });

      console.info("Profiles connected successfully!");
      toast.success(t("connections.connect_success"));

      // Redirect to the new settings link if provided
      if (response.settings_link) {
        setTimeout(() => {
          window.location.href = response.settings_link;
        }, 1500);
      }
    } catch (err) {
      console.error("Error connecting profiles!", err);
      toast.error(
        err instanceof Error ? err.message : t("connections.generic_error")
      );
    } finally {
      setIsConnecting(false);
    }
  };

  // Validate input: 12 characters, all allowed chars, no hyphens
  const cleanInputKey = inputConnectKey.replace(/-/g, "").toUpperCase();
  const allowedCharsPattern = new RegExp(`^[${ALLOWED_CONNECT_KEY_CHARS}]+$`);
  const areAllCharsAllowed = allowedCharsPattern.test(cleanInputKey);
  const isInputValid = cleanInputKey.length === 12 && areAllCharsAllowed;
  const isMobile = MOBILE_USER_AGENT_PATTERN.test(navigator.userAgent);

  return (
    <BaseSettingsPage
      page="connections"
      cardTitle={t("connections.card_title")}
      onActionClicked={handleConnect}
      actionDisabled={!!error?.isBlocker || !isInputValid || isConnecting}
      actionButtonText={
        isConnecting
          ? t("connections.connecting")
          : t("connections.connect_button")
      }
      isContentLoading={isLoadingState}
      externalError={error}
    >

      {/* Main section - info and OTP input */}
      {!isMyKeySectionOpen && (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
          <div className="h-3" />

          {/* Main info box */}
          <p className="text-[1.05rem] font-light text-justify md:text-left [hyphens:auto] opacity-80">
            {t("connections.main_info", { botName })}
          </p>

          <div className="h-px" />

          {/* OTP Input section */}
          <div className="space-y-8">
            <div className="flex items-center justify-center gap-3">
              <Label className="text-[1.05rem] font-medium">
                {t("connections.connect_to_another_label")}
              </Label>
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="glass rounded-full cursor-pointer h-6 w-6 p-0"
                      onClick={handlePaste}
                      disabled={!!error?.isBlocker || isConnecting}
                    >
                      <ClipboardPaste className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("connections.paste_key")}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="glass rounded-full cursor-pointer h-6 w-6 p-0"
                      onClick={() => setInputConnectKey("")}
                      disabled={
                        !!error?.isBlocker || isConnecting || !inputConnectKey
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("connections.clear_key")}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 w-full">
              {/* InputOTP component */}
              <div className="w-full flex justify-center">
                <InputOTP
                  maxLength={14}
                  value={inputConnectKey}
                  onChange={(value) => {
                    // Strip any non-allowed characters (including hyphens) and convert to uppercase
                    const clean = value
                      .replace(
                        new RegExp(`[^${ALLOWED_CONNECT_KEY_CHARS}]`, "gi"),
                        ""
                      )
                      .toUpperCase();
                    // Limit to 12 characters (maxLength=14 allows for 2 hyphens in pasted format)
                    const limited = clean.slice(0, 12);
                    setInputConnectKey(limited);
                  }}
                  disabled={!!error?.isBlocker || isConnecting}
                  containerClassName="flex-wrap justify-center"
                  autoComplete="off"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                    <InputOTPSlot index={6} />
                    <InputOTPSlot index={7} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={8} />
                    <InputOTPSlot index={9} />
                    <InputOTPSlot index={10} />
                    <InputOTPSlot index={11} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-2" />

      {/* Divider */}
      <div className="h-px bg-blue-300/20" />

      <div className="h-1" />

      {/* My Connect Key collapsible section */}
      <div className="space-y-4">
        <Button
          variant="link"
          className={cn(
            "w-full justify-center gap-3 text-center text-base font-medium text-accent-amber hover:text-amber-100 p-0 h-auto cursor-pointer group",
            "no-underline hover:no-underline"
          )}
          onClick={() => setIsMyKeySectionOpen(!isMyKeySectionOpen)}
          disabled={!!error?.isBlocker || !connectKey}
        >
          {isMyKeySectionOpen ? (
            <EyeOff className="h-5 w-5 shrink-0 text-accent-amber group-hover:text-amber-100" />
          ) : (
            <Eye className="h-5 w-5 shrink-0 text-accent-amber group-hover:text-amber-100" />
          )}
          {isMyKeySectionOpen
            ? t("connections.hide_my_key")
            : t("connections.show_my_key")}
        </Button>

        <div className="h-1" />

        {isMyKeySectionOpen && connectKey && (
          <div className="space-y-6 animate-in slide-in-from-top-2 duration-300">
            {/* Info box */}
            <p className="text-[1.05rem] font-light text-justify md:text-left [hyphens:auto] opacity-80">
              {t("connections.my_key_info")}
            </p>

            {/* Connect key display */}
            <div className="flex items-center gap-2">
              <span
                ref={copyKeyRef}
                className="flex-1 h-12 min-h-12 px-4 flex items-center font-mono text-sm glass-dark-static rounded-xl select-all overflow-x-auto overflow-y-hidden whitespace-nowrap text-accent-amber"
              >
                {formatDisplayKey(connectKey)}
              </span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="glass rounded-xl h-12 w-12 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCopyKey();
                    }}
                    disabled={!!error?.isBlocker || isCopyDisabled}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("connections.copy_key")}</TooltipContent>
              </Tooltip>
              {isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="glass rounded-xl h-12 w-12 cursor-pointer"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleShareKey(formatDisplayKey(connectKey));
                      }}
                      disabled={!!error?.isBlocker || isShareDisabled}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("connections.share_key")}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="glass rounded-xl h-12 w-12 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRegenerateKey();
                    }}
                    disabled={!!error?.isBlocker || isRegenerating}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        isRegenerating && "animate-spin"
                      )}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t("connections.regenerate_key")}
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Info box about /connect command */}
            <p className="text-[1.05rem] font-light text-justify md:text-left [hyphens:auto] opacity-80">
              {t("connections.command_info", { botName })}
            </p>

            {/* Code block for /connect command */}
            <div className="flex items-center gap-2">
              <span
                ref={copyCommandRef}
                className="flex-1 h-12 min-h-12 px-4 flex items-center font-mono text-sm glass-dark-static rounded-xl select-all overflow-x-auto overflow-y-hidden whitespace-nowrap"
              >
                {`/connect ${formatDisplayKey(connectKey)}`}
              </span>
              {isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="glass rounded-xl h-12 w-12 cursor-pointer"
                      onClick={handleShareCommand}
                      disabled={!!error?.isBlocker || isShareDisabled}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("connections.share_key")}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="glass rounded-xl h-12 w-12 cursor-pointer"
                    onClick={handleCopyCommand}
                    disabled={!!error?.isBlocker || isCopyDisabled}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("connections.copy_key")}</TooltipContent>
              </Tooltip>
            </div>

            {/* Info box about chat command */}
            <p className="text-[1.05rem] font-light text-justify md:text-left [hyphens:auto] opacity-80">
              {t("connections.chat_command_info", { botName })}
            </p>

            {/* Code block for chat command */}
            <div className="flex items-center gap-2">
              <span
                ref={copyChatRef}
                className="flex-1 h-12 min-h-12 px-4 flex items-center font-mono text-sm glass-dark-static rounded-xl select-all overflow-x-auto overflow-y-hidden whitespace-nowrap"
              >
                {t("connections.chat_command_example", {
                  connectKey: formatDisplayKey(connectKey),
                })}
              </span>
              {isMobile && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="glass rounded-xl h-12 w-12 cursor-pointer"
                      onClick={handleShareChat}
                      disabled={!!error?.isBlocker || isShareDisabled}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("connections.share_key")}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="glass rounded-xl h-12 w-12 cursor-pointer"
                    onClick={handleCopyChat}
                    disabled={!!error?.isBlocker || isCopyDisabled}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("connections.copy_key")}</TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </BaseSettingsPage>
  );
};

export default ConnectionsPage;
