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
    <header className="border-b border-border/60">
      <div className="container-board flex flex-col items-center gap-2 py-6 md:flex-row md:justify-between md:py-8">
        <Link to="/" className="flex flex-col items-center gap-0.5 md:items-start">
          <span className="label-cap text-bone-soft">The Harbormaster's</span>
          <span className="font-display text-3xl leading-none tracking-wider text-bone md:text-4xl">
            T H E &nbsp; B O A R D
          </span>
          <span className="script-note text-silver-glow">notices posted daily</span>
        </Link>
        <nav className="flex items-center gap-1 text-bone-soft">
          <Link
            to="/"
            className="label-cap px-3 py-2 hover:text-bone"
            activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
            activeOptions={{ exact: true }}
          >
            the board
          </Link>
          {me?.isStaff ? (
            <Link
              to="/admin"
              className="label-cap px-3 py-2 hover:text-bone"
              activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
            >
              harbormaster
            </Link>
          ) : null}
          {loading ? null : user ? (
            <>
              <Link
                to="/dashboard"
                className="label-cap px-3 py-2 hover:text-bone"
                activeProps={{ className: "label-cap px-3 py-2 text-bone" }}
              >
                my contracts
              </Link>
              {typeof me?.profile?.points === "number" ? (
                <span className="silver label-cap ml-1 border border-silver/40 px-2 py-1">
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
              sign the ledger
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
