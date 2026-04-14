import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  content: string;
  role: "user" | "bot";
}

const ChatMessage = ({ content, role }: ChatMessageProps) => {
  const isBot = role === "bot";

  return (
    <div className={`flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isBot ? "bg-primary text-primary-foreground" : "bg-accent text-foreground"
        }`}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? "bg-card border text-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {content}
      </div>
    </div>
  );
};

export default ChatMessage;
