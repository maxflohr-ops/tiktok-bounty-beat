import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { BsBadge, BsEyebrow, BsMono } from "@/components/bs";
import { setReturnTo } from "@/lib/return-to";

export function SiteHeader() {
  const { user, loading } = useSession();
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });

  const navLink = "bs-mono px-3 py-2 uppercase tracking-[0.16em] text-[var(--color-bs-ink-mute)] hover:text-[var(--color-bs-ink)]";
  const navActive = { className: "bs-mono px-3 py-2 uppercase tracking-[0.16em] text-[var(--color-bs-ink)]" };

  return (
    <header className="relative z-30 border-b border-[var(--color-bs-rule)] bg-[var(--color-bs-paper)]">
      <div className="container-board flex flex-col items-center gap-2 py-5 md:flex-row md:justify-between md:py-6">
        <Link to="/" className="flex flex-col items-center gap-1 md:items-start">
          <span className="relative font-[var(--font-display)] text-2xl font-bold leading-none text-[var(--color-bs-ink)] md:text-3xl">
            <img
              src="/art/cardinal-perch.png"
              alt=""
              aria-hidden
              draggable={false}
              className="pointer-events-none absolute -top-[13px] left-0 w-7 select-none md:-top-4 md:w-8"
            />
            Bounty<span className="text-[var(--color-bs-accent)]">Sounds</span>
          </span>
          <BsEyebrow>clip sounds, streams & keynotes · get paid per view</BsEyebrow>
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-1">
          <Link to="/board" className={navLink} activeProps={navActive}>board</Link>
          {me?.isStaff ? (
            <Link to="/admin" className={navLink} activeProps={navActive}>admin</Link>
          ) : null}
          {loading ? null : user ? (
            <>
              <Link to="/dashboard" className={navLink} activeProps={navActive}>dashboard</Link>
              <Link to="/submit" className={navLink} activeProps={navActive}>submit clip</Link>
              {typeof me?.profile?.points === "number" ? (
                <BsBadge className="ml-1"><BsMono>{me.profile.points} pts</BsMono></BsBadge>
              ) : null}
              <button
                onClick={() => supabase.auth.signOut()}
                className="ml-1 p-2 text-[var(--color-bs-ink-mute)] hover:text-[var(--color-bs-ink)]"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="bs-btn ml-2"
              onClick={() => setReturnTo(window.location.pathname + window.location.search)}
            >
              sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
