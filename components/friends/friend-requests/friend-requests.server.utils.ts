import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server"

export const FetchFriendRequestError = {
  SupabaseError: 'SupabaseError',
  HasExpired: 'HasExpired'
}

export async function fetchFriendRequest(friendRequestId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from('friend requests').select().eq('id', friendRequestId).returns<Database['public']['Tables']['friend requests']['Row'][]>().maybeSingle();

  if (error || !data) throw FetchFriendRequestError.SupabaseError;
  if (data.uses_remaining === 0) throw FetchFriendRequestError.HasExpired;

  return data;
}