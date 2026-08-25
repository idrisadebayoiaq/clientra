"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function updateProfileName(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };
  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { ok: false as const, error: "Enter the name that should appear on emails." };

  const { error } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", user.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/settings/profile");
  revalidatePath("/outreach");
  return { ok: true as const };
}
