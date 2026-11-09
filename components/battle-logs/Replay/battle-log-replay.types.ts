export type ReplayEventKind =
  | 'setup'
  | 'draw'
  | 'play'
  | 'attach'
  | 'evolve'
  | 'switch'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'discard'
  | 'prize'
  | 'text';

export interface ReplayCard {
  id: string;
  name: string;
  identifier?: string;
  known: boolean;
  owner?: string;
  knowledge?: 'observed' | 'inferred';
}

export interface ReplayPokemon {
  id: string;
  name: string;
  identifier?: string;
  damage: number;
  attachments: ReplayCard[];
  status: string[];
  /** Actual cards, bottom to top. The stable Pokemon id survives evolution. */
  stack?: ReplayCard[];
}

export interface ReplayPlayerState {
  name: string;
  active: ReplayPokemon | null;
  bench: ReplayPokemon[];
  hand: {
    knownCards: ReplayCard[];
    unknownCount: number;
  };
  discard: ReplayCard[];
  prizesRemaining: number;
  lostZone?: ReplayCard[];
  returnedToDeck?: ReplayCard[];
}

export interface ReplayBoardState {
  players: Record<string, ReplayPlayerState>;
  playerOrder: string[];
  stadium: ReplayCard | null;
}

export interface ReplayEvent {
  id: string;
  kind: ReplayEventKind;
  title: string;
  details: string[];
  player?: string;
  cards?: ReplayCard[];
  damage?: number;
  targetName?: string;
  mulliganBonus?: {
    player: string;
    opponent: string;
    cards: number;
    playerMulligans: number;
    opponentMulligans: number;
  };
}

export interface ReplayFrame {
  id: string;
  index: number;
  sectionIndex: number;
  actionIndex: number | null;
  turnTitle: string;
  currentPlayer: string;
  board: ReplayBoardState;
  event: ReplayEvent;
  operations?: ReplayOperation[];
  observedHands?: Record<string, ReplayPlayerState['hand']>;
  assessment?: ReplayAssessment;
}

export type ReplayCertainty = 'observed' | 'inferred' | 'ambiguous' | 'unsupported';
export interface ReplaySource {
  sectionIndex: number;
  actionIndex: number;
  detailIndex: number | null;
  /** One-based original line, omitted when the original text is unavailable. */
  lineNumber?: number;
  raw: string;
}
export type ReplayOperationKind =
  'discardSummary' |
  'retreatedMatch' |
  'statusMatch' |
  'statusClearedMatch' |
  'returnedPokemonMatch' |
  'lostZoneMatch' |
  'mulliganMatch' |
  'shuffledMatch' |
  'openingHandMatch' |
  'addedKnownCardMatch' |
  'genericAddedMatch' |
  'drewToBenchMatch' |
  'drewNamedMatch' |
  'drewCountMatch' |
  'drewSingleUnknownMatch' |
  'playedPokemonMatch' |
  'activeSpotMatch' |
  'attachedMatch' |
  'evolvedMatch' |
  'stadiumMatch' |
  'discardedStadiumMatch' |
  'playedCardMatch' |
  'discardedListMatch' |
  'discardedFromMatch' |
  'discardedNamedMatch' |
  'movedToDiscardMatch' |
  'movedToHandMatch' |
  'attackMatch' |
  'abilityMatch' |
  'movedCounters' |
  'placedCounters' |
  'damageCounterMatch' |
  'healedMatch' |
  'knockedOutMatch' |
  'prizesMatch' |
  'cardList' |
  'observation' |
  'unsupported';
export interface ReplayOperation {
  id: string;
  kind: ReplayOperationKind;
  parameters?: Record<string, string | undefined>;
  /** Ordered operands captured by the versioned grammar. */
  operands: string[];
  source: ReplaySource;
}
export interface ReplayDiagnostic {
  code: string;
  severity: 'warning' | 'error';
  frameIndex: number;
  source?: ReplaySource;
  entityIds?: string[];
}
export interface ReplayDecision {
  id: string;
  frameIndex: number;
  operationId: string;
  candidates: string[];
  selected: string;
}
export interface ReplayAssessment {
  certainty: ReplayCertainty;
  /** This board is one possible reconstruction, never a claim of exact copy placement. */
  representative: boolean;
  ambiguousEntityIds: string[];
  decisions: ReplayDecision[];
  diagnostics: ReplayDiagnostic[];
}

export interface BattleLogReplay {
  players: string[];
  perspectivePlayer: string;
  frames: ReplayFrame[];
  metadata?: {
    parserVersion: string;
    rulesVersion: string;
    inputFingerprint: string;
    rulesFingerprint: string;
    reconstructionFingerprint: string;
    language: string;
    search: { explored: number; viable: number; complete: boolean; limit: number; worldLimit: number };
  };
  diagnostics?: ReplayDiagnostic[];
  /** Complete choice vectors preserve correlations between surviving assignments. */
  hypotheses?: Array<{ decisions: ReplayDecision[] }>;
}
