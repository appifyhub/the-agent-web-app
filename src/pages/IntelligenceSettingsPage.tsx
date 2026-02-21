import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { toast } from "sonner";
import { PageError } from "@/lib/utils";
import { t } from "@/lib/translations";
import AdvancedToolsPanel from "@/components/AdvancedToolsPanel";
import SettingSelector from "@/components/SettingSelector";
import WarningBanner from "@/components/WarningBanner";
import { Wallet, Sparkles, Scale, Settings, Undo2, Key, ShoppingCart, Lightbulb } from "lucide-react";
import {
  saveUserSettings,
  UserSettings,
  buildChangedPayload,
  areSettingsChanged,
} from "@/services/user-settings-service";
import { useUserSettings } from "@/hooks/useUserSettings";
import {
  fetchExternalTools,
  ExternalToolsResponse,
  ToolType,
} from "@/services/external-tools-service";
import { usePageSession } from "@/hooks/usePageSession";
import { useNavigation } from "@/hooks/useNavigation";
import {
  ToolPreset,
  computePresetChoices,
  detectCurrentPreset,
} from "@/lib/tool-presets";

const IntelligenceSettingsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { navigateToAccess, navigateToPurchases } = useNavigation();

  const {
    userSettings: remoteSettings,
    updateSettingsCache,
  } = useUserSettings(user_id, accessToken?.raw);

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [externalToolsData, setExternalToolsData] =
    useState<ExternalToolsResponse | null>(null);
  const [openAccordionSection, setOpenAccordionSection] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<ToolPreset>("custom");
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Initialize local editing state when remote settings first load
  useEffect(() => {
    if (remoteSettings && !userSettings) {
      setUserSettings(remoteSettings);
      setSelectedPreset(detectCurrentPreset(remoteSettings));
    }
  }, [remoteSettings, userSettings]);

  // Fetch external tools and check sponsorship when session and settings are ready
  useEffect(() => {
    if (!accessToken || !user_id || error?.isBlocker || !remoteSettings) return;

    if (remoteSettings.is_sponsored) {
      const sponsorshipsUrl = `/${lang_iso_code}/user/${user_id}/sponsorships${window.location.search}`;
      const sponsorshipsTitle = t("sponsorships");
      const linkStyle = "underline text-amber-100 hover:text-white";
      const sponsorshipsLinkHtml = `<a href="${sponsorshipsUrl}" class="${linkStyle}" >${sponsorshipsTitle}</a>`;
      const htmlMessage = t("errors.sponsored_user", {
        sponsorshipsLink: sponsorshipsLinkHtml,
      });
      const errorMessage = (
        <span dangerouslySetInnerHTML={{ __html: htmlMessage }} />
      );
      setError(PageError.blockerWithHtml(errorMessage, false));
      return;
    }

    const fetchData = async () => {
      setIsLoadingState(true);
      setError(null);
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        const externalTools = await fetchExternalTools({
          apiBaseUrl,
          user_id,
          rawToken: accessToken.raw,
        });
        console.info("Fetched external tools!", externalTools);
        setExternalToolsData(externalTools);
      } catch (err) {
        console.error("Error fetching data!", err);
        setError(PageError.blocker("errors.fetch_failed"));
      } finally {
        setIsLoadingState(false);
      }
    };

    fetchData();
  }, [accessToken, user_id, lang_iso_code, error, setError, setIsLoadingState, remoteSettings]);

  const hasSettingsChanged = !!(
    userSettings &&
    remoteSettings &&
    areSettingsChanged(userSettings, remoteSettings)
  );

  const handleSave = async () => {
    if (!userSettings || !remoteSettings || !user_id || !accessToken) return;

    // Save current scroll position
    const scrollPosition = window.scrollY;

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

      // Refetch external tools data to get updated is_configured status
      const updatedExternalTools = await fetchExternalTools({
        apiBaseUrl,
        user_id,
        rawToken: accessToken.raw,
      });

      updateSettingsCache(userSettings!);
      setExternalToolsData(updatedExternalTools);
      setSelectedPreset(detectCurrentPreset(userSettings));
      toast(t("saved"));

      // Restore scroll position after state updates
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
    } catch (saveError) {
      console.error("Error saving settings!", saveError);
      setError(PageError.simple("errors.save_failed"));
    } finally {
      setIsLoadingState(false);
    }
  };

  const handlePresetChange = (preset: string) => {
    const typedPreset = preset as ToolPreset;
    setSelectedPreset(typedPreset);
    if (typedPreset === "custom" || !userSettings || !externalToolsData) return;
    const choices = computePresetChoices(typedPreset);
    const newSettings = { ...userSettings };
    for (const [toolType, toolId] of Object.entries(choices)) {
      const fieldName = `tool_choice_${toolType}` as keyof UserSettings;
      (newSettings as Record<string, unknown>)[fieldName] = toolId;
    }
    setUserSettings(newSettings);
  };

  const handleToolChoiceChange = (toolType: ToolType, toolId: string) => {
    if (!userSettings || !externalToolsData) return;
    const fieldName = `tool_choice_${toolType}` as keyof UserSettings;
    const newSettings = { ...userSettings, [fieldName]: toolId };
    setUserSettings(newSettings);
    setSelectedPreset(detectCurrentPreset(newSettings));
  };

  const handleRestoreSettings = () => {
    if (!remoteSettings || !externalToolsData) return;
    setUserSettings(remoteSettings);
    setSelectedPreset(detectCurrentPreset(remoteSettings));
  };

  const handleProviderNavigate = (providerId: string) => {
    if (lang_iso_code && user_id) {
      // Navigate to Access page with provider query parameter
      navigateToAccess(user_id, lang_iso_code);
      // Store provider ID in sessionStorage so Access page can scroll to it
      sessionStorage.setItem("scrollToProvider", providerId);
    }
  };

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  // Check if user has credits or API keys configured
  const hasCredits = (userSettings?.credit_balance ?? 0) > 0;
  const hasAnyApiKey = externalToolsData?.providers.some(p => p.is_configured) ?? false;
  const showNoAccessWarning = !hasCredits && !hasAnyApiKey && !isWarningDismissed;

  return (
    <BaseSettingsPage
      page="intelligence"
      cardTitle={t("intelligence_card_title", { botName })}
      onActionClicked={handleSave}
      actionDisabled={!hasSettingsChanged}
      showCancelButton={hasSettingsChanged}
      onCancelClicked={handleRestoreSettings}
      cancelIcon={<Undo2 className="h-6 w-6" />}
      cancelTooltipText={t("restore")}
      isContentLoading={isLoadingState}
      externalError={error}
    >
      {externalToolsData && (
        <>
          {showNoAccessWarning && (
            <WarningBanner
              message={t("intelligence_warnings.no_access_message")}
              icon={<Lightbulb className="h-5 w-5 text-blue-300/60 shrink-0" />}
              borderColor="border-blue-300/40"
              onDismiss={() => setIsWarningDismissed(true)}
              secondaryLabel={t("configure_ai_providers")}
              secondaryOnClick={() =>
                navigateToAccess(user_id!, lang_iso_code!)
              }
              secondaryIcon={<Key className="h-3.5 w-3.5 mb-0.5" />}
              primaryLabel={t("purchases.buy_credits")}
              primaryOnClick={() =>
                navigateToPurchases(user_id!, lang_iso_code!)
              }
              primaryIcon={<ShoppingCart className="h-3.5 w-3.5 mb-0.5" />}
            />
          )}
          {showNoAccessWarning && <div className="h-8" />}

          <SettingSelector
            label={t("intelligence_presets.label")}
            value={selectedPreset}
            onChange={handlePresetChange}
            disabled={!!error?.isBlocker}
            options={[
              {
                value: "lowest_price",
                label: (
                  <span className="flex items-center gap-3">
                    <Wallet className="h-4 w-4 shrink-0 text-blue-300" />
                    {t("intelligence_presets.lowest_price")}
                  </span>
                ),
              },
              {
                value: "highest_price",
                label: (
                  <span className="flex items-center gap-3">
                    <Sparkles className="h-4 w-4 shrink-0 text-blue-300" />
                    {t("intelligence_presets.highest_price")}
                  </span>
                ),
              },
              {
                value: "agent_choice",
                label: (
                  <span className="flex items-center gap-3">
                    <Scale className="h-4 w-4 shrink-0 text-blue-300" />
                    {t("intelligence_presets.agent_choice")}
                  </span>
                ),
              },
              {
                value: "custom",
                label: (
                  <span className="flex items-center gap-3">
                    <Settings className="h-4 w-4 shrink-0 text-blue-300" />
                    {t("intelligence_presets.custom")}
                  </span>
                ),
              },
            ]}
          />
          <p className="text-sm text-muted-foreground mx-1">
            {selectedPreset === "lowest_price" && t("intelligence_presets.lowest_price_description")}
            {selectedPreset === "highest_price" && t("intelligence_presets.highest_price_description")}
            {selectedPreset === "agent_choice" && t("intelligence_presets.agent_choice_description")}
            {selectedPreset === "custom" && t("intelligence_presets.custom_description")}
          </p>
          <div className="h-4" />
          <h3 className="leading-none font-semibold text-center mx-auto mt-14 text-bas text-blue-300">
            {t("detailed_tool_choices")}
          </h3>
          <AdvancedToolsPanel
            tools={externalToolsData.tools}
            providers={externalToolsData.providers}
            userSettings={userSettings}
            remoteSettings={remoteSettings}
            onToolChoiceChange={handleToolChoiceChange}
            disabled={!!error?.isBlocker}
            onProviderNavigate={handleProviderNavigate}
            hasCredits={hasCredits}
            openSection={openAccordionSection}
            onOpenSectionChange={setOpenAccordionSection}
          />
        </>
      )}
    </BaseSettingsPage>
  );
};

export default IntelligenceSettingsPage;
