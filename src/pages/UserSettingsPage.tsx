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
import {
  fetchUserSettings,
  saveUserSettings,
  UserSettings,
  buildChangedPayload,
  areSettingsChanged,
} from "@/services/user-settings-service";

const UserSettingsPage: React.FC = () => {
  const { user_id } = useParams<{
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<UserSettings | null>(
    null
  );

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  // Fetch user settings when session is ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker) return;

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const settings = await fetchUserSettings({
          apiBaseUrl,
          user_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched settings!", settings);
        setUserSettings(settings);
        setRemoteSettings(settings);
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
    </BaseSettingsPage>
  );
};

export default UserSettingsPage;
