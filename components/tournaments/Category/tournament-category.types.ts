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
      return 'Regionals';
    case 'international':
      return 'Internationals';
    case 'world':
      return 'Worlds';
  }
}

export function displayTournamentCategoryTab(cat: TournamentCategoryTab) {
  if (cat === 'all') return 'All';
  if (cat === 'challenge') return 'Challenges'
  if (cat === 'regional') return 'Regs';
  if (cat === 'international') return 'ICs';
  return displayTournamentCategory(cat);
}

export const allTournamentCategories: TournamentCategory[] = ['local', 'challenge', 'cup', 'regional', 'international', 'world'];
export const allTournamentCategoryTabs: TournamentCategoryTab[] = ['all', 'local', 'challenge', 'cup', 'regional', 'international', 'world'];