import { createClient } from "@/lib/supabase/client";
import type { MetaAdsDailyInput, MetaAdsDailyRecord } from "./types";

function getClient() {
  return createClient();
}

export async function fetchAllEntries(): Promise<MetaAdsDailyRecord[]> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("meta_ads_daily")
    .select("*")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as MetaAdsDailyRecord[]) ?? [];
}

export async function upsertEntry(
  input: MetaAdsDailyInput,
  userId: string
): Promise<MetaAdsDailyRecord> {
  const supabase = getClient();
  const { data, error } = await supabase
    .from("meta_ads_daily")
    .upsert(
      {
        user_id: userId,
        date: input.date,
        amount_spent: input.amount_spent,
        link_clicks: input.link_clicks,
        leads: input.leads,
        calls: input.calls,
        cpl: input.cpl,
        synced_from_meta: input.synced_from_meta ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as MetaAdsDailyRecord;
}

export async function deleteEntry(id: string): Promise<void> {
  const supabase = getClient();
  const { error } = await supabase.from("meta_ads_daily").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
