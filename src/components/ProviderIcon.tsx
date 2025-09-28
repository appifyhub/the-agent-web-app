import React from "react";
import AnthropicLogo from "@/assets/svg/anthropic-white.svg";
import OpenAILogo from "@/assets/svg/openai-white.svg";
import GoogleAILogo from "@/assets/svg/googleai-white.svg";
import PerplexityLogo from "@/assets/svg/perplexity-white.svg";
import RapidAPILogo from "@/assets/svg/rapidapi-white.svg";
import CoinMarketCapLogo from "@/assets/svg/coinmarketcap-white.svg";
import ReplicateLogo from "@/assets/svg/replicate-white.svg";
import PlatformIcon from "@/components/PlatformIcon";
import { Platform } from "@/lib/platform";

interface ProviderIconProps {
  providerId: string;
  className?: string;
  alt?: string;
}

const ProviderIcon: React.FC<ProviderIconProps> = ({ 
  providerId, 
  className = "w-4 h-4",
  alt = "Provider logo"
}) => {
  const getAIProviderLogo = (id: string): string | null => {
    const logoMap: { [key: string]: string } = {
      anthropic: AnthropicLogo,
      "open-ai": OpenAILogo,
      "google-ai": GoogleAILogo,
      perplexity: PerplexityLogo,
      "rapid-api": RapidAPILogo,
      "coinmarketcap-api": CoinMarketCapLogo,
      replicate: ReplicateLogo,
    };
    return logoMap[id] || null;
  };

  // First try AI provider logos
  const logoPath = getAIProviderLogo(providerId);
  if (logoPath) {
    return (
      <img
        src={logoPath}
        alt={alt}
        className={className}
      />
    );
  }

  // If not found, use platform icon
  const platform = Platform.fromString(providerId);
  return <PlatformIcon platform={platform} className={className} />;
};

export default ProviderIcon;
