import { atom } from 'recoil';
import { Database } from "@/database.types";
import { User } from "@supabase/supabase-js";
import { DateRange } from "react-day-picker";
import { TournamentCategory } from '../tournaments/Category/tournament-category.types';
import { TournamentPlacement } from '../tournaments/Placement/tournament-placement.types';

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

export const roundsState = atom<Database['public']['Tables']['tournament rounds']['Row'][]>({
  key: 'roundsState',
  default: [],
});

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
});

export const tournamentEditState = atom({
  key: 'tournamentEditState',
  default: {
    name: '',
    date: {} as DateRange,
    category: null as TournamentCategory | null,
    placement: null as TournamentPlacement | null,
  },
});
