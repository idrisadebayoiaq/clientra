import { AppPageShell } from "@/components/app/page-shell";
import { ButtonLink, Card } from "@/components/ui/primitives";

export default function HelpPage() {
  return (
    <AppPageShell title="Help" description="Clientra is a client acquisition engine, not a freelancer marketplace.">
      <Card className="space-y-3 p-5 text-sm text-ink-muted">
        <p>Use Discover for a combined feed, Website Opportunities for newly detected sites, and Problem Opportunities for public requests.</p>
        <p>Analyze a website before outreach. Scores are estimates, not guarantees.</p>
        <p>Connect Gmail only through Google OAuth. Never share your Gmail password.</p>
        <p>Automatic follow-ups and automatic replies stay off until you enable them in onboarding or settings.</p>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-semibold">Public site crawl (built in)</h2>
        <p className="text-ink-muted">
          On a company website analysis page, click <strong>Scan public contacts</strong> or <strong>Run analysis</strong>.
          Clientra reads the homepage plus contact/about/team pages for public emails, phones, and LinkedIn.
          No API key required.
        </p>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-semibold">Hacker News / Algolia (already live)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-ink-muted">
          <li>Open Problem Opportunities.</li>
          <li>Click Discover recent posts.</li>
          <li>Clientra calls the public HN Algolia API. No signup and no key.</li>
        </ol>
        <ButtonLink href="/problems" size="sm">
          Open Problem Opportunities
        </ButtonLink>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-semibold">Omkar contact scraper (optional)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-ink-muted">
          <li>
            Create a free key at{" "}
            <a className="underline" href="https://www.omkar.cloud/auth/sign-up?redirect=/api-key" target="_blank" rel="noreferrer">
              omkar.cloud
            </a>
            , or self-host{" "}
            <a className="underline" href="https://github.com/omkarcloud/website-email-contact-scraper" target="_blank" rel="noreferrer">
              the open-source scraper
            </a>
            .
          </li>
          <li>
            On Vercel → Environment Variables, set <code>OMKAR_API_KEY</code> to the same key as local{" "}
            <code>.env</code>. Clientra sends it as the <code>API-Key</code> header to{" "}
            <code>/website-email-contact/v1/contacts</code>.
          </li>
          <li>Redeploy, then use Scan public contacts on a company domain. Local crawl runs first, then Omkar.</li>
        </ol>
      </Card>

      <Card className="space-y-3 p-5 text-sm">
        <h2 className="font-semibold">SmartScan (manual only)</h2>
        <ol className="list-decimal space-y-2 pl-5 text-ink-muted">
          <li>
            Open{" "}
            <a className="underline" href="https://smartscan.tools/" target="_blank" rel="noreferrer">
              smartscan.tools
            </a>{" "}
            in your browser (no Clientra API for this tool).
          </li>
          <li>Paste the company URL and run a scan.</li>
          <li>Copy any public email/phone you find into Clientra with Add contact on the analyze page.</li>
        </ol>
      </Card>
    </AppPageShell>
  );
}
