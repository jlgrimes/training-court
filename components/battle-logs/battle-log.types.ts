export interface BattleLogAction {
  message: string;
}

export interface BattleLogTurn {
  // The player whose turn it is
  user: string;
  // Actions taken this turn
  actions: BattleLogAction[];
}

export type RoundResult = 'W' | 'L' | 'T';

export interface BattleLogPlayer {
  name: string;
  deck: string | undefined;
  result: RoundResult;
}

export interface BattleLog {
  players: BattleLogPlayer[];
  // The turns of the game
  // turns: BattleLogTurn[];
  // When the battle took place
  date: string;
  // The winner of the match
  // winner: string;
}