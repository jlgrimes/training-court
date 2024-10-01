import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server"

export const FetchFriendRequestError = {
  SupabaseError: 'SupabaseError',
  HasExpired: 'HasExpired'
}

export type FriendRequestWithUserData = {
  created_at: string;
  id: string;
  user_sending: Database['public']['Tables']['user data']['Row'];
  uses_remaining: number;
};

export async function fetchFriendRequestWithUserData(friendRequestId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.from('friend requests').select('id, created_at, user_sending ( * ), uses_remaining').eq('id', friendRequestId).returns<FriendRequestWithUserData[] | null>().maybeSingle();

  if (error || !data) throw FetchFriendRequestError.SupabaseError;
  if (data.uses_remaining === 0) throw FetchFriendRequestError.HasExpired;

  return data;
}

export async function fetchFriends(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.from('friends').select().eq('user', userId).returns<Database['public']['Tables']['friends']['Row'][]>();
  return data;
}