import { createClient } from "@/utils/supabase/server";
import { determineArchetype } from "../archetype/archetype.utils";
import { BattleLog, BattleLogAction, BattleLogPlayer } from "./battle-log.types";
import { cache } from "react";
import { Database } from "@/database.types";

function trimBattleLog(log: string): string[] {
  return log.split('\n').reduce((acc: string[], curr: string) => {
    if (curr.length === 0 || curr === '\n' || curr.includes('shuffled their deck.')) return acc;
    return [...acc, curr];
  }, []);
}

export function getPlayerNames(log: string[]): string[] {
  const playerNames = log.reduce((acc: string[], curr: string) => {
    if (!curr.toLowerCase().includes(`'s turn`)) return acc;
    if (acc.some((player) => curr.includes(player))) return acc;

    const name = /- (.*)'s Turn/g.exec(curr)?.[1];

    if (!name) throw Error('Name not found in correct log line');

    return [...acc, name]
  }, []);

  if (playerNames.length !== 2) throw Error('Error: not two players found in battle log.');

  return playerNames;
}

export function determineWinner(log: string[]): string {
  for (const line of log) {
    const winner = /\. (.*) wins\./g.exec(line)?.[1];
    if (winner) return winner;
  }

  throw 'No winner found';
}

export function getBattleActions(log: string[]): BattleLogAction[] {
  const playerNames = getPlayerNames(log);

  return log.map((line) => ({
    owner: playerNames.find((player) => line.includes(player)),
    message: line
  }))
}

export function parseBattleLog(log: string, id: string, created_at: string) {
  const cleanedLog = trimBattleLog(log);
  const playerNames = getPlayerNames(cleanedLog);
  const winner = determineWinner(cleanedLog);
  const players: BattleLogPlayer[] = playerNames.map((player) => ({
    name: player,
    deck: determineArchetype(cleanedLog, player),
    result: (winner === player) ? 'W' : 'L'
  }));

  const battleLog: BattleLog = {
    players,
    id,
    date: created_at,
    winner,
    actions: getBattleActions(cleanedLog)
  };

  return battleLog;
}

export const fetchBattleLogs = cache(async (userId: string) => {
  const supabase = createClient();
  const { data: logData } = await supabase.from('logs').select('*').eq('user', userId).order('created_at', { ascending: false }).returns<Database['public']['Tables']['logs']['Row'][]>();
  return logData;
})