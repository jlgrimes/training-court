"use client";

import useSWR from "swr";

import { CardUsageLogRow } from "@/components/premium/card-usage/CardUsage.types";
import { createClient } from "@/utils/supabase/client";

const fetchCardUsageLogs = async (userId: string | undefined) => {
  if (!userId) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("logs")
    .select("archetype,created_at,decklist_id,format,id,log,opp_archetype,result,turn_order")
    .eq("user", userId)
    .order("created_at", { ascending: false })
    .limit(1000)
    .returns<CardUsageLogRow[]>();

  if (error) {
    console.error("Card usage logs query failed", error);
    return [];
  }

  return data ?? [];
};

export const useCardUsageLogs = (userId: string | undefined) => {
  return useSWR(["card-usage-logs", userId], () => fetchCardUsageLogs(userId));
};
