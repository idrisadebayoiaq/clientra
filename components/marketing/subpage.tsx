import { Card } from "@/components/ui/primitives";

export default function MarketingSubpage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      <Card className="mt-8 space-y-4 p-6 text-ink-muted">{children}</Card>
    </main>
  );
}
