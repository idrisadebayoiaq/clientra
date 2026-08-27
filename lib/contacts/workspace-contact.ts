import type { createClient } from "@/lib/supabase/server";
import {
  hasPublicContact,
  socialNotes,
  type ExtractedContact,
} from "@/lib/opportunities/public-contact";

type ServerClient = Awaited<ReturnType<typeof createClient>>;

export type ContactTarget = {
  websiteId?: string | null;
  opportunityId?: string | null;
};

export async function loadTargetContact(supabase: ServerClient, target: ContactTarget) {
  if (target.websiteId) {
    const { data } = await supabase
      .from("contacts")
      .select("email, phone, website, full_name, business_name, notes, verification_status")
      .eq("website_id", target.websiteId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return data;
  }
  if (target.opportunityId) {
    const { data } = await supabase
      .from("contacts")
      .select("email, phone, website, full_name, business_name, notes, verification_status")
      .eq("opportunity_id", target.opportunityId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  }
  return null;
}

export async function saveScannedContact(
  supabase: ServerClient,
  userId: string,
  target: ContactTarget,
  contact: ExtractedContact,
  source: string,
  options?: { replace?: boolean },
) {
  if (!hasPublicContact(contact) && !contact.linkedinUrl) return null;
  const replace = options?.replace ?? true;

  const { data: existing } = target.opportunityId
    ? await supabase
        .from("contacts")
        .select("id, email, phone, notes, website, full_name, business_name")
        .eq("opportunity_id", target.opportunityId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : target.websiteId
      ? await supabase
          .from("contacts")
          .select("id, email, phone, notes, website, full_name, business_name")
          .eq("website_id", target.websiteId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  const row = {
    user_id: userId,
    opportunity_id: target.opportunityId ?? null,
    website_id: target.websiteId ?? null,
    full_name: contact.fullName,
    business_name: contact.businessName,
    email: contact.email,
    phone: contact.phone,
    website: contact.website,
    notes: socialNotes(contact) || null,
    source_reference: source,
    verification_status: "unverified" as const,
  };

  if (existing) {
    await supabase
      .from("contacts")
      .update({
        email: replace ? row.email : existing.email || row.email,
        phone: replace ? row.phone : existing.phone || row.phone,
        website: replace ? row.website : existing.website || row.website,
        notes: replace ? row.notes : [existing.notes, row.notes].filter(Boolean).join("\n") || null,
        full_name: replace ? row.full_name : existing.full_name || row.full_name,
        business_name: replace ? row.business_name : existing.business_name || row.business_name,
        opportunity_id: row.opportunity_id,
        website_id: row.website_id,
      })
      .eq("id", existing.id);
    return existing.id;
  }

  const { data: inserted } = await supabase.from("contacts").insert(row).select("id").maybeSingle();
  return inserted?.id ?? null;
}
