import { ButtonLink, Card } from "@/components/ui/primitives";
import { MarketingAuthCta } from "@/components/marketing/auth-cta";
import type { ReactNode } from "react";

export function MarketingHero({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <p className="text-sm font-medium tracking-wide text-accent-hover">{eyebrow}</p>
        <h1 className="font-display mt-4 max-w-4xl text-4xl leading-tight sm:text-6xl">{title}</h1>
        <p className="mt-6 max-w-2xl text-lg text-white/70">{description}</p>
        {children ? <div className="mt-8">{children}</div> : null}
      </div>
    </section>
  );
}

export function MarketingSection({
  title,
  eyebrow,
  children,
  id,
}: {
  title: string;
  eyebrow?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      {eyebrow ? <p className="text-xs font-semibold uppercase tracking-wider text-accent">{eyebrow}</p> : null}
      <h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function FeatureGrid({
  items,
}: {
  items: { title: string; body: string }[];
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <Card key={item.title} className="p-6">
          <h3 className="text-lg font-semibold">{item.title}</h3>
          <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
        </Card>
      ))}
    </div>
  );
}

export async function FinalCta({ title }: { title: string }) {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display max-w-3xl text-3xl sm:text-4xl">{title}</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <MarketingAuthCta size="lg" />
          <ButtonLink href="/pricing" size="lg" variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
            View pricing
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
