import { determineArchetype } from "./archetype.utils";

describe('archetype utils', () => {
  it('should correctly determine archetype from drawn cards', () => {
    const mockLog = [
      `Setup`,
      `- comp0cker drew 6 cards`,
     ` • Nest Ball, Fezandipiti ex, Earthen Vessel, Energy Switch, Regidrago VSTAR, Superior Energy Retrieval`
    ];
    expect(determineArchetype(mockLog, 'comp0cker')).toEqual('regidrago');
  });

  it('should determine archetype from initial 7', () => {
    const mockLog = [
      `comp0cker drew 7 cards for the opening hand.`,
      `- 7 drawn cards.`,
      `• Regidrago VSTAR, Regidrago VSTAR, Basic Grass Energy, Professor's Research, Professor's Research, Temple of Sinnoh, Regidrago VSTAR`,
    ];
    expect(determineArchetype(mockLog, 'comp0cker')).toEqual('regidrago');
  })
});