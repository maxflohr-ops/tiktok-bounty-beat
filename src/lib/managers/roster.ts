// The roster behind "Greatest Music Managers Nobody Knows."
//
// House rule for this file, inherited from the SEO skill's traceable-truth
// principle: every claim about a living or dead person here is checkable
// against the sources listed on the entry. No invented deal points, no
// invented quotes, no numbers we can't point at. If we can't source it,
// it doesn't ship — a page that gets one fact wrong is a page that never
// gets cited again.

export type Source = { label: string; url: string };

export type Manager = {
  slug: string;
  /** Display name. Duos render as "A & B". */
  name: string;
  /** Sort key for the roster listing. */
  sortName: string;
  /** Where they worked from, in words a reader can place. */
  era: string;
  /** The company, if the company is the thing people half-remember. */
  company?: string;
  /** Artists, most recognisable first. This is the recall hook. */
  known: string[];
  /** The one sentence an answer engine should be able to lift whole. */
  claim: string;
  /** The body, one string per paragraph. */
  body: string[];
  /** The transferable part. Without this the page is trivia, not a resource. */
  lesson: { title: string; text: string };
  /**
   * A portrait, but only ever a freely-licensed one.
   *
   * ⚠️ Do NOT add a photo scraped from a news site, a label site, an agency,
   * Getty, or a social profile. Editorial photos of these people are almost
   * all rights-managed, and hosting one is how a small site collects a
   * four-figure demand letter. Only public-domain or Creative Commons files
   * belong here, and the licence terms have to be satisfied on the page —
   * which is why `author`, `licence` and `licenceUrl` are required, not
   * optional. Most of the roster has no free photo and correctly renders a
   * monogram instead; that is the expected state, not a gap to fill.
   */
  portrait?: {
    src: string;
    alt: string;
    author: string;
    licence: string;
    licenceUrl: string;
    /** The file's description page, so the claim is checkable. */
    sourceUrl: string;
  };
  /**
   * The inside-baseball part: the specific move an underground act or small
   * brand can run on Monday, with no budget and no relationships. `lesson` is
   * the principle; this is the mechanic. If it can only be executed by someone
   * already managing a stadium act, it doesn't belong here.
   */
  trick: { title: string; text: string };
  /**
   * A real, sourced quotation. `speaker` exists because the best line about a
   * manager is often said by the artist rather than by the manager — Neil
   * Young on Elliot Roberts being the obvious case. Never paraphrase into
   * these: if the source only summarises, the entry goes without a quote.
   */
  quote?: { text: string; speaker: string; context?: string; source: Source };
  sources: Source[];
  /** Canonical external identity, for schema.org sameAs. */
  sameAs?: string[];
  seo: { title: string; description: string };
};

export const MANAGERS: Manager[] = [
  {
    slug: "peter-grant",
    name: "Peter Grant",
    sortName: "Grant, Peter",
    era: "1968–1980",
    known: ["Led Zeppelin", "Bad Company", "The Yardbirds"],
    claim:
      "Peter Grant managed Led Zeppelin from 1968 to 1980 and forced the concert business to pay artists roughly 90% of the gate instead of the 40–50% promoters had been keeping — the split most touring artists still work from today.",
    body: [
      "Before Grant, a promoter could keep half the money a band's own audience paid to see them, and the band was expected to be grateful for the exposure. Grant looked at that arrangement, decided it was upside down, and refused to book Led Zeppelin on it. He negotiated a 90/10 split in the artist's favour, and because Led Zeppelin were big enough that no promoter could afford to say no, the term stuck. Then it spread. It is now close to industry standard, which is the strange fate of a genuinely radical idea: it becomes invisible.",
      "He was equally stubborn about what the band did not do. No singles pulled off the albums in the UK. No television. Almost no press access. Every one of those decisions cost money in the short term and looked, to the people around him, like career suicide. What they actually did was make Led Zeppelin's live show the only way to get the thing, which is the same asset the 90/10 split had just made enormously valuable. The refusals and the deal were one strategy, not two.",
      "Grant's reputation for physical intimidation is real and well documented, and it is the reason he is remembered as a character rather than as a strategist. That is a disservice. The bootlegger-chasing and the confrontations were the enforcement arm of a coherent theory: the band owns the demand, so the band should own the terms.",
    ],
    lesson: {
      title: "Own the scarce thing, then reprice it",
      text: "Grant did not win the 90/10 split by negotiating harder. He won it by first making Led Zeppelin's live show impossible to get any other way — no TV, no singles, no shortcuts — and only then sitting down with promoters. Leverage is manufactured upstream of the meeting where you spend it.",
    },
    portrait: {
      src: "/art/managers/peter-grant.jpg",
      alt: "Peter Grant, manager of Led Zeppelin",
      author: "The rakish fellow",
      licence: "CC BY-SA 3.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
      sourceUrl: "https://commons.wikimedia.org/wiki/File:Peter_Grant.jpeg",
    },
    trick: {
      title: "Withhold exactly one thing",
      text: "Pick the single place everyone expects you to be — the full track on streaming, the whole set on YouTube, the feature everyone's asking for — and refuse it, publicly and consistently. Grant's leverage came from Led Zeppelin's live show being unavailable any other way. At your scale it costs nothing: the unreleased song only exists at the show, the full mix only on the vinyl. Scarcity is the one form of leverage that doesn't require money.",
    },
    quote: {
      text: "His tough guy image came out of there being so many cowboys around and the way musicians were taken advantage of.",
      speaker: "Robert Plant",
      context: "on Peter Grant",
      source: {
        label: "The ultimate Peter Grant interview — Louder",
        url: "https://www.loudersound.com/features/peter-grant-interview-life-with-led-zeppelin-and-the-death-of-john-bonham",
      },
    },
    sources: [
      {
        label: "Peter Grant — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Peter_Grant_(music_manager)",
      },
      {
        label: "Mark Blake on 'rock's greatest manager' — WBUR Here & Now",
        url: "https://www.wbur.org/hereandnow/2018/11/26/led-zeppelin-peter-grant-manager",
      },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Peter_Grant_(music_manager)"],
    seo: {
      title: "Peter Grant: The Manager Who Rewrote Touring Economics",
      description:
        "Peter Grant managed Led Zeppelin 1968–1980 and pushed touring from a 50/50 promoter split to 90/10 in the artist's favour — roughly the standard ever since.",
    },
  },
  {
    slug: "bill-curbishley",
    name: "Bill Curbishley",
    sortName: "Curbishley, Bill",
    era: "1974–present",
    company: "Trinifold Management",
    known: ["The Who", "Robert Plant", "Jimmy Page", "Judas Priest"],
    claim:
      "Bill Curbishley has managed The Who since 1976 through Trinifold, the company he founded in 1974, and is the manager who talked Robert Plant into dissolving his band and starting over — and later talked him back into a room with Jimmy Page.",
    body: [
      "Curbishley took over The Who in 1976 after a royalty dispute, and has been there ever since — roughly half a century with one band, which in this business is less a job than a geological era. Trinifold, founded in 1974 with his wife Jackie, grew from that one client to Judas Priest, Robert Plant and Jimmy Page.",
      "The Plant story is the one worth studying. In the mid-1980s Plant had a working touring band and a solo career that functioned. Curbishley told him to disband it, start again with new musicians, and write with different people. That is an unusually expensive piece of advice to give a client who is currently paying you a percentage of the thing you're asking him to destroy, and it is the reason Plant re-emerged rather than settling into a long, comfortable decline. In 1994 Curbishley took on Jimmy Page as well and got Plant and Page working together again — the 'Unledded' album and tour — after other people had failed at the same errand for years.",
      "He has been consistently blunt in interviews about what the job is: signing an artist means taking their life in your hands, and it demands total commitment. He has also been blunt about the bullying of artists that was routine in the industry he came up in, and about his dislike of it.",
    ],
    lesson: {
      title: "Be willing to tell your client to burn a working thing",
      text: "A manager on commission has a structural incentive to protect whatever currently generates income. The managers who last are the ones who will tell an artist to dismantle a functioning career because the next version is better — and who are trusted enough to be believed when they do.",
    },
    trick: {
      title: "Kill the format that plateaued",
      text: "Find the thing that got you here and has now been flat for two quarters — the series, the sound, the format — and end it deliberately instead of milking it down to nothing. Curbishley told Robert Plant to disband a working band. The tell is when engagement holds steady while reach stops growing: that's a ceiling, not a plateau, and no amount of posting fixes it.",
    },
    quote: {
      text: "When you sign an artist, you're taking their life in your hands. You have to commit 100%.",
      speaker: "Bill Curbishley",
      source: {
        label: "Bill Curbishley — Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/when-you-sign-an-artist-youre-taking-their-life-in-your-hands-you-have-to-commit-100/",
      },
    },
    sources: [
      {
        label: "Bill Curbishley — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Bill_Curbishley",
      },
      {
        label:
          "'When you sign an artist, you're taking their life in your hands' — Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/when-you-sign-an-artist-youre-taking-their-life-in-your-hands-you-have-to-commit-100/",
      },
      { label: "Trinifold Management", url: "https://www.trinifold.co.uk/about-us" },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Bill_Curbishley"],
    seo: {
      title: "Bill Curbishley: Fifty Years Managing The Who",
      description:
        "Bill Curbishley founded Trinifold in 1974 and has managed The Who since 1976. He told Robert Plant to start over — then reunited him with Jimmy Page.",
    },
  },
  {
    slug: "elliot-roberts",
    name: "Elliot Roberts",
    sortName: "Roberts, Elliot",
    era: "1967–2019",
    company: "Lookout Management",
    known: ["Neil Young", "Joni Mitchell", "Tom Petty"],
    claim:
      'Elliot Roberts managed Neil Young for more than fifty years and Joni Mitchell from the start of her career; Young called him "the greatest manager of all time."',
    body: [
      "Roberts heard a tape of Joni Mitchell, became her manager, and founded Lookout Management. It was Mitchell who pushed him toward Neil Young after Buffalo Springfield fell apart. That relationship then ran for over half a century, until Roberts died in 2019 — a length of tenure that is almost unheard of, and which happened alongside a client famous for changing direction without warning and for suing, or being sued by, people who wanted him to be more commercial.",
      "That is the whole point of Roberts. His clients were two of the most uncompromising artists of their generation, and the job was not to make them compromise. It was to build a business durable enough that they never had to. He worked with David Geffen early on before the two went separate ways, and also managed Tom Petty among others.",
      "There is almost no Elliot Roberts mythology, no book, no signature deal people quote. What there is instead is the fact that Neil Young — not a man who hands out compliments — called him the greatest manager of all time.",
    ],
    lesson: {
      title: "Longevity is the deliverable",
      text: "Roberts left behind no famous negotiation. He left behind fifty years of one artist never being forced to make a record he didn't want to make. If you are managing a genuine original, the job is to absorb the commercial pressure so it never reaches them.",
    },
    trick: {
      title: "Never forward the ask",
      text: "When a label, brand, promoter or platform asks the artist for something, don't pass the message along. Convert it into a one-line yes/no with your recommendation attached. Roberts's fifty years with Neil Young ran on absorbing commercial pressure so it never reached the desk. If you're self-managing, do it to yourself: batch every ask into one weekly decision block instead of letting them interrupt the work.",
    },
    quote: {
      text: "The greatest manager of all time.",
      speaker: "Neil Young",
      context: "on Elliot Roberts",
      source: {
        label: "Neil Young's tribute — NME",
        url: "https://www.nme.com/news/music/elliot-roberts-manager-neil-young-joni-mitchell-died-2512960",
      },
    },
    sources: [
      { label: "Elliot Roberts — Wikipedia", url: "https://en.wikipedia.org/wiki/Elliot_Roberts" },
      {
        label: "Neil Young's tribute — NME",
        url: "https://www.nme.com/news/music/elliot-roberts-manager-neil-young-joni-mitchell-died-2512960",
      },
      {
        label: "Elliot Roberts, longtime Neil Young manager, dead at 76 — Rolling Stone",
        url: "https://www.rollingstone.com/music/music-news/elliot-roberts-neil-young-manager-dead-851390/",
      },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Elliot_Roberts"],
    seo: {
      title: "Elliot Roberts: Fifty Years With Neil Young",
      description:
        "Elliot Roberts founded Lookout Management and managed Neil Young for fifty years and Joni Mitchell from the start. Young called him the greatest of all time.",
    },
  },
  {
    slug: "herbie-herbert",
    name: "Herbie Herbert",
    sortName: "Herbert, Herbie",
    era: "1973–1993",
    company: "Nightmare Productions / Nocturne",
    known: ["Journey", "Santana (as crew)", "Europe"],
    claim:
      "Herbie Herbert assembled Journey in 1973 and managed them for twenty years, building the in-house production companies — Nightmare and Nocturne — whose large-format video and touring systems became the template for the modern stadium show.",
    body: [
      "Herbert came up as a roadie for Santana under Bill Graham, put the original Journey line-up together himself in 1973, and managed the band until 1993. Assembling the act you then manage is unusual enough; what makes him a case study is what he built around it.",
      "Rather than renting the touring apparatus from vendors, he built it. Nightmare Productions handled the records; Nocturne Productions pioneered large-scale video and pushed lighting and sound design toward what stadium-sized rooms actually needed. Those systems outlived the band's peak and became infrastructure the whole live industry now runs on. He and Journey's art director Jim Welch also ran a deliberate visual campaign — the Stanley Mouse and Alton Kelley artwork, the one-word album titles, coordinated point-of-purchase presence — treating the band's look as a managed asset rather than a by-product.",
      "He also turned the band's earnings into holdings rather than income, notably in real estate. That is the least glamorous sentence on this page and possibly the most useful one.",
    ],
    lesson: {
      title: "Own your supply chain",
      text: "Herbert's insight was that a touring band pays rent on everything — production, video, merch fulfilment — and that those costs are someone else's margin. Building the vendor instead of hiring it turned Journey's overhead into an asset that kept earning after the band's chart run ended.",
    },
    trick: {
      title: "In-house your biggest recurring cost",
      text: "Look at your last six months of spend, find the line item that recurs and is predictable — video edits, photography, merch fulfilment, clip sourcing — and bring it in-house. Herbert built Journey's own production and lighting companies instead of renting them, and those companies outlived the band's chart run. Once it's in-house and working, sell it to three peers at your level. Overhead becomes an asset.",
    },
    quote: {
      text: "A weird mix of Haight Street benevolence and Wall Street smarts.",
      speaker: "Rolling Stone",
      context: "on Herbert's method",
      source: {
        label: "Journey: The Platinum Game Plan — Rolling Stone",
        url: "https://www.rollingstone.com/music/music-news/journey-the-platinum-game-plan-189450/",
      },
    },
    sources: [
      { label: "Herbie Herbert — Wikipedia", url: "https://en.wikipedia.org/wiki/Herbie_Herbert" },
      {
        label: "Herbie Herbert, longtime manager of Journey, dies at 73 — Variety",
        url: "https://variety.com/2021/music/obituaries-people-news/herbie-herbert-music-manager-journey-dies-dead-1235097423/",
      },
      {
        label: "Original Journey manager and Bill Graham protégé — Pollstar",
        url: "https://news.pollstar.com/2021/10/27/herbie-herbert-original-journey-manager-and-bill-graham-protege-dies-at-73/",
      },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Herbie_Herbert"],
    seo: {
      title: "Herbie Herbert: The Manager Who Built the Stadium Show",
      description:
        "Herbie Herbert assembled Journey in 1973 and managed them two decades, building the in-house video and production firms behind the modern stadium show.",
    },
  },
  {
    slug: "burnstein-and-mensch",
    name: "Cliff Burnstein & Peter Mensch",
    sortName: "Burnstein, Cliff & Mensch, Peter",
    era: "1982–present",
    company: "Q Prime",
    known: ["Metallica", "Red Hot Chili Peppers", "Def Leppard", "Muse"],
    claim:
      "Cliff Burnstein and Peter Mensch founded Q Prime in 1982 and have managed Metallica since 1984 — one of the longest continuous artist-manager relationships in music, run from a company that has stayed deliberately small and independent.",
    body: [
      "The origin is a cold call. In 1973 Burnstein was a radio promoter at Mercury Records in Chicago and rang the programme director of the student station at Brandeis University, who was Peter Mensch. They later worked together at Leber-Krebs, the firm that handled AC/DC, and in 1982 left to start Q Prime. Metallica arrived in 1984 and never left.",
      "Q Prime's roster has run through Def Leppard — whom they managed from 1982 to 2005 across more than fifty million albums — Red Hot Chili Peppers, Muse in North America, Josh Groban, Snow Patrol, Cage The Elephant, Foals and others. What it has never done is roll up. The independent-management sector consolidated around them repeatedly and Q Prime stayed Q Prime.",
      "Their reputation inside the business is for the label game: structuring deals where the artist keeps optionality, and being entirely willing to walk. Metallica's ability to operate as effectively its own enterprise — controlling recording, touring, film and archive — is downstream of decades of that.",
    ],
    lesson: {
      title: "Two managers, one artist, forty years",
      text: "The Q Prime model is a partnership where each artist gets a lead but the other principal is genuinely across the account. It removes the single point of failure that kills most management companies — the one person who holds the relationship, and leaves with it.",
    },
    trick: {
      title: "Never be the only relationship",
      text: "Q Prime run two principals across every account, so no artist is one person's private client. At your scale the equivalent is that every important relationship — the promoter, the sync contact, the playlist editor, the top clipper — needs a second person on your side who has spoken to them. If one person leaving takes the relationship with them, you don't have a relationship, you have a dependency.",
    },
    quote: {
      text: "You get the acts, as a manager, you deserve.",
      speaker: "Cliff Burnstein & Peter Mensch",
      context: "a line they share",
      source: {
        label: "Q Prime on managing Metallica — Billboard",
        url: "https://www.billboard.com/music/music-news/q-prime-cliff-burnstein-peter-mensch-managing-metallica-33-years-7290324/",
      },
    },
    sources: [
      { label: "Q Prime — Wikipedia", url: "https://en.wikipedia.org/wiki/Q_Prime" },
      {
        label: "Burnstein and Mensch on managing Metallica — Billboard",
        url: "https://www.billboard.com/music/music-news/q-prime-cliff-burnstein-peter-mensch-managing-metallica-33-years-7290324/",
      },
      { label: "Q Prime Artist Management", url: "https://qprime.com/" },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Q_Prime"],
    seo: {
      title: "Q Prime: Cliff Burnstein & Peter Mensch, Metallica's Managers",
      description:
        "Burnstein and Mensch founded Q Prime in 1982 and have managed Metallica since 1984 — four decades, still independent. How the partnership model works.",
    },
  },
  {
    slug: "paul-mcguinness",
    name: "Paul McGuinness",
    sortName: "McGuinness, Paul",
    era: "1978–2013",
    known: ["U2"],
    claim:
      "Paul McGuinness managed U2 for over three decades and negotiated the band's ownership of their own master recordings — plus a 10% stake in Island Records, taken in lieu of unpayable royalties, that was worth around £30m when Island sold.",
    body: [
      "Masters ownership is the single most consequential thing an artist can hold and, for most of recorded-music history, the thing they were most reliably separated from. McGuinness got it for U2 as they broke through in the mid-1980s. The Beatles never had it.",
      "The Island story shows the same instinct working under pressure rather than from strength. Island could not afford to pay U2 what The Joshua Tree had earned. McGuinness took equity instead of cash — 10% of the company. Two years later Island was sold and that stake was reported at around £30 million for the band and their manager. A less imaginative manager takes the payment plan; a worse one sues a label he still needs.",
      "He stayed until 2013, roughly thirty-five years, and was treated within U2 as a member of the band in economic terms rather than a supplier to it. Since leaving he has been one of the more forceful public voices on how streaming and video platforms pay artists.",
    ],
    lesson: {
      title: "When they can't pay, take equity",
      text: "A counterparty who cannot pay you in cash is a counterparty with unusual flexibility on structure. McGuinness converted a bad-debt situation into ownership of the debtor. Ask what the other side has that isn't money.",
    },
    portrait: {
      src: "/art/managers/paul-mcguinness.jpg",
      alt: "Paul McGuinness, manager of U2, at the Stade de France",
      author: "Gaëtan Grivel",
      licence: "CC BY-SA 4.0",
      licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
      sourceUrl:
        "https://commons.wikimedia.org/wiki/File:Paul_McGuinness_with_U2_and_Gerard_Drouot_at_Stade_de_France_(cropped).jpg",
    },
    trick: {
      title: "Ask what they have that isn't money",
      text: "When someone wants to work with you and says the budget isn't there, don't take the payment plan and don't walk. Ask what else they've got. McGuinness took 10% of Island Records when they couldn't pay U2's royalties. Your version: ad inventory, studio time, a support slot, a data feed, a placement, equity in the brand. Counterparties who can't pay cash are unusually flexible on structure, and almost nobody asks.",
    },
    quote: {
      text: "More than anyone in my life, he is a person who believed in me and gave me the confidence to realize my potential as an artist.",
      speaker: "Bono",
      context: "on Paul McGuinness",
      source: {
        label: "A toast to our manager, Paul McGuinness — U2.com",
        url: "https://www.u2.com/media/player/732/22",
      },
    },
    sources: [
      {
        label: "Paul McGuinness — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Paul_McGuinness",
      },
      {
        label: "Profile of the man behind U2 — The Irish Post",
        url: "https://www.irishpost.com/business/paul-mcguinness-profile-man-behind-u2-16739",
      },
      {
        label: "U2 and Paul McGuinness: the end of the affair — The Irish Times",
        url: "https://www.irishtimes.com/life-and-style/people/u2-and-paul-mcguinness-the-end-of-the-affair-1.1596313",
      },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Paul_McGuinness"],
    seo: {
      title: "Paul McGuinness: The Manager Who Got U2 Their Masters",
      description:
        "Paul McGuinness managed U2 for 35 years, won them their master recordings, and took a 10% stake in Island Records in lieu of royalties — worth ~£30m.",
    },
  },
  {
    slug: "coran-capshaw",
    name: "Coran Capshaw",
    sortName: "Capshaw, Coran",
    era: "1991–present",
    company: "Red Light Management",
    known: ["Dave Matthews Band", "Phish", "Chris Stapleton", "The Strokes"],
    claim:
      "Coran Capshaw built Dave Matthews Band from a weekly club gig at his own venue into a stadium act, then turned the method into Red Light Management — now the largest independent management company in the world — while founding the direct-to-fan business Musictoday and backing Bonnaroo.",
    body: [
      "In 1991 Capshaw owned Trax, a club in Charlottesville, Virginia, and gave a local band a weekly slot. He started managing them out of the venue. The strategy he used is now so standard it is hard to see as a strategy: let the audience tape and trade the shows, build the mailing list, sell direct, treat the live room as the product and the record as marketing. At the time, labels considered tape-trading theft.",
      "Musictoday made the direct-to-fan part into infrastructure — merchandise, ticketing and fan clubs run for other artists, years before 'D2C' was a phrase anyone used. He was also the primary early investor in Bonnaroo, which is to say he was betting on the American festival market before there was one. He later reacquired Musictoday from Live Nation.",
      "Red Light grew from that single client into the largest independent management firm in the business, with Phish, Chris Stapleton and The Strokes among many others, alongside stakes in ATO Records and other ventures. Capshaw is a fixture of the industry power lists and almost entirely unknown outside them.",
    ],
    lesson: {
      title: "The mailing list is the asset",
      text: "Capshaw's whole method is that the direct relationship with the audience outlasts every label deal, platform and format change. Everything else — merch, ticketing, festivals, the record — is monetisation of a list he made sure the artist owned.",
    },
    trick: {
      title: "End every campaign with more owned contacts",
      text: "Set one number for every release, show, or collaboration: how many email addresses or phone numbers you own that you didn't before. Capshaw let fans tape the shows and built the list, then sold direct for thirty years across four format changes. If a campaign moved streams but added nobody to a list you control, you rented an audience. Platforms change their minds; a list doesn't.",
    },
    quote: {
      text: "Artist management, I'll put down, is the toughest part of our industry. It's a personal relationship with the artists. You've got to support their vision, help add to their vision, put your own vision forward.",
      speaker: "Coran Capshaw",
      source: {
        label: "Coran Capshaw, Founder, Red Light Management — Pollstar",
        url: "https://news.pollstar.com/2019/05/16/coran-capshaw-founder-red-light-management/",
      },
    },
    sources: [
      { label: "Coran Capshaw — Wikipedia", url: "https://en.wikipedia.org/wiki/Coran_Capshaw" },
      { label: "Red Light Management — About", url: "https://redlightmanagement.com/about/" },
      {
        label: "Coran Capshaw, Founder, Red Light Management — Pollstar",
        url: "https://news.pollstar.com/2019/05/16/coran-capshaw-founder-red-light-management/",
      },
    ],
    sameAs: ["https://en.wikipedia.org/wiki/Coran_Capshaw"],
    seo: {
      title: "Coran Capshaw: Dave Matthews Band to Red Light Management",
      description:
        "Coran Capshaw built DMB from his own club into a stadium act, founded Red Light Management and direct-to-fan pioneer Musictoday, and bankrolled early Bonnaroo.",
    },
  },
  {
    slug: "jonathan-dickins",
    name: "Jonathan Dickins",
    sortName: "Dickins, Jonathan",
    era: "2006–present",
    company: "September Management",
    known: ["Adele", "Jamie xx", "King Krule"],
    claim:
      "Jonathan Dickins founded September Management in 2006 and became Adele's manager in June 2006, months before she signed to XL — and has run one of the most patient release strategies in modern pop ever since.",
    body: [
      "The introduction came from XL A&R Nick Huggett. Dickins looked her up on MySpace and invited her round for a cup of tea; by his account there was a bond almost immediately, and she decided she wanted to work with him before he had finished deciding he wanted to work with her. He became her manager in June 2006 and she signed to XL about three months later.",
      "What followed is the most instructive part and the least dramatic: multi-year gaps between albums, near-total absence between campaigns, and a refusal to feed the release cadence the streaming era supposedly demands. Each record then arrives as an event rather than a content drop. That is a managed decision with a real cost — years of foregone income — and it has been vindicated at a scale that makes most 'always be posting' advice look like panic.",
      "September has stayed small and stayed independent, with a roster including Jamie xx and King Krule. Dickins talks publicly about the manager's job as working with labels rather than against them, which is a less romantic position than the Peter Grant tradition and, for an artist who wants a fifty-year career, probably a more useful one.",
    ],
    lesson: {
      title: "Scarcity still works, and it is expensive",
      text: "The reason nobody copies Adele's release strategy is not that it doesn't work. It's that it requires forgoing years of revenue and holding your nerve while the algorithm forgets you. Most managers cannot afford the conviction; it is the conviction that is the product.",
    },
    trick: {
      title: "Bank a deliberate gap",
      text: "Schedule a period of total silence — no posts, no releases, no features — long enough that a return is an event rather than an update. Dickins built Adele's career on multi-year gaps while the industry insisted on constant output. This is the hardest play on the list because it costs real reach while it's happening, and it only works if you come back with something finished. Decide the length in advance and write it down.",
    },
    quote: {
      text: "It's disrespectful to presume that because 21 sold so many records, that you have got a divine right to sell that amount again.",
      speaker: "Jonathan Dickins",
      source: {
        label: "'It's very important not to take anything for granted' — Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/jonathan-dickins-september-its-important-not-to-take-anything-for-granted-in-this-business/",
      },
    },
    sources: [
      {
        label:
          "Jonathan Dickins on Adele, labels, and what makes a great manager — Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/jonathan-dickins-on-adele-working-with-labels-and-what-makes-a-great-manager/",
      },
      {
        label: "Jonathan Dickins — Music Business Worldwide profile",
        url: "https://www.musicbusinessworldwide.com/people/jonathan-dickins/",
      },
      {
        label: "The Managers: Jonathan Dickins' September Song — HITS Daily Double",
        url: "https://www.hitsdailydouble.com/news/business/the-managers-jonathan-dickins-september-management-2025-06-30",
      },
    ],
    seo: {
      title: "Jonathan Dickins: Adele's Manager and the Case for Patience",
      description:
        "Jonathan Dickins founded September Management in 2006 and signed Adele that June, before XL did. How a slow release strategy beat the content treadmill.",
    },
  },
  {
    slug: "sarah-stennett",
    name: "Sarah Stennett",
    sortName: "Stennett, Sarah",
    era: "2003–present",
    company: "First Access Entertainment / FAE grp",
    known: ["Rita Ora", "Ellie Goulding", "Zayn Malik", "Iggy Azalea"],
    claim:
      "Sarah Stennett is a music lawyer turned manager who founded TurnFirst in 2003, developed Rita Ora and Ellie Goulding from the start, and in 2015 merged into a joint venture with Len Blavatnik's Access Industries to create First Access Entertainment.",
    body: [
      "Stennett came to management from law and A&R, which shows in how she structures things. TurnFirst, founded in 2003, developed Ellie Goulding, Rita Ora and Iggy Azalea — artists built from nothing rather than signed at the point of obvious traction, which is the harder and less fashionable half of the job.",
      "The 2015 move is the one other managers study. Rather than selling to a major or staying subscale, she took investment from Access Industries — Len Blavatnik's group, which also owns Warner Music — and formed First Access Entertainment as a joint venture. That gave a management company balance-sheet capacity: the ability to fund artist development itself instead of trading equity to a label for an advance. Zayn Malik's post-One Direction solo career was run through it.",
      "It is a structural answer to the oldest weakness in artist management. Managers earn a percentage of income they have no capital to create. Stennett went and got the capital.",
    ],
    lesson: {
      title: "A manager with a balance sheet is a different animal",
      text: "Most management companies are cash-flow businesses commissioning someone else's risk. Funding development in-house changes the negotiation with labels entirely, because you are no longer asking them to pay for the thing you need them to believe in.",
    },
    trick: {
      title: "Fund your own development",
      text: "Every advance you take is equity sold at the worst possible price: before the thing works. Stennett went and got outside capital so First Access could develop artists itself rather than trading masters for a cheque. Underground version: keep one month of runway ring-fenced specifically for making the next thing, so you can say no to the deal that arrives while you're broke. Leverage is mostly just not needing the money this week.",
    },
    quote: {
      text: "For me personally to want to work with someone, it has to be based around an emotional connection.",
      speaker: "Sarah Stennett",
      source: {
        label: "The Big Interview: Sarah Stennett — Music Week",
        url: "https://www.musicweek.com/interviews/read/the-big-interview-sarah-stennett/068118",
      },
    },
    sources: [
      { label: "FAE grp — Wikipedia", url: "https://en.wikipedia.org/wiki/FAE_grp" },
      {
        label:
          "Sarah Stennett partners with Access Industries to launch First Access Entertainment",
        url: "https://www.recordoftheday.com/news-and-press/sarah-stennett-partners-with-len-blavatniks-access-industries-to-launch-joint-venture-first-access-entertainment",
      },
      {
        label: "Sarah Stennett — Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/people/sarah-stennett/",
      },
    ],
    seo: {
      title: "Sarah Stennett: The Lawyer Who Built a Funded Management Company",
      description:
        "Sarah Stennett developed Rita Ora and Ellie Goulding from scratch, then merged with Access Industries in 2015 to form First Access Entertainment.",
    },
  },
  {
    slug: "rukasin-and-goodman",
    name: "Danny Rukasin & Brandon Goodman",
    sortName: "Rukasin, Danny & Goodman, Brandon",
    era: "2015–2025",
    company: "Best Friends Music",
    known: ["Billie Eilish", "FINNEAS", "Bishop Briggs", "BENEE"],
    claim:
      "Danny Rukasin and Brandon Goodman managed Billie Eilish from age 13 through a decade of global success at Best Friends Music, running a bedroom-made, sibling-produced project without ever handing it to the conventional pop machine. Eilish and FINNEAS moved to Sandbox Entertainment in March 2025.",
    body: [
      "They took on an unknown thirteen-year-old whose records were made by her brother in a bedroom in Highland Park, and the central management decision across the next ten years was to leave that intact. No outside hit-writing camps, no producer-of-the-moment, no repackaging. The team scaled around the artist instead of replacing her process with an industry one — which sounds obvious and is close to unheard of at that level of success.",
      "Eilish and FINNEAS have both described the pair's defining trait as treating them as adults from the beginning: real information, real decisions, no managing-down of a teenage client. That is also a risk-management strategy. Artists who understood every decision at the time are the ones who don't repudiate them at twenty-five.",
      "The relationship ran roughly a decade, through a run of number ones and a Spotify audience in the hundreds of millions, before Eilish and FINNEAS moved to Jason Owen's Sandbox Entertainment in March 2025. Best Friends continues with a roster including Bishop Briggs, BENEE, Mimi Webb and others.",
    ],
    lesson: {
      title: "Scale the team, not the artist",
      text: "The default response to early traction is to professionalise the music — better rooms, bigger writers, known producers. Rukasin and Goodman professionalised everything around a bedroom operation and left the operation alone, because the bedroom was the product.",
    },
    trick: {
      title: "Don't professionalise what's working",
      text: "The moment something takes off, everyone will tell you to upgrade it — better studio, real producer, proper agency. Rukasin and Goodman spent a decade scaling the team around a bedroom operation and left the operation alone, because the bedroom was the product. Before you change any part of the process, write down why you think it worked. If the upgrade contradicts that sentence, don't.",
    },
    quote: {
      text: "They were never condescending to us ever — treating us like peers even though we were children at the time.",
      speaker: "Billie Eilish & FINNEAS",
      context: "on their managers",
      source: {
        label: "Billie Eilish and FINNEAS on their managers — Billboard",
        url: "https://www.billboard.com/music/features/billie-eilish-finneas-managers-billboard-cover-story-2022-interview-1235061238/",
      },
    },
    sources: [
      {
        label: "Rukasin & Goodman on managing Billie Eilish — Pollstar",
        url: "https://news.pollstar.com/2020/03/25/danny-rukasin-brandon-goodman-on-managing-billie-eilish-from-13-year-old-unknown-to-18-year-old-superstar/",
      },
      {
        label:
          "Billie Eilish and FINNEAS on the managers who treated them like grown-ups — Billboard",
        url: "https://www.billboard.com/music/features/billie-eilish-finneas-managers-billboard-cover-story-2022-interview-1235061238/",
      },
      {
        label: "Billie Eilish and Finneas join Sandbox Management — Variety (March 2025)",
        url: "https://variety.com/2025/music/news/billie-eilish-and-finneas-join-jason-owen-sandbox-management-1236352266/",
      },
    ],
    seo: {
      title: "Danny Rukasin & Brandon Goodman: Billie Eilish's First Managers",
      description:
        "Best Friends Music managed Billie Eilish from 13 through a decade of global success without ever handing the bedroom-made project to the pop machine.",
    },
  },
  {
    slug: "anthony-saleh",
    name: "Anthony Saleh",
    sortName: "Saleh, Anthony",
    era: "2007–present",
    company: "Emagen Entertainment Group",
    known: ["Nas", "Kendrick Lamar", "Future", "Gunna"],
    claim:
      "Anthony Saleh began managing Nas at 23, founded Emagen Entertainment Group, and built a parallel investment practice — Emagen Investment Group and a partnership at WndrCo — that put Nas into early-stage technology including Coinbase. Kendrick Lamar joined his roster around 2021.",
    body: [
      "Saleh spent 2010 to 2012 as EVP at Troy Carter's Atom Factory before running Emagen. The roster has included Nas, Future, Gunna, YG, Alina Baraz and, since around 2021, Kendrick Lamar.",
      "The distinguishing move is that he did not treat management income as the business. He built an investment vehicle alongside it and directed artist capital into early-stage technology — Nas's position in Coinbase being the widely cited example — and became a partner at the technology investment firm WndrCo in 2016. That converts a career with a limited earning window into ownership with a long one.",
      "It is the most direct modern answer to the structural problem every manager on this page ran into: touring and recording income stops, and the manager's percentage stops with it. Saleh's version of the job assumes the money's job is to become other money.",
    ],
    lesson: {
      title: "Manage the capital, not just the career",
      text: "Artist income is front-loaded and finite; equity is neither. A manager who can credibly route earnings into ownership is doing something no percentage-of-gross model can replicate, and is worth keeping long after the touring slows down.",
    },
    trick: {
      title: "Route income into ownership",
      text: "Artist and brand income is front-loaded and finite. Saleh built an investment vehicle alongside the management company and put Nas into early-stage technology. You don't need a fund: the small version is deciding, in advance, a fixed percentage of every payment that never touches operating costs and goes into something that keeps earning after the campaign stops — catalogue, equity, a tool you own. Decide the percentage before the money arrives.",
    },
    quote: {
      text: "You can accomplish anything in the world if you don't care who gives the credit.",
      speaker: "Anthony Saleh",
      source: {
        label: "Plus One: Anthony Saleh — XXL",
        url: "https://www.xxlmag.com/plus-one-anthony-saleh/",
      },
    },
    sources: [
      {
        label: "Why every musician needs a manager like Anthony Saleh — Forbes",
        url: "https://www.forbes.com/sites/ogdenpayne/2016/01/04/why-every-musician-needs-a-manager-like-anthony-saleh/",
      },
      {
        label: "Plus One: Nas and Future's manager, Anthony Saleh — XXL",
        url: "https://www.xxlmag.com/plus-one-anthony-saleh/",
      },
      {
        label: "Who is Anthony Saleh? Kendrick Lamar's manager — Digital Music News",
        url: "https://www.digitalmusicnews.com/2021/11/09/anthony-saleh-kendrick-lamar-manager/",
      },
    ],
    seo: {
      title: "Anthony Saleh: Nas, Kendrick Lamar, and Managing the Capital",
      description:
        "Anthony Saleh started managing Nas at 23, founded Emagen, and built an investment practice that routed artist money into early-stage tech including Coinbase.",
    },
  },
  {
    slug: "chris-zarou",
    name: "Chris Zarou",
    sortName: "Zarou, Chris",
    era: "2010–present",
    company: "Visionary Music Group",
    known: ["Logic", "Jon Bellion"],
    claim:
      "Chris Zarou founded Visionary Music Group in 2010 after being rejected by every music internship he applied for, built Logic into a multi-platinum arena act, and in 2019 turned the company into a Sony imprint, Visionary Records.",
    body: [
      "A former Division I soccer player with no industry entry point, Zarou applied for music internships, got turned down by all of them, and started a management company instead. He was on the Forbes 30 Under 30 music list in 2018.",
      "Logic is the case study. The campaign was built on direct audience contact — mixtapes, relentless touring, a fanbase cultivated as a community rather than a metric — and produced millions of equivalent album units and hundreds of thousands of tickets sold. Jon Bellion followed a similar path to a triple-platinum single and a run of sold-out shows.",
      "In 2019 Sony entered a worldwide talent-development partnership with Zarou and launched Visionary Records, with him as CEO. That is the modern version of the manager-with-leverage story: not a fight with the label, but a structure where the label distributes what the manager's company signs and develops.",
    ],
    lesson: {
      title: "No access is not a blocker",
      text: "Zarou's entire career is evidence that the credential path into management is optional. Managers are validated by an artist who trusts them and results anyone can check, not by a résumé — which is why the field keeps being entered from the outside.",
    },
    trick: {
      title: "Start before anyone lets you",
      text: "Zarou was rejected by every music internship he applied for, so he founded a management company and built Logic into an arena act. There is no credential, licence or permission required to manage an artist or run a brand's campaign — only an artist who trusts you and results anyone can check. Pick one act at your level who is good and badly organised, do the job for ninety days, and put the terms in writing even at the smallest scale.",
    },
    quote: {
      text: "If you manage your clients like they are your own mother, you will always end up doing what’s best.",
      speaker: "Chris Zarou",
      source: {
        label: "How Visionary used free music and YouTube to mint stars — Digital Trends",
        url: "https://www.digitaltrends.com/music/visionary-music-group-exclusive-interview/",
      },
    },
    sources: [
      {
        label: "Sony Music launches new label with Logic manager Chris Zarou — Variety",
        url: "https://variety.com/2019/biz/news/sony-music-new-label-logic-manager-chris-zarou-1203116626/",
      },
      {
        label: "Logic manager Chris Zarou launches Sony imprint — Music Business Worldwide",
        url: "https://www.musicbusinessworldwide.com/logic-manager-chris-zarou-launches-sony-music-imprint-visionary-records/",
      },
      {
        label: "Visionary Music Group — Wikipedia",
        url: "https://en.wikipedia.org/wiki/Visionary_Music_Group",
      },
    ],
    seo: {
      title: "Chris Zarou: Rejected by Every Internship, Built Visionary",
      description:
        "Chris Zarou founded Visionary Music Group in 2010 after every music internship rejected him, built Logic into an arena act, and launched a Sony imprint.",
    },
  },
];

export function managerBySlug(slug: string): Manager | undefined {
  return MANAGERS.find((m) => m.slug === slug);
}

export const MANAGER_SLUGS = MANAGERS.map((m) => m.slug);
