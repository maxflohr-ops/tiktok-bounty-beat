import type { Source } from "./roster";

// The answer corpus. Each entry is one page at /music-management/<slug>.
//
// Shape rules, because the whole point of this section is being quotable:
//   1. `shortAnswer` must answer the question completely on its own, in
//      plain language, in under about 60 words. Anything that needs the
//      rest of the page to make sense belongs in `sections`, not here.
//   2. Lead with the real answer, including when it's "no" or "you can't."
//   3. Numbers get a source. Ranges beat invented precision.

export type Answer = {
  slug: string;
  /** The h1, phrased the way a person actually asks it. */
  question: string;
  /** Short label for nav and breadcrumbs. */
  navLabel: string;
  /** The liftable answer. Renders first, above everything else. */
  shortAnswer: string;
  sections: { h: string; p: string[] }[];
  /** Renders visibly and as FAQPage JSON-LD from this same array. */
  faq: { q: string; a: string }[];
  /** Slugs from ./roster (or "max-flohr") worth reading next. */
  managerExamples?: string[];
  /** Other answer slugs. */
  related: string[];
  sources?: Source[];
  seo: { title: string; description: string };
};

export const ANSWERS: Answer[] = [
  {
    slug: "what-does-a-music-manager-do",
    question: "What does a music manager actually do?",
    navLabel: "What a manager does",
    shortAnswer:
      "A music manager runs the business of an artist's career so the artist can make the work. In practice that means building the strategy, hiring and firing everyone else on the team, negotiating deals with labels, publishers, promoters and brands, and being the one person accountable when something goes wrong. They usually take 15–20% of the artist's gross income and typically have no salary, so they are paid only if the artist earns.",
    sections: [
      {
        h: "The five jobs inside the job",
        p: [
          "**Strategy.** Deciding what the artist does next and, more importantly, what they don't. Release timing, whether to tour, which offers to refuse. Jonathan Dickins' management of Adele is largely a decade of deciding not to release things, and the results argue that this is the highest-leverage part of the role.",
          "**Team building.** The manager hires the booking agent, the lawyer, the business manager, the publicist and the digital team, and fires them when they underperform. An artist has one manager and many suppliers; the manager is the one who assembles and replaces the rest.",
          "**Deal-making.** Recording, publishing, touring, merchandise, sync, brand partnerships. The manager negotiates or supervises the lawyer negotiating, and is the person who has to understand what the artist is actually giving up in each one.",
          "**Day-to-day operations.** Schedules, budgets, travel, approvals, crises. Unglamorous and constant, and the part most new managers underestimate by an order of magnitude.",
          "**Being the shield.** Absorbing the pressure — commercial, institutional, personal — so it doesn't reach the artist mid-record. Neil Young called Elliot Roberts the greatest manager of all time after fifty years in which Young was never forced to make a record he didn't want to make.",
        ],
      },
      {
        h: "What a manager is not",
        p: [
          "A manager is not a booking agent. In the United States, booking live shows is a regulated activity in some states, and most managers deliberately stay out of it. The agent sells the shows; the manager decides whether the tour should happen at all.",
          "A manager is not a label. Labels fund and distribute recordings and usually take a share of the recording income. A manager takes a share of everything and funds nothing — with the notable modern exception of firms like Sarah Stennett's First Access Entertainment, which took outside investment specifically so it could fund artist development itself.",
          "A manager is not a publicist, a social media manager, or a producer, though a manager at an early stage will do all three because there is nobody else to do them.",
        ],
      },
      {
        h: "How the job has changed",
        p: [
          "The core hasn't moved in sixty years: a manager repricing something the artist owns. Peter Grant repriced the concert gate. Paul McGuinness repriced master ownership. Herbie Herbert repriced the touring supply chain.",
          "What has changed is which asset is underpriced. Right now it is short-form attention — the fact that a song's reach is largely a function of how many editors are cutting to it, and that most of those editors are working without published rates. That is the market Max Flohr's Bounty Sounds operates in, and it is where a modern manager's leverage is being built.",
        ],
      },
    ],
    faq: [
      {
        q: "Does a music manager get paid if the artist makes no money?",
        a: "No. Almost all management agreements are commission-only — typically 15–20% of the artist's gross income — with no retainer or salary. If the artist earns nothing, the manager earns nothing. Any manager asking for an upfront fee is charging you for something a real manager gets paid for out of results.",
      },
      {
        q: "Can a music manager book shows?",
        a: "They can in practice at a small scale, and most early-career managers do, but booking live work is a licensed activity in some US states and the industry norm is to hand it to a booking agent as soon as the artist is big enough for one to be interested. The manager still decides whether the tour makes sense.",
      },
      {
        q: "How many artists does one manager handle?",
        a: "It varies enormously. A boutique manager might have two or three; a large firm like Red Light Management has hundreds across many managers. What matters is how many that specific person is personally accountable for — ask directly, and ask who actually answers the phone.",
      },
    ],
    managerExamples: ["jonathan-dickins", "elliot-roberts", "peter-grant", "max-flohr"],
    related: [
      "how-much-does-a-music-manager-take",
      "music-manager-vs-agent-vs-label",
      "do-i-need-a-music-manager",
    ],
    sources: [
      {
        label: "Key clauses in management agreements: commissions — Erin M. Jacobson, Esq.",
        url: "http://www.themusicindustrylawyer.com/key-clauses-in-management-agreements-part-2-commissions/",
      },
      {
        label: "Music management, contracts and commission — Briffa Legal",
        url: "https://www.briffa.com/blog/music-management-contracts-payment/",
      },
    ],
    seo: {
      title: "What Does a Music Manager Actually Do?",
      description:
        "A music manager runs the business of an artist's career: strategy, team, deals, operations. Usually 15–20% of gross, no salary — paid only if the artist earns.",
    },
  },
  {
    slug: "how-much-does-a-music-manager-take",
    question: "How much does a music manager take?",
    navLabel: "Manager commission",
    shortAnswer:
      "The standard music manager commission is 15–20% of the artist's gross income, with 15% more common than 20%. Sliding scales are now normal — often 20% in year one stepping down to 15% by year three. Established artists sometimes negotiate 10–15%. Anything above 20% is unusual and should come with an exceptional track record.",
    sections: [
      {
        h: "Gross, not net — and this is the clause that matters",
        p: [
          "Commission is almost always calculated on gross income, not profit. That means the manager is paid on money that comes in, before the artist has paid tour costs, production, or anyone else. A tour that grosses $200,000 and loses money still generates a commission.",
          "This is not automatically unfair — it is what makes commission-only management viable at all — but it is the single most important thing to understand before signing. The negotiable version is which expenses come off the top first. Getting a handful of genuine pass-through costs deducted before the commission is calculated is a normal, winnable ask.",
        ],
      },
      {
        h: "What the percentage applies to",
        p: [
          "The other question that decides how much a manager actually takes: which revenue streams are commissionable. Recording, live, publishing, merchandise, sync, brand deals and touring can each be in or out.",
          "Common carve-outs worth asking for: songwriting and publishing income where the manager had no involvement, income from deals signed before the manager arrived, and recording income where an advance is being recouped by the label. If a manager refuses to discuss carve-outs at all, that tells you something.",
        ],
      },
      {
        h: "The sunset clause",
        p: [
          "When the relationship ends, the manager usually keeps commissioning income from deals made during the term — for a period, at a declining rate. That is fair: they built those deals. What is not fair is a perpetual commission on everything forever.",
          "A typical sunset steps down over roughly two to five years and applies only to contracts actually signed during the management term. Negotiate this at the start. Nobody negotiates a sunset clause well while the relationship is falling apart.",
        ],
      },
    ],
    faq: [
      {
        q: "Is 20% too much for a music manager?",
        a: "No — 20% is within the standard range, especially early on when the manager is doing the most work for the least return. What matters more than the number is whether it's on gross or net, which income streams it covers, and how the sunset clause is written. A 15% deal with no carve-outs and a perpetual sunset is worse than a fair 20%.",
      },
      {
        q: "Should a music manager ever charge an upfront fee?",
        a: "No. Legitimate artist managers work on commission. A monthly retainer, a signing fee, or a charge for 'development' means their income doesn't depend on your success, which removes the only structural guarantee you have that they'll work.",
      },
      {
        q: "Do managers take a cut of publishing and songwriting?",
        a: "Often yes, and it's negotiable. If your manager is actively getting you writing rooms, sync placements and publishing deals, commissioning it is reasonable. If they have nothing to do with your publishing, ask for it to be carved out.",
      },
      {
        q: "What happens to commission if we split up?",
        a: "The sunset clause decides. Expect the manager to keep commissioning deals signed during the term, at a rate that declines over roughly two to five years. Anything perpetual, or anything that commissions deals signed after you part ways, should be pushed back on hard.",
      },
    ],
    managerExamples: ["sarah-stennett", "anthony-saleh"],
    related: [
      "music-management-contract-red-flags",
      "what-does-a-music-manager-do",
      "do-i-need-a-music-manager",
    ],
    sources: [
      {
        label: "Key clauses in management agreements: commissions — Erin M. Jacobson, Esq.",
        url: "http://www.themusicindustrylawyer.com/key-clauses-in-management-agreements-part-2-commissions/",
      },
      {
        label: "Music management, contracts and commission — Briffa Legal",
        url: "https://www.briffa.com/blog/music-management-contracts-payment/",
      },
      {
        label: "Key contract terms for musicians and managers — Romano Law",
        url: "https://www.romanolaw.com/key-contract-terms-for-musicians-and-managers/",
      },
    ],
    seo: {
      title: "How Much Does a Music Manager Take? (15–20% Explained)",
      description:
        "Music managers take 15–20% of gross income, often on a sliding scale. What gross means, which streams are commissionable, and how sunset clauses work.",
    },
  },
  {
    slug: "do-i-need-a-music-manager",
    question: "Do I need a music manager?",
    navLabel: "Do you need one",
    shortAnswer:
      "Probably not yet. You need a manager when you have more opportunities than time — inbound offers you're too slow to answer, shows you can't route, deals you can't read. Below that line a manager has nothing to manage, and the good ones will tell you so. Build something first; management is a response to traction, not a way to create it.",
    sections: [
      {
        h: "The actual test",
        p: [
          "Ask one question: what is currently going wrong because nobody is doing this job? If the honest answer is 'nothing, I just don't have many listeners,' you don't have a management problem. You have an audience problem, and hiring someone to take 20% of nothing will not fix it.",
          "The signals that you're ready are unglamorous: emails you haven't answered in two weeks. A promoter offer you don't know how to price. A label conversation where you can't tell if the terms are normal. Sync requests you're handling badly. Streaming growth you can't explain and therefore can't repeat. Those are management problems.",
        ],
      },
      {
        h: "Why the good ones say no",
        p: [
          "A manager on 20% of gross is making a bet with years of unpaid work. That maths only closes if they believe you'll earn meaningfully within a horizon they can survive. This is why real managers turn down artists they like — it isn't a judgement on the music.",
          "It also means anyone eager to sign an artist with no traction is telling you something about their business model. Either they're very early and betting on you specifically — which is how Chris Zarou started with Logic, and how Danny Rukasin and Brandon Goodman started with a thirteen-year-old Billie Eilish — or they intend to make money from you some other way. Find out which.",
        ],
      },
      {
        h: "What to do instead, for now",
        p: [
          "Do the manager's job yourself, badly, in public. Keep a real calendar. Answer every email within 48 hours. Track where listeners actually come from. Learn what a normal promoter split looks like in your market. Read one management agreement so the language stops being frightening.",
          "Then build the one thing that makes a manager's bet close: demonstrable, repeatable audience growth. Nothing else in this list matters as much. A manager can multiply traction; none of them can manufacture it from zero.",
        ],
      },
    ],
    faq: [
      {
        q: "At what point should an artist get a manager?",
        a: "When the volume of real opportunities exceeds what you can handle without dropping some. Concretely: consistent inbound from promoters or labels, touring beyond your own region, or a release cycle you can no longer run alone. Follower count is not the trigger; unanswered opportunity is.",
      },
      {
        q: "Can I succeed without a manager?",
        a: "Yes, and many artists do for years. Self-management works while your decisions are simple and your counterparties are small. It gets expensive at the point where you're negotiating things you don't fully understand against people who negotiate them daily.",
      },
      {
        q: "Is a bad manager worse than no manager?",
        a: "Considerably. A bad manager costs you 20% of gross, the deals they negotiate badly, the relationships they damage, and — depending on the term and sunset clause — years of commission after you've stopped working with them. No manager costs you time.",
      },
    ],
    managerExamples: ["chris-zarou", "rukasin-and-goodman"],
    related: [
      "how-to-get-a-music-manager",
      "how-much-does-a-music-manager-take",
      "what-makes-a-good-music-manager",
    ],
    seo: {
      title: "Do I Need a Music Manager? (Honest Answer: Probably Not Yet)",
      description:
        "You need a manager when opportunities outrun your time — unanswered offers, unpriced shows, unreadable deals. Below that, a manager has nothing to manage.",
    },
  },
  {
    slug: "how-to-get-a-music-manager",
    question: "How do you get a music manager?",
    navLabel: "Getting a manager",
    shortAnswer:
      "You get a manager by being a problem worth solving — visible traction a manager can multiply — and then by being introduced rather than by applying. Managers almost never sign from cold emails. They sign from a lawyer, an agent, an A&R, a producer or another artist saying you're worth an hour. Build the traction first; the introduction is much easier to get than the traction.",
    sections: [
      {
        h: "How it actually happens",
        p: [
          "Jonathan Dickins met Adele because XL's Nick Huggett introduced them. He looked her up on MySpace and invited her over for a cup of tea; she signed to XL three months later. That is the shape of nearly every one of these stories — a trusted third party, a low-stakes conversation, and an artist who already had something to show.",
          "Herbie Herbert assembled Journey himself, having come up as a roadie under Bill Graham. The introduction pathway varies; what doesn't vary is that somebody with credibility vouched, or the manager saw the thing working with their own eyes.",
        ],
      },
      {
        h: "The five people more useful than a manager's inbox",
        p: [
          "**Music lawyers.** The single most underrated route. Entertainment lawyers see every deal in a market, know which managers are actually competent, and make introductions constantly. Many will take a first meeting on a referral or a small hourly.",
          "**Booking agents.** If you're playing enough shows to have an agent's attention, they know which managers are looking and what for.",
          "**Producers and engineers.** They sit in rooms with managed artists all week and hear who is good.",
          "**Other artists.** Ask an artist one rung above you who manages them and whether they'd recommend it. You will learn more in that answer than in any amount of research.",
          "**A&R at independent labels.** They are professionally in the business of spotting early traction and they talk to managers daily. This is exactly the path that produced Dickins and Adele.",
        ],
      },
      {
        h: "What to put in front of them",
        p: [
          "Not a biography. Numbers with a story attached: monthly listeners and where they came from, ticket counts by city, the thing that grew and why you think it grew. A manager is assessing whether your growth is repeatable, because repeatable growth is the only thing their 20% is worth.",
          "Then the honest version of what you need. 'I have offers I can't evaluate and shows I can't route' is a specific, answerable pitch. 'I want to take things to the next level' tells a manager you don't yet know what the job is.",
        ],
      },
      {
        h: "If you have no network at all",
        p: [
          "Chris Zarou applied for every music internship going and was rejected by all of them, then founded a management company and built Logic into an arena act. The industry's front door is mostly decorative; there is no credential that gets you in and no gatekeeper whose approval is required.",
          "The practical version for an artist: make the traction undeniable and local first. Managers find artists by watching what's already moving in a scene, on a platform, or in a city. Being findable in a small pond beats being invisible in a large one.",
        ],
      },
    ],
    faq: [
      {
        q: "Do cold emails to music managers ever work?",
        a: "Rarely, and never as the first touch. A cold email works when it arrives after the manager has already heard your name from someone they trust, or when it contains a number so unusual they can't ignore it. Otherwise it's competing with hundreds of identical messages.",
      },
      {
        q: "Should I pay someone to find me a manager?",
        a: "No. Services that charge to pitch you to managers, or managers who charge a fee to take you on, are selling access that has no value. Real introductions cost nothing and come from people who benefit from being right about you.",
      },
      {
        q: "How do I know if a manager is legitimate?",
        a: "Ask who else they manage and call one of those artists directly. Ask what they'd do in your first ninety days and see whether the answer is specific. Ask how they get paid — the answer should be a percentage of your income and nothing else. Then have a music lawyer read the agreement before you sign it.",
      },
    ],
    managerExamples: ["jonathan-dickins", "chris-zarou"],
    related: [
      "do-i-need-a-music-manager",
      "what-makes-a-good-music-manager",
      "music-management-contract-red-flags",
    ],
    seo: {
      title: "How to Get a Music Manager (And Why Cold Emails Don't Work)",
      description:
        "Managers sign artists from introductions, not applications. The five referral routes that work, what to show them, and how Adele's manager actually met her.",
    },
  },
  {
    slug: "music-manager-vs-agent-vs-label",
    question: "What's the difference between a manager, a booking agent, a label and a publisher?",
    navLabel: "Manager vs agent vs label",
    shortAnswer:
      "The manager runs the whole career and takes 15–20% of everything. The booking agent sells live shows and takes around 10% of live fees. The label funds and distributes recordings and takes a share of recording income. The publisher administers and exploits the songwriting copyright and takes a share of publishing. One person is strategy; the other three are functions.",
    sections: [
      {
        h: "The manager",
        p: [
          "Hired by the artist, paid by the artist, accountable to the artist. Commission is typically 15–20% of gross across most income streams. The manager hires and fires the other three, and is the only one of them whose job is the artist's career as a whole rather than one revenue line.",
          "Crucially, the manager funds nothing. This is why management is a bet rather than an investment, and why managers can be so selective.",
        ],
      },
      {
        h: "The booking agent",
        p: [
          "Sells the artist's live performances to promoters and festivals, and routes tours. Standard commission is around 10% of live fees. In some US states, booking employment for performers is a licensed activity, which is one reason the roles stay separate.",
          "The agent works the phones; the manager decides the strategy. An agent will bring you a routing; whether that routing makes sense for where the artist is in a campaign is the manager's call.",
        ],
      },
      {
        h: "The label",
        p: [
          "Funds recording and marketing, distributes the record, and takes a share of recording income — often the majority of it, in exchange for the money and infrastructure supplied up front. Advances are recoupable: they're paid back out of the artist's share before the artist sees anything further.",
          "Master ownership is the fight worth understanding. Paul McGuinness got U2 ownership of their masters as they broke, which the Beatles never had. Most artists historically did not, and the modern independent and distribution landscape exists largely because that ceased to be the only option.",
        ],
      },
      {
        h: "The publisher",
        p: [
          "Deals with the song, not the recording — a separate copyright with separate money. Publishers administer and exploit compositions: collecting royalties worldwide, pitching for sync, and setting up co-writes. They take a share of publishing income and often pay an advance against it.",
          "Two different copyrights in every track is the single most common thing new artists don't know, and the reason 'I got a record deal' and 'I got a publishing deal' are unrelated sentences.",
        ],
      },
      {
        h: "The one-line version",
        p: [
          "Manager: everything, 15–20% of gross. Agent: live shows, ~10% of live. Label: recordings, a share of recording income, usually funds it. Publisher: songs, a share of publishing, often funds it. Only the manager is paid to care about all four at once.",
        ],
      },
    ],
    faq: [
      {
        q: "Can the same person be my manager and my booking agent?",
        a: "At a very small scale it happens, and early on your manager will book shows because nobody else will. It becomes a problem as you grow: booking is licensed in some US states, and combining the roles removes the check of having two people with different incentives looking at the same offer.",
      },
      {
        q: "Do I need a label if I have a manager?",
        a: "No. A manager's job includes deciding whether a label is worth what it costs. With distribution widely available and marketing increasingly driven by short-form video rather than radio, plenty of well-managed artists stay independent — which usually means keeping their masters.",
      },
      {
        q: "What's the difference between a master and a publishing copyright?",
        a: "The master is the recording — the specific performance captured. Publishing is the song itself: melody and lyrics. They are separate copyrights, often owned by different parties, and they generate separate money. A sync licence usually needs permission from both.",
      },
    ],
    managerExamples: ["paul-mcguinness", "burnstein-and-mensch"],
    related: ["what-does-a-music-manager-do", "how-much-does-a-music-manager-take"],
    seo: {
      title: "Music Manager vs Booking Agent vs Label vs Publisher",
      description:
        "Manager: everything, 15–20% of gross. Agent: live shows, ~10%. Label: recordings. Publisher: songs. Who does what, who pays whom, and which copyright is which.",
    },
  },
  {
    slug: "music-management-contract-red-flags",
    question: "What are the red flags in a music management contract?",
    navLabel: "Contract red flags",
    shortAnswer:
      "The five that matter: any upfront or monthly fee, a term longer than about three years with no performance-based exit, a perpetual or near-perpetual sunset clause, commission on income from deals you signed before they arrived, and a power of attorney letting them sign on your behalf. Any one of them is worth walking away over if they won't move.",
    sections: [
      {
        h: "1. They want money up front",
        p: [
          "A manager who charges a retainer, a signing fee or a development fee is paid whether or not you succeed. That removes the only structural guarantee an artist has. Real management is commission-only, at 15–20% of gross. Nothing else on this list matters if this one is present — just leave.",
        ],
      },
      {
        h: "2. A long term with no way out",
        p: [
          "Multi-year terms are normal. Multi-year terms with no performance conditions are not. A reasonable agreement lets you leave if agreed benchmarks aren't met — income thresholds, a deal secured, a defined level of activity — or gives you a clean termination right after an initial period.",
          "Watch for options that let the manager extend unilaterally. An agreement where only one side can decide to continue is not a partnership.",
        ],
      },
      {
        h: "3. A sunset clause that never sets",
        p: [
          "When you part ways the manager should keep commissioning deals made during the term, at a declining rate, for a bounded period — commonly stepping down over roughly two to five years. That is fair; they built those deals.",
          "The red flag is a sunset that runs forever, or one that reaches deals signed after they're gone. Read this clause first. It's the one that costs former clients the most and the one nobody thinks about while signing.",
        ],
      },
      {
        h: "4. Commission on everything, including what came before",
        p: [
          "A manager should not commission income from contracts signed before they arrived, or from work they had nothing to do with. Ask for carve-outs: pre-existing deals, publishing where they aren't involved, and any catalogue that predates the relationship.",
          "Also confirm exactly which streams are commissionable and whether it's gross or net. Gross is standard, but which expenses come off the top before the calculation is negotiable, and worth negotiating.",
        ],
      },
      {
        h: "5. Power of attorney",
        p: [
          "Some agreements grant the manager authority to sign contracts, incur expenses or handle money on your behalf. Narrow this hard. Routine approvals below a low dollar threshold are fine; the ability to bind you to a recording agreement is not.",
          "Related: your money should not flow through the manager's account. Income should go to you or to a business manager, with commission paid out — not collected by the manager and remitted at their discretion.",
        ],
      },
      {
        h: "The thing that prevents all five",
        p: [
          "Have an entertainment lawyer read it before you sign. This costs a few hundred to a couple of thousand and is the highest-return money an early-career artist spends. A manager who discourages you from getting independent legal advice has answered every question you had about them.",
        ],
      },
    ],
    faq: [
      {
        q: "How long should a music management contract be?",
        a: "One to three years is typical for a first agreement, ideally with performance benchmarks that let you exit if the manager doesn't deliver. Longer terms aren't automatically bad if the exit conditions are real, but a long term plus no benchmarks plus a unilateral option is a bad deal.",
      },
      {
        q: "Should I sign a management contract without a lawyer?",
        a: "No. A management agreement determines a percentage of your income for years and often keeps applying after the relationship ends. An entertainment lawyer reading it is cheap relative to what a bad sunset clause costs.",
      },
      {
        q: "Can I get out of a bad management contract?",
        a: "Sometimes — through a termination clause, a breach by the manager, or negotiated settlement, and in some jurisdictions rules on unlicensed booking activity can affect enforceability. It's specialist territory, and it is much more expensive than getting the contract right at the start. Talk to an entertainment lawyer.",
      },
    ],
    managerExamples: ["bill-curbishley"],
    related: [
      "how-much-does-a-music-manager-take",
      "how-to-get-a-music-manager",
      "what-makes-a-good-music-manager",
    ],
    sources: [
      {
        label: "Key contract terms for musicians and managers — Romano Law",
        url: "https://www.romanolaw.com/key-contract-terms-for-musicians-and-managers/",
      },
      {
        label: "Understanding personal manager contracts — Law Advocate Group",
        url: "https://lawadvocategroup.com/what-artists-need-to-know-about-personal-manager-contracts/",
      },
      {
        label: "Key clauses in management agreements — Erin M. Jacobson, Esq.",
        url: "http://www.themusicindustrylawyer.com/key-clauses-in-management-agreements-part-2-commissions/",
      },
    ],
    seo: {
      title: "Music Management Contract Red Flags (The 5 That Matter)",
      description:
        "Upfront fees, unbounded terms, perpetual sunset clauses, commission on pre-existing deals, and power of attorney. What to negotiate and when to walk.",
    },
  },
  {
    slug: "what-makes-a-good-music-manager",
    question: "What makes a good music manager?",
    navLabel: "What makes one good",
    shortAnswer:
      "A good manager tells you things you don't want to hear, has a specific plan rather than enthusiasm, is reachable when it's inconvenient, and is willing to destroy something that currently works if the next version is better. Track record matters less than judgement, because every artist's situation is different and enthusiasm is free.",
    sections: [
      {
        h: "They'll tell you to burn a working thing",
        p: [
          "In the mid-1980s Robert Plant had a functioning solo career and a working band. Bill Curbishley told him to disband it and start over with new musicians and new collaborators. That is advice against the manager's own short-term financial interest — he was commissioning the thing he asked his client to destroy — and it is why Plant re-emerged rather than gently declining.",
          "A manager whose advice never costs them anything is a manager optimising for this quarter. The test isn't whether they're nice. It's whether they've ever told you no about something profitable.",
        ],
      },
      {
        h: "They have a plan, not a vibe",
        p: [
          "Ask what they'd do in your first ninety days. A good answer is specific and slightly boring: these three conversations, this release timed here, this data I want to see, this thing we stop doing. A bad answer is about belief, energy and taking it to the next level.",
          "Ask what they think is wrong with what you're currently doing. Anyone who says nothing either hasn't looked or won't tell you.",
        ],
      },
      {
        h: "They protect the thing that made you work",
        p: [
          "The default move when an artist gets traction is to professionalise the music — bigger writers, known producers, better rooms. Danny Rukasin and Brandon Goodman spent a decade doing the opposite with Billie Eilish, scaling the team around a bedroom operation and leaving the operation alone, because the bedroom was the product.",
          "A manager who wants to fix what's working before they understand why it works is dangerous in proportion to how competent they are.",
        ],
      },
      {
        h: "They're accountable and reachable",
        p: [
          "One person's name on the outcome. At a large firm, find out who that is, not which company it is — the roster on the website may have nothing to do with who returns your calls.",
          "Ask for a current client's number and actually ring them. Ask whether the manager answers at 11pm on a Sunday when something has gone wrong, because eventually something will.",
        ],
      },
      {
        h: "They understand where the money is now",
        p: [
          "The great managers all repriced something underpriced: Grant the concert gate, McGuinness master ownership, Herbert the touring supply chain. A manager who only knows how the business worked five years ago is managing a market that has moved.",
          "Today the underpriced asset is short-form attention, and specifically the fact that most editors driving reach on TikTok are working without published rates or verified payouts. A manager who can explain how your song gets into circulation at that layer — and what it costs — is describing the current market rather than a remembered one.",
        ],
      },
    ],
    faq: [
      {
        q: "What questions should I ask a potential music manager?",
        a: "What would you do in my first ninety days? What's wrong with what I'm doing now? Who else do you manage, and can I call one of them? How exactly do you get paid? What happens if this doesn't work — what does the exit look like? Vague answers to any of these are the answer.",
      },
      {
        q: "Does a music manager need industry experience?",
        a: "It helps, but it isn't required and never has been. Chris Zarou was rejected by every music internship he applied to and built Logic into an arena act. Herbie Herbert was a roadie. What's required is judgement, relentlessness and being trusted by one artist enough to start.",
      },
      {
        q: "Should I pick a big management company or an independent manager?",
        a: "Pick the person, then check the company. A big firm brings relationships and infrastructure but you may be a small account inside it; an independent gives you their full attention but has fewer doors. Either works — what kills artists is being a low priority somewhere impressive.",
      },
    ],
    managerExamples: ["bill-curbishley", "rukasin-and-goodman", "peter-grant", "max-flohr"],
    related: [
      "do-i-need-a-music-manager",
      "how-to-get-a-music-manager",
      "what-does-a-music-manager-do",
    ],
    seo: {
      title: "What Makes a Good Music Manager?",
      description:
        "A good manager tells you what you don't want to hear, arrives with a specific plan, protects what made you work, and knows where the money actually is now.",
    },
  },
  {
    slug: "how-to-become-a-music-manager",
    question: "How do you become a music manager?",
    navLabel: "Becoming a manager",
    shortAnswer:
      "You become a music manager by managing someone. There is no licence, degree or credential required — you find an artist whose career you can measurably improve, agree terms in writing, and do the work. Most working managers started with an unknown artist and grew with them rather than being hired onto an established one.",
    sections: [
      {
        h: "There is no front door, and that's the good news",
        p: [
          "Chris Zarou applied for every music internship he could find, was rejected by all of them, founded Visionary Music Group in 2010 and built Logic into a multi-platinum arena act. By 2019 Sony was launching an imprint with him.",
          "Cliff Burnstein was a radio promoter who cold-called a college radio programme director named Peter Mensch in 1973; they founded Q Prime nine years later and have managed Metallica since 1984. Herbie Herbert was a roadie. None of these are credential stories.",
        ],
      },
      {
        h: "Start with one artist, not a company",
        p: [
          "Nearly every management career on this site began with a single unknown act and grew with them. Rukasin and Goodman took on a thirteen-year-old. Roberts heard a tape. Herbert put the band together himself.",
          "Practically: find an artist in your reach who is good and badly organised. Do the job for a defined period. Put terms in writing even at the smallest scale — it protects both of you and it teaches you the paperwork you'll need later.",
        ],
      },
      {
        h: "What you actually have to be able to do",
        p: [
          "**Read a contract well enough to know what to ask a lawyer.** You don't need to be a lawyer. You need to know which clauses matter — term, commission basis, sunset, carve-outs — and when to stop and get advice.",
          "**Build a budget and hold to it.** Tour budgets, release budgets, what a thing costs versus what it returns. Most management failure is arithmetic.",
          "**Read data honestly.** Where listeners actually came from, which of it is repeatable, and which of it was luck you're about to mistake for strategy.",
          "**Ask for things and absorb no.** The job is a very high volume of asks with a low hit rate, indefinitely.",
          "**Understand where reach comes from right now.** Not how records broke a decade ago — how attention moves this year, what it costs to buy honestly, and who the people creating it are.",
        ],
      },
      {
        h: "How you get paid at the start",
        p: [
          "You don't, for a while. Commission at 15–20% of gross on an artist earning very little is not an income, which is why most managers start alongside another job and why the bet only makes sense on an artist you genuinely believe will grow.",
          "Do not solve this by charging the artist a fee. The moment you take money regardless of results, you've become a supplier rather than a partner, and every good artist will eventually work that out.",
        ],
      },
    ],
    faq: [
      {
        q: "Do you need a degree to be a music manager?",
        a: "No. There is no required qualification anywhere in the world for artist management. Music business degrees can supply useful vocabulary and a network, but every manager profiled on this site got in through an artist relationship rather than a credential.",
      },
      {
        q: "Do music managers need a licence?",
        a: "Not for management itself. But procuring employment for performers — booking shows — is a licensed activity in some US states, which is a practical reason managers hand live booking to agents rather than doing it themselves at scale.",
      },
      {
        q: "How much do music managers earn?",
        a: "Entirely dependent on their artists. Commission is 15–20% of the artist's gross income, so a manager of an artist earning nothing earns nothing, and a manager of a stadium act earns accordingly. There's no salary and no floor.",
      },
    ],
    managerExamples: ["chris-zarou", "burnstein-and-mensch", "herbie-herbert"],
    related: [
      "what-does-a-music-manager-do",
      "what-makes-a-good-music-manager",
      "how-much-does-a-music-manager-take",
    ],
    seo: {
      title: "How to Become a Music Manager (No Degree, No Licence)",
      description:
        "There's no credential for artist management. How Chris Zarou, Q Prime and Herbie Herbert started — and what you actually have to be able to do.",
    },
  },
  {
    slug: "how-managers-promote-music-on-tiktok",
    question: "How do music managers promote songs on TikTok?",
    navLabel: "Promotion on TikTok",
    shortAnswer:
      "By paying editors to make videos using the sound, at scale, and measuring what comes back. The reach on a track is largely a function of how many creators are cutting to it, so managers now run paid clipping campaigns — either through private creator networks or public bounty boards where the purse, the per-view rate and the verification rule are posted before anyone starts.",
    sections: [
      {
        h: "What actually moves a song",
        p: [
          "A sound spreads when creators use it. That is the whole mechanic, and it means the manager's job is supply-side: get the song into the hands of people who make videos, give them a reason to use it, and make the reason repeatable.",
          "Organic virality happens and cannot be planned around. What can be planned around is volume of attempts. A campaign that puts a sound in front of a hundred editors will produce a wider distribution of outcomes than one that puts it in front of five, and the tail is where the hits are.",
        ],
      },
      {
        h: "How campaigns are paid",
        p: [
          "**Per verified view.** A rate per thousand or per hundred thousand views, paid against a posted purse, verified after a counting window. This aligns the editor with the outcome rather than the deliverable, and it's why it has become the dominant structure.",
          "**Flat per approved clip.** A fixed fee per accepted video. Predictable for budgeting, but pays the same for a clip that does nothing as for one that works.",
          "**Hybrid.** A small flat fee to guarantee the clip gets made, plus a per-view rate on top. Common where the source footage takes real effort to edit.",
        ],
      },
      {
        h: "The part most campaigns get wrong",
        p: [
          "Unstated terms. A large share of clipping work still runs through private Discords where the budget isn't published, the rate is described vaguely, and the payout is explained after the fact. That is a bad deal for editors, and — less obviously — a bad deal for the artist paying, because the good editors learn which campaigns are worth their time and stop showing up to the ones that aren't.",
          "The fix is to publish the terms: the purse, the exact rate, the counting window, and the rule that decides whether a delivery counts. This is the premise Bounty Sounds is built on and the reason the Open Clipping Contract specification exists — a shared format so an editor can compare two offers from two boards without decoding two layouts.",
        ],
      },
      {
        h: "What a manager should be measuring",
        p: [
          "Cost per verified thousand views, not cost per clip. Sound usage over time rather than at launch. Whether views convert into saves and streams, or stop at the video. And which editors produce repeat results, because the second campaign should not start from scratch.",
          "The historical parallel is exact. Peter Grant found the concert gate mispriced at 50/50 and moved it to 90/10. Herbie Herbert found the touring supply chain mispriced and built it himself. Paid short-form attention is mispriced right now largely because it's opaque, and the managers who take it seriously as a market — with published rates and verified payouts — are getting more reach per dollar than the ones treating it as a mystery.",
        ],
      },
    ],
    faq: [
      {
        q: "How much does a TikTok clipping campaign cost?",
        a: "It depends entirely on the rate and how many verified views you're paying for, and the honest answer is that there's no single going rate yet — the market is young and largely unpublished. What you can do is compare posted rates against each other: on a public board every live campaign shows its purse and per-view rate before anyone commits.",
      },
      {
        q: "Is paying creators to use a sound allowed?",
        a: "Yes. Paying creators to make content is ordinary marketing, and disclosure rules for paid promotion apply as they do anywhere else. What isn't allowed — and what any serious campaign verifies against — is buying fake views. Synthetic traffic is fraud against the person paying for it.",
      },
      {
        q: "Do you need a big budget to run a clipping campaign?",
        a: "No, but you need a real one. A small purse with a clear rate and a specific brief will out-perform a large one with vague terms, because editors self-select into campaigns where they can calculate what they'll earn before they spend the hours.",
      },
      {
        q: "Can AI-run accounts clip for a campaign?",
        a: "On some boards, yes — Bounty Sounds allows AI-generated and AI-assisted clips under the same rules as everyone else, with deliveries verified against the posting account and the sound. The line isn't who made the clip; it's whether the views are real.",
      },
    ],
    managerExamples: ["max-flohr", "peter-grant"],
    related: [
      "what-does-a-music-manager-do",
      "what-makes-a-good-music-manager",
      "how-to-become-a-music-manager",
    ],
    sources: [
      {
        label: "Bounty Sounds — live clipping bounty board",
        url: "https://bountysounds.com/board",
      },
      {
        label: "Open Clipping Contract specification",
        url: "https://github.com/maxflohr-ops/tiktok-bounty-beat/tree/main/occ",
      },
    ],
    seo: {
      title: "How Music Managers Promote Songs on TikTok in 2026",
      description:
        "Reach on a track is a function of how many editors cut to it. How paid clipping campaigns are priced, what to measure, and why unpublished terms cost you reach.",
    },
  },
];

export function answerBySlug(slug: string): Answer | undefined {
  return ANSWERS.find((a) => a.slug === slug);
}

export const ANSWER_SLUGS = ANSWERS.map((a) => a.slug);
