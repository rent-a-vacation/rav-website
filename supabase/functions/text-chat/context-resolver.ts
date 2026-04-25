// Pure-logic resolver for the "effective" RAVIO chat context (issue #371).
//
// The route-detected context is the starting point ("rentals", "support",
// "general", etc.). On the *first* message of a "general" context (and only
// when the frontend hasn't already opted out via `disableClassifier`), we run
// the intent classifier — if it returns a strong signal, the effective
// context is swapped to the classifier's choice.
//
// This module has zero deps so it can be Vitest-tested. The classifier is
// passed in as a function so we can stub it.

import type { ClassifiedContext } from "./intent-classifier.ts";

export type RouteContext = "rentals" | "property-detail" | "bidding" | "general" | "support";

export interface ResolveEffectiveContextArgs {
  /** Context the frontend reported based on the user's current page. */
  routeContext: string;
  /** True when the user's current message is the first turn of the conversation. */
  isFirstMessage: boolean;
  /** True when the frontend signalled the user dismissed a previous classification. */
  disableClassifier: boolean;
  /** The user's message text (only used when classifier runs). */
  message: string;
  /**
   * Function that classifies the message. Defaults to the production
   * `classifyIntent` import — tests pass in a stub. Must return a
   * ClassifiedContext or null.
   */
  classify: (message: string) => Promise<ClassifiedContext | null>;
}

export interface ResolvedContext {
  /** The context to use for system prompt + tool selection. */
  effectiveContext: string;
  /** The classifier's verdict (or null when classifier didn't run). */
  classifiedContext: ClassifiedContext | null;
  /** True when classifier ran AND returned a value AND it differs from routeContext. */
  classifierSwapped: boolean;
}

export async function resolveEffectiveContext(
  args: ResolveEffectiveContextArgs,
): Promise<ResolvedContext> {
  const { routeContext, isFirstMessage, disableClassifier, message, classify } = args;

  // Classifier only runs on the *first* message of a "general" context, and
  // only when the user hasn't dismissed a prior classification.
  const shouldClassify = routeContext === "general" && isFirstMessage && !disableClassifier;
  if (!shouldClassify) {
    return {
      effectiveContext: routeContext,
      classifiedContext: null,
      classifierSwapped: false,
    };
  }

  const classified = await classify(message);
  if (!classified) {
    return {
      effectiveContext: routeContext,
      classifiedContext: null,
      classifierSwapped: false,
    };
  }

  return {
    effectiveContext: classified,
    classifiedContext: classified,
    classifierSwapped: classified !== routeContext,
  };
}
