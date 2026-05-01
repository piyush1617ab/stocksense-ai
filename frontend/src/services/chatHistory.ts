/**
 * Chat history persistence — Supabase-backed.
 * Anonymous users get no persistence (functions return null/empty).
 */

import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  title: string;
  updated_at: string;
}

export interface StoredMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export async function listConversations(): Promise<Conversation[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, title, updated_at")
    .order("updated_at", { ascending: false });
  if (error) {
    console.error("[chatHistory] list", error);
    return [];
  }
  return data ?? [];
}

export async function listMessages(conversationId: string): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[chatHistory] messages", error);
    return [];
  }
  return (data ?? []) as StoredMessage[];
}

export async function createConversation(title: string): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const trimmed = title.slice(0, 60) || "New chat";
  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({ user_id: user.id, title: trimmed })
    .select("id")
    .single();
  if (error) {
    console.error("[chatHistory] create", error);
    return null;
  }
  return data.id;
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    user_id: user.id,
    role,
    content,
  });
  if (error) console.error("[chatHistory] save", error);
  // Bump conversation updated_at
  await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const { error } = await supabase.from("chat_conversations").delete().eq("id", conversationId);
  if (error) console.error("[chatHistory] delete", error);
}
