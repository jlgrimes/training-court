import { determineWinner, divideBattleLogIntoSections, getPlayerNames, parseBattleLog, trimBattleLog } from "./battle-log.utils";
import { battleLogNewStructure } from "./testing-files/battleLogNewStructure";
import { redactedPlayerNameError } from "./testing-files/battleLogRedactedPlayerNameError";

describe('battle log parsing - PTCGL new structure where turn order is removed', () => {
  it('should parse a log where turn headers are no longer prefixed with "Turn # -"', () => {
    const trimmedLog = trimBattleLog(battleLogNewStructure);
    const turnHeaders = trimmedLog.filter((line) => line.endsWith("'s Turn"));

    expect(trimmedLog.length).toBeGreaterThan(0);
    expect(trimmedLog.some((line) => line.includes('shuffled their deck.'))).toBe(false);
    expect(turnHeaders.length).toBeGreaterThan(0);

    const playerNames = getPlayerNames(trimmedLog, 'en');
    expect(playerNames).toEqual(['Bassoonboy135', 'Player2']);

    const winner = determineWinner(trimmedLog, 'en');
    expect(winner).toBe('Bassoonboy135');

    const sections = divideBattleLogIntoSections(trimmedLog, 'en');
    expect(sections).toHaveLength(turnHeaders.length + 1);
    for (const section of sections.slice(1)) {
      expect(playerNames).toContain(section.player);
      expect(section.actions.length).toBeGreaterThan(0);
    }

    const parsedLog = parseBattleLog(battleLogNewStructure, 'logId', '2024-01-01', null, null, null);
    expect(parsedLog.winner).toBe('Bassoonboy135');
    expect(parsedLog.players.map((player) => player.name)).toEqual(playerNames);
    expect(parsedLog.sections).toHaveLength(turnHeaders.length + 1);
    expect(parsedLog.sections[1]).toBeDefined();
  });
});

describe('battle log parsing - PTCGL new structure where turn order is removed', () => {
  it('should parse a log where turn headers are no longer prefixed with "Turn # -" and [playerName] exists', () => {
    const trimmedLog = trimBattleLog(redactedPlayerNameError);
    const turnHeaders = trimmedLog.filter((line) => line.endsWith("'s Turn"));

    expect(trimmedLog.length).toBeGreaterThan(0);
    expect(trimmedLog.some((line) => line.includes('shuffled their deck.'))).toBe(false);
    expect(turnHeaders.length).toBeGreaterThan(0);

    const playerNames = getPlayerNames(trimmedLog, 'en');
    expect(playerNames).toEqual(['Player1', 'Player2']);

    const winner = determineWinner(trimmedLog, 'en');
    expect(winner).toBe('Player1');

    const sections = divideBattleLogIntoSections(trimmedLog, 'en');
    expect(sections).toHaveLength(turnHeaders.length + 1);
    for (const section of sections.slice(1)) {
      expect(playerNames).toContain(section.player);
      expect(section.actions.length).toBeGreaterThan(0);
    }

    const parsedLog = parseBattleLog(redactedPlayerNameError, 'logId', '2024-01-01', null, null, null);
    expect(parsedLog.winner).toBe('Player1');
    expect(parsedLog.players.map((player) => player.name)).toEqual(playerNames);
    expect(parsedLog.sections).toHaveLength(turnHeaders.length + 1);
    expect(parsedLog.sections[1]).toBeDefined();
  });
});