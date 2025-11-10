import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronDownIcon,
  CheckIcon,
  MessageCircle,
  Users,
  ShieldCheck,
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
          <PlatformIcon
            platform={Platform.fromString(selectedChat.platform)}
            className="h-4 w-4 translate-y-0.5"
          />
          <span className="font-light">
            {selectedChat.title || t("untitled")}
          </span>
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
              ? "glass-active text-orange-200 font-normal underline underline-offset-4 decoration-accent-amber hover:decoration-white"
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
            <span className="flex-1 truncate">
              {chat.title || t("untitled")}
            </span>
            <div className="w-1" />
            {chat.chat_id === selectedChat?.chat_id && (
              <CheckIcon className="h-6 w-6 shrink-0" />
            )}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-6 h-6">
                {chat.is_own ? (
                  <ShieldCheck className="h-6 w-6 text-accent-amber" />
                ) : (
                  <Users className="h-6 w-6 text-foreground-muted" />
                )}
              </div>
              <div className="flex items-center justify-center w-6 h-6">
                <PlatformIcon
                  platform={Platform.fromString(chat.platform)}
                  className="h-6 w-6 text-foreground-muted"
                />
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ChatsDropdown;
