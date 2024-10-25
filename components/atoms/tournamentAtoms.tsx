import { atom } from 'recoil';
import { Database } from "@/database.types";
import { User } from "@supabase/supabase-js";
import { DateRange } from "react-day-picker";
import { TournamentCategory } from '../tournaments/Category/tournament-category.types';
import { TournamentPlacement } from '../tournaments/Placement/tournament-placement.types';
import { atomFamily } from 'recoil';

export const tournamentState = atom<Database['public']['Tables']['tournaments']['Row']>({
  key: 'tournamentState',
  default: {
    category: null,
    created_at: '',
    date_from: '',
    date_to: '',
    deck: null,
    id: '',
    name: '',
    placement: null,
    user: '',
  },
});

// export const tournamentState = atom<Database['public']['Tables']['tournaments']['Row'][]>({
//   key: 'tournamentState',
//   default: [{
//     category: null,
//     created_at: '',
//     date_from: '',
//     date_to: '',
//     deck: null,
//     id: '',
//     name: '',
//     placement: null,
//     user: '',
//   }],
// });

export const tournamentDeckState = atomFamily<string | undefined, string>({
  key: 'tournamentDeckState',
  default: undefined,
});
