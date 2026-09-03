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
  known: boolean;
}

export interface ReplayPokemon {
  id: string;
  name: string;
  damage: number;
  attachments: ReplayCard[];
  status: string[];
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
}

export interface BattleLogReplay {
  players: string[];
  perspectivePlayer: string;
  frames: ReplayFrame[];
}
