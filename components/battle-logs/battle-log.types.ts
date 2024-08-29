export interface BattleLogAction {
  // The user who should be highlighted as the "owner" of the action.
  owner: string | undefined;
  // The action
  message: string;
}

export type RoundResult = 'W' | 'L' | 'T';

export interface BattleLogPlayer {
  name: string;
  deck: string | undefined;
  result: RoundResult;
}

export interface BattleLog {
  id: string;
  players: BattleLogPlayer[];
  // The actions that happen in the game
  actions: BattleLogAction[];
  // When the battle took place
  date: string;
  // The winner of the match
  winner: string;
}