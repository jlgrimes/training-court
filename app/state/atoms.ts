import { BattleLog } from "@/components/battle-logs/utils/battle-log.types";
import { Database } from "@/database.types";
import { atom } from "recoil";

export const userState = atom<Database['public']['Tables']['user data']['Row'] | null>({
    key: 'userState',
    default: null
    //default: {id: '', created_at: '', avatar: '', live_screen_name: ''}
})

export const logState = atom<BattleLog[]>({
    key: 'logState',
    default: []
})