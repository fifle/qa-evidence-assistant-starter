interface Props {
  title?: string;
  content: string;
}

export function OutputPanel({ title = "Generated report", content }: Props) {
  return (
    <section className="card output-panel" aria-live="polite">
      <h2>{title}</h2>
      <pre className="report-output">{content || "Generate a report to see output here."}</pre>
    </section>
  );
}
