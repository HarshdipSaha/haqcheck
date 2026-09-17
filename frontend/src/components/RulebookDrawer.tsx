import { useEffect } from "react";
import rulebooks from "../data/rulebooks.json";
import type { Jurisdiction } from "../types";

type File = { file: string; text: string };
type Book = { displayName: string; common: File[]; overlay: File[] };
const books = rulebooks as Record<Jurisdiction, Book>;

interface Props {
  jurisdiction: Jurisdiction;
  highlightIds: string[];
  open: boolean;
  onClose: () => void;
}

function idOf(text: string): string {
  return /@id\("([^"]+)"\)/.exec(text)?.[1] ?? "";
}

export function RulebookDrawer({
  jurisdiction,
  highlightIds,
  open,
  onClose,
}: Props) {
  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const book = books[jurisdiction];
  const other = books[jurisdiction === "central" ? "karnataka" : "central"];

  const renderCedar = (files: File[], dim: boolean) =>
    files.map((f) => {
      const ruleId = idOf(f.text);
      const isHit = highlightIds.includes(ruleId);
      return (
        <div
          key={f.file}
          className={`cedar-block ${isHit ? "hit" : ""} ${dim ? "dim" : ""}`}
        >
          <div className="cedar-block-file">
            📄 {f.file} {isHit && <span style={{ color: "#f59e0b", marginLeft: 8 }}>⚡ Active Determining Policy</span>}
          </div>
          <pre style={{ margin: 0 }}>{f.text}</pre>
        </div>
      );
    });

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Cedar Rulebook Viewer">
        <header>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Amazon Verified Permissions (AVP)
            </span>
            <h3>{book.displayName}</h3>
          </div>
          <button className="drawer-close-btn" onClick={onClose}>
            ✕ Close
          </button>
        </header>

        <p style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.5 }}>
          These are the authoritative Cedar policies stored in AWS Verified Permissions.
          Eligibility is computed via mathematical evaluation of <code>permit</code> and <code>forbid</code> rules; the LLM never decides or alters policy logic.
        </p>

        <div className="drawer-section-title">Common Policies (Social Security Central Rules)</div>
        {renderCedar(book.common, false)}

        <div className="drawer-section-title">
          Karnataka State Overlay Policies{" "}
          {book.overlay.length === 0 && (
            <span style={{ fontSize: 11, color: "#64748b", textTransform: "none", fontWeight: 400 }}>
              (Not active under Central rulebook)
            </span>
          )}
        </div>
        {renderCedar(
          book.overlay.length ? book.overlay : other.overlay,
          book.overlay.length === 0
        )}
      </aside>
    </>
  );
}
