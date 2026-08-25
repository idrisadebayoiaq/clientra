import { AppPageShell } from "@/components/app/page-shell";
import { EmptyState } from "@/components/ui/feedback";
import { Card } from "@/components/ui/primitives";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function ContactsPage() {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) return null;
  const { data } = await supabase.from("contacts").select("*").order("created_at", { ascending: false });
  return (
    <AppPageShell title="Contacts" description="Only publicly available or authorized contact details are stored. Unverified fields stay labeled.">
      {data?.length ? (
        data.map((contact) => (
          <Card key={contact.id} className="p-4">
            <p className="font-medium">{contact.full_name ?? contact.business_name ?? "Unnamed"}</p>
            <p className="text-sm text-ink-muted">
              {contact.email ?? "No public email"} · {contact.verification_status}
              {contact.source_reference ? ` · ${contact.source_reference}` : ""}
            </p>
          </Card>
        ))
      ) : (
        <EmptyState title="No contacts" description="Contacts are created from public website data or authorized enrichment providers. Nothing is invented." />
      )}
    </AppPageShell>
  );
}
