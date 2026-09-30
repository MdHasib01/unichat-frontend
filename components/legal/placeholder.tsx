/**
 * Marks information that has not been supplied yet (a `null` in lib/legal.ts).
 * Deliberately loud so an unfinished policy is never mistaken for a final one.
 */
export function Placeholder({ label }: { label: string }) {
  return (
    <span
      className="rounded border border-dashed border-warning/60 bg-warning/10 px-1.5 py-0.5 font-mono text-[0.8em] font-medium text-foreground"
      title="Placeholder — set this value in frontend/lib/legal.ts"
    >
      [{label}]
    </span>
  );
}

/** Renders the configured value, or a placeholder when it is still missing. */
export function LegalValue({ value, label }: { value: string | null; label: string }) {
  return value ? <>{value}</> : <Placeholder label={label} />;
}
