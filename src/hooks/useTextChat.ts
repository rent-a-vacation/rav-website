import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import type { ChatMessage, ChatStatus, ChatContext } from "@/types/chat";
import type { VoiceSearchResult } from "@/types/voice";
import { supabase } from "@/lib/supabase";
import { trackEvent } from "@/lib/posthog";
import { detectChatContext } from "@/lib/chatContext";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

let messageCounter = 0;
function generateId(): string {
  return `msg_${Date.now()}_${++messageCounter}`;
}

interface UseTextChatOptions {
  /**
   * Explicit context override. Semantically-owned pages (PropertyDetail,
   * Rentals, BiddingMarketplace) should pass their context directly.
   * Omit to auto-detect from the current route via `detectChatContext`.
   */
  context?: ChatContext;
}

export function useTextChat({ context: explicitContext }: UseTextChatOptions = {}) {
  const location = useLocation();
  const context = useMemo<ChatContext>(
    () => explicitContext ?? detectChatContext(location.pathname),
    [explicitContext, location.pathname],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Intent classifier (Phase 22 C3 / #407) — server may swap the context
  // on ambiguous first messages (context='general'). Stored separately from
  // the route/explicit context so the chip can show the delta.
  const [classifiedContext, setClassifiedContext] = useState<ChatContext | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const contextRef = useRef(context);
  // Session-scoped override — true once the user has dismissed the classifier
  // chip. While active, subsequent sends tell the server to skip the classifier
  // even if history is cleared (so a cleared-and-re-asked ambiguous message
  // doesn't re-trigger the chip the user already rejected).
  const classifierDismissedRef = useRef(false);
  // Support conversation id assigned by the server on the first support turn
  // (Phase 22 D1 / #410). Passed back on subsequent turns so they bind to the
  // same conversation row. Reset on route-change and clearHistory.
  const conversationIdRef = useRef<string | null>(null);
  // Mirrored as state so consumers (#411 rating widget) can subscribe.
  const [conversationId, setConversationIdState] = useState<string | null>(null);

  // Clear conversation when context changes
  useEffect(() => {
    if (contextRef.current !== context) {
      contextRef.current = context;
      setMessages([]);
      setStatus("idle");
      setError(null);
      setClassifiedContext(null);
      classifierDismissedRef.current = false;
      conversationIdRef.current = null;
      setConversationIdState(null);
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
            disableClassifier: classifierDismissedRef.current,
            conversationId: conversationIdRef.current ?? undefined,
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

          if (currentEvent === "conversation_id") {
            try {
              const payload = JSON.parse(data) as { conversation_id?: string };
              if (payload.conversation_id) {
                conversationIdRef.current = payload.conversation_id;
                setConversationIdState(payload.conversation_id);
              }
            } catch {
              // Skip malformed payload
            }
            currentEvent = "";
            continue;
          }

          if (currentEvent === "classified_context") {
            try {
              const payload = JSON.parse(data) as { classified?: ChatContext };
              if (payload.classified) {
                setClassifiedContext(payload.classified);
                trackEvent("text_chat_classified", {
                  route_context: contextRef.current,
                  classified: payload.classified,
                });
              }
            } catch {
              // Skip malformed classifier payload
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
    // Best-effort: tell the server to close the current support conversation
    // so metrics get a clean ended_at stamp. Fire-and-forget.
    const conversationId = conversationIdRef.current;
    if (conversationId) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session?.access_token) return;
        void fetch(`${SUPABASE_URL}/functions/v1/text-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            message: "",
            conversationHistory: [],
            context: contextRef.current,
            conversationId,
            closeConversation: true,
          }),
        }).catch(() => {
          // Best-effort; no UI impact.
        });
      });
    }
    setMessages([]);
    setStatus("idle");
    setError(null);
    setClassifiedContext(null);
    conversationIdRef.current = null;
    setConversationIdState(null);
    // Clearing history does NOT reset the dismissal — if the user already
    // said "no I don't want support," we respect that across history clears
    // within the same session. A route change (contextRef effect above)
    // fully resets both.
  }, []);

  const dismissClassification = useCallback(() => {
    setClassifiedContext(null);
    classifierDismissedRef.current = true;
    trackEvent("text_chat_classification_reverted", {
      route_context: contextRef.current,
    });
  }, []);

  return {
    messages,
    status,
    error,
    sendMessage,
    clearHistory,
    context,
    classifiedContext,
    dismissClassification,
    conversationId,
  };
}
