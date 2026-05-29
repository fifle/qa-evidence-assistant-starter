import { useState } from "react";
import { FileUpload } from "../../components/FileUpload";
import { TextAreaField } from "../../components/TextAreaField";
import { OutputPanel } from "../../components/OutputPanel";
import { CopyButton } from "../../components/CopyButton";
import { WarningBox } from "../../components/WarningBox";
import { SectionCard } from "../../components/SectionCard";
import { parseHarJson } from "./harParser";
import { detectAllSignals } from "./signalRules";
import { buildReport, redactHarEntries } from "./reportBuilder";
import { downloadMarkdown } from "../../utils/downloadMarkdown";
import type { EnvironmentInfo, EvidenceInput } from "./evidenceTypes";

const defaultEnv: EnvironmentInfo = {
  environmentName: "staging",
  browser: "",
  device: "",
  pageUrl: "",
};

export function EvidenceAssistant() {
  const [testerNotes, setTesterNotes] = useState("");
  const [consoleLogs, setConsoleLogs] = useState("");
  const [environment, setEnvironment] = useState<EnvironmentInfo>(defaultEnv);
  const [harFileName, setHarFileName] = useState<string | undefined>();
  const [harRaw, setHarRaw] = useState<string | null>(null);
  const [reportMarkdown, setReportMarkdown] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);

  async function handleHarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setHarRaw(null);
      setHarFileName(undefined);
      return;
    }
    setHarFileName(file.name);
    setHarRaw(await file.text());
  }

  function handleGenerate() {
    const input: EvidenceInput = {
      testerNotes,
      consoleLogs,
      environment,
      harFileName,
    };

    const parsed = harRaw ? parseHarJson(harRaw) : null;
    const redactedHar = parsed ? redactHarEntries(parsed) : null;
    const har = redactedHar?.har ?? null;
    const redactionWarnings = redactedHar?.warnings ?? [];
    const signals = har ? detectAllSignals(har.entries) : [];
    const result = buildReport(input, har, signals, redactionWarnings);

    setReportMarkdown(result.markdown);
    setWarnings([...result.warnings, ...result.missingEvidence.map((m) => `Missing: ${m}`)]);
  }

  return (
    <div className="app-layout">
      <header className="hero">
        <h1>QA Evidence Assistant</h1>
        <p>
          Turn tester notes, HAR files, and console logs into a structured, reviewable bug report draft.
          All processing happens locally in your browser.
        </p>
      </header>

      <SectionCard title="Evidence input">
        <FileUpload
          label="HAR file"
          hint="Export from Chrome DevTools → Network → Save all as HAR. Files stay on your machine."
          accept=".har,application/json"
          onChange={handleHarChange}
        />
        {harFileName ? <p className="hint">Loaded: {harFileName}</p> : null}

        <TextAreaField
          label="Tester notes"
          hint="Include what you did, what you expected, and what happened."
          value={testerNotes}
          onChange={(e) => setTesterNotes(e.target.value)}
        />

        <TextAreaField
          label="Console logs"
          value={consoleLogs}
          onChange={(e) => setConsoleLogs(e.target.value)}
        />

        <fieldset className="env-fieldset">
          <legend>Environment</legend>
          <div className="env-grid">
            <label>
              Environment name
              <input
                value={environment.environmentName}
                onChange={(e) => setEnvironment({ ...environment, environmentName: e.target.value })}
              />
            </label>
            <label>
              Browser
              <input
                value={environment.browser}
                onChange={(e) => setEnvironment({ ...environment, browser: e.target.value })}
              />
            </label>
            <label>
              Device
              <input
                value={environment.device}
                onChange={(e) => setEnvironment({ ...environment, device: e.target.value })}
              />
            </label>
            <label>
              Page URL
              <input
                value={environment.pageUrl}
                onChange={(e) => setEnvironment({ ...environment, pageUrl: e.target.value })}
              />
            </label>
          </div>
        </fieldset>

        <button type="button" className="btn primary" onClick={handleGenerate}>
          Generate report
        </button>
      </SectionCard>

      <WarningBox messages={warnings} />

      <OutputPanel content={reportMarkdown} />

      <div className="actions">
        <CopyButton text={reportMarkdown} />
        <button
          type="button"
          className="btn secondary"
          disabled={!reportMarkdown}
          onClick={() => downloadMarkdown(reportMarkdown)}
        >
          Download markdown
        </button>
      </div>
    </div>
  );
}
