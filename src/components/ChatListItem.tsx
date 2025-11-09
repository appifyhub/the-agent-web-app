import React from "react";
import { Crown, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInfo } from "@/services/user-settings-service";
import { Platform } from "@/lib/platform";
import PlatformIcon from "@/components/PlatformIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/translations";

interface ChatListItemProps {
  chat: ChatInfo;
  isSelected: boolean;
  onSelect: (chatId: string) => void;
  className?: string;
}

const ChatListItem: React.FC<ChatListItemProps> = ({
  chat,
  isSelected,
  onSelect,
  className,
}) => {
  return (
    <Button
      variant="ghost"
      disabled={isSelected}
      onClick={() => onSelect(chat.chat_id)}
      className={cn(
        "w-full justify-start gap-3 text-base h-12 rounded-xl px-8 font-normal",
        isSelected
          ? "bg-accent/70 cursor-default opacity-100"
          : "text-white hover:bg-white/10",
        className
      )}
    >
      <span className="flex-1 truncate text-left min-w-0">{chat.title || t("untitled")}</span>
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
    </Button>
  );
};

export default ChatListItem;
