import { Button } from '@/components/ui/button';
import type { FinancialModelScenario } from '@/hooks/useFinancialModelScenarios';

interface Props {
  isSystem: boolean;
  scenario: FinancialModelScenario | null;
  currentUserId: string | null | undefined;
  isDirty: boolean;
  onSave: () => void;
  onSaveAs: () => void;
  onDuplicate: () => void;
  onDiscard: () => void;
  onToggleShare: (next: boolean) => void;
  onDelete: () => void;
}

export function ScenarioActions(props: Props) {
  const { isSystem, scenario, currentUserId, isDirty } = props;
  const isOwn = !isSystem && scenario != null && scenario.owner_id === currentUserId;
  const isSharedByOther = !isSystem && scenario != null && scenario.owner_id !== currentUserId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* System scenario */}
      {isSystem && (
        <>
          <Button size="sm" variant="outline" onClick={props.onSaveAs}>
            Save as…
          </Button>
          {isDirty && (
            <Button size="sm" variant="ghost" onClick={props.onDiscard}>
              Discard
            </Button>
          )}
        </>
      )}

      {/* Own scenario */}
      {isOwn && (
        <>
          {isDirty && (
            <Button size="sm" onClick={props.onSave}>
              Save
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={props.onSaveAs}>
            Save as…
          </Button>
          {isDirty && (
            <Button size="sm" variant="ghost" onClick={props.onDiscard}>
              Discard
            </Button>
          )}
          {!isDirty && (
            <Button size="sm" variant="outline" onClick={props.onDuplicate}>
              Duplicate
            </Button>
          )}
          {!isDirty && (
            <label className="flex items-center gap-1.5 text-xs text-slate-300">
              <input
                type="checkbox"
                aria-label="Share read-only with RAV team"
                checked={scenario?.is_shared ?? false}
                onChange={(e) => props.onToggleShare(e.target.checked)}
              />
              Share
            </label>
          )}
          {!isDirty && (
            <Button size="sm" variant="ghost" onClick={props.onDelete}>
              Delete
            </Button>
          )}
        </>
      )}

      {/* Shared by someone else — read-only */}
      {isSharedByOther && (
        <Button size="sm" variant="outline" onClick={props.onDuplicate}>
          Duplicate to my scenarios
        </Button>
      )}
    </div>
  );
}
