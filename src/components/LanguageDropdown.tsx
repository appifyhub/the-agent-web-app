import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language, INTERFACE_LANGUAGES } from "@/lib/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface LanguageDropdownProps {
  selectedLanguage: Language;
  onLangChange?: (lang: string) => void;
  className?: string;
}

const LanguageDropdown: React.FC<LanguageDropdownProps> = ({
  selectedLanguage,
  onLangChange = () => {},
  className,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "w-auto px-4 rounded-full text-xl cursor-pointer",
          className
        )}
      >
        <Button variant="outline" size="icon" className="glass">
          {selectedLanguage.flagEmoji}
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="p-6 glass-dark-static rounded-2xl"
      >
        {INTERFACE_LANGUAGES.map((lang: Language) => (
          <DropdownMenuItem
            key={lang.isoCode}
            onClick={() => onLangChange?.(lang.isoCode)}
            className={cn(
              "cursor-pointer py-4 px-6 text-foreground",
              lang.isoCode === selectedLanguage.isoCode ? "bg-accent/70" : ""
            )}
            disabled={lang.isoCode === selectedLanguage.isoCode}
          >
            {lang.flagEmoji}
            <span className="font-semibold">{lang.localizedName}</span>
            <span className="ml-2 text-xs text-muted-foreground">
              ({lang.defaultName})
            </span>
            {lang.isoCode === selectedLanguage.isoCode && (
              <CheckIcon className="ml-2 h-4 w-4" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageDropdown;
