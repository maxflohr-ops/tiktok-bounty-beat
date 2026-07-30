import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { setReturnTo } from "@/lib/return-to";

// One bar, three zones: seal + wordmark | the three doors | editor door + the
// one filled button. Everything else lives in the footer.
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

  return (
    <header className="relative z-30 border-b border-[var(--color-bs-rule)] bg-[var(--color-bs-paper)]">
      <div className="container-board flex min-h-[64px] flex-col items-center gap-2 py-3 md:grid md:grid-cols-[1fr_auto_1fr] md:py-0">
        {/* Left: the seal, then the name */}
        <Link to="/" className="flex items-center gap-2.5 justify-self-start">
          <img
            src="/art/great-seal.png"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none h-9 w-9 select-none object-contain"
          />
          <span className="text-[22px] font-semibold leading-none tracking-[-0.015em] text-[var(--color-bs-ink)] [font-family:var(--font-brand)]">
            Bounty Sounds
          </span>
        </Link>

        {/* Middle: three doors, not eight */}
        <nav className="flex items-center gap-3 justify-self-center">
          <Link to="/board" className={navLink} activeProps={navActive}>Board</Link>
          <Link to="/how-it-works" className={navLink} activeProps={navActive}>How it works</Link>
          <Link to="/payouts" className={navLink} activeProps={navActive}>Payouts</Link>
        </nav>

        {/* Right: quiet editor door + the one filled button */}
        <div className="flex items-center gap-2 justify-self-end">
          <Link to="/for-editors" className={navLink} activeProps={navActive}>For editors</Link>
          {loading ? null : user ? (
            <>
              <Link to="/dashboard" className={navLink} activeProps={navActive}>
                Dashboard
                {typeof me?.profile?.points === "number" ? (
                  <span className="ml-1.5 text-[var(--color-bs-ink-mute)]">· {me.profile.points} pts</span>
                ) : null}
              </Link>
              <Link to="/list-sound" className={pill}>Post a bounty</Link>
              <button
                onClick={() => supabase.auth.signOut()}
                className="p-2 text-[var(--color-bs-ink-mute)] transition hover:text-[var(--color-bs-ink)]"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth"
                className={navLink}
                onClick={() => setReturnTo(window.location.pathname + window.location.search)}
              >
                Sign in
              </Link>
              <Link to="/list-sound" className={pill}>Post a bounty</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
