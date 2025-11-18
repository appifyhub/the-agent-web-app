import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
        {t("profile_card_title", { botName })}
      </CardTitle>

      <div className="h-4" />

      {/* Full name input */}
      <div className="space-y-4">
        <Label className="ps-2 text-[1.05rem] font-light">
          {t("profile_full_name_label", { botName })}
        </Label>
        <Input
          id="full-name"
          className="py-6 px-6 w-full sm:w-sm text-[1.05rem] glass rounded-xl"
          placeholder={
            error?.isBlocker ? "—" : t("profile_full_name_placeholder")
          }
          disabled={!!error?.isBlocker}
          value={userSettings?.full_name || ""}
          onChange={(e) =>
            setUserSettings((prev) =>
              prev
                ? {
                    ...prev,
                    full_name: e.target.value,
                  }
                : prev
            )
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && !error?.isBlocker && hasSettingsChanged) {
              handleSave();
            }
          }}
        />
      </div>

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
