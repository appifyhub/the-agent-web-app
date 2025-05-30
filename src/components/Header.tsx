import "@/components/header.css";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  CheckIcon,
  UsersRound,
  MessageCircle,
  Lock,
  X as CloseIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Language } from "@/lib/languages";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatInfo } from "@/services/user-settings-service";

interface HeaderProps {
  iconUrl: string;
  pageTitle: string;
  chats: ChatInfo[];
  selectedChat?: ChatInfo;
  languages: Language[];
  selectedLanguage: Language;
  loadingPlaceholder: string;
  onLangChange?: (lang: string) => void;
  onChatChange?: (chatId: string | null) => void;
}

const Header: React.FC<HeaderProps> = ({
  iconUrl,
  pageTitle,
  chats,
  selectedChat,
  languages,
  selectedLanguage,
  loadingPlaceholder,
  onLangChange = () => {},
  onChatChange = () => {},
}) => {
  const resolveChatLabel = () => {
    if (chats.length === 0) {
      return loadingPlaceholder;
    }
    const isValidChatSelected =
      selectedChat &&
      chats.some((chat) => chat.chat_id === selectedChat.chat_id);
    if (isValidChatSelected) {
      return selectedChat.title;
    }

    return (
      <span className="flex items-center text-foreground">
        <MessageCircle className="h-6 w-6" />
      </span>
    );
  };

  return (
    <div className="header-gradient w-screen relative">
      <div
        className={cn(
          "flex flex-col items-center space-y-6",
          "md:flex-row md:justify-between md:items-center md:space-y-0",
          "px-4 pt-9 pb-16",
          "md:px-10 md:pb-30",
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
            src={iconUrl}
            alt="Page icon"
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
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="flex-initial md:flex-none md:max-w-md min-w-0 px-4 rounded-full cursor-pointer"
            >
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  chats.length === 0 ? "glass-dark-static" : "glass",
                  "w-auto min-w-0 whitespace-nowrap overflow-hidden md:w-auto md:max-w-md font-light text-base"
                )}
                disabled={chats.length === 0}
              >
                <span className="flex-1 min-w-0 text-left truncate">
                  {resolveChatLabel()}
                </span>
                <ChevronDownIcon className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="p-2 glass-dark-static rounded-2xl max-w-xs md:max-w-md"
            >
              {chats.map((chat) => (
                <DropdownMenuItem
                  key={chat.chat_id}
                  onClick={() => onChatChange?.(chat.chat_id)}
                  className={cn(
                    "cursor-pointer py-4 px-6 text-foreground flex items-center min-w-0 overflow-hidden",
                    chat.chat_id === selectedChat?.chat_id ? "bg-accent/70" : ""
                  )}
                  disabled={chat.chat_id === selectedChat?.chat_id}
                >
                  {chat.is_own ? (
                    <Lock className="h-4 w-4 flex-shrink-0 text-foreground" />
                  ) : (
                    <UsersRound className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  <div className="mx-2 h-4 w-px bg-muted-foreground opacity-50" />
                  <span className="flex-1 truncate">{chat.title}</span>
                  {chat.chat_id === selectedChat?.chat_id && (
                    <CheckIcon className="ml-auto h-4 w-4 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {/* Close button */}
          {selectedChat && (
            <Button
              variant="outline"
              size="icon"
              className="glass rounded-full cursor-pointer"
              onClick={() => onChatChange?.(null)}
            >
              <CloseIcon className="h-6 w-6" />
            </Button>
          )}

          {/* Spacer */}
          {selectedChat && <div className="flex-none w-0 md:w-4" />}

          {/* Languages dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="w-auto px-4 rounded-full text-xl cursor-pointer"
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
              {languages.map((lang) => (
                <DropdownMenuItem
                  key={lang.isoCode}
                  onClick={() => onLangChange?.(lang.isoCode)}
                  className={cn(
                    "cursor-pointer py-4 px-6 text-foreground",
                    lang.isoCode === selectedLanguage.isoCode
                      ? "bg-accent/70"
                      : ""
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
        </div>
      </div>
    </div>
  );
};

export default Header;
