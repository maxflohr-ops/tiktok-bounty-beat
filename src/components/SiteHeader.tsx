import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, User as UserIcon } from "lucide-react";

export function SiteHeader({ artistName = "Sound Bounties" }: { artistName?: string }) {
  const { user, loading } = useSession();
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="container-editorial flex h-16 items-center justify-between">
        <Link to="/" className="flex items-baseline gap-2">
          <span className="font-display text-2xl leading-none">{artistName}</span>
          <span className="chip-brand hidden sm:inline-flex">bounties</span>
        </Link>
        <nav className="flex items-center gap-1.5 text-sm">
          <Link
            to="/"
            className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface"
            activeProps={{ className: "rounded-md px-3 py-1.5 text-ink bg-surface" }}
          >
            Bounties
          </Link>
          {me?.isStaff ? (
            <Link
              to="/admin"
              className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface"
              activeProps={{ className: "rounded-md px-3 py-1.5 text-ink bg-surface" }}
            >
              Admin
            </Link>
          ) : null}
          {loading ? null : user ? (
            <>
              <Link
                to="/dashboard"
                className="rounded-md px-3 py-1.5 text-ink-soft hover:text-ink hover:bg-surface"
                activeProps={{ className: "rounded-md px-3 py-1.5 text-ink bg-surface" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">
                    {me?.profile?.display_name || "You"}
                  </span>
                  {typeof me?.profile?.points === "number" ? (
                    <span className="chip">{me.profile.points} pts</span>
                  ) : null}
                </span>
              </Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="rounded-md p-2 text-ink-soft hover:text-ink hover:bg-surface"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="rounded-md bg-primary px-3.5 py-1.5 text-primary-foreground hover:bg-primary/90"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
