import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/posthog";

export function useFavoriteIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("favorites")
        .select("property_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return (data || []).map((f: { property_id: string }) => f.property_id);
    },
    enabled: !!user,
  });
}

export function useToggleFavorite() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (propertyId: string) => {
      if (!user) throw new Error("Must be logged in");

      // Check if already favorited
      const { data: existing } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("property_id", propertyId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", (existing as { id: string }).id);
        if (error) throw error;
        return { action: "removed" as const, propertyId };
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: user.id, property_id: propertyId } as never);
        if (error) throw error;
        return { action: "added" as const, propertyId };
      }
    },
    onMutate: async (propertyId: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["favorites", user?.id] });
      const previous = queryClient.getQueryData<string[]>(["favorites", user?.id]) || [];

      const updated = previous.includes(propertyId)
        ? previous.filter((id) => id !== propertyId)
        : [...previous, propertyId];

      queryClient.setQueryData(["favorites", user?.id], updated);
      return { previous };
    },
    onError: (_err, _propertyId, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(["favorites", user?.id], context.previous);
      }
    },
    onSuccess: (result) => {
      if (result.action === "added") {
        trackEvent("listing_favorited", { property_id: result.propertyId });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites", user?.id] });
    },
  });
}
