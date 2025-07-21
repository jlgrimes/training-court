// Playable formats differ between tournaments and logs. 
// Since PTCGL doesn't support alternate formats like GLC (yet), the array for log formats will always be smaller than for tournaments

export type LogFormats = 'SVI-DRI' | 'SVI-JTG' | 'BRS-PRE' | 'BRS-SSP' | 'BRS-SCR';
export type LogFormatsTab = LogFormats | 'All';
export const logFormats: LogFormats[] = ['SVI-DRI', 'SVI-JTG', 'BRS-PRE', 'BRS-SSP', 'BRS-SCR']

export type TournamentFormats = 'SVI-WHT/BLK' | 'SVI-DRI' | 'SVI-JTG' | 'BRS-PRE' | 'BRS-SSP' | 'BRS-SCR' | 'PTCG Pocket' | 'GLC' ;
export type TournamentFormatsTab = TournamentFormats | 'All';
export const tournamentFormats: TournamentFormats[] = ['SVI-WHT/BLK', 'SVI-DRI', 'SVI-JTG', 'BRS-PRE', 'BRS-SSP', 'BRS-SCR', 'PTCG Pocket', 'GLC']
