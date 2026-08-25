"use client";

import { DiscoverSourceButton } from "@/components/app/discover-source-button";
import { discoverWebsites } from "@/app/(app)/discover/actions";

export function DiscoverWebsitesButton() {
  return (
    <DiscoverSourceButton
      action={discoverWebsites}
      label="Discover recent websites"
      pendingLabel="Discovering…"
    />
  );
}
