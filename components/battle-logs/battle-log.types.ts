export interface BattleLogAction {
  message: string;
}

export interface BattleLogTurn<P> {
  // The player whose turn it is
  user: P;
  // Actions taken this turn
  actions: BattleLogAction[];
}

export interface BattleLog<P1, P2> {
  date: string;
  // The winner of the match
  winner: P1 | P2;
}