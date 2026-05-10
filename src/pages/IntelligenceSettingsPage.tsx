import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import BaseSettingsPage from "@/pages/BaseSettingsPage";
import { toast } from "sonner";
import { ApiError } from "@/lib/api-error";
import { PageError, buildSponsoredBlockerError } from "@/lib/utils";
import { t } from "@/lib/translations";
import AdvancedToolsPanel from "@/components/AdvancedToolsPanel";
import WarningBanner from "@/components/WarningBanner";
import {
  Wallet,
  Sparkles,
  Scale,
  Settings,
  Undo2,
  Key,
  ShoppingCart,
  Lightbulb,
} from "lucide-react";
import {
  saveUserSettings,
  UserSettings,
  buildChangedPayload,
  areSettingsChanged,
} from "@/services/user-settings-service";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useExternalTools } from "@/hooks/useExternalTools";
import { ToolType } from "@/services/external-tools-service";
import { usePageSession } from "@/hooks/usePageSession";
import { useNavigation } from "@/hooks/useNavigation";
import {
  ToolPreset,
  computePresetChoices,
  detectCurrentPreset,
} from "@/lib/tool-presets";
import CardSelector from "@/components/CardSelector";

const IntelligenceSettingsPage: React.FC = () => {
  const { user_id, lang_iso_code } = useParams<{
    lang_iso_code: string;
    user_id: string;
  }>();

  const { error, accessToken, isLoadingState, setError, setIsLoadingState } =
    usePageSession();

  const { navigateToAccess, navigateToPurchases } = useNavigation();

  const { userSettings: remoteSettings, updateSettingsCache } = useUserSettings(
    user_id,
    accessToken?.raw,
  );

  const {
    externalTools: externalToolsData,
    isLoading: isExternalToolsLoading,
    refreshExternalTools,
  } = useExternalTools(user_id, accessToken?.raw);

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [openAccordionSection, setOpenAccordionSection] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<ToolPreset | null>(null);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  // Initialize local editing state when remote settings first load
  useEffect(() => {
    if (remoteSettings && !userSettings) {
      setUserSettings(remoteSettings);
    }
  }, [remoteSettings, userSettings]);

  // Detect current preset when both settings and presets are available (only on initial load)
  useEffect(() => {
    if (remoteSettings && externalToolsData?.presets && selectedPreset === null) {
      setSelectedPreset(detectCurrentPreset(remoteSettings, externalToolsData.presets));
    }
  }, [remoteSettings, externalToolsData, selectedPreset]);

  // Check sponsorship and set blocker error if sponsored
  useEffect(() => {
    if (remoteSettings?.is_sponsored && !error?.isBlocker) {
      setError(buildSponsoredBlockerError(lang_iso_code!, user_id!));
    }
  }, [remoteSettings, lang_iso_code, user_id, error, setError]);

  const hasSettingsChanged = !!(
    userSettings &&
    remoteSettings &&
    areSettingsChanged(userSettings, remoteSettings)
  );

  const presets = externalToolsData?.presets;
  const remotePreset = useMemo(() => {
    if (!remoteSettings || !presets) return null;
    return detectCurrentPreset(remoteSettings, presets);
  }, [remoteSettings, presets]);

  const handleSave = async () => {
    if (!userSettings || !remoteSettings || !user_id || !accessToken || !externalToolsData) return;

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
      await refreshExternalTools();

      updateSettingsCache(userSettings!);
      setSelectedPreset(detectCurrentPreset(userSettings, externalToolsData.presets));
      toast(t("saved"));

      // Restore scroll position after state updates
      requestAnimationFrame(() => {
        window.scrollTo(0, scrollPosition);
      });
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

  const handlePresetChange = (preset: string) => {
    const typedPreset = preset as ToolPreset;
    setSelectedPreset(typedPreset);
    if (typedPreset === "custom" || !userSettings || !externalToolsData) return;
    const choices = computePresetChoices(typedPreset, externalToolsData.presets);
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
    setSelectedPreset(detectCurrentPreset(newSettings, externalToolsData.presets));
  };

  const handleRestoreSettings = () => {
    if (!remoteSettings || !externalToolsData) return;
    setUserSettings(remoteSettings);
    setSelectedPreset(detectCurrentPreset(remoteSettings, externalToolsData.presets));
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
  const hasAnyApiKey = externalToolsData?.providers.some((p) => p.is_configured) ?? false;
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
      isContentLoading={isLoadingState || isExternalToolsLoading}
      externalError={error}
      onExternalErrorDismiss={() => setError(null)}
      topBanner={
        showNoAccessWarning ? (
          <WarningBanner
            message={t("intelligence_warnings.no_access_message")}
            icon={<Lightbulb className="h-5 w-5 text-purple-300/70 shrink-0" />}
            borderColor="border-purple-300/40"
            onDismiss={() => setIsWarningDismissed(true)}
            secondaryLabel={t("configure_ai_providers")}
            secondaryOnClick={() => navigateToAccess(user_id!, lang_iso_code!)}
            secondaryIcon={<Key className="h-3.5 w-3.5 mb-0.5" />}
            primaryLabel={t("purchases.buy_credits")}
            primaryOnClick={() => navigateToPurchases(user_id!, lang_iso_code!)}
            primaryIcon={<ShoppingCart className="h-3.5 w-3.5 mb-0.5" />}
          />
        ) : undefined
      }
    >
      {externalToolsData ? (
        <>
          <CardSelector
            value={selectedPreset}
            remoteValue={remotePreset}
            onChange={handlePresetChange}
            disabled={!!error?.isBlocker}
            options={[
              { value: "lowest_price", icon: Wallet, title: t("intelligence_presets.lowest_price"), description: t("intelligence_presets.lowest_price_description") },
              { value: "highest_price", icon: Sparkles, title: t("intelligence_presets.highest_price"), description: t("intelligence_presets.highest_price_description") },
              { value: "agent_choice", icon: Scale, title: t("intelligence_presets.agent_choice"), description: t("intelligence_presets.agent_choice_description") },
              { value: "custom", icon: Settings, title: t("intelligence_presets.custom"), description: t("intelligence_presets.custom_description") },
            ]}
          />
          {selectedPreset === "custom" && (
            <>
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
        </>
      ) : !isLoadingState ? (
        <div className="flex flex-col items-center space-y-10 text-center mt-12">
          <Sparkles className="h-12 w-12 text-accent-amber" />
          <p className="text-foreground/80 font-light">
            {t("intelligence_warnings.no_settings")}
          </p>
        </div>
      ) : null}
    </BaseSettingsPage>
  );
};

export default IntelligenceSettingsPage;
