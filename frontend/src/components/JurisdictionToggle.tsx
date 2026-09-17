import type { Jurisdiction } from "../types";

interface Props {
  value: Jurisdiction;
  onChange: (j: Jurisdiction) => void;
  disabled: boolean;
}

export function JurisdictionToggle({ value, onChange, disabled }: Props) {
  return (
    <div className="toggle" data-active={value} role="tablist" aria-label="Jurisdiction Rulebook Selector">
      <button
        role="tab"
        aria-selected={value === "karnataka"}
        disabled={disabled}
        className={value === "karnataka" ? "on" : ""}
        onClick={() => onChange("karnataka")}
        title="Karnataka State Platform-Based Gig Workers Act overlay + Central Rules"
      >
        Karnataka
      </button>
      <button
        role="tab"
        aria-selected={value === "central"}
        disabled={disabled}
        className={value === "central" ? "on" : ""}
        onClick={() => onChange("central")}
        title="Social Security (Central) Rules 2026 only"
      >
        Central
      </button>
    </div>
  );
}
