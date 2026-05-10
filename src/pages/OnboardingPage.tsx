import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { t } from "@/lib/translations";
import { PageError, cn } from "@/lib/utils";
import { usePageSession } from "@/hooks/usePageSession";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useExternalTools } from "@/hooks/useExternalTools";
import { useNavigation } from "@/hooks/useNavigation";
import { useChats } from "@/hooks/useChats";
import {
  saveUserSettings,
  UserSettingsPayload,
} from "@/services/user-settings-service";
import { IntelligencePreset } from "@/services/external-tools-service";
import { clearUserSettingsCache } from "@/services/user-settings-cache";
import { computePresetChoices } from "@/lib/tool-presets";
import { ApiError } from "@/lib/api-error";
import { toast } from "sonner";
import { INTERFACE_LANGUAGES, LLM_LANGUAGES } from "@/lib/languages";
import { LanguageItemContent } from "@/components/LanguageDropdown";
import CardSelector from "@/components/CardSelector";
import { saveChatSettings } from "@/services/chat-settings-service";
import SettingToggle from "@/components/SettingToggle";
import SettingInput from "@/components/SettingInput";
import SettingTextarea from "@/components/SettingTextarea";
import SettingSelector from "@/components/SettingSelector";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  Wallet,
  Sparkles,
  Scale,
  Key,
  BadgeCent,
  HeartHandshake,
  Clock,
  ChevronLeft,
  ScrollText,
  UserRound,
  Split,
} from "lucide-react";

type AccessChoice = "api_keys" | "credits";

const TOTAL_STEPS = 4;
const TERMS_URL = "https://www.appifyhub.com/terms.html";
const PRIVACY_URL = "https://www.appifyhub.com/privacy.html";

const OnboardingPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    user_id: string;
    lang_iso_code: string;
  }>();

  const location = useLocation();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { userSettings: remoteSettings, updateSettingsCache } = useUserSettings(
    user_id,
    accessToken?.raw,
  );

  const { navigateToAccess, navigateToPurchases, navigateToSponsorships, navigateWithLanguageChange } =
    useNavigation();

  const { externalTools } = useExternalTools(user_id, accessToken?.raw);

  const { chats } = useChats(user_id, accessToken?.raw);

  const [isPolicyAccepted, setIsPolicyAccepted] = useState(false);
  const [fullName, setFullName] = useState("");
  const [aboutMe, setAboutMe] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [hasSyncedRemote, setHasSyncedRemote] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<IntelligencePreset | null>(
    "agent_choice",
  );
  const [accessChoice, setAccessChoice] = useState<AccessChoice | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | undefined>();

  if (remoteSettings && !hasSyncedRemote) {
    setFullName(remoteSettings.full_name || "");
    setAboutMe(remoteSettings.about_me || "");
    setCustomPrompt(remoteSettings.custom_prompt || "");
    setHasSyncedRemote(true);
  }

  useEffect(() => {
    if (!carouselApi) return;
    const updateIndex = () => setCurrentStep(carouselApi.selectedScrollSnap());
    updateIndex();
    carouselApi.on("select", updateIndex);
    return () => {
      carouselApi.off("select", updateIndex);
    };
  }, [carouselApi]);

  const isWaitlisted = !!(
    remoteSettings?.is_on_waitlist && !remoteSettings?.is_invited_to_start
  );

  const isSponsored = !!remoteSettings?.is_sponsored;

  const canFinish =
    isPolicyAccepted &&
    selectedPreset !== null &&
    !!externalTools?.presets &&
    (isSponsored || accessChoice !== null) &&
    currentStep === TOTAL_STEPS - 1;

  const handleNext = () => carouselApi?.scrollNext();
  const handlePrev = () => carouselApi?.scrollPrev();

  const handleFinish = async () => {
    const presets = externalTools?.presets;
    if (!user_id || !accessToken || !selectedPreset || !presets) return;
    if (!isSponsored && !accessChoice) return;

    setIsLoadingState(true);
    setError(null);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
      const presetChoices = computePresetChoices(selectedPreset, presets);

      const payload: UserSettingsPayload = { are_policies_accepted: true };
      if (fullName.trim()) payload.full_name = fullName.trim();
      if (aboutMe.trim()) payload.about_me = aboutMe.trim();
      if (customPrompt.trim()) payload.custom_prompt = customPrompt.trim();

      for (const [toolType, toolId] of Object.entries(presetChoices)) {
        const fieldName =
          `tool_choice_${toolType}` as keyof UserSettingsPayload;
        (payload as Record<string, unknown>)[fieldName] = toolId;
      }

      await saveUserSettings({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
        payload,
      });

      if (remoteSettings) {
        updateSettingsCache({ ...remoteSettings, ...payload });
      } else {
        clearUserSettingsCache(user_id);
      }

      const llmLanguageMatch = LLM_LANGUAGES.find((l) => l.isoCode === lang_iso_code)!;
      const ownChats = chats.filter((c) => c.chat_config.is_own);
      await Promise.allSettled(
        ownChats.map(async (chat) => {
          try {
            await saveChatSettings({
              apiBaseUrl,
              chat_id: chat.chat_config.chat_id,
              rawToken: accessToken.raw,
              chatConfig: {
                language_name: llmLanguageMatch.defaultName,
                language_iso_code: llmLanguageMatch.isoCode,
              },
            });
          } catch (err) {
            console.error("Failed to update chat language for", chat.chat_config.chat_id, err);
          }
        }),
      );

      toast(t("onboarding.success", { botName }));
      if (isSponsored) {
        navigateToSponsorships(user_id, lang_iso_code!);
      } else if (accessChoice === "api_keys") {
        navigateToAccess(user_id, lang_iso_code!);
      } else {
        navigateToPurchases(user_id, lang_iso_code!);
      }
    } catch (err) {
      console.error("Error during onboarding!", err);
      if (err instanceof ApiError) {
        setError(PageError.fromApiError(err));
      } else {
        setError(PageError.simple("errors.save_failed"));
      }
    } finally {
      setIsLoadingState(false);
    }
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;
  return (
    <BaseSettingsPage
      page="onboarding"
      onActionClicked={
        currentStep === TOTAL_STEPS - 1 ? handleFinish : handleNext
      }
      actionDisabled={
        currentStep === TOTAL_STEPS - 1
          ? !canFinish
          : currentStep === 0 && !isPolicyAccepted
      }
      actionButtonText={
        currentStep === TOTAL_STEPS - 1 ? t("onboarding.finish") : t("next")
      }
      showActionButton={!isWaitlisted}
      showSecondaryButton={
        currentStep > (isPolicyAccepted ? 1 : 0) && !isWaitlisted
      }
      onSecondaryClicked={handlePrev}
      secondaryIcon={<ChevronLeft className="h-5 w-5" />}
      secondaryTooltipText={t("back")}
      isContentLoading={isLoadingState}
      externalError={error}
      onExternalErrorDismiss={() => setError(null)}
    >
      {isWaitlisted ? (
        <div className="flex flex-col items-center space-y-6 text-center mt-4 mb-8">
          <Clock className="h-14 w-14 text-accent-amber" />
          <h3 className="text-xl font-semibold">
            {t("onboarding.waitlist_title")}
          </h3>
          <p className="text-muted-foreground font-light">
            {t("onboarding.waitlist_message")}
          </p>
        </div>
      ) : (
        <>
          <Carousel opts={{ watchDrag: false }} setApi={setCarouselApi}>
            <CarouselContent>
              {/* Step 0: Policy acceptance */}
              <CarouselItem>
                <div className="flex flex-col items-center justify-center min-h-60 px-4 sm:px-0">
                  <div className="h-8" />
                  <ScrollText
                    className="h-12 w-12 text-accent-amber shrink-0"
                    strokeWidth={1.2}
                  />
                  <div className="h-18" />
                  <SettingSelector
                    label={t("onboarding.interface_language_label", { botName })}
                    value={lang_iso_code}
                    onChange={(isoCode) => navigateWithLanguageChange(isoCode, location.pathname)}
                    options={INTERFACE_LANGUAGES.map((lang) => ({
                      value: lang.isoCode,
                      label: <LanguageItemContent lang={lang} />,
                      disabled: lang.isoCode === lang_iso_code,
                    }))}
                    className="w-full sm:w-auto"
                  />
                  <div className="h-14" />
                  <p className="text-[1.05rem] font-light text-center [hyphens:auto] w-full sm:w-md">
                    {t("onboarding.policy_prefix")}
                    <br />
                    <a
                      href={TERMS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 text-accent-amber/80 hover:text-accent-amber"
                    >
                      {t("footer.terms")}
                    </a>
                    {" · "}
                    <a
                      href={PRIVACY_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 text-accent-amber/80 hover:text-accent-amber"
                    >
                      {t("footer.privacy")}
                    </a>
                  </p>
                  <div className="h-8" />
                  <div className="flex justify-center">
                    <SettingToggle
                      id="policy-accept"
                      label={t("onboarding.policy_label")}
                      labelClassName="text-lg"
                      checked={isPolicyAccepted}
                      onChange={(checked) => {
                        setIsPolicyAccepted(checked);
                        if (checked) setTimeout(handleNext, 200);
                      }}
                      disabled={isPolicyAccepted}
                      switchClassName="scale-150 me-2"
                    />
                  </div>
                </div>
              </CarouselItem>

              {/* Step 1: Name & About */}
              <CarouselItem>
                <div className="flex flex-col items-center gap-6 px-1 pb-1">
                  <div className="h-4" />
                  <UserRound
                    className="h-12 w-12 text-accent-amber mx-auto shrink-0"
                    strokeWidth={1.2}
                  />
                  <div className="h-4" />
                  <SettingInput
                    id="full-name"
                    label={t("profile_full_name_label", { botName })}
                    value={fullName}
                    onChange={setFullName}
                    onClear={() => setFullName("")}
                    disabled={!!error?.isBlocker || !isPolicyAccepted}
                    placeholder={t("profile_full_name_placeholder")}
                    className="w-full sm:w-auto"
                  />
                  <SettingTextarea
                    id="about-me"
                    label={t("about_me_label", { botName })}
                    value={aboutMe}
                    onChange={setAboutMe}
                    onClear={() => setAboutMe("")}
                    disabled={!!error?.isBlocker || !isPolicyAccepted}
                    placeholder={
                      isPolicyAccepted
                        ? t("about_me_placeholder", {
                            name: fullName || t("about_me_name_fallback"),
                          })
                        : "—"
                    }
                    minRows={2}
                    maxRows={6}
                    className="w-full sm:w-auto"
                  />
                  <SettingTextarea
                    id="custom-prompt"
                    label={t("custom_prompt_label", { botName })}
                    value={customPrompt}
                    onChange={setCustomPrompt}
                    onClear={() => setCustomPrompt("")}
                    disabled={!!error?.isBlocker || !isPolicyAccepted}
                    placeholder={
                      isPolicyAccepted
                        ? t("custom_prompt_placeholder", { botName })
                        : "—"
                    }
                    minRows={2}
                    maxRows={6}
                    className="w-full sm:w-auto"
                  />
                  <div className="h-0.5" />
                </div>
              </CarouselItem>

              {/* Step 2: Preset */}
              <CarouselItem>
                <div className="flex flex-col items-center gap-6 px-1 pb-1">
                  <div className="h-4" />
                  <Sparkles
                    className="h-12 w-12 text-accent-amber mx-auto shrink-0"
                    strokeWidth={1.2}
                  />
                  <div className="h-4" />
                  <CardSelector
                    value={selectedPreset}
                    onChange={(v) => setSelectedPreset(v as IntelligencePreset)}
                    disabled={!!error?.isBlocker || !isPolicyAccepted}
                    options={[
                      { value: "lowest_price", icon: Wallet, title: t("intelligence_presets.lowest_price"), description: t("intelligence_presets.lowest_price_description") },
                      { value: "highest_price", icon: Sparkles, title: t("intelligence_presets.highest_price"), description: t("intelligence_presets.highest_price_description") },
                      { value: "agent_choice", icon: Scale, title: t("intelligence_presets.agent_choice"), description: t("intelligence_presets.agent_choice_description") },
                    ]}
                  />
                </div>
              </CarouselItem>

              {/* Step 3: Access choice */}
              <CarouselItem>
                {isSponsored ? (
                  <div className="flex flex-col items-center justify-center min-h-60 px-4 sm:px-0">
                    <div className="h-6" />
                    <HeartHandshake
                      className="h-12 w-12 text-accent-amber shrink-0"
                      strokeWidth={1.2}
                    />
                    <div className="h-16" />
                    <p className="text-[1.05rem] font-light text-center">
                      {t("sponsorships")}
                    </p>
                    <div className="h-2" />
                    <p className="text-[1.05rem] font-light text-muted-foreground text-center">
                      {t("sponsorship.you_are_sponsored")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 px-1 pb-1">
                    <div className="h-4" />
                    <Split
                      className="h-12 w-12 text-accent-amber mx-auto shrink-0"
                      strokeWidth={1.2}
                    />
                    <div className="h-4" />
                    <CardSelector
                      value={accessChoice}
                      onChange={(v) => setAccessChoice(v as AccessChoice)}
                      disabled={!!error?.isBlocker || !isPolicyAccepted}
                      options={[
                        { value: "credits", icon: BadgeCent, title: t("onboarding.access_credits_title"), description: t("onboarding.access_credits_description") },
                        { value: "api_keys", icon: Key, title: t("onboarding.access_api_keys_title"), description: t("onboarding.access_api_keys_description") },
                      ]}
                    />
                  </div>
                )}
              </CarouselItem>
            </CarouselContent>
          </Carousel>

          {/* Step indicator dots */}
          <div className="flex gap-2 items-center justify-center mt-12">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={cn(
                  "h-2 rounded-full transition-all",
                  currentStep === i
                    ? "w-6 bg-accent-amber"
                    : "w-2 bg-foreground/20",
                )}
              />
            ))}
          </div>
        </>
      )}
    </BaseSettingsPage>
  );
};

export default OnboardingPage;
