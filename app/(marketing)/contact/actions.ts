"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10).max(4000),
});

export async function submitContactInquiry(formData: FormData) {
  const parsed = schema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    company: formData.get("company") || undefined,
    message: formData.get("message"),
  });
  if (!parsed.success) {
    return { ok: false as const, error: "Please check your details and try again." };
  }

  const admin = createAdminClient();
  const { error } = await admin.from("contact_inquiries").insert({
    name: parsed.data.name,
    email: parsed.data.email,
    company: parsed.data.company ?? null,
    message: parsed.data.message,
  });
  if (error) {
    return { ok: false as const, error: "Could not send your message right now." };
  }
  return { ok: true as const };
}
