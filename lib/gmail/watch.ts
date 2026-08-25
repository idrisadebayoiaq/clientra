import { getServerEnv } from "@/lib/env";

export async function startGmailWatch(accessToken: string) {
  const env = getServerEnv();
  if (!env.googleProjectId || !env.googlePubsubTopic) {
    return { configured: false as const };
  }

  const topicName = env.googlePubsubTopic.startsWith("projects/")
    ? env.googlePubsubTopic
    : `projects/${env.googleProjectId}/topics/${env.googlePubsubTopic}`;

  const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/watch", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      topicName,
      labelIds: ["INBOX"],
    }),
  });

  if (!response.ok) {
    return { configured: true as const, ok: false as const };
  }

  const json = (await response.json()) as { historyId?: string; expiration?: string };
  return {
    configured: true as const,
    ok: true as const,
    historyId: json.historyId,
    expiration: json.expiration ? new Date(Number(json.expiration)).toISOString() : null,
  };
}
