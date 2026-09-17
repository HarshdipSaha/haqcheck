import type { Jurisdiction } from "../types";

interface Props { value: Jurisdiction; onChange: (j: Jurisdiction) => void; disabled: boolean }

export function JurisdictionToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="toggle" role="tablist" aria-label="Rulebook">
      {(["central", "karnataka"] as Jurisdiction[]).map((j) => (
        <button key={j} role="tab" aria-selected={value === j} disabled={disabled}
          className={value === j ? "on" : ""} onClick={() => onChange(j)}>
          {j === "central" ? "Central rulebook" : "Karnataka rulebook"}
        </button>
      ))}
    </div>
  );
}
