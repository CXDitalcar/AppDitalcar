import { useState } from "react"
import { CheckCircle2, ChevronRight, ArrowLeft, ShieldCheck, Sparkles } from "lucide-react"
import { consultaSteps, type ConsultaStep } from "../data/consulta"

export default function Academia() {
  const [selected, setSelected] = useState<ConsultaStep | null>(null)
  if (selected) {
    return (
      <>
        <button className="back-btn" onClick={() => setSelected(null)}><ArrowLeft size={17}/> Volver a CONSULTA</button>
        <section className="detail-hero">
          <div className="step-code">{selected.code}</div>
          <div><span className="eyebrow">MODELO CONSULTA</span><h1>{selected.title}</h1><p>{selected.subtitle}</p></div>
        </section>
        <div className="detail-grid">
          <article className="info-card"><Sparkles/><h3>Qué significa</h3><p>{selected.meaning}</p></article>
          <article className="info-card"><CheckCircle2/><h3>Qué hacer</h3><ul>{selected.actions.map(x => <li key={x}>{x}</li>)}</ul></article>
          <article className="info-card"><ShieldCheck/><h3>Qué evitar</h3><ul>{selected.avoid.map(x => <li key={x}>{x}</li>)}</ul></article>
          <article className="info-card"><h3>Ejemplo aplicado</h3><blockquote>{selected.example}</blockquote></article>
        </div>
      </>
    )
  }

  return (
    <>
      <div className="page-head">
        <span className="eyebrow">ACADEMIA DITALCAR</span>
        <h1>Modelo CONSULTA</h1>
        <p>8 comportamientos simples para una atención más consultiva, consistente y cercana.</p>
      </div>
      <div className="consulta-grid">
        {consultaSteps.map((s,idx) => (
          <button className="consulta-card" key={s.code} onClick={() => setSelected(s)}>
            <div className="consulta-top"><span>{s.code}</span><small>0{idx+1}</small></div>
            <h3>{s.title}</h3><p>{s.subtitle}</p>
            <div className="module-link">Ver módulo <ChevronRight size={16}/></div>
          </button>
        ))}
      </div>
    </>
  )
}
