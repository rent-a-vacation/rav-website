-- Migration 069: Per-category dispute role enforcement in RLS
-- #463 (PaySafe Gap E) — Currently the dispute UPDATE policy admits any
-- rav_admin OR rav_staff. The category × role mapping documented in
-- PAYSAFE-FLOW-SPEC §5.3 is enforced only in the AdminDisputes UI. Bring
-- the schema to parity so a misconfigured client (or a direct DB call) cannot
-- bypass the policy.
--
-- Authority matrix (PAYSAFE-FLOW-SPEC §5.3):
--   - rav_admin: full authority on all categories
--   - rav_staff: operational categories only:
--       cleanliness, late_checkout, rule_violation, unauthorized_guests,
--       owner_no_show, renter_no_show
--     Must escalate everything else (safety_concerns, payment_dispute,
--     cancellation_dispute, renter_damage, property_not_as_described,
--     access_issues, other) to rav_admin.
--   - rav_owner: schema-allowed in spec but not used in practice; this
--     migration explicitly closes the door so it cannot accidentally update.

-- ── Helper function: can_resolve_dispute(category, user_id) ─────────────────
CREATE OR REPLACE FUNCTION public.can_resolve_dispute(
  p_category public.dispute_category,
  p_user_id uuid
) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p_user_id
      AND (
        ur.role = 'rav_admin'
        OR (
          ur.role = 'rav_staff'
          AND p_category IN (
            'cleanliness',
            'late_checkout',
            'rule_violation',
            'unauthorized_guests',
            'owner_no_show',
            'renter_no_show'
          )
        )
      )
  );
$$;

COMMENT ON FUNCTION public.can_resolve_dispute IS
  'Returns true when the given user can resolve a dispute of the given category. rav_admin → all; rav_staff → operational only; everyone else → false. Schema-level enforcement of PAYSAFE-FLOW-SPEC §5.3 (PaySafe Gap E, #463).';

-- ── Replace the catch-all UPDATE policy with the category-aware policy ──────
DROP POLICY IF EXISTS "RAV team can update disputes" ON public.disputes;

CREATE POLICY "RAV team can update disputes by category"
  ON public.disputes FOR UPDATE
  TO authenticated
  USING (public.can_resolve_dispute(category, auth.uid()))
  WITH CHECK (public.can_resolve_dispute(category, auth.uid()));

COMMENT ON POLICY "RAV team can update disputes by category" ON public.disputes IS
  'Per-category resolution authority. rav_admin can update any dispute; rav_staff can only update operational categories. Replaces the catch-all RAV-team UPDATE policy (PaySafe Gap E, #463 / Session 63).';
