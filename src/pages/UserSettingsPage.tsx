import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { t } from "@/lib/translations";
import { usePageSession } from "@/hooks/usePageSession";
import { PageError } from "@/lib/utils";
import { toast } from "sonner";
import { ChevronsRight } from "lucide-react";
import {
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  buildChangedPayload,
  areSettingsChanged,
} from "@/services/user-settings-service";
import {
  fetchExternalTools,
  ExternalToolProviderResponse,
} from "@/services/external-tools-service";
import { useNavigation } from "@/hooks/useNavigation";
import SettingTextarea from "@/components/SettingTextarea";
import SettingInput from "@/components/SettingInput";

const UserSettingsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    user_id: string;
    lang_iso_code: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { navigateToAccess, navigateToIntelligence } = useNavigation();

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(
    null
  );
  const [externalToolProviders, setExternalToolProviders] = useState<
    ExternalToolProviderResponse[]
  >([]);

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  // Fetch user settings and external tools when session is ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
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
        setExternalToolProviders(externalTools.providers);
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };
    fetchData();
  }, [accessToken, user_id, error, setError, setIsLoadingState]);

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

      // Trim whitespace from text fields on submit (don't mutate form state pre-request)
      const trimmedSettings: UserSettings = {
        ...userSettings,
        full_name:
          userSettings.full_name === undefined
            ? undefined
            : userSettings.full_name.trim(),
        about_me:
          userSettings.about_me === undefined
            ? undefined
            : userSettings.about_me.trim(),
      };

      // Only send fields that have actually changed (smart diffing)
      const payload = buildChangedPayload(trimmedSettings, remoteSettings);

      await saveUserSettings({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        payload,
      });

      // Sync UI state to what we actually saved (trimmed)
      setUserSettings(trimmedSettings);
      setRemoteSettings(trimmedSettings);
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  return (
    <BaseSettingsPage
      page="profile"
      cardTitle={t("profile_card_title", { botName })}
      onActionClicked={handleSave}
      actionDisabled={!hasSettingsChanged}
      isContentLoading={isLoadingState}
      externalError={error}
    >

      {/* Full name input */}
      <SettingInput
        id="full-name"
        label={t("profile_full_name_label", { botName })}
        value={userSettings?.full_name || ""}
        onChange={(value) =>
          setUserSettings((prev) =>
            prev
              ? {
                  ...prev,
                  full_name: value,
                }
              : prev
          )
        }
        onClear={() =>
          setUserSettings((prev) =>
            prev
              ? {
                  ...prev,
                  full_name: "",
                }
              : prev
          )
        }
        disabled={!!error?.isBlocker}
        placeholder={t("profile_full_name_placeholder")}
        onKeyboardConfirm={() => {
          if (!error?.isBlocker && hasSettingsChanged) {
            handleSave();
          }
        }}
      />

      {/* About me textarea */}
      <SettingTextarea
        id="about-me"
        label={t("about_me_label", { botName })}
        value={userSettings?.about_me || ""}
        onChange={(value) =>
          setUserSettings((prev) =>
            prev
              ? {
                  ...prev,
                  about_me: value,
                }
              : prev
          )
        }
        onClear={() =>
          setUserSettings((prev) =>
            prev
              ? {
                  ...prev,
                  about_me: "",
                }
              : prev
          )
        }
        disabled={!!error?.isBlocker}
        placeholder={
          error?.isBlocker
            ? "—"
            : t("about_me_placeholder", {
                name: userSettings?.full_name || "User",
              })
        }
        minRows={1}
        maxRows={10}
      />

      {/* Provider configuration link */}
      {(() => {
        if (externalToolProviders.length === 0) return null;

        const firstUnconfiguredProvider = externalToolProviders.find(
          (p) => !p.is_configured
        );
        const allConfigured = !firstUnconfiguredProvider;

        if (allConfigured) {
          // All providers configured - show Customize Intelligence link
          return (
            <div className="flex items-center space-x-2 ps-2 text-sm text-muted-foreground mt-6">
              <ChevronsRight className="h-4 w-4 text-accent-amber/70" />
              <button
                onClick={() => {
                  if (user_id && lang_iso_code) {
                    navigateToIntelligence(user_id, lang_iso_code);
                  }
                }}
                className="underline underline-offset-3 decoration-accent-amber/70 text-accent-amber/70 hover:text-accent-amber cursor-pointer"
              >
                {t("configure_intelligence")}
              </button>
            </div>
          );
        } else {
          // Has unconfigured providers - show Configure AI providers link
          return (
            <div className="flex items-center space-x-2 ps-2 text-sm text-muted-foreground mt-6">
              <ChevronsRight className="h-4 w-4 text-accent-amber/70" />
              <button
                onClick={() => {
                  if (user_id && lang_iso_code && firstUnconfiguredProvider) {
                    // Store provider ID in sessionStorage so Access page can scroll to it
                    sessionStorage.setItem(
                      "scrollToProvider",
                      firstUnconfiguredProvider.definition.id
                    );
                    navigateToAccess(user_id, lang_iso_code);
                  }
                }}
                className="underline underline-offset-3 decoration-accent-amber/70 text-accent-amber/70 hover:text-accent-amber cursor-pointer"
              >
                {t("configure_ai_providers")}
              </button>
            </div>
          );
        }
      })()}
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
