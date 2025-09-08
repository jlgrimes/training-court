import { BattleLog } from "../utils/battle-log.types";

export const getBattleLogMetadataFromLog = (log: BattleLog, screenName: string | null | undefined) => {
  if (!screenName) {
    return {
      archetype: null,
      opp_archetype: null,
      turn_order: null,
      result: null
    }
  }

  const me = log.players.find((player) => player.name.toLowerCase() === screenName.toLowerCase());
  const opp = log.players.find((player) => player.name.toLowerCase() !== screenName.toLowerCase());

  const myDeck = me?.deck ?? null;
  const oppDeck = opp?.deck ?? null;
  const turnOrder = log.sections[1].player.toLowerCase() === screenName.toLowerCase() ? '1' : '2';
  const result = log.winner.toLowerCase() === screenName.toLowerCase() ? 'W' : 'L';

  return {
    archetype: myDeck,
    opp_archetype: oppDeck,
    turn_order: turnOrder,
    result: result
  }
}