import "@/components/header.css";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserRound, Gift, LifeBuoy, Menu as MenuIcon } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import ChatsCollapsible from "@/components/ChatsCollapsible";
import { cn } from "@/lib/utils";
import { Language } from "@/lib/languages";
import { ChatInfo } from "@/services/user-settings-service";
import LanguageDropdown from "@/components/LanguageDropdown";
import ChatsDropdown from "@/components/ChatsDropdown";
import logoVector from "@/assets/logo-vector.svg";
import { t } from "@/lib/translations";
import { useParams, useLocation } from "react-router-dom";
import { useNavigation } from "@/hooks/useNavigation";
import { useChats } from "@/hooks/useChats";

type Page = "sponsorships" | "profile" | "chat" | "features";

interface HeaderProps {
  page: Page;
  selectedChat?: ChatInfo;
  selectedLanguage: Language;
  hasBlockerError?: boolean;
  showProfileButton?: boolean;
  showSponsorshipsButton?: boolean;
  showChatsDropdown?: boolean;
  showHelpButton?: boolean;
  userId?: string;
  rawToken?: string;
}

const Header: React.FC<HeaderProps> = ({
  page,
  selectedChat = undefined,
  selectedLanguage,
  hasBlockerError = false,
  showProfileButton = true,
  showSponsorshipsButton = true,
  showChatsDropdown = true,
  showHelpButton = true,
  userId,
  rawToken,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const { lang_iso_code, user_id, chat_id } = useParams<{
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

  // Fetch chats internally using the hook
  const { chats } = useChats(userId || user_id, rawToken);

  // Resolve selected chat from URL or prop
  const resolvedSelectedChat =
    selectedChat || chats.find((chat) => chat.chat_id === chat_id);

  // Determine if we should show the drawer at all
  const hasAnyNavItems =
    showProfileButton ||
    showSponsorshipsButton ||
    showHelpButton ||
    (showChatsDropdown && chats.length > 0);

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
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate without lang_iso_code");
    }
  };

  const handleProfileClick = () => {
    if (page === "profile") return;

    const targetUserId = user_id || userId;
    if (lang_iso_code && targetUserId) {
      navigateToProfile(targetUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to profile without user_id");
    }
  };

  const handleSponsorshipsClick = () => {
    if (page === "sponsorships") return;

    const targetUserId = user_id || userId;
    if (lang_iso_code && targetUserId) {
      navigateToSponsorships(targetUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to sponsorships without user_id");
    }
  };

  const handleHelpClick = () => {
    if (page === "features") return;

    if (lang_iso_code) {
      navigateToFeatures(lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to features without lang_iso_code");
    }
  };

  return (
    <div className="header-gradient w-screen relative">
      {/* Mobile & Mid-size menu button - absolute positioned (<lg) */}
      <div className={cn(
        "absolute right-6 z-10 lg:hidden flex items-center",
        "top-6 md:top-12",
        "gap-5 md:gap-2"
      )}>
        <LanguageDropdown
          selectedLanguage={selectedLanguage}
          onLangChange={handleLangChange}
          className="scale-120 md:scale-100"
        />
        {hasAnyNavItems && (
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn("glass rounded-full", "scale-120 md:scale-100")}
              >
                <MenuIcon className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full! sm:max-w-sm glass-dark-static border-l border-white/20 px-2 [&>button]:hidden"
            >
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              <SheetDescription className="sr-only">
                Access your chats, profile, sponsorships, help, and other
              </SheetDescription>
              <div className="flex flex-col gap-1 h-full">
                <div className="h-8" />
                {/* Custom close button */}
                <div className="px-3">
                  <SheetClose asChild>
                    <button className="text-accent-amber/70 hover:text-white text-sm font-light transition-colors underline underline-offset-3 decoration-accent-amber/70">
                      {t("close")}
                    </button>
                  </SheetClose>
                </div>

                <div className="h-4" />

                {/* Chats collapsible in drawer */}
                {showChatsDropdown && chats.length > 0 && (
                  <ChatsCollapsible
                    chats={chats}
                    selectedChat={resolvedSelectedChat}
                    onChatChange={handleChatChange}
                    defaultOpen={page === "chat"}
                  />
                )}

                {/* Navigation items */}
                <div className="flex flex-col gap-1 border-white/10">
                  {showProfileButton && (
                    <Button
                      variant="ghost"
                      disabled={page === "profile"}
                      className={cn(
                        "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                        page === "profile"
                          ? "bg-accent/70 cursor-default opacity-100"
                          : "text-white hover:bg-white/10"
                      )}
                      onClick={handleProfileClick}
                    >
                      <UserRound className="h-5 w-5 shrink-0" />
                      {t("profile")}
                    </Button>
                  )}
                  {showSponsorshipsButton && (
                    <Button
                      variant="ghost"
                      disabled={page === "sponsorships"}
                      className={cn(
                        "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                        page === "sponsorships"
                          ? "bg-accent/70 cursor-default opacity-100"
                          : "text-white hover:bg-white/10"
                      )}
                      onClick={handleSponsorshipsClick}
                    >
                      <Gift className="h-5 w-5 shrink-0" />
                      {t("sponsorships")}
                    </Button>
                  )}
                  {showHelpButton && (
                    <Button
                      variant="ghost"
                      disabled={page === "features"}
                      className={cn(
                        "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                        page === "features"
                          ? "bg-accent/70 cursor-default opacity-100"
                          : "text-white hover:bg-white/10"
                      )}
                      onClick={handleHelpClick}
                    >
                      <LifeBuoy className="h-5 w-5 shrink-0" />
                      {t("help")}
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {/* Header content */}
      <div
        className={cn(
          "flex flex-col items-center space-y-2",
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

        {/* Desktop navigation - full menu (lg+) */}
        <div className="hidden lg:flex items-center justify-center gap-2">
          {/* Chats dropdown */}
          {showChatsDropdown && (
            <ChatsDropdown
              chats={chats}
              selectedChat={resolvedSelectedChat}
              disabled={hasBlockerError && chats.length === 0}
              onChatChange={handleChatChange}
            />
          )}

          {/* Navigation menu */}
          <NavigationMenu>
            <NavigationMenuList className="flex items-center gap-2">
              {showProfileButton && (
                <NavigationMenuItem>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === "profile"}
                    className={cn(
                      "gap-2 text-base w-auto px-4 rounded-full",
                      page === "profile"
                        ? "glass-active text-accent-amber"
                        : "glass"
                    )}
                    onClick={handleProfileClick}
                  >
                    <UserRound className="h-5 w-5" />
                    {t("profile")}
                  </Button>
                </NavigationMenuItem>
              )}
              {showSponsorshipsButton && (
                <NavigationMenuItem>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === "sponsorships"}
                    className={cn(
                      "gap-2 text-base w-auto px-4 rounded-full",
                      page === "sponsorships"
                        ? "glass-active text-accent-amber"
                        : "glass"
                    )}
                    onClick={handleSponsorshipsClick}
                  >
                    <Gift className="h-5 w-5" />
                    {t("sponsorships")}
                  </Button>
                </NavigationMenuItem>
              )}
              {showHelpButton && (
                <NavigationMenuItem>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === "features"}
                    className={cn(
                      "gap-2 text-base w-auto px-4 rounded-full",
                      page === "features"
                        ? "glass-active text-accent-amber"
                        : "glass"
                    )}
                    onClick={handleHelpClick}
                  >
                    <LifeBuoy className="h-5 w-5" />
                    {t("help")}
                  </Button>
                </NavigationMenuItem>
              )}
              <NavigationMenuItem>
                <LanguageDropdown
                  selectedLanguage={selectedLanguage}
                  onLangChange={handleLangChange}
                />
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
