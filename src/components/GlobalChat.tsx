"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Send, Loader2, MessageSquare, Radio } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { UserRole } from "@/components/AuthBar";

export type ChatMessage = {
  id: string;
  sender_name: string;
  sender_email?: string | null;
  sender_role?: string | null;
  content: string;
  is_demo?: boolean | null;
  created_at: string;
};

interface GlobalChatProps {
  currentUser: User | null;
  userRole: UserRole;
  authorName: string;
  isCurrentUserDemo: boolean;
}

export function GlobalChat({
  currentUser,
  userRole,
  authorName,
  isCurrentUserDemo,
}: GlobalChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
    } catch {
      // Gracefully ignore fetch errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();

    const supabase = createClient();
    const channel = supabase
      .channel("global-chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newMsg = payload.new as ChatMessage;
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
          } else {
            fetchMessages();
          }
        }
      )
      .subscribe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchMessages();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Fallback polling every 5 seconds
    const interval = setInterval(fetchMessages, 5000);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearInterval(interval);
    };
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sending) return;

    setSending(true);
    setInputText("");

    const roleLabel =
      userRole === "dean"
        ? "Dean"
        : userRole === "oic"
        ? "OIC"
        : "Faculty Adviser";

    const supabase = createClient();
    const payload = {
      sender_name: authorName,
      sender_email: currentUser?.email || null,
      sender_role: roleLabel,
      content: text,
      is_demo: isCurrentUserDemo,
    };

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert(payload)
        .select()
        .single();

      if (!error && data) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
      }
    } catch (err: unknown) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 50);
    }
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return "";
    }
  };

  // Filter messages based on demo/real sandbox
  const visibleMessages = messages.filter((m) => {
    if (isCurrentUserDemo) {
      return m.is_demo === true || m.is_demo === null;
    }
    return m.is_demo === false;
  });

  return (
    <Card className="flex flex-col h-[650px] border-border shadow-xs overflow-hidden">
      {/* Chat Room Header */}
      <CardHeader className="py-3.5 px-4 border-b border-border bg-muted/20 flex flex-row items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
              <span>Global Faculty Chat</span>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <Radio className="w-2.5 h-2.5 animate-pulse" />
                <span>Live Realtime</span>
              </span>
            </CardTitle>
            <p className="text-[11px] text-muted-foreground">
              Open conversation for all faculty advisers, OIC, and College Dean.
            </p>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <span className="text-[11px] text-muted-foreground">Posting as: </span>
          <span className="text-xs font-semibold text-foreground">{authorName}</span>
        </div>
      </CardHeader>

      {/* Message Feed */}
      <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 bg-background/50">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-xs">Loading conversation…</span>
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2 text-center py-12">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">No messages yet</p>
            <p className="text-xs max-w-xs">
              Say hello or post an event announcement! Everyone in CITE Boardroom will see it in real-time.
            </p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isMe =
              currentUser?.email &&
              msg.sender_email?.toLowerCase() === currentUser.email.toLowerCase();

            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {/* Sender Info & Timestamp */}
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                  <span className="font-semibold text-foreground">
                    {msg.sender_name} {isMe && "(You)"}
                  </span>
                  {msg.sender_role && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        msg.sender_role.toLowerCase().includes("dean")
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-200"
                          : msg.sender_role.toLowerCase().includes("oic")
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
                      }`}
                    >
                      {msg.sender_role}
                    </span>
                  )}
                  <span>•</span>
                  <span>{formatMessageTime(msg.created_at)}</span>
                </div>

                {/* Message Bubble */}
                <div
                  className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed break-words shadow-2xs ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-muted/70 text-foreground border border-border/60 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Bar */}
      <div className="p-3 border-t border-border bg-card shrink-0">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message as ${authorName}…`}
            disabled={sending}
            className="text-xs h-9.5 flex-1 bg-background"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || sending}
            size="sm"
            className="h-9.5 px-3.5 gap-1.5 text-xs font-semibold"
          >
            {sending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Send</span>
              </>
            )}
          </Button>
        </form>
      </div>
    </Card>
  );
}
