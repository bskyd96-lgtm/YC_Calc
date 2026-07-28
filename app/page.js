"use client";

import { useMemo, useState } from "react";

const tools = [
  { id: "flow", label: "유량 환산", short: "Q", unit: "m³/day" },
  { id: "hrt", label: "체류시간", short: "HRT", unit: "hr" },
  { id: "dose", label: "약품 주입", short: "DOSE", unit: "kg/day" },
  { id: "load", label: "오염 부하", short: "LOAD", unit: "kg/day" },
  { id: "removal", label: "제거 효율", short: "η", unit: "%" },
];

const initialValues = {
  flow: { value: "1250", from: "m3day", to: "lsec" },
  hrt: { volume: "480", flow: "1250" },
  dose: { flow: "1250", concentration: "18", purity: "35" },
  load: { flow: "1250", concentration: "220" },
  removal: { influent: "220", effluent: "28" },
};

const n = (value) => Number(String(value).replaceAll(",", ""));
const pretty = (value, digits = 2) =>
  Number.isFinite(value)
    ? value.toLocaleString("ko-KR", { maximumFractionDigits: digits })
    : "—";

function Field({ label, value, onChange, unit, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <div className="input-wrap">
        <input
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label={label}
        />
        <span>{unit}</span>
      </div>
      {hint && <small>{hint}</small>}
    </label>
  );
}

function StatusDot() {
  return (
    <div className="status">
      <span className="status-dot" />
      계산 준비됨
    </div>
  );
}

export default function Home() {
  const [active, setActive] = useState("flow");
  const [values, setValues] = useState(initialValues);
  const [copied, setCopied] = useState(false);

  const set = (section, key, value) =>
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));

  const result = useMemo(() => {
    if (active === "flow") {
      const rates = { m3day: 1, m3hr: 24, lmin: 1.44, lsec: 86.4 };
      const units = { m3day: "m³/day", m3hr: "m³/hr", lmin: "L/min", lsec: "L/sec" };
      const value = n(values.flow.value) * rates[values.flow.from] / rates[values.flow.to];
      return { value, unit: units[values.flow.to], formula: `${values.flow.value || 0} ${units[values.flow.from]} × ${rates[values.flow.from]} ÷ ${rates[values.flow.to]}`, detail: "선택한 시간·부피 단위 기준 환산값" };
    }
    if (active === "hrt") {
      const value = n(values.hrt.volume) / n(values.hrt.flow) * 24;
      return { value, unit: "hr", formula: `(${values.hrt.volume || 0} m³ ÷ ${values.hrt.flow || 0} m³/day) × 24`, detail: "유효 용적을 일 유량으로 나눈 이론적 체류시간" };
    }
    if (active === "dose") {
      const activeDose = n(values.dose.flow) * n(values.dose.concentration) / 1000;
      const value = activeDose / (n(values.dose.purity) / 100);
      return { value, unit: "kg/day", formula: `(${values.dose.flow || 0} × ${values.dose.concentration || 0} ÷ 1,000) ÷ ${values.dose.purity || 0}%`, detail: `유효 성분 ${pretty(activeDose)} kg/day 기준 제품 필요량` };
    }
    if (active === "load") {
      const value = n(values.load.flow) * n(values.load.concentration) / 1000;
      return { value, unit: "kg/day", formula: `${values.load.flow || 0} m³/day × ${values.load.concentration || 0} mg/L ÷ 1,000`, detail: "유량과 농도로 산정한 일 오염물질 부하량" };
    }
    const value = (n(values.removal.influent) - n(values.removal.effluent)) / n(values.removal.influent) * 100;
    return { value, unit: "%", formula: `(${values.removal.influent || 0} − ${values.removal.effluent || 0}) ÷ ${values.removal.influent || 0} × 100`, detail: "유입·유출 농도 차이에 따른 제거 효율" };
  }, [active, values]);

  const invalid = !Number.isFinite(result.value) || result.value < 0;
  const copyResult = async () => {
    const activeTool = tools.find((item) => item.id === active);
    const text = `${activeTool.label}: ${pretty(result.value)} ${result.unit}\n계산식: ${result.formula}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main>
      <header>
        <a className="brand" href="#" aria-label="워터워크 계산실 홈">
          <span className="brand-mark">W</span>
          <span>WATERWORK<small>CALCULATION DESK</small></span>
        </a>
        <div className="header-right">
          <StatusDot />
          <span className="date">실무 계산 · SI 기준</span>
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">WATER TREATMENT UTILITY</p>
          <h1>수처리 계산,<br /><em>확실하게.</em></h1>
        </div>
        <p className="hero-copy">현장에서 반복되는 핵심 계산을 빠르게 확인하세요.<br />입력부터 산식, 결과까지 한 화면에 정리했습니다.</p>
      </section>

      <section className="workspace">
        <nav className="tool-nav" aria-label="계산 도구">
          <p>CALCULATORS <span>05</span></p>
          {tools.map((tool, index) => (
            <button key={tool.id} className={active === tool.id ? "active" : ""} onClick={() => setActive(tool.id)}>
              <span className="tool-index">0{index + 1}</span>
              <span className="tool-copy"><b>{tool.label}</b><small>{tool.short} · {tool.unit}</small></span>
              <span className="arrow">↗</span>
            </button>
          ))}
          <div className="nav-note"><span>i</span><p>계산 결과는 설계 및 운전 검토를 위한 참고값입니다.</p></div>
        </nav>

        <div className="calculator">
          <div className="calc-head">
            <div>
              <span className="calc-kicker">{tools.findIndex((t) => t.id === active) + 1 < 10 ? "0" : ""}{tools.findIndex((t) => t.id === active) + 1} / 05</span>
              <h2>{tools.find((t) => t.id === active).label}</h2>
            </div>
            <button className="reset" onClick={() => setValues(initialValues)}>↻ 입력 초기화</button>
          </div>

          <div className="fields">
            {active === "flow" && <>
              <Field label="환산할 값" value={values.flow.value} onChange={(v) => set("flow", "value", v)} unit="" />
              <label className="field"><span className="field-label">현재 단위</span><select value={values.flow.from} onChange={(e) => set("flow", "from", e.target.value)}><option value="m3day">m³/day</option><option value="m3hr">m³/hr</option><option value="lmin">L/min</option><option value="lsec">L/sec</option></select></label>
              <label className="field"><span className="field-label">변환 단위</span><select value={values.flow.to} onChange={(e) => set("flow", "to", e.target.value)}><option value="m3day">m³/day</option><option value="m3hr">m³/hr</option><option value="lmin">L/min</option><option value="lsec">L/sec</option></select></label>
            </>}
            {active === "hrt" && <>
              <Field label="유효 용적" value={values.hrt.volume} onChange={(v) => set("hrt", "volume", v)} unit="m³" hint="수조의 실제 운전 용적" />
              <Field label="일 평균 유량" value={values.hrt.flow} onChange={(v) => set("hrt", "flow", v)} unit="m³/day" />
            </>}
            {active === "dose" && <>
              <Field label="처리 유량" value={values.dose.flow} onChange={(v) => set("dose", "flow", v)} unit="m³/day" />
              <Field label="목표 주입 농도" value={values.dose.concentration} onChange={(v) => set("dose", "concentration", v)} unit="mg/L" />
              <Field label="제품 순도" value={values.dose.purity} onChange={(v) => set("dose", "purity", v)} unit="%" hint="제품 성적서 기준 유효 성분" />
            </>}
            {active === "load" && <>
              <Field label="처리 유량" value={values.load.flow} onChange={(v) => set("load", "flow", v)} unit="m³/day" />
              <Field label="대상 물질 농도" value={values.load.concentration} onChange={(v) => set("load", "concentration", v)} unit="mg/L" />
            </>}
            {active === "removal" && <>
              <Field label="유입 농도" value={values.removal.influent} onChange={(v) => set("removal", "influent", v)} unit="mg/L" />
              <Field label="유출 농도" value={values.removal.effluent} onChange={(v) => set("removal", "effluent", v)} unit="mg/L" />
            </>}
          </div>

          <div className={`result ${invalid ? "invalid" : ""}`}>
            <div className="result-top"><span>CALCULATED RESULT</span><span className="live"><i /> LIVE</span></div>
            <div className="result-number">{invalid ? "입력 확인" : pretty(result.value)} <small>{invalid ? "" : result.unit}</small></div>
            <p>{invalid ? "0보다 큰 유효한 값을 입력해 주세요." : result.detail}</p>
            <div className="formula"><span>산식</span><code>{result.formula}</code></div>
            <button className="copy" onClick={copyResult} disabled={invalid}>{copied ? "✓ 복사됨" : "결과 복사"}</button>
          </div>
        </div>
      </section>

      <footer>
        <span>WATERWORK / CALC DESK</span>
        <p>단위와 입력 조건을 반드시 재확인하세요. 실제 설계·약품 투입 전에는 공인 기준 및 담당 기술자의 검토가 필요합니다.</p>
        <span>v1.0 · 2026</span>
      </footer>
    </main>
  );
}
