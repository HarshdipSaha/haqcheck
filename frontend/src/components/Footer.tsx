interface Props {
  version?: string;
}

export function Footer({ version }: Props) {
  return (
    <footer className="foot">
      <div className="foot-left">
        <p style={{ margin: "0 0 8px 0", color: "var(--paper-75)" }}>
          <strong style={{ color: "var(--paper)" }}>Not legal advice.</strong> An eligibility estimate with citations. Cedar in Amazon Verified Permissions decides; Bedrock only translates.
        </p>
        <p className="mono-num" style={{ margin: 0, fontSize: 11, color: "var(--paper-60)" }}>
          Rulebook {version ?? "git-dev-preview"} · HaqCheck::Worker
        </p>
        <p className="foot-credit">
          Built at WeMakeDevs × AWS Bharat Builds Tour, Stop 01 — First Commit, Sept 2026.
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
