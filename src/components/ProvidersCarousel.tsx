import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";

import SettingInput from "@/components/SettingInput";
import { Info } from "lucide-react";
import { t } from "@/lib/translations";
import { ExternalToolProvider } from "@/services/external-tools-service";
import {
  UserSettings,
  getSettingsFieldName,
} from "@/services/user-settings-service";
import { formatToolsForDisplay as format } from "@/services/external-tools-service";
import ProviderIcon from "@/components/ProviderIcon";

interface ProvidersCarouselProps {
  providers: ExternalToolProvider[];
  userSettings: UserSettings | null;
  onSettingChange: (providerId: string, value: string) => void;
  disabled?: boolean;
  setNavigationApi?: (navigateTo: (providerId: string) => void) => void;
  setApi?: (api: CarouselApi) => void;
}

const ProvidersCarousel: React.FC<ProvidersCarouselProps> = ({
  providers,
  userSettings,
  onSettingChange,
  disabled = false,
  setNavigationApi,
  setApi: setParentApi,
}) => {
  const [api, setApi] = React.useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;

    setCanScrollPrev(api.canScrollPrev());
    setCanScrollNext(api.canScrollNext());

    api.on("select", () => {
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    });

    // Expose API to parent
    if (setParentApi) {
      setParentApi(api);
    }
  }, [api, setParentApi]);

  // Provide navigation API to parent component
  React.useEffect(() => {
    if (!api || !setNavigationApi) return;

    const navigateTo = (providerId: string) => {
      console.log("Navigating to provider:", providerId);
      const index = providers.findIndex((p) => p.id === providerId);
      console.log("Provider index:", index, "out of", providers.length);
      if (index !== -1) {
        console.log("Calling scrollTo:", index);
        api.scrollTo(index);
      } else {
        console.warn("Provider not found:", providerId);
      }
    };

    setNavigationApi(navigateTo);
  }, [api, providers, setNavigationApi]);

  if (providers.length === 0) {
    return (
      <div className="text-center text-muted-foreground">
        {t("errors.not_found")}
      </div>
    );
  }

  const botName = import.meta.env.VITE_APP_NAME_SHORT;

  return (
    <Carousel setApi={setApi} className="w-full max-w-sm sm:max-w-md mx-auto">
      <CarouselContent>
        {providers.map((provider) => (
          <CarouselItem key={provider.id} className="px-2 sm:px-0">
            <div className="space-y-6">
              {/* Header with logo and navigation */}
              <div className="flex items-center justify-center space-x-6">
                {canScrollPrev && !disabled && (
                  <button
                    onClick={() => api?.scrollPrev()}
                    className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}

                {!canScrollPrev && <div className="h-8 w-8" />}

                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="flex items-center justify-center w-10 h-10">
                    <ProviderIcon
                      providerId={provider.id}
                      className="w-full h-full"
                      alt={`${provider.name} logo`}
                    />
                    {!provider.id && (
                      <span className="text-white text-lg font-bold text-center">
                        {provider.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <span className="text-white/90 text-base font-bold text-center">
                    {provider.name}
                  </span>
                </div>

                {canScrollNext && !disabled && (
                  <button
                    onClick={() => api?.scrollNext()}
                    className="h-8 w-8 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}

                {!canScrollNext && <div className="h-8 w-8" />}
              </div>

              {/* Setting input */}
              <SettingInput
                id={`token-${provider.id}`}
                label={t("provider_needed_for", {
                  botName,
                  tools: format(provider.tools),
                })}
                value={
                  (userSettings?.[
                    getSettingsFieldName(
                      provider.id
                    ) as keyof typeof userSettings
                  ] as string) || ""
                }
                onChange={(value) => onSettingChange(provider.id, value)}
                disabled={disabled}
                placeholder={provider.token_format}
                type="text"
                autoComplete="off"
                spellCheck={false}
                inputClassName="font-mono"
                labelClassName="h-12 flex items-center leading-tight"
              />

              {/* Info link */}
              <div className="flex items-center space-x-2 ps-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-accent-amber/70" />
                <a
                  href={provider.token_management_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-3 decoration-accent-amber/70 text-accent-amber/70"
                >
                  {t("where_is_my_key", {
                    providerName: provider.name,
                  })}
                </a>
              </div>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default ProvidersCarousel;
