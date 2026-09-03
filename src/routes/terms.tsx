import { createFileRoute } from "@tanstack/react-router";
import { LegalDoc, LEGAL_EMAIL, OPERATOR, type LegalSection } from "@/components/LegalDoc";

const TITLE = "Terms of Service · Bounty Sounds";
const DESC =
  "The agreement between you and Bounty Sounds: eligibility, how bounties and purses work, payment and tax, authentic engagement rules, content rights, and platform compliance.";
const URL = "https://bountysounds.com/terms";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: URL },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: URL }],
  }),
  component: TermsPage,
});

const MAIL = (address: string) => (
  <a href={`mailto:${address}`} className="tap-inline underline underline-offset-2 hover:text-bone">
    {address}
  </a>
);

const SECTIONS: LegalSection[] = [
  {
    id: "agreement",
    heading: "The agreement",
    body: (
      <>
        <p>
          These Terms of Service are a binding agreement between you and {OPERATOR}, which operates
          Bounty Sounds at bountysounds.com (“Bounty Sounds,” “we,” “us”). By using the service,
          creating an account, posting a bounty, or claiming one, you agree to these terms and to
          our Privacy Policy. If you do not agree, do not use the service.
        </p>
      </>
    ),
  },
  {
    id: "what-it-is",
    heading: "What Bounty Sounds is",
    body: (
      <>
        <p>
          Bounty Sounds is a marketplace. Someone who wants clips made — an artist, streamer, label,
          or speaker (a “poster”) — publishes a bounty describing the work and posts a cash purse. A
          video editor (a “clipper”) claims the bounty, makes and posts a clip on a social platform,
          and is paid from that purse according to the rate printed on the bounty.
        </p>
        <p>
          We provide the board, the escrow of posted purses, verification, and payment rails. We are
          not a party to the creative relationship between a poster and a clipper, we do not own or
          license the underlying music or footage, and we are not your employer, agent, or joint
          venturer. Clippers are independent contractors and decide for themselves whether, when,
          and how to create a clip.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    heading: "Eligibility and accounts",
    body: (
      <>
        <p>
          You must be at least 13 years old to browse or hold an account, and at least 18 years old
          (or the age of majority where you live) to claim a bounty, deliver a clip for payment,
          post a purse, or receive a payout. If you use the service on behalf of a company, you
          confirm you are authorised to bind it.
        </p>
        <p>
          Keep your credentials confidential and your account details accurate. You are responsible
          for activity under your account. One person may not operate multiple accounts to take more
          than their share of a purse or to evade a claim cap. Tell us promptly at{" "}
          {MAIL(LEGAL_EMAIL)} if you suspect unauthorised use.
        </p>
      </>
    ),
  },
  {
    id: "clippers",
    heading: "Claiming and delivering: rules for clippers",
    body: (
      <>
        <p>
          Every bounty prints its rate, its purse, its deadline, and any campaign rules before you
          claim it. When you claim, you agree to those terms as published at that moment.
        </p>
        <ul>
          <li>
            <strong className="text-bone">Posting window.</strong> Your clip must be posted publicly
            before the bounty&rsquo;s deadline. Claims and first deliveries are not accepted after
            it passes.
          </li>
          <li>
            <strong className="text-bone">Counting window.</strong> Views count from your first
            delivery for the period stated on the bounty. The window opens once and does not reset.
          </li>
          <li>
            <strong className="text-bone">Cashing out.</strong> Once a clip was posted inside the
            window, you may cash the views it earns whenever they clear — there is no deadline on
            being paid.
          </li>
          <li>
            <strong className="text-bone">Verified views.</strong> Payment is calculated on the view
            figure we verify, not the figure displayed to you. Where a bounty pays per 100,000
            views, payment is pro rata to the view, and views may stack across your clips on that
            bounty.
          </li>
          <li>
            <strong className="text-bone">Purse limits.</strong> A purse is finite. Once it is
            exhausted, no further payouts are made from that bounty, even for eligible views. Where
            a bounty sets a cap on claims or clips per editor, that cap is binding.
          </li>
          <li>
            <strong className="text-bone">Campaign rules.</strong> Requirements printed on a bounty
            — a required sound, hashtag, aspect ratio, or logo overlay — are conditions of payment.
            A clip that ignores them may be rejected.
          </li>
          <li>
            <strong className="text-bone">Your clip must be yours.</strong> You must have the right
            to post everything in it, other than material the poster supplied for the campaign.
          </li>
        </ul>
        <p>
          We review delivered clips and may approve or reject them. Rejection reasons are recorded
          on the submission. Deleting, hiding, or making a clip private before it is paid ends its
          eligibility.
        </p>
      </>
    ),
  },
  {
    id: "posters",
    heading: "Posting a bounty: rules for posters",
    body: (
      <>
        <p>
          When you post a bounty, the purse is paid up front and held for that campaign. Purses are
          committed funds: amounts already paid out to clippers cannot be recalled, and a purse is
          not refundable once clippers have begun delivering against it in good faith. Unspent
          amounts on a campaign you end early may be returned at our discretion, less processing
          fees.
        </p>
        <p>
          You represent and warrant that you own or control all rights necessary for clippers to use
          the sound, footage, artwork, and any other material your campaign asks them to use,
          including the right to have it distributed on the relevant social platform — and that
          doing so infringes no third party&rsquo;s rights. You will indemnify Bounty Sounds and
          participating clippers against claims arising from material you supplied or asked for.
        </p>
        <p>
          Bounty terms must be accurate and honoured as published. You may not change the rate,
          purse, or requirements of a live bounty in a way that reduces what an existing claim is
          owed.
        </p>
      </>
    ),
  },
  {
    id: "authentic",
    heading: "Authentic engagement",
    body: (
      <>
        <p>
          Bounty Sounds pays for creative work that earns real audience attention. It does not buy
          views. This section is a strict condition of using the service.
        </p>
        <p>You may not, directly or through anyone else:</p>
        <ul>
          <li>
            use bots, automation, click farms, view exchanges, incentivised traffic, or paid
            services that generate views, likes, follows, or comments;
          </li>
          <li>
            use multiple or fake accounts, engagement pods, or coordinated inauthentic behaviour to
            inflate a clip&rsquo;s figures;
          </li>
          <li>misrepresent a clip&rsquo;s performance, authorship, or posting date;</li>
          <li>submit a clip you did not create or do not control;</li>
          <li>
            re-upload another editor&rsquo;s clip, or submit the same clip to a bounty more than
            once for duplicate payment.
          </li>
        </ul>
        <p>
          We verify view figures independently and may discount views that show signs of artificial
          inflation. If we reasonably determine that this section has been breached, we may reject
          affected submissions, withhold or reverse payment, remove clips from the board, suspend or
          close the account, and report the conduct to the relevant platform. Paid promotion of your
          own clip is permitted only where the bounty says so and where the platform&rsquo;s own
          rules allow it, and disclosed advertising must be labelled as the platform requires.
        </p>
      </>
    ),
  },
  {
    id: "platforms",
    heading: "Platform rules and independence",
    body: (
      <>
        <p>
          Bounty Sounds is an independent service. We are not affiliated with, endorsed by,
          sponsored by, or in partnership with TikTok, ByteDance, YouTube, Google, Meta, or any
          other platform. Platform names and marks are the property of their owners and are used
          only to describe where clips are posted.
        </p>
        <p>
          When you post a clip, you are also bound by that platform&rsquo;s own terms, community
          guidelines, music policies, and branded-content and disclosure rules. You are responsible
          for complying with them, including labelling commercial content where the platform
          requires it. Nothing in these terms overrides a platform&rsquo;s rules; where they
          conflict, the platform&rsquo;s rules govern what you may post there.
        </p>
        <p>
          A platform may remove content, restrict an account, or change its metrics at any time. We
          have no control over those decisions and are not liable for them. If a platform removes a
          clip before payment, it stops being eligible.
        </p>
      </>
    ),
  },
  {
    id: "payment",
    heading: "Payment, fees, and tax",
    body: (
      <>
        <p>
          Approved payouts are sent to the payout method you nominate — PayPal or a digital wallet
          address — and are made in United States dollars unless stated otherwise. You are
          responsible for the accuracy of your payout details; we are not liable for funds sent to
          an address you supplied incorrectly. Payment processors may apply their own fees, timings,
          and country restrictions.
        </p>
        <p>
          Clippers are independent contractors and are solely responsible for their own taxes. Once
          your lifetime earnings reach US$150, you must provide the tax information we request
          before further payouts are released, and we may report payments to tax authorities as law
          requires.
        </p>
        <p>
          Fees charged by Bounty Sounds, if any, are disclosed before you commit to a transaction.
          Optional paid placements, such as featuring a bounty on the board, are billed as described
          at the point of purchase and are non-refundable once the placement has run.
        </p>
      </>
    ),
  },
  {
    id: "content",
    heading: "Content and intellectual property",
    body: (
      <>
        <p>
          <strong className="text-bone">Your clips stay yours.</strong> You keep ownership of the
          clips you create. By submitting a clip to a bounty, you grant Bounty Sounds a
          non-exclusive, worldwide, royalty-free licence to display the clip&rsquo;s public URL,
          thumbnail, handle, and performance figures on the board, on that bounty&rsquo;s page, in
          our public campaign feed, and in ordinary promotion of the service. You also grant the
          poster of that bounty the licence stated on the bounty for use of the clip in connection
          with the campaign.
        </p>
        <p>
          <strong className="text-bone">Campaign material stays the poster&rsquo;s.</strong> Sounds,
          footage, artwork, and logo packs supplied for a campaign are licensed to you only for
          making and posting clips for that bounty, and that licence ends if your submission is
          rejected or the campaign closes.
        </p>
        <p>
          <strong className="text-bone">Our material stays ours.</strong> The Bounty Sounds name,
          look, seal, copy, and software are protected by intellectual property law and may not be
          copied or used without permission.
        </p>
        <p>
          If you believe material on Bounty Sounds infringes your copyright, send a notice to{" "}
          {MAIL(LEGAL_EMAIL)} identifying the work, the material, your contact details, and a
          statement of good-faith belief and accuracy. We remove infringing material and terminate
          repeat infringers.
        </p>
      </>
    ),
  },
  {
    id: "prohibited",
    heading: "Prohibited conduct",
    body: (
      <>
        <p>You may not use Bounty Sounds to:</p>
        <ul>
          <li>
            break the law, or infringe anyone&rsquo;s intellectual property, privacy, or publicity
            rights;
          </li>
          <li>
            post content that is hateful, harassing, sexually explicit, or that endangers minors;
          </li>
          <li>impersonate any person, artist, or brand, or misrepresent your affiliation;</li>
          <li>launder money, evade sanctions, or facilitate fraud;</li>
          <li>
            scrape, probe, overload, or reverse engineer the service, or bypass its rate limits or
            access controls;
          </li>
          <li>
            resell or sublicense access to the board, or create derivative marketplaces from our
            data without written permission.
          </li>
        </ul>
        <p>
          Our public API and campaign feed may be used by people and by automated agents, subject to
          these terms and any published rate limits. Automated participants must identify themselves
          honestly and remain subject to the authentic engagement rules above.
        </p>
      </>
    ),
  },
  {
    id: "suspension",
    heading: "Suspension and termination",
    body: (
      <>
        <p>
          You may stop using Bounty Sounds and close your account at any time. We may suspend or
          close an account, reject or reverse a payment, or remove content if we reasonably believe
          these terms have been breached, if required by law or a platform, or to prevent harm to
          users or to the service. Where the law allows and it is safe to do so, we will tell you
          why.
        </p>
        <p>
          Approved payouts already earned in compliance with these terms remain payable on
          termination. Sections that by their nature should survive — content licences already
          granted, payment and tax obligations, disclaimers, limits of liability, indemnities, and
          dispute terms — survive termination.
        </p>
      </>
    ),
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    body: (
      <>
        <p>
          The service is provided “as is” and “as available.” To the fullest extent permitted by
          law, we disclaim all warranties, express or implied, including merchantability, fitness
          for a particular purpose, and non-infringement.
        </p>
        <p>
          <strong className="text-bone">We do not guarantee earnings.</strong> Nothing on Bounty
          Sounds is a promise of income. What you earn depends on the views your clips genuinely
          attract, the rate and purse on the bounty, and the purse remaining. We do not guarantee
          that any bounty will be claimed, that any clip will be approved, or that a platform will
          keep a clip online or report metrics accurately.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <>
        <p>
          To the fullest extent permitted by law, Bounty Sounds and {OPERATOR} will not be liable
          for indirect, incidental, special, consequential, exemplary, or punitive damages, or for
          lost profits, revenue, data, or goodwill, arising from or related to your use of the
          service.
        </p>
        <p>
          Our total liability for all claims relating to the service in any 12-month period is
          limited to the greater of the amounts you paid to or earned through Bounty Sounds in that
          period, or US$100. Some jurisdictions do not allow these limits, in which case they apply
          to the maximum extent permitted.
        </p>
      </>
    ),
  },
  {
    id: "indemnity",
    heading: "Indemnity",
    body: (
      <>
        <p>
          You will indemnify and hold harmless Bounty Sounds, {OPERATOR}, and their officers and
          staff from claims, damages, losses, and reasonable legal costs arising from your content,
          your use of the service, your breach of these terms, or your violation of any law or of a
          platform&rsquo;s rules.
        </p>
      </>
    ),
  },
  {
    id: "disputes",
    heading: "Governing law and disputes",
    body: (
      <>
        <p>
          These terms are governed by the laws of the State of California, United States, without
          regard to its conflict of laws rules. You and Bounty Sounds agree to the exclusive
          jurisdiction of the state and federal courts located in California for any dispute not
          otherwise resolved, and each waives any objection to that venue. Nothing here removes a
          consumer&rsquo;s right to bring a claim in their local courts where the law grants it.
        </p>
        <p>
          Before filing anything, please write to {MAIL(LEGAL_EMAIL)} — most disputes are resolved
          quickly and informally.
        </p>
      </>
    ),
  },
  {
    id: "general",
    heading: "Changes and general terms",
    body: (
      <>
        <p>
          We may update these terms as the service changes. We will revise the effective date at the
          top of this page and, for material changes, give notice by email or a prominent site
          notice before they take effect. Continuing to use Bounty Sounds after that means you
          accept the updated terms. Terms applying to a bounty you already claimed remain as
          published when you claimed it.
        </p>
        <p>
          If any provision is held unenforceable, the rest remains in force. Our failure to enforce
          a provision is not a waiver of it. You may not assign these terms without our consent; we
          may assign them in connection with a merger, acquisition, or sale of assets. These terms
          and the Privacy Policy are the entire agreement between us about the service.
        </p>
        <p>Questions: {MAIL(LEGAL_EMAIL)}.</p>
      </>
    ),
  },
];

function TermsPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Terms of Service"
      summary="How bounties, purses, and payouts work — and the rules everyone on the board agrees to, including our strict policy on authentic engagement."
      sections={SECTIONS}
    />
  );
}
