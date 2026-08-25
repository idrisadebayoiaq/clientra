import { AppPageShell } from "@/components/app/page-shell";
import { ContactDetails } from "@/components/app/contact-details";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink, Card } from "@/components/ui/primitives";
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
            <div className="mt-2">
              <ContactDetails contact={contact} />
            </div>
            {contact.opportunity_id ? (
              <div className="mt-3">
                <ButtonLink href={`/outreach?opportunity=${contact.opportunity_id}`} size="sm">
                  Contact
                </ButtonLink>
              </div>
            ) : null}
          </Card>
        ))
      ) : (
        <EmptyState title="No contacts" description="Contacts are created from public website data or authorized enrichment providers. Nothing is invented." />
      )}
    </AppPageShell>
  );
}
