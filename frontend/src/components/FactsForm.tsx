import { useState } from "react";
import type { Facts } from "../types";

const PLATFORMS = ["zomato", "swiggy", "zepto", "urban_company", "porter", "ola", "uber", "other"];
const STATES = ["KA", "MH", "DL", "TN", "TS", "AP", "KL", "GJ", "UP", "WB", "RJ", "MP", "BR", "OD", "PB", "HR"];

export const DEMO_CASE_1: Facts = { state: "KA", daysWorkedLast12m: 73, eshramRegistered: true, platforms: ["zomato", "swiggy"], vehicle: "two_wheeler", age: 24 };
export const DEMO_CASE_2: Facts = { state: "MH", daysWorkedLast12m: 120, eshramRegistered: true, platforms: ["zomato"], vehicle: "two_wheeler", age: 27 };

interface Props { onSubmit: (f: Facts) => void; busy: boolean; errors?: Record<string, string> }

export function FactsForm({ onSubmit, busy, errors = {} }: Props) {
  const [f, setF] = useState<Facts>(DEMO_CASE_1);
  const set = <K extends keyof Facts>(k: K, v: Facts[K]) => setF({ ...f, [k]: v });
  const toggle = (p: string) =>
    set("platforms", f.platforms.includes(p) ? f.platforms.filter((x) => x !== p) : [...f.platforms, p]);

  return (
    <form className="card form" onSubmit={(e) => { e.preventDefault(); onSubmit(f); }}>
      <h2>Your facts</h2>
      <label>State
        <select value={f.state} onChange={(e) => set("state", e.target.value)}>
          {STATES.map((s) => <option key={s}>{s}</option>)}
        </select>
        {errors.state && <small className="err">{errors.state}</small>}
      </label>
      <label>Days worked in the last 12 months
        <input type="number" min={0} max={366} value={f.daysWorkedLast12m}
          onChange={(e) => set("daysWorkedLast12m", Number(e.target.value))} />
        {errors.daysWorkedLast12m && <small className="err">{errors.daysWorkedLast12m}</small>}
      </label>
      <label className="row">
        <input type="checkbox" checked={f.eshramRegistered} onChange={(e) => set("eshramRegistered", e.target.checked)} />
        Registered on e-Shram
      </label>
      <fieldset><legend>Platforms you work on</legend>
        {PLATFORMS.map((p) => (
          <label key={p} className="chip">
            <input type="checkbox" checked={f.platforms.includes(p)} onChange={() => toggle(p)} /> {p.replace("_", " ")}
          </label>
        ))}
        {errors.platforms && <small className="err">{errors.platforms}</small>}
      </fieldset>
      <label>Vehicle
        <select value={f.vehicle} onChange={(e) => set("vehicle", e.target.value as Facts["vehicle"])}>
          {["two_wheeler", "bicycle", "three_wheeler", "four_wheeler", "none"].map((v) => <option key={v} value={v}>{v.replace("_", " ")}</option>)}
        </select>
      </label>
      <label>Age
        <input type="number" min={18} max={80} value={f.age} onChange={(e) => set("age", Number(e.target.value))} />
        {errors.age && <small className="err">{errors.age}</small>}
      </label>
      <div className="row">
        <button type="submit" disabled={busy}>{busy ? "Checking…" : "Check my haq"}</button>
        <button type="button" className="ghost" onClick={() => setF(DEMO_CASE_1)}>Case 1</button>
        <button type="button" className="ghost" onClick={() => setF(DEMO_CASE_2)}>Case 2</button>
      </div>
    </form>
  );
}
