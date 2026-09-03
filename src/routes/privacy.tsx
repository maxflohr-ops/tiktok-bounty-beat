import { createFileRoute } from "@tanstack/react-router";
import {
  LegalDoc,
  LEGAL_EMAIL,
  OPERATOR,
  PRIVACY_EMAIL,
  type LegalSection,
} from "@/components/LegalDoc";

const TITLE = "Privacy Policy · Bounty Sounds";
const DESC =
  "How Bounty Sounds collects, uses, shares, retains, and deletes personal information — including TikTok account data — and how to exercise your privacy rights.";
const URL = "https://bountysounds.com/privacy";

export const Route = createFileRoute("/privacy")({
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
  component: PrivacyPage,
});

const MAIL = (address: string) => (
  <a href={`mailto:${address}`} className="tap-inline underline underline-offset-2 hover:text-bone">
    {address}
  </a>
);

const SECTIONS: LegalSection[] = [
  {
    id: "scope",
    heading: "Who we are and what this covers",
    body: (
      <>
        <p>
          Bounty Sounds is a public clipping bounty board. Artists, streamers, and speakers post a
          bounty with a cash purse; video editors (“clippers”) claim it, post a clip to a social
          platform, and are paid from that purse based on verified views or an agreed flat amount.
          The service is operated by {OPERATOR} (“Bounty Sounds,” “we,” “us,” “our”).
        </p>
        <p>
          This policy explains what personal information we collect through bountysounds.com and our
          related APIs, why we collect it, who we share it with, how long we keep it, and the
          choices you have. It applies to everyone who uses the service: clippers, bounty posters,
          and visitors who never create an account.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    heading: "Information we collect",
    body: (
      <>
        <p>
          <strong className="text-bone">Account information.</strong> Your email address and
          authentication credentials, created when you sign up. We store a password hash through our
          authentication provider — never your password itself.
        </p>
        <p>
          <strong className="text-bone">Profile information.</strong> Display name, avatar image,
          social handle (for example, your TikTok username), and your payout preference, where you
          choose to provide them.
        </p>
        <p>
          <strong className="text-bone">Submission information.</strong> When you claim a bounty and
          deliver a clip, we collect the public URL of the video you posted, the social account
          handle that posted it, view counts and the verified view count we record for payout, plus
          submission status, timestamps, and any review notes.
        </p>
        <p>
          <strong className="text-bone">Payout information.</strong> The PayPal email address or
          digital wallet address you nominate for payment, and a record of amounts approved and
          paid.
        </p>
        <p>
          <strong className="text-bone">Tax information.</strong> If your lifetime earnings reach
          the reporting threshold (currently US$150), we collect the information required for United
          States tax reporting: legal name, postal address, and taxpayer identification number. This
          is collected only when the threshold is met.
        </p>
        <p>
          <strong className="text-bone">Bounty poster information.</strong> If you post a bounty, we
          collect your contact email, artist or campaign name, the sound or source material details
          you supply, and payment records associated with posting the purse. Card details are
          entered directly with our payment processor; we never receive or store full card numbers.
        </p>
        <p>
          <strong className="text-bone">Communications.</strong> Email addresses submitted to
          receive board alerts, and the content of messages you send us.
        </p>
        <p>
          <strong className="text-bone">Technical information.</strong> IP address, browser and
          device characteristics, pages requested, and referral information, including marketing
          attribution parameters (such as UTM tags) present in the link you arrived through. We use
          IP addresses to apply rate limits and prevent abuse.
        </p>
      </>
    ),
  },
  {
    id: "tiktok-data",
    heading: "TikTok and other platform data",
    body: (
      <>
        <p>
          Bounty Sounds is an independent service. We are not affiliated with, endorsed by, or
          sponsored by TikTok, ByteDance, Google, Meta, or any other platform.
        </p>
        <p>
          We collect platform data in two ways. First, from you: the handle you tell us you post
          under, and the URL of the clip you delivered. Second, publicly available metrics for the
          specific videos submitted to a bounty — principally view counts — which we record as the
          verified view figure a payout is calculated from.
        </p>
        <p>
          Where you connect a platform account to Bounty Sounds through that platform&rsquo;s own
          authorization flow, we receive only the fields that authorization grants, and we use them
          solely to operate the features you asked for: confirming that a submitted clip belongs to
          you, and recording view figures for payment. We do not use platform data for advertising
          profiles, we do not sell it, and we do not share it with third parties except the service
          providers listed below who process it on our behalf. You can disconnect a linked platform
          account at any time from your account settings, or by revoking access in the
          platform&rsquo;s own settings; we delete the associated tokens when you do.
        </p>
        <p>
          We do not collect direct messages, private videos, contact lists, or any other platform
          data beyond what is described here.
        </p>
      </>
    ),
  },
  {
    id: "use",
    heading: "How we use information",
    body: (
      <>
        <p>We use personal information to:</p>
        <ul>
          <li>create and maintain your account and keep you signed in;</li>
          <li>publish bounties and operate the board, including claims and delivery;</li>
          <li>
            verify that a submitted clip is genuine and eligible, and record the view figures a
            payout is calculated from;
          </li>
          <li>calculate, approve, and send payments, and keep records of what was paid;</li>
          <li>meet tax, accounting, and other legal obligations;</li>
          <li>send service messages, such as claim confirmations and payout notices;</li>
          <li>send board alerts if you asked for them (you can unsubscribe at any time);</li>
          <li>
            detect, investigate, and prevent fraud, artificially inflated engagement, abuse, and
            security incidents;
          </li>
          <li>understand which pages and campaigns bring people to the board, in aggregate;</li>
          <li>improve the service and develop new features.</li>
        </ul>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "How we share information",
    body: (
      <>
        <p>
          <strong className="text-bone">We do not sell personal information</strong>, and we do not
          share it for cross-context behavioural advertising.
        </p>
        <p>We share information with service providers who process it on our behalf:</p>
        <ul>
          <li>
            <strong className="text-bone">Supabase</strong> — database, authentication, and file
            storage.
          </li>
          <li>
            <strong className="text-bone">Lovable</strong> — application hosting and deployment.
          </li>
          <li>
            <strong className="text-bone">Stripe</strong> — payment processing for posted purses and
            payouts.
          </li>
          <li>
            <strong className="text-bone">PayPal</strong> — where you elect to be paid by PayPal.
          </li>
          <li>
            <strong className="text-bone">Resend</strong> — transactional email delivery.
          </li>
          <li>
            <strong className="text-bone">Google (Tag Manager / Analytics) and Meta (Pixel)</strong>{" "}
            — website measurement, where enabled. See “Cookies and measurement” below.
          </li>
        </ul>
        <p>
          Some information is public by design. Bounty titles, purses, rates, deadlines, and the
          number of clips claimed appear on the public board. Where a clip has been delivered, the
          public video URL, the posting handle, and the clip&rsquo;s status may appear on that
          bounty&rsquo;s page and on our public campaign feed. Payout amounts tied to an individual,
          payout addresses, email addresses, and tax details are never published.
        </p>
        <p>
          We may also disclose information where we reasonably believe it is required by law, legal
          process, or a government request; to enforce our Terms of Service; to protect the rights,
          safety, or property of users or the public; or in connection with a merger, acquisition,
          or sale of assets, in which case we will require the recipient to honour this policy.
        </p>
      </>
    ),
  },
  {
    id: "legal-bases",
    heading: "Legal bases for processing",
    body: (
      <>
        <p>
          If you are in the European Economic Area or the United Kingdom, we rely on these legal
          bases: performance of a contract (operating your account, bounties, and payouts);
          compliance with a legal obligation (tax and financial records); legitimate interests
          (securing the service, preventing fraud and artificial engagement, and understanding how
          the board is used); and consent (marketing emails and non-essential measurement tools,
          which you may withdraw at any time).
        </p>
      </>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep information",
    body: (
      <>
        <p>
          We keep account and profile information for as long as your account is open. If you delete
          your account, we delete or anonymise your personal information within 30 days, with these
          exceptions:
        </p>
        <ul>
          <li>
            <strong className="text-bone">Payment and tax records</strong> are retained for up to
            seven years, as financial and tax law requires.
          </li>
          <li>
            <strong className="text-bone">Records needed to resolve a dispute</strong>, enforce our
            agreements, or investigate fraud are retained until that matter is closed.
          </li>
          <li>
            <strong className="text-bone">Aggregated or de-identified data</strong> that can no
            longer be linked to you may be retained indefinitely.
          </li>
        </ul>
        <p>
          Platform authorization tokens are deleted as soon as you disconnect a linked account.
          Board-alert email addresses are deleted when you unsubscribe.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    heading: "Your rights and choices",
    body: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>access the personal information we hold about you, and receive a copy;</li>
          <li>correct information that is inaccurate or incomplete;</li>
          <li>delete your personal information;</li>
          <li>receive your information in a portable format;</li>
          <li>object to or restrict certain processing;</li>
          <li>withdraw consent you previously gave;</li>
          <li>not be discriminated against for exercising these rights.</li>
        </ul>
        <p>
          You can update your profile and payout details at any time from your account. To exercise
          any other right, email {MAIL(PRIVACY_EMAIL)}. We will respond within 30 days, and will ask
          you to verify control of the account email before we act on a request.
        </p>
      </>
    ),
  },
  {
    id: "deletion",
    heading: "Deleting your account and data",
    body: (
      <>
        <p>You can have your account and associated personal information deleted at any time:</p>
        <ul>
          <li>
            email {MAIL(PRIVACY_EMAIL)} from your account email address with the subject “Delete my
            account”; or
          </li>
          <li>
            use the account deletion option in your dashboard settings, where available in your
            region.
          </li>
        </ul>
        <p>
          We confirm receipt within 5 business days and complete deletion within 30 days, subject to
          the retention exceptions above. Deleting your account also deletes any platform
          authorization tokens we hold and removes your handle from clip listings. Clips you posted
          on a social platform belong to your platform account and are not affected — delete those
          on the platform itself.
        </p>
        <p>
          If a payout is pending when you request deletion, we will ask whether you want it paid out
          first; we must retain the payment record afterwards regardless.
        </p>
      </>
    ),
  },
  {
    id: "children",
    heading: "Children",
    body: (
      <>
        <p>
          Bounty Sounds is not directed to children. You must be at least 13 years old to use the
          service, and at least 18 years old to claim a bounty or receive a payout. We do not
          knowingly collect personal information from children under 13. If you believe a child
          under 13 has given us personal information, email {MAIL(PRIVACY_EMAIL)} and we will delete
          it promptly.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "Security",
    body: (
      <>
        <p>
          We protect information in transit with TLS, restrict database access with row-level
          security policies, keep payment card handling entirely with our payment processor, and
          limit staff access to what a role requires. Sensitive fields such as purse balances and
          payment processor identifiers are never included in the public data our website serves.
        </p>
        <p>
          No method of transmission or storage is completely secure. If we become aware of a breach
          affecting your personal information, we will notify you and any relevant regulator as
          required by law.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    heading: "International transfers",
    body: (
      <>
        <p>
          We are based in the United States, and our service providers may process information in
          the United States and other countries. Where we transfer personal information out of the
          European Economic Area or the United Kingdom, we rely on appropriate safeguards, including
          the European Commission&rsquo;s Standard Contractual Clauses.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies and measurement",
    body: (
      <>
        <p>
          We use strictly necessary cookies to keep you signed in and to secure form submissions.
          These cannot be switched off without breaking the service.
        </p>
        <p>
          Where enabled, we also use Google Tag Manager and the Meta Pixel to measure how people
          find and use the board, including which campaigns bring visitors and how many go on to
          claim a bounty. These set cookies and share limited event data with those providers. You
          can opt out using your browser&rsquo;s cookie controls, an ad blocker, or a Global Privacy
          Control signal, which we honour where required by law. We do not use these tools to build
          advertising profiles from platform account data.
        </p>
      </>
    ),
  },
  {
    id: "regional",
    heading: "Regional disclosures",
    body: (
      <>
        <p>
          <strong className="text-bone">California.</strong> In the past 12 months we have collected
          the categories of personal information described in “Information we collect”: identifiers,
          commercial information, internet activity, financial information for payouts, and
          government identifiers for tax reporting. We collect these for the business purposes
          described above. We have not sold personal information or shared it for cross-context
          behavioural advertising. You may exercise your rights to know, delete, correct, and opt
          out by emailing {MAIL(PRIVACY_EMAIL)}, and you may use an authorised agent.
        </p>
        <p>
          <strong className="text-bone">EEA and UK.</strong> You may lodge a complaint with your
          local supervisory authority. For data protection questions, contact {MAIL(PRIVACY_EMAIL)}.
        </p>
      </>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <>
        <p>
          We may update this policy as the service changes. We will revise the effective date at the
          top of this page, and for material changes we will give notice by email to account holders
          or by a prominent notice on the site before the change takes effect. Continuing to use
          Bounty Sounds after a change takes effect means you accept the updated policy.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    heading: "Contact us",
    body: (
      <>
        <p>
          Privacy questions, rights requests, and deletion requests: {MAIL(PRIVACY_EMAIL)}.
          <br />
          Legal and terms questions: {MAIL(LEGAL_EMAIL)}.
        </p>
        <p>Bounty Sounds is operated by {OPERATOR}, United States.</p>
      </>
    ),
  },
];

function PrivacyPage() {
  return (
    <LegalDoc
      eyebrow="Legal"
      title="Privacy Policy"
      summary="What we collect, why we collect it, who we share it with, how long we keep it, and how to have it deleted."
      sections={SECTIONS}
    />
  );
}
