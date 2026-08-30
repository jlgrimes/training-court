import { format, isAfter } from "date-fns";
import { Database } from "@/database.types";
import { getRecord } from "@/components/tournaments/utils/tournaments.utils";

export type BattleLogPreviewRecord = Pick<
  Database['public']['Tables']['logs']['Row'],
  'id' | 'created_at' | 'archetype' | 'opp_archetype' | 'result' | 'turn_order' | 'format' | 'decklist_id'
> & Partial<Pick<Database['public']['Tables']['logs']['Row'], 'user' | 'notes' | 'log'>>;

export const BATTLE_LOG_PREVIEW_COLUMNS =
  'id, created_at, user, archetype, opp_archetype, result, turn_order, format, decklist_id, notes';

export const UNKNOWN_DECK = 'unknown';

export const getBattleLogPreviewDeck = (log: BattleLogPreviewRecord) =>
  log.archetype || UNKNOWN_DECK;

export const getBattleLogPreviewOppDeck = (log: BattleLogPreviewRecord) =>
  log.opp_archetype || UNKNOWN_DECK;

export const getBattleLogPreviewResult = (log: BattleLogPreviewRecord) =>
  log.result === 'W' || log.result === 'L' || log.result === 'T'
    ? log.result
    : undefined;

export const getBattleLogPreviewResultText = (log: BattleLogPreviewRecord) => {
  switch (getBattleLogPreviewResult(log)) {
    case 'W':
      return 'Win';
    default:
      return 'Loss';
  }
};

export const getBattleLogPreviewTurnOrder = (log: BattleLogPreviewRecord) => {
  if (log.turn_order === '1') return '1st';
  if (log.turn_order === '2') return '2nd';
  return '';
};

export const convertBattleLogPreviewDateIntoDay = (date: string | Date) =>
  format(date, "LLL d, yyyy");

export const groupBattleLogPreviewRecordsIntoDays = (
  logs: BattleLogPreviewRecord[]
): Record<string, BattleLogPreviewRecord[]> => {
  return logs.reduce((acc: Record<string, BattleLogPreviewRecord[]>, curr) => {
    const dayOfLog = convertBattleLogPreviewDateIntoDay(curr.created_at);
    return {
      ...acc,
      [dayOfLog]: [...(acc[dayOfLog] ?? []), curr],
    };
  }, {});
};

export const getBattleLogPreviewDayList = (
  logsByDay: Record<string, BattleLogPreviewRecord[]>
) => {
  return Object.entries(logsByDay).sort((a, b) => {
    if (a[1].length === 0) return -1;
    if (b[1].length === 0) return 1;

    if (isAfter(a[1][0].created_at, b[1][0].created_at)) return -1;
    if (isAfter(b[1][0].created_at, a[1][0].created_at)) return 1;
    return 0;
  });
};

export const groupBattleLogPreviewRecordsIntoDecks = (
  logs: BattleLogPreviewRecord[]
): Record<string, BattleLogPreviewRecord[]> => {
  return logs.reduce((acc: Record<string, BattleLogPreviewRecord[]>, curr) => {
    const deck = getBattleLogPreviewDeck(curr);
    return {
      ...acc,
      [deck]: [...(acc[deck] ?? []), curr],
    };
  }, {});
};

export const getRecordFromBattleLogPreviewRecords = (logs: BattleLogPreviewRecord[]) =>
  getRecord(
    logs
      .map((log) => getBattleLogPreviewResult(log))
      .filter((result): result is 'W' | 'L' | 'T' => !!result)
      .map((result) => ({ result: [result] }))
  );
