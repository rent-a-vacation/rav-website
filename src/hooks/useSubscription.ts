import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import { useToast } from "./use-toast";

/**
 * Create a new subscription via Stripe Checkout.
 * Redirects the user to Stripe's hosted checkout page.
 */
export function useCreateSubscription() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (tierKey: string) => {
      const { data, error } = await supabase.functions.invoke(
        "create-subscription-checkout",
        { body: { tierKey } }
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Update an existing subscription (upgrade/downgrade/cancel to free).
 * Upgrades are immediate with proration; downgrades take effect at next billing cycle.
 */
export function useUpdateSubscription() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (newTierKey: string) => {
      const { data, error } = await supabase.functions.invoke(
        "update-subscription",
        { body: { newTierKey } }
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { success: boolean; effective: string; message?: string };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["my-membership", user?.id] });
      toast({
        title: "Plan Updated",
        description:
          data.effective === "immediate"
            ? "Your plan has been upgraded. New benefits are active now."
            : "Your plan change will take effect at the end of your current billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

/**
 * Open Stripe Customer Portal for billing management.
 * Redirects the user to Stripe's hosted portal (invoices, card updates, cancellation).
 */
export function useManageBilling() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "manage-subscription",
        { body: {} }
      );
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      return data as { url: string };
    },
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: (error: Error) => {
      toast({
        title: "Billing Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
