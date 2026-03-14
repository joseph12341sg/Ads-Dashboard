import type { SupabaseClient } from "@supabase/supabase-js";
import type { Client, IntakeLink } from "./types";

export async function fetchClients(
  supabase: SupabaseClient
): Promise<Client[]> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("status", { ascending: true })
    .order("business_name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Client[];
}

export async function fetchClient(
  supabase: SupabaseClient,
  id: string
): Promise<Client | null> {
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Client;
}

export async function updateClient(
  supabase: SupabaseClient,
  id: string,
  updates: Partial<Client>
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function insertClient(
  supabase: SupabaseClient,
  client: Partial<Client>
): Promise<Client> {
  const { data, error } = await supabase
    .from("clients")
    .insert(client)
    .select()
    .single();

  if (error) throw error;
  return data as Client;
}

export async function deleteClient(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) throw error;
}

export async function createIntakeLink(
  supabase: SupabaseClient,
  userId: string,
  token: string
): Promise<IntakeLink> {
  const expiresAt = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("intake_links")
    .insert({
      user_id: userId,
      token,
      expires_at: expiresAt,
      used: false,
    })
    .select()
    .single();

  if (error) throw error;
  return data as IntakeLink;
}

export async function uploadClientLogo(
  supabase: SupabaseClient,
  clientId: string,
  file: File
): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${clientId}/logo.${ext}`;

  const { error } = await supabase.storage
    .from("client-logos")
    .upload(path, file, { upsert: true });

  if (error) throw error;

  const {
    data: { publicUrl },
  } = supabase.storage.from("client-logos").getPublicUrl(path);

  return publicUrl;
}
