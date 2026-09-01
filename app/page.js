"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";

const tools = [
  { id: "depth", label: "월류수심" },
  { id: "flow", label: "시설용량(평웨어)" },
  { id: "orifice", label: "오리피스" },
  { id: "vnotch", label: "V-노치" },
  { id: "diameter", label: "필요구경" },
  { id: "pac", label: "PAC 투입량" },
  { id: "polymer", label: "폴리머 투입량" },
  { id: "mixing", label: "혼화조" },
  { id: "coagulant", label: "무기응집제투입량계산식" },
];

const navTools = [
  { id: "hydraulic", label: "수리계산" },
  { id: "mixing", label: "혼화조" },
  { id: "chemical", label: "약품투입량" },
  { id: "coagulant", label: "무기응집제투입량계산식" },
];

const categoryDescriptions = {
  hydraulic: "월류수심 · 오리피스 · V-노치 · 필요구경",
  mixing: "급속·완속 혼화조 용적 및 체류시간",
  chemical: "PAC·폴리머 투입량 계산",
  coagulant: "T-P 기준 무기응집제 투입량 계산",
};

const initialValues = {
  flow: { weirLength: "2.5", overflowDepth: "150" },
  depth: { capacity: "23089.18", weirLength: "2.5" },
  orifice: { capacity: "1000", type: "rect", width: "0.5", height: "0.4", coefficient: "0.62" },
  vnotch: { capacity: "100", notchCount: "1" },
  diameter: { velocity: "0.8", capacity: "1000" },
  pac: { mode: "minute", capacity: "1000", dose: "20", specificGravity: "1.2", operationHours: "24", minuteDose: "10" },
  polymer: { capacity: "1000", dose: "2", dissolution: "0.2" },
  mixing: {
    mode: "rapid",
    rapid: { capacity: "1000", length: "2", width: "2", height: "2.5" },
    slow: { capacity: "1000", length: "2", width: "2", height: "2.5" },
  },
  coagulant: { capacity: "1000", influentTP: "2", targetTP: "0.2", chemicalConcentration: "17", specificGravity: "1.368", molarRatio: "3.2" },
};

const emptyValues = {
  flow: { weirLength: "", overflowDepth: "" },
  depth: { capacity: "", weirLength: "" },
  orifice: { capacity: "", type: "rect", width: "", height: "", coefficient: "" },
  vnotch: { capacity: "", notchCount: "" },
  diameter: { velocity: "", capacity: "" },
  pac: { mode: "minute", capacity: "", dose: "", specificGravity: "", operationHours: "", minuteDose: "" },
  polymer: { capacity: "", dose: "", dissolution: "" },
  coagulant: { capacity: "", influentTP: "", targetTP: "", chemicalConcentration: "", specificGravity: "", molarRatio: "" },
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

export default function Home() {
  const [active, setActive] = useState(null);
  const [values, setValues] = useState(initialValues);
  const [copied, setCopied] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const scrollToTopAfterCategoryOpen = useRef(false);

  useLayoutEffect(() => {
    if (!scrollToTopAfterCategoryOpen.current || active === null) return;

    scrollToTopAfterCategoryOpen.current = false;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [active]);

  const set = (section, key, value) =>
    setValues((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  const setMixing = (key, value) =>
    setValues((prev) => ({
      ...prev,
      mixing: {
        ...prev.mixing,
        [prev.mixing.mode]: { ...prev.mixing[prev.mixing.mode], [key]: value },
      },
    }));
  const openCategory = (category) => {
    scrollToTopAfterCategoryOpen.current = true;
    setActive(category === "hydraulic" ? "flow" : category === "chemical" ? "pac" : category);
  };

  const result = useMemo(() => {
    if (active === "flow") {
      const value = 1.84 * n(values.flow.weirLength) * Math.pow(n(values.flow.overflowDepth) / 1000, 1.5) * 86400;
      return { value, unit: "m³/day", formula: `1.84 × ${values.flow.weirLength || 0} × (${values.flow.overflowDepth || 0} ÷ 1,000)^(3/2) × 86,400`, detail: "웨어 길이와 월류수심으로 산정한 일 시설용량" };
    }
    if (active === "depth") {
      const value = 1000 * Math.pow(n(values.depth.capacity) / (1.84 * n(values.depth.weirLength) * 86400), 2 / 3);
      return { value, unit: "mm", formula: `1,000 × [${values.depth.capacity || 0} ÷ (1.84 × ${values.depth.weirLength || 0} × 86,400)]^(2/3)`, detail: "시설용량과 웨어길이로 역산한 월류수심" };
    }
    if (active === "orifice") {
      const area = values.orifice.type === "rect"
        ? n(values.orifice.width) * n(values.orifice.height)
        : Math.PI * Math.pow(n(values.orifice.width), 2) / 4;
      const flowPerSecond = n(values.orifice.capacity) / 86400;
      const value = Math.pow(flowPerSecond / (n(values.orifice.coefficient) * area), 2) / (2 * 9.81) * 1000;
      const type = values.orifice.type === "rect" ? "사각" : "원형";
      return { value, unit: "mm", formula: `[(${values.orifice.capacity || 0} ÷ 86,400) ÷ (${values.orifice.coefficient || 0} × ${pretty(area, 4)})]² ÷ (2 × 9.81) × 1,000`, detail: `${type} 타공면적 ${pretty(area, 4)} m² 기준 수두 손실` };
    }
    if (active === "vnotch") {
      const capacity = n(values.vnotch.capacity);
      const coefficient = capacity <= 100 ? 0.392 : capacity <= 150 ? 0.593 : capacity <= 200 ? 0.813 : 1.42;
      const value = Math.pow((capacity / n(values.vnotch.notchCount) / 86400) / coefficient, 2 / 5) * 1000;
      return { value, unit: "mm", formula: `[((${values.vnotch.capacity || 0} ÷ ${values.vnotch.notchCount || 0} ÷ 86,400) ÷ ${coefficient})]^(2/5) × 1,000`, detail: `시설용량 기준 유량계수 ${coefficient} 자동 적용` };
    }
    if (active === "diameter") {
      const value = 1129 * Math.sqrt((n(values.diameter.capacity) / 86400) / n(values.diameter.velocity));
      return { value, unit: "mm", formula: `1,129 × √[(${values.diameter.capacity || 0} ÷ 86,400) ÷ ${values.diameter.velocity || 0}]`, detail: "설계 유속과 시설용량으로 산정한 필요 관경" };
    }
    if (active === "pac") {
      if (values.pac.mode === "ppm") {
        const value = n(values.pac.minuteDose) * n(values.pac.specificGravity) * 60 * 24 / n(values.pac.capacity);
        return { value, unit: "ppm", formula: `${values.pac.minuteDose || 0} × ${values.pac.specificGravity || 0} × 60 × 24 ÷ ${values.pac.capacity || 0}`, detail: "비중 및 24시간 연속 투입 기준 환산 농도" };
      }
      const value = ((n(values.pac.capacity) * n(values.pac.dose)) / n(values.pac.specificGravity)) * 1e-3;
      const secondaryValue = value / (60 * n(values.pac.operationHours)) * 1000;
      return { value, unit: "L/day", secondaryValue, secondaryUnit: "mL/min", formula: `일일: ((${values.pac.capacity || 0} × ${values.pac.dose || 0}) ÷ ${values.pac.specificGravity || 0}) × 10⁻³  |  분당: ${pretty(value)} ÷ (60 × ${values.pac.operationHours || 0}) × 1,000`, detail: "PAC 일일 필요량 및 실제 가동시간 기준 분당 투입량" };
    }
    if (active === "polymer") {
      const value = n(values.polymer.capacity) * n(values.polymer.dose) * 1e-3;
      const secondaryValue = value / (n(values.polymer.dissolution) / 100);
      const tertiaryValue = secondaryValue / 1440 * 1000;
      return { value, unit: "kg/day", secondaryValue, secondaryUnit: "L/day", tertiaryValue, tertiaryUnit: "mL/min", formula: `고상: ${values.polymer.capacity || 0} × ${values.polymer.dose || 0} × 10⁻³  |  용해액: ${pretty(value)} ÷ (${values.polymer.dissolution || 0} ÷ 100)  |  분당: ${pretty(secondaryValue)} ÷ 1,440 × 1,000`, detail: "24시간 가동 및 용해액 밀도 1 kg/L 기준" };
    }
    if (active === "mixing") {
      const current = values.mixing[values.mixing.mode];
      const volume = n(current.length) * n(current.width) * n(current.height);
      const value = volume / (n(current.capacity) / 1440);
      const type = values.mixing.mode === "rapid" ? "급속" : "완속";
      return { value, unit: "min", formula: `(${current.length || 0} × ${current.width || 0} × ${current.height || 0}) ÷ (${current.capacity || 0} ÷ 1,440)`, detail: `${type} · 계산 용적 ${pretty(volume)} m³` };
    }
    if (active === "coagulant") {
      const alDose = (n(values.coagulant.influentTP) - n(values.coagulant.targetTP)) * n(values.coagulant.molarRatio) * (27 / 31);
      const value = alDose * (102 / 54) / (n(values.coagulant.chemicalConcentration) / 100);
      const secondaryValue = value / 1440 / n(values.coagulant.specificGravity) * n(values.coagulant.capacity);
      const tertiaryValue = secondaryValue * 1440 / 1000;
      return { value, unit: "mg/L(ppm)", secondaryValue, secondaryUnit: "mL/min", tertiaryValue, tertiaryUnit: "L/day", formula: `Al: (${values.coagulant.influentTP || 0} − ${values.coagulant.targetTP || 0}) × ${values.coagulant.molarRatio || 0} × (27 ÷ 31)  |  약품: ${pretty(alDose)} × (102 ÷ 54) ÷ (${values.coagulant.chemicalConcentration || 0} ÷ 100)  |  분당: ${pretty(value)} ÷ 1,440 ÷ ${values.coagulant.specificGravity || 0} × ${values.coagulant.capacity || 0}  |  일사용: ${pretty(secondaryValue)} × 1,440 ÷ 1,000`, detail: `중간 계산 Al 주입량 ${pretty(alDose)} mg/L` };
    }
    return { value: NaN, unit: "", formula: "", detail: "계산 항목을 선택해 주세요." };
  }, [active, values]);

  const invalid = !Number.isFinite(result.value) || result.value < 0;
  const isHydraulic = ["flow", "depth", "orifice", "vnotch", "diameter"].includes(active);
  const isChemical = ["pac", "polymer"].includes(active);
  const resultLabels = { flow: "시설용량", depth: "월류수심", orifice: "손실", vnotch: "월류수심", diameter: "구경", pac: values.pac.mode === "ppm" ? "ppm" : "PAC 투입량 결과", polymer: "폴리머 투입량 결과", mixing: "체류시간", coagulant: "무기응집제 투입량 결과" };
  const resetActive = () => {
    if (active === "mixing") {
      setValues((prev) => ({
        ...prev,
        mixing: {
          ...prev.mixing,
          [prev.mixing.mode]: { capacity: "", length: "", width: "", height: "" },
        },
      }));
      return;
    }
    if (!emptyValues[active]) return;
    setValues((prev) => ({ ...prev, [active]: { ...emptyValues[active] } }));
  };
  const copyResult = async () => {
    const text = active === "coagulant"
      ? `약품투입량: ${pretty(result.value)} ${result.unit}\n분당투입량: ${pretty(result.secondaryValue)} ${result.secondaryUnit}\n일사용량: ${pretty(result.tertiaryValue)} ${result.tertiaryUnit}`
      : result.tertiaryValue !== undefined
      ? `고상: ${pretty(result.value)} ${result.unit}\n용해액 사용: ${pretty(result.secondaryValue)} ${result.secondaryUnit}\n분당 투입량: ${pretty(result.tertiaryValue)} ${result.tertiaryUnit}`
      : result.secondaryValue !== undefined
      ? `일일 필요량: ${pretty(result.value)} ${result.unit}\n분당 투입량: ${pretty(result.secondaryValue)} ${result.secondaryUnit}`
      : `${pretty(result.value)} ${result.unit}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <main>
      <header>
        <a className="brand" href="#" aria-label="유천엔바이로 홈" onClick={(event) => { event.preventDefault(); setActive(null); setNavOpen(false); }}>
          <img src="/yucheon-enviro-logo.png" alt="유천엔바이로 YUCHEON ENVIRO" />
        </a>
      </header>

      <section className="hero simple-hero"><h1>유천엔바이로 계산식</h1></section>

      {active === null ? (
        <section className="home-screen" aria-labelledby="home-title">
          <div className="home-copy">
            <span className="home-kicker">YU CHEON ENVIRO · CALCULATORS</span>
            <h2 id="home-title">계산 항목을 선택하세요</h2>
            <p>필요한 대분류를 선택하면 세부 계산 항목으로 이동합니다.</p>
          </div>
          <div className="category-grid">
            {navTools.map((tool, index) => (
              <button
                key={tool.id}
                className="category-card"
                onClick={() => openCategory(tool.id)}
              >
                <span className="category-number">0{index + 1}</span>
                <span className="category-label">{tool.label}</span>
                <span className="category-description">{categoryDescriptions[tool.id]}</span>
                <span className="category-arrow">↗</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
      <section className={`workspace ${navOpen ? "nav-open" : "nav-closed"}`}>
        <button className="menu-toggle" onClick={() => setNavOpen((open) => !open)} aria-expanded={navOpen} aria-label={navOpen ? "대분류 메뉴 닫기" : "대분류 메뉴 열기"}>{navOpen ? "×" : "☰"}</button>
        <nav className="tool-nav" aria-label="계산 도구">
          <p>CALCULATORS <span>04</span></p>
          {navTools.map((tool, index) => (
            <button key={tool.id} className={(tool.id === "hydraulic" && isHydraulic) || (tool.id === "chemical" && isChemical) || active === tool.id ? "active" : ""} onClick={() => setActive(tool.id === "hydraulic" ? "flow" : tool.id === "chemical" ? "pac" : tool.id)}>
              <span className="tool-index">0{index + 1}</span>
              <span className="tool-copy"><b>{tool.label}</b></span>
              <span className="arrow">↗</span>
            </button>
          ))}
          <div className="nav-note"><span>i</span><p>계산 결과는 설계 및 운전 검토를 위한 참고값입니다.</p></div>
        </nav>

        <div className="calculator">
          <div className="calc-head">
            <div>
              <span className="calc-kicker">0{navTools.findIndex((t) => t.id === (isHydraulic ? "hydraulic" : isChemical ? "chemical" : active)) + 1} / 04</span>
              <h2>{isHydraulic ? "수리계산" : isChemical ? "약품투입량" : tools.find((t) => t.id === active).label}</h2>
            </div>
            <button className="reset" onClick={resetActive}>↻ 입력 초기화</button>
          </div>

          <div className="fields animated-panel" key={`fields-${active}`}>
            {isHydraulic && <div className="sub-picker">
              <button className={active === "depth" ? "active" : ""} onClick={() => setActive("depth")}>월류수심<small>시설용량·웨어길이 → 월류수심</small></button>
              <button className={active === "flow" ? "active" : ""} onClick={() => setActive("flow")}>시설용량(평웨어)<small>웨어길이·월류수심 → 시설용량</small></button>
              <button className={active === "orifice" ? "active" : ""} onClick={() => setActive("orifice")}>오리피스<small>타공부 수두 손실</small></button>
              <button className={active === "vnotch" ? "active" : ""} onClick={() => setActive("vnotch")}>V-노치<small>노치 월류수심</small></button>
              <button className={active === "diameter" ? "active" : ""} onClick={() => setActive("diameter")}>필요구경<small>유속·시설용량 → 구경</small></button>
            </div>}
            {isChemical && <div className="sub-picker">
              <button className={active === "pac" ? "active" : ""} onClick={() => setActive("pac")}>PAC 투입량</button>
              <button className={active === "polymer" ? "active" : ""} onClick={() => setActive("polymer")}>폴리머 투입량</button>
            </div>}
            {active === "flow" && <>
              <Field label="월류수심" value={values.flow.overflowDepth} onChange={(v) => set("flow", "overflowDepth", v)} unit="mm" />
              <Field label="웨어길이" value={values.flow.weirLength} onChange={(v) => set("flow", "weirLength", v)} unit="m" />
            </>}
            {active === "depth" && <>
              <Field label="시설용량" value={values.depth.capacity} onChange={(v) => set("depth", "capacity", v)} unit="m³/day" />
              <Field label="웨어길이" value={values.depth.weirLength} onChange={(v) => set("depth", "weirLength", v)} unit="m" />
            </>}
            {active === "orifice" && <>
              <Field label="시설용량" value={values.orifice.capacity} onChange={(v) => set("orifice", "capacity", v)} unit="m³/day" />
              <label className="field"><span className="field-label">타공유형</span><select value={values.orifice.type} onChange={(e) => set("orifice", "type", e.target.value)}><option value="rect">사각</option><option value="circle">원형</option></select></label>
              <Field label="폭 or 직경" value={values.orifice.width} onChange={(v) => set("orifice", "width", v)} unit="m" />
              {values.orifice.type === "rect" && <Field label="높이" value={values.orifice.height} onChange={(v) => set("orifice", "height", v)} unit="m" />}
              <Field label="유량계수" value={values.orifice.coefficient} onChange={(v) => set("orifice", "coefficient", v)} unit="" />
            </>}
            {active === "vnotch" && <>
              <Field label="시설용량" value={values.vnotch.capacity} onChange={(v) => set("vnotch", "capacity", v)} unit="m³/day" />
              <label className="field"><span className="field-label">유량계수</span><div className="input-wrap"><input value={n(values.vnotch.capacity) <= 100 ? "0.392" : n(values.vnotch.capacity) <= 150 ? "0.593" : n(values.vnotch.capacity) <= 200 ? "0.813" : "1.42"} readOnly /><span>자동</span></div><small>시설용량 구간에 따라 자동 적용</small></label>
              <Field label="노치수량" value={values.vnotch.notchCount} onChange={(v) => set("vnotch", "notchCount", v)} unit="개" />
            </>}
            {active === "diameter" && <>
              <Field label="유속" value={values.diameter.velocity} onChange={(v) => set("diameter", "velocity", v)} unit="m/s" />
              <Field label="시설용량" value={values.diameter.capacity} onChange={(v) => set("diameter", "capacity", v)} unit="m³/day" />
            </>}
            {active === "pac" && <>
              <div className="mode-switch"><button className={values.pac.mode === "minute" ? "active" : ""} onClick={() => set("pac", "mode", "minute")}>분당투입량(mL/min)</button><span>⇋</span><button className={values.pac.mode === "ppm" ? "active" : ""} onClick={() => set("pac", "mode", "ppm")}>ppm</button></div>
              <Field label="시설용량" value={values.pac.capacity} onChange={(v) => set("pac", "capacity", v)} unit="m³/day" />
              {values.pac.mode === "ppm"
                ? <>
                  <Field label="분당 투입량" value={values.pac.minuteDose} onChange={(v) => set("pac", "minuteDose", v)} unit="mL/min" />
                  <Field label="비중" value={values.pac.specificGravity} onChange={(v) => set("pac", "specificGravity", v)} unit="" />
                </>
                : <>
                  <Field label="투입량" value={values.pac.dose} onChange={(v) => set("pac", "dose", v)} unit="mg/L(ppm)" />
                  <Field label="비중" value={values.pac.specificGravity} onChange={(v) => set("pac", "specificGravity", v)} unit="" />
                  <Field label="가동시간" value={values.pac.operationHours} onChange={(v) => set("pac", "operationHours", v)} unit="hr/day" />
                </>}
            </>}
            {active === "polymer" && <>
              <Field label="시설용량" value={values.polymer.capacity} onChange={(v) => set("polymer", "capacity", v)} unit="m³/day" />
              <Field label="투입량" value={values.polymer.dose} onChange={(v) => set("polymer", "dose", v)} unit="mg/L(ppm)" />
              <Field label="용해농도" value={values.polymer.dissolution} onChange={(v) => set("polymer", "dissolution", v)} unit="%" />
            </>}
            {active === "mixing" && <>
              <div className="mode-switch"><button className={values.mixing.mode === "rapid" ? "active" : ""} onClick={() => set("mixing", "mode", "rapid")}>급속</button><span>⇋</span><button className={values.mixing.mode === "slow" ? "active" : ""} onClick={() => set("mixing", "mode", "slow")}>완속</button></div>
              <Field label="시설용량" value={values.mixing[values.mixing.mode].capacity} onChange={(v) => setMixing("capacity", v)} unit="m³/day" />
              <Field label="가로" value={values.mixing[values.mixing.mode].length} onChange={(v) => setMixing("length", v)} unit="m" />
              <Field label="세로" value={values.mixing[values.mixing.mode].width} onChange={(v) => setMixing("width", v)} unit="m" />
              <Field label="높이" value={values.mixing[values.mixing.mode].height} onChange={(v) => setMixing("height", v)} unit="m" />
              <label className="field"><span className="field-label">용적</span><div className="input-wrap"><input value={pretty(n(values.mixing[values.mixing.mode].length) * n(values.mixing[values.mixing.mode].width) * n(values.mixing[values.mixing.mode].height))} readOnly /><span>m³</span></div><small>가로 × 세로 × 높이</small></label>
            </>}
            {active === "coagulant" && <>
              <Field label="시설용량(유량)" value={values.coagulant.capacity} onChange={(v) => set("coagulant", "capacity", v)} unit="m³/day" />
              <Field label="유입 T-P 농도" value={values.coagulant.influentTP} onChange={(v) => set("coagulant", "influentTP", v)} unit="mg/L" />
              <Field label="목표 T-P 농도" value={values.coagulant.targetTP} onChange={(v) => set("coagulant", "targetTP", v)} unit="mg/L" />
              <Field label="약품 농도" value={values.coagulant.chemicalConcentration} onChange={(v) => set("coagulant", "chemicalConcentration", v)} unit="%" />
              <Field label="비중" value={values.coagulant.specificGravity} onChange={(v) => set("coagulant", "specificGravity", v)} unit="" />
              <Field label="투입율(mol비)" value={values.coagulant.molarRatio} onChange={(v) => set("coagulant", "molarRatio", v)} unit="" />
            </>}
          </div>

          <div className={`result animated-panel ${invalid ? "invalid" : ""}`} key={`result-${active}`}>
            <div className="result-top"><span className="result-label">{resultLabels[active] || "계산 결과"}</span></div>
            {active === "coagulant"
              ? <div className="result-number dual"><div><b>약품투입량</b>{pretty(result.value)} <small>{result.unit}</small></div><div><b>분당투입량</b>{pretty(result.secondaryValue)} <small>{result.secondaryUnit}</small></div><div><b>일사용량</b>{pretty(result.tertiaryValue)} <small>{result.tertiaryUnit}</small></div></div>
              : result.tertiaryValue !== undefined
              ? <div className="result-number dual"><div><b>고상</b>{pretty(result.value)} <small>{result.unit}</small></div><div><b>용해액 사용</b>{pretty(result.secondaryValue)} <small>{result.secondaryUnit}</small></div><div><b>분당 투입량</b>{pretty(result.tertiaryValue)} <small>{result.tertiaryUnit}</small></div></div>
              : result.secondaryValue !== undefined
              ? <div className="result-number dual"><div><b>일일 필요량</b>{pretty(result.value)} <small>{result.unit}</small></div><div><b>분당 투입량</b>{pretty(result.secondaryValue)} <small>{result.secondaryUnit}</small></div></div>
              : <div className="result-number">{invalid ? "입력 확인" : pretty(result.value)} <small>{invalid ? "" : result.unit}</small></div>}
            <div className="formula"><span>계산식</span><code>{result.formula}</code></div>
            <p>{invalid ? "0보다 큰 유효한 값을 입력해 주세요." : result.detail}</p>
            <button className="copy" onClick={copyResult} disabled={invalid}>{copied ? "✓ 복사됨" : "결과 복사"}</button>
          </div>
        </div>
      </section>
      )}

      <footer>
        <span>유천엔바이로 계산식</span>
        <p>단위와 입력 조건을 반드시 재확인하세요. 실제 설계·약품 투입 전에는 공인 기준 및 담당 기술자의 검토가 필요합니다.</p>
        <span>v1.0 · 2026</span>
      </footer>
    </main>
  );
}
