import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { calculateNights } from "@/lib/pricing";

const DRAFT_STORAGE_KEY = "rav-list-property-draft";

export interface ListPropertyDraft {
  formStep: number;
  selectedBrand: string;
  isManualEntry: boolean;
  resortName: string;
  location: string;
  bedrooms: string;
  bathrooms: string;
  sleeps: string;
  description: string;
  checkInDate: string;
  checkOutDate: string;
  nightlyRate: string;
  cleaningFee: string;
  cancellationPolicy: string;
}

export function loadDraft(): ListPropertyDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDraft() {
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

/**
 * Hook to publish a localStorage draft as a real property + listing in one step.
 */
export function usePublishDraft() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publishDraft = useCallback(async (userId: string, draft: ListPropertyDraft) => {
    setIsPending(true);
    setError(null);

    try {
      // 1. Create property
      const propertyData = {
        owner_id: userId,
        brand: draft.selectedBrand || "other",
        resort_name: draft.resortName,
        location: draft.location,
        description: draft.description,
        bedrooms: parseInt(draft.bedrooms) || 1,
        bathrooms: parseInt(draft.bathrooms) || 1,
        sleeps: parseInt(draft.sleeps) || 2,
        amenities: [] as string[],
      };

      const { data: newProperty, error: propError } = await supabase
        .from("properties")
        .insert(propertyData as never)
        .select("id")
        .single();

      if (propError || !newProperty) {
        throw new Error(propError?.message || "Failed to create property");
      }

      // 2. Create listing
      const rate = parseFloat(draft.nightlyRate);
      const cleaning = parseFloat(draft.cleaningFee) || 0;
      const nights = calculateNights(draft.checkInDate, draft.checkOutDate);
      const ownerPrice = Math.round(rate * nights);
      const ravMarkup = Math.round(ownerPrice * 0.15);
      const finalPrice = ownerPrice + ravMarkup;

      const listingData = {
        property_id: (newProperty as { id: string }).id,
        owner_id: userId,
        check_in_date: draft.checkInDate,
        check_out_date: draft.checkOutDate,
        nightly_rate: rate,
        cleaning_fee: cleaning,
        resort_fee: 0,
        owner_price: ownerPrice,
        rav_markup: ravMarkup,
        final_price: finalPrice,
        cancellation_policy: draft.cancellationPolicy || "flexible",
        status: "pending_approval",
      };

      const { error: listError } = await supabase
        .from("listings")
        .insert(listingData as never);

      if (listError) throw new Error(listError.message);

      // 3. Clear draft
      clearDraft();

      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsPending(false);
    }
  }, []);

  return { publishDraft, isPending, error };
}
