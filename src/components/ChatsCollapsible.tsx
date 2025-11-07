import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChatInfo } from "@/services/user-settings-service";
import ChatListItem from "@/components/ChatListItem";
import { t } from "@/lib/translations";

interface ChatsCollapsibleProps {
  chats: ChatInfo[];
  selectedChat?: ChatInfo;
  onChatChange: (chatId: string) => void;
  defaultOpen?: boolean;
}

const ChatsCollapsible: React.FC<ChatsCollapsibleProps> = ({
  chats,
  selectedChat,
  onChatChange,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={cn("w-full rounded-2xl", isOpen ? "bg-white/1 border border-solid border-white/5" : "")}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-start gap-3 text-base h-12 rounded-xl font-normal text-white hover:bg-white/10"
      >
        <MessageCircle className="h-5 w-5 shrink-0" />
        <span className="flex-1 text-left">{t("your_chats")}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </Button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          isOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        {chats.map((chat) => (
          <ChatListItem
            key={chat.chat_id}
            chat={chat}
            isSelected={chat.chat_id === selectedChat?.chat_id}
            onSelect={onChatChange}
          />
        ))}
      </div>
    </div>
  );
};

export default ChatsCollapsible;
