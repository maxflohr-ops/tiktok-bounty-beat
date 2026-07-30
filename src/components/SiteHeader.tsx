import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { setReturnTo } from "@/lib/return-to";

// The App Bar: calm serif frame around the hand-drawn interior.
// Sage stays the only accent; the cardinal keeps its perch on the b.
export function SiteHeader() {
  const { user, loading } = useSession();
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });

  const navLink =
    "px-2.5 py-2 font-body text-sm font-medium text-[var(--color-bs-ink-mute)] transition hover:text-[var(--color-bs-ink)]";
  const navActive = { className: "px-2.5 py-2 font-body text-sm font-medium text-[var(--color-bs-ink)]" };
  const pill =
    "rounded-full bg-[var(--color-bs-accent)] px-5 py-2.5 font-body text-[13.5px] font-semibold leading-none text-white transition hover:brightness-110";
  const ghostPill =
    "rounded-full border border-[var(--color-bs-rule)] px-4 py-2.5 font-body text-[13.5px] font-medium leading-none text-[var(--color-bs-ink)] transition hover:bg-black/5";

  return (
    <header className="relative z-30 border-b border-[var(--color-bs-rule)] bg-[var(--color-bs-paper)]">
      <div className="container-board flex min-h-[64px] flex-col items-center gap-2 py-3 md:flex-row md:justify-between md:py-0">
        <Link
          to="/"
          className="relative text-2xl font-semibold lowercase leading-none tracking-[-0.015em] text-[var(--color-bs-ink)] [font-family:var(--font-brand)]"
        >
          <img
            src="/art/cardinal-perch.png"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute -top-[15px] left-0 w-7 select-none"
          />
          bounty sounds
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-1 md:gap-3">
          <Link to="/board" className={navLink} activeProps={navActive}>Board</Link>
          <Link to="/payouts" className={navLink} activeProps={navActive}>Payouts</Link>
          <Link to="/for-artists" className={navLink} activeProps={navActive}>For artists</Link>
          <Link to="/for-editors" className={navLink} activeProps={navActive}>For clippers</Link>
          {loading ? null : user ? (
            <>
              <Link to="/dashboard" className={`${ghostPill} ml-1`}>
                Dashboard
                {typeof me?.profile?.points === "number" ? (
                  <span className="ml-2 text-[var(--color-bs-ink-mute)]">{me.profile.points} pts</span>
                ) : null}
              </Link>
              <Link to="/submit" className={`${pill} ml-1`}>Submit clip</Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="ml-1 p-2 text-[var(--color-bs-ink-mute)] transition hover:text-[var(--color-bs-ink)]"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className={`${pill} ml-1`}
              onClick={() => setReturnTo(window.location.pathname + window.location.search)}
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
