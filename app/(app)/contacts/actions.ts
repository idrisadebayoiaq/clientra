"use server";

import { revalidatePath } from "next/cache";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function addWorkspaceContact(formData: FormData) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();
  const roleTitle = String(formData.get("roleTitle") ?? "").trim();
  const opportunityId = String(formData.get("opportunityId") ?? "").trim() || null;
  const websiteId = String(formData.get("websiteId") ?? "").trim() || null;

  if (!fullName && !email && !phone) {
    return { ok: false as const, error: "Enter a name, email, or phone" };
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false as const, error: "Enter a valid email" };
  }

  const { error } = await supabase.from("contacts").insert({
    user_id: user.id,
    opportunity_id: opportunityId,
    website_id: websiteId,
    full_name: fullName || null,
    email: email || null,
    phone: phone || null,
    website: website || null,
    role_title: roleTitle || null,
    source_reference: "manual",
    verification_status: "unverified",
  });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/contacts");
  revalidatePath("/analyze");
  if (websiteId) revalidatePath(`/analyze/${websiteId}`);
  if (opportunityId) revalidatePath(`/analyze/${opportunityId}`);
  revalidatePath("/outreach");
  return { ok: true as const };
}
