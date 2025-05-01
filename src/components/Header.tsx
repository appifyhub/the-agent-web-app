import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, CheckIcon } from "lucide-react";
import { Language } from "@/lib/utils";
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
    <header className="flex items-center justify-between p-4 bg-background border-b sticky top-0 z-10">
      <div className="flex items-center">
        <img
          src={iconUrl}
          alt="Page icon"
          className="h-8 w-8 rounded-full mr-3"
        />
        <h1
          className="text-lg font-semibold truncate"
          title={`${boldSectionContent} · ${regularSectionContent}`}
        >
          <span className="font-bold mr-2">{boldSectionContent}</span>
          <span className="mr-2">·</span>
          {regularSectionContent}
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild className="w-auto px-3 rounded-full">
            <Button variant="outline" size="icon">
              {currentLanguage.flagEmoji}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-4">
            {supportedLanguages.map((lang) => (
              <DropdownMenuItem
                key={lang.isoCode}
                onClick={() => onLangChange?.(lang.isoCode)}
                className={
                  lang.isoCode === currentLanguage.isoCode
                    ? "bg-accent/70 py-4 px-4"
                    : "py-4 px-4"
                }
                disabled={lang.isoCode === currentLanguage.isoCode}
              >
                {lang.flagEmoji}
                <span className="font-semibold">{lang.defaultName}</span>{" "}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({lang.localizedName})
                </span>
                {lang.isoCode === currentLanguage.isoCode && (
                  <CheckIcon className="ml-2 h-4 w-4" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;
