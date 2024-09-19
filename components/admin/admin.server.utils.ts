import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { getAvatarSrc } from "../avatar/avatar.utils";

export async function fetchCommonlyUsedAvatars() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('avatar_count').returns<Database['public']['Functions']['avatar_count']['Returns']>();

  return data?.filter(({ avatar }) => avatar).map(({ avatar, avatar_count }) => ({ avatar: getAvatarSrc(avatar), avatar_count }));
}