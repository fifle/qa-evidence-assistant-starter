import type { TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
}

export function TextAreaField({ label, hint, id, ...rest }: Props) {
  const areaId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="field">
      <label htmlFor={areaId}>{label}</label>
      {hint ? <p className="hint">{hint}</p> : null}
      <textarea id={areaId} rows={4} {...rest} />
    </div>
  );
}
