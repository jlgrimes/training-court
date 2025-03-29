// Playable formats differ between tournaments and logs. 
// Since PTCGL doesn't support alternate formats like GLC, the array for log formats will always be smaller than for tournaments

export type LogFormats = 'SVI-JTG' | 'BRS-PRE' | 'BRS-SSP' | 'BRS-SCR';
export type LogFormatsTab = LogFormats | 'All';
export const logFormats: LogFormats[] = ['SVI-JTG', 'BRS-PRE', 'BRS-SSP', 'BRS-SCR']

export type TournamentFormats = 'SVI-JTG' | 'BRS-PRE' | 'BRS-SSP' | 'BRS-SCR' | 'PTCG Pocket' | 'GLC' ;
export type TournamentFormatsTab = TournamentFormats | 'All';
export const tournamentFormats: TournamentFormats[] = ['SVI-JTG', 'BRS-PRE', 'BRS-SSP', 'BRS-SCR', 'PTCG Pocket', 'GLC']
