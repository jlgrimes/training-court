import { determineWinner, getPlayerNames, parseBattleLog, trimBattleLog } from "@/components/battle-logs/utils/battle-log.utils";
import { battleLogBrazilianPortuguese } from "@/components/battle-logs/utils/testing-files/battleLogBrazilianPortuguese";
import { battleLogGerman } from "@/components/battle-logs/utils/testing-files/battleLogGerman";
import { battleLogItalian } from "@/components/battle-logs/utils/testing-files/battleLogItalian";
import { battleLogNoPlayer2Turn } from "@/components/battle-logs/utils/testing-files/battleLogNoPlayer2Turn";
import { battleLogSpanish } from "@/components/battle-logs/utils/testing-files/battleLogSpanish";

describe('battle log utils', () => {
  it('should correctly extract player names', () => {
    const mockLog = [
      `Bassoonboy135 drew 7 cards for the opening hand. - 7 drawn cards.`,
      `player2 drew 7 cards for the opening hand. - 7 drawn cards.`
    ];
    expect(getPlayerNames(mockLog, 'en')).toEqual(['Bassoonboy135', 'player2'])
  });

  it('should correctly extract player names in Spanish from complete log', () => {
    const mockLog = trimBattleLog(battleLogSpanish);
    expect(getPlayerNames(mockLog, 'es')).toEqual(['jugador1', 'jugador2'])
  });

  it('should correctly extract player names in German from complete log', () => {
    const mockLog = trimBattleLog(battleLogGerman);
    expect(getPlayerNames(mockLog, 'de')).toEqual(['player1', 'player2'])
  });

  it('should correctly extract player names in Italian from complete log', () => {
    const mockLog = trimBattleLog(battleLogItalian);
    expect(getPlayerNames(mockLog, 'it')).toEqual(['italianPlayer2', 'italianPlayer1'])
  });

  describe('determineWinner', () => {
    it('should correctly determine winner', () => {
      const mockLog = [
        `Professor's Research was added to comp0cker's hand.`,
        `Knocked Out all your opponent's Pokémon in play and took all your Prize cards. comp0cker wins.`
      ];
      expect(determineWinner(mockLog, 'en')).toBe('comp0cker');
    });

    it('should determine winner on concession', () => {
      const mockLog = [
        `Aezart5's Entei V used Fleet-Footed.`,
        `- Aezart5 drew a card.`,
        `Opponent conceded. comp0cker wins.`
      ];
      expect(determineWinner(mockLog, 'en')).toBe('comp0cker');
    })

    it('should determine winner for opponent', () => {
      const mockLog = [
        `Aezart5's Entei V used Fleet-Footed.`,
        `- Aezart5 drew a card.`,
        `comp0cker conceded. Aezart5 wins.`
      ];
      expect(determineWinner(mockLog, 'en')).toBe('Aezart5');
    })
  });

  describe('parseBattleLog', () => {
    it('should correctly parse a detailed battle log', () => {
      const battleLog = battleLogNoPlayer2Turn;
      const parsedLog = parseBattleLog(battleLog, 'logId', '2024-01-01', null, null, null);

      expect(parsedLog.winner).toBe('player2');
      expect(parsedLog.players).toHaveLength(2);
      expect(parsedLog.players[0].name).toBe('Bassoonboy135');
      expect(parsedLog.players[1].name).toBe('player2');
      expect(parsedLog.sections).toHaveLength(2); // Setup, Bassoonboy135's turn, donk before player 2's turn.
    })
  })

  describe('parseBattleLog', () => {
    it('should correctly parse a detailed battle log in Brazilian Portuguese', () => {
      const battleLog = battleLogBrazilianPortuguese;
      const parsedLog = parseBattleLog(battleLog, 'logId', '2024-01-01', null, null, null);

      expect(parsedLog.winner).toBe('BrPtPlayer2');
      expect(parsedLog.players).toHaveLength(2);
      expect(parsedLog.players[0].name).toBe('BrPtPlayer1');
      expect(parsedLog.players[1].name).toBe('BrPtPlayer2');
      expect(parsedLog.language).toBe('pt-br')
      expect(parsedLog.sections).toHaveLength(5); // Full game
    })
  })

  describe('parseBattleLog', () => {
    it('should correctly parse a detailed battle log in German', () => {
      const battleLog = battleLogGerman;
      const parsedLog = parseBattleLog(battleLog, 'logId', '2024-01-01', null, null, null);

      expect(parsedLog.winner).toBe('player2');
      expect(parsedLog.players).toHaveLength(2);
      expect(parsedLog.players[0].name).toBe('player1');
      expect(parsedLog.players[1].name).toBe('player2');
      expect(parsedLog.sections).toHaveLength(11); // Full game
    })
  })

  describe('parseBattleLog', () => {
    it('should correctly parse a detailed battle log in Spanish', () => {
      const battleLog = battleLogSpanish;
      const parsedLog = parseBattleLog(battleLog, 'logId', '2024-01-01', null, null, null);

      expect(parsedLog.winner).toBe('jugador1');
      expect(parsedLog.players).toHaveLength(2);
      expect(parsedLog.players[0].name).toBe('jugador1');
      expect(parsedLog.players[1].name).toBe('jugador2');
      expect(parsedLog.sections).toHaveLength(9); // Full game
    })
  })
});
