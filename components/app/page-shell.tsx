import { EmptyState, NotConfiguredState, PageHeader } from "@/components/ui/feedback";
import { ButtonLink, Card } from "@/components/ui/primitives";
import type { ReactNode } from "react";

export function AppPageShell({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} actions={actions} />
      {children}
    </div>
  );
}

export function SourceNotReady({
  source,
  description,
  ready = false,
}: {
  source: string;
  description: string;
  ready?: boolean;
}) {
  if (ready) {
    return (
      <EmptyState
        title={`No ${source.toLowerCase()} imported yet`}
        description={description}
        action={<ButtonLink href="/discover">Open Discover</ButtonLink>}
      />
    );
  }

  return (
    <div className="space-y-4">
      <NotConfiguredState title={`${source} is not configured`} description={description} />
      <EmptyState
        title="No live records"
        description="This workspace is ready. When an official API is connected, results will appear here. Demo records will always be labeled DEMO."
        action={<ButtonLink href="/integrations">Review integrations</ButtonLink>}
      />
    </div>
  );
}

export function MetricGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-sm text-ink-muted">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold">{item.value}</p>
        </Card>
      ))}
    </div>
  );
}
