import type { BattleLog } from '@/components/battle-logs/utils/battle-log.types';
import type { BattleLogReplay, ReplayBoardState, ReplayDecision, ReplayDiagnostic, ReplayOperation } from './battle-log-replay.types';
import { DEFAULT_REPLAY_RULES, REPLAY_PARSER_VERSION, replayFingerprint, type ReplayRules } from './replay-rules';

type Plan = Record<string, string>;
class Choice extends Error {
  constructor(readonly id: string, readonly candidates: string[]) { super('Replay choice'); Object.setPrototypeOf(this, Choice.prototype); }
}
class Conflict extends Error { constructor(code: string) { super(code); Object.setPrototypeOf(this, Conflict.prototype); } }
export interface ReplayBuildOptions { maxPasses?: number; maxWorlds?: number; rules?: ReplayRules }
export interface ReplayPass { replay: BattleLogReplay; decisions: ReplayDecision[]; diagnostics: ReplayDiagnostic[]; inferredFrames?: number[] }

export class ReplayRuntime {
  frameIndex = 0;
  operation: ReplayOperation = { id: 'empty', kind: 'observation', operands: [], source: { sectionIndex: 0, actionIndex: 0, detailIndex: null, raw: '' } };
  diagnostics: ReplayDiagnostic[] = [];
  decisions: ReplayDecision[] = [];
  inferredFrames = new Set<number>();
  private ordinal = 0;
  constructor(private plan: Plan, readonly rules: ReplayRules, readonly strict: boolean) {}
  enter(operation: ReplayOperation, frameIndex: number) { this.operation = operation; this.frameIndex = frameIndex; this.ordinal = 0; }
  pick<T extends { id: string }>(candidates: T[], reason: ReplayDecision['reason']): T | undefined {
    if (!candidates.length) { this.report('missing-target', 'error'); return undefined; }
    if (candidates.length === 1) return candidates[0];
    const id = `${this.operation.id}:${this.ordinal++}:${reason}`;
    const selected = this.plan[id];
    if (!selected && this.strict) throw new Choice(id, candidates.map((candidate) => candidate.id));
    const result = candidates.find((candidate) => candidate.id === selected) ?? candidates[0];
    this.decisions.push({ id, operationId: this.operation.id, reason, operationKind: this.operation.kind, source: this.operation.source,
      frameIndex: this.frameIndex, candidates: candidates.map((candidate) => candidate.id), selected: result.id });
    return result;
  }
  report(code: string, severity: 'warning' | 'error' = 'warning', entityIds?: string[]) {
    if (!this.diagnostics.some((item) => item.code === code && item.frameIndex === this.frameIndex && item.source === this.operation.source)) {
      this.diagnostics.push({ code, severity, frameIndex: this.frameIndex, source: this.operation.source, entityIds });
    }
  }
  require(condition: boolean, code: string, entityIds?: string[]) {
    if (condition) return true;
    this.report(code, 'error', entityIds);
    if (this.strict) throw new Conflict(code);
    return false;
  }
  inferred() { this.inferredFrames.add(this.frameIndex); }
  validate(board: ReplayBoardState) {
    const ids = new Set<string>();
    const add = (id: string) => { this.require(!ids.has(id), 'duplicate-card', [id]); ids.add(id); };
    if (board.stadium) add(board.stadium.id);
    Object.values(board.players).forEach((player) => {
      this.require(player.hand.unknownCount >= 0 && Number.isInteger(player.hand.unknownCount), 'invalid-hand-count');
      this.require(player.prizesRemaining >= 0, 'invalid-prize-count');
      [...player.hand.knownCards, ...player.discard, ...(player.lostZone ?? [])].forEach((card) => add(card.id));
      [...(player.active ? [player.active] : []), ...player.bench].forEach((pokemon) => {
        this.require(pokemon.damage >= 0 && Number.isFinite(pokemon.damage), 'invalid-damage', [pokemon.id]);
        (pokemon.stack ?? [{ id: pokemon.id }]).forEach((card) => add(card.id));
        pokemon.attachments.forEach((card) => add(card.id));
      });
    });
  }
}

export function resolveReplay(log: BattleLog, reconstruct: (runtime: ReplayRuntime) => ReplayPass, options: ReplayBuildOptions): BattleLogReplay {
  const rules = options.rules ?? DEFAULT_REPLAY_RULES;
  const limit = Number.isFinite(options.maxPasses) ? Math.max(1, Math.min(1024, Math.floor(options.maxPasses!))) : 128;
  const maxWorlds = Number.isFinite(options.maxWorlds) ? Math.max(1, Math.min(64, Math.floor(options.maxWorlds!))) : 16;
  const pending: Plan[] = [{}];
  const viable: ReplayPass[] = [];
  let explored = 0;
  while (pending.length && explored < limit && viable.length < maxWorlds) {
    const plan = pending.pop()!;
    const runtime = new ReplayRuntime(plan, rules, true);
    explored++;
    try { viable.push(reconstruct(runtime)); }
    catch (error) {
      if (error instanceof Choice) {
        const choice = error;
        choice.candidates.slice().reverse().forEach((id) => pending.push({ ...plan, [choice.id]: id }));
      }
      else if (!(error instanceof Conflict)) throw error;
    }
  }
  const complete = pending.length === 0;
  const noWitness = viable.length === 0;
  const inconsistent = noWitness && complete;
  if (noWitness) viable.push(reconstruct(new ReplayRuntime({}, rules, false)));
  const result = viable[0].replay;
  const globalDiagnostics: ReplayDiagnostic[] = [];
  if (!complete) globalDiagnostics.push({ code: 'search-limit', severity: 'warning', frameIndex: 0 });
  if (inconsistent) globalDiagnostics.push({ code: 'inconsistent-log', severity: 'error', frameIndex: 0 });
  if (log.language !== 'en') globalDiagnostics.push({ code: 'unsupported-language', severity: 'warning', frameIndex: 0 });

  result.frames.forEach((frame, index) => {
    const diagnostics = [...globalDiagnostics, ...viable[0].diagnostics.filter((item) => item.frameIndex <= index)];
    const choices = new Map<string, ReplayDecision>();
    viable.forEach((pass) => pass.decisions.filter((decision) => decision.frameIndex <= index).forEach((decision) => {
      const existing = choices.get(decision.id);
      if (existing) existing.candidates = Array.from(new Set([...existing.candidates, decision.selected]));
      else choices.set(decision.id, { ...decision, candidates: [decision.selected] });
    }));
    const signatures = new Set(viable.map((pass) => JSON.stringify(pass.replay.frames[index]?.board)));
    const ambiguous = signatures.size > 1 || (!complete && choices.size > 0);
    const entityIds = new Set<string>();
    if (ambiguous) viable.forEach((pass) => pass.decisions.filter((decision) => decision.frameIndex <= index).forEach((decision) =>
      decision.candidates.forEach((id) => entityIds.add(id))));
    const inferred = viable.some((pass) => pass.decisions.some((decision) => decision.frameIndex <= index)
      || pass.inferredFrames?.includes(index)
      || Object.values(pass.replay.frames[index].board.players).some((player) => player.hand.knownCards.some((card) => card.knowledge === 'inferred')));
    frame.assessment = {
      possibleBoardCount: noWitness ? 0 : signatures.size,
      certainty: diagnostics.some((item) => item.severity === 'error' || /unsupported|search-limit/.test(item.code)) ? 'unsupported'
        : ambiguous ? 'ambiguous' : inferred ? 'inferred' : 'observed',
      representative: ambiguous || inconsistent || !complete,
      ambiguousEntityIds: Array.from(entityIds).sort(), decisions: Array.from(choices.values()), diagnostics,
    };
  });
  result.diagnostics = [...globalDiagnostics, ...viable[0].diagnostics];
  result.hypotheses = noWitness ? [] : viable.map((pass) => ({ decisions: pass.decisions }));
  const inputFingerprint = replayFingerprint({ sections: log.sections, sourceText: log.sourceText, language: log.language, perspective: result.perspectivePlayer });
  const rulesFingerprint = replayFingerprint(rules);
  result.metadata = {
    parserVersion: REPLAY_PARSER_VERSION, rulesVersion: rules.version,
    inputFingerprint, rulesFingerprint, language: log.language,
    reconstructionFingerprint: replayFingerprint({ inputFingerprint, rulesFingerprint, parserVersion: REPLAY_PARSER_VERSION, limit, maxWorlds }),
    search: { explored, viable: noWitness ? 0 : viable.length, complete, limit, worldLimit: maxWorlds },
  };
  return result;
}
