import { determineArchetype } from "./archetype.utils";

describe('archetype utils', () => {
  it('should determine archetype from playing a Pokemon', () => {
    const mockLog = [
      `comp0cker played Regidrago VSTAR onto his bench`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker')).toEqual('regidrago');
  });

  it('should correctly determine archetype from evolving', () => {
    const mockLog = [
      `- comp0cker evolved into Regidrago VSTAR`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker')).toEqual('regidrago');
  });
});