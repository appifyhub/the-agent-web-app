import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import BaseSettingsPage, {
  BaseSettingsPageRef,
} from "@/pages/BaseSettingsPage";
import type {
  ReleaseNotificationsSetting,
  MediaModeSetting,
} from "@/services/chat-settings-service";
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
import { useChats } from "@/hooks/useChats";
import { ChevronsRight } from "lucide-react";
import PlatformIcon from "@/components/PlatformIcon";
import { Platform } from "@/lib/platform";
import SettingToggle from "@/components/SettingToggle";
import { useNavigation } from "@/hooks/useNavigation";

const ChatSettingsPage: React.FC = () => {
  const { chat_id, user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    chat_id: string;
    user_id?: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { navigateToProfile } = useNavigation();

  const { chats } = useChats(
    user_id || accessToken?.decoded.sub,
    accessToken?.raw
  );
  const basePageRef = useRef<BaseSettingsPageRef>(null);

  const selectedChat = chats.find((chat) => chat.chat_id === chat_id);

  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<ChatSettings | null>(
    null
  );

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
          rawToken: accessToken.raw,
        });
        console.info("Fetched settings!", settings);
        setChatSettings(settings);
        setRemoteSettings(settings);
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchSettings();
  }, [accessToken, chat_id, error, setError, setIsLoadingState]);

  // prettier-ignore
  const areSettingsChanged = !!(
    chatSettings &&
    remoteSettings &&
    // @formatter:off
    (
      chatSettings.language_name !== remoteSettings.language_name ||
      chatSettings.language_iso_code !== remoteSettings.language_iso_code ||
      chatSettings.reply_chance_percent !== remoteSettings.reply_chance_percent ||
      chatSettings.release_notifications !== remoteSettings.release_notifications ||
      chatSettings.media_mode !== remoteSettings.media_mode ||
      chatSettings.use_about_me !== remoteSettings.use_about_me
    )
    // @formatter:on
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
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  return (
    <BaseSettingsPage
      ref={basePageRef}
      page="chat"
      cardTitle={t("configure_title", { botName })}
      onActionClicked={handleSave}
      actionDisabled={!areSettingsChanged}
      isContentLoading={isLoadingState}
      externalError={error}
    >

      {/* Chat name link for opening drawer - mobile only */}
      {selectedChat && (
        <div className="flex justify-center lg:hidden">
          <button
            onClick={() => basePageRef.current?.openDrawer()}
            className="text-sm text-accent-amber/70 hover:text-accent-amber"
          >
            <span className="flex items-center space-x-1 underline underline-offset-4 decoration-accent-amber/70">
              <span>{selectedChat.title || t("untitled")}</span>
              <PlatformIcon
                platform={Platform.fromString(selectedChat.platform)}
                className="h-3 w-3"
              />
              <ChevronsRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
      <div className="h-2" />

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

      {/* Media Mode Dropdown */}
      <SettingSelector
        label={t("media.mode_label", { botName })}
        value={chatSettings?.media_mode || undefined}
        onChange={(val) =>
          setChatSettings((prev) =>
            prev
              ? {
                  ...prev,
                  media_mode: val as MediaModeSetting,
                }
              : prev
          )
        }
        options={[
          {
            value: "photo",
            label: t("media.mode_choice_photo"),
            disabled: chatSettings?.media_mode === "photo",
          },
          {
            value: "file",
            label: t("media.mode_choice_file"),
            disabled: chatSettings?.media_mode === "file",
          },
          {
            value: "all",
            label: t("media.mode_choice_all"),
            disabled: chatSettings?.media_mode === "all",
          },
        ]}
        disabled={!!error?.isBlocker}
        placeholder={error?.isBlocker ? "—" : t("media.mode_placeholder")}
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
        placeholder={error?.isBlocker ? "—" : t("spontaneous_placeholder")}
        className="mt-9"
      />

      {/* Use About Me toggle */}
      <SettingToggle
        id="use-about-me"
        label={
          chatSettings?.is_private
            ? t("use_about_me_label_singular", { botName })
            : t("use_about_me_label", { botName })
        }
        helperText={
          chatSettings?.is_private
            ? t("use_about_me_helper_singular", { botName })
            : t("use_about_me_helper", { botName })
        }
        checked={chatSettings?.use_about_me || false}
        onChange={(checked) =>
          setChatSettings((prev) =>
            prev
              ? {
                  ...prev,
                  use_about_me: checked,
                }
              : prev
          )
        }
        disabled={!!error?.isBlocker}
        className="mt-9 mx-1"
        onProfileLinkClick={() => {
          const resolvedUserId = user_id || accessToken?.decoded.sub;
          if (resolvedUserId && lang_iso_code) {
            navigateToProfile(resolvedUserId, lang_iso_code);
          }
        }}
        profileLinkText={t("use_about_me_which_information")}
      />
    </BaseSettingsPage>
  );
};

export default ChatSettingsPage;
