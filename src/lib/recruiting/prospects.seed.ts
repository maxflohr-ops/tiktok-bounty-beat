// Researched creator prospects, verified by web search on the date shown.
// Loaded onto the Recruiting board by staff ("load researched prospects");
// nobody on this list has been contacted by the app — contact is manual.

export type ProspectSeed = {
  id: string;
  name: string;
  handle: string;
  platform: "tiktok" | "instagram" | "youtube";
  profile_url: string;
  segment: "sax" | "reactor" | "curator" | "edits";
  followers: string;
  campaign: "ridgeclub" | "ebril" | "max-stream";
  fit: string;
  opener: string;
  contact: string;
  sources: string[];
  verified_at: string;
};

export const PROSPECT_SEED: ProspectSeed[] = [
  {
    id: "olaf-gasiorek-sax",
    name: "OLAF GĄSIOREK",
    handle: "@olaf.gasiorek.sax",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@olaf.gasiorek.sax",
    segment: "sax",
    followers:
      "~167k followers (source: TikTok profile page https://www.tiktok.com/@olaf.gasiorek.sax, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Plays sax over pop/hip-hop staples on camera (recent: Eminem 'Mockingbird' with a cellist, Black Eyed Peas, Avicii), so a sax-led track is native to his feed.",
    opener:
      "Your Mockingbird sax x cello collab proved the horn can carry a rap song. 'biting bullets' by ridgeclub is a sax run through effects scoring GTA VI footage, and clippers get paid per 1k verified views on bountysounds.com. Want in?",
    contact: "k.strzalkowska@blackmooncreatives.com (management, listed in TikTok bio)",
    sources: [
      "https://www.tiktok.com/@olaf.gasiorek.sax",
      "https://www.tiktok.com/discover/tiktok-rap-song-with-saxophone",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "corey-staggers",
    name: "Corey Staggers",
    handle: "@cstaggz05_",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@cstaggz05_",
    segment: "sax",
    followers:
      "~262k followers (source: TikTok profile page https://www.tiktok.com/@cstaggz05_, fetched 2026-10-04)",
    campaign: "ebril",
    fit: "[Ebril match unconfirmed: based on audience, not her sound] Calls himself 'Kenny G-Unit' and plays R&B/rap hooks on sax (Usher 'Lovers & Friends', B5, Monaleo), which reaches the R&B audience Ebril's campaign targets.",
    opener:
      "Kenny G-Unit is the best bio on TikTok. Your Usher and Monaleo sax flips are exactly the lane for Ebril's campaign on Bounty Sounds: post with her official sound and get paid per 1k verified views.",
    contact: "coreystaggzsax@gmail.com",
    sources: [
      "https://www.tiktok.com/@cstaggz05_",
      "https://www.tiktok.com/discover/tiktok-rap-song-with-saxophone",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "charly-saax",
    name: "Charly Saax",
    handle: "@charlysaax",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@charlysaax",
    segment: "sax",
    followers:
      "~213k followers (source: TikTok profile page https://www.tiktok.com/@charlysaax, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Blends rap beats with echo-heavy sax (recent posts tagged #echo and #rap, plus Werenoi and Bad Bunny flips), close to ridgeclub's effected-sax sound.",
    opener:
      "You already put echo on the horn and play it over rap. ridgeclub does the same thing on 'biting bullets'. We're paying clippers per 1k verified views to score GTA VI with it. Don't be different to be different. Be different to be better.",
    contact: "",
    sources: [
      "https://www.tiktok.com/@charlysaax",
      "https://www.tiktok.com/discover/tiktok-rap-song-with-saxophone",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "jrsaxophonic",
    name: "JRsaxophonic",
    handle: "@jrsaxophonic",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@jrsaxophonic",
    segment: "sax",
    followers:
      "~298k followers (source: TikTok profile page https://www.tiktok.com/@jrsaxophonic, fetched 2026-10-04)",
    campaign: "max-stream",
    fit: "A Kansas City saxophonist who posts TikTok LIVE highlights and turned 'Spend Dat' into a sax turn-up, so he already works live and on clips the way the stream open call does.",
    opener:
      "'They said the sax couldn't make you turn up', and then you proved it on Spend Dat. Max is running an open call around his makeitbackmax stream on Bounty Sounds, paid per 1k verified views. A live sax player fits it well.",
    contact: "bookjrsax@gmail.com",
    sources: [
      "https://www.tiktok.com/@jrsaxophonic",
      "https://www.tiktok.com/discover/tiktok-rap-song-with-saxophone",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "caleb-arredondo",
    name: "Caleb Arredondo",
    handle: "@calebarredondosax",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@calebarredondosax",
    segment: "sax",
    followers:
      "~55k followers (source: TikTok profile page https://www.tiktok.com/@calebarredondosax, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Builds whole posts around cavernous reverb sax in echoey rooms (#saxophone #reverb). That is the 'sax through effects' sound ridgeclub's song is built on.",
    opener:
      "Your reverb-drenched sax clips have the same feel as ridgeclub's 'biting bullets'. We're scoring GTA VI with it and paying clippers per 1k verified views on bountysounds.com. Want to bring the echo?",
    contact: "",
    sources: [
      "https://www.tiktok.com/@calebarredondosax",
      "https://www.tiktok.com/@tonymanfredonia/video/7334005137071017258",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "kaylaandmusic",
    name: "kaylaandmusic",
    handle: "@kaylaandmusic",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@kaylaandmusic",
    segment: "sax",
    followers:
      "~6.5k followers (source: TikTok profile page https://www.tiktok.com/@kaylaandmusic, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "An LA sax player covering Steve Lacy, Sade, Coltrane's 'Giant Steps' and Kendrick's 'Alright', which is the jazz/lo-fi/hip-hop overlap ridgeclub lives in. Smaller account but active.",
    opener:
      "Giant Steps to Steve Lacy, played quietly so the dorm doesn't complain, is a whole vibe. ridgeclub's 'biting bullets' is lo-fi sax with hip-hop roots, and clippers earn per 1k verified views on Bounty Sounds. Want to try a cut?",
    contact: "",
    sources: [
      "https://www.tiktok.com/@kaylaandmusic",
      "https://www.tiktok.com/discover/kendrick-lamar-songs-you-can-play-on-saxophone",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "kmr-clips",
    name: "KMR Clips",
    handle: "@kmrclips",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@kmrclips",
    segment: "reactor",
    followers:
      "~137k followers (source: TikTok profile page https://www.tiktok.com/@kmrclips, fetched 2026-10-04)",
    campaign: "max-stream",
    fit: "Clips of KMR's Twitch producer stream reacting to viewers' beats ('this is crazy for his 3rd beat', 'who do yall hear on this beat'), the same stream-to-clip loop as Max's open call.",
    opener:
      "You turn stream beat reactions into clips better than most. Max is running an open call around his makeitbackmax stream on Bounty Sounds: clip it and get paid per 1k verified views. Different stream, same playbook.",
    contact: "kmrlive0@gmail.com",
    sources: [
      "https://www.tiktok.com/@kmrclips",
      "https://www.tiktok.com/discover/reacting-to-my-old-beats",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "prod-by-iiinfinite",
    name: "Prod.by.iiinfinite",
    handle: "@prod.by.iiinfinite",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@prod.by.iiinfinite",
    segment: "reactor",
    followers:
      "~164k followers (source: TikTok profile page https://www.tiktok.com/@prod.by.iiinfinite, fetched 2026-10-04)",
    campaign: "max-stream",
    fit: "A Billboard-credited producer (E-40, Tinashe) who reacts to subscribers' beats on livestream and flips samples, so he already does stream reactions.",
    opener:
      "You already react to subscriber beats live. Max's makeitbackmax stream open call on Bounty Sounds pays per 1k verified views for clips. And ridgeclub's sax track is worth a 'who can y'all hear on this?' too.",
    contact: "",
    sources: [
      "https://www.tiktok.com/@prod.by.iiinfinite",
      "https://www.tiktok.com/discover/reacting-to-my-subscribers-beats",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "izrosh",
    name: "IzRosh (Keno)",
    handle: "@izroshbeats",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@izroshbeats",
    segment: "reactor",
    followers:
      "~442k followers (source: TikTok profile page https://www.tiktok.com/@izroshbeats, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "His 'Did we cook??' format tests beats against the crowd and has started dance trends, a ready-made slot for reacting to a new sound.",
    opener:
      "'Did we cook??' is the right question for ridgeclub's 'biting bullets', a sax through effects with hip-hop roots. Bounty Sounds pays per 1k verified views to clip it. Your chat decides.",
    contact: "izroshbusiness@gmail.com",
    sources: [
      "https://www.tiktok.com/@izroshbeats",
      "https://www.tiktok.com/discover/react-to-my-music?lang=en",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "yaoan",
    name: "yaoan",
    handle: "@yaoan",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@yaoan",
    segment: "reactor",
    followers:
      "~446k followers (source: TikTok profile page https://www.tiktok.com/@yaoan, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "A producer and instrumentalist who flips game and anime themes (Pokemon, Bleach, Pirates) into beats. Game-culture remixing is close to scoring GTA VI with a sax track.",
    opener:
      "You've turned Pokemon and Bleach into beats. Now give Vice City a sax score. ridgeclub's 'biting bullets' x GTA VI is live on Bounty Sounds, paid per 1k verified views.",
    contact: "",
    sources: [
      "https://www.tiktok.com/@yaoan",
      "https://www.sceneandheardnu.com/content/2023/5/25/background-noise-lofi-artists-break-the-silence",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "jon-makes-beats",
    name: "Jon Makes Beats (Jonwayne)",
    handle: "@JonMakesBeats",
    platform: "youtube",
    profile_url: "https://www.youtube.com/@JonMakesBeats",
    segment: "reactor",
    followers:
      "~196K subscribers (source: YouTube channel page https://www.youtube.com/@JonMakesBeats, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Jonwayne's channel is built on sample-flipping and jazzy hip-hop beat-making (recent: 'Sampling Yoshi's Island'), the post-J Dilla lane ridgeclub's sax-and-effects music comes from.",
    opener:
      "From someone who samples Yoshi's Island with a straight face: ridgeclub runs a sax through effects over hip-hop roots, and 'biting bullets' is our GTA VI campaign. Shorts creators get paid per 1k verified views. Interested in a reaction or a flip?",
    contact: "",
    sources: [
      "https://www.youtube.com/@JonMakesBeats",
      "https://www.lalal.ai/blog/best-music-production-youtube-channels/",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "assortedtapes",
    name: "assortedtapes (AJ)",
    handle: "@assortedtapes",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@assortedtapes",
    segment: "curator",
    followers:
      "~265k followers (source: TikTok profile page https://www.tiktok.com/@assortedtapes, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "A Vegas-based curator posting 'best songs I heard last week' roundups and all-time album lists, with a submissions link in bio.",
    opener:
      "Your 'best songs I heard last week' list needs one sax track. ridgeclub's 'biting bullets' is post-minimalist, lo-fi jazz with hip-hop roots, and Bounty Sounds pays per 1k verified views for posts using it.",
    contact: "aj@assortedtapes.com",
    sources: [
      "https://www.tiktok.com/@assortedtapes",
      "https://www.stereofox.com/articles/10-best-tiktok-music-curators/",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "the-crunchy-beat",
    name: "The Crunchy Beat (Damon)",
    handle: "@thecrunchybeat",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@thecrunchybeat",
    segment: "curator",
    followers:
      "~297k followers (source: TikTok profile page https://www.tiktok.com/@thecrunchybeat, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Writes long-form 'one to watch' write-ups on underground electronic and alt artists and runs a weekly radio show, so he is good at breaking slow-building sounds.",
    opener:
      "You write about music that 'takes its time to develop'. That describes ridgeclub, a Toronto saxophonist running his horn through effects. 'biting bullets' is on Bounty Sounds, paid per 1k verified views. One to watch?",
    contact: "",
    sources: [
      "https://www.tiktok.com/@thecrunchybeat",
      "https://www.stereofox.com/articles/10-best-tiktok-music-curators/",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "occupiedliving",
    name: "Ben (occupiedliving)",
    handle: "@occupiedliving",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@occupiedliving",
    segment: "curator",
    followers:
      "~553k followers (source: TikTok profile page https://www.tiktok.com/@occupiedliving, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Hip-hop/R&B curator doing album deep-dives (Tyler's Flower Boy, 'listening to every song by Sam Austins') with a Canadian audience. Toronto's ridgeclub fits there. Slightly above the mid-tier range.",
    opener:
      "You'll listen to every song by an artist when the music earns it. Toronto's ridgeclub plays sax through effects with hip-hop roots. 'biting bullets' is live on Bounty Sounds, paid per 1k verified views.",
    contact: "occupiedliving.inquiries@gmail.com",
    sources: [
      "https://www.tiktok.com/@occupiedliving",
      "https://www.stereofox.com/articles/10-best-tiktok-music-curators/",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "kaseys-playlist",
    name: "kasey's playlist",
    handle: "@kaseys.playlist",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@kaseys.playlist",
    segment: "curator",
    followers:
      "~111k followers (source: TikTok profile page https://www.tiktok.com/@kaseys.playlist, fetched 2026-10-04)",
    campaign: "ebril",
    fit: "[Ebril match unconfirmed: based on audience, not her sound] An LA indie-music discovery page built on mood playlists ('new this week', seasonal must-listens) with a largely female indie audience, the crowd Ebril's campaign is aimed at.",
    opener:
      "Your 'new this week' list is how people find their next favorite artist. Ebril's campaign on Bounty Sounds pays per 1k verified views for posts with her official sound. She'd fit next to your fall must-listens.",
    contact: "",
    sources: [
      "https://www.tiktok.com/@kaseys.playlist",
      "https://www.stereofox.com/articles/10-best-tiktok-music-curators/",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "annabelle-klinee",
    name: "Annabelle (That Good Sh*t)",
    handle: "@annabelleklinee",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@annabelleklinee",
    segment: "curator",
    followers:
      "~206k followers (source: TikTok profile page https://www.tiktok.com/@annabelleklinee, fetched 2026-10-04)",
    campaign: "ebril",
    fit: "[Ebril match unconfirmed: based on audience, not her sound] Music curator and DJ (founder of That Good Sh*t) posting playlist upgrades and on-repeat picks across R&B/rap (Kaytranada, BKTheRula, Steve Lacy). A strong tastemaker fit for a female artist push.",
    opener:
      "Your playlist upgrades are the kind of co-sign that sticks. Ebril's campaign on Bounty Sounds pays per 1k verified views for posts with her official sound. Want to give her the That Good Sh*t treatment?",
    contact: "",
    sources: [
      "https://www.tiktok.com/@annabelleklinee",
      "https://www.stereofox.com/articles/10-best-tiktok-music-curators/",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "nspro",
    name: "NSPRO",
    handle: "@nspro23",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@nspro23",
    segment: "edits",
    followers:
      "~49k followers (source: TikTok profile page https://www.tiktok.com/@nspro23, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Made a widely shared Grand Theft Auto VI cinematic edit and still posts cinematic movie edits (Spider-Man, Wolf of Wall Street) and sells editing presets.",
    opener:
      "Your GTA VI cinematic edit set the tone in 2023. Do it again with a sax score: 'Make Vice City look like it was scored by a saxophone.' ridgeclub x GTA VI on Bounty Sounds pays per 1k verified views.",
    contact: "",
    sources: [
      "https://www.tiktok.com/@nspro23",
      "https://www.tiktok.com/@nspro23/video/7309132917119225120",
    ],
    verified_at: "2026-10-04",
  },
  {
    id: "antics",
    name: "Antics",
    handle: "@antics.alt",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@antics.alt",
    segment: "edits",
    followers:
      "~24k followers (source: TikTok profile page https://www.tiktok.com/@antics.alt, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "Gaming and character edits (Jason & Lucia GTA 6, TLOU, Resident Evil, Fallout) with clean cinematic pacing, a good fit for a GTA VI x sax brief.",
    opener:
      "Your Jason & Lucia edit already called them a peak duo. Now score them with a saxophone. ridgeclub's 'biting bullets' x GTA VI is on Bounty Sounds, paid per 1k verified views.",
    contact: "",
    sources: ["https://www.tiktok.com/@antics.alt", "https://www.tiktok.com/discover/gta-6-edit"],
    verified_at: "2026-10-04",
  },
  {
    id: "vacety",
    name: "vacety",
    handle: "@vacety",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@vacety",
    segment: "edits",
    followers:
      "~6.5k followers (source: TikTok profile page https://www.tiktok.com/@vacety, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "An After Effects editor posting a run of GTA 6 Jason Duval edits counting down to launch. Small but focused on the exact footage the campaign uses.",
    opener:
      "Nobody's edited more Jason Duval than you lately. Give him a saxophone soundtrack: ridgeclub's 'biting bullets' x GTA VI pays per 1k verified views on Bounty Sounds.",
    contact: "",
    sources: ["https://www.tiktok.com/@vacety", "https://www.tiktok.com/discover/gta-6-edit"],
    verified_at: "2026-10-04",
  },
  {
    id: "gx-s98",
    name: "GX.S98",
    handle: "@gx.s98",
    platform: "tiktok",
    profile_url: "https://www.tiktok.com/@gx.s98",
    segment: "edits",
    followers:
      "~78k followers (source: TikTok profile page https://www.tiktok.com/@gx.s98, fetched 2026-10-04)",
    campaign: "ridgeclub",
    fit: "A 4K edit account (anime, football, game fights) whose bio already says a platform pays it for edits, so it works as a per-view clipper.",
    opener:
      "You already get paid for edits, so here's another brief: GTA VI footage scored by ridgeclub's sax track 'biting bullets', paid per 1k verified views on Bounty Sounds. Make Vice City sound like jazz.",
    contact: "",
    sources: ["https://www.tiktok.com/@gx.s98", "https://www.tiktok.com/discover/gta-6-edit"],
    verified_at: "2026-10-04",
  },
];
