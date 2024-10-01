import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/client";

export async function addFriend(friendRequest: Database['public']['Tables']['friend requests']['Row'], accepterId: string) {
  const supabase = createClient();

  await supabase.from('friend requests').update({ uses_remaining: friendRequest.uses_remaining - 1 }).eq('id', friendRequest.id);

  await supabase.from('friends').insert({ user: friendRequest.user_sending, friend: accepterId });
  await supabase.from('friends').insert({ user: accepterId, friend: friendRequest.user_sending });

  window.location.href = '/home';
}