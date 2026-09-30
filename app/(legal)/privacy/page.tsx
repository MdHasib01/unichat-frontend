import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalPage, LegalTable, type LegalSection } from '@/components/legal/legal-page';
import { LegalValue } from '@/components/legal/placeholder';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `How ${LEGAL.productName} collects, uses, shares and protects personal information, including data from connected Facebook, Instagram and WhatsApp accounts.`,
};

const P = LEGAL.productName;

const sections: LegalSection[] = [
  {
    id: 'who-we-are',
    title: 'Who we are',
    content: (
      <>
        <p>
          {P} is a unified messaging service. It lets businesses connect their Facebook Pages,
          Instagram Professional accounts, WhatsApp Business phone numbers and an optional website chat
          widget, and answer the messages they receive from a single shared inbox.
        </p>
        <p>
          {P} is operated by {LEGAL.operatorName} (
          <LegalValue value={LEGAL.registrationNumber} label="LEGAL FORM AND REGISTRATION NUMBER" />
          ), <LegalValue value={LEGAL.registeredAddress} label="REGISTERED ADDRESS" />. In this policy,
          “{P}”, “we”, “us” and “our” mean {LEGAL.operatorName}.
        </p>
        <p>
          {P} is an independent service. It is not owned, operated, sponsored or endorsed by Meta
          Platforms, Inc. or by Facebook, Instagram or WhatsApp.
        </p>
      </>
    ),
  },
  {
    id: 'roles',
    title: 'Scope of this policy and our role',
    content: (
      <>
        <p>This policy covers two groups of people, and our role differs between them:</p>
        <ul>
          <li>
            <strong>Our customers and their team members</strong>: the people who sign up for {P},
            create a workspace, connect accounts and use the inbox. For their account information,{' '}
            {LEGAL.operatorName} is the <strong>data controller</strong>.
          </li>
          <li>
            <strong>People who message our customers</strong>: for example, someone who sends a
            Facebook Page, Instagram account, WhatsApp number or website chat a message. We process
            these messages and the related profile details <strong>on behalf of the business</strong>{' '}
            that received them, and only to provide the service to that business. For this data the
            business is the controller and we act as its <strong>processor</strong> (service provider).
            If you messaged a business that uses {P}, please contact that business first. It decides
            how your conversation is used and how long it is kept. We will help it respond to your
            request.
          </li>
        </ul>
        <p>
          This policy also covers visitors to our public pages, such as this one and the sign-in
          pages.
        </p>
      </>
    ),
  },
  {
    id: 'information-we-collect',
    title: 'Information we collect',
    content: (
      <>
        <h3>Account information</h3>
        <p>
          When you create an account or accept an invitation, we collect your first and last name,
          email address and password. We never store your password itself, only a salted one-way hash
          (Argon2id). You can also add a phone number, profile photo URL, time zone and language.
        </p>

        <h3>Business and workspace information</h3>
        <p>
          When you create a workspace, we collect the business name. You can also add a description,
          industry, website, logo, time zone, currency and business hours. We also record which
          people belong to each workspace, their roles, and invitations sent to new team members (the
          invitee’s email address and role).
        </p>

        <h3>Authentication and security information</h3>
        <p>
          When you sign in, we create a session record containing the IP address and browser
          user-agent of the device, when the session was created and last used, and when it expires.
          You can see and revoke these sessions in your account’s security settings. Security-relevant
          actions (such as signing in, connecting or disconnecting accounts, or changing team roles)
          are written to an audit log with the IP address and user-agent of the request.
        </p>

        <h3>Contact and conversation information</h3>
        <p>
          To provide the inbox, we store the messages your connected accounts send and receive. This
          includes message text, the time of each message, delivery and read status, and links to any
          attachments (images, video, audio, files, locations). We also store contact records for the
          people you talk to: display name, profile picture link, platform-specific identifiers and
          any details you or your team add (email, phone, country, city, notes, tags and custom
          fields). Internal notes and conversation assignments your team creates are stored too.
        </p>

        <h3>Information you add to other features</h3>
        <ul>
          <li>
            <strong>Sales</strong>: products, and the orders and parcels you record. These can include
            a customer’s name, phone number, shipping address, the items ordered and tracking details.
          </li>
          <li>
            <strong>Calls</strong>: call records you log or that a connected telephony tool posts to{' '}
            {P}: direction, status, time, duration, notes and, if provided, a link to a recording
            stored elsewhere. {P} does not place calls or store call audio itself.
          </li>
          <li>
            <strong>AI assistant</strong>: the knowledge base content, business instructions and
            example question-and-answer pairs you provide to train the assistant. Examples can come
            from your own inbox if you choose to use a past reply as training material.
          </li>
          <li>
            <strong>Automations and templates</strong>: the rules, message templates and saved replies
            you create.
          </li>
        </ul>

        <h3>Website chat visitors</h3>
        <p>
          If a business adds the {P} chat widget to its website, we store the messages a visitor
          sends and receives. We also store any name, email address or phone number the visitor
          enters in the optional pre-chat form (or that the website passes to the widget), the page
          address the message was sent from, and the browser user-agent. The widget saves a random
          visitor identifier in the visitor’s browser so the conversation continues across page
          loads. See our <Link href="/cookies">Cookie Policy</Link>.
        </p>

        <h3>Information from Meta platforms</h3>
        <p>
          When you connect Facebook, Instagram or WhatsApp, we receive information from Meta. This is
          described in detail in the next section.
        </p>

        <h3>Visitors to our website</h3>
        <p>
          Our web servers process the IP address, browser type and requested page of every visitor in
          order to deliver the page and protect the service against abuse (for example, by rate
          limiting). We do not use analytics or advertising trackers on our website or in the app.
        </p>
      </>
    ),
  },
  {
    id: 'meta-data',
    title: 'Information we receive from Facebook, Instagram and WhatsApp',
    content: (
      <>
        <p>
          Connecting an account is always your choice. You start it from the Integrations page, and
          you sign in to Meta and approve the requested permissions on Meta’s own screens. We never see
          or store your Facebook password. We only receive what you authorize, and only for the Pages,
          Instagram accounts and WhatsApp numbers you choose to connect.
        </p>
        <LegalTable
          columns={['Source', 'What we receive and store', 'Why']}
          rows={[
            [
              'Your Facebook login',
              'Your Meta user ID and name, and an access token (stored encrypted).',
              'To identify the connection and to list the Pages and business assets you can connect.',
            ],
            [
              'Facebook Pages',
              'Page ID, name, category, profile picture link and a Page access token (stored encrypted).',
              'To show you which Pages you can connect, receive their Messenger messages and send your replies.',
            ],
            [
              'Instagram Professional accounts',
              'Instagram account ID, username, name and profile picture link of the account linked to your Page.',
              'To receive Instagram Direct messages and send your replies.',
            ],
            [
              'WhatsApp Business',
              'WhatsApp Business Account ID, phone number ID, display phone number, verified business name and quality rating.',
              'To receive WhatsApp messages sent to your number and send your replies.',
            ],
            [
              'People who message you',
              'Their platform-scoped ID (Messenger PSID, Instagram-scoped ID or WhatsApp phone number). Profile details Meta makes available: first and last name, profile picture and locale on Messenger; name, username and profile picture on Instagram; profile name on WhatsApp.',
              'To show who each conversation is with and group their messages into one contact.',
            ],
            [
              'Messages and events',
              'Message text, attachment links, timestamps, and delivery, read, postback and referral events delivered by Meta webhooks.',
              'To display conversations in your inbox, run your automations and track delivery status.',
            ],
          ]}
        />
        <p>
          <strong>Attachments</strong> (photos, videos, voice notes, files) are stored as links that
          point to Meta’s servers. We do not copy the files to our own storage. For troubleshooting,
          we also keep a technical log of the webhook notifications Meta sends us, which contain the
          same message information.
        </p>
        <p>
          We use Meta data only to provide the messaging features you asked for. See{' '}
          <a href="#meta-commitments">our Meta Platform Data commitments</a> below and our{' '}
          <Link href="/meta">Meta Integration Disclosure</Link> for the list of permissions and why
          each is needed.
        </p>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How we use information',
    content: (
      <ul>
        <li>
          <strong>Providing the unified inbox</strong>: receiving, storing and displaying messages
          from your connected channels, and sending the replies you or your team write.
        </li>
        <li>
          <strong>Message synchronization</strong>: keeping conversations, contacts, delivery and
          read status up to date across your connected accounts.
        </li>
        <li>
          <strong>Automation and messaging features</strong>: running the automation rules you
          configure (for example greetings, tagging, assignment and follow-ups) and, if you enable it,
          generating AI replies or reply suggestions (see the next section).
        </li>
        <li>
          <strong>Team collaboration</strong>: assignments, internal notes, notifications and
          role-based access within your workspace.
        </li>
        <li>
          <strong>Customer support</strong>: answering your questions and investigating problems you
          report.
        </li>
        <li>
          <strong>Security and fraud prevention</strong>: authenticating users, detecting and
          preventing abuse, rate limiting, keeping audit logs and enforcing our{' '}
          <Link href="/acceptable-use">Acceptable Use Policy</Link>.
        </li>
        <li>
          <strong>Service improvement</strong>: understanding how the service performs (for example
          error rates and delivery failures) so we can fix and improve it. We do not use your
          conversations to train general-purpose AI models. Conversation text becomes training
          material only when you add it to your own workspace’s assistant.
        </li>
        <li>
          <strong>Legal compliance</strong>: meeting legal obligations, responding to lawful requests
          and establishing or defending legal claims.
        </li>
        <li>
          <strong>Service communications</strong>: sending messages about your account, such as
          security notices, invitations and password resets.
        </li>
      </ul>
    ),
  },
  {
    id: 'legal-bases',
    title: 'Legal bases for processing (EEA and UK)',
    content: (
      <>
        <p>
          Where the EU or UK General Data Protection Regulation applies, we rely on the following
          legal bases:
        </p>
        <ul>
          <li>
            <strong>Performance of a contract</strong>: to create and run your account and workspace
            and to provide the features you use.
          </li>
          <li>
            <strong>Legitimate interests</strong>: to keep the service secure, prevent abuse, provide
            support and improve the service. We balance these interests against your rights.
          </li>
          <li>
            <strong>Legal obligation</strong>: where we must keep or disclose information by law.
          </li>
          <li>
            <strong>Consent</strong>: where the law requires it. You can withdraw consent at any time.
          </li>
        </ul>
        <p>
          For messages and contact data we process on behalf of a business, that business is
          responsible for having its own legal basis.
        </p>
      </>
    ),
  },
  {
    id: 'ai',
    title: 'AI and automation features',
    content: (
      <>
        <p>
          AI replies and suggestions are optional and are configured per workspace. When they are
          enabled, the relevant conversation history, the customer’s latest message and matching
          passages from your knowledge base are sent to the AI provider selected for your workspace
          (Anthropic or OpenAI) to generate a response. If OpenAI is selected, knowledge base text may
          also be sent to OpenAI to create search embeddings. When no external AI provider is
          configured, a built-in assistant runs entirely on our own servers.
        </p>
        <p>
          AI-generated and automated messages are sent on your behalf. You decide whether they are
          sent automatically or suggested for review, and you can turn them off for any conversation.
        </p>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'How we share information',
    content: (
      <>
        <p>
          We do not sell personal information, and we do not share it for advertising. We share it only
          as described here:
        </p>
        <ul>
          <li>
            <strong>Within your workspace</strong>: team members see the conversations, contacts and
            records their role allows.
          </li>
          <li>
            <strong>Meta (Facebook, Instagram, WhatsApp)</strong>: when you send a message through{' '}
            {P}, we pass it to Meta to deliver it. Meta handles that data under its own terms and
            privacy policy.
          </li>
          <li>
            <strong>Service providers (sub-processors)</strong> that process data for us under
            contract:
            <LegalTable
              columns={['Provider', 'Purpose', 'When']}
              rows={[
                [
                  <LegalValue key="h" value={LEGAL.hostingProvider} label="HOSTING PROVIDER" />,
                  'Servers, database and backups',
                  'Always',
                ],
                ['Anthropic, PBC', 'Generating AI replies and suggestions', 'Only if a workspace enables AI with Anthropic'],
                ['OpenAI, L.L.C.', 'Generating AI replies, suggestions and search embeddings', 'Only if a workspace enables AI with OpenAI'],
              ]}
            />
          </li>
          <li>
            <strong>Legal and safety</strong>: when required by law, or when necessary to protect the
            rights, property or safety of our users, the public or us.
          </li>
          <li>
            <strong>Business transfers</strong>: if we are involved in a merger, acquisition or sale
            of assets, subject to this policy’s protections continuing to apply.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'meta-commitments',
    title: 'Meta Platform Data commitments',
    content: (
      <>
        <p>For data we receive from Meta’s platforms:</p>
        <ul>
          <li>We use it only to provide the messaging features you have enabled in {P}.</li>
          <li>
            We do not sell, license or rent it, and we do not use it for advertising, profiling,
            data brokering or building data sets unrelated to your use of {P}.
          </li>
          <li>
            We share it only with the service providers listed above, and only to operate {P}.
          </li>
          <li>Access tokens are encrypted at rest (AES-256-GCM) and are never shown in the app.</li>
          <li>
            When you disconnect, we delete the stored access tokens and stop syncing. You can also
            ask us to delete the rest of the data at any time (see{' '}
            <Link href="/data-deletion">Data Deletion Instructions</Link>).
          </li>
          <li>We comply with the Meta Platform Terms and Developer Policies.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    content: (
      <p>
        We use only strictly necessary cookies, to keep you signed in, plus a few browser storage
        entries that remember interface preferences. We do not use analytics, advertising or
        third-party tracking cookies. Details are in our <Link href="/cookies">Cookie Policy</Link>.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'Data retention',
    content: (
      <>
        <ul>
          <li>
            <strong>Account and workspace data</strong> is kept for as long as the account or
            workspace exists.
          </li>
          <li>
            <strong>Conversations, contacts and related records</strong> are kept until you delete
            them, your workspace is deleted, or you ask us to delete them. We do not delete old
            conversations automatically, because they are your business records. You control their
            retention.
          </li>
          <li>
            <strong>Access tokens</strong> for Meta accounts are deleted when you disconnect.
          </li>
          <li>
            <strong>Session records, audit logs and webhook logs</strong> are kept while the related
            account or workspace exists, to secure the service and investigate problems.
          </li>
          <li>
            <strong>Backups</strong> are rotated automatically. Deleted data stays in backup copies
            until they are overwritten (currently within 14 days).
          </li>
          <li>
            <strong>Deletion request records</strong> (the reference, date, scope and outcome) are
            kept after the deletion is done, so we can show we honored it.
          </li>
        </ul>
        <p>
          We may keep limited information for longer where the law requires it, or to resolve
          disputes and enforce our agreements.
        </p>
      </>
    ),
  },
  {
    id: 'deletion',
    title: 'Deleting your data',
    content: (
      <>
        <p>You can:</p>
        <ul>
          <li>
            Disconnect any Facebook Page, Instagram account or WhatsApp number from the Integrations
            page, or disconnect Meta entirely.
          </li>
          <li>Delete individual contacts, which also deletes their conversations and messages.</li>
          <li>
            Request deletion of your account, your whole workspace, or only the messaging data synced
            from connected platforms from the <Link href="/delete-account">Delete account</Link> page
            when signed in, or by emailing{' '}
            <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>.
          </li>
        </ul>
        <p>
          We complete verified deletion requests within {LEGAL.deletionDays} days. Step-by-step
          instructions are on our <Link href="/data-deletion">Data Deletion Instructions</Link> page.
        </p>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights',
    content: (
      <>
        <p>Depending on where you live, you may have the right to:</p>
        <ul>
          <li>access the personal information we hold about you and get a copy of it;</li>
          <li>correct inaccurate information;</li>
          <li>have your information deleted;</li>
          <li>restrict or object to certain processing;</li>
          <li>receive your information in a portable format;</li>
          <li>withdraw consent where processing is based on consent; and</li>
          <li>lodge a complaint with your local data protection authority.</li>
        </ul>
        <p>
          You can update most account details yourself in {P}. For anything else, email{' '}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. We may need to verify
          your identity before acting on a request, and we respond within the time the law requires.
          If you messaged a business that uses {P}, please send your request to that business. We
          will support it in responding.
        </p>
        <p>
          Data protection representative or officer:{' '}
          <LegalValue value={LEGAL.dataProtectionContact} label="DPO / EU-UK REPRESENTATIVE, IF REQUIRED" />
          .
        </p>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'International data transfers',
    content: (
      <p>
        Our servers are located in <LegalValue value={LEGAL.hostingRegion} label="HOSTING REGION" />.
        Meta, Anthropic and OpenAI may process data in the United States and other countries. Where
        personal data from the EEA or UK is transferred to a country without an adequacy decision, we
        rely on appropriate safeguards such as the European Commission’s Standard Contractual Clauses
        offered by those providers.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'Security',
    content: (
      <>
        <p>We protect information with measures appropriate to its sensitivity, including:</p>
        <ul>
          <li>encryption in transit (HTTPS) between your browser, our servers and Meta;</li>
          <li>encryption at rest for Meta access tokens (AES-256-GCM);</li>
          <li>Argon2id password hashing, and hashing of session refresh tokens;</li>
          <li>HTTP-only, secure session cookies;</li>
          <li>strict separation of each workspace’s data, and role-based permissions inside it;</li>
          <li>rate limiting, verification of Meta webhook signatures, and audit logging.</li>
        </ul>
        <p>
          No system is perfectly secure. If we become aware of a breach affecting your personal
          information, we will notify you and the relevant authorities as the law requires.
        </p>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children’s privacy',
    content: (
      <p>
        {P} is a business tool and is not directed to children. Account holders must be at least 18
        years old (or the age of majority where they live). We do not knowingly collect personal
        information from children through our website or app. Businesses that use {P} are
        responsible for how they handle messages from their own customers, including minors. If you
        believe a child has given us personal information, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this policy',
    content: (
      <p>
        We may update this policy as the service changes. For example, if we add a new messaging
        channel or service provider, we will update this page and the “Last updated” date. If a
        change is material, we will also notify account owners in the app or by email before it
        takes effect.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    content: (
      <>
        <p>
          For privacy questions or requests, email{' '}
          <a href={`mailto:${LEGAL.privacyEmail}`}>{LEGAL.privacyEmail}</a>. You can also reach us by
          post at <LegalValue value={LEGAL.registeredAddress} label="REGISTERED ADDRESS" />.
        </p>
        <p>
          More ways to reach us are on our <Link href="/contact">Contact</Link> page.
        </p>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={
        <p>
          This policy explains what personal information {P} collects, why, how it is used and
          shared, and the choices you have, including for data from Facebook, Instagram and WhatsApp
          accounts you connect.
        </p>
      }
      summary={
        <ul>
          <li>We store the messages and contacts from the accounts you connect, so your team can answer them in one inbox.</li>
          <li>We use Meta data only to provide that inbox. We never sell it or use it for ads.</li>
          <li>AI features are optional. When enabled, relevant messages are sent to the AI provider you choose.</li>
          <li>
            You can disconnect accounts at any time and ask us to delete your data. See{' '}
            <Link href="/data-deletion">Data Deletion</Link>.
          </li>
        </ul>
      }
      sections={sections}
    />
  );
}
