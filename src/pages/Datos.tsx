import { useEffect, useRef, useState } from "react"
import { Database, ExternalLink, FileSpreadsheet, FolderOpen, Tags, Trash2, Upload } from "lucide-react"
import SignalLight from "../components/SignalLight"
import { getDatosEstado, uploadAndProcess, type DataKind, type DataSource, type ImportLogEntry } from "../services/datosApi"
import { fmtDate } from "../services/seguimientoApi"
import {
  DEFAULT_BRANDS,
  getAcademyResources,
  getModelCatalog,
  removeModelBrand,
  saveAcademyResources,
  type ModelBrand,
} from "../services/catalogoApi"
import "./Seguimiento.css"

// Descripción de cada planilla, según los archivos reales recibidos (08-10-2026).
const SOURCE_INFO: Record<DataKind, { uso: string; formato: string }> = {
  siga: {
    uso: "Notas de venta: compra confirmada, cliente, teléfono, ejecutivo, factura y recepción.",
    formato: "Exportación SIGA (.xlsx) con N°, Fecha, Marca, Modelo, Chassis, Local, Vendedor, Cliente, R.U.T., Teléfono, Fecha Factura, Fecha Recepción.",
  },
  control: {
    uso: "Control de unidades nuevo (SharePoint): VIN asignado y llegada pronosticada → “En camino”.",
    formato: "CSV o Excel con ESTADO (NV), FECHADEASIGNACIÓN, FECHA LLEGADA, VIN, DESTINO.",
  },
  traslados: {
    uso: "Planilla T del día: llegada de la unidad al local de venta → “Recibido y en preparación”.",
    formato: "Excel con NV, FECHA TRASLADO, VIN, RETIRO, DESTINO.",
  },
  consolidado: {
    uso: "Historial de contactos ya realizados, para no repetir etapas.",
    formato: "Consolidado de clientes contactados (Cliente, RUT, Teléfono, NV contactada(s), Historial por etapa).",
  },
  operativo: {
    uso: "Historial del Excel operativo de seguimiento (estados de envío y teléfonos sin WhatsApp).",
    formato: "Seguimiento clientes OPERATIVO, hoja “Enviar a clientes”.",
  },
}

const IN_CONSTRUCTION = [
  { title: "Extranet · Gespark", text: "Listado de salidas de la extranet para el cierre Gespark. Se activa en la próxima entrega." },
  { title: "Frogmi", text: "Exportación de formularios Frogmi e informe de notificación de venta. Se activa en la próxima entrega." },
  { title: "Encuestas", text: "Reportes de encuestas Astara y Stellantis (NPS, SSI, bonificación)." },
]

export default function Datos() {
  const [fuentes, setFuentes] = useState<DataSource[]>([])
  const [log, setLog] = useState<ImportLogEntry[]>([])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  async function load() {
    try {
      const data = await getDatosEstado()
      setFuentes(data.fuentes)
      setLog(data.log)
      setError("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible leer el estado de los datos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])

  return (
    <div className="seg-page">
      <header className="seg-head">
        <div>
          <span className="eyebrow">DATOS</span>
          <h1>Planillas de origen</h1>
          <p>
            Sube aquí las planillas tal como las descargas. La app quita duplicados y actualiza cada NV con la
            última lectura, sin perder la fecha en que apareció por primera vez.
          </p>
        </div>
      </header>

      {error && <div className="seg-error">{error}</div>}
      {loading && <div className="seg-empty">Cargando estado de las fuentes…</div>}

      <section className="seg-section">
        <h2>Solicitudes y Academia</h2>
        <div className="datos-grid">
          <PriceListCard onDone={load} />
          <ResourcesCard />
        </div>
      </section>

      <h2 className="datos-subtitle">Seguimiento de clientes</h2>
      <div className="datos-grid">
        {fuentes.map((fuente) => (
          <SourceCard key={fuente.kind} fuente={fuente} onDone={load} />
        ))}
        {IN_CONSTRUCTION.map((item) => (
          <article key={item.title} className="seg-card datos-card disabled">
            <div className="seg-chip"><SignalLight tone="neutral" compact /> En construcción</div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <section className="seg-section">
        <h2>Historial de cargas</h2>
        {log.length === 0 ? (
          <div className="seg-empty">Todavía no hay cargas registradas.</div>
        ) : (
          <div className="seg-table-wrap">
            <table className="seg-table">
              <thead>
                <tr><th>Fecha</th><th>Fuente</th><th>Archivo</th><th>Por</th><th>Resultado</th></tr>
              </thead>
              <tbody>
                {log.map((entry, index) => (
                  <tr key={`${entry.at}-${index}`}>
                    <td>{fmtDate(entry.at)}</td>
                    <td>{entry.label}</td>
                    <td>{entry.fileName}</td>
                    <td>{entry.byName || entry.by}</td>
                    <td>{entry.ok && entry.summary ? summaryText(entry) : <span style={{ color: "#ff9097" }}>{entry.error}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function summaryText(entry: ImportLogEntry) {
  const s = entry.summary!
  return `${s.nuevos} nuevos · ${s.actualizados} actualizados · ${s.duplicados} duplicados${s.errores ? ` · ${s.errores} con error` : ""}`
}

function SourceCard({ fuente, onDone }: { fuente: DataSource; onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<{ label: string; percent: number } | null>(null)
  const [result, setResult] = useState<ImportLogEntry | null>(null)
  const [error, setError] = useState("")
  const info = SOURCE_INFO[fuente.kind]
  const last = result || fuente.ultimaCarga
  const tone = last ? "green" : "neutral"

  async function handleFile(file?: File | null) {
    if (!file) return
    setError("")
    setResult(null)
    try {
      const entry = await uploadAndProcess(fuente.kind, file, (label, percent) => setProgress({ label, percent }))
      setResult(entry)
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar el archivo.")
    } finally {
      setProgress(null)
      if (input.current) input.current.value = ""
    }
  }

  return (
    <article className="seg-card datos-card">
      <div className="seg-chip"><SignalLight tone={tone} compact /> {last ? `Última carga: ${fmtDate(last.at)}` : "Sin cargas"}</div>
      <h3><FileSpreadsheet size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />{fuente.label}</h3>
      <p>{info.uso}</p>
      <div className="seg-meta">
        <Database size={13} style={{ verticalAlign: "-2px" }} /> {fuente.registros.toLocaleString("es-CL")} registros guardados
        {last && <><br />Archivo: {last.fileName} · {last.byName || last.by}</>}
        <span className="seg-fine-print">Formato: {info.formato}</span>
      </div>
      {last?.summary && (
        <div className="datos-summary">
          <span>{last.summary.leidos} leídos</span>
          <span>{last.summary.nuevos} nuevos</span>
          <span>{last.summary.actualizados} actualizados</span>
          <span>{last.summary.duplicados} duplicados</span>
          {last.summary.errores > 0 && <span>{last.summary.errores} con error</span>}
        </div>
      )}
      {progress && (
        <>
          <div className="datos-progress"><i style={{ width: `${progress.percent}%` }} /></div>
          <div className="seg-meta">{progress.label}</div>
        </>
      )}
      {error && <div className="seg-error" style={{ marginTop: 10 }}>{error}</div>}
      <label className="seg-btn primary" style={{ marginTop: 12, position: "relative" }}>
        <Upload size={16} /> {progress ? "Cargando…" : "Subir archivo"}
        <input
          ref={input}
          className="datos-file-input"
          type="file"
          accept=".xlsx,.xlsm,.csv"
          disabled={Boolean(progress)}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
    </article>
  )
}


// ======================================================
// LISTAS DE PRECIOS → modelos para las solicitudes
// ======================================================

function PriceListCard({ onDone }: { onDone: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const [catalog, setCatalog] = useState<ModelBrand[]>([])
  const [marca, setMarca] = useState("")
  const [otraMarca, setOtraMarca] = useState("")
  const [progress, setProgress] = useState<{ label: string; percent: number } | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [open, setOpen] = useState("")

  async function refresh() {
    setCatalog(await getModelCatalog(true))
  }
  useEffect(() => { void refresh() }, [])

  const brand = marca === "__OTRA__" ? otraMarca.trim() : marca

  async function handleFile(file?: File | null) {
    if (!file) return
    setError("")
    setMessage("")
    if (!brand) {
      setError("Primero elige la marca de la lista de precios.")
      if (input.current) input.current.value = ""
      return
    }
    try {
      const entry = await uploadAndProcess("precios", file, (label, percent) => setProgress({ label, percent }), { marca: brand })
      setMessage(`Lista de ${brand} cargada: ${(entry as ImportLogEntry & { modelos?: number }).modelos ?? ""} modelos.`)
      await refresh()
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible cargar la lista.")
    } finally {
      setProgress(null)
      if (input.current) input.current.value = ""
    }
  }

  async function remove(name: string) {
    if (!window.confirm(`¿Quitar la lista de ${name}? Sus modelos dejarán de aparecer en las solicitudes.`)) return
    await removeModelBrand(name)
    await refresh()
  }

  const total = catalog.reduce((sum, item) => sum + item.modelos.length, 0)

  return (
    <article className="seg-card datos-card">
      <div className="seg-chip"><SignalLight tone={catalog.length ? "green" : "neutral"} compact /> {catalog.length ? `${catalog.length} marcas · ${total} modelos` : "Sin listas"}</div>
      <h3><Tags size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />Listas de precios</h3>
      <p>Los modelos de cada lista aparecen para elegir en las solicitudes (eficiencia, seguridad, fichas). Siempre queda la opción “Otro”.</p>
      <div className="seg-meta">
        <span className="seg-fine-print">Formato: Excel (.xlsx) con los modelos en la <strong>primera columna</strong> de la primera hoja. Subir otra lista de la misma marca la reemplaza.</span>
      </div>
      <div className="datos-inline-form">
        <select className="seg-select" value={marca} onChange={(event) => setMarca(event.target.value)}>
          <option value="">Marca de la lista…</option>
          {DEFAULT_BRANDS.map((item) => <option key={item} value={item}>{item}</option>)}
          <option value="__OTRA__">Otra marca…</option>
        </select>
        {marca === "__OTRA__" && (
          <input className="seg-input" placeholder="Nombre de la marca" value={otraMarca} onChange={(event) => setOtraMarca(event.target.value)} />
        )}
      </div>
      {progress && (
        <>
          <div className="datos-progress"><i style={{ width: `${progress.percent}%` }} /></div>
          <div className="seg-meta">{progress.label}</div>
        </>
      )}
      {message && <div className="seg-meta" style={{ color: "#8fe3a6", marginTop: 8 }}>{message}</div>}
      {error && <div className="seg-error" style={{ marginTop: 10 }}>{error}</div>}
      <label className="seg-btn primary" style={{ marginTop: 12, position: "relative" }}>
        <Upload size={16} /> {progress ? "Cargando…" : "Subir lista de precios"}
        <input
          ref={input}
          className="datos-file-input"
          type="file"
          accept=".xlsx,.xlsm,.csv"
          disabled={Boolean(progress)}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
      </label>
      {catalog.length > 0 && (
        <div className="datos-brand-list">
          {catalog.map((item) => (
            <div key={item.marca} className="datos-brand">
              <button className="datos-brand-name" onClick={() => setOpen(open === item.marca ? "" : item.marca)}>
                <strong>{item.marca}</strong> · {item.modelos.length} modelos{item.at ? ` · ${fmtDate(item.at)}` : ""}
              </button>
              <button className="seg-btn small" title="Quitar lista" onClick={() => void remove(item.marca)}><Trash2 size={14} /></button>
              {open === item.marca && <div className="datos-brand-models">{item.modelos.join(" · ")}</div>}
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

// ======================================================
// RECURSOS DE ACADEMIA → enlace a la carpeta de SharePoint
// ======================================================

function ResourcesCard() {
  const [url, setUrl] = useState("")
  const [saved, setSaved] = useState("")
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getAcademyResources()
      .then((value) => { setUrl(value.carpetaUrl || ""); setSaved(value.carpetaUrl || "") })
      .catch(() => undefined)
  }, [])

  async function save() {
    setBusy(true)
    setError("")
    setMessage("")
    try {
      const result = await saveAcademyResources(url.trim())
      setSaved(result.carpetaUrl)
      setUrl(result.carpetaUrl)
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible guardar el enlace.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="seg-card datos-card">
      <div className="seg-chip"><SignalLight tone={saved ? "green" : "neutral"} compact /> {saved ? "Enlace configurado" : "Sin enlace"}</div>
      <h3><FolderOpen size={18} style={{ verticalAlign: "-3px", marginRight: 6 }} />Carpeta de Recursos (Academia)</h3>
      <p>Enlace a la carpeta de SharePoint que aparecerá como botón en los Recursos de Academia.</p>
      <div className="datos-inline-form">
        <input className="seg-input" placeholder="https://ditalcar.sharepoint.com/…" value={url} onChange={(event) => setUrl(event.target.value)} />
      </div>
      {message && <div className="seg-meta" style={{ color: "#8fe3a6", marginTop: 8 }}>{message}</div>}
      {error && <div className="seg-error" style={{ marginTop: 10 }}>{error}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button className="seg-btn primary" disabled={busy || url.trim() === saved} onClick={() => void save()}>Guardar enlace</button>
        {saved && (
          <a className="seg-btn" href={saved} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Probar enlace</a>
        )}
      </div>
    </article>
  )
}
