import { MarketingHeader } from "@/components/layout/marketing-header";
import { MarketingFooter } from "@/components/layout/marketing";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full">
      <MarketingHeader />
      {children}
      <MarketingFooter />
    </div>
  );
}
