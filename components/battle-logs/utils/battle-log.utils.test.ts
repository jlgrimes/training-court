import { determineWinner, getPlayerNames } from "./battle-log.utils";

describe('battle log utils', () => {
  it('should correctly extract player names', () => {
    const mockLog = [
      `Turn # 1 - comp0cker's Turn`,
      `Turn # 1 - millenniumfabi's Turn'`
    ];
    expect(getPlayerNames(mockLog)).toEqual(['comp0cker', 'millenniumfabi'])
  });

  describe('determineWinner', () => {
    it('should correctly determine winner', () => {
      const mockLog = [
        `Professor's Research was added to comp0cker's hand.`,
        `Knocked Out all your opponent's Pokémon in play and took all your Prize cards. comp0cker wins.`
      ];
      expect(determineWinner(mockLog)).toBe('comp0cker');
    });

    it('should determine winner on concession', () => {
      const mockLog = [
        `Aezart5's Entei V used Fleet-Footed.`,
        `- Aezart5 drew a card.`,
        `Opponent conceded. comp0cker wins.`
      ];
      expect(determineWinner(mockLog)).toBe('comp0cker');
    })

    it('should determine winner for opponent', () => {
      const mockLog = [
        `Aezart5's Entei V used Fleet-Footed.`,
        `- Aezart5 drew a card.`,
        `comp0cker conceded. Aezart5 wins.`
      ];
      expect(determineWinner(mockLog)).toBe('Aezart5');
    })
  });
});