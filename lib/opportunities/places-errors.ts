export function formatGooglePlacesError(status: number, detail: string): string {
  const body = detail.toLowerCase();

  if (body.includes("api_key_service_blocked") || body.includes("permission_denied")) {
    return [
      "Google Places API (New) is not enabled for your API key.",
      "Open Google Cloud Console → APIs & Services → Library → enable “Places API (New)”.",
      "Ensure billing is on, restrict the key to Places API (New), then wait 2–5 minutes and try again.",
    ].join(" ");
  }

  if (body.includes("billing") || body.includes("billing_not_enabled")) {
    return "Google Cloud billing must be enabled for Places API. Enable billing on your Google Cloud project, then retry.";
  }

  if (status === 400 && body.includes("invalid")) {
    return "Google Places rejected the search request. Check category and location, then try again.";
  }

  if (status === 429) {
    return "Google Places rate limit reached. Wait a minute and try again.";
  }

  return `Google Places search failed (${status}). Check your API key and that Places API (New) is enabled.`;
}
