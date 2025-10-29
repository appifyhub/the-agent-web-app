import React from "react";
import { Platform } from "@/lib/platform";
import TelegramIcon from "@/components/TelegramIcon";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { Radio } from "lucide-react";

interface PlatformIconProps {
  platform: Platform;
  className?: string;
  showText?: boolean;
}

const PlatformIcon: React.FC<PlatformIconProps> = ({ 
  platform, 
  className = "h-4 w-4", 
  showText = false 
}) => {
  const getPlatformInfo = (platform: Platform) => {
    switch (platform) {
      case Platform.TELEGRAM:
        return {
          name: Platform.getName(platform),
          icon: <TelegramIcon className={className} />,
        };
      case Platform.WHATSAPP:
        return {
          name: Platform.getName(platform),
          icon: <WhatsAppIcon className={className} />,
        };
      default:
        return {
          name: Platform.getName(platform),
          icon: <Radio className={className} />,
        };
    }
  };

  const platformInfo = getPlatformInfo(platform);

  if (showText) {
    return (
      <span className="flex items-center gap-2">
        {platformInfo.icon}
        <span>{platformInfo.name}</span>
      </span>
    );
  }

  return platformInfo.icon;
};

export default PlatformIcon;
