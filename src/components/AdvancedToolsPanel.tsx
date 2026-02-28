import React, { useState } from "react";
import {
  MessageCircle,
  Lightbulb,
  Brush,
  Eye,
  Ear,
  WandSparkles,
  ImageUp,
  Binoculars,
  DatabaseZap,
  Euro,
  Bitcoin,
  Twitter,
  BookOpenText,
  BrainCog,
  Image,
  Blocks,
  CircleHelp,
} from "lucide-react";
import CostEstimateDialog from "@/components/CostEstimateDialog";
import { t } from "@/lib/translations";
import { TranslationKey } from "@/lib/translation-keys";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import SectionedSelector, {
  SectionedSelectorSection,
} from "@/components/SectionedSelector";
import {
  ExternalToolResponse,
  ExternalToolProviderResponse,
  ToolType,
  CostEstimate,
} from "@/services/external-tools-service";
import { UserSettings } from "@/services/user-settings-service";

interface AdvancedToolsPanelProps {
  tools: ExternalToolResponse[];
  providers: ExternalToolProviderResponse[];
  userSettings: UserSettings | null;
  remoteSettings?: UserSettings | null;
  onToolChoiceChange: (toolType: ToolType, toolId: string) => void;
  onProviderNavigate?: (providerId: string) => void;
  hasCredits?: boolean;
  disabled?: boolean;
  openSection?: string;
  onOpenSectionChange?: (section: string) => void;
}

type ToolGroupCategory =
  | "text_intelligence"
  | "content_analysis"
  | "image_tools"
  | "integrations";

interface ToolCategoryGroup {
  category: ToolGroupCategory;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  toolTypes: ToolTypeGroup[];
}

interface ToolTypeGroup {
  type: ToolType;
  title: string;
  description: string;
  sections: SectionedSelectorSection[];
  currentValue: string | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}

// Map tool types to their category
const getToolGroupCategory = (toolType: ToolType): ToolGroupCategory => {
  const categoryMap: Record<ToolType, ToolGroupCategory> = {
    chat: "text_intelligence",
    reasoning: "text_intelligence",
    copywriting: "text_intelligence",
    vision: "content_analysis",
    hearing: "content_analysis",
    embedding: "content_analysis",
    images_gen: "image_tools",
    images_edit: "image_tools",
    search: "integrations",
    api_fiat_exchange: "integrations",
    api_crypto_exchange: "integrations",
    api_twitter: "integrations",
    deprecated: "integrations",
  };
  return categoryMap[toolType];
};

// Get icon for category
const getToolGroupIcon = (
  category: ToolGroupCategory
): React.ComponentType<{ className?: string }> => {
  const iconMap: Record<
    ToolGroupCategory,
    React.ComponentType<{ className?: string }>
  > = {
    text_intelligence: BookOpenText,
    content_analysis: BrainCog,
    image_tools: Image,
    integrations: Blocks,
  };
  return iconMap[category];
};

const AdvancedToolsPanel: React.FC<AdvancedToolsPanelProps> = ({
  tools,
  providers,
  userSettings,
  remoteSettings,
  onToolChoiceChange,
  onProviderNavigate,
  hasCredits = false,
  disabled = false,
  openSection: controlledOpenSection,
  onOpenSectionChange: controlledOnOpenSectionChange,
}) => {
  const [internalOpenSection, setInternalOpenSection] = useState<string>("");
  const [costEstimateTarget, setCostEstimateTarget] = useState<{
    toolName: string;
    estimate: CostEstimate;
    providerId?: string;
    providerName?: string;
  } | null>(null);

  // Use controlled props if provided, otherwise use internal state
  const openSection = controlledOpenSection !== undefined ? controlledOpenSection : internalOpenSection;
  const setOpenSection = controlledOnOpenSectionChange !== undefined ? controlledOnOpenSectionChange : setInternalOpenSection;

  // Helper function to get the current tool choice value for a tool type
  const getCurrentToolChoice = (toolType: ToolType): string | undefined => {
    const fieldName = `tool_choice_${toolType}` as keyof UserSettings;
    return userSettings?.[fieldName] as string | undefined;
  };

  // Helper function to check if a provider is configured
  const isProviderConfigured = (providerId: string): boolean => {
    const providerResponse = providers.find(
      (p) => p.definition.id === providerId
    );
    return providerResponse?.is_configured ?? false;
  };

  // Helper function to check if a tool is configured
  const isToolConfigured = (toolId: string): boolean => {
    const toolResponse = tools.find((t) => t.definition.id === toolId);
    return toolResponse?.is_configured ?? false;
  };

  const isToolTypeChanged = (toolType: ToolType): boolean => {
    if (!remoteSettings) return false;
    const fieldName = `tool_choice_${toolType}` as keyof UserSettings;
    return userSettings?.[fieldName] !== remoteSettings[fieldName];
  };

  const isCategoryChanged = (category: ToolGroupCategory): boolean => {
    const categoryToolTypes = Object.entries({
      chat: "text_intelligence",
      reasoning: "text_intelligence",
      copywriting: "text_intelligence",
      vision: "content_analysis",
      hearing: "content_analysis",
      embedding: "content_analysis",
      images_gen: "image_tools",
      images_edit: "image_tools",
      search: "integrations",
      api_fiat_exchange: "integrations",
      api_crypto_exchange: "integrations",
      api_twitter: "integrations",
    } as Record<ToolType, ToolGroupCategory>)
      .filter(([, cat]) => cat === category)
      .map(([type]) => type as ToolType);
    return categoryToolTypes.some(isToolTypeChanged);
  };

  // Icon mapping for tool types
  const getToolTypeIcon = (
    toolType: ToolType
  ): React.ComponentType<{ className?: string }> | undefined => {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      chat: MessageCircle,
      reasoning: Lightbulb,
      copywriting: Brush,
      vision: Eye,
      hearing: Ear,
      images_gen: WandSparkles,
      images_edit: ImageUp,
      search: Binoculars,
      embedding: DatabaseZap,
      api_fiat_exchange: Euro,
      api_crypto_exchange: Bitcoin,
      api_twitter: Twitter,
    };
    return iconMap[toolType];
  };

  // Group tools by type and then by provider
  const groupToolsByType = (): ToolTypeGroup[] => {
    const typeGroups: Map<ToolType, ToolTypeGroup> = new Map();

    // First, collect all unique tool types from the tools in API order
    const allToolTypes: ToolType[] = [];
    tools.forEach((tool) => {
      tool.definition.types.forEach((type) => {
        if (!allToolTypes.includes(type)) {
          allToolTypes.push(type);
        }
      });
    });

    // Create groups for each tool type
    allToolTypes.forEach((toolType) => {
      // Check if we have translations for this tool type
      const titleKey = `tools.types.${toolType}.title` as TranslationKey;
      const descKey = `tools.types.${toolType}.description` as TranslationKey;

      // Skip if no translation available (as requested)
      try {
        const title = t(titleKey);
        const description = t(descKey);

        // If translation returns the key itself, it means no translation found
        if (title === titleKey || description === descKey) {
          return; // Skip this tool type
        }

        // Group tools by provider for this tool type
        const providerGroups: Map<string, SectionedSelectorSection> = new Map();

        tools.forEach((tool) => {
          if (tool.definition.types.includes(toolType)) {
            const providerId = tool.definition.provider.id;
            const providerName = tool.definition.provider.name;

            if (!providerGroups.has(providerId)) {
              providerGroups.set(providerId, {
                sectionTitle: providerName,
                providerId: providerId,
                isConfigured: isProviderConfigured(providerId),
                options: [],
              });
            }

            const section = providerGroups.get(providerId)!;
            section.options.push({
              value: tool.definition.id,
              label: tool.definition.name,
              isConfigured: isToolConfigured(tool.definition.id),
              providerId: providerId, // for logo lookup
              costEstimate: tool.definition.cost_estimate,
              toolName: tool.definition.name,
            });
          }
        });

        // Convert to array and maintain API order
        const sections = Array.from(providerGroups.values());

        typeGroups.set(toolType, {
          type: toolType,
          title,
          description,
          sections,
          currentValue: getCurrentToolChoice(toolType),
          icon: getToolTypeIcon(toolType),
        });
      } catch {
        // Skip tool types without translations
        console.warn(`Skipping tool type ${toolType} - no translation found`);
        return;
      }
    });

    return Array.from(typeGroups.values());
  };

  // Group tool types by category
  const groupToolsByCategory = (): ToolCategoryGroup[] => {
    const toolTypeGroups = groupToolsByType();
    const categoryGroups: Map<ToolGroupCategory, ToolCategoryGroup> = new Map();

    // Define category order
    const categoryOrder: ToolGroupCategory[] = [
      "text_intelligence",
      "content_analysis",
      "image_tools",
      "integrations",
    ];

    // Group tool types by category
    toolTypeGroups.forEach((toolTypeGroup) => {
      const category = getToolGroupCategory(toolTypeGroup.type);

      if (!categoryGroups.has(category)) {
        const titleKey = `tools.groups.${category}.title` as TranslationKey;
        const title = t(titleKey);

        categoryGroups.set(category, {
          category,
          title,
          icon: getToolGroupIcon(category),
          toolTypes: [],
        });
      }

      const categoryGroup = categoryGroups.get(category)!;
      categoryGroup.toolTypes.push(toolTypeGroup);
    });

    // Return in defined order, filtering out empty categories
    return categoryOrder
      .map((category) => categoryGroups.get(category))
      .filter(
        (group): group is ToolCategoryGroup =>
          group !== undefined && group.toolTypes.length > 0
      );
  };

  const categoryGroups = groupToolsByCategory();

  if (categoryGroups.length === 0) {
    return null; // Don't render if no valid tool types
  }

  return (
    <div className="space-y-6">
      <Accordion
        type="single"
        collapsible
        className="w-full"
        value={openSection}
        onValueChange={setOpenSection}
      >
        {categoryGroups.map((categoryGroup) => {
          const CategoryIcon = categoryGroup.icon;
          const isCurrentlyOpen = openSection === categoryGroup.category;
          const shouldReduceOpacity = openSection && !isCurrentlyOpen;
          const categoryChanged = isCategoryChanged(categoryGroup.category);
          const headerAsteriskColor =
            isCurrentlyOpen || shouldReduceOpacity
              ? "text-white"
              : "text-accent-amber";

          return (
            <AccordionItem
              key={categoryGroup.category}
              value={categoryGroup.category}
              className="border-b border-muted-foreground/20 last:border-b-0"
            >
              <AccordionTrigger
                className={cn(
                  "py-4 px-0",
                  "text-[1.05rem] font-normal text-left",
                  "data-[state=open]:font-medium data-[state=open]:text-accent-amber data-[state=open]:underline underline-offset-4",
                  "hover:no-underline cursor-pointer",
                  "transition-opacity duration-200",
                  shouldReduceOpacity ? "opacity-30" : "opacity-100"
                )}
              >
                <div className="flex items-center gap-4">
                  <CategoryIcon className="h-5 w-5 shrink-0" />
                  <span>
                    {categoryGroup.title}
                    {categoryChanged && (
                      <span className={cn("text-sm leading-none inline-block no-underline ml-0.5", headerAsteriskColor)}>
                        *
                      </span>
                    )}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="h-2" />
                  {categoryGroup.toolTypes.map((toolTypeGroup) => {
                    const ToolIcon = toolTypeGroup.icon;
                    const toolTypeChanged = isToolTypeChanged(toolTypeGroup.type);
                    const totalOptions = toolTypeGroup.sections.reduce(
                      (count, section) => count + section.options.length,
                      0
                    );
                    const isSingleOption = totalOptions === 1;
                    const singleOption = isSingleOption
                      ? toolTypeGroup.sections[0].options[0]
                      : null;

                    return (
                      <div key={toolTypeGroup.type} className="space-y-2">
                        <div className="flex items-center gap-2">
                          {ToolIcon && (
                            <ToolIcon className="h-4 w-4 text-blue-100" />
                          )}
                          <h4 className="text-base font-medium text-blue-100 underline underline-offset-4">
                            {toolTypeGroup.title}
                            {toolTypeChanged && (
                              <span className="text-sm leading-none inline-block no-underline ml-0.5 text-accent-amber">
                                *
                              </span>
                            )}
                          </h4>
                          {isSingleOption &&
                            singleOption?.costEstimate &&
                            singleOption.toolName && (
                              <div
                                className="cursor-pointer text-blue-300 hover:text-blue-400 transition-colors"
                                onClick={() =>
                                  setCostEstimateTarget({
                                    toolName: singleOption.toolName!,
                                    estimate: singleOption.costEstimate!,
                                    providerId: singleOption.providerId,
                                    providerName: providers.find(
                                      (p) => p.definition.id === singleOption.providerId
                                    )?.definition.name,
                                  })
                                }
                              >
                                <CircleHelp className="size-4" />
                              </div>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-tight">
                          {toolTypeGroup.description}
                        </p>

                        {toolTypeGroup.sections.length > 0 ? (
                          <SectionedSelector
                            label={t("tools.select_tool")}
                            value={
                              isSingleOption && singleOption
                                ? singleOption.value
                                : toolTypeGroup.currentValue
                            }
                            onChange={(toolId) =>
                              onToolChoiceChange(toolTypeGroup.type, toolId)
                            }
                            sections={toolTypeGroup.sections}
                            disabled={disabled || isSingleOption}
                            placeholder={t("tools.select_tool")}
                            notConfiguredLabel={t("tools.not_configured")}
                            onProviderNavigate={onProviderNavigate}
                            hasCredits={hasCredits}
                            labelClassName="text-base"
                            hideCostEstimateButton={isSingleOption}
                          />
                        ) : (
                          <div className="text-sm text-muted-foreground text-center py-4">
                            {t("tools.no_tools_available")}
                          </div>
                        )}
                        <div className="h-6" />
                      </div>
                    );
                  })}
                  <div className="h-2" />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
      {costEstimateTarget && (
        <CostEstimateDialog
          toolName={costEstimateTarget.toolName}
          costEstimate={costEstimateTarget.estimate}
          providerId={costEstimateTarget.providerId}
          providerName={costEstimateTarget.providerName}
          open={!!costEstimateTarget}
          onOpenChange={(open) => {
            if (!open) setCostEstimateTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default AdvancedToolsPanel;
