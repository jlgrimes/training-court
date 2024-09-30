export const MATCH_END_REASONS = {
    ID: 'ID',
    NO_SHOW: 'No show',
    BYE: 'Bye',
  };
  
export type ImmediateMatchEndScenarios = typeof MATCH_END_REASONS[keyof typeof MATCH_END_REASONS];
  