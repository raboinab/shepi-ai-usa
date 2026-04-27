import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import { s as supabase, C as Card, b as CardHeader, d as CardTitle, B as Button, f as CardContent, m as cn } from "../main.mjs";
import { T as Textarea } from "./textarea-H3ZPGfnJ.js";
import { MessageCircle, X, Send } from "lucide-react";
import { format } from "date-fns";
function EngagementChat({
  projectId,
  onClose,
  selfLabel = "You",
  otherLabel = "Analyst"
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from("chat_messages").select("id, role, content, created_at, user_id, metadata").eq("project_id", projectId).eq("context_type", "engagement").order("created_at", { ascending: true }).limit(200);
    if (data) setMessages(data);
    setLoading(false);
  }, [projectId]);
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);
  useEffect(() => {
    const channel = supabase.channel(`engagement-${projectId}`).on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "chat_messages",
        filter: `project_id=eq.${projectId}`
      },
      (payload) => {
        const newRow = payload.new;
        if (newRow.context_type === "engagement") {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newRow.id)) return prev;
            return [...prev, newRow];
          });
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);
  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId || sending) return;
    const content = newMessage.trim();
    setNewMessage("");
    setSending(true);
    const optimisticMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      user_id: currentUserId,
      metadata: null
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    const { error } = await supabase.from("chat_messages").insert({
      project_id: projectId,
      user_id: currentUserId,
      role: "user",
      content,
      context_type: "engagement"
    });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      console.error("Failed to send message:", error.message);
    }
    setSending(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  return /* @__PURE__ */ jsxs(Card, { className: "flex flex-col h-[400px] max-h-[60vh]", children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "py-3 px-4 flex-row items-center justify-between space-y-0 border-b", children: [
      /* @__PURE__ */ jsxs(CardTitle, { className: "text-sm font-medium flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(MessageCircle, { className: "h-4 w-4" }),
        "Engagement Messages"
      ] }),
      onClose && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", onClick: onClose, children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }) })
    ] }),
    /* @__PURE__ */ jsxs(CardContent, { className: "flex-1 overflow-y-auto p-3 space-y-3", children: [
      loading ? /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center py-8", children: "Loading…" }) : messages.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center py-8", children: "No messages yet. Start the conversation!" }) : messages.map((msg) => {
        const isSelf = msg.user_id === currentUserId;
        return /* @__PURE__ */ jsxs(
          "div",
          {
            className: cn("flex flex-col max-w-[80%]", isSelf ? "ml-auto items-end" : "items-start"),
            children: [
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground mb-0.5", children: [
                isSelf ? selfLabel : otherLabel,
                " · ",
                format(new Date(msg.created_at), "MMM d, h:mm a")
              ] }),
              /* @__PURE__ */ jsx(
                "div",
                {
                  className: cn(
                    "rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    isSelf ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                  ),
                  children: msg.content
                }
              )
            ]
          },
          msg.id
        );
      }),
      /* @__PURE__ */ jsx("div", { ref: bottomRef })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-t p-3 flex gap-2", children: [
      /* @__PURE__ */ jsx(
        Textarea,
        {
          value: newMessage,
          onChange: (e) => setNewMessage(e.target.value),
          onKeyDown: handleKeyDown,
          placeholder: "Type a message…",
          className: "min-h-[40px] max-h-[80px] resize-none text-sm",
          rows: 1
        }
      ),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "icon",
          onClick: handleSend,
          disabled: !newMessage.trim() || sending,
          className: "shrink-0",
          children: /* @__PURE__ */ jsx(Send, { className: "h-4 w-4" })
        }
      )
    ] })
  ] });
}
export {
  EngagementChat as E
};
