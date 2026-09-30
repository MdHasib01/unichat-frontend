import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, type LegalSection } from '@/components/legal/legal-page';
import { LegalValue } from '@/components/legal/placeholder';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `The terms that govern your use of ${LEGAL.productName}.`,
};

const P = LEGAL.productName;

const sections: LegalSection[] = [
  {
    id: 'acceptance',
    title: 'Acceptance of these terms',
    content: (
      <>
        <p>
          These Terms of Service (“Terms”) are an agreement between you and {LEGAL.operatorName} (“we”,
          “us”) and govern your use of {P}, including our website, web application, APIs and website
          chat widget (the “Service”).
        </p>
        <p>
          By creating an account, accepting an invitation or using the Service, you agree to these
          Terms, our <Link href="/privacy">Privacy Policy</Link> and our{' '}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>. If you use the Service on behalf
          of a business or other organization, you confirm that you are authorized to accept these
          Terms for it, and “you” includes that organization. If you do not agree, do not use the
          Service.
        </p>
      </>
    ),
  },
  {
    id: 'service',
    title: 'The Service',
    content: (
      <p>
        {P} lets businesses connect Facebook Pages, Instagram Professional accounts, WhatsApp Business
        phone numbers and a website chat widget, and manage the resulting conversations in one shared
        inbox. It includes contact management, team assignment, message templates, automation rules,
        an optional AI assistant, and simple sales and call records. Some areas of the app are marked
        as not yet available and have no functionality until we announce otherwise.
      </p>
    ),
  },
  {
    id: 'accounts',
    title: 'Account registration',
    content: (
      <ul>
        <li>You must be at least 18 years old, or the age of majority where you live, to create an account.</li>
        <li>You must give accurate information and keep it up to date.</li>
        <li>
          Keep your password confidential. You are responsible for all activity under your account.
          Tell us immediately at <a href={`mailto:${LEGAL.supportEmail}`}>{LEGAL.supportEmail}</a> if
          you suspect unauthorized access.
        </li>
        <li>Accounts are for individual people. Do not share a login between several people. Invite them as team members instead.</li>
      </ul>
    ),
  },
  {
    id: 'workspaces',
    title: 'Business workspaces and team members',
    content: (
      <>
        <p>
          Each business uses {P} through a workspace. The person who creates a workspace is its owner.
          Owners and admins can invite team members, assign roles and control what each role can see
          and do.
        </p>
        <p>
          The workspace owner is responsible for the workspace, for everyone invited to it, and for
          removing people who should no longer have access. The data in a workspace belongs to the
          business that owns it, not to individual team members.
        </p>
      </>
    ),
  },
  {
    id: 'responsibilities',
    title: 'Your responsibilities and authorized use',
    content: (
      <>
        <p>You agree to use the Service only:</p>
        <ul>
          <li>for lawful business communication with your own customers and prospects;</li>
          <li>with accounts, Pages and phone numbers you own or are authorized to manage;</li>
          <li>in line with these Terms, the <Link href="/acceptable-use">Acceptable Use Policy</Link> and the rules of each connected platform; and</li>
          <li>
            in compliance with the laws that apply to you, including data protection, consumer
            protection, marketing and anti-spam laws.
          </li>
        </ul>
        <p>
          You are responsible for giving your customers any privacy notices, and obtaining any
          consents, the law requires for you to message them and to process their data using{' '}
          {P}.
        </p>
      </>
    ),
  },
  {
    id: 'connected-accounts',
    title: 'Connected third-party accounts',
    content: (
      <>
        <p>
          When you connect a third-party account, you authorize us to access it with the permissions
          you grant, and only to provide the Service. You can disconnect a connected account at any
          time from the Integrations page, or revoke our access in that platform’s own settings.
        </p>
        <p>
          The third-party platform, not us, controls your account there. We are not responsible for a
          platform suspending, restricting or changing your account, its features or its API. Such
          changes may affect what {P} can do.
        </p>
      </>
    ),
  },
  {
    id: 'meta',
    title: 'Facebook, Instagram and WhatsApp integration',
    content: (
      <>
        <p>
          Facebook, Instagram, Messenger and WhatsApp are products of Meta Platforms, Inc. (“Meta”).
          {' '}{P} is not affiliated with, endorsed by or sponsored by Meta. When you use these
          channels through {P}, Meta’s own terms and policies continue to apply to you, including the{' '}
          <a href="https://www.facebook.com/terms" target="_blank" rel="noopener noreferrer">Meta Terms of Service</a>,{' '}
          <a href="https://www.facebook.com/policies/pages_groups_events" target="_blank" rel="noopener noreferrer">Pages, Groups and Events Policies</a>,{' '}
          <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noopener noreferrer">Instagram Terms of Use</a>,{' '}
          <a href="https://www.whatsapp.com/legal/business-policy" target="_blank" rel="noopener noreferrer">WhatsApp Business Messaging Policy</a> and{' '}
          <a href="https://www.facebook.com/privacy/policy" target="_blank" rel="noopener noreferrer">Meta Privacy Policy</a>.
        </p>
        <p>In particular, you are responsible for respecting each platform’s messaging rules, for example:</p>
        <ul>
          <li>
            Messenger and Instagram generally allow free-form replies only within a limited time
            after the customer last messaged you (currently 24 hours). Messages outside that window
            are allowed only in the narrow cases Meta permits.
          </li>
          <li>
            WhatsApp requires the customer’s opt-in, and messages outside the 24-hour customer service
            window must use templates Meta has approved.
          </li>
          <li>You must not use these channels to send spam or unsolicited promotional messages.</li>
        </ul>
        <p>
          {P} may block or fail sends that a platform rejects, but it cannot guarantee your
          compliance. That responsibility stays with you. See our{' '}
          <Link href="/meta">Meta Integration Disclosure</Link> for the permissions we request and why.
        </p>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Your messages and content',
    content: (
      <>
        <p>
          “Your Content” means everything you or your customers put into the Service, including
          messages, attachments, contacts, notes, knowledge base material, templates and records. You
          keep all rights to Your Content.
        </p>
        <p>
          You give us a limited, worldwide, non-exclusive licence to host, copy, process, transmit and
          display Your Content only as needed to provide, secure and support the Service for you. For
          example, this covers storing messages, delivering replies through Meta and, if you enable
          it, sending conversation context to your chosen AI provider. This licence ends when Your
          Content is deleted from the Service, apart from routine backups that expire on schedule.
        </p>
        <p>
          You are solely responsible for Your Content and for every message sent from your
          workspace, whether a person, a template, an automation or the AI assistant wrote it. You
          confirm you have the rights and permissions needed for it.
        </p>
      </>
    ),
  },
  {
    id: 'automation',
    title: 'Messaging automation and AI',
    content: (
      <>
        <p>
          Automation rules and the AI assistant act on your instructions. You choose whether they
          reply automatically, and you are responsible for configuring them, reviewing their output
          and switching them off where they are not appropriate.
        </p>
        <ul>
          <li>
            AI-generated text can be inaccurate or incomplete. Do not rely on it for legal, medical,
            financial or other professional advice, or for decisions with significant effects on
            people.
          </li>
          <li>Do not configure automations that send repetitive, unsolicited or misleading messages, or that are designed to get around a platform’s limits.</li>
          <li>Where the law or a platform requires it, tell your customers when they are talking to an automated system.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'prohibited',
    title: 'Prohibited activities',
    content: (
      <p>
        You must not misuse the Service. Our <Link href="/acceptable-use">Acceptable Use Policy</Link>{' '}
        lists what is prohibited. It covers spam, fraud, phishing, harassment, illegal content,
        unauthorized access, abuse of messaging features and attempts to get around Meta’s policies,
        and it forms part of these Terms.
      </p>
    ),
  },
  {
    id: 'ip',
    title: 'Intellectual property',
    content: (
      <p>
        The Service, including its software, design, text, graphics and logos (but not Your
        Content), is owned by {LEGAL.operatorName} or its licensors and protected by intellectual
        property laws. We grant you a limited, non-exclusive, non-transferable, revocable right to use
        the Service under these Terms. You may not copy, modify, distribute, sell or reverse-engineer
        it, except where the law expressly allows this. If you send us feedback, we may use it
        without obligation to you.
      </p>
    ),
  },
  {
    id: 'third-party',
    title: 'Third-party services',
    content: (
      <p>
        The Service works with services we do not control, such as Meta’s platforms, AI providers and
        your own website (for the chat widget). Their availability, accuracy and terms are their own.
        We are not responsible for them, and your use of them is governed by their terms and privacy
        policies.
      </p>
    ),
  },
  {
    id: 'plans',
    title: 'Plans and usage limits',
    content: (
      <p>
        Workspaces may have limits, such as the number of team members, messages or AI replies.
        If we introduce paid plans, prices and payment terms will be shown to you before you are
        charged anything.
      </p>
    ),
  },
  {
    id: 'availability',
    title: 'Service availability and changes',
    content: (
      <p>
        We work to keep the Service available and reliable but do not guarantee it will be
        uninterrupted or error-free. Maintenance, failures, and changes or outages at Meta and other
        providers can delay or prevent message delivery. We may change, add or remove features. If a
        change significantly reduces the Service you rely on, we will tell you in advance where
        reasonably possible.
      </p>
    ),
  },
  {
    id: 'termination',
    title: 'Suspension and termination',
    content: (
      <>
        <p>
          You can stop using the Service at any time, disconnect your accounts, and request deletion of
          your account or workspace as described on our{' '}
          <Link href="/data-deletion">Data Deletion</Link> page.
        </p>
        <p>
          We may suspend or terminate your access, in whole or in part, if you breach these Terms or
          the Acceptable Use Policy, if a connected platform requires it, if your use creates security
          or legal risk, or if we are required to by law. Where appropriate we will give notice and an
          opportunity to fix the problem first. After termination, we handle your data as described in
          our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </>
    ),
  },
  {
    id: 'data',
    title: 'Data handling',
    content: (
      <p>
        Our <Link href="/privacy">Privacy Policy</Link> explains how we handle personal information.
        For personal data about your customers that we process on your behalf, you are the
        controller, and we process it only to provide the Service and on your documented
        instructions. These Terms and your configuration of the Service are those instructions. If
        you need a data processing agreement, contact{' '}
        <a href={`mailto:${LEGAL.legalEmail}`}>{LEGAL.legalEmail}</a>.
      </p>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    content: (
      <p>
        To the fullest extent the law allows, the Service is provided “as is” and “as available”,
        without warranties of any kind, express or implied. This includes warranties of
        merchantability, fitness for a particular purpose and non-infringement. We do not warrant
        that messages will always be delivered, that AI output will be accurate, or that the Service
        will meet every requirement you have. Nothing in these Terms excludes rights you have as a
        consumer that cannot be excluded by law.
      </p>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    content: (
      <>
        <p>To the fullest extent the law allows:</p>
        <ul>
          <li>
            we are not liable for indirect, incidental, special, consequential or punitive damages,
            or for loss of profits, revenue, goodwill or data; and
          </li>
          <li>
            our total liability for all claims relating to the Service is limited to the greater of
            the amount you paid us for the Service in the 12 months before the claim arose, or 100
            US dollars.
          </li>
        </ul>
        <p>
          These limits do not apply to liability that cannot be limited by law, such as liability for
          death or personal injury caused by negligence, or for fraud.
        </p>
      </>
    ),
  },
  {
    id: 'indemnification',
    title: 'Indemnification',
    content: (
      <p>
        To the extent the law allows, you will defend and indemnify {LEGAL.operatorName} against
        third-party claims, and the resulting losses and reasonable costs, that arise from Your
        Content, the messages sent from your workspace, your breach of these Terms or the Acceptable
        Use Policy, or your violation of any law or third-party rights, including a connected
        platform’s terms.
      </p>
    ),
  },
  {
    id: 'law',
    title: 'Governing law and disputes',
    content: (
      <p>
        These Terms are governed by <LegalValue value={LEGAL.governingLaw} label="GOVERNING LAW" />,
        without regard to its conflict-of-law rules. Disputes will be resolved exclusively by{' '}
        <LegalValue value={LEGAL.jurisdictionCourts} label="COMPETENT COURTS" />, unless mandatory law
        gives you the right to bring proceedings where you live. Before starting formal
        proceedings, please contact us so we can try to resolve the issue informally.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these terms',
    content: (
      <p>
        We may update these Terms. For material changes, we will notify workspace owners in the app
        or by email before the changes take effect. If you keep using the Service after that, you
        accept the updated Terms. If you do not agree, stop using the Service and request deletion
        of your account.
      </p>
    ),
  },
  {
    id: 'general',
    title: 'General',
    content: (
      <p>
        These Terms, together with the policies they refer to, are the entire agreement between you
        and us about the Service. If any provision is found unenforceable, the rest remain in effect.
        If we do not enforce a provision, we have not waived it. You may not transfer these Terms
        without our consent. We may transfer them as part of a merger, acquisition or sale of assets.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact',
    content: (
      <p>
        Questions about these Terms: <a href={`mailto:${LEGAL.legalEmail}`}>{LEGAL.legalEmail}</a>.
        Postal address: <LegalValue value={LEGAL.registeredAddress} label="REGISTERED ADDRESS" />. See
        also our <Link href="/contact">Contact</Link> page.
      </p>
    ),
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" sections={sections} />;
}
