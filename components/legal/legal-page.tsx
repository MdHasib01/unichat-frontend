import { phoneHref, type Legal } from '@/lib/legal';

/**
 * The business identity as a list, for use inside policy prose. Only the
 * details the brand publishes are listed (Unichat publishes none beyond its
 * name).
 */
export function BusinessDetails({ legal }: { legal: Legal }) {
  return (
    <ul>
      <li>Business name: {legal.operatorName}</li>
      {legal.proprietor ? <li>Proprietor: {legal.proprietor}</li> : null}
      {legal.address ? <li>Address: {legal.address}</li> : null}
      {legal.phone ? (
        <li>
          Phone: <a href={phoneHref(legal.phone)}>{legal.phone}</a>
        </li>
      ) : null}
      {legal.supportEmail ? (
        <li>
          Email: <a href={`mailto:${legal.supportEmail}`}>{legal.supportEmail}</a>
        </li>
      ) : null}
    </ul>
  );
}

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

/**
 * Body typography for policy text. The project has no typography plugin, so
 * the prose rules live here as descendant selectors.
 */
const PROSE =
  'text-sm leading-relaxed text-muted-foreground ' +
  '[&_p]:mt-3 first:[&_p]:mt-0 ' +
  '[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 ' +
  '[&_ol]:mt-3 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5 ' +
  '[&_h3]:mt-5 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-foreground ' +
  '[&_strong]:font-semibold [&_strong]:text-foreground ' +
  '[&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline ' +
  '[&_code]:rounded [&_code]:bg-secondary [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground';

export function LegalPage({
  title,
  intro,
  summary,
  sections,
  showToc = true,
  legal,
}: {
  title: string;
  intro?: React.ReactNode;
  /** Short plain-language summary shown in a callout above the full text. */
  summary?: React.ReactNode;
  sections: LegalSection[];
  showToc?: boolean;
  /** The brand's legal facts, from getLegal(). */
  legal: Legal;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-primary">Legal</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: {legal.lastUpdated}</p>
        {intro ? <div className={`mt-5 ${PROSE}`}>{intro}</div> : null}
      </header>

      {summary ? (
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-foreground">In short</p>
          <div className={`mt-2 ${PROSE}`}>{summary}</div>
        </div>
      ) : null}

      {showToc && sections.length > 3 ? (
        <nav aria-label="On this page" className="mt-6 rounded-lg border border-border bg-card p-4 shadow-card">
          <p className="text-sm font-semibold text-foreground">On this page</p>
          <ol className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((section, index) => (
              <li key={section.id} className="min-w-0">
                <a
                  href={`#${section.id}`}
                  className="flex gap-2 text-muted-foreground hover:text-foreground hover:underline"
                >
                  <span className="w-5 shrink-0 tabular-nums text-muted-foreground/70">{index + 1}.</span>
                  <span>{section.title}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="mt-8 space-y-10">
        {sections.map((section, index) => (
          <section key={section.id} id={section.id} className="scroll-mt-24">
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {showToc && sections.length > 3 ? `${index + 1}. ` : ''}
              {section.title}
            </h2>
            <div className={`mt-3 ${PROSE}`}>{section.content}</div>
          </section>
        ))}
      </div>
    </article>
  );
}

/** Two-column fact table used for cookies, permissions and contacts. */
export function LegalTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-secondary/60 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} scope="col" className="px-3 py-2 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="align-top">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={cellIndex === 0 ? 'px-3 py-2.5 font-medium text-foreground' : 'px-3 py-2.5'}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
