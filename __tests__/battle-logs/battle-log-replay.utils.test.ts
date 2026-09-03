import { buildBattleLogReplay } from "@/components/battle-logs/Replay/battle-log-replay.utils";
import { parseBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { battleLogNewStructure } from "@/components/battle-logs/utils/testing-files/battleLogNewStructure";
import { battleLogNoPlayer2Turn } from "@/components/battle-logs/utils/testing-files/battleLogNoPlayer2Turn";

describe('battle log replay utils', () => {
  it('builds frames from parsed battle log actions', () => {
    const battleLog = parseBattleLog(battleLogNoPlayer2Turn, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');

    expect(replay.perspectivePlayer).toBe('Bassoonboy135');
    expect(replay.frames.length).toBeGreaterThanOrEqual(battleLog.sections.length);
  });

  it('tracks known opening hand cards and opponent unknown hand count', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');
    const setupFrame = replay.frames.filter((frame) => frame.turnTitle === 'Setup').at(-1);

    expect(setupFrame?.board.players.Bassoonboy135.hand.knownCards.map((card) => card.name)).toEqual(
      expect.arrayContaining(['Superior Energy Retrieval', 'Earthen Vessel', 'Arven'])
    );
    expect(setupFrame?.board.players.Bassoonboy135.active?.name).toBe('Solrock');
    expect(setupFrame?.board.players.Player2.hand.unknownCount).toBe(6);
    expect(setupFrame?.board.players.Player2.active?.name).toBe('Pidgey');
  });

  it('tracks damage events without mutating previous frames', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    const replay = buildBattleLogReplay(battleLog, 'Bassoonboy135');
    const beforeDamage = replay.frames.find((frame) => frame.event.title.includes('attached Basic Fighting Energy to Solrock'));
    const afterDamage = replay.frames.find((frame) => frame.event.title.includes('Cosmic Beam on Player2'));

    const beforeDuskull = beforeDamage?.board.players.Player2.active?.name === 'Duskull'
      ? beforeDamage.board.players.Player2.active
      : beforeDamage?.board.players.Player2.bench.find((pokemon) => pokemon.name === 'Duskull');
    const afterDuskull = afterDamage?.board.players.Player2.active?.name === 'Duskull'
      ? afterDamage.board.players.Player2.active
      : afterDamage?.board.players.Player2.bench.find((pokemon) => pokemon.name === 'Duskull');

    expect(beforeDuskull?.damage ?? 0).toBe(0);
    expect(afterDuskull?.damage).toBe(70);
  });

  it('keeps parsing when lines are unrecognized', () => {
    const battleLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, 'Bassoonboy135');
    battleLog.sections[1].actions.push({ title: 'A strange replay-only sentence happened.', details: [] });

    expect(() => buildBattleLogReplay(battleLog, 'Bassoonboy135')).not.toThrow();
  });
});
