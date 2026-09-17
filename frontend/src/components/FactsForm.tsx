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
        <h2 className="form-title">Worker Profile</h2>
        <p className="form-sub">Your platform work history, checked against both rulebooks.</p>
      </div>

      {/* Preset Scenarios */}
      <div className="presets-section">
        <span className="presets-label">Try a Scenario</span>
        <div className="presets-list">
          <button
            type="button"
            className={`preset-chip ${activePreset === 1 ? "active" : ""}`}
            onClick={() => applyPreset(1, DEMO_CASE_1)}
          >
            Bengaluru, 73d — the dispute
          </button>
          <button
            type="button"
            className={`preset-chip ${activePreset === 2 ? "active" : ""}`}
            onClick={() => applyPreset(2, DEMO_CASE_2)}
          >
            Pune, 120d
          </button>
          <button
            type="button"
            className={`preset-chip ${activePreset === 3 ? "active" : ""}`}
            onClick={() => applyPreset(3, DEMO_CASE_3)}
          >
            90-day boundary
          </button>
        </div>
      </div>

      {/* Operating State */}
      <div className="form-group">
        <label htmlFor="field-state">Operating State</label>
        <select
          id="field-state"
          value={f.state}
          aria-describedby={errors.state ? "field-state-error" : undefined}
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
        {errors.state && <small id="field-state-error" className="err">{errors.state}</small>}
      </div>

      {/* Days Worked */}
      <div className="form-group">
        <label htmlFor="field-days">Days Worked with Aggregator (Last 12 Months)</label>
        <input
          id="field-days"
          type="number"
          inputMode="numeric"
          min={0}
          max={366}
          value={f.daysWorkedLast12m}
          aria-describedby="field-days-help field-days-error"
          onChange={(e) => {
            setActivePreset(0);
            set("daysWorkedLast12m", Number(e.target.value));
          }}
        />
        <span id="field-days-help" className="input-helper">Central Rules require 90 days minimum.</span>
        {errors.daysWorkedLast12m && <small id="field-days-error" className="err">{errors.daysWorkedLast12m}</small>}
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
          <span className="switch-desc">Via the Shram Suvidha portal</span>
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
                title={p.notified ? `${p.label} is a notified aggregator under the Karnataka Act` : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  setActivePreset(0);
                  togglePlatform(p.id);
                }}
              >
                <input type="checkbox" checked={isSelected} readOnly />
                {isSelected && (
                  <svg className="platform-check" width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3.5 8.5 6.5 11.5 12.5 5" />
                  </svg>
                )}
                <span>{p.label}</span>
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
        <span className="input-helper">Sets the Karnataka welfare cess rate.</span>
      </div>

      {/* Age */}
      <div className="form-group">
        <label htmlFor="field-age">Age</label>
        <input
          id="field-age"
          type="number"
          inputMode="numeric"
          min={18}
          max={80}
          value={f.age}
          aria-describedby={errors.age ? "field-age-error" : undefined}
          onChange={(e) => {
            setActivePreset(0);
            set("age", Number(e.target.value));
          }}
        />
        {errors.age && <small id="field-age-error" className="err">{errors.age}</small>}
      </div>

      {/* Submit Button */}
      <button type="submit" className="submit-btn" disabled={busy}>
        <span>{busy ? "Evaluating…" : "Verify with Cedar"}</span>
        {busy ? (
          <svg className="spinner" aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2" />
            <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        ) : (
          <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none">
            <path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
    </form>
  );
}
