import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database";

export type JobName =
  | "website_discovery"
  | "opportunity_refresh"
  | "lead_scoring"
  | "gmail_watch_renewal"
  | "follow_up_send"
  | "ai_processing"
  | "notifications";

export async function enqueueJob(jobName: JobName, payload: Record<string, unknown> = {}, runAfter?: Date) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("job_runs")
    .insert({
      job_name: jobName,
      payload: payload as Json,
      run_after: (runAfter ?? new Date()).toISOString(),
      status: "queued",
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}
