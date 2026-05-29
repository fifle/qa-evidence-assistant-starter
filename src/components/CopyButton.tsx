interface Props {
  label?: string;
  text: string;
  disabled?: boolean;
}

export function CopyButton({ label = "Copy markdown", text, disabled }: Props) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may be unavailable in some embedded contexts
    }
  }

  return (
    <button type="button" className="btn secondary" onClick={handleCopy} disabled={disabled || !text}>
      {label}
    </button>
  );
}
