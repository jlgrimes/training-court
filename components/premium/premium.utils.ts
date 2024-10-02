import { isUserAnAdmin } from "../admin/admin.utils";

export const bunnyUserId = 'f0a37b75-3ecb-4aaa-a5ac-ecb679685ed2';

export function isPremiumUser(userId: string | null) {
  return isUserAnAdmin(userId);
}