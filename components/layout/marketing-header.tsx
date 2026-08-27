"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { MARKETING_NAV } from "@/lib/constants";
import { ButtonLink } from "@/components/ui/primitives";

export function MarketingHeader({ authenticated = false }: { authenticated?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-ink text-sm text-white">C</span>
          Clientra
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-ink-muted lg:flex" aria-label="Primary">
          {MARKETING_NAV.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {authenticated ? (
            <>
              <ButtonLink href="/dashboard" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Dashboard
              </ButtonLink>
              <ButtonLink href="/discover" size="sm">
                Open app
              </ButtonLink>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </ButtonLink>
              <ButtonLink href="/signup" size="sm">
                Start Finding Clients
              </ButtonLink>
            </>
          )}
          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open ? (
        <div className="border-t border-border bg-paper px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3 text-sm" aria-label="Mobile">
            {MARKETING_NAV.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>
                {item.label}
              </Link>
            ))}
            {authenticated ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Dashboard
                </Link>
                <Link href="/discover" onClick={() => setOpen(false)}>
                  Open app
                </Link>
              </>
            ) : (
              <Link href="/login" onClick={() => setOpen(false)}>
                Log in
              </Link>
            )}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
