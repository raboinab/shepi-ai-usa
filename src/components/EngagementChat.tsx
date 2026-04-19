import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, X, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
  user_id: string;
  metadata: Record<string, unknown> | null;
}

interface EngagementChatProps {
  projectId: string;
  onClose?: () => void;
  /** The current user's role label shown on their messages */
  selfLabel?: string;
  /** The other party's label */
  otherLabel?: string;
}

export function EngagementChat({
  projectId,
  onClose,
  selfLabel = "You",
  otherLabel = "Analyst",
}: EngagementChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at, user_id, metadata")
      .eq("project_id", projectId)
      .eq("context_type", "engagement")
      .order("created_at", { ascending: true })
      .limit(200);

    if (data) setMessages(data as ChatMessage[]);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`engagement-${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newRow = payload.new as ChatMessage & { context_type?: string };
          if (newRow.context_type === "engagement") {
            setMessages((prev) => {
              if (prev.some((m) => m.id === newRow.id)) return prev;
              return [...prev, newRow];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;

    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);

    // Optimistic add
    const optimisticMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
      user_id: currentUserId,
      metadata: null,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    const { error } = await supabase.from("chat_messages").insert({
      project_id: projectId,
      user_id: currentUserId,
      role: "user",
      content,
      context_type: "engagement",
    });

    if (error) {
      // Remove optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      console.error("Failed to send message:", error.message);
    }

    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[400px] max-h-[60vh]">
      <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <MessageCircle className="h-4 w-4" />
          Engagement Messages
        </CardTitle>
        {onClose && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No messages yet. Start the conversation!
          </p>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.user_id === currentUserId;
            return (
              <div
                key={msg.id}
                className={cn("flex flex-col max-w-[80%]", isSelf ? "ml-auto items-end" : "items-start")}
              >
                <span className="text-[10px] text-muted-foreground mb-0.5">
                  {isSelf ? selfLabel : otherLabel} · {format(new Date(msg.created_at), "MMM d, h:mm a")}
                </span>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    isSelf
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </CardContent>

      <div className="border-t p-3 flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          className="min-h-[40px] max-h-[80px] resize-none text-sm"
          rows={1}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!newMessage.trim() || sending}
          className="shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
