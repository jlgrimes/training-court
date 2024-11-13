// Playable formats differ between tournaments and logs. 
// Since PTCGL doesn't support alternate formats like GLC, the array for log formats will always be smaller than for tournaments

export type FormatArrayLogs = 'BRS-SSP' | 'BRS-SCR';
export type LogsFormatTab = FormatArrayLogs | 'All';
export const formatArrayLogs: FormatArrayLogs[] = ['BRS-SSP', 'BRS-SCR']

export type FormatArrayTournaments = 'BRS-SSP' | 'BRS-SCR' | 'PTCG Pocket' | 'GLC' ;
export type TournamentFormatTab = FormatArrayTournaments | 'All';
export const formatArrayTournaments: FormatArrayTournaments[] = ['BRS-SSP', 'BRS-SCR', 'PTCG Pocket', 'GLC']
