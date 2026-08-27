import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const { user } = await getAuthenticatedUser();

  return (
    <div className="min-h-full">
      <MarketingHeader authenticated={Boolean(user)} />
      {children}
      <MarketingFooter />
    </div>
  );
}
