import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="border-t border-border bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="text-lg font-semibold">Clientra</p>
          <p className="mt-2 text-sm text-white/70">Your AI client acquisition engine.</p>
          <p className="mt-4 text-xs text-white/50">Find the people who need what you build.</p>
        </div>
        <div>
          <p className="text-sm font-medium">Product</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
            <Link href="/features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/how-it-works">How it works</Link>
            <Link href="/use-cases">Use cases</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Company</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
            <Link href="/about">About</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-medium">Legal</p>
          <div className="mt-3 flex flex-col gap-2 text-sm text-white/70">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
