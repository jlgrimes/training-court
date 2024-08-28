import { getPlayerNames } from "./battle-log.utils";

describe('battle log utils', () => {
  it('should correctly extract player names', () => {
    const mockLog = [
      `Turn # 1 - comp0cker's Turn`,
      `Turn # 1 - millenniumfabi's Turn'`
    ];
    expect(getPlayerNames(mockLog)).toEqual(['comp0cker', 'millenniumfabi'])
  });
});