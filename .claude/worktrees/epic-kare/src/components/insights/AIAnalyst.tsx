import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { Send, Bot, User, Sparkles, Loader2, PanelRightClose, Trash2 } from "lucide-react";
import { useChatHistory } from "@/hooks/useChatHistory";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import type { ProjectData } from "@/pages/Project";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface AIAnalystProps {
  project: ProjectData;
  onCollapse?: () => void;
}

const SUGGESTED_PROMPTS = [
  "Summarize the QoE findings",
  "What are the largest adjustments?",
  "Analyze the revenue trend",
  "Identify any red flags",
  "Explain the EBITDA bridge",
];

export const AIAnalyst = ({ project, onCollapse }: AIAnalystProps) => {
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
    contextType: 'insights'
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
        // No saved history - show empty state
        setMessages([]);
      }
    }
  }, [isLoadingHistory, isAuthReady, savedMessages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: messageText.trim(),
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
            messages: [...messages, userMessage].map((m) => ({
              role: m.role,
              content: m.content,
            })),
            wizardData: project.wizard_data,
            projectInfo: {
              id: project.id,
              name: project.name,
              targetCompany: project.target_company,
              industry: project.industry,
              periods: project.periods,
            },
            // For Insights view, use the project's current section if available
            currentSection: project.current_phase && project.current_section ? {
              phase: project.current_phase,
              section: project.current_section,
              sectionName: "Insights Dashboard",
            } : undefined,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Rate limit exceeded. Please try again later.");
        }
        if (response.status === 402) {
          throw new Error("Usage limit reached. Please add credits to continue.");
        }
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader available");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantId = crypto.randomUUID();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

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
            // Partial JSON, continue
          }
        }
      }
      
      // Save messages to history after successful response
      if (assistantContent) {
        await saveMessages(userMessage.content, assistantContent);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Something went wrong";
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleClearChat = async () => {
    const success = await clearHistory();
    if (success) {
      setMessages([]);
      toast.success("Chat history cleared");
    } else {
      toast.error("Failed to clear chat history");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="h-full flex flex-col bg-card border-l">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">AI Analyst</h3>
              {hasHistory && oldestMessageDate ? (
                <p className="text-xs text-muted-foreground">
                  Conversation from {formatDistanceToNow(oldestMessageDate, { addSuffix: true })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ask questions about your QoE analysis
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {hasHistory && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleClearChat}
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
            {onCollapse && (
              <Button variant="ghost" size="icon" onClick={onCollapse} title="Collapse panel">
                <PanelRightClose className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {/* Loading history state - show whenever loading, not just when auth isn't ready */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
            <Spinner className="h-4 w-4" />
            <span className="text-sm">Loading conversation...</span>
          </div>
        )}
        
        {/* Empty state - only show when auth is ready and no messages */}
        {isAuthReady && !isLoadingHistory && messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">Start a conversation</h4>
              <p className="text-sm text-muted-foreground mb-6">
                Ask me anything about your Quality of Earnings analysis
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <Badge
                    key={prompt}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => sendMessage(prompt)}
                  >
                    {prompt}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        ) : messages.length > 0 ? (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="p-2 rounded-lg bg-primary/10 h-fit">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <Card
                  className={`max-w-[85%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <CardContent className="p-3">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </CardContent>
                </Card>
                {message.role === "user" && (
                  <div className="p-2 rounded-lg bg-primary h-fit">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex gap-3 justify-start">
                <div className="p-2 rounded-lg bg-primary/10 h-fit">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <Card className="bg-muted">
                  <CardContent className="p-3">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        ) : null}
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your analysis..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  );
};
