// Playable formats differ between tournaments and logs. 
// Since PTCGL doesn't support alternate formats like GLC, the array for log formats will always be smaller than for tournaments

export type LogFormats = 'BRS-SSP' | 'BRS-SCR';
export type LogFormatsTab = LogFormats | 'All';
export const logFormats: LogFormats[] = ['BRS-SSP', 'BRS-SCR']

export type TournamentFormats = 'BRS-SSP' | 'BRS-SCR' | 'PTCG Pocket' | 'GLC' ;
export type TournamentFormatsTab = TournamentFormats | 'All';
export const tournamentFormats: TournamentFormats[] = ['BRS-SSP', 'BRS-SCR', 'PTCG Pocket', 'GLC']
