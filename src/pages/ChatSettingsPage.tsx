import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CardTitle } from "@/components/ui/card";
import BaseSettingsPage from "@/components/BaseSettingsPage";
import type { ReleaseNotificationsSetting } from "@/services/chat-settings-service";
import SettingSelector from "@/components/SettingSelector";
import { toast } from "sonner";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  fetchChatSettings,
  saveChatSettings,
  ChatSettings,
} from "@/services/chat-settings-service";
import { usePageSession } from "@/hooks/usePageSession";
import { LLM_LANGUAGES } from "@/lib/languages";

const ChatSettingsPage: React.FC = () => {
  const { chat_id, user_id } = useParams<{
    lang_iso_code: string;
    chat_id: string;
    user_id?: string;
  }>();

  const {
    error,
    accessToken,
    isLoadingState,
    setError,
    setIsLoadingState,
  } = usePageSession(user_id, chat_id);

  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<ChatSettings | null>(null);

  // Fetch chat settings when session is ready
  useEffect(() => {
    if (!accessToken || !chat_id || error?.isBlocker) return;

    const fetchSettings = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const settings = await fetchChatSettings({ 
          apiBaseUrl, 
          chat_id, 
          rawToken: accessToken.raw 
        });
        console.info("Fetched settings!", settings);
        setChatSettings(settings);
        setRemoteSettings(settings);
      } catch (err) {
        console.error("Error fetching settings!", err);
        setError(PageError.blocker(t("errors.fetch_failed")));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchSettings();
  }, [accessToken, chat_id, error?.isBlocker, setError, setIsLoadingState]);

  const areSettingsChanged = !!(
    chatSettings &&
    remoteSettings &&
    (chatSettings.language_name !== remoteSettings.language_name ||
      chatSettings.language_iso_code !== remoteSettings.language_iso_code ||
      chatSettings.reply_chance_percent !== remoteSettings.reply_chance_percent ||
      chatSettings.release_notifications !== remoteSettings.release_notifications)
  );

  const handleSave = async () => {
    if (!chatSettings || !remoteSettings || !chat_id || !accessToken) return;
    
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
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple(t("errors.save_failed")));
    } finally {
      setIsLoadingState(false);
    }
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  return (
    <BaseSettingsPage
      page="chat"
      expectedChatId={chat_id}
      expectedUserId={user_id}
      onActionClicked={handleSave}
      actionDisabled={!areSettingsChanged}
      isContentLoading={isLoadingState}
    >
      <CardTitle className="text-center mx-auto">
        {t("configure_title", { botName })}
      </CardTitle>
      <div className="h-4" />

      {/* The Preferred Language Dropdown */}
      <SettingSelector
        label={t("preferred_language_label", { botName })}
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
          disabled: lang.isoCode === chatSettings?.language_iso_code,
        }))}
        disabled={!!error?.isBlocker}
        placeholder={
          error?.isBlocker ? "—" : t("preferred_language_placeholder")
        }
      />

      {/* Release Notifications Dropdown */}
      <SettingSelector
        label={t("notifications.releases_label", { botName })}
        value={chatSettings?.release_notifications || undefined}
        onChange={(val) =>
          setChatSettings((prev) =>
            prev
              ? {
                  ...prev,
                  release_notifications: val as ReleaseNotificationsSetting,
                }
              : prev
          )
        }
        options={[
          {
            value: "none",
            label: t("notifications.releases_choice_none"),
            disabled: chatSettings?.release_notifications === "none",
          },
          {
            value: "major",
            label: t("notifications.releases_choice_major"),
            disabled: chatSettings?.release_notifications === "major",
          },
          {
            value: "minor",
            label: t("notifications.releases_choice_minor"),
            disabled: chatSettings?.release_notifications === "minor",
          },
          {
            value: "all",
            label: t("notifications.releases_choice_all"),
            disabled: chatSettings?.release_notifications === "all",
          },
        ]}
        disabled={!!error?.isBlocker}
        placeholder={
          error?.isBlocker ? "—" : t("notifications.releases_placeholder")
        }
        className="mt-9"
      />

      {/* The Spontaneous Interaction Chance Dropdown */}
      <SettingSelector
        label={t("spontaneous_label", { botName })}
        value={
          typeof chatSettings?.reply_chance_percent === "number"
            ? String(chatSettings.reply_chance_percent)
            : undefined
        }
        onChange={(val) =>
          setChatSettings((prev) =>
            prev ? { ...prev, reply_chance_percent: Number(val) } : prev
          )
        }
        options={Array.from({ length: 11 }, (_, i) => ({
          value: String(i * 10),
          label:
            i === 0
              ? t("never")
              : i === 10
              ? t("always")
              : t("reply_frequency", { percent: i * 10 }),
          disabled:
            String(i * 10) === String(chatSettings?.reply_chance_percent ?? ""),
        }))}
        disabled={!!error?.isBlocker || chatSettings?.is_private}
        placeholder={
          error?.isBlocker ? "—" : t("spontaneous_placeholder")
        }
        className="mt-9"
      />
    </BaseSettingsPage>
  );
};

export default ChatSettingsPage;
