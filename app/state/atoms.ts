import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { Database } from "@/database.types";
import { atom } from "recoil";

export const userState = atom({
    key: 'userState',
    default: {id: '', created_at: '', avatar: '', live_screen_name: ''}
})

export const logState = atom<Database['public']['Tables']['logs']['Row'][]>({
    key: 'logState',
    default: []
})