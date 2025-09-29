import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Platform } from "@/lib/platform";
import PlatformIcon from "@/components/PlatformIcon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PlatformDropdownProps {
  selectedPlatform: Platform;
  onPlatformChange?: (platform: Platform) => void;
  className?: string;
}

interface PlatformInfo {
  platform: Platform;
  icon: React.ComponentType<{ className?: string }>;
}

const AVAILABLE_PLATFORMS: PlatformInfo[] = [
  {
    platform: Platform.TELEGRAM,
    icon: ({ className }: { className?: string }) => <PlatformIcon platform={Platform.TELEGRAM} className={className} />,
  },
];

const PlatformDropdown: React.FC<PlatformDropdownProps> = ({
  selectedPlatform,
  onPlatformChange = () => {},
  className,
}) => {
  const selectedPlatformInfo = AVAILABLE_PLATFORMS.find(
    (p) => p.platform === selectedPlatform
  );


  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn("cursor-pointer", className)}
      >
        <Button variant="outline" className="glass py-3 px-3 h-auto rounded-xl">
          {selectedPlatformInfo && (
            <selectedPlatformInfo.icon className="h-4 w-4" />
          )}
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="p-2 glass-dark-static rounded-xl"
      >
        {AVAILABLE_PLATFORMS.map((platformInfo) => (
          <DropdownMenuItem
            key={platformInfo.platform}
            onClick={() => onPlatformChange?.(platformInfo.platform)}
            className={cn(
              "cursor-pointer py-3 px-4 text-foreground",
              platformInfo.platform === selectedPlatform ? "bg-accent/70" : ""
            )}
            disabled={platformInfo.platform === selectedPlatform}
          >
            <platformInfo.icon className="h-4 w-4 mr-2" />
            <span className="font-medium">{Platform.getName(platformInfo.platform)}</span>
            {platformInfo.platform === selectedPlatform && (
              <CheckIcon className="ml-auto h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default PlatformDropdown;
