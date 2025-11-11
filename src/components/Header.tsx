import "@/components/header.css";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  UserRound,
  Gift,
  LifeBuoy,
  Menu as MenuIcon,
  MoreHorizontal,
  Key,
  Brain,
  X,
  Merge,
} from "lucide-react";
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

type Page =
  | "sponsorships"
  | "profile"
  | "chat"
  | "features"
  | "access"
  | "intelligence"
  | "connections";

interface HeaderProps {
  page: Page;
  selectedChat?: ChatInfo;
  chats?: ChatInfo[];
  userId?: string;
  selectedLanguage: Language;
  hasBlockerError?: boolean;
  showProfileButton?: boolean;
  showSponsorshipsButton?: boolean;
  showChatsDropdown?: boolean;
  showHelpButton?: boolean;
  drawerOpen?: boolean;
  onDrawerOpenChange?: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
  page,
  selectedChat = undefined,
  chats: externalChats = [],
  userId: propUserId,
  selectedLanguage,
  hasBlockerError = false,
  showProfileButton = true,
  showSponsorshipsButton = true,
  showChatsDropdown = true,
  showHelpButton = true,
  drawerOpen: externalDrawerOpen,
  onDrawerOpenChange,
}) => {
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const [chatsCollapsibleOpen, setChatsCollapsibleOpen] = useState(
    page === "chat"
  );
  const menuOpen =
    externalDrawerOpen !== undefined ? externalDrawerOpen : internalMenuOpen;
  const setMenuOpen = onDrawerOpenChange || setInternalMenuOpen;

  const { lang_iso_code, user_id, chat_id } = useParams<{
    lang_iso_code: string;
    user_id?: string;
    chat_id?: string;
  }>();

  const location = useLocation();
  const {
    navigateToChat,
    navigateToProfile,
    navigateToAccess,
    navigateToIntelligence,
    navigateToSponsorships,
    navigateToFeatures,
    navigateToConnections,
    navigateWithLanguageChange,
  } = useNavigation();

  // Use chats passed from parent component
  const chats = externalChats;

  // Prefer URL param, fall back to prop (for navigation from non-user-specific pages)
  const effectiveUserId = user_id || propUserId;

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
      case "access":
        return t("access");
      case "intelligence":
        return t("intelligence");
      case "connections":
        return t("connections.page_title");
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

    if (lang_iso_code && effectiveUserId) {
      navigateToProfile(effectiveUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to profile without user_id");
    }
  };

  const handleSponsorshipsClick = () => {
    if (page === "sponsorships") return;

    if (lang_iso_code && effectiveUserId) {
      navigateToSponsorships(effectiveUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to sponsorships without user_id");
    }
  };

  const handleAccessClick = () => {
    if (page === "access") return;

    if (lang_iso_code && effectiveUserId) {
      navigateToAccess(effectiveUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to access without user_id");
    }
  };

  const handleIntelligenceClick = () => {
    if (page === "intelligence") return;

    if (lang_iso_code && effectiveUserId) {
      navigateToIntelligence(effectiveUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to intelligence without user_id");
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

  const handleConnectionsClick = () => {
    if (page === "connections") return;

    if (lang_iso_code && effectiveUserId) {
      navigateToConnections(effectiveUserId, lang_iso_code);
      setMenuOpen(false);
    } else {
      console.warn("Cannot navigate to connections without user_id");
    }
  };

  return (
    <div className="header-gradient w-screen relative">
      {/* Mobile & Mid-size menu button - absolute positioned (<lg) */}
      <div
        className={cn(
          "absolute right-6 z-10 lg:hidden flex items-center",
          "top-6 md:top-12",
          "gap-5 md:gap-2"
        )}
      >
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
                <div className="h-6" />
                {/* Custom close button */}
                <div className="px-3 flex items-center justify-end gap-4">
                  <div className="flex-1 h-px bg-blue-300/30" />
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={cn("glass rounded-full cursor-pointer", "scale-120 md:scale-100")}
                    >
                      <X className="h-6 w-6" />
                    </Button>
                  </SheetClose>
                </div>

                <div className="h-4" />

                {/* Chats collapsible in drawer */}
                {showChatsDropdown && chats.length > 0 && (
                  <>
                    <ChatsCollapsible
                      chats={chats}
                      selectedChat={resolvedSelectedChat}
                      onChatChange={handleChatChange}
                      defaultOpen={page === "chat"}
                      onOpenChange={setChatsCollapsibleOpen}
                    />
                    {chatsCollapsibleOpen && <div className="h-2" />}
                  </>
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
                          : "text-white hover:bg-white/10 cursor-pointer"
                      )}
                      onClick={handleProfileClick}
                    >
                      <UserRound className="h-5 w-5 shrink-0" />
                      {t("profile")}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    disabled={page === "access"}
                    className={cn(
                      "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                      page === "access"
                        ? "bg-accent/70 cursor-default opacity-100"
                        : "text-white hover:bg-white/10 cursor-pointer"
                    )}
                    onClick={handleAccessClick}
                  >
                    <Key className="h-5 w-5 shrink-0" />
                    {t("access")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={page === "intelligence"}
                    className={cn(
                      "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                      page === "intelligence"
                        ? "bg-accent/70 cursor-default opacity-100"
                        : "text-white hover:bg-white/10 cursor-pointer"
                    )}
                    onClick={handleIntelligenceClick}
                  >
                    <Brain className="h-5 w-5 shrink-0" />
                    {t("intelligence")}
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={page === "connections"}
                    className={cn(
                      "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                      page === "connections"
                        ? "bg-accent/70 cursor-default opacity-100"
                        : "text-white hover:bg-white/10 cursor-pointer"
                    )}
                    onClick={handleConnectionsClick}
                  >
                    <Merge className="h-5 w-5 shrink-0" />
                    {t("connections.page_title")}
                  </Button>
                  {showSponsorshipsButton && (
                    <Button
                      variant="ghost"
                      disabled={page === "sponsorships"}
                      className={cn(
                        "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                        page === "sponsorships"
                          ? "bg-accent/70 cursor-default opacity-100"
                          : "text-white hover:bg-white/10 cursor-pointer"
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
                          : "text-white hover:bg-white/10 cursor-pointer"
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
                        ? "glass-active text-accent-amber underline underline-offset-4 decoration-accent-amber cursor-default"
                        : "glass cursor-pointer"
                    )}
                    onClick={handleProfileClick}
                  >
                    <UserRound className="h-5 w-5" />
                    {t("profile")}
                  </Button>
                </NavigationMenuItem>
              )}
              <NavigationMenuItem>
                <LanguageDropdown
                  selectedLanguage={selectedLanguage}
                  onLangChange={handleLangChange}
                />
              </NavigationMenuItem>
              {hasAnyNavItems && (
                <NavigationMenuItem>
                  <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="glass rounded-full cursor-pointer"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="right"
                      className="w-full! sm:max-w-sm glass-dark-static border-l border-white/20 px-4 [&>button]:hidden"
                    >
                      <SheetTitle className="sr-only">
                        Navigation Menu
                      </SheetTitle>
                      <SheetDescription className="sr-only">
                        Access your chats, profile, access, intelligence,
                        sponsorships, help, and other
                      </SheetDescription>
                      <div className="flex flex-col gap-1 h-full">
                        <div className="h-6" />
                        {/* Custom close button */}
                        <div className="px-1 flex items-center justify-end gap-6">
                          <div className="flex-1 h-px bg-blue-300/30" />
                          <SheetClose asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className={cn("glass rounded-full cursor-pointer", "scale-120 md:scale-100")}
                            >
                              <X className="h-6 w-6" />
                            </Button>
                          </SheetClose>
                        </div>

                        <div className="h-4" />

                        {/* Chats collapsible in drawer */}
                        {showChatsDropdown && chats.length > 0 && (
                          <>
                            <ChatsCollapsible
                              chats={chats}
                              selectedChat={resolvedSelectedChat}
                              onChatChange={handleChatChange}
                              defaultOpen={page === "chat"}
                              onOpenChange={setChatsCollapsibleOpen}
                            />
                            {chatsCollapsibleOpen && <div className="h-4" />}
                          </>
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
                                  : "text-white hover:bg-white/10 cursor-pointer"
                              )}
                              onClick={handleProfileClick}
                            >
                              <UserRound className="h-5 w-5 shrink-0" />
                              {t("profile")}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            disabled={page === "access"}
                            className={cn(
                              "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                              page === "access"
                                ? "bg-accent/70 cursor-default opacity-100"
                                : "text-white hover:bg-white/10 cursor-pointer"
                            )}
                            onClick={handleAccessClick}
                          >
                            <Key className="h-5 w-5 shrink-0" />
                            {t("access")}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={page === "intelligence"}
                            className={cn(
                              "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                              page === "intelligence"
                                ? "bg-accent/70 cursor-default opacity-100"
                                : "text-white hover:bg-white/10 cursor-pointer"
                            )}
                            onClick={handleIntelligenceClick}
                          >
                            <Brain className="h-5 w-5 shrink-0" />
                            {t("intelligence")}
                          </Button>
                          <Button
                            variant="ghost"
                            disabled={page === "connections"}
                            className={cn(
                              "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                              page === "connections"
                                ? "bg-accent/70 cursor-default opacity-100"
                                : "text-white hover:bg-white/10 cursor-pointer"
                            )}
                            onClick={handleConnectionsClick}
                          >
                            <Merge className="h-5 w-5 shrink-0" />
                            {t("connections.page_title")}
                          </Button>
                          {showSponsorshipsButton && (
                            <Button
                              variant="ghost"
                              disabled={page === "sponsorships"}
                              className={cn(
                                "justify-start gap-3 text-base h-12 rounded-xl font-normal",
                                page === "sponsorships"
                                  ? "bg-accent/70 cursor-default opacity-100"
                                  : "text-white hover:bg-white/10 cursor-pointer"
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
                                  : "text-white hover:bg-white/10 cursor-pointer"
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
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </div>
  );
};

export default Header;
