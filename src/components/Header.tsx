import "@/components/header.css";
import React from "react";
import { Button } from "@/components/ui/button";
import { X as CloseIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@/lib/languages";
import { ChatInfo } from "@/services/user-settings-service";
import LanguageDropdown from "@/components/LanguageDropdown";
import ChatsDropdown from "@/components/ChatsDropdown";
import logoVector from "@/assets/logo-vector.svg";

interface HeaderProps {
  pageTitle: string;
  chats: ChatInfo[];
  selectedChat?: ChatInfo;
  selectedLanguage: Language;
  disabled?: boolean;
  onLangChange?: (lang: string) => void;
  onChatChange?: (chatId: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({
  pageTitle,
  chats,
  selectedChat,
  selectedLanguage,
  disabled = false,
  onLangChange = () => {},
  onChatChange = () => {},
}) => {
  return (
    <div className="header-gradient w-screen relative">
      {/* Small-screen language dropdown */}
      <div className="absolute top-4 right-4 z-10 md:hidden">
        <LanguageDropdown
          selectedLanguage={selectedLanguage}
          onLangChange={onLangChange}
        />
      </div>

      {/* Header content */}
      <div
        className={cn(
          "flex flex-col items-center space-y-6",
          "md:flex-row md:justify-between md:items-center md:space-y-0",
          "px-4 pt-20 pb-16",
          "md:px-10 md:pt-9 md:pb-30",
          "max-w-7xl mx-auto text-white"
        )}
      >
        {/* Page title & Icon */}
        <div
          className={cn(
            "flex flex-col items-center space-y-6",
            "md:flex-row md:items-center md:space-y-0"
          )}
        >
          <img
            src={logoVector}
            alt="App logo"
            className={cn("h-16 w-16", "md:h-12 md:w-12")}
          />
          <h1
            className="px-2 md:px-6 overflow-hidden truncate font-playfair font-bold text-3xl text-accent-strong"
            title={`${pageTitle}`}
          >
            {pageTitle}
          </h1>
        </div>

        {/* Dropdowns & Menus */}
        <div className="flex items-center justify-center space-x-2 w-full md:w-auto">
          {/* Chats dropdown */}
          <ChatsDropdown
            chats={chats}
            selectedChat={selectedChat}
            disabled={disabled}
            onChatChange={onChatChange}
          />

          {/* Close chat button */}
          {selectedChat && (
            <Button
              variant="outline"
              size="icon"
              className={cn(
                disabled ? "glass-dark-static" : "glass",
                "rounded-full",
                disabled ? "cursor-not-allowed" : "cursor-pointer"
              )}
              disabled={disabled}
              onClick={() => onChatChange?.(null)}
            >
              <CloseIcon className="h-6 w-6" />
            </Button>
          )}

          {/* Large-screen Spacer */}
          {selectedChat && <div className="hidden md:block flex-none w-4" />}

          {/* Large-screen Languages dropdown */}
          <div className="hidden md:block">
            <LanguageDropdown
              selectedLanguage={selectedLanguage}
              onLangChange={onLangChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
