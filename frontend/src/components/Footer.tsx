interface Props {
  version?: string;
}

export function Footer({ version }: Props) {
  return (
    <footer className="foot">
      <div className="foot-left">
        <p style={{ margin: "0 0 6px 0" }}>
          <strong>Legal Disclaimer:</strong> HaqCheck shows which gazetted rule or court order applies to the worker facts entered.
          It is a deterministic eligibility estimate with statutory citations, not legal counsel.
          Decisions are evaluated by <strong>Cedar in Amazon Verified Permissions</strong>; Amazon Bedrock only translates and explains.
        </p>
        <p style={{ margin: 0, color: "#94a3b8" }}>
          Rulebook Version: <code>{version ?? "git-dev-preview"}</code> · Shared Schema: <code>HaqCheck::Worker</code> · Multi-Jurisdiction Store
        </p>
      </div>

      <div className="foot-right">
        <span className="cost-badge">
          <span className="cost-dot" />
          Serverless Architecture: Scales to $0.00
        </span>
        <a
          href="https://github.com/HarshdipSaha/haqcheck"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          <span>GitHub: HarshdipSaha/haqcheck</span> ↗
        </a>
      </div>
    </footer>
  );
}
