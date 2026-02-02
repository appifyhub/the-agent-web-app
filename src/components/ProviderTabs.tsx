import React from "react";
import { ExternalToolProvider } from "@/services/external-tools-service";
import ProviderIcon from "@/components/ProviderIcon";
import { cn } from "@/lib/utils";

interface ProviderTabsProps {
  providers: ExternalToolProvider[];
  selectedIndex: number;
  onProviderClick: (index: number) => void;
  disabled?: boolean;
}

const ProviderTabs: React.FC<ProviderTabsProps> = ({
  providers,
  selectedIndex,
  onProviderClick,
  disabled = false,
}) => {
  if (providers.length === 0) return null;

  // Don't show tabs if there's only one provider
  if (providers.length === 1) return null;

  return (
    <div className="flex items-center justify-center gap-1 flex-wrap px-2">
      {providers.map((provider, index) => (
        <button
          key={provider.id}
          onClick={() => !disabled && onProviderClick(index)}
          disabled={disabled}
          className={cn(
            "flex items-center justify-center p-1.5 rounded-full border transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-accent-amber/50 focus:ring-offset-2 focus:ring-offset-background",
            disabled
              ? "cursor-not-allowed opacity-30 border-white/10"
              : "cursor-pointer",
            selectedIndex === index
              ? "opacity-100 border-white/70"
              : "opacity-40 hover:opacity-70 border-white/20"
          )}
          title={provider.name}
        >
          <div className="w-4 h-4">
            <ProviderIcon
              providerId={provider.id}
              className="w-full h-full"
              alt={`${provider.name} logo`}
            />
          </div>
        </button>
      ))}
    </div>
  );
};

export default ProviderTabs;
