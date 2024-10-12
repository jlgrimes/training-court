import { determineWinner, getPlayerNames, parseBattleLog } from "./battle-log.utils";

describe('battle log utils', () => {
  it('should correctly extract player names', () => {
    const mockLog = [
      `Turn # 1 - comp0cker's Turn`,
      `Turn # 1 - millenniumfabi's Turn'`
    ];
    expect(getPlayerNames(mockLog, 'en')).toEqual(['comp0cker', 'millenniumfabi'])
  });

  it('should correctly extract player names in German', () => {
    const mockLog = [
      `Turn # 3 - Zug von comp0cker`,
      `Turn # 3 - Zug von player`
    ];
    expect(getPlayerNames(mockLog, 'de')).toEqual(['comp0cker', 'player'])
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

  // describe('parseBattleLog', () => {
  //   it('should correctly parse a detailed battle log', () => {
  //     const battleLog = `Setup
  //     Bassoonboy135 chose tails for the opening coin flip.
  //     Sadfjan_Stevens won the coin toss.
  //     Sadfjan_Stevens decided to go first.
  //     Bassoonboy135 drew 7 cards for the opening hand. - 7 drawn cards.
  //     • Luxray V, Rare Candy, Mimikyu, Night Stretcher, Eri, Penny, Xerosic's Machinations
  //     Sadfjan_Stevens drew 7 cards for the opening hand. - 7 drawn cards.
  //     Bassoonboy135 played Mimikyu to the Active Spot.
  //     Sadfjan_Stevens played Brute Bonnet to the Active Spot.
  //     Turn # 1 - Sadfjan_Stevens's Turn
  //     Sadfjan_Stevens drew a card.
  //     Sadfjan_Stevens played Artazon to the Stadium spot.
  //     Sadfjan_Stevens played Artazon.
  //     - Sadfjan_Stevens drew Pecharunt and played it to the Bench.
  //     - Sadfjan_Stevens shuffled their deck.
  //     Sadfjan_Stevens attached Ancient Booster Energy Capsule to Brute Bonnet in the Active Spot.
  //     Sadfjan_Stevens's Brute Bonnet used Toxic Powder.
  //     - Bassoonboy135's Mimikyu is now Poisoned.
  //     Sadfjan_Stevens played Nest Ball.
  //     - Sadfjan_Stevens drew Radiant Hisuian Sneasler and played it to the Bench.
  //     - Sadfjan_Stevens shuffled their deck.
  //     Sadfjan_Stevens attached Jet Energy to Pecharunt on the Bench. Jet Energy was activated.
  //     - Sadfjan_Stevens's Pecharunt was switched with Sadfjan_Stevens's Brute Bonnet to become the Active Pokémon.
  //     Sadfjan_Stevens's Pecharunt is now in the Active Spot.
  //     Sadfjan_Stevens ended their turn.
  //     Pokémon Checkup
  //     8 damage counters were placed on Bassoonboy135's Mimikyu for the Special Condition Poisoned.
  //     Bassoonboy135's Mimikyu was Knocked Out!
  //     Sadfjan_Stevens took a Prize card. A card was added to Sadfjan_Stevens's hand.
  //     Knocked Out with no Benched Pokémon. Sadfjan_Stevens wins.`;

  //     const parsedLog = parseBattleLog(battleLog, 'logId', '2024-10-10', null, null);
      
  //     expect(parsedLog.winner).toBe('Sadfjan_Stevens');
  //     expect(parsedLog.players).toHaveLength(2);
  //     expect(parsedLog.players[0].name).toBe('Bassoonboy135');
  //     expect(parsedLog.players[1].name).toBe('Sadfjan_Stevens');
  //     expect(parsedLog.sections).toHaveLength(3); // Setup, Turn #1, Pokémon Checkup
  //   })
  // })
});