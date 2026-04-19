import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { X, Send, Sparkles, BookOpen, Loader2, Minus, Maximize2, GripVertical, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSuggestedPrompts, getSectionEducation } from "@/lib/qoeEducation";
import { getIndustryContext } from "@/lib/industryConfig";
import { useChatHistory } from "@/hooks/useChatHistory";
import { formatDistanceToNow } from "date-fns";
import type { ProjectData } from "@/pages/Project";
import type { CIMInsights } from "./sections/CIMInsightsCard";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIChatPanelProps {
  project: ProjectData;
  currentPhase: number;
  currentSection: number;
  pendingPrompt?: string;
  onPromptConsumed?: () => void;
  onClose: () => void;
}

const STORAGE_KEY = "ai-chat-panel-size";
const POSITION_KEY = "ai-chat-panel-position";
const MIN_WIDTH = 300;
const MIN_HEIGHT = 350;
const MAX_WIDTH = 900;
const MAX_HEIGHT_VH = 90;

const getDefaultSize = () => {
  const isMobile = window.innerWidth < 768;
  return {
    width: isMobile ? window.innerWidth - 32 : 380,
    height: isMobile ? window.innerHeight * 0.5 : 500,
  };
};

const getSavedSize = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        width: Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, parsed.width)),
        height: Math.max(MIN_HEIGHT, Math.min(window.innerHeight * (MAX_HEIGHT_VH / 100), parsed.height)),
      };
    }
  } catch {}
  return getDefaultSize();
};

const getDefaultPosition = () => ({ right: 16, bottom: 16 });

const getSavedPosition = () => {
  try {
    const saved = localStorage.getItem(POSITION_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        right: Math.max(0, Math.min(window.innerWidth - 100, parsed.right)),
        bottom: Math.max(0, Math.min(window.innerHeight - 100, parsed.bottom)),
      };
    }
  } catch {}
  return getDefaultPosition();
};

export const AIChatPanel = ({ project, currentPhase, currentSection, pendingPrompt, onPromptConsumed, onClose }: AIChatPanelProps) => {
  const sectionEducation = getSectionEducation(currentPhase, currentSection);
  const suggestedPrompts = getSuggestedPrompts(currentPhase, currentSection);
  
  // Chat history persistence
  const {
    messages: savedMessages,
    isLoading: isLoadingHistory,
    isAuthReady,
    saveMessages,
    clearHistory,
    hasHistory,
    oldestMessageDate
  } = useChatHistory({
    projectId: project.id,
    contextType: 'wizard'
  });
  
  const getWelcomeMessage = useCallback(() => ({
    id: "welcome",
    role: "assistant" as const,
    content: `Hi! I'm your QoE analyst assistant. ${
      sectionEducation 
        ? `You're currently working on ${sectionEducation.title}. I can help explain concepts like ${sectionEducation.concepts.slice(0, 2).join(" and ")}, answer questions about your data, or identify potential issues.`
        : `I can help you with EBITDA adjustments, explain financial concepts, identify red flags, and guide you through the QoE analysis process.`
    }\n\nWhat would you like help with?`,
  }), [sectionEducation]);
  
  const [messages, setMessages] = useState<Message[]>([getWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [size, setSize] = useState(getSavedSize);
  const [position, setPosition] = useState(getSavedPosition);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [cimInsights, setCimInsights] = useState<CIMInsights | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; right: number; bottom: number } | null>(null);
  
  // Sync messages from saved history whenever it changes
  // Important: sync both when there IS history AND when history is empty (after clear or on new project)
  useEffect(() => {
    if (!isLoadingHistory && isAuthReady) {
      if (savedMessages.length > 0) {
        setMessages(savedMessages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content
        })));
      } else {
        // No saved history - reset to welcome message
        setMessages([getWelcomeMessage()]);
      }
    }
  }, [isLoadingHistory, isAuthReady, savedMessages, getWelcomeMessage]);

  // Consume pending prompt passed as prop (deterministic, no race condition)
  useEffect(() => {
    if (pendingPrompt) {
      setInput(pendingPrompt);
      setIsMinimized(false);
      onPromptConsumed?.();
    }
  }, [pendingPrompt]);

  // Listen for prefill-assistant events as fallback (when panel is already mounted)
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent).detail;
      if (typeof prompt === 'string' && prompt.trim()) {
        setInput(prompt);
        setIsMinimized(false);
      }
    };
    window.addEventListener('prefill-assistant', handler);
    return () => window.removeEventListener('prefill-assistant', handler);
  }, []);
  // Fetch CIM insights on mount
  useEffect(() => {
    const fetchCimInsights = async () => {
      try {
        const { data, error } = await supabase
          .from("processed_data")
          .select("data")
          .eq("project_id", project.id)
          .eq("data_type", "cim_insights")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data?.data) {
          setCimInsights(data.data as unknown as CIMInsights);
        }
      } catch (error) {
        console.error("Error fetching CIM insights:", error);
      }
    };

    fetchCimInsights();
  }, [project.id]);

  // Update welcome message when section changes
  useEffect(() => {
    const newEducation = getSectionEducation(currentPhase, currentSection);
    if (newEducation && messages.length === 1 && messages[0].id === "welcome") {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: `Hi! I'm your QoE analyst assistant. You're currently working on ${newEducation.title}. I can help explain concepts like ${newEducation.concepts.slice(0, 2).join(" and ")}, answer questions about your data, or identify potential issues.\n\nWhat would you like help with?`,
      }]);
    }
  }, [currentPhase, currentSection]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Save size to localStorage
  useEffect(() => {
    if (!isResizing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(size));
    }
  }, [size, isResizing]);

  // Save position to localStorage
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem(POSITION_KEY, JSON.stringify(position));
    }
  }, [position, isDragging]);

  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;
      
      const deltaX = resizeStartRef.current.x - e.clientX;
      const deltaY = resizeStartRef.current.y - e.clientY;
      
      const maxHeight = window.innerHeight * (MAX_HEIGHT_VH / 100);
      const newWidth = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartRef.current.width + deltaX));
      const newHeight = Math.max(MIN_HEIGHT, Math.min(maxHeight, resizeStartRef.current.height + deltaY));
      
      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartRef.current = null;
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Handle drag-to-move
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // Don't drag if clicking buttons
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      right: position.right,
      bottom: position.bottom,
    };
  }, [position]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      const deltaX = dragStartRef.current.mouseX - e.clientX;
      const deltaY = dragStartRef.current.mouseY - e.clientY;
      const newRight = Math.max(0, Math.min(window.innerWidth - size.width, dragStartRef.current.right + deltaX));
      const newBottom = Math.max(0, Math.min(window.innerHeight - 60, dragStartRef.current.bottom + deltaY));
      setPosition({ right: newRight, bottom: newBottom });
    };
    const onUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp); };
  }, [isDragging, size.width]);

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [...messages.filter(m => m.id !== "welcome"), userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            wizardData: project.wizard_data,
            projectInfo: {
              name: project.name,
              targetCompany: project.target_company,
              industry: project.industry,
              ...(project.industry ? (() => {
                const ctx = getIndustryContext(project.industry);
                return { industryTraitsJson: ctx.traitsJson, industryNarrative: ctx.narrative };
              })() : {}),
              periods: project.periods,
            },
            currentSection: {
              phase: currentPhase,
              section: currentSection,
              sectionName: sectionEducation?.title || "Unknown",
            },
            cimInsights: cimInsights || undefined,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again in a moment.");
          setIsLoading(false);
          return;
        }
        if (response.status === 402) {
          toast.error("Usage limit reached. Please add credits to continue.");
          setIsLoading(false);
          return;
        }
        throw new Error("AI service error");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      // Add empty assistant message to update
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        // Process complete lines
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: assistantContent } : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back and wait
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
      
      // Save messages to history after successful response
      if (assistantContent) {
        await saveMessages(userMessage.content, assistantContent);
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.filter(m => m.role !== "assistant" || m.content));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearChat = async () => {
    const success = await clearHistory();
    if (success) {
      setMessages([getWelcomeMessage()]);
      toast.success("Chat history cleared");
    } else {
      toast.error("Failed to clear chat history");
    }
  };

  // Minimized state
  if (isMinimized) {
    return (
      <div 
        className="fixed z-50 bg-card border border-border rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
        style={{ right: position.right, bottom: position.bottom }}
        onClick={() => setIsMinimized(false)}
      >
        <div className="px-4 py-3 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-medium text-sm">QoE Assistant</span>
          <Maximize2 className="w-4 h-4 text-muted-foreground ml-2" />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className="fixed z-50 bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
      style={{
        right: position.right,
        bottom: position.bottom,
        width: size.width,
        height: size.height,
        maxWidth: "calc(100vw - 32px)",
        maxHeight: `${MAX_HEIGHT_VH}vh`,
      }}
    >
      {/* Resize handle - top left corner */}
      <div
        className="absolute top-0 left-0 w-6 h-6 cursor-nw-resize z-10 flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity"
        onMouseDown={handleResizeStart}
      >
        <GripVertical className="w-3 h-3 text-muted-foreground rotate-45" />
      </div>

      {/* Header */}
      <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30 shrink-0 cursor-move" onMouseDown={handleDragStart}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">QoE Assistant</h3>
            {hasHistory && oldestMessageDate && (
              <p className="text-[10px] text-muted-foreground">
                Conversation from {formatDistanceToNow(oldestMessageDate, { addSuffix: true })}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {hasHistory && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleClearChat}
              title="Clear chat history"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMinimized(true)}>
            <Minus className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Section context badge */}
      {sectionEducation && (
        <div className="px-3 py-2 border-b border-border bg-muted/50 shrink-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <BookOpen className="w-3 h-3" />
            <span>Helping with: <strong className="text-foreground">{sectionEducation.title}</strong></span>
          </div>
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {/* Loading history state - show whenever loading, not just when auth isn't ready */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-4 text-muted-foreground gap-2">
            <Spinner className="h-4 w-4" />
            <span className="text-xs">Loading conversation...</span>
          </div>
        )}
        
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {message.content || (
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:100ms]"></span>
                    <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:200ms]"></span>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Suggested prompts */}
      {messages.length <= 2 && (
        <div className="px-3 pb-2 shrink-0">
          <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-1">
            {suggestedPrompts.slice(0, 3).map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                {prompt.length > 35 ? prompt.slice(0, 32) + "..." : prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-border shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2"
        >
          <Input
            placeholder="Ask about QoE concepts..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="shrink-0">
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};
