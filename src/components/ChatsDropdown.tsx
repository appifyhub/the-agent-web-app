import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  CheckIcon,
  MessageCircle,
  Crown,
  MessagesSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChatInfo } from "@/services/user-settings-service";
import { Platform } from "@/lib/platform";
import PlatformIcon from "@/components/PlatformIcon";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/translations";

interface ChatsDropdownProps {
  chats: ChatInfo[];
  selectedChat?: ChatInfo;
  onChatChange?: (chatId: string) => void;
  disabled?: boolean;
  className?: string;
}

const ChatsDropdown: React.FC<ChatsDropdownProps> = ({
  chats,
  selectedChat,
  onChatChange = () => {},
  disabled = false,
  className,
}) => {
  const isValidChatSelected =
    selectedChat && chats.some((chat) => chat.chat_id === selectedChat.chat_id);

  const resolveChatLabel = () => {
    if (chats.length === 0 && !disabled) {
      return (
        <span className="flex items-baseline gap-2">
          <MessageCircle className="h-6 w-6 translate-y-0.5" />
          <span>{t("loading_placeholder")}</span>
        </span>
      );
    }

    if (isValidChatSelected) {
      return (
        <span className="flex items-baseline gap-2">
          <PlatformIcon platform={Platform.fromString(selectedChat.platform)} className="h-4 w-4 translate-y-0.5" />
          <span className="font-light">{selectedChat.title || t("untitled")}</span>
        </span>
      );
    }

    return (
      <span className="flex items-baseline gap-2">
        <MessageCircle className="h-6 w-6 translate-y-0.5" />
        <span hidden={disabled}>{t("your_chats")}</span>
      </span>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        asChild
        className={cn(
          "flex-initial md:flex-none md:max-w-md min-w-0 px-4 rounded-full cursor-pointer",
          className
        )}
      >
        <Button
          variant="outline"
          size="icon"
          className={cn(
            chats.length === 0 || disabled
              ? "glass-dark-static"
              : isValidChatSelected
              ? "glass-active text-amber-100 font-normal"
              : "glass font-light",
            "w-auto min-w-0 whitespace-nowrap overflow-hidden md:w-auto md:max-w-md text-base"
          )}
          disabled={chats.length === 0 || disabled}
        >
          <span className="flex-1 min-w-0 text-left truncate">
            {resolveChatLabel()}
          </span>
          <ChevronDownIcon className="h-4 w-4 ml-1" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="p-1 glass-dark-static rounded-2xl max-w-xs md:max-w-md"
      >
        {chats.map((chat) => (
          <DropdownMenuItem
            key={chat.chat_id}
            onClick={() => onChatChange?.(chat.chat_id)}
            className={cn(
              "cursor-pointer py-4 px-4 text-foreground flex items-center space-x-2 min-w-0 overflow-hidden",
              chat.chat_id === selectedChat?.chat_id ? "bg-accent/70" : ""
            )}
            disabled={chat.chat_id === selectedChat?.chat_id}
          >
            <span className="flex-1 truncate">{chat.title || t("untitled")}</span>
            {chat.chat_id === selectedChat?.chat_id && (
              <CheckIcon className="h-4 w-4 flex-shrink-0" />
            )}
            <div className="flex items-center gap-1">
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center justify-center w-8 h-7",
                  chat.is_own
                    ? "bg-amber-100 text-background border-orange-600/20"
                    : "bg-foreground text-background border-black/20"
                )}
              >
                {chat.is_own ? (
                  <Crown className="h-4 w-4 text-amber-800/70" />
                ) : (
                  <MessagesSquare className="h-4 w-4 text-background" />
                )}
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center justify-center w-8 h-7 bg-transparent text-white border-foreground"
              >
                <PlatformIcon
                  platform={Platform.fromString(chat.platform)}
                  className="h-3 w-3 text-white"
                />
              </Badge>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatsDropdown;
