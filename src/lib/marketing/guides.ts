import type { Source } from "@/lib/managers/roster";

// The commercial cluster: pages aimed at the person who would post a purse,
// not at the editor who would clip it.
//
// Two rules govern this file and they pull against each other on purpose.
//
// 1. TRACEABLE TRUTH. Third-party rate benchmarks are cited, every time. Where
//    a number would describe *our* results, there is no number — the board has
//    not run long enough for a benchmark to mean anything, and inventing one
//    to close a sale is how a site stops being worth citing. Point at the live
//    board, where the posted rates are real.
// 2. VOCABULARY LAW. A contract is a BOUNTY, the money behind it is a PURSE,
//    and a purse is POSTED, never "funded". Editors SEIZE a bounty and CAPTURE
//    a purse. This holds in commercial copy too.

export type Guide = {
  slug: string;
  question: string;
  navLabel: string;
  /** The answer, complete on its own, under about 60 words. */
  shortAnswer: string;
  sections: { h: string; p: string[] }[];
  faq: { q: string; a: string }[];
  /** Where this page should send a convinced reader. */
  cta: { line: string; label: string; href: "/list-sound" | "/board" | "/keynotes" };
  related: string[];
  /** Cross-links into the editorial cluster, which is what earns the trust. */
  readAlso?: { label: string; to: string }[];
  sources?: Source[];
  seo: { title: string; description: string };
};

const POST_CTA = {
  line: "Post a purse on your sound and editors compete to cut it. Every rate, window and verification rule is on the contract before anyone commits.",
  label: "post a bounty",
  href: "/list-sound" as const,
};

const BOARD_CTA = {
  line: "Every live bounty shows its purse and its per-view rate in public. That is the honest version of a rate card — go and read what people are actually paying.",
  label: "see the live board",
  href: "/board" as const,
};

export const GUIDES: Guide[] = [
  {
    slug: "how-much-does-tiktok-music-promotion-cost",
    question: "How much does TikTok music promotion cost?",
    navLabel: "What promotion costs",
    shortAnswer:
      "There is no single price, but the public benchmarks are consistent: sound-usage deals run roughly $25–$200 per video with nano creators, $300–$3,500 with micro creators, and into five figures for mid-tier and above. Most campaigns spread a budget across many small creators rather than concentrating it in one large post.",
    sections: [
      {
        h: "What you are actually buying",
        p: [
          "Two different things get sold as TikTok promotion and they behave nothing alike. The first is **placement** — you pay a creator a fixed fee to post one video using your sound. The second is **outcome** — you pay against results the video actually produced. Almost all of the published rate cards describe the first, because the first is easier to sell.",
          "The distinction decides where the risk sits. A flat placement fee moves all the performance risk onto you: you pay the same for a video that gets 2,000 views as for one that gets two million. That is a reasonable trade when you're buying a specific creator's specific audience. It is a poor one when what you actually want is reach at volume.",
        ],
      },
      {
        h: "The published benchmarks",
        p: [
          "Reported sound-usage rates cluster by creator size: roughly **$25–$200 per video** for nano creators (about 1K–10K followers), **$300–$3,500** for micro creators (10K–100K), and **$2,500–$15,000** for mid-tier creators. Broader influencer-marketing rate cards run in the same shape — nano $10–$100, micro $100–$500, mid-tier $500–$2,500, macro $2,500–$10,000 and up.",
          "On a cost-per-thousand basis, influencer CPMs are commonly quoted between **$5 and $25**, with paid in-feed TikTok CPMs reported around **$3–$15**. Those are useful as a sanity check: if a campaign is quoting you an effective CPM far outside that band, ask what accounts for the difference.",
          "Treat all of these as orientation, not quotes. They are aggregated by vendors with an interest in the number, they move fast, and they vary enormously by territory and category.",
        ],
      },
      {
        h: "How labels actually structure a song campaign",
        p: [
          "The reported pattern is layered rather than flat. Phase one activates a large number of nano creators — often 100 to 500 — at gifting level or roughly $20–$100 each, to get the sound into circulation. Phase two activates 20–50 micro creators at roughly $100–$1,000 each to establish a template other people can copy. Phase three adds a small number of mid-tier or macro creators as a visible signal.",
          "One major-label marketer has publicly estimated that around 75% of popular songs on TikTok began with a creator marketing campaign. Whether or not that figure is exact, the operating assumption behind it is the useful part: organic-looking sound adoption is very often bought.",
        ],
      },
      {
        h: "What we won't tell you",
        p: [
          "We won't quote you a typical cost per thousand views on Bounty Sounds. The board hasn't run long enough for an average to mean anything, and a number invented to close a sale is worse than no number.",
          "What we'll do instead is show you the real ones. Every live bounty publishes its purse and its per-view rate before anyone commits, so you can read what people are actually paying today and price against it rather than against a vendor's blog post.",
        ],
      },
    ],
    faq: [
      {
        q: "Is it cheaper to pay one big creator or many small ones?",
        a: "Volume usually wins for sound campaigns, which is why the reported label playbook starts with 100–500 nano creators rather than one macro post. A sound spreads when many people use it, and many attempts produce a wider distribution of outcomes than a few. One large creator is worth paying for when you specifically want that audience or that person's endorsement.",
      },
      {
        q: "Do I have to disclose paid music promotion?",
        a: "Paid promotion carries disclosure obligations, and the position for music specifically has been reported as unsettled — promoters often don't direct the creative or require any mention of the artist, which muddies whether a given post is an ad. Treat that ambiguity as risk rather than a loophole and get advice on your own campaign.",
      },
      {
        q: "What's the minimum budget worth spending?",
        a: "A small purse with a clear rate and a specific brief outperforms a large one with vague terms, because editors self-select into campaigns where they can calculate their earnings before spending the hours. What kills small budgets isn't the size — it's unstated terms that make good editors walk.",
      },
    ],
    cta: BOARD_CTA,
    related: [
      "pay-per-view-vs-flat-rate",
      "tiktok-sound-seeding",
      "how-to-brief-a-clipping-campaign",
    ],
    readAlso: [
      {
        label: "How music managers promote songs on TikTok",
        to: "/music-management/how-managers-promote-music-on-tiktok",
      },
    ],
    sources: [
      {
        label: "Music influencer marketing rates: TikTok sound deals",
        url: "https://influencerfee.com/blog/music-influencer-marketing-rates/",
      },
      {
        label: "Influencer pricing: what influencer marketing costs — Modash",
        url: "https://www.modash.io/blog/influencer-pricing",
      },
      {
        label: "TikTok sound seeding playbook — Chartlex",
        url: "https://www.chartlex.com/blog/marketing/tiktok-sound-seeding-playbook-2026",
      },
      {
        label: "Music promoters paying for songs in TikTok videos, and FTC disclosure — Tubefilter",
        url: "https://www.tubefilter.com/2024/10/22/tiktok-music-paid-promotion-federal-trade-commission/",
      },
    ],
    seo: {
      title: "How Much Does TikTok Music Promotion Cost?",
      description:
        "Sound-usage deals run about $25–$200 per video with nano creators, $300–$3,500 with micro. The published benchmarks, the label playbook, what they leave out.",
    },
  },
  {
    slug: "pay-per-view-vs-flat-rate",
    question: "Pay per view or flat rate: which is better for a creator campaign?",
    navLabel: "Per view vs flat rate",
    shortAnswer:
      "Flat rate buys you a specific creator's post and puts all the performance risk on you. Pay per view buys outcomes and puts the risk on the campaign. Use flat rate when you want that particular audience or a guaranteed deliverable; use per view when what you want is reach at volume and you'd rather not pay for videos that did nothing.",
    sections: [
      {
        h: "Flat rate: you buy a deliverable",
        p: [
          "You agree a fee, the creator posts, you pay. The rate is set before anyone knows how the video will perform, so the price reflects the creator's audience rather than the result. This is how most published creator rate cards work and it is the right instrument when the creator *is* the point — their taste, their credibility, their specific followers.",
          "The weakness is arithmetic. Pay ten creators $300 each and you have spent $3,000 whether the campaign produced 50,000 views or five million. In a category where outcomes are as skewed as short-form video, paying a flat rate for a long tail of underperforming posts is where budgets quietly go.",
        ],
      },
      {
        h: "Pay per view: you buy an outcome",
        p: [
          "A rate per thousand or per hundred thousand verified views, paid from a posted purse, settled after a counting window. Editors who think they can move the number take the work; the ones who can't, don't. That self-selection is most of the value, and it costs you nothing.",
          "The trade is that you give up certainty of volume. Nobody can promise you a specific number of posts. What you get instead is that every dollar leaving the purse corresponds to views that were verified, which is a much better thing to be able to say to whoever approved the budget.",
        ],
      },
      {
        h: "Hybrid, and when it earns its complexity",
        p: [
          "A small flat fee to guarantee the clip gets made, plus a per-view rate on top. Worth it when the source footage takes real effort to edit — long-form video, a keynote, a podcast episode — because pure per-view asks an editor to gamble hours on a hard cut. The base covers the labour, the rate supplies the upside.",
          "The equivalent in wider influencer marketing is the base-plus-commission structure, common in e-commerce, where reported commissions cluster around 10–14% per sale. Same shape, same reason: pure performance pay struggles to buy effort, pure flat pay struggles to buy results.",
        ],
      },
      {
        h: "The question that actually decides it",
        p: [
          "Ask what you would regret more: paying for views you didn't get, or not getting posts you were promised. If it's the first, pay per view. If it's the second, pay flat. Most sound campaigns are the first, which is why per-view structures have taken over that end of the market.",
        ],
      },
    ],
    faq: [
      {
        q: "How are views verified before payout?",
        a: "On Bounty Sounds, a delivery is checked against the posting account and the contract's sound, and views count for the bounty's window — usually 14 days from delivery. Only real verified views pay; synthetic traffic forfeits the payout. The rule is printed on the contract before anyone claims it.",
      },
      {
        q: "Doesn't pay-per-view attract low-effort clips?",
        a: "It attracts clips aimed at views, which is what you're paying for. Low-effort clips that don't perform cost you nothing, which is precisely the advantage over flat rate — under a flat fee, the same clip gets paid in full.",
      },
      {
        q: "Can I run both models at once?",
        a: "Yes, and many campaigns should. A flat-fee tier for a handful of specific creators whose audience you want, plus a per-view purse open to everyone else for volume. They're solving different problems and there's no reason to pick one for the whole budget.",
      },
    ],
    cta: POST_CTA,
    related: [
      "how-much-does-tiktok-music-promotion-cost",
      "how-to-measure-a-clipping-campaign",
      "clipping-vs-influencer-marketing",
    ],
    readAlso: [
      {
        label: "How much does a music manager take?",
        to: "/music-management/how-much-does-a-music-manager-take",
      },
    ],
    sources: [
      {
        label: "Influencer pricing: flat fee, CPM and hybrid models — Modash",
        url: "https://www.modash.io/blog/influencer-pricing",
      },
      {
        label: "Bounty Sounds payouts, windows and verification",
        url: "https://bountysounds.com/payouts",
      },
    ],
    seo: {
      title: "Pay Per View vs Flat Rate Creator Campaigns",
      description:
        "Flat rate buys a deliverable and puts performance risk on you. Pay per view buys outcomes. When each wins, and when a hybrid earns its complexity.",
    },
  },
  {
    slug: "tiktok-sound-seeding",
    question: "What is TikTok sound seeding and how do you run it?",
    navLabel: "Sound seeding",
    shortAnswer:
      "Sound seeding is paying a group of small creators to post videos using the same audio, so the sound enters circulation looking like a trend rather than one sponsored post. Reported campaigns start with anywhere from 20 to 500 nano and micro creators, then layer larger creators on top once a copyable template exists.",
    sections: [
      {
        h: "Why volume is the mechanic",
        p: [
          "A sound spreads because people use it. That makes the job supply-side: get the audio into the hands of people who make videos and give them a reason to keep going. One post from a large account is a billboard. Forty posts from small accounts is the beginning of a format.",
          "It also means outcomes are decided by the tail. Most clips do very little and a few do enormous numbers, so a campaign that produces a hundred attempts has a materially better chance of catching one than a campaign that produces five. Buying attempts is the strategy.",
        ],
      },
      {
        h: "The reported three-phase structure",
        p: [
          "**Phase one — circulation.** 100–500 nano creators, at gifting level or roughly $20–$100 each. The goal is not reach, it is existence: a sound page with real videos on it.",
          "**Phase two — template.** 20–50 micro creators at roughly $100–$1,000 each, making the version other people copy. This is the phase that decides whether anything organic follows, because organic use is mostly imitation.",
          "**Phase three — signal.** One to five mid-tier or macro creators, visible enough to make the sound look established. Expensive, and worthless without phase two underneath it.",
        ],
      },
      {
        h: "Where seeding goes wrong",
        p: [
          "**No template.** A hundred unrelated videos with the same audio don't teach anyone what to do with it. The brief has to imply a format.",
          "**Paying for posts instead of performance.** Phase one at a flat fee per creator is a large cheque for a large number of videos that mostly won't move. This is the exact case a posted purse with a per-view rate handles better: the same budget, but weighted toward the clips that actually did something.",
          "**Unstated terms.** A large share of this work still runs through private group chats with undisclosed budgets and payouts explained after the fact. Good editors learn which campaigns waste their time and stop appearing, so the campaign gets the creators who haven't learned yet.",
        ],
      },
      {
        h: "Disclosure",
        p: [
          "Paid creator posts carry disclosure obligations. Reporting has noted that music promotion sits in an unclear area, because promoters frequently don't direct the content or require any mention of the artist — but unclear is not the same as exempt. Decide your disclosure policy deliberately and get advice, rather than inheriting whatever the last campaign did.",
        ],
      },
    ],
    faq: [
      {
        q: "How many creators do I need to seed a sound?",
        a: "Reported campaigns range from about 20 creators at the small end to several hundred for a major-label push. The number that matters is how many usable attempts you generate, not how many contracts you sign — which is why paying on verified views rather than per post tends to buy more attempts for the same money.",
      },
      {
        q: "Does seeding still work if the song isn't obviously a TikTok song?",
        a: "Yes. The clearest counterexamples are records built from field recordings and ambient textures that have gone on to do enormous numbers on the platform. What travels is the format the sound gets used in, not the genre of the record.",
      },
      {
        q: "Is sound seeding the same as clipping?",
        a: "Related but not identical. Seeding is getting creators to post their own content over your audio. Clipping is editors cutting existing source material — a track, a stream, a keynote, a podcast — into short-form video. The payment mechanics and the verification problem are the same; the raw material isn't.",
      },
    ],
    cta: POST_CTA,
    related: [
      "how-much-does-tiktok-music-promotion-cost",
      "how-to-brief-a-clipping-campaign",
      "pay-per-view-vs-flat-rate",
    ],
    readAlso: [
      {
        label: "How music managers promote songs on TikTok",
        to: "/music-management/how-managers-promote-music-on-tiktok",
      },
    ],
    sources: [
      {
        label: "TikTok sound seeding: nano-creator playbook — Chartlex",
        url: "https://www.chartlex.com/blog/marketing/tiktok-sound-seeding-playbook-2026",
      },
      {
        label: "Music influencer marketing rates and campaign phases",
        url: "https://influencerfee.com/blog/music-influencer-marketing-rates/",
      },
      {
        label: "Music promotion and FTC disclosure — Tubefilter",
        url: "https://www.tubefilter.com/2024/10/22/tiktok-music-paid-promotion-federal-trade-commission/",
      },
    ],
    seo: {
      title: "TikTok Sound Seeding: How Campaigns Actually Run",
      description:
        "Seeding pays many small creators to post the same audio so a sound enters circulation. The reported three-phase structure, what it costs, and where it fails.",
    },
  },
  {
    slug: "clipping-vs-influencer-marketing",
    question: "Clipping campaigns vs influencer marketing: what's the difference?",
    navLabel: "Clipping vs influencer",
    shortAnswer:
      "Influencer marketing buys a specific creator's audience and endorsement, usually at a flat fee per post. Clipping buys editing labour and reach at volume, usually paid on verified views from a posted purse. One is a media buy against a known audience; the other is closer to piece-work against an outcome.",
    sections: [
      {
        h: "What each one is really purchasing",
        p: [
          "Influencer marketing is an audience transaction. You are paying because *this* person's followers trust *them*, and the endorsement transfers. The creator's identity is the product, which is why the rate scales with follower count and why it is quoted per post.",
          "Clipping is a labour and distribution transaction. You are paying for someone to cut your material well and put it where it can travel. The editor's own following is close to irrelevant — a small account with a viral edit out-earns a large account posting filler, because views are what pay.",
        ],
      },
      {
        h: "Where the money goes",
        p: [
          "Influencer deals concentrate spend: a handful of creators, meaningful cheques, predictable deliverables, unpredictable results. Clipping distributes spend: many editors, small individual payouts, unpredictable participation, results you only pay for once verified.",
          "Neither is better in the abstract. If you're launching a product that needs a credible face, buy the influencer. If you have a sound, a stream, a keynote or an episode and you want it cut a hundred ways until something lands, run a clipping campaign.",
        ],
      },
      {
        h: "The verification difference",
        p: [
          "This is the underrated one. An influencer deal is complete when the post goes up — the deliverable is the video. A per-view clipping contract isn't complete until views are verified, which means fraudulent traffic is the payer's problem in one model and the earner's problem in the other.",
          "That inversion is worth more than it sounds. Under a flat fee, an inflated view count costs the creator nothing and tells you nothing. Under a verified per-view purse, synthetic traffic forfeits the payout, so the incentive to inflate disappears.",
        ],
      },
      {
        h: "Running both",
        p: [
          "The strongest campaigns usually do. A short influencer tier for the specific audiences you want in front of, and an open per-view purse underneath it for volume. The influencer posts create the template; the clipping purse multiplies it.",
        ],
      },
    ],
    faq: [
      {
        q: "Which is cheaper?",
        a: "Per unit of reach, per-view clipping usually is, because you're not paying for videos that didn't perform. Per unit of certainty, influencer marketing is cheaper, because you know what you're getting before you spend. You're choosing which risk to hold, not which price to pay.",
      },
      {
        q: "Do clippers need followers?",
        a: "No. Views pay, not followers. Small accounts with viral edits routinely out-earn large accounts posting filler, which is the clearest structural difference from influencer marketing, where follower count is essentially the price.",
      },
      {
        q: "Can AI-run accounts take clipping work?",
        a: "On Bounty Sounds, yes — AI-generated and AI-assisted clips are welcome under the same rules as everyone else, with deliveries verified against the posting account and the sound. The test isn't who made the clip, it's whether the views are real.",
      },
    ],
    cta: BOARD_CTA,
    related: [
      "pay-per-view-vs-flat-rate",
      "how-much-does-tiktok-music-promotion-cost",
      "short-form-video-marketing-for-brands",
    ],
    sources: [
      {
        label: "Influencer rate tiers and pricing models — Modash",
        url: "https://www.modash.io/blog/influencer-pricing",
      },
      {
        label: "Bounty Sounds — clipping FAQ for editors",
        url: "https://bountysounds.com/for-editors",
      },
    ],
    seo: {
      title: "Clipping Campaigns vs Influencer Marketing",
      description:
        "Influencer marketing buys an audience at a flat fee per post. Clipping buys editing labour and reach on verified views. Who holds the risk, and why.",
    },
  },
  {
    slug: "how-to-brief-a-clipping-campaign",
    question: "How do you brief a clipping campaign?",
    navLabel: "Writing the brief",
    shortAnswer:
      "State the money first, the material second, and the rules third: what the purse is, what it pays per view, how long views count, what counts as a valid delivery, where the source footage lives, and what you will reject. A brief that lets an editor calculate their earnings before starting is the one that gets the good editors.",
    sections: [
      {
        h: "Lead with the number",
        p: [
          "Editors are choosing between campaigns. The first question they have is what this pays, and a brief that buries it — or omits it — is asking them to invest hours on trust. Most won't, and the ones who will are the ones with the least to do.",
          "Put the purse, the rate, the counting window and the verification rule in the first few lines. Everything else in the brief is downstream of whether those four numbers make the work worth doing.",
        ],
      },
      {
        h: "Give them something to cut",
        p: [
          "The single biggest determinant of clip volume is how easy the source material is to work with. A link to a two-hour stream is a wall. Time-stamped highlights, a folder of pre-cut segments, a stems or instrumental version, an approved b-roll pack — each one lowers the cost of an attempt and raises the number of attempts you get.",
          "Say what the moments are. You know your material better than any editor will after twenty minutes of scrubbing, and pointing at the six sections most likely to work is the cheapest performance improvement available to you.",
        ],
      },
      {
        h: "Say what you'll reject, precisely",
        p: [
          'Vague standards are the main cause of disputes. "High quality only" tells an editor nothing and gives you unlimited discretion, which good editors read as risk. Name the specific things: minimum resolution, whether the sound must be audible for a set duration, whether captions are required, what content is off-limits, whether the posting account must be public.',
          "Then hold to exactly that list. A campaign that rejects deliveries on criteria that weren't in the brief gets a reputation quickly, and it's not one you recover from cheaply.",
        ],
      },
      {
        h: "Leave the creative alone",
        p: [
          "Specify the constraints and the rejection criteria, not the edit. Editors who are told exactly what to make produce competent, identical clips; editors given the material and the rules produce a spread, and the spread is where the outlier lives.",
          "The line that converts, and that is worth saying out loud in the brief: we're not writing your video.",
        ],
      },
    ],
    faq: [
      {
        q: "How long should the counting window be?",
        a: "Long enough for a clip to have its run and short enough that the campaign settles. Bounty Sounds bounties typically count views for 14 days from delivery. Whatever you choose, publish it before anyone claims — a window disclosed afterwards is the most common reason a payout turns into an argument.",
      },
      {
        q: "Should I require approval before the clip goes up?",
        a: "Only if you genuinely need it. Pre-approval adds a round trip that costs you attempts, and for most sound and stream campaigns the rejection criteria do the same job at a fraction of the friction. Reserve it for material with real legal or brand sensitivity.",
      },
      {
        q: "What if nobody claims my bounty?",
        a: "Usually the rate is wrong for the effort, or the source material is too hard to cut. Both are fixable and both are visible: a bounty sitting unclaimed next to comparable ones that filled is telling you which of the two it is.",
      },
    ],
    cta: POST_CTA,
    related: [
      "how-to-measure-a-clipping-campaign",
      "pay-per-view-vs-flat-rate",
      "tiktok-sound-seeding",
    ],
    readAlso: [
      { label: "The move you can steal: publish your rate first", to: "/managers/max-flohr" },
    ],
    sources: [
      { label: "Bounty Sounds — how it works", url: "https://bountysounds.com/how-it-works" },
    ],
    seo: {
      title: "How to Brief a Clipping Campaign",
      description:
        "Money first, material second, rules third. What to publish before anyone claims, how to make footage cheap to cut, why vague rejection criteria cost you.",
    },
  },
  {
    slug: "how-to-measure-a-clipping-campaign",
    question: "How do you measure a clipping campaign?",
    navLabel: "Measuring results",
    shortAnswer:
      "Measure cost per thousand verified views, not cost per clip. Then track sound usage over time rather than at launch, whether views converted into saves and streams rather than stopping at the video, and which editors produced repeat results — because the second campaign should not start from zero.",
    sections: [
      {
        h: "The four numbers worth keeping",
        p: [
          "**Cost per thousand verified views.** The only figure that compares one campaign to another, or to a paid media buy. Reported influencer CPMs sit roughly in the $5–$25 band and paid TikTok in-feed around $3–$15 — that's your benchmark for whether a campaign was efficient.",
          "**Sound usage over time.** Total videos using the audio, plotted weekly. A campaign that spikes at launch and flatlines bought posts; one that keeps climbing after the purse empties started something.",
          "**Downstream conversion.** Saves, playlist adds, streams, profile visits, whatever the actual objective is. Views that never convert are an audience that watched something adjacent to you.",
          "**Repeat editors.** Which people delivered results more than once. This is the compounding asset and almost nobody tracks it.",
        ],
      },
      {
        h: "What not to measure",
        p: [
          "**Clip count.** Volume of deliveries tells you the rate was attractive, not that the campaign worked. It's an input.",
          "**Follower growth on the posting accounts.** That's the editor's business, not yours.",
          "**Engagement rate in isolation.** A clip with a small, highly engaged audience can be worth less than a clip with a large, indifferent one, depending on the objective. Decide the objective first.",
        ],
      },
      {
        h: "The attribution problem, honestly",
        p: [
          "Short-form video is genuinely hard to attribute. A person who hears a sound, does nothing for a week, then searches the artist on a different platform is invisible to any clean measurement you can run, and there are a lot of those people.",
          "Two things help. Measure the platform-native signal you *can* see — sound usage, and the shape of its curve after spend stops. And hold the rest of your marketing steady during a campaign window so the change you're reading is more likely to be the thing you changed.",
        ],
      },
      {
        h: "Comparing across campaigns",
        p: [
          "Keep the terms comparable. If the counting window changes between campaigns, your CPM comparison is measuring the window as much as the campaign. Publish the same structure — purse, rate, window, verification rule — and the numbers start telling you something about the material rather than the mechanics.",
        ],
      },
    ],
    faq: [
      {
        q: "What's a good cost per thousand views for clipping?",
        a: "Compare it against your alternatives rather than an absolute: influencer CPMs are commonly quoted at $5–$25 and paid TikTok in-feed around $3–$15. We deliberately don't publish a Bounty Sounds benchmark — the board hasn't run long enough for an average to mean anything. The live board shows every posted rate, which is the honest version of that number.",
      },
      {
        q: "How do I know the views are real?",
        a: "On a per-view contract, verification is structural rather than optional: deliveries are checked against the posting account and the contract's sound, and synthetic traffic forfeits the payout. That's the main measurement advantage over flat-fee work, where an inflated count costs the creator nothing.",
      },
      {
        q: "How long should I wait before judging a campaign?",
        a: "At minimum through the full counting window, and ideally a few weeks past it — the useful signal is whether sound usage keeps climbing once you've stopped paying for it. Judging at launch measures your rate, not your material.",
      },
    ],
    cta: BOARD_CTA,
    related: [
      "pay-per-view-vs-flat-rate",
      "how-to-brief-a-clipping-campaign",
      "how-much-does-tiktok-music-promotion-cost",
    ],
    sources: [
      {
        label: "What is a good CPM for influencer marketing",
        url: "https://influenceradvisory.com/blog/cpm-influencer-marketing/",
      },
      {
        label: "Influencer pricing benchmarks — Modash",
        url: "https://www.modash.io/blog/influencer-pricing",
      },
    ],
    seo: {
      title: "How to Measure a Clipping Campaign",
      description:
        "Cost per thousand verified views, sound usage over time, conversion, repeat editors. What to track, what to ignore, and the attribution problem stated honestly.",
    },
  },
  {
    slug: "podcast-clip-marketing",
    question: "How do you turn a podcast into short-form clips that actually travel?",
    navLabel: "Podcast clips",
    shortAnswer:
      "Pay editors to find the moments rather than paying an agency to cut a fixed number of clips. A podcast episode contains a handful of genuinely shareable minutes and you are usually the worst judge of which ones they are — so structure the work so many people go looking, and pay on what the clips actually did.",
    sections: [
      {
        h: "Why in-house clipping underperforms",
        p: [
          "The standard arrangement is an editor producing three to five clips per episode, chosen by you or by them. That produces a steady supply of competent clips and almost no outliers, because the sample is tiny and the selection is made by people who already know what the episode was about.",
          "The moment that travels is usually the one that reads as surprising to someone who wasn't there. Familiarity with the material is a handicap in finding it.",
        ],
      },
      {
        h: "Widen the search instead of the budget",
        p: [
          "Open the episode to many editors and let them compete to find the moment. Twenty people scrubbing an episode will surface candidates you would never have picked, and under a per-view structure the ones who pick badly cost you nothing.",
          "This is the same logic as sound seeding, applied to spoken word: buy attempts rather than deliverables, because outcomes are decided by the tail.",
        ],
      },
      {
        h: "Make the episode cheap to cut",
        p: [
          "Podcast footage is expensive to work with — long, conversational, often visually static. Anything you supply that reduces that cost buys you attempts: a transcript, chapter markers, a list of the segments you thought were strong, clean multi-cam files if you have them, and permission on the music bed.",
          "A hybrid structure earns its place here more than anywhere. A small flat fee per approved clip covers the editing labour, and a per-view rate on top supplies the upside — because pure per-view asks an editor to gamble real hours on a hard edit.",
        ],
      },
      {
        h: "The same applies to keynotes and streams",
        p: [
          "Any long-form recorded material has the same shape: a great deal of footage, a few minutes worth clipping, and an owner who is badly placed to identify them. Keynotes in particular sit unwatched after the event when they contain the ninety seconds an entire industry would argue about.",
        ],
      },
    ],
    faq: [
      {
        q: "How many clips should one episode produce?",
        a: "More than you'd commission. The point of opening it up is that you don't know which moment works, so a wide field of attempts beats a curated handful. Under a per-view purse the attempts that miss cost nothing, which is what makes the width affordable.",
      },
      {
        q: "Do I keep the rights to clips other people make?",
        a: "Set it explicitly in the brief — this is exactly the kind of term that causes disputes when it's assumed rather than stated. Say who owns the clip, what you may reuse it for, and whether the editor may keep it on their own account.",
      },
      {
        q: "Does this work for a podcast with a small audience?",
        a: "Yes, and arguably better — clip reach is largely independent of the show's existing audience, since the clips are posted from the editors' accounts rather than yours. A small show with one genuinely surprising moment is well suited to this.",
      },
    ],
    cta: {
      line: "Post your episode or keynote as a bounty and let editors find the moment. Purse, rate and window are on the contract before anyone starts.",
      label: "post a keynote or episode",
      href: "/keynotes" as const,
    },
    related: [
      "how-to-brief-a-clipping-campaign",
      "pay-per-view-vs-flat-rate",
      "short-form-video-marketing-for-brands",
    ],
    sources: [
      {
        label: "Bounty Sounds — keynote and long-form campaigns",
        url: "https://bountysounds.com/keynotes",
      },
    ],
    seo: {
      title: "Podcast Clip Marketing: Finding the Moment That Travels",
      description:
        "An episode holds a few shareable minutes and you're the worst judge of which. Open it to many editors and pay on what the clips actually did.",
    },
  },
  {
    slug: "short-form-video-marketing-for-brands",
    question: "How should a brand run short-form video without an agency retainer?",
    navLabel: "Short-form for brands",
    shortAnswer:
      "Buy attempts instead of deliverables. An agency retainer produces a predictable number of competent videos; short-form outcomes are decided by outliers, so the better structure is a posted purse that many editors can work against, paid on verified views, with the creative left to them.",
    sections: [
      {
        h: "The retainer problem",
        p: [
          "A monthly retainer buys a fixed output — say twelve videos — made by the same small team, to a house style, approved by the same people. That is a reasonable way to keep a channel alive and a poor way to find a breakout, because it optimises for consistency in a category where the returns are concentrated in a handful of anomalies.",
          "Reported retainer arrangements for consistent creator content run in the low thousands per month and up. The question worth asking is what the same budget buys as attempts rather than as scheduled deliverables.",
        ],
      },
      {
        h: "What a brand actually has to work with",
        p: [
          "More than most realise. Product footage, founder interviews, customer stories, event recordings, a sound or jingle you own, an archive nobody has cut in three years. Any of it can be posted as source material against a purse.",
          "The constraint is rarely material and almost always rights: be explicit about what editors may use, what they may not, and what happens to the clip afterwards. Sorting that once unlocks everything else.",
        ],
      },
      {
        h: "Give up creative control on purpose",
        p: [
          "The instinct is to specify the video. Resist it. Editors told exactly what to make return exactly what you imagined, which is the ceiling, not the floor. Set the constraints — what's off-limits, what must be legible, what you'll reject — and let the edit be theirs.",
          'Saying so explicitly in the brief converts. "We\'re not writing your video" is the line, and it works because most briefs in this market do the opposite.',
        ],
      },
      {
        h: "Disclosure is not optional for brands",
        p: [
          "Whatever ambiguity exists around music promotion, a brand paying creators to post about its product is squarely in paid-endorsement territory. Require the disclosure in the brief and make it a rejection criterion. It costs nothing in performance and the alternative is a regulatory problem attached to your own name.",
        ],
      },
    ],
    faq: [
      {
        q: "Isn't an open call risky for brand safety?",
        a: "It's manageable, and the management is the brief. Name the off-limits content, require the posting account to be public so it can be reviewed, keep approval rights over what you amplify from your own channels, and make disclosure a condition of payment. Those four things cover most of it.",
      },
      {
        q: "What if we have no video assets?",
        a: "Then start with what you can record cheaply — a founder answering the questions customers actually ask is usually the highest-yield material a small brand has, and it costs an afternoon. Editors can do a great deal with plain talking-head footage and a transcript.",
      },
      {
        q: "How does this compare to running paid ads?",
        a: "Different instruments. Paid ads buy predictable, targetable impressions at a known CPM — commonly quoted around $3–$15 in-feed on TikTok. A clipping purse buys uncertain reach with a much higher ceiling and pays only on verified views. Most brands should run both and compare cost per thousand honestly.",
      },
    ],
    cta: POST_CTA,
    related: [
      "clipping-vs-influencer-marketing",
      "how-to-brief-a-clipping-campaign",
      "how-to-measure-a-clipping-campaign",
    ],
    sources: [
      {
        label: "Influencer and retainer pricing models — Modash",
        url: "https://www.modash.io/blog/influencer-pricing",
      },
      {
        label: "CPM benchmarks for influencer marketing",
        url: "https://influenceradvisory.com/blog/cpm-influencer-marketing/",
      },
    ],
    seo: {
      title: "Short-Form Video Marketing for Brands, Without a Retainer",
      description:
        "A retainer buys a fixed number of competent videos. Short-form returns concentrate in outliers, so buy attempts: a posted purse paid on verified views.",
    },
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export const GUIDE_SLUGS = GUIDES.map((g) => g.slug);
