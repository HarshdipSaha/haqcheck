interface Props {
  version?: string;
}

export function Footer({ version }: Props) {
  return (
    <footer className="foot">
      <div className="foot-left">
        <p style={{ margin: "0 0 8px 0", color: "var(--paper-75)" }}>
          <strong style={{ color: "var(--paper)" }}>Statutory Notice:</strong> HaqCheck evaluates which gazetted rule or high court order applies to the provided facts. It provides an eligibility estimate with legal citations, not binding legal counsel. Decisions are verified by <strong>Cedar in Amazon Verified Permissions</strong>; Amazon Bedrock translates and summarizes.
        </p>
        <p style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--paper-35)" }}>
          Rulebook Version: {version ?? "git-dev-preview"} · Schema: HaqCheck::Worker · Dual-Store Architecture
        </p>
      </div>

      <div className="foot-right">
        <span className="cost-tag">
          <span className="cost-dot" />
          Serverless: Scales to $0.00
        </span>
        <a
          href="https://github.com/HarshdipSaha/haqcheck"
          target="_blank"
          rel="noopener noreferrer"
          className="github-anchor"
        >
          <span>HarshdipSaha/haqcheck</span>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 13L13 3M13 3H5M13 3V11" />
          </svg>
        </a>
      </div>
    </footer>
  );
}
