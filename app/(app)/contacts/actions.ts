"use server";

import { revalidatePath } from "next/cache";
import { shouldPersistWebsite } from "@/lib/opportunities/domains";
import {
  enrichWebsiteContact,
  hasPublicContact,
} from "@/lib/opportunities/public-contact";
import { saveScannedContact } from "@/lib/contacts/workspace-contact";
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

export async function scanPublicContacts(targetId: string) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return { ok: false as const, error: "Sign in required" };

  const { data: website } = await supabase.from("websites").select("*").eq("id", targetId).maybeSingle();
  const { data: opportunity } = website
    ? await supabase
        .from("opportunities")
        .select("*")
        .eq("website_id", website.id)
        .order("discovered_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : await supabase.from("opportunities").select("*").eq("id", targetId).maybeSingle();

  if (!website && !opportunity) return { ok: false as const, error: "Nothing to scan" };

  const domain = website?.domain ?? opportunity?.domain ?? null;
  const url = website?.url ?? (domain ? `https://${domain}` : null);
  if (!url || !shouldPersistWebsite(domain)) {
    return {
      ok: false as const,
      error: "Public contact crawl needs a company website domain. Job ads without a site cannot be crawled.",
    };
  }

  const contact = await enrichWebsiteContact(url, domain);
  if (!hasPublicContact(contact) && !contact.linkedinUrl) {
    return {
      ok: true as const,
      found: false as const,
      warning: "No public email, phone, or LinkedIn was found on the company site.",
    };
  }

  const websiteId = website?.id ?? opportunity?.website_id ?? null;
  const opportunityId = opportunity?.id ?? null;
  await saveScannedContact(
    supabase,
    user.id,
    { websiteId, opportunityId },
    {
      ...contact,
      businessName: contact.businessName ?? website?.business_name ?? opportunity?.company_name ?? null,
      website: contact.website ?? url,
    },
    opportunity?.source ?? "manual",
    { replace: true },
  );

  if (opportunityId) {
    await supabase.from("opportunities").update({ contact_available: hasPublicContact(contact) }).eq("id", opportunityId);
  }
  if (websiteId && contact.email) {
    await supabase.from("websites").update({ has_email: true }).eq("id", websiteId);
  }

  revalidatePath("/contacts");
  revalidatePath("/analyze");
  revalidatePath(`/analyze/${targetId}`);
  if (websiteId) revalidatePath(`/analyze/${websiteId}`);
  if (opportunityId) revalidatePath(`/analyze/${opportunityId}`);
  revalidatePath("/outreach");

  return {
    ok: true as const,
    found: true as const,
    warning: contact.email
      ? `Saved public contact: ${contact.email}.`
      : "Saved public phone or LinkedIn from the company site.",
  };
}
