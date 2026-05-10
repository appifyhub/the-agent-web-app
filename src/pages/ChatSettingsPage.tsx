import React, { useState, useRef } from "react";
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
import { ApiError } from "@/lib/api-error";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import {
  saveChatSettings,
  ChatSettings,
} from "@/services/chat-settings-service";
import { setCachedChats } from "@/services/chat-cache";
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

  const { chats, isLoading: isChatsLoading } = useChats(
    user_id || accessToken?.decoded.sub,
    accessToken?.raw,
  );
  const basePageRef = useRef<BaseSettingsPageRef>(null);

  const selectedChat = chats.find(
    (chat) => chat.chat_config.chat_id === chat_id,
  );

  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(null);
  const [remoteSettings, setRemoteSettings] = useState<ChatSettings | null>(
    null,
  );

  if (accessToken && !isChatsLoading && chat_id && !error?.isBlocker) {
    if (!(chatSettings?.chat_config.chat_id === chat_id)) {
      if (selectedChat) {
        setChatSettings(selectedChat);
        setRemoteSettings(selectedChat);
      } else {
        setError(PageError.blocker("error_codes.chat_not_found"));
      }
    }
  }

  // prettier-ignore
  const areSettingsChanged = !!(
    chatSettings &&
    remoteSettings &&
    // @formatter:off
    (
      chatSettings.chat_config.language_name !== remoteSettings.chat_config.language_name ||
      chatSettings.chat_config.language_iso_code !== remoteSettings.chat_config.language_iso_code ||
      chatSettings.chat_config.reply_chance_percent !== remoteSettings.chat_config.reply_chance_percent ||
      chatSettings.chat_config.release_notifications !== remoteSettings.chat_config.release_notifications ||
      chatSettings.chat_config.media_mode !== remoteSettings.chat_config.media_mode ||
      chatSettings.user_chat_config.use_about_me !== remoteSettings.user_chat_config.use_about_me ||
      chatSettings.user_chat_config.use_custom_prompt !== remoteSettings.user_chat_config.use_custom_prompt
    )
    // @formatter:on
  );

  const handleSave = async () => {
    if (!chatSettings || !remoteSettings || !chat_id || !accessToken) return;

    const isAdmin = chatSettings.chat_config.is_admin;

    const chatConfigChanged =
      chatSettings.chat_config.language_name !== remoteSettings.chat_config.language_name ||
      chatSettings.chat_config.language_iso_code !== remoteSettings.chat_config.language_iso_code ||
      chatSettings.chat_config.reply_chance_percent !== remoteSettings.chat_config.reply_chance_percent ||
      chatSettings.chat_config.release_notifications !== remoteSettings.chat_config.release_notifications ||
      chatSettings.chat_config.media_mode !== remoteSettings.chat_config.media_mode;

    const userChatConfigChanged =
      chatSettings.user_chat_config.use_about_me !== remoteSettings.user_chat_config.use_about_me ||
      chatSettings.user_chat_config.use_custom_prompt !== remoteSettings.user_chat_config.use_custom_prompt;

    const chatConfigPayload =
      isAdmin && chatConfigChanged
        ? {
            language_name: chatSettings.chat_config.language_name,
            language_iso_code: chatSettings.chat_config.language_iso_code,
            reply_chance_percent: chatSettings.chat_config.reply_chance_percent,
            release_notifications: chatSettings.chat_config.release_notifications,
            media_mode: chatSettings.chat_config.media_mode,
          }
        : undefined;

    const userChatConfigPayload = userChatConfigChanged
      ? {
          use_about_me: chatSettings.user_chat_config.use_about_me,
          use_custom_prompt: chatSettings.user_chat_config.use_custom_prompt,
        }
      : undefined;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      await saveChatSettings({
        apiBaseUrl,
        chat_id,
        rawToken: accessToken.raw,
        chatConfig: chatConfigPayload,
        userChatConfig: userChatConfigPayload,
      });
      setRemoteSettings(chatSettings);
      const updatedChats = chats.map((c) =>
        c.chat_config.chat_id === chat_id ? chatSettings : c,
      );
      const resolvedUserId = user_id || accessToken.decoded.sub;
      if (resolvedUserId) setCachedChats(resolvedUserId, updatedChats);
      toast(t("saved"));
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(
        saveError instanceof ApiError
          ? PageError.fromApiError(saveError)
          : PageError.simple("errors.save_failed"),
      );
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
      isContentLoading={isLoadingState || isChatsLoading}
      externalError={error}
      onExternalErrorDismiss={() => setError(null)}
    >

      {/* Chat name link for opening drawer - mobile only */}
      {selectedChat && (
        <div className="flex justify-center lg:hidden">
          <button
            onClick={() => basePageRef.current?.openDrawer()}
            className="text-sm text-accent-amber/70 hover:text-accent-amber"
          >
            <span className="flex items-center space-x-1 underline underline-offset-4 decoration-accent-amber/70">
              <span>{selectedChat.chat_config.title || t("untitled")}</span>
              <PlatformIcon
                platform={Platform.fromString(selectedChat.chat_config.platform)}
                className="h-3 w-3"
              />
              <ChevronsRight className="h-4 w-4" />
            </span>
          </button>
        </div>
      )}
      <div className="h-2" />
      <div className="flex flex-col items-center gap-9 w-full">

        {/* Admin-only section: chat-wide controls */}
        {chatSettings?.chat_config.is_admin && (
          <>
            {/* The Preferred Language Dropdown */}
            <SettingSelector
              label={t("preferred_language_label", { botName })}
              value={chatSettings.chat_config.language_iso_code || undefined}
              onChange={(val) => {
                const newLanguageIsoCode = val;
                const newLanguageName = LLM_LANGUAGES.find(
                  (lang) => lang.isoCode === newLanguageIsoCode,
                )?.defaultName as string;
                setChatSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        chat_config: {
                          ...prev.chat_config,
                          language_iso_code: newLanguageIsoCode,
                          language_name: newLanguageName,
                        },
                      }
                    : prev,
                );
              }}
              onUndo={
                chatSettings.chat_config.language_iso_code !==
                remoteSettings?.chat_config.language_iso_code
                  ? () =>
                      setChatSettings((prev) =>
                        prev && remoteSettings
                          ? {
                              ...prev,
                              chat_config: {
                                ...prev.chat_config,
                                language_iso_code:
                                  remoteSettings.chat_config.language_iso_code,
                                language_name:
                                  remoteSettings.chat_config.language_name,
                              },
                            }
                          : prev,
                      )
                  : undefined
              }
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
                  lang.isoCode === chatSettings.chat_config.language_iso_code,
              }))}
              disabled={!!error?.isBlocker}
              placeholder={
                error?.isBlocker ? "—" : t("preferred_language_placeholder")
              }
              className="w-full sm:w-md"
            />

            {/* Release Notifications Dropdown */}
            <SettingSelector
              label={t("notifications.releases_label", { botName })}
              value={chatSettings.chat_config.release_notifications || undefined}
              onChange={(val) =>
                setChatSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        chat_config: {
                          ...prev.chat_config,
                          release_notifications:
                            val as ReleaseNotificationsSetting,
                        },
                      }
                    : prev,
                )
              }
              onUndo={
                chatSettings.chat_config.release_notifications !==
                remoteSettings?.chat_config.release_notifications
                  ? () =>
                      setChatSettings((prev) =>
                        prev && remoteSettings
                          ? {
                              ...prev,
                              chat_config: {
                                ...prev.chat_config,
                                release_notifications:
                                  remoteSettings.chat_config
                                    .release_notifications,
                              },
                            }
                          : prev,
                      )
                  : undefined
              }
              options={[
                {
                  value: "none",
                  label: t("notifications.releases_choice_none"),
                  disabled:
                    chatSettings.chat_config.release_notifications === "none",
                },
                {
                  value: "major",
                  label: t("notifications.releases_choice_major"),
                  disabled:
                    chatSettings.chat_config.release_notifications === "major",
                },
                {
                  value: "minor",
                  label: t("notifications.releases_choice_minor"),
                  disabled:
                    chatSettings.chat_config.release_notifications === "minor",
                },
                {
                  value: "all",
                  label: t("notifications.releases_choice_all"),
                  disabled:
                    chatSettings.chat_config.release_notifications === "all",
                },
              ]}
              disabled={!!error?.isBlocker}
              placeholder={
                error?.isBlocker
                  ? "—"
                  : t("notifications.releases_placeholder")
              }
              className="w-full sm:w-md"
            />

            {/* Media Mode Dropdown */}
            <SettingSelector
              label={t("media.mode_label", { botName })}
              value={chatSettings.chat_config.media_mode || undefined}
              onChange={(val) =>
                setChatSettings((prev) =>
                  prev
                    ? {
                        ...prev,
                        chat_config: {
                          ...prev.chat_config,
                          media_mode: val as MediaModeSetting,
                        },
                      }
                    : prev,
                )
              }
              onUndo={
                chatSettings.chat_config.media_mode !==
                remoteSettings?.chat_config.media_mode
                  ? () =>
                      setChatSettings((prev) =>
                        prev && remoteSettings
                          ? {
                              ...prev,
                              chat_config: {
                                ...prev.chat_config,
                                media_mode: remoteSettings.chat_config.media_mode,
                              },
                            }
                          : prev,
                      )
                  : undefined
              }
              options={[
                {
                  value: "photo",
                  label: t("media.mode_choice_photo"),
                  disabled: chatSettings.chat_config.media_mode === "photo",
                },
                {
                  value: "file",
                  label: t("media.mode_choice_file"),
                  disabled: chatSettings.chat_config.media_mode === "file",
                },
                {
                  value: "all",
                  label: t("media.mode_choice_all"),
                  disabled: chatSettings.chat_config.media_mode === "all",
                },
              ]}
              disabled={!!error?.isBlocker}
              placeholder={
                error?.isBlocker ? "—" : t("media.mode_placeholder")
              }
              className="w-full sm:w-md"
            />

            {/* The Spontaneous Interaction Chance Dropdown (hidden in private chats) */}
            {!chatSettings.chat_config.is_private && (
              <SettingSelector
                label={t("spontaneous_label", { botName })}
                value={
                  typeof chatSettings.chat_config.reply_chance_percent ===
                  "number"
                    ? String(chatSettings.chat_config.reply_chance_percent)
                    : undefined
                }
                onChange={(val) =>
                  setChatSettings((prev) =>
                    prev
                      ? {
                          ...prev,
                          chat_config: {
                            ...prev.chat_config,
                            reply_chance_percent: Number(val),
                          },
                        }
                      : prev,
                  )
                }
                onUndo={
                  chatSettings.chat_config.reply_chance_percent !==
                  remoteSettings?.chat_config.reply_chance_percent
                    ? () =>
                        setChatSettings((prev) =>
                          prev && remoteSettings
                            ? {
                                ...prev,
                                chat_config: {
                                  ...prev.chat_config,
                                  reply_chance_percent:
                                    remoteSettings.chat_config
                                      .reply_chance_percent,
                                },
                              }
                            : prev,
                        )
                    : undefined
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
                    String(i * 10) ===
                    String(
                      chatSettings.chat_config.reply_chance_percent ?? "",
                    ),
                }))}
                disabled={!!error?.isBlocker}
                placeholder={
                  error?.isBlocker ? "—" : t("spontaneous_placeholder")
                }
                className="w-full sm:w-md"
              />
            )}
          </>
        )}

        {/* Subtitle separating admin and personal sections */}
        {!chatSettings?.chat_config.is_private && chatSettings?.chat_config.is_admin && (
          <h3 className="leading-none font-semibold text-center mx-auto mt-14 text-base text-blue-300">
            {t("chat_settings_personal_subtitle")}
          </h3>
        )}

        {/* Use About Me toggle */}
        <SettingToggle
          id="use-about-me"
          label={t("use_about_me_label", { botName })}
          helperText={t("use_about_me_helper", { botName })}
          checked={chatSettings?.user_chat_config.use_about_me || false}
          onChange={(checked) =>
            setChatSettings((prev) =>
              prev
                ? {
                    ...prev,
                    user_chat_config: {
                      ...prev.user_chat_config,
                      use_about_me: checked,
                    },
                  }
                : prev,
            )
          }
          disabled={!!error?.isBlocker}
          className="w-full sm:w-md"
          onProfileLinkClick={() => {
            const resolvedUserId = user_id || accessToken?.decoded.sub;
            if (resolvedUserId && lang_iso_code) {
              navigateToProfile(resolvedUserId, lang_iso_code);
            }
          }}
          profileLinkText={t("use_about_me_which_information")}
        />

        {/* Use Custom Prompt toggle */}
        <SettingToggle
          id="use-custom-prompt"
          label={t("use_custom_prompt_label", { botName })}
          helperText={t("use_custom_prompt_helper", { botName })}
          checked={chatSettings?.user_chat_config.use_custom_prompt || false}
          onChange={(checked) =>
            setChatSettings((prev) =>
              prev
                ? {
                    ...prev,
                    user_chat_config: {
                      ...prev.user_chat_config,
                      use_custom_prompt: checked,
                    },
                  }
                : prev,
            )
          }
          disabled={!!error?.isBlocker}
          className="w-full sm:w-md"
          onProfileLinkClick={() => {
            const resolvedUserId = user_id || accessToken?.decoded.sub;
            if (resolvedUserId && lang_iso_code) {
              navigateToProfile(resolvedUserId, lang_iso_code);
            }
          }}
          profileLinkText={t("use_custom_prompt_which_instructions")}
        />
      </div>
    </BaseSettingsPage>
  );
};

export default ChatSettingsPage;
