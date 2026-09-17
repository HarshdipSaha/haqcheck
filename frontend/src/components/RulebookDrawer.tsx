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
          className={`cedar-card ${isHit ? "hit" : ""} ${dim ? "dim" : ""}`}
        >
          <div className="cedar-file">
            <span>{f.file}</span>
            {isHit && <span className="cedar-active-badge">Active Determining Policy</span>}
          </div>
          <pre style={{ margin: 0 }}>{f.text}</pre>
        </div>
      );
    });

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer-panel" role="dialog" aria-modal="true" aria-label="Cedar Rulebook Viewer">
        <div className="drawer-head">
          <div>
            <h3 className="drawer-title">{book.displayName}</h3>
          </div>
          <button className="pill-btn" onClick={onClose}>
            <span>Close</span>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="12" y2="12" />
              <line x1="12" y1="4" x2="4" y2="12" />
            </svg>
          </button>
        </div>

        <p className="drawer-intro">
          Cedar policies in Amazon Verified Permissions. Decided by <code>permit</code> / <code>forbid</code> satisfaction — the model can&apos;t sway it.
        </p>

        <div className="label" style={{ marginBottom: 10 }}>Common Policies (Central Rules 2026)</div>
        {renderCedar(book.common, false)}

        <div className="label" style={{ marginTop: 24, marginBottom: 10 }}>
          Karnataka State Overlay Policies{" "}
          {book.overlay.length === 0 && (
            <span style={{ textTransform: "none", color: "var(--paper-35)", fontWeight: 400 }}>
              (Not included in Central rulebook)
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
