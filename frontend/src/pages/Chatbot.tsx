import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sparkles, Bot, Plus, MessageSquare, Trash2, Menu, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import ChatMessage from "@/components/ChatMessage";
import { streamChat, suggestedQuestions, type ChatMessage as ChatMsg } from "@/services/chat";
import {
  listConversations,
  listMessages,
  createConversation,
  saveMessage,
  deleteConversation,
  type Conversation,
} from "@/services/chatHistory";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const WELCOME: ChatMsg = {
  role: "bot",
  content:
    "Hi! I'm **StockSense AI** 🤖\n\nAsk me anything about stocks, investing, NSE/BSE, mutual funds, technical indicators — I'll explain it simply.",
};

const Chatbot = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load conversation list when user logs in
  const refreshConvos = useCallback(async () => {
    if (!user) {
      setConversations([]);
      return;
    }
    setConversations(await listConversations());
  }, [user]);

  useEffect(() => { refreshConvos(); }, [refreshConvos]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const startNewChat = () => {
    abortRef.current?.abort();
    setActiveConvoId(null);
    setMessages([WELCOME]);
    setSidebarOpen(false);
  };

  const openConversation = async (id: string) => {
    abortRef.current?.abort();
    setActiveConvoId(id);
    const stored = await listMessages(id);
    setMessages([
      WELCOME,
      ...stored.map((m): ChatMsg => ({ role: m.role === "assistant" ? "bot" : "user", content: m.content })),
    ]);
    setSidebarOpen(false);
  };

  const removeConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (activeConvoId === id) startNewChat();
    refreshConvos();
    toast("Chat deleted");
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isStreaming) return;
    setInput("");

    const userMsg: ChatMsg = { content: msg, role: "user" };
    const baseHistory = messages.length > 0 && messages[0] === WELCOME ? messages.slice(1) : messages;
    const sendable = [...baseHistory, userMsg];
    setMessages([WELCOME, ...sendable]);

    // Ensure conversation exists for logged-in users
    let convoId = activeConvoId;
    if (user && !convoId) {
      convoId = await createConversation(msg);
      if (convoId) {
        setActiveConvoId(convoId);
        refreshConvos();
      }
    }
    if (convoId) saveMessage(convoId, "user", msg);

    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: "bot", content: "" }]);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamChat({
        messages: sendable,
        signal: controller.signal,
        onDelta: (chunk) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last && last.role === "bot") {
              next[next.length - 1] = { ...last, content: last.content + chunk };
            }
            return next;
          });
        },
        onDone: (full) => {
          if (convoId && full.trim()) saveMessage(convoId, "assistant", full);
          if (user) refreshConvos();
        },
      });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Something went wrong.";
      toast.error(errMsg);
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "bot" && !last.content) {
          next[next.length - 1] = { role: "bot", content: `⚠️ ${errMsg}` };
        }
        return next;
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="flex flex-1 container mx-auto max-w-6xl px-4 gap-4">
        {/* Sidebar */}
        <aside
          className={`${sidebarOpen ? "fixed inset-0 z-40 bg-background/95 backdrop-blur-sm" : "hidden"} md:relative md:block md:w-64 md:shrink-0`}
        >
          <div className="md:sticky md:top-20 flex h-full md:h-auto flex-col gap-2 p-4 md:p-0 md:py-6">
            <div className="flex items-center justify-between md:hidden mb-2">
              <span className="font-semibold">Chats</span>
              <button onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
            </div>

            <button
              onClick={startNewChat}
              className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition"
            >
              <Plus className="h-4 w-4" /> New chat
            </button>

            {!user ? (
              <div className="rounded-xl border bg-muted/40 p-3 text-xs text-muted-foreground">
                <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link> to save chat history across sessions.
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-muted-foreground px-1 mt-2">No saved chats yet.</p>
            ) : (
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[60vh]">
                {conversations.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openConversation(c.id)}
                    className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                      activeConvoId === c.id ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60"
                    }`}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="flex-1 truncate">{c.title}</span>
                    <button
                      onClick={(e) => removeConversation(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg border"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground">StockSense AI Assistant</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-success inline-block" />
                Powered by Gemini · Ask about stocks & investing
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-4 py-6 overflow-y-auto">
            {messages.map((msg, i) => (
              <ChatMessage key={i} content={msg.content || (isStreaming && i === messages.length - 1 ? "…" : "")} role={msg.role === "bot" ? "bot" : "user"} />
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 pb-4 animate-slide-up">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="rounded-full border bg-card px-4 py-2 text-xs font-medium text-foreground shadow-sm transition-all hover:bg-accent"
                >
                  <Sparkles className="inline h-3 w-3 mr-1.5 text-primary" />
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="sticky bottom-0 border-t bg-background/90 backdrop-blur-sm py-4">
            <div className="flex items-center gap-2 rounded-2xl border bg-card px-4 py-2.5 shadow-sm transition-all focus-within:ring-2 focus-within:ring-primary/20">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about stocks, investing, market terms..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                disabled={isStreaming}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isStreaming}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              AI-generated educational info. Not investment advice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
