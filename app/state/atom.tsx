import { Tournament } from '@/components/tournaments/TournamentContainer/TournamentContainer';
import { atom } from 'recoil';

// export const userState = atom({
//   key: 'userState',
//   default: null,
// });

export const tournamentState = atom<Tournament>({
  key: 'tournamentState',
  default: {
    category: '',
    created_at: '',
    date_from: '',
    date_to: '',
    deck: '',
    id: '',
    name: '',
    placement: null,
    user: ''
  }
})

export const tournamentRoundsState = atom<any[] | null>({
  key: 'tournamentRoundsState',
  default: null,
  effects: [
    ({ onSet }) => {
      onSet((newValue) => {
        console.log('Tournament state changed:', newValue);
      });
    },
  ],
})