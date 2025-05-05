import "@/components/header.css";
import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@/lib/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  boldSectionContent: string;
  regularSectionContent: string;
  currentLanguage: Language;
  supportedLanguages: Language[];
  iconUrl: string;
  onLangChange?: (lang: string) => void;
}

const Header: React.FC<HeaderProps> = ({
  boldSectionContent,
  regularSectionContent,
  currentLanguage,
  supportedLanguages,
  iconUrl,
  onLangChange = () => {},
}) => {
  return (
    <div className="header-gradient w-screen relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-10 pt-9 pb-10 md:pb-30 text-white">
        <div className="flex items-center overflow-hidden">
          <img src={iconUrl} alt="Page icon" className="h-8 w-8" />
          <h1
            className="flex items-baseline px-2 md:px-4 space-x-2 md:space-x-4 overflow-hidden"
            title={`${boldSectionContent} // ${regularSectionContent}`}
          >
            <span className="font-playfair font-bold text-2xl text-accent-strong whitespace-nowrap flex-shrink-0">
              {boldSectionContent}
            </span>
            <span className="text-muted-foreground font-playfair text-xl whitespace-nowrap flex-shrink-0">
              //
            </span>
            <span className="text-pink-100 font-light text-xl min-w-0 truncate">
              {regularSectionContent}
            </span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="w-auto px-3 rounded-full text-xl cursor-pointer"
            >
              <Button variant="outline" size="icon" className="glass">
                {currentLanguage.flagEmoji}
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="p-4 glass-dark-static rounded-2xl"
            >
              {supportedLanguages.map((lang) => (
                <DropdownMenuItem
                  key={lang.isoCode}
                  onClick={() => onLangChange?.(lang.isoCode)}
                  className={cn(
                    "cursor-pointer py-4 px-4 text-foreground",
                    lang.isoCode === currentLanguage.isoCode
                      ? "bg-accent/70"
                      : ""
                  )}
                  disabled={lang.isoCode === currentLanguage.isoCode}
                >
                  {lang.flagEmoji}
                  <span className="font-semibold">{lang.localizedName}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    ({lang.defaultName})
                  </span>
                  {lang.isoCode === currentLanguage.isoCode && (
                    <CheckIcon className="ml-2 h-4 w-4" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
