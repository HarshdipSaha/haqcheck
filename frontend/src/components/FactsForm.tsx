import { useState } from "react";
import type { Facts } from "../types";

const PLATFORMS = [
  { id: "zomato", label: "Zomato", notified: true },
  { id: "swiggy", label: "Swiggy", notified: true },
  { id: "zepto", label: "Zepto", notified: true },
  { id: "urban_company", label: "Urban Company", notified: true },
  { id: "porter", label: "Porter", notified: false },
  { id: "ola", label: "Ola", notified: false },
  { id: "uber", label: "Uber", notified: false },
  { id: "other", label: "Other", notified: false },
];

const STATES = [
  { code: "KA", label: "KA — Karnataka (Bengaluru)" },
  { code: "MH", label: "MH — Maharashtra (Mumbai / Pune)" },
  { code: "DL", label: "DL — Delhi NCR" },
  { code: "TN", label: "TN — Tamil Nadu (Chennai)" },
  { code: "TS", label: "TS — Telangana (Hyderabad)" },
  { code: "AP", label: "AP — Andhra Pradesh" },
  { code: "KL", label: "KL — Kerala" },
  { code: "GJ", label: "GJ — Gujarat" },
  { code: "UP", label: "UP — Uttar Pradesh" },
  { code: "WB", label: "WB — West Bengal (Kolkata)" },
  { code: "RJ", label: "RJ — Rajasthan" },
  { code: "MP", label: "MP — Madhya Pradesh" },
  { code: "HR", label: "HR — Haryana (Gurugram)" },
  { code: "PB", label: "PB — Punjab" },
];

export const DEMO_CASE_1: Facts = {
  state: "KA",
  daysWorkedLast12m: 73,
  eshramRegistered: true,
  platforms: ["zomato", "swiggy"],
  vehicle: "two_wheeler",
  age: 24,
};

export const DEMO_CASE_2: Facts = {
  state: "MH",
  daysWorkedLast12m: 120,
  eshramRegistered: true,
  platforms: ["zomato"],
  vehicle: "two_wheeler",
  age: 27,
};

export const DEMO_CASE_3: Facts = {
  state: "KA",
  daysWorkedLast12m: 90,
  eshramRegistered: true,
  platforms: ["swiggy"],
  vehicle: "two_wheeler",
  age: 28,
};

interface Props {
  onSubmit: (f: Facts) => void;
  busy: boolean;
  errors?: Record<string, string>;
}

export function FactsForm({ onSubmit, busy, errors = {} }: Props) {
  const [f, setF] = useState<Facts>(DEMO_CASE_1);
  const [activePreset, setActivePreset] = useState<number>(1);

  const set = <K extends keyof Facts>(k: K, v: Facts[K]) => setF({ ...f, [k]: v });
  const togglePlatform = (p: string) =>
    set(
      "platforms",
      f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p]
    );

  const applyPreset = (presetNumber: number, data: Facts) => {
    setActivePreset(presetNumber);
    setF(data);
    onSubmit(data);
  };

  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(f);
      }}
    >
      <div className="form-header">
        <h2 className="form-title">Worker Profile & Work History</h2>
        <p className="form-sub">Enter your platform work records to evaluate statutory entitlement via Cedar policies.</p>
      </div>

      {/* Preset Scenarios */}
      <div className="presets-section">
        <span className="presets-label">Select Test Scenario</span>
        <div className="presets-list">
          <button
            type="button"
            className={`preset-chip ${activePreset === 1 ? "active" : ""}`}
            onClick={() => applyPreset(1, DEMO_CASE_1)}
          >
            <span className="preset-num">01</span>
            <span>Bengaluru 73d (The Dispute)</span>
          </button>
          <button
            type="button"
            className={`preset-chip ${activePreset === 2 ? "active" : ""}`}
            onClick={() => applyPreset(2, DEMO_CASE_2)}
          >
            <span className="preset-num">02</span>
            <span>Pune 120d (Out-of-State)</span>
          </button>
          <button
            type="button"
            className={`preset-chip ${activePreset === 3 ? "active" : ""}`}
            onClick={() => applyPreset(3, DEMO_CASE_3)}
          >
            <span className="preset-num">03</span>
            <span>90d Statutory Boundary</span>
          </button>
        </div>
      </div>

      {/* Operating State */}
      <div className="form-group">
        <label htmlFor="field-state">Operating State</label>
        <select
          id="field-state"
          value={f.state}
          onChange={(e) => {
            setActivePreset(0);
            set("state", e.target.value);
          }}
        >
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
        {errors.state && <small className="err">{errors.state}</small>}
      </div>

      {/* Days Worked */}
      <div className="form-group">
        <label htmlFor="field-days">Days Worked with Aggregator (Last 12 Months)</label>
        <input
          id="field-days"
          type="number"
          min={0}
          max={366}
          value={f.daysWorkedLast12m}
          onChange={(e) => {
            setActivePreset(0);
            set("daysWorkedLast12m", Number(e.target.value));
          }}
        />
        <span className="input-helper">
          Central Rules (IN-SSR2026-90day) mandate a minimum threshold of 90 days.
        </span>
        {errors.daysWorkedLast12m && <small className="err">{errors.daysWorkedLast12m}</small>}
      </div>

      {/* e-Shram Registration Toggle */}
      <div
        className="switch-card"
        onClick={() => {
          setActivePreset(0);
          set("eshramRegistered", !f.eshramRegistered);
        }}
      >
        <div className="switch-content">
          <span className="switch-title">e-Shram National Registration</span>
          <span className="switch-desc">Mandatory national registration on the Shram Suvidha portal</span>
        </div>
        <div className={`custom-switch ${f.eshramRegistered ? "on" : ""}`}>
          <div className="switch-handle" />
        </div>
      </div>

      {/* Aggregator Platforms Grid */}
      <fieldset className="platforms-fieldset">
        <legend className="platforms-legend">Aggregator Platforms</legend>
        <div className="platforms-grid">
          {PLATFORMS.map((p) => {
            const isSelected = f.platforms.includes(p.id);
            return (
              <label
                key={p.id}
                className={`platform-pill ${isSelected ? "selected" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActivePreset(0);
                  togglePlatform(p.id);
                }}
              >
                <input type="checkbox" checked={isSelected} readOnly />
                <span>{p.label}</span>
                {p.notified && <span className="notified-tag">NOTIFIED</span>}
              </label>
            );
          })}
        </div>
        {errors.platforms && <small className="err">{errors.platforms}</small>}
      </fieldset>

      {/* Vehicle Type */}
      <div className="form-group">
        <label htmlFor="field-vehicle">Delivery Vehicle Classification</label>
        <select
          id="field-vehicle"
          value={f.vehicle}
          onChange={(e) => {
            setActivePreset(0);
            set("vehicle", e.target.value as Facts["vehicle"]);
          }}
        >
          <option value="two_wheeler">Two-Wheeler (Motorcycle / Scooter)</option>
          <option value="bicycle">Bicycle</option>
          <option value="three_wheeler">Three-Wheeler (Auto / Cargo)</option>
          <option value="four_wheeler">Four-Wheeler (Car / Light Commercial)</option>
          <option value="none">None / Walking</option>
        </select>
        <span className="input-helper">Used for Karnataka state welfare cess rate calculation.</span>
      </div>

      {/* Age */}
      <div className="form-group">
        <label htmlFor="field-age">Age</label>
        <input
          id="field-age"
          type="number"
          min={18}
          max={80}
          value={f.age}
          onChange={(e) => {
            setActivePreset(0);
            set("age", Number(e.target.value));
          }}
        />
        {errors.age && <small className="err">{errors.age}</small>}
      </div>

      {/* Submit Button */}
      <button type="submit" className="submit-btn" disabled={busy}>
        <span>{busy ? "Evaluating Policy Engine…" : "Verify Entitlements with Cedar"}</span>
        <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
          <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </form>
  );
}
