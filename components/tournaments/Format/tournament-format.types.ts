export type FormatArray = 'BRS-SCR' | 'BRS-SSP' | 'PTCG Pocket' | 'GLC' ;
export type TournamentFormatTab = FormatArray | 'all';
export const formatArray: FormatArray[] = ['BRS-SCR', 'BRS-SSP', 'PTCG Pocket', 'GLC']

//@TODO: Needs format array for tournaments specifically. You can have a PTCG Pocket format tournament, but the logs are a different data structure.