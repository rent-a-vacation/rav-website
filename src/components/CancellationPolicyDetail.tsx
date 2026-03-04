import { CancellationPolicy, CANCELLATION_POLICY_LABELS } from "@/types/database";
import {
  getCancellationPolicyRules,
  getCancellationDeadlines,
  getPolicyColor,
} from "@/lib/cancellationPolicy";

interface CancellationPolicyDetailProps {
  policy: CancellationPolicy;
  checkInDate?: string | Date;
  compact?: boolean;
}

const DOT_COLORS = {
  green: "bg-emerald-500",
  yellow: "bg-amber-500",
  red: "bg-red-500",
} as const;

export function CancellationPolicyDetail({
  policy,
  checkInDate,
  compact,
}: CancellationPolicyDetailProps) {
  const rules = checkInDate
    ? getCancellationDeadlines(policy, checkInDate)
    : getCancellationPolicyRules(policy);

  const policyLabel = CANCELLATION_POLICY_LABELS[policy] || policy;
  const colorClass = getPolicyColor(policy);

  if (compact) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <h4 className="text-sm font-medium">Cancellation Policy</h4>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}>
            {policyLabel}
          </span>
        </div>
        <ul className="space-y-1">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${DOT_COLORS[rule.color]}`} />
              {rule.label}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-6 shadow-card">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="font-display text-xl font-semibold text-foreground">
          Cancellation Policy
        </h2>
        <span className={`text-sm font-medium px-2.5 py-0.5 rounded-full ${colorClass}`}>
          {policyLabel}
        </span>
      </div>
      <ul className="space-y-2">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${DOT_COLORS[rule.color]}`} />
            <span className="text-sm text-muted-foreground">{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
