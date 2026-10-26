import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AlertTriangle, CheckCircle2, FileText, HelpCircle, Search, Upload } from "lucide-react"
import {
  getBonos, guardarCondicion, subirLista,
  type BonoNv, type BonosRespuesta, type ListaPrecio, type Revision,
} from "../services/contabilidadApi"
import type { UserScope } from "../types"
import "./Contabilidad.css"

type Tab = "resumen" | "bonos" | "listas"
const TABS: { id: Tab; label: string }[] = [
  { id: "resumen", label: "Resumen" },
  { id: "bonos", label: "Bonos por NV" },
  { id: "listas", label: "Listas de precio" },
]

const REVISION: Record<Revision, { label: string; hint: string }> = {
  CALCULADO: { label: "Calculado", hint: "Con SCF y retoma conocidos." },
  SOLO_MARCA: { label: "Solo bono marca", hint: "Falta saber si financió con SCF o tuvo retoma." },
  MODELO_POR_CONFIRMAR: { label: "Modelo por confirmar", hint: "El modelo de SIGA no calza exacto con la lista." },
  SIN_MODELO: { label: "Sin modelo en la lista", hint: "No se encontró el modelo en la lista vigente." },
}

const pesos = (n: number) => `$${Math.round(n).toLocaleString("es-CL")}`
const millones = (n: number) => `$${(n / 1_000_000).toLocaleString("es-CL", { maximumFractionDigits: 1 })} MM`
const fecha = (iso?: string | null) => (iso ? new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${iso.slice(0, 10)}T12:00:00`)) : "—")
const fechaHora = (iso?: string | null) => (iso ? new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso)) : "—")

// Interfaz "Contabilidad": bonos por cobrar a la marca por NV, calculados desde la lista de precios en PDF.
export default function Contabilidad({ currentUser }: { currentUser: UserScope }) {
  const [params, setParams] = useSearchParams()
  const tab = (TABS.find((t) => t.id === params.get("tab"))?.id ?? "resumen") as Tab
  const [data, setData] = useState<BonosRespuesta | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(() => {
    setError("")
    return getBonos().then(setData).catch((err) => setError(err instanceof Error ? err.message : "No fue posible cargar Contabilidad."))
  }, [])
  useEffect(() => { void load() }, [load])

  const totales = useMemo(() => {
    const marcas = data?.marcas ?? []
    return {
      nv: marcas.reduce((s, m) => s + m.totales.nv, 0),
      bruto: marcas.reduce((s, m) => s + m.totales.bruto, 0),
      sinLista: marcas.reduce((s, m) => s + m.totales.sinLista, 0),
      porRevision: marcas.reduce<Partial<Record<Revision, number>>>((acc, m) => {
        for (const [k, v] of Object.entries(m.totales.porRevision)) acc[k as Revision] = (acc[k as Revision] ?? 0) + (v ?? 0)
        return acc
      }, {}),
    }
  }, [data])

  const firstName = currentUser.name.split(" ")[0] || currentUser.name

  return (
    <div className="conta-page">
      <header className="conta-hello">
        <h1>Hola, {firstName}</h1>
        <p>Bonos por cobrar a las marcas, calculados NV por NV desde la lista de precios vigente.</p>
      </header>

      <nav className="conta-tabs" aria-label="Secciones de Contabilidad">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? "active" : ""} aria-current={tab === t.id ? "page" : undefined}
            onClick={() => setParams(t.id === "resumen" ? {} : { tab: t.id })}>{t.label}</button>
        ))}
      </nav>

      {error && <div className="conta-alert error"><AlertTriangle size={18} /> {error}</div>}
      {!data && !error && <div className="conta-card conta-muted">Cargando…</div>}

      {data && tab === "resumen" && <Resumen data={data} totales={totales} onGo={(t) => setParams({ tab: t })} />}
      {data && tab === "bonos" && <Bonos data={data} onChanged={load} />}
      {data && tab === "listas" && <Listas listas={data.listas} onUploaded={load} />}
    </div>
  )
}

/* ---------------- Resumen ---------------- */
function Resumen({ data, totales, onGo }: {
  data: BonosRespuesta
  totales: { nv: number; bruto: number; sinLista: number; porRevision: Partial<Record<Revision, number>> }
  onGo: (tab: Tab) => void
}) {
  if (!data.listas.length) {
    return (
      <section className="conta-card conta-empty">
        <FileText size={30} />
        <h2>Carga la primera lista de precios</h2>
        <p>Con el PDF de la marca, cada NV vendida en su vigencia recibe su bono calculado.</p>
        <button type="button" className="conta-btn" onClick={() => onGo("listas")}><Upload size={18} /> Cargar PDF</button>
      </section>
    )
  }
  const pendientes = (totales.porRevision.SOLO_MARCA ?? 0) + (totales.porRevision.MODELO_POR_CONFIRMAR ?? 0) + (totales.porRevision.SIN_MODELO ?? 0)
  return (
    <>
      <section className="conta-card conta-hero">
        <div>
          <span className="conta-eyebrow">BONOS POR COBRAR</span>
          <strong className="conta-big">{pesos(totales.bruto)}</strong>
          <p>Bruto, con IVA · {totales.nv} NV con bono calculado</p>
        </div>
        <div className="conta-hero-side">
          {data.marcas.map((m) => (
            <div key={m.marca} className="conta-brand-row">
              <span>{m.marca}</span>
              <strong>{millones(m.totales.bruto)}</strong>
              <small>{m.totales.nv} NV</small>
            </div>
          ))}
        </div>
      </section>

      <section className="conta-grid">
        <Kpi tone="ok" label="Calculado completo" value={totales.porRevision.CALCULADO ?? 0} hint={REVISION.CALCULADO.hint} />
        <Kpi tone="warn" label="Por completar" value={pendientes} hint="Falta SCF o retoma, o confirmar el modelo." onClick={() => onGo("bonos")} />
        <Kpi tone="neutral" label="NV sin lista vigente" value={totales.sinLista} hint="Vendidas en meses sin PDF cargado." onClick={() => onGo("listas")} />
      </section>

      <p className="conta-foot">
        Fuente de NV: SIGA cargado en Gestión › Datos{data.siga.actualizado ? ` (actualizado ${fechaHora(data.siga.actualizado)})` : ""}.
        La comparación con la bonificación de SIGA se agrega cuando confirmemos sus columnas.
      </p>
    </>
  )
}

function Kpi({ tone, label, value, hint, onClick }: { tone: "ok" | "warn" | "neutral"; label: string; value: number; hint: string; onClick?: () => void }) {
  const body = (<><span>{label}</span><strong>{value.toLocaleString("es-CL")}</strong><small>{hint}</small></>)
  return onClick
    ? <button type="button" className={`conta-card conta-kpi ${tone}`} onClick={onClick}>{body}</button>
    : <div className={`conta-card conta-kpi ${tone}`}>{body}</div>
}

/* ---------------- Bonos por NV ---------------- */
function Bonos({ data, onChanged }: { data: BonosRespuesta; onChanged: () => Promise<void> }) {
  const [filtro, setFiltro] = useState<Revision | "TODAS">("TODAS")
  const [buscar, setBuscar] = useState("")
  const [guardando, setGuardando] = useState("")
  const [mensaje, setMensaje] = useState("")
  const filas = useMemo(() => data.marcas.flatMap((m) => m.filas.map((f) => ({ ...f, marca: m.marca }))), [data])
  const q = buscar.trim().toLowerCase()
  const visibles = filas.filter((f) => (filtro === "TODAS" || f.revision === filtro) &&
    (!q || f.nv.includes(q) || f.modeloSistema.toLowerCase().includes(q) || f.local.toLowerCase().includes(q) || f.factura.toLowerCase().includes(q)))
  const conteo = (r: Revision) => filas.filter((f) => f.revision === r).length

  async function cambiar(f: BonoNv, campo: "financiaScf" | "tieneRetoma", valor: boolean | null) {
    setGuardando(`${f.nv}-${campo}`)
    setMensaje("")
    try {
      // Se guardan ambos campos para no perder el otro al cambiar uno.
      await guardarCondicion(f.nv, { financiaScf: f.financiaScf, tieneRetoma: f.tieneRetoma, [campo]: valor })
      await onChanged()
      setMensaje(`NV ${f.nv} actualizada.`)
    } catch (err) {
      setMensaje(err instanceof Error ? err.message : "No fue posible guardar.")
    } finally {
      setGuardando("")
    }
  }

  if (!filas.length) return <section className="conta-card conta-muted">Aún no hay NV con bono calculado. Revisa que SIGA esté cargado y que exista una lista vigente.</section>

  return (
    <section className="conta-card">
      <div className="conta-toolbar">
        <div className="conta-chips" role="group" aria-label="Filtrar por revisión">
          <button type="button" className={filtro === "TODAS" ? "active" : ""} onClick={() => setFiltro("TODAS")}>Todas · {filas.length}</button>
          {(Object.keys(REVISION) as Revision[]).filter((r) => conteo(r)).map((r) => (
            <button key={r} type="button" title={REVISION[r].hint} className={filtro === r ? "active" : ""} onClick={() => setFiltro(r)}>{REVISION[r].label} · {conteo(r)}</button>
          ))}
        </div>
        <label className="conta-search">
          <Search size={16} />
          <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar NV, modelo, local o factura" />
        </label>
      </div>
      {mensaje && <p className="conta-msg">{mensaje}</p>}

      <div className="conta-table-wrap">
        <table className="conta-table">
          <thead>
            <tr>
              <th>NV</th><th>Factura</th><th>Modelo</th><th>SCF</th><th>Retoma</th>
              <th className="num">Marca</th><th className="num">SCF</th><th className="num">VPP</th><th className="num">Por cobrar</th><th>Revisión</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((f) => (
              <tr key={`${f.marca}-${f.nv}`}>
                <td><strong>{f.nv}</strong><small>{f.local}</small></td>
                <td className="conta-nowrap">{f.factura || "—"}<small>{fecha(f.fecha)}</small></td>
                <td className="conta-model">{f.modeloSistema}{f.modeloLista && f.modeloLista !== f.modeloSistema && <small>Lista: {f.modeloLista}</small>}</td>
                <td><TriState value={f.financiaScf} busy={guardando === `${f.nv}-financiaScf`} onChange={(v) => void cambiar(f, "financiaScf", v)} label={`SCF NV ${f.nv}`} /></td>
                <td><TriState value={f.tieneRetoma} busy={guardando === `${f.nv}-tieneRetoma`} onChange={(v) => void cambiar(f, "tieneRetoma", v)} label={`Retoma NV ${f.nv}`} /></td>
                <td className="num">{f.bono ? pesos(f.bono.marca) : "—"}</td>
                <td className="num">{f.bono ? pesos(f.bono.scf) : "—"}</td>
                <td className="num">{f.bono ? pesos(f.bono.vpp) : "—"}</td>
                <td className="num"><strong>{f.bono ? pesos(f.bono.bruto) : "—"}</strong></td>
                <td><span className={`conta-tag ${f.revision.toLowerCase()}`} title={REVISION[f.revision].hint}>{REVISION[f.revision].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="conta-foot">Montos de Marca, SCF y VPP en neto; "Por cobrar" en bruto con IVA, redondeado a la centena.</p>
    </section>
  )
}

// Sí / No / No se sabe: lo que Contabilidad confirma por cada NV.
function TriState({ value, onChange, busy, label }: { value: boolean | null; onChange: (v: boolean | null) => void; busy: boolean; label: string }) {
  return (
    <div className={`conta-tri ${busy ? "busy" : ""}`} role="group" aria-label={label}>
      <button type="button" className={value === true ? "active yes" : ""} onClick={() => onChange(true)} disabled={busy}>Sí</button>
      <button type="button" className={value === false ? "active no" : ""} onClick={() => onChange(false)} disabled={busy}>No</button>
      <button type="button" className={value === null ? "active unk" : ""} onClick={() => onChange(null)} disabled={busy} aria-label="No se sabe"><HelpCircle size={14} /></button>
    </div>
  )
}

/* ---------------- Listas de precio ---------------- */
function Listas({ listas, onUploaded }: { listas: ListaPrecio[]; onUploaded: () => Promise<void> }) {
  const input = useRef<HTMLInputElement>(null)
  const [subiendo, setSubiendo] = useState(false)
  const [mensaje, setMensaje] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null)

  async function subir(file?: File) {
    if (!file) return
    setSubiendo(true)
    setMensaje(null)
    try {
      const r = await subirLista(file)
      setMensaje({ tipo: "ok", texto: r.message })
      await onUploaded()
    } catch (err) {
      setMensaje({ tipo: "error", texto: err instanceof Error ? err.message : "No fue posible cargar el PDF." })
    } finally {
      setSubiendo(false)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <>
      <section className="conta-card conta-upload">
        <div>
          <h2>Cargar lista de precios</h2>
          <p>PDF de la marca con precios y bonos. Cada PDF se carga una sola vez: si lo vuelves a subir, no se duplica.</p>
          <small>Hoy se lee el formato de Chery. Los PDF de otras marcas quedan guardados para revisar.</small>
        </div>
        <input ref={input} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => void subir(e.target.files?.[0])} />
        <button type="button" className="conta-btn" disabled={subiendo} onClick={() => input.current?.click()}>
          <Upload size={18} /> {subiendo ? "Leyendo PDF…" : "Elegir PDF"}
        </button>
      </section>
      {mensaje && <div className={`conta-alert ${mensaje.tipo}`}>{mensaje.tipo === "ok" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {mensaje.texto}</div>}

      {listas.length > 0 && (
        <section className="conta-card">
          <h2>Listas cargadas</h2>
          <ul className="conta-lists">
            {listas.map((l) => (
              <li key={l.sha}>
                <FileText size={20} />
                <div>
                  <strong>{l.titulo || l.archivo}</strong>
                  <small>{l.marca || "Marca sin reconocer"}{l.canal ? ` · Canal ${l.canal}` : ""} · vigencia {fecha(l.desde)} al {fecha(l.hasta)} · {l.filas} modelos</small>
                  <small>Cargado por {l.cargadoPor} · {fechaHora(l.cargadoEn)}</small>
                  {l.avisos.map((a) => <small key={a} className="conta-note">{a}</small>)}
                  {l.observaciones.slice(0, 3).map((o) => <small key={o} className="conta-note warn">{o}</small>)}
                </div>
                <span className={`conta-tag ${l.estado === "OK" ? "calculado" : "sin_modelo"}`}>{l.estado === "OK" ? "Leído" : "Revisar"}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}
