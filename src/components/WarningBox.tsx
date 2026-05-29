interface Props {
  messages: string[];
}

export function WarningBox({ messages }: Props) {
  if (messages.length === 0) return null;
  return (
    <aside className="warning-box" role="alert">
      <h3>Warnings</h3>
      <ul>
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </aside>
  );
}
