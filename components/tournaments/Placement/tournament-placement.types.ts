export type TournamentPlacement = 'no placement' | 'dropped' | 't1024' | 't512' | 't256' | 't128' | 't64' | 't32' | 't16' | 't8' | 't4' | 'finalist' | 'champion';

export function renderTournamentPlacement(placement: TournamentPlacement) {
  switch (placement) {
    case 'champion':
      return 'Champion';
    case 'finalist':
      return 'Finalist';
    case 't4':
      return 'Top 4';
    case 't8':
      return 'Top 8';
    case 't16':
      return 'Top 16';
    case 't32':
      return 'Top 32';
    case 't64':
      return 'Top 64';
    case 't128':
      return 'Top 128';
    case 't256':
      return 'Top 256';
    case 't512':
      return 'Top 512';
    case 't1024':
      return 'Top 1024';
    case 'dropped':
      return 'Dropped';
    case 'no placement':
      return 'No placement';
  }
}