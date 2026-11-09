'use client';

import { T } from 'gt-react';
import type { ReplayCertainty, ReplayFrame } from './battle-log-replay.types';

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
      {assessment.representative && <p className="mt-1 text-amber-600"><T id="battleLogs.replay.evidence.representative">One possible board is shown. Individual copy placements may differ.</T></p>}
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
