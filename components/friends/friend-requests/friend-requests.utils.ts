import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";
import { FriendRequestWithUserData } from "./friend-requests.server.utils";

export async function addFriend(friendRequest: FriendRequestWithUserData, accepterId: string) {
  const supabase = createClient();

  await supabase.from('friend requests').update({ uses_remaining: friendRequest.uses_remaining - 1 }).eq('id', friendRequest.id);

  const { error } = await supabase.from('friends').insert({ user: friendRequest.user_sending.id, friend: accepterId });

  if (error) return console.error(error);

  await supabase.from('friends').insert({ user: accepterId, friend: friendRequest.user_sending.id });

  window.location.href = '/home';
}