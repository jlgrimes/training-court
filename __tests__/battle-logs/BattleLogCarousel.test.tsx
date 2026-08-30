import React from 'react';
import { render, screen } from '@testing-library/react';
import { BattleLogCarousel } from '../../components/battle-logs/BattleLogDisplay/BattleLogCarousel';
import { BattleLog } from '../../components/battle-logs/utils/battle-log.types';

jest.mock('../../hooks/useUiRefresh', () => ({
  useUiRefresh: () => ({ enabled: true, ready: true }),
}));

jest.mock('gt-react', () => ({
  T: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const battleLog: BattleLog = {
  id: 'log-1',
  language: 'en',
  date: '2024-01-01',
  winner: 'cidebae',
  players: [
    { name: 'cidebae', deck: 'arceus', oppDeck: 'charizard', result: 'W' },
    { name: 'GordinSilva', deck: 'charizard', oppDeck: 'arceus', result: 'L' },
  ],
  sections: [
    {
      turnTitle: 'Setup',
      body: '',
      player: '',
      prizesAfterTurn: { cidebae: 6, GordinSilva: 6 },
      actions: [
        { title: 'Setup', details: [] },
        { title: 'GordinSilva won the coin flip and went second.', details: [] },
      ],
    },
    {
      turnTitle: "GordinSilva's Turn",
      body: '',
      player: 'GordinSilva',
      prizesAfterTurn: { cidebae: 6, GordinSilva: 6 },
      actions: [{ title: 'GordinSilva drew a card.', details: [] }],
    },
  ],
};

describe('BattleLogCarousel', () => {
  it('renders a single Setup heading without a duplicate accordion label', () => {
    render(<BattleLogCarousel battleLog={battleLog} />);

    expect(screen.getAllByText('Setup')).toHaveLength(1);
    expect(screen.getByText('GordinSilva won the coin flip and went second.')).toBeTruthy();
    expect(screen.getByText('GordinSilva drew a card.')).toBeTruthy();
    expect(screen.getByText(/cidebae:/)).toBeTruthy();
    expect(screen.getByText(/GordinSilva:/)).toBeTruthy();
  });
});
