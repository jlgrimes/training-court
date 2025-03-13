import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { Database } from "@/database.types";
import { format, parseISO } from "date-fns";
import { DateRange } from "react-day-picker";

export const getRecordObj = (rounds: { result: string[] }[]) => {
  const record = {
    wins: 0,
    ties: 0,
    losses: 0
  };

  for (const round of rounds) {
    const roundResult = convertGameResultsToRoundResult(round.result);

    if (roundResult === 'W') record.wins++;
    if (roundResult === 'L') record.losses++;
    if (roundResult === 'T') record.ties++;
  }

  return record;
}

export const getRecord = (rounds: { result: string[] }[]) => {
  const record = getRecordObj(rounds);

  if (record.ties === 0) {
    return `${record.wins}-${record.losses}`;
  }

  return `${record.wins}-${record.losses}-${record.ties}`;
}

export const getRecordFromLogs = (logs: BattleLog[]) => getRecord(logs.map((log) => ({ result: [log.players[0].result] })));

export const convertGameResultsToRoundResult = (result: string[]) => {
  if (result.length === 1) return result[0];
  if ((result.length === 2) && (result[0] === result[1])) return result[0];
  if (result.length === 3) return result[2];

  return 'T';
}

export const displayTournamentDate = (from: string, to: string) => {
  return displayTournamentDateRange({
    from: parseISO(from),
    to: parseISO(to)
  })
}

export const displayTournamentDateRange = (range: DateRange) => {
  const fromDate = range.from
  const toDate = range.to;

  if (!fromDate || !toDate) return '';

  if (format(fromDate, "LLLL d") === format(toDate, "LLLL d")) {
    return format(fromDate, "LLLL d, yyyy")
  }

  if (fromDate.getMonth() === toDate.getMonth()) {
    return `${format(fromDate, "LLLL d")}-${format(toDate, "d, yyyy")}`
  }
  
  return `${format(fromDate, "LLLL d")}-${format(toDate, "LLLL d, yyyy")}`;
}

export const getTournamentRoundsFromUserRounds = (allRounds: Database['public']['Tables']['tournament rounds']['Row'][], tournament: Database['public']['Tables']['tournaments']['Row']) => {
  return allRounds.filter((round) => round.tournament === tournament.id);
}

export const convertToUTC = (date?: Date) => {
  if (!date) return undefined;
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};