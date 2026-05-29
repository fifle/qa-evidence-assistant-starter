import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function FileUpload({ label, hint, id, ...rest }: Props) {
  const inputId = id ?? "file-upload";
  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      {hint ? <p className="hint">{hint}</p> : null}
      <input id={inputId} type="file" {...rest} />
    </div>
  );
}
