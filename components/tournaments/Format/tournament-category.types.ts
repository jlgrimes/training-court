export type FormatArray = 'BRS-SCR' | 'BRS-SSP' | 'all';
// export type TournamentCategoryTab = TournamentCategory | 'all';

// export function displayTournamentCategory(cat: TournamentCategory) {
//   switch (cat) {
//     case 'online':
//       return 'Online';
//     case 'local':
//       return 'Locals';
//     case 'challenge':
//       return 'Challenge';
//     case 'cup':
//       return 'Cup';
//     case 'regional':
//       return 'Regionals';
//     case 'international':
//       return 'Internationals';
//     case 'world':
//       return 'Worlds';
//   }
// }

// export function displayTournamentCategoryTab(cat: TournamentCategoryTab) {
//   if (cat === 'all') return 'All';
//   if (cat === 'challenge') return 'Challenges'
//   if (cat === 'regional') return 'Regs';
//   if (cat === 'international') return 'ICs';
//   return displayTournamentCategory(cat);
// }

// export const format: Format[] = ['online', 'local', 'challenge', 'cup', 'regional', 'international', 'world'];

export const formatArray: FormatArray[] = ['BRS-SCR', 'BRS-SSP']