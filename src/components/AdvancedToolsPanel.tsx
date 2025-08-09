import React, { useState } from "react";
import {
  MessageCircle,
  Lightbulb,
  Brush,
  Eye,
  Ear,
  WandSparkles,
  ImageUp,
  ImageOff,
  PaintRoller,
  Images,
  Binoculars,
  DatabaseZap,
  Euro,
  Bitcoin,
  Twitter,
} from "lucide-react";
import { t } from "@/lib/translations";
import { TranslationKey } from "@/lib/translation-keys";
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
} from "@/services/external-tools-service";
import { UserSettings } from "@/services/user-settings-service";

interface AdvancedToolsPanelProps {
  tools: ExternalToolResponse[];
  providers: ExternalToolProviderResponse[];
  userSettings: UserSettings | null;
  onToolChoiceChange: (toolType: ToolType, toolId: string) => void;
  onProviderNavigate?: (providerId: string) => void;
  disabled?: boolean;
}

interface ToolTypeGroup {
  type: ToolType;
  title: string;
  description: string;
  sections: SectionedSelectorSection[];
  currentValue: string | undefined;
  icon?: React.ComponentType<{ className?: string }>;
}

const AdvancedToolsPanel: React.FC<AdvancedToolsPanelProps> = ({
  tools,
  providers,
  userSettings,
  onToolChoiceChange,
  onProviderNavigate,
  disabled = false,
}) => {
  const [openSection, setOpenSection] = useState<string>("");

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
      images_restoration: ImageOff,
      images_inpainting: PaintRoller,
      images_background_removal: Images,
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

  const toolTypeGroups = groupToolsByType();

  if (toolTypeGroups.length === 0) {
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
        {toolTypeGroups.map((group) => {
          const IconComponent = group.icon;
          const isCurrentlyOpen = openSection === group.type;
          const shouldReduceOpacity = openSection && !isCurrentlyOpen;

          return (
            <AccordionItem
              key={group.type}
              value={group.type}
              className="border-b border-muted-foreground/20 last:border-b-0"
            >
              <AccordionTrigger
                className={`hover:no-underline py-4 px-0 text-[1.05rem] font-normal data-[state=open]:font-medium data-[state=open]:text-accent-amber text-left transition-opacity duration-200 cursor-pointer ${
                  shouldReduceOpacity ? "opacity-30" : "opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {IconComponent && (
                    <IconComponent className="h-5 w-5 shrink-0" />
                  )}
                  <span>{group.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="!pb-6 pt-0">
                <div className="space-y-4">
                  <p className="text-base text-muted-foreground leading-tight">
                    {group.description}
                  </p>

                  {group.sections.length > 0 ? (
                    (() => {
                      // Count total available options across all sections
                      const totalOptions = group.sections.reduce(
                        (count, section) => count + section.options.length,
                        0
                      );
                      const isSingleOption = totalOptions === 1;
                      const singleOption = isSingleOption
                        ? group.sections[0].options[0]
                        : null;

                      return (
                        <SectionedSelector
                          label={t("tools.select_tool")}
                          value={
                            isSingleOption && singleOption
                              ? singleOption.value
                              : group.currentValue
                          }
                          onChange={(toolId) =>
                            onToolChoiceChange(group.type, toolId)
                          }
                          sections={group.sections}
                          disabled={disabled || isSingleOption}
                          placeholder={t("tools.select_tool")}
                          notConfiguredLabel={t("tools.not_configured")}
                          onProviderNavigate={onProviderNavigate}
                          labelClassName="text-base"
                        />
                      );
                    })()
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      {t("tools.no_tools_available")}
                    </div>
                  )}
                </div>
                <div className="h-6" />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default AdvancedToolsPanel;
