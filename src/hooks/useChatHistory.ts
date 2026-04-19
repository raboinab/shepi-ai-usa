import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface UseChatHistoryOptions {
  projectId: string;
  contextType: 'wizard' | 'insights';
  limit?: number;
}

interface UseChatHistoryReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  isAuthReady: boolean;
  error: string | null;
  saveMessages: (userMsg: string, assistantMsg: string) => Promise<void>;
  clearHistory: () => Promise<boolean>;
  hasHistory: boolean;
  oldestMessageDate: Date | null;
}

export function useChatHistory({
  projectId,
  contextType,
  limit = 50
}: UseChatHistoryOptions): UseChatHistoryReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  
  const fetchSeqRef = useRef(0);
  const isMountedRef = useRef(true);
  const cachedUserIdRef = useRef<string | null>(null);

  // Fetch existing messages
  const fetchHistory = useCallback(async (userId: string | null, seq: number) => {
    if (!projectId || !userId) {
      if (isMountedRef.current) {
        setMessages([]);
        setIsLoading(false);
      }
      return;
    }

    if (isMountedRef.current) {
      setIsLoading(true);
      setError(null);
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('project_id', projectId)
        .eq('context_type', contextType)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (seq !== fetchSeqRef.current || !isMountedRef.current) return;

      if (fetchError) throw fetchError;

      setMessages((data || []) as ChatMessage[]);
    } catch (err) {
      if (seq === fetchSeqRef.current && isMountedRef.current) {
        console.error('Error fetching chat history:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setMessages([]);
      }
    } finally {
      if (seq === fetchSeqRef.current && isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [projectId, contextType, limit]);

  // Initialize auth state
  useEffect(() => {
    isMountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMountedRef.current) return;
        const userId = session?.user?.id || null;
        cachedUserIdRef.current = userId;
        setSessionUserId(userId);
        setIsAuthReady(true);
        const seq = ++fetchSeqRef.current;
        fetchHistory(userId, seq);
      }
    );

    const initSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMountedRef.current) return;
        const userId = session?.user?.id || null;
        cachedUserIdRef.current = userId;
        setSessionUserId(userId);
        setIsAuthReady(true);
        if (fetchSeqRef.current === 0) {
          const seq = ++fetchSeqRef.current;
          fetchHistory(userId, seq);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        if (isMountedRef.current) {
          setIsAuthReady(true);
          setIsLoading(false);
        }
      }
    };

    initSession();

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // Re-fetch when projectId or contextType changes
  useEffect(() => {
    if (isAuthReady && sessionUserId) {
      const seq = ++fetchSeqRef.current;
      fetchHistory(sessionUserId, seq);
    } else if (isAuthReady && !sessionUserId) {
      setMessages([]);
      setIsLoading(false);
    }
  }, [projectId, contextType, isAuthReady, sessionUserId, fetchHistory]);

  // Save a message pair
  const saveMessages = useCallback(async (
    userContent: string, 
    assistantContent: string
  ) => {
    if (!projectId || !userContent || !assistantContent) return;

    const userId = cachedUserIdRef.current;
    if (!userId) {
      console.warn('Cannot save chat: no authenticated user');
      return;
    }

    try {
      const now = new Date().toISOString();
      const messagesToSave = [
        {
          project_id: projectId,
          user_id: userId,
          role: 'user' as const,
          content: userContent,
          context_type: contextType,
          created_at: now
        },
        {
          project_id: projectId,
          user_id: userId,
          role: 'assistant' as const,
          content: assistantContent,
          context_type: contextType,
          created_at: new Date(Date.now() + 1).toISOString()
        }
      ];

      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert(messagesToSave);

      if (insertError) {
        console.error('Failed to save chat messages:', insertError.message);
      }
    } catch (err) {
      console.error('Error saving chat messages:', err);
    }
  }, [projectId, contextType]);

  // Clear all history — uses fetchSeqRef to invalidate stale fetches
  const clearHistory = useCallback(async (): Promise<boolean> => {
    if (!projectId) return false;

    const userId = cachedUserIdRef.current;
    if (!userId) {
      console.error('Cannot clear chat: no authenticated user');
      return false;
    }

    try {
      const { error: deleteError, count: deletedCount } = await supabase
        .from('chat_messages')
        .delete({ count: 'exact' })
        .eq('project_id', projectId)
        .eq('context_type', contextType)
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Error clearing chat history:', deleteError.message);
        return false;
      }

      console.log(`[useChatHistory] Deleted ${deletedCount} messages`);

      // Immediately clear local state AND invalidate any in-flight fetches
      // by bumping the sequence number so stale responses are ignored
      ++fetchSeqRef.current;
      setMessages([]);
      return true;
    } catch (err) {
      console.error('Error clearing chat history:', err);
      return false;
    }
  }, [projectId, contextType]);

  const oldestMessageDate = messages.length > 0 
    ? new Date(messages[0].created_at) 
    : null;

  return {
    messages,
    isLoading,
    isAuthReady,
    error,
    saveMessages,
    clearHistory,
    hasHistory: messages.length > 0,
    oldestMessageDate
  };
}
