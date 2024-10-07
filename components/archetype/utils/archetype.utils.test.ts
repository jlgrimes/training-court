import { determineArchetype } from "./archetype.utils";

describe('archetype utils', () => {
  it('should determine archetype from playing a Pokemon', () => {
    const mockLog = [
      `comp0cker played Regidrago VSTAR onto his bench`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'en')).toEqual('regidrago');
  });

  it('should correctly determine archetype from evolving', () => {
    const mockLog = [
      `comp0cker hat Ur-Palkia-V auf der Bank zu Ur-Palkia-VSTAR entwickelt.`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'de')).toEqual('palkia-origin');
  });

  it('should correctly determine archetype in German', () => {
    const mockLog = [
      `- comp0cker evolved into Regidrago VSTAR`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker', 'en')).toEqual('regidrago');
  })
});