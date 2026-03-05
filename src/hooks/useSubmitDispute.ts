import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import type { Database } from "@/types/database";

type DisputeCategory = Database["public"]["Enums"]["dispute_category"];

export interface SubmitDisputeParams {
  bookingId: string;
  category: DisputeCategory;
  description: string;
  reportedUserId?: string;
  evidenceUrls?: string[];
}

export function useSubmitDispute() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: SubmitDisputeParams) => {
      if (!user) throw new Error("You must be logged in to submit a dispute");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).from("disputes")
        .insert({
          booking_id: params.bookingId,
          reporter_id: user.id,
          reported_user_id: params.reportedUserId || null,
          category: params.category,
          description: params.description,
          evidence_urls: params.evidenceUrls?.length ? params.evidenceUrls : null,
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
