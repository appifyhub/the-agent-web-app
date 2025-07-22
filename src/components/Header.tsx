import "@/components/header.css";
import React from "react";
import { Button } from "@/components/ui/button";
import { UserRound, Gift, LifeBuoy } from "lucide-react";
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
import { useParams, useLocation } from "react-router-dom";
import { useNavigation } from "@/hooks/useNavigation";

type Page = "sponsorships" | "profile" | "chat" | "features";

interface HeaderProps {
  page: Page;
  chats: ChatInfo[];
  selectedChat?: ChatInfo;
  selectedLanguage: Language;
  hasBlockerError?: boolean;
  showProfileButton?: boolean;
  showSponsorshipsButton?: boolean;
  showChatsDropdown?: boolean;
  showHelpButton?: boolean;
  userId?: string;
}

const Header: React.FC<HeaderProps> = ({
  page,
  chats,
  selectedChat = undefined,
  selectedLanguage,
  hasBlockerError = false,
  showProfileButton = true,
  showSponsorshipsButton = true,
  showChatsDropdown = true,
  showHelpButton = true,
  userId,
}) => {
  const { lang_iso_code, user_id } = useParams<{
    lang_iso_code: string;
    user_id?: string;
    chat_id?: string;
  }>();

  const location = useLocation();
  const {
    navigateToChat,
    navigateToProfile,
    navigateToSponsorships,
    navigateToFeatures,
    navigateWithLanguageChange,
  } = useNavigation();

  const getPageTitle = (page: Page): string => {
    switch (page) {
      case "sponsorships":
        return t("sponsorships");
      case "profile":
        return t("profile");
      case "chat":
        return t("chat");
      case "features":
        return t("features.header");
      default:
        return "";
    }
  };

  const handleLangChange = (isoCode: string) => {
    if (lang_iso_code) {
      navigateWithLanguageChange(isoCode, location.pathname);
    } else {
      console.warn("Cannot navigate without lang_iso_code");
    }
  };

  const handleChatChange = (chatId: string) => {
    if (lang_iso_code) {
      console.info("Chat changed to:", chatId);
      navigateToChat(chatId, lang_iso_code);
    } else {
      console.warn("Cannot navigate without lang_iso_code");
    }
  };

  const handleProfileClick = () => {
    if (page === "profile") return;

    const targetUserId = user_id || userId;
    if (lang_iso_code && targetUserId) {
      navigateToProfile(targetUserId, lang_iso_code);
    } else {
      console.warn("Cannot navigate to profile without user_id");
    }
  };

  const handleSponsorshipsClick = () => {
    if (page === "sponsorships") return;

    const targetUserId = user_id || userId;
    if (lang_iso_code && targetUserId) {
      navigateToSponsorships(targetUserId, lang_iso_code);
    } else {
      console.warn("Cannot navigate to sponsorships without user_id");
    }
  };

  const handleHelpClick = () => {
    if (page === "features") return;

    if (lang_iso_code) {
      navigateToFeatures(lang_iso_code);
    } else {
      console.warn("Cannot navigate to features without lang_iso_code");
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
                  page === "sponsorships"
                    ? "glass-active text-amber-200"
                    : "glass",
                  "rounded-full scale-120",
                  "cursor-pointer"
                )}
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
                  page === "profile" ? "glass-active text-amber-200" : "glass",
                  "rounded-full scale-120",
                  "cursor-pointer"
                )}
                onClick={handleProfileClick}
              >
                <UserRound className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("profile")}</TooltipContent>
          </Tooltip>
        )}

        {/* Help button */}
        {showHelpButton && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  page === "features" ? "glass-active text-amber-200" : "glass",
                  "rounded-full scale-120",
                  "cursor-pointer"
                )}
                onClick={handleHelpClick}
              >
                <LifeBuoy className="h-6 w-6" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("help")}</TooltipContent>
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
          <a href={import.meta.env.VITE_LANDING_PAGE_URL}>
            <img
              src={logoVector}
              alt="App logo"
              className={cn("h-20 w-20", "md:h-12 md:w-12")}
            />
          </a>
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
          {showChatsDropdown && (
            <ChatsDropdown
              chats={chats}
              selectedChat={selectedChat}
              disabled={hasBlockerError && chats.length === 0}
              onChatChange={handleChatChange}
            />
          )}

          {/* Large-screen Sponsorships button */}
          {showSponsorshipsButton && (
            <div className="hidden md:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      page === "sponsorships"
                        ? "glass-active text-amber-200"
                        : "glass",
                      "rounded-full",
                      "cursor-pointer"
                    )}
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
                      page === "profile"
                        ? "glass-active text-amber-200"
                        : "glass",
                      "rounded-full",
                      "cursor-pointer"
                    )}
                    onClick={handleProfileClick}
                  >
                    <UserRound className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("profile")}</TooltipContent>
              </Tooltip>
            </div>
          )}

          {/* Large-screen Help button */}
          {showHelpButton && (
            <div className="hidden md:block">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      page === "features"
                        ? "glass-active text-amber-200"
                        : "glass",
                      "rounded-full",
                      "cursor-pointer"
                    )}
                    onClick={handleHelpClick}
                  >
                    <LifeBuoy className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("help")}</TooltipContent>
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
