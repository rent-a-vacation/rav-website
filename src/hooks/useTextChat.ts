import { useState, useCallback, useRef, useEffect } from "react";
import type { ChatMessage, ChatStatus, ChatContext } from "@/types/chat";
import type { VoiceSearchResult } from "@/types/voice";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/posthog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

let messageCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++messageCounter}`;
}

interface UseTextChatOptions {
  context: ChatContext;
}

export function useTextChat({ context }: UseTextChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const contextRef = useRef(context);

  // Clear conversation when context changes
  useEffect(() => {
    if (contextRef.current !== context) {
      contextRef.current = context;
      setMessages([]);
      setStatus("idle");
      setError(null);
      abortControllerRef.current?.abort();
    }
  }, [context]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMessage: ChatMessage = {
      id: generateId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setStatus("sending");
    setError(null);

    // Abort any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Please sign in to use chat");
        setStatus("error");
        return;
      }

      // Build conversation history (exclude the message we just added — it goes in `message`)
      const conversationHistory = messages.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      }));

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/text-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: trimmed,
            conversationHistory,
            context: contextRef.current,
          }),
          signal: abortControllerRef.current.signal,
        },
      );

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Request failed (${response.status})`);
      }

      // Process SSE stream
      setStatus("streaming");

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response stream");
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let searchResults: VoiceSearchResult[] | undefined;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        let currentEvent = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim();
            continue;
          }
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (currentEvent === "search_results") {
            try {
              searchResults = JSON.parse(data) as VoiceSearchResult[];
              // Update the assistant message with search results
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, searchResults }
                    : msg,
                ),
              );
            } catch {
              // Skip malformed search results
            }
            currentEvent = "";
            continue;
          }

          if (currentEvent === "done" || data === "[DONE]") {
            currentEvent = "";
            continue;
          }

          if (currentEvent === "error") {
            throw new Error(data);
          }

          if (currentEvent === "token") {
            try {
              const token = JSON.parse(data) as string;
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessage.id
                    ? { ...msg, content: msg.content + token }
                    : msg,
                ),
              );
            } catch {
              // Skip malformed tokens
            }
            currentEvent = "";
          }
        }
      }

      trackEvent("text_chat_sent", {
        context: contextRef.current,
        message_length: trimmed.length,
        has_search_results: !!searchResults,
      });
      setStatus("idle");
    } catch (err) {
      // Don't treat abort as an error
      if (err instanceof DOMException && err.name === "AbortError") {
        setStatus("idle");
        return;
      }
      console.error("[Text Chat] Error:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
      setStatus("error");
    }
  }, [messages]);

  const clearHistory = useCallback(() => {
    abortControllerRef.current?.abort();
    setMessages([]);
    setStatus("idle");
    setError(null);
  }, []);

  return {
    messages,
    status,
    error,
    sendMessage,
    clearHistory,
  };
}
