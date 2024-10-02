import { User } from "@supabase/supabase-js";
import { bunnyUserId } from "../premium/premium.utils";

export function isUserAnAdmin(userId: string | null) {
  const admins = [
    '01a36333-aa26-47e1-bec6-bbdd596a7020',
    '830cc5da-0dc2-44cf-a2b4-676090922637',
    bunnyUserId
  ];

  if (!userId) return false;
  return admins.includes(userId);
}