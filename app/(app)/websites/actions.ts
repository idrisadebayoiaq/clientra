"use server";

import { discoverJobs, discoverWebsites } from "@/app/(app)/discover/actions";

export async function discoverWebsitesAction() {
  return discoverWebsites();
}

export { discoverJobs, discoverWebsites };
