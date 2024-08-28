export interface BattleLogAction {
  message: string;
}

export interface BattleLogTurn {
  // The player whose turn it is
  user: string;
  // Actions taken this turn
  actions: BattleLogAction[];
}

export interface BattleLog {
  turns: BattleLogTurn[];
  date: string;
  // The winner of the match
  winner: string;
}