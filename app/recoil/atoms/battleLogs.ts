import { atom } from 'recoil';
import type { Database } from '@/database.types';

export type BattleLog = Database['public']['Tables']['logs']['Row'];

export const userLogsAtom = atom<BattleLog[]>({
  key: 'userLogsAtom',
  default: [],
});