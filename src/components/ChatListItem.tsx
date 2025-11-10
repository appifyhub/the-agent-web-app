import React from "react";
import { Users, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInfo } from "@/services/user-settings-service";
import { Platform } from "@/lib/platform";
import PlatformIcon from "@/components/PlatformIcon";
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
          : "text-white hover:bg-white/10 cursor-pointer",
        className
      )}
    >
      <span className="flex-1 truncate text-left min-w-0">
        {chat.title || t("untitled")}
      </span>
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
    </Button>
  );
};

export default ChatListItem;
