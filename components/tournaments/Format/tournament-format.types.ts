// Playable formats differ between tournaments and logs. 
// Since PTCGL doesn't support alternate formats like GLC (yet), the array for log formats will always be smaller than for tournaments

export type LogFormats = 'TEF-POR' | 'SVI-ASC' | 'SVI-PFL' | 'SVI-MEG' | 'SVI-WHT/BLK' | 'SVI-DRI' | 'SVI-JTG' | 'BRS-PRE' | 'BRS-SSP' | 'BRS-SCR' | 'Expanded';
export type LogFormatsTab = LogFormats | 'All';
export const logFormats: LogFormats[] = ['TEF-POR', 'SVI-ASC', 'SVI-PFL', 'SVI-MEG', 'SVI-WHT/BLK', 'SVI-DRI', 'SVI-JTG', 'BRS-PRE', 'BRS-SSP', 'BRS-SCR', 'Expanded']

export type TournamentFormats = 'TEF-POR' | 'SVI-ASC' | 'SVI-PFL' | 'SVI-MEG' | 'SVI-WHT/BLK' | 'SVI-DRI' | 'SVI-JTG' | 'BRS-PRE' | 'BRS-SSP' | 'BRS-SCR' | 'PTCG Pocket' | 'GLC' | 'Expanded' ;
export type TournamentFormatsTab = TournamentFormats | 'All';
export const tournamentFormats: TournamentFormats[] = ['TEF-POR', 'SVI-ASC', 'SVI-PFL', 'SVI-MEG', 'SVI-WHT/BLK', 'SVI-DRI', 'SVI-JTG', 'BRS-PRE', 'BRS-SSP', 'BRS-SCR', 'PTCG Pocket', 'GLC', 'Expanded']
