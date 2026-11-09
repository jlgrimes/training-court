'use client';

import { T } from 'gt-react';
import { ChevronDown, StickyNote } from 'lucide-react';
import type { ReplayCertainty, ReplayDecision, ReplayFrame } from './battle-log-replay.types';

function AmbiguityReason({ decision }: { decision: ReplayDecision }) {
  if (decision.reason === 'attachment-source') return <T id="battleLogs.replay.evidence.reason.attachmentSource">The attachment source (hand, deck, or discard) cannot be determined from the log and supported rules.</T>;
  if (decision.reason === 'shuffle-origin') return <T id="battleLogs.replay.evidence.reason.shuffleOrigin">The log does not distinguish whether the shuffled card came from the hand or the board.</T>;
  if (decision.reason === 'ability-user') return <T id="battleLogs.replay.evidence.reason.ability">The log does not distinguish which Pokémon copy used the Ability.</T>;
  if (decision.reason === 'promotion') return <T id="battleLogs.replay.evidence.reason.promotion">The log does not distinguish which Pokémon copy moved to the Active Spot.</T>;
  if (decision.reason === 'remove' || decision.reason === 'shuffle-pokemon') return <T id="battleLogs.replay.evidence.reason.removal">The log does not distinguish which Pokémon copy left the board.</T>;
  if (decision.operationKind === 'attachedMatch' || decision.operationKind === 'discardedFromMatch') return <T id="battleLogs.replay.evidence.reason.attachment">The log does not distinguish which Pokémon copy gained or lost the attached card.</T>;
  if (decision.operationKind === 'evolvedMatch') return <T id="battleLogs.replay.evidence.reason.evolution">The log does not distinguish which Pokémon copy evolved.</T>;
  if (decision.reason === 'stadium-target' || decision.reason === 'spread-target' || ['placedCounters', 'movedCounters', 'damageCounterMatch', 'attackMatch', 'healedMatch'].includes(decision.operationKind)) return <T id="battleLogs.replay.evidence.reason.damage">The log does not distinguish which Pokémon copy gained or lost damage.</T>;
  return <T id="battleLogs.replay.evidence.reason.pokemon">The log does not distinguish which Pokémon copy was involved in this action.</T>;
}

export function ReplayAmbiguityNotice({ frame }: { frame: ReplayFrame }) {
  const assessment = frame.assessment;
  if (!assessment || assessment.possibleBoardCount < 2) return null;
  // Multiple selections in one operation (for example, a damage transfer) share
  // one explanation and source line.
  const decisions = Array.from(new Map(assessment.decisions
    .filter((decision) => decision.candidates.length > 1)
    .map((decision) => [decision.operationId + ':' + decision.reason, decision])).values());
  return (
    <div role="status">
      <details>
        <summary>
          <StickyNote size={14} aria-hidden="true" />
          <T id="battleLogs.replay.evidence.possibleBoard">Multiple possible boards</T>
          <ChevronDown size={12} aria-hidden="true" />
        </summary>
        <ul>
          {decisions.map((decision) => <li key={decision.id}>
            <AmbiguityReason decision={decision} />{' '}
            <span><T id="battleLogs.replay.frame">Frame</T> {decision.frameIndex + 1}: {decision.source.raw}</span>
          </li>)}
        </ul>
      </details>
    </div>
  );
}

export function ReplayCertaintyLabel({ certainty }: { certainty: ReplayCertainty }) {
  switch (certainty) {
    case 'observed': return <T id="battleLogs.replay.evidence.observed">Observed</T>;
    case 'inferred': return <T id="battleLogs.replay.evidence.inferred">Inferred from the log</T>;
    case 'ambiguous': return <T id="battleLogs.replay.evidence.ambiguous">Ambiguous</T>;
    default: return <T id="battleLogs.replay.evidence.unsupported">Partial reconstruction</T>;
  }
}

function DiagnosticLabel({ code }: { code: string }) {
  if (code === 'search-limit') return <T id="battleLogs.replay.evidence.searchLimit">Not all possible reconstructions were examined.</T>;
  if (code === 'inconsistent-log') return <T id="battleLogs.replay.evidence.conflict">No reconstruction satisfies all supported checks.</T>;
  if (code === 'unsupported-language') return <T id="battleLogs.replay.evidence.language">Replay reconstruction is not available for this log language.</T>;
  if (code === 'unsupported-event') return <T id="battleLogs.replay.evidence.unparsed">This line could not be reconstructed.</T>;
  if (code === 'unobserved-card-source') return <T id="battleLogs.replay.evidence.unknownSource">The card is shown in the log, but its previous location was not recorded.</T>;
  if (code.startsWith('unsupported')) return <T id="battleLogs.replay.evidence.ruleCoverage">This effect is outside the supported rule coverage.</T>;
  return <T id="battleLogs.replay.evidence.movementConflict">The logged action conflicts with the tracked board or refers to an untracked card.</T>;
}

export function ReplayEvidence({ frame }: { frame: ReplayFrame }) {
  const assessment = frame.assessment;
  if (!assessment) return null;
  return (
    <section className="mt-4 border-t pt-3 text-xs">
      <h3 className="font-semibold"><T id="battleLogs.replay.evidence.title">Reconstruction evidence</T></h3>
      <p className="mt-1"><ReplayCertaintyLabel certainty={assessment.certainty} /></p>
      {assessment.possibleBoardCount > 1 && <p className="mt-1 text-amber-600"><T id="battleLogs.replay.evidence.representative">Multiple boards are possible. Individual copy placements may differ.</T></p>}
      {assessment.decisions.some((decision) => decision.candidates.length > 1) && <p className="mt-1"><T id="battleLogs.replay.evidence.alternatives">Multiple card assignments remain compatible with the log.</T></p>}
      {assessment.diagnostics.length > 0 && (
        <ul className="mt-2 grid gap-2">
          {assessment.diagnostics.map((diagnostic, index) => (
            <li key={`${diagnostic.code}-${index}`}>
              <DiagnosticLabel code={diagnostic.code} />
              {diagnostic.source && <blockquote className="mt-1 border-l pl-2 text-muted-foreground">
                {diagnostic.source.lineNumber && <span><T id="battleLogs.replay.evidence.line">Line</T> {diagnostic.source.lineNumber}: </span>}
                {diagnostic.source.raw}
              </blockquote>}
            </li>
          ))}
        </ul>
      )}
      <details className="mt-3">
        <summary className="cursor-pointer"><T id="battleLogs.replay.evidence.original">Original action lines</T></summary>
        {frame.operations?.map((operation) => <p key={operation.id} className="mt-1 whitespace-pre-wrap text-muted-foreground">
          {operation.source.lineNumber && <span><T id="battleLogs.replay.evidence.line">Line</T> {operation.source.lineNumber}: </span>}
          {operation.source.raw}
        </p>)}
      </details>
    </section>
  );
}
