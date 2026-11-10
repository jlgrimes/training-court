import { samePtcglUsername } from "@/lib/ptcgl-username";
import { BattleLog } from "../utils/battle-log.types";

export const getBattleLogMetadataFromLog = (log: BattleLog, screenName: string | null | undefined) => {
  if (!log.players.some((player) => samePtcglUsername(player.name, screenName))) {
    return {
      archetype: null,
      opp_archetype: null,
      turn_order: null,
      result: null
    }
  }

  const me = log.players.find((player) => samePtcglUsername(player.name, screenName));
  const opp = log.players.find((player) => !samePtcglUsername(player.name, screenName));

  const myDeck = me?.deck ?? null;
  const oppDeck = opp?.deck ?? null;
  const turnOrder = samePtcglUsername(log.sections[1]?.player, screenName) ? '1' : '2';
  const result = samePtcglUsername(log.winner, screenName) ? 'W' : 'L';

  return {
    archetype: myDeck,
    opp_archetype: oppDeck,
    turn_order: turnOrder,
    result: result
  }
}