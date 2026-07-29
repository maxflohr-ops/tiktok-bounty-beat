import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Reveal } from "@/components/Reveal";

const TITLE = "Keynote Clipping Campaigns · Bounty Sounds";
const DESC =
  "Turn a keynote into a thousand cuts. Fund a pot for your own footage, clippers compete to find the moments, and verified views pay out. Public board, checked deliveries.";

export const Route = createFileRoute("/keynotes")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://bountysounds.com/keynotes" }],
  }),
  component: KeynotesPage,
});

function KeynotesPage() {
  return (
    <div className="relative min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="container-board pt-20 pb-24 text-center md:pt-28 md:pb-32">
        <p className="label-cap">Keynote campaigns</p>
        <h1 className="mx-auto mt-4 max-w-3xl text-5xl leading-[1.05] md:text-7xl">
          Your keynote.
          <br />
          A thousand cuts.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-xl text-bone-soft">
          The best ninety seconds of your announcement shouldn't stay trapped in a
          two-hour video. Fund a pot. Clippers find the moments. Verified views pay out.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/list-sound" className="silver-btn px-7">
            Run a keynote campaign
          </Link>
          <Link to="/board" className="ink-btn px-7">
            See the board
          </Link>
        </div>
        <p className="mt-4 text-sm text-bone-soft">Your footage. Your rate. Pay only for verified views.</p>
      </section>

      {/* Why keynotes clip — black band */}
      <section className="bg-[#000] py-24 text-center text-white md:py-32">
        <div className="container-board">
        <Reveal>
          <p className="label-cap text-[#86868b]">Why it works</p>
          <h2 className="mx-auto mt-4 max-w-2xl text-4xl leading-tight text-white md:text-6xl">
            Launch day is a clip economy.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg text-[#a1a1a6]">
            Every big announcement gets clipped within hours, by strangers, for free,
            with no brief and no rights. A campaign puts you in charge of it:
            your footage, your talking points, a hundred editors racing to make
            the version that travels.
          </p>
          <div className="mx-auto mt-12 grid max-w-3xl gap-px overflow-hidden rounded-2xl bg-[#333] sm:grid-cols-3">
            <div className="bg-[#111] p-8">
              <p className="text-3xl font-semibold text-white">Fund</p>
              <p className="mt-2 text-sm text-[#a1a1a6]">a pot on your own keynote footage.</p>
            </div>
            <div className="bg-[#111] p-8">
              <p className="text-3xl font-semibold text-white">Brief</p>
              <p className="mt-2 text-sm text-[#a1a1a6]">the moments, the tone, the don'ts.</p>
            </div>
            <div className="bg-[#111] p-8">
              <p className="text-3xl font-semibold text-white">Approve</p>
              <p className="mt-2 text-sm text-[#a1a1a6]">payouts against verified views only.</p>
            </div>
          </div>
        </Reveal>
        </div>
      </section>

      {/* Example campaign — gray band, clearly fictional */}
      <section className="bg-[var(--wall-2)] py-24 md:py-28">
        <div className="container-board">
          <div className="text-center">
            <h2 className="text-4xl md:text-5xl">What a fulfilled campaign looks like.</h2>
            <p className="mx-auto mt-4 max-w-xl text-bone-soft">
              An illustrative example.{" "}
              <span className="font-semibold">Meridian is a fictional company</span>. When the
              first real keynote campaign settles, its numbers replace these.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-white p-8 md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-4">
              <div>
                <p className="label-cap">Example campaign</p>
                <p className="mt-1 text-2xl font-semibold">Meridian — Developer Keynote '26</p>
              </div>
              <span className="wax-seal static">Fulfilled · Example</span>
            </div>

            <p className="mt-5 text-sm text-bone-soft">
              Brief: cut the wearable reveal and the on-stage demo fail recovery. Keep the
              crowd audio. No logo overlays. 9:16 only, subtitles required.
            </p>

            <div className="mt-7 grid grid-cols-2 gap-y-6 text-left sm:grid-cols-4">
              <div>
                <p className="text-2xl font-semibold tabular-nums">$5,000</p>
                <p className="mt-0.5 text-xs text-bone-soft">funded pot</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">$25</p>
                <p className="mt-0.5 text-xs text-bone-soft">per 100k verified views</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">61</p>
                <p className="mt-0.5 text-xs text-bone-soft">clips approved of 84 delivered</p>
              </div>
              <div>
                <p className="text-2xl font-semibold tabular-nums">12.4M</p>
                <p className="mt-0.5 text-xs text-bone-soft">verified views in 30 days</p>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-between rounded-xl bg-[var(--wall-2)] px-5 py-4">
              <span className="text-sm text-bone-soft">Paid out to clippers</span>
              <span className="text-xl font-semibold tabular-nums">$3,100</span>
            </div>
            <p className="mt-3 text-xs text-bone-soft">
              Unspent pot returned. Every delivery checked against the clipper's own account;
              every payout approved against verified views.
            </p>
          </div>
        </div>
      </section>

      {/* Rights — white band */}
      <section className="container-board py-24 text-center md:py-28">
        <h2 className="mx-auto max-w-2xl text-4xl leading-tight md:text-5xl">
          You own the keynote.
          <br />
          We handle the clipping.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-lg text-bone-soft">
          Keynote campaigns run on footage you own or control: your launch, your
          conference, your talk. The brief travels with the contract, so every clipper
          knows the rules before the first cut.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link to="/list-sound" className="silver-btn px-7">
            Start a campaign
          </Link>
          <Link to="/clipping-campaigns" className="ink-btn px-7">
            How campaigns work
          </Link>
        </div>
      </section>

      <footer className="border-t border-[var(--border)]">
        <div className="container-board flex flex-col items-center gap-3 py-10 text-center text-xs text-bone-soft">
          <nav aria-label="Footer" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <Link to="/board" className="hover:text-bone">Board</Link>
            <Link to="/for-artists" className="hover:text-bone">For artists</Link>
            <Link to="/for-editors" className="hover:text-bone">For editors</Link>
            <Link to="/keynotes" className="hover:text-bone">Keynotes</Link>
            <Link to="/clipping-campaigns" className="hover:text-bone">Clipping campaigns</Link>
            <Link to="/list-sound" className="hover:text-bone">List a sound</Link>
          </nav>
          <span>© {new Date().getFullYear()} Bounty Sounds</span>
        </div>
      </footer>
    </div>
  );
}
