import { Link } from "@tanstack/react-router";

// The one canonical site map. Every page footer renders this row so the
// header can stay three doors wide without stranding any page.
const LINKS = [
  { to: "/board", label: "board" },
  { to: "/join", label: "join as a clipper" },
  { to: "/how-it-works", label: "how it works" },
  { to: "/payouts", label: "payouts" },
  { to: "/for-artists", label: "for artists" },
  { to: "/for-editors", label: "for editors" },
  { to: "/keynotes", label: "keynotes" },
  { to: "/clipping-campaigns", label: "clipping campaigns" },
  { to: "/tiktok-clipper", label: "tiktok clippers" },
  { to: "/managers", label: "music managers" },
  { to: "/music-management", label: "music management" },
  { to: "/list-sound", label: "list a sound" },
  { to: "/privacy", label: "privacy" },
  { to: "/terms", label: "terms" },
] as const;

export function FooterNav({ className = "" }: { className?: string }) {
  return (
    <nav
      aria-label="Footer"
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-0 md:gap-y-2 ${className}`}
    >
      {LINKS.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className="inline-flex min-h-[44px] items-center hover:text-bone md:min-h-0"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
