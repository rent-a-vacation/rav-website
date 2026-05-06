import {
  DISCLAIMERS,
  STATE_DISCLAIMER_MAP,
  type DisclaimerId,
} from "@/lib/disclaimers/registry";
import { DisclaimerBlock, type DisclaimerVariant } from "./DisclaimerBlock";

interface StateSpecificDisclaimerProps {
  /** 2-letter US state code from `listing.state` (case-insensitive). */
  propertyState: string | null | undefined;
  variant?: DisclaimerVariant;
  className?: string;
}

/**
 * Renders the state-specific disclosure for the given property state, if one is registered.
 * Used on listing pages and checkout to satisfy geo-targeted requirements such as
 * Legal Dossier § 8.7 (Florida).
 *
 * Counsel-pending state disclosures (currently CA — see counsel question C10) are not yet
 * present in the registry; this component returns null for those states until the registry
 * entry is added — no other code change required.
 *
 * @see docs/legal/compliance-gap-analysis.md items P-2 + P-3
 */
export function StateSpecificDisclaimer({
  propertyState,
  variant = "compact",
  className,
}: StateSpecificDisclaimerProps) {
  const stateCode = propertyState?.toUpperCase();
  if (!stateCode) return null;

  const disclaimerId = STATE_DISCLAIMER_MAP[stateCode];
  if (!disclaimerId) return null;

  // Only render if the disclaimer is actually present in the registry.
  // CA (8.7-CA) is intentionally absent until counsel returns text — see registry comment.
  if (!(disclaimerId in DISCLAIMERS)) return null;

  return (
    <DisclaimerBlock
      id={disclaimerId as DisclaimerId}
      variant={variant}
      className={className}
      testId={`state-disclaimer-${stateCode}`}
    />
  );
}
