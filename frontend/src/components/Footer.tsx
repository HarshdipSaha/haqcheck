interface Props { version?: string }
export function Footer({ version }: Props) {
  return (
    <footer className="foot">
      HaqCheck shows which written rule applies to the facts you entered. It is an eligibility estimate with citations,
      not legal advice. Rules change; this rulebook is version <code>{version ?? "—"}</code>.
      Decisions are computed by Cedar in Amazon Verified Permissions; the language model only explains.
    </footer>
  );
}
