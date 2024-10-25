import { atom } from 'recoil';
import { Database } from "@/database.types";
import { atomFamily } from 'recoil';

export const tournamentsState = atom<Database['public']['Tables']['tournaments']['Row'][]>({
  key: 'tournamentsState',
  default: [{
    category: null,
    created_at: '',
    date_from: '',
    date_to: '',
    deck: null,
    id: '',
    name: '',
    placement: null,
    user: '',
  }],
});

// export const tournamentState = atom<Database['public']['Tables']['tournaments']['Row']>({
//   key: 'tournamentState',
//   default: {
//     category: null,
//     created_at: '',
//     date_from: '',
//     date_to: '',
//     deck: null,
//     id: '',
//     name: '',
//     placement: null,
//     user: '',
//   },
// });

export const tournamentDeckState = atomFamily<string | undefined, string>({
  key: 'tournamentDeckState',
  default: undefined,
});

export const roundsState = atom<Database['public']['Tables']['tournament rounds']['Row'][]>({
  key: 'roundsState',
  default: [],
});
