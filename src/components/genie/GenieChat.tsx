"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Loader2,
  MessageSquare,
  Zap,
  Trophy,
  BookOpen,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { askGenie } from "@/actions/genie";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface Message {
  role: "user" | "assistant";
  content: string;
  reasoning_details?: any;
}

export default function GenieChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load from local storage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem("qidzo_genie_history");
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to parse chat history");
        setMessages([
          {
            role: "assistant",
            content:
              "Hello! I'm your AI Tutor, here to help you learn anything! What would you like to explore today? ✨",
          },
        ]);
      }
    } else {
      setMessages([
        {
          role: "assistant",
          content:
            "Hello! I'm your AI Tutor, here to help you learn anything! What would you like to explore today? ✨",
        },
      ]);
    }
    setIsInitialized(true);
  }, []);

  // Save to local storage whenever messages change
  useEffect(() => {
    if (isInitialized && messages.length > 0) {
      localStorage.setItem("qidzo_genie_history", JSON.stringify(messages));
    }
  }, [messages, isInitialized]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (customInput?: string) => {
    const textToSend = customInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage = { role: "user" as const, content: textToSend.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const chatHistory = messages.concat(userMessage).map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      // Start streaming request
      const response = await fetch("/api/genie/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "AI Tutor is a bit busy right now.");
      }

      if (!response.body) throw new Error("No response from the magic lamp!");

      setIsStreaming(true);

      const reader = response.body.getReader();
      const textDecoder = new TextDecoder();

      let assistantReply = "";
      let hasStartedStreaming = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = textDecoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((line) => line.trim() !== "");

        for (const line of lines) {
          if (line.includes("[DONE]")) break;

          const match = line.match(/^data: (.*)/);
          if (match) {
            try {
              const data = JSON.parse(match[1]);
              const content = data.choices[0]?.delta?.content || "";
              if (content) {
                if (!hasStartedStreaming) {
                  hasStartedStreaming = true;
                  setIsLoading(false); // Stop thinking animation only when first word arrives
                  setMessages((prev) => [
                    ...prev,
                    { role: "assistant", content: content },
                  ]);
                  assistantReply = content;
                } else {
                  assistantReply += content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = {
                      ...newMessages[newMessages.length - 1],
                      content: assistantReply,
                    };
                    return newMessages;
                  });
                }
              }
            } catch (e) {}
          }
        }
      }
    } catch (error: any) {
      toast.error(error.message || "The magic lamp is flickering. Try again!");
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm("Do you want to start a new magical chat? ✨")) {
      const initialMessage = [
        {
          role: "assistant" as const,
          content:
            "Hello! I'm your AI Tutor, here to help you learn anything! What would you like to explore today? ✨",
        },
      ];
      setMessages(initialMessage);
      localStorage.setItem(
        "qidzo_genie_history",
        JSON.stringify(initialMessage),
      );
      toast.success("Magic lamp cleaned! Ready for new questions. 🧞‍♂️");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] max-w-4xl mx-auto bg-white rounded-[40px] border-4 border-white shadow-2xl shadow-brand-purple/10 overflow-hidden">
      {/* Header */}
      <div className="bg-brand-purple p-6 flex items-center justify-between shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <Link
            href="/"
            className="lg:hidden text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-inner group">
            <Bot className="w-7 h-7 text-brand-purple group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white font-nunito leading-tight">
              AI Tutor
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs font-bold uppercase tracking-widest">
                Ready to teach! 🎓
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={handleClearHistory}
            className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white/80 hover:text-white transition-all cursor-pointer border border-white/10"
            title="Start New Chat"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-brand-purple/20"
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "flex gap-3 max-w-[85%] sm:max-w-[75%]",
                msg.role === "user" ? "flex-row-reverse" : "flex-row",
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center shadow-md",
                  msg.role === "user"
                    ? "bg-hot-pink text-white"
                    : "bg-brand-purple text-white",
                )}
              >
                {msg.role === "user" ? (
                  <User className="w-6 h-6" />
                ) : (
                  <Bot className="w-6 h-6" />
                )}
              </div>

              <div
                className={cn(
                  "p-4 sm:p-5 rounded-[24px] shadow-sm relative",
                  msg.role === "user"
                    ? "bg-hot-pink text-white rounded-tr-none"
                    : "bg-gray-50 text-gray-800 border-2 border-gray-100 rounded-tl-none",
                )}
              >
                <div
                  className={cn(
                    "text-sm sm:text-base font-bold leading-relaxed whitespace-pre-wrap prose prose-sm prose-genie",
                    msg.role === "user" ? "prose-invert" : "prose-slate",
                  )}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div
                  className={cn(
                    "text-[10px] mt-2 opacity-50 font-black uppercase tracking-wider",
                    msg.role === "user" ? "text-white" : "text-gray-400",
                  )}
                >
                  {msg.role === "user" ? "You" : "Genie"}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-in fade-in duration-300">
            <div className="flex gap-3 max-w-[75%]">
              <div className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center bg-brand-purple text-white shadow-md">
                <Bot className="w-6 h-6" />
              </div>
              <div className="bg-gray-50 p-5 rounded-[24px] rounded-tl-none border-2 border-gray-100 flex items-center gap-3">
                <div className="flex gap-1">
                  <div
                    className="w-2 h-2 rounded-full bg-brand-purple animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-brand-purple animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-brand-purple animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                  AI Tutor is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 sm:p-8 bg-white border-t-4 border-gray-50">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-brand-purple to-hot-pink rounded-[28px] blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative flex items-center gap-2 sm:gap-4 bg-gray-50 rounded-[24px] p-2 pr-2 sm:pr-3 border-2 border-transparent focus-within:border-brand-purple/20 transition-all">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask me anything! Math, Science, or a Story? 🌟"
              className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-sm sm:text-base font-bold text-gray-800 placeholder:text-gray-400"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="bg-brand-purple hover:bg-brand-purple/90 text-white p-3 sm:px-6 sm:py-3 rounded-[20px] font-black flex items-center gap-2 shadow-lg shadow-brand-purple/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
              <span className="hidden sm:inline">Magic!</span>
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          <button
            onClick={() => handleSend("Explain gravity like I'm 5!")}
            disabled={isLoading}
            className="text-[10px] sm:text-xs font-black text-gray-400 hover:text-brand-purple bg-gray-100 hover:bg-brand-purple/10 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-brand-purple/20 disabled:opacity-50 cursor-pointer"
          >
            🍎 Gravity for kids
          </button>
          <button
            onClick={() => handleSend("Tell me a space adventure story!")}
            disabled={isLoading}
            className="text-[10px] sm:text-xs font-black text-gray-400 hover:text-hot-pink bg-gray-100 hover:bg-hot-pink/10 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-hot-pink/20 disabled:opacity-50 cursor-pointer"
          >
            🚀 Space Story
          </button>
          <button
            onClick={() => handleSend("Help me with multiplication tables.")}
            disabled={isLoading}
            className="text-[10px] sm:text-xs font-black text-gray-400 hover:text-sky-blue bg-gray-100 hover:bg-sky-blue/10 px-3 py-1.5 rounded-full transition-colors border border-transparent hover:border-sky-blue/20 disabled:opacity-50 cursor-pointer"
          >
            🔢 Math help
          </button>
        </div>
      </div>
    </div>
  );
}
