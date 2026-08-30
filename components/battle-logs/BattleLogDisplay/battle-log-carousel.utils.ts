import { BattleLogAction, BattleLogTurn } from '../utils/battle-log.types';

export function isSetupSection(section: BattleLogTurn, setupLabel: string): boolean {
  return section.turnTitle.includes(setupLabel);
}

/**
 * The parser stores "Setup" as both the section title and the first action.
 * When the UI refresh is on, drop that duplicate accordion/heading label
 * while keeping the real setup actions (and any details under the label).
 */
export function actionsWithoutDuplicateSetupLabel(
  section: BattleLogTurn,
  setupLabel: string
): BattleLogAction[] {
  if (!isSetupSection(section, setupLabel)) return section.actions;

  return section.actions.flatMap((action) => {
    const title = action.title.trim();
    if (title === setupLabel || title === section.turnTitle.trim()) {
      return action.details.map((detail) => ({ title: detail, details: [] }));
    }
    return [action];
  });
}
