import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/session";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMe } from "@/lib/me.functions";
import { supabase } from "@/integrations/supabase/client";
import { LogOut, Menu, X } from "lucide-react";
import { setReturnTo } from "@/lib/return-to";
import { HeaderLedger } from "@/components/LedgerCard";

// One sticky bar, three zones: seal + wordmark | the three doors | editor
// door + the one filled button. The hairline only appears once the page
// scrolls; the crimson button never collapses into the mobile drawer.
export function SiteHeader() {
  const { user, loading } = useSession();
  const meFn = useServerFn(getMe);
  const { data: me } = useQuery({
    queryKey: ["me", user?.id],
    queryFn: () => meFn(),
    enabled: !!user,
  });
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLink =
    "px-2.5 py-2 font-body text-sm font-medium text-[var(--color-bs-ink-mute)] transition hover:text-[var(--color-bs-ink)]";
  const navActive = {
    className: "px-2.5 py-2 font-body text-sm font-medium text-[var(--color-bs-ink)]",
  };
  const crimsonPill =
    "rounded-full bg-[var(--color-bs-crimson)] px-5 py-2.5 font-body text-[13.5px] font-semibold leading-none text-white transition hover:bg-[var(--color-bs-crimson-deep)]";
  const drawerLink =
    "block px-4 py-3 font-body text-base font-medium text-[var(--color-bs-ink)] hover:bg-black/5";

  const authedLinks = loading ? null : user ? (
    <>
      <Link to="/dashboard" className={navLink} activeProps={navActive}>
        Dashboard
        {typeof me?.profile?.points === "number" ? (
          <span className="ml-1.5 text-[var(--color-bs-ink-mute)]">· {me.profile.points} pts</span>
        ) : null}
      </Link>
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
    <Link
      to="/auth"
      className={navLink}
      onClick={() => setReturnTo(window.location.pathname + window.location.search)}
    >
      Sign in
    </Link>
  );

  return (
    <header
      className={`sticky top-0 z-40 bg-[var(--color-bs-paper)] transition-shadow ${
        scrolled ? "border-b border-[var(--color-bs-rule)]" : "border-b border-transparent"
      }`}
    >
      <div className="container-board flex min-h-[64px] items-center justify-between gap-3 md:grid md:grid-cols-[1fr_auto_1fr]">
        {/* Left: the seal, then the name */}
        <Link
          to="/"
          className="flex min-h-[44px] items-center gap-2.5 justify-self-start"
          onClick={() => setDrawerOpen(false)}
        >
          <img
            src="/art/great-seal.png"
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none h-9 w-9 select-none object-contain"
          />
          <span className="text-[21px] font-semibold leading-none tracking-[-0.015em] text-[var(--color-bs-ink)] [font-family:var(--font-brand)]">
            Bounty Sounds
          </span>
        </Link>

        {/* Middle: three doors (desktop only) */}
        <nav className="hidden items-center gap-3 justify-self-center md:flex">
          <Link to="/board" className={navLink} activeProps={navActive}>
            Board
          </Link>
          <Link to="/how-it-works" className={navLink} activeProps={navActive}>
            How it works
          </Link>
          <Link to="/payouts" className={navLink} activeProps={navActive}>
            Payouts
          </Link>
          <HeaderLedger />
        </nav>

        {/* Right: quiet editor door + the one filled button */}
        <div className="flex items-center gap-2 justify-self-end">
          <div className="hidden items-center gap-2 md:flex">
            <Link to="/for-editors" className={navLink} activeProps={navActive}>
              For editors
            </Link>
            {authedLinks}
          </div>
          <Link to="/list-sound" className={crimsonPill} onClick={() => setDrawerOpen(false)}>
            Post a bounty
          </Link>
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            className="-mr-2 inline-flex min-h-[44px] min-w-[44px] items-center justify-center p-2 text-[var(--color-bs-ink)] md:hidden"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
          >
            {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer: every link except the button */}
      {drawerOpen ? (
        <nav
          className="border-t border-[var(--color-bs-rule)] bg-[var(--color-bs-paper)] pb-2 md:hidden"
          aria-label="Site menu"
        >
          {[
            { to: "/board", label: "Board" },
            { to: "/how-it-works", label: "How it works" },
            { to: "/payouts", label: "Payouts" },
            { to: "/join", label: "Join as a clipper" },
            { to: "/for-editors", label: "For editors" },
          ].map((l) => (
            <Link key={l.to} to={l.to} className={drawerLink} onClick={() => setDrawerOpen(false)}>
              {l.label}
            </Link>
          ))}
          {loading ? null : user ? (
            <>
              <Link to="/dashboard" className={drawerLink} onClick={() => setDrawerOpen(false)}>
                Dashboard
                {typeof me?.profile?.points === "number" ? ` · ${me.profile.points} pts` : ""}
              </Link>
              <button
                onClick={() => {
                  setDrawerOpen(false);
                  supabase.auth.signOut();
                }}
                className={`${drawerLink} w-full text-left`}
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className={drawerLink}
              onClick={() => {
                setDrawerOpen(false);
                setReturnTo(window.location.pathname + window.location.search);
              }}
            >
              Sign in
            </Link>
          )}
        </nav>
      ) : null}
    </header>
  );
}
