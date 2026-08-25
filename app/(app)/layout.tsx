import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { Bell } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user } = await getAuthenticatedUser();
  if (!user) redirect("/login");

  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile && !profile.onboarding_completed && pathname !== "/onboarding") {
    redirect("/onboarding");
  }

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <div className="flex min-h-full bg-paper">
      <AppSidebar userEmail={profile?.email ?? user.email} unreadCount={unreadCount ?? 0} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden items-center justify-end gap-3 border-b border-border bg-white px-6 py-3 lg:flex">
          <Link
            href="/notifications"
            className="relative rounded-lg p-2 text-ink-muted hover:bg-paper-muted hover:text-ink"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {(unreadCount ?? 0) > 0 ? (
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-accent" />
            ) : null}
          </Link>
          <span className="text-sm text-ink-muted">{profile?.full_name ?? user.email}</span>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
