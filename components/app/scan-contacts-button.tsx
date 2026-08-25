"use client";

import { scanPublicContacts } from "@/app/(app)/contacts/actions";
import { DiscoverSourceButton } from "@/components/app/discover-source-button";

export function ScanContactsButton({ targetId }: { targetId: string }) {
  return (
    <DiscoverSourceButton
      action={async () => {
        const result = await scanPublicContacts(targetId);
        if (!result.ok) return { ok: false, error: result.error };
        return { ok: true, warning: result.warning };
      }}
      label="Scan public contacts"
      pendingLabel="Scanning site…"
      successLabel="Contact scan finished."
    />
  );
}
