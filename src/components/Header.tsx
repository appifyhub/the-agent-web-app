import "@/components/header.css";
import React from "react";
import { Button } from "@/components/ui/button";
import { UserRound, Gift } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Language } from "@/lib/languages";
import { ChatInfo } from "@/services/user-settings-service";
import LanguageDropdown from "@/components/LanguageDropdown";
import ChatsDropdown from "@/components/ChatsDropdown";
import logoVector from "@/assets/logo-vector.svg";
import { t } from "@/lib/translations";
import { useParams } from "react-router-dom";

type Page = "sponsorships" | "profile" | "chat";

interface HeaderProps {
  page: Page;
  chats: ChatInfo[];
  selectedChat?: ChatInfo;
  selectedLanguage: Language;
  disabled?: boolean;
  showProfileButton?: boolean;
  showSponsorshipsButton?: boolean;
  userId?: string;
}

const Header: React.FC<HeaderProps> = ({
  page,
  chats,
  selectedChat = undefined,
  selectedLanguage,
  disabled = false,
  showProfileButton = true,
  showSponsorshipsButton = true,
  userId,
}) => {
  const { lang_iso_code, user_id, chat_id } = useParams<{
    lang_iso_code: string;
    user_id?: string;
    chat_id?: string;
  }>();

  const getPageTitle = (page: Page): string => {
    switch (page) {
      case "sponsorships":
        return t("sponsorships");
      case "profile":
        return t("profile");
      case "chat":
        return t("chat");
      default:
        return "";
    }
  };

  const handleLangChange = (isoCode: string) => {
    console.info("Interface language changed to:", isoCode);
    if (chat_id) {
      window.location.href = `/${isoCode}/chat/${chat_id}/settings${window.location.search}`;
    } else if (user_id && page === "sponsorships") {
      window.location.href = `/${isoCode}/user/${user_id}/sponsorships${window.location.search}`;
    } else if (user_id) {
      window.location.href = `/${isoCode}/user/${user_id}/settings${window.location.search}`;
    } else {
      console.warn("Cannot navigate without chat_id or user_id");
    }
  };

  const buildUrl = (
    targetPage: Page,
    targetUserId?: string,
    targetChatId?: string
  ): string => {
    const baseUrl = `/${lang_iso_code}`;
    const resolvedUserId = targetUserId || user_id || userId;
    const chatId = targetChatId || chat_id;
    const search = window.location.search;

    switch (targetPage) {
      case "sponsorships":
        return `${baseUrl}/user/${resolvedUserId}/sponsorships${search}`;
      case "profile":
        return `${baseUrl}/user/${resolvedUserId}/settings${search}`;
      case "chat":
        return `${baseUrl}/chat/${chatId}/settings${search}`;
      default:
        return baseUrl;
    }
  };

  const handleChatChange = (chatId: string) => {
    if (lang_iso_code) {
      console.info("Chat changed to:", chatId);
      window.location.href = buildUrl("chat", undefined, chatId);
    } else {
      console.warn("Cannot navigate without lang_iso_code");
    }
  };

  const handleProfileClick = () => {
    if (page === "profile") return;

    const targetUserId = user_id || userId;
    if (lang_iso_code && targetUserId) {
      window.location.href = buildUrl("profile", targetUserId);
    } else {
      console.warn("Cannot navigate to profile without user_id");
    }
  };

  const handleSponsorshipsClick = () => {
    if (page === "sponsorships") return;

    const targetUserId = user_id || userId;
    if (lang_iso_code && targetUserId) {
      window.location.href = buildUrl("sponsorships", targetUserId);
    } else {
      console.warn("Cannot navigate to sponsorships without user_id");
    }
  };

  return (
    <div className="header-gradient w-screen relative">
      {/* Small-screen buttons */}
      <div className="absolute top-4 right-6 z-10 md:hidden flex items-center space-x-5">
        {/* Sponsorships button */}
        {showSponsorshipsButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  disabled
                    ? "glass-dark-static"
                    : page === "sponsorships"
                    ? "glass-active text-amber-100"
                    : "glass",
                  "rounded-full scale-120",
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                )}
                disabled={disabled}
                onClick={handleSponsorshipsClick}
              >
                <Gift className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("sponsorships")}</TooltipContent>
          </Tooltip>
        )}

        {/* Profile button */}
        {showProfileButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  disabled
                    ? "glass-dark-static"
                    : page === "profile"
                    ? "glass-active text-amber-100"
                    : "glass",
                  "rounded-full scale-120",
                  disabled ? "cursor-not-allowed" : "cursor-pointer"
                )}
                disabled={disabled}
                onClick={handleProfileClick}
              >
                <UserRound className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("profile")}</TooltipContent>
          </Tooltip>
        )}

        {/* Language dropdown */}
        <LanguageDropdown
          className="scale-120 translate-x-1"
          selectedLanguage={selectedLanguage}
          onLangChange={handleLangChange}
        />
      </div>

      {/* Header content */}
      <div
        className={cn(
          "flex flex-col items-center space-y-6",
          "md:flex-row md:justify-between md:items-center md:space-y-0",
          "px-4 pt-30 pb-12",
          "md:px-10 md:pt-10 md:pb-24",
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
            className={cn("h-20 w-20", "md:h-12 md:w-12")}
          />
          <h1
            className="px-2 md:px-6 overflow-hidden truncate font-playfair font-bold text-3xl text-accent-amber"
            title={getPageTitle(page)}
          >
            {getPageTitle(page)}
          </h1>
        </div>

        {/* Dropdowns & Menus */}
        <div className="flex items-center justify-center space-x-2 w-full md:w-auto">
          {/* Chats dropdown */}
          <ChatsDropdown
            chats={chats}
            selectedChat={selectedChat}
            disabled={disabled}
            onChatChange={handleChatChange}
          />

          {/* Large-screen Sponsorships button */}
          {showSponsorshipsButton && (
            <div className="hidden md:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      disabled
                        ? "glass-dark-static"
                        : page === "sponsorships"
                        ? "glass-active text-amber-100"
                        : "glass",
                      "rounded-full",
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    )}
                    disabled={disabled}
                    onClick={handleSponsorshipsClick}
                  >
                    <Gift className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("sponsorships")}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Large-screen Profile button */}
          {showProfileButton && (
            <div className="hidden md:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      disabled
                        ? "glass-dark-static"
                        : page === "profile"
                        ? "glass-active text-amber-100"
                        : "glass",
                      "rounded-full",
                      disabled ? "cursor-not-allowed" : "cursor-pointer"
                    )}
                    disabled={disabled}
                    onClick={handleProfileClick}
                  >
                    <UserRound className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("profile")}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Large-screen Languages dropdown */}
          <div className="hidden md:block">
            <LanguageDropdown
              selectedLanguage={selectedLanguage}
              onLangChange={handleLangChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
