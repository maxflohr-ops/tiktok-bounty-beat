import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export function SiteHeader() {
  const { user, loading } = useSession();
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });

  return (
    <header className="relative z-30 border-b border-[var(--iron)]">
      <div className="container-board flex flex-col items-center gap-2 py-5 md:flex-row md:justify-between md:py-6">
        <Link to="/" className="flex flex-col items-center gap-1 md:items-start">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-2xl font-bold leading-none text-bone md:text-3xl">
              Bounty<span className="silver">Sounds</span>
            </span>
          </span>
          <span className="label-cap">clip sounds · get paid per view</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-1 text-bone-soft">
          <Link
            to="/board"
            className="label-cap px-3 py-2 hover:text-bone"
            activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
          >
            board
          </Link>
          {me?.isStaff ? (
            <Link
              to="/admin"
              className="label-cap px-3 py-2 hover:text-bone"
              activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
            >
              admin
            </Link>
          ) : null}
          {loading ? null : user ? (
            <>
              <Link
                to="/dashboard"
                className="label-cap px-3 py-2 hover:text-bone"
                activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
              >
                dashboard
              </Link>
              <Link
                to="/submit"
                className="label-cap px-3 py-2 hover:text-bone"
                activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
              >
                submit clip
              </Link>
              {typeof me?.profile?.points === "number" ? (
                <span className="digital-badge ml-1">
                  <span className="status-dot" />
                  {me.profile.points} pts
                </span>
              ) : null}
              <button
                onClick={() => supabase.auth.signOut()}
                className="ml-1 rounded p-2 text-bone-soft hover:text-bone"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link to="/auth" className="silver-btn ml-2">
              sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
