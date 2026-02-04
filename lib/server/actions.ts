'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalidate battle logs pages to refresh server-side cached data
 */
export async function revalidateBattleLogs() {
  revalidatePath('/ptcg/logs');
  revalidatePath('/home');
}
