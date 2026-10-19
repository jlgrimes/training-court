export type TournamentRecord = { wins: number; losses: number; ties: number };

export function formatTournamentRecord(record: TournamentRecord) {
  return record.ties === 0
    ? `${record.wins}-${record.losses}`
    : `${record.wins}-${record.losses}-${record.ties}`;
}
