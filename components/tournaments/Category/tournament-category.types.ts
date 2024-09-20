export type TournamentCategory = 'local' | 'challenge' | 'cup' | 'regional' | 'international' | 'world';
export type TournamentCategoryTab = TournamentCategory | 'all';

export function displayTournamentCategory(cat: TournamentCategory) {
  switch (cat) {
    case 'local':
      return 'Locals';
    case 'challenge':
      return 'Challenge';
    case 'cup':
      return 'Cup';
    case 'regional':
      return 'Regional';
    case 'international':
      return 'International';
    case 'world':
      return 'Worlds';
  }
}

export function displayTournamentCategoryTab(cat: TournamentCategoryTab) {
  if (cat === 'all') return 'All';
  return displayTournamentCategory(cat);
}

export const allTournamentCategories: TournamentCategory[] = ['local', 'challenge', 'cup', 'regional', 'international', 'world'];
export const allTournamentCategoryTabs: TournamentCategoryTab[] = ['all', 'local', 'challenge', 'cup', 'regional', 'international', 'world'];