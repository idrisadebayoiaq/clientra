"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { APP_NAV } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  Briefcase,
  ChartColumn,
  CircleHelp,
  Compass,
  CreditCard,
  Globe,
  Inbox,
  Kanban,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Plug,
  Settings,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

const icons = {
  LayoutDashboard,
  Compass,
  Globe,
  MessageSquareWarning,
  Briefcase,
  Users,
  Kanban,
  Inbox,
  Megaphone,
  ChartColumn,
  Plug,
  Settings,
  CreditCard,
  CircleHelp,
};

export function AppSidebar({
  userEmail,
  unreadCount,
}: {
  userEmail?: string | null;
  unreadCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Application">
      {APP_NAV.map((item) => {
        const Icon = icons[item.icon as keyof typeof icons];
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
              active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.href === "/inbox" && unreadCount > 0 ? (
              <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <div className="flex items-center justify-between border-b border-border bg-white px-4 py-3 lg:hidden">
        <Link href="/dashboard" className="font-semibold">
          Clientra
        </Link>
        <div className="flex items-center gap-2">
          <Link href="/notifications" aria-label="Notifications" className="rounded-lg p-2 hover:bg-paper-muted">
            <Bell className="h-5 w-5" />
          </Link>
          <button type="button" className="rounded-lg p-2 hover:bg-paper-muted" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-ink/50" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-ink p-4 text-white">
            <div className="mb-6 flex items-center justify-between">
              <p className="font-semibold">Clientra</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <SidebarFooter email={userEmail} onSignOut={signOut} />
          </aside>
        </div>
      ) : null}

      <aside className="hidden w-64 shrink-0 flex-col bg-ink p-4 text-white lg:flex">
        <Link href="/dashboard" className="mb-8 flex items-center gap-2 px-2 text-lg font-semibold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-sm">C</span>
          Clientra
        </Link>
        {nav}
        <SidebarFooter email={userEmail} onSignOut={signOut} />
      </aside>
    </>
  );
}

function SidebarFooter({
  email,
  onSignOut,
}: {
  email?: string | null;
  onSignOut: () => void;
}) {
  return (
    <div className="mt-4 border-t border-white/10 pt-4">
      <p className="truncate px-2 text-xs text-white/60">{email}</p>
      <button
        type="button"
        onClick={onSignOut}
        className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  );
}
