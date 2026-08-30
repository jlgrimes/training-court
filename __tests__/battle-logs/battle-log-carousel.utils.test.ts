import { actionsWithoutDuplicateSetupLabel } from '../../components/battle-logs/BattleLogDisplay/battle-log-carousel.utils';
import { BattleLogTurn } from '../../components/battle-logs/utils/battle-log.types';

function setupSection(overrides: Partial<BattleLogTurn> = {}): BattleLogTurn {
  return {
    turnTitle: 'Setup',
    body: 'Setup\nplayer2 won the coin toss.',
    player: '',
    prizesAfterTurn: { cidebae: 6, GordinSilva: 6 },
    actions: [
      { title: 'Setup', details: [] },
      { title: 'GordinSilva won the coin flip and went second.', details: [] },
      { title: 'cidebae played Arceus V to the Active Spot.', details: [] },
    ],
    ...overrides,
  };
}

describe('battle log setup heading', () => {
  it('drops the duplicate Setup accordion label and keeps setup actions', () => {
    const actions = actionsWithoutDuplicateSetupLabel(setupSection(), 'Setup');
    expect(actions.map((action) => action.title)).toEqual([
      'GordinSilva won the coin flip and went second.',
      'cidebae played Arceus V to the Active Spot.',
    ]);
  });

  it('flattens details when Setup is stored as an accordion action', () => {
    const actions = actionsWithoutDuplicateSetupLabel(
      setupSection({
        actions: [
          {
            title: 'Setup',
            details: ['cidebae benched Bidoof.'],
          },
        ],
      }),
      'Setup'
    );
    expect(actions).toEqual([{ title: 'cidebae benched Bidoof.', details: [] }]);
  });

  it('leaves turn actions unchanged', () => {
    const turn: BattleLogTurn = {
      turnTitle: "GordinSilva's Turn",
      body: '',
      player: 'GordinSilva',
      prizesAfterTurn: { cidebae: 6, GordinSilva: 6 },
      actions: [{ title: 'GordinSilva drew a card.', details: [] }],
    };
    expect(actionsWithoutDuplicateSetupLabel(turn, 'Setup')).toEqual(turn.actions);
  });
});
