import { User } from "@supabase/supabase-js";
import { isUserAnAdmin } from "../admin/admin.utils";

export function isPremiumUser(user: User | null) {
  return isUserAnAdmin(user);
}