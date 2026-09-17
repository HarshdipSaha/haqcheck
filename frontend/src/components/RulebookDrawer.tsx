import rulebooks from "../data/rulebooks.json";
import type { Jurisdiction } from "../types";

type File = { file: string; text: string };
type Book = { displayName: string; common: File[]; overlay: File[] };
const books = rulebooks as Record<Jurisdiction, Book>;

interface Props { jurisdiction: Jurisdiction; highlightIds: string[]; open: boolean; onClose: () => void }

function idOf(text: string): string {
  return /@id\("([^"]+)"\)/.exec(text)?.[1] ?? "";
}

export function RulebookDrawer({ jurisdiction, highlightIds, open, onClose }: Props) {
  if (!open) return null;
  const book = books[jurisdiction];
  const other = books[jurisdiction === "central" ? "karnataka" : "central"];
  const render = (files: File[], dim: boolean) => files.map((f) => (
    <pre key={f.file} className={`cedar ${highlightIds.includes(idOf(f.text)) ? "hit" : ""} ${dim ? "dim" : ""}`}>
      <small>{f.file}</small>{"\n"}{f.text}
    </pre>
  ));
  return (
    <aside className="drawer">
      <header><h3>{book.displayName}</h3><button className="ghost" onClick={onClose}>Close</button></header>
      <h4>Common (central rules)</h4>
      {render(book.common, false)}
      <h4>Karnataka overlay {book.overlay.length === 0 && <span className="muted">(not in this rulebook)</span>}</h4>
      {render(book.overlay.length ? book.overlay : other.overlay, book.overlay.length === 0)}
    </aside>
  );
}
