import { Database } from "@/database.types";
import { createClient } from "@/utils/supabase/server";
import { getAvatarSrc } from "../avatar/avatar.utils";

export async function fetchCommonlyUsedAvatars() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('avatar_count').returns<Database['public']['Functions']['avatar_count']['Returns']>();

  return data?.filter(({ avatar }) => avatar).map(({ avatar, avatar_count }) => ({ avatar: getAvatarSrc(avatar), avatar_count }));
}

export async function fetchAllFeedback() {
  const supabase = createClient();
  const { data, error } = await supabase.from('feedback').select('*').order('created_at', { ascending: false }).returns<Database['public']['Tables']['feedback']['Row'][]>();
  return data;
}

export async function countAllUsers() {
  const supabase = createClient();
  const { data, error, count } = await supabase.from('user data').select('*', { count: 'exact', head: true }).returns<Database['public']['Tables']['feedback']['Row'][]>();
  
  if (error) {
    console.error('Error fetching users count:', error);
    return null;
  }
  
  console.log("Supabase response:", { data, error, count });
  return count;
}

export async function countUsersInLastXDays(startDaysAgo: number, endDaysAgo: number) {
  const supabase = createClient();
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDaysAgo);

  const endDate = new Date();
  endDate.setDate(endDate.getDate() - endDaysAgo);

  const formattedStartDate = startDate.toISOString();
  const formattedEndDate = endDate.toISOString();

  const { data, error, count } = await supabase.from('user data').select('*', { count: 'exact' }).gte('created_at', formattedEndDate).lt('created_at', formattedStartDate);

  if (error) {
    console.error(`Error fetching users count for date range ${startDaysAgo} to ${endDaysAgo} days ago: `, error);
    return null;
  }

  return count;
}

export async function countAllLogs() {
  const supabase = createClient();
  const { data, error, count } = await supabase.from('logs').select('*', { count: 'exact', head: true }).returns<Database['public']['Tables']['feedback']['Row'][]>();
  
  if (error) {
    console.error('Error fetching users count:', error);
    return null;
  }
  
  console.log("Supabase response:", { data, error, count });
  return count;
}

export function calculatePercentageChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}