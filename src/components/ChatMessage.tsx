import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ChatMessageProps {
  content: string;
  role: "user" | "bot";
}

const ChatMessage = ({ content, role }: ChatMessageProps) => {
  const isBot = role === "bot";

  return (
    <div className={`flex gap-3 animate-slide-up ${isBot ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isBot ? "gradient-primary text-primary-foreground" : "bg-accent text-foreground"
        }`}
      >
        {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isBot
            ? "bg-card border text-foreground shadow-sm"
            : "gradient-primary text-primary-foreground"
        }`}
      >
        {isBot ? (
          <div className="chat-prose">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        ) : (
          content
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
