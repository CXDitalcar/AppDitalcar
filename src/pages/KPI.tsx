import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Link2,
  RefreshCw,
  Save,
  Upload,
  XCircle,
} from "lucide-react"
import type { UserScope } from "../types"
import "./KPI.css"
import { hasExperienceAccess } from "../services/experienceAccess"

type KpiPeriod = { monthNumber: number; month: string; year: number }
type KpiSummary = {
  period: KpiPeriod
  notesSales: number
  newVehicleSales: number
  newVehicleValid: number
  newVehicleCancelled: number
  newVehicleOrdersBilled: number
  usedVehicleSales: number
  usedVehicleValid: number
  usedVehicleCancelled: number
  usedVehicleOrdersBilled: number
  validSalesTotal: number
  cancelledTotal: number
  ordersBilledTotal: number
  billingCurrentTotal: number
  billingCurrentNew: number
  billingCurrentUsed: number
  billingPreviousTotal: number
  billingPreviousNew: number
  billingPreviousUsed: number
  variationTotal: number
  variationNew: number
  variationUsed: number
  pendingInvoiceNew: number
  pendingInvoiceUsed: number
  goal: number | string
  compliance: number
  remaining: number
}
type KpiDetailRow = {
  row: number
  type: "summary" | "detail"
  brand: string
  local: string
  sales: number | string
  billed: number | string
  goal: number | string
  compliance: number
}
type KpiEvolutionPoint = { month: string; value: number }
type KpiData = {
  summary: KpiSummary
  detail: KpiDetailRow[]
  evolution: {
    total: KpiEvolutionPoint[]
    newVehicles: KpiEvolutionPoint[]
    usedVehicles: KpiEvolutionPoint[]
  }
  meta: {
    sourceUrl: string
    finalUrl?: string
    checkedAt: string
    lastModified?: string
    dashboardSheet: string
    graphsSheet: string
    fileName?: string
    sourceType?: "url" | "upload"
    uploadedAt?: string
  }
  stale?: boolean
  warning?: string
}

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Error ${response.status}`)
  return payload as T
}

type KpiSourceInfo = {
  configured: boolean
  url: string
  activeMode: "url" | "upload" | null
  uploadedFile?: { fileName: string; uploadedAt?: string | null; size?: number } | null
  lastSnapshotAt?: string | null
}

async function getKpiSource() {
  return apiJson<KpiSourceInfo>("/api/kpi/source")
}

async function saveKpiSource(url: string) {
  return apiJson<{ message: string; data: KpiData; activeMode: "url" }>("/api/kpi/source", {
    method: "POST",
    body: JSON.stringify({ url }),
  })
}

async function uploadKpiFile(file: File) {
  const response = await fetch("/api/kpi/upload", {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "x-file-name": encodeURIComponent(file.name),
    },
    body: file,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Error ${response.status}`)
  return payload as {
    message: string
    data: KpiData
    activeMode: "upload"
    uploadedFile: { fileName: string; uploadedAt?: string; size?: number }
  }
}

async function getKpiData() {
  return apiJson<KpiData>("/api/kpi/data")
}

function dateLabel(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}

function numberLabel(value: number | string) {
  if (typeof value === "string") return value || "—"
  return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(value)
}

function percentLabel(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value || 0)
}

export default function KPI({ currentUser }: { currentUser: UserScope }) {
  const experienceView = hasExperienceAccess(currentUser)
  const [url, setUrl] = useState("")
  const [data, setData] = useState<KpiData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [sourceInfo, setSourceInfo] = useState<KpiSourceInfo | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [brandFilter, setBrandFilter] = useState("TODAS")

  async function load() {
    setLoading(true)
    setError("")
    try {
      if (experienceView) {
        const source = await getKpiSource()
        setSourceInfo(source)
        setUrl(source.url || "")
      }
      const result = await getKpiData()
      setData(result)
    } catch (err) {
      setData(null)
      setError(err instanceof Error ? err.message : "No fue posible cargar KPI.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [experienceView])

  async function handleSave() {
    setSaving(true)
    setMessage("")
    setError("")
    try {
      const result = await saveKpiSource(url.trim())
      setData(result.data)
      setSourceInfo((previous) => ({
        configured: true,
        url: url.trim(),
        activeMode: "url",
        uploadedFile: previous?.uploadedFile || null,
        lastSnapshotAt: result.data.meta.checkedAt,
      }))
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible conectar el Excel KPI.")
    } finally {
      setSaving(false)
    }
  }


  async function handleUpload(file?: File) {
    if (!file) return
    setUploading(true)
    setMessage("")
    setError("")
    try {
      const result = await uploadKpiFile(file)
      setData(result.data)
      setSourceInfo((previous) => ({
        configured: true,
        url: previous?.url || url,
        activeMode: "upload",
        uploadedFile: result.uploadedFile,
        lastSnapshotAt: result.data.meta.checkedAt,
      }))
      setMessage(result.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible subir el archivo KPI.")
    } finally {
      setUploading(false)
    }
  }

  const brands = useMemo(() => {
    const result = new Set<string>()
    data?.detail.forEach((row) => {
      if (row.brand) result.add(row.brand)
    })
    return [...result]
  }, [data])

  const detail = useMemo(() => {
    if (!data) return []
    if (brandFilter === "TODAS") return data.detail
    return data.detail.filter((row) => row.brand === brandFilter)
  }, [data, brandFilter])

  return (
    <div className="kpi-page">
      <section className="kpi-head">
        <div>
          <span className="kpi-eyebrow">KPI COMERCIALES · EXCEL ONLINE</span>
          <h1>Resumen y detalle comercial</h1>
          <p>
            La app no recalcula indicadores: lee y muestra los resultados ya guardados en las hojas
            DASHBOARD y GRAFICOS del archivo conectado.
          </p>
        </div>
        <button className="kpi-refresh" type="button" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} /> {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </section>

      {experienceView && (
        <section className="kpi-source-card">
          <div className="kpi-source-title">
            <div className="kpi-source-icon"><FileSpreadsheet size={22} /></div>
            <div>
              <span className="kpi-eyebrow">SOLO TU PERFIL · EXPERIENCIA</span>
              <strong>Administrar fuente KPI</strong>
              <small>Elige la opción que te acomode. La última que uses queda como fuente activa.</small>
            </div>
            <div className={`kpi-source-state ${data ? "ok" : "pending"}`}>
              {data ? <CheckCircle2 size={15} /> : <Link2 size={15} />}
              {sourceInfo?.activeMode === "upload" ? "ARCHIVO ACTIVO" : sourceInfo?.activeMode === "url" ? "LINK ACTIVO" : "SIN CONEXIÓN"}
            </div>
          </div>

          <div className="kpi-source-options">
            <article className={`kpi-source-option ${sourceInfo?.activeMode === "upload" ? "active" : ""}`}>
              <div className="kpi-option-heading">
                <div className="kpi-option-number">1</div>
                <div>
                  <strong>Subir desde mi computador</strong>
                  <small>Recomendado mientras Graph sigue pendiente.</small>
                </div>
                {sourceInfo?.activeMode === "upload" && <b>FUENTE ACTIVA</b>}
              </div>
              <div className="kpi-upload-zone">
                <Upload size={21} />
                <div>
                  <strong>{uploading ? "Subiendo y validando…" : "Reemplazar archivo KPI"}</strong>
                  <span>Admite .xlsm y .xlsx · misma estructura DASHBOARD / GRAFICOS</span>
                </div>
                <label className={`kpi-upload-button ${uploading ? "disabled" : ""}`}>
                  {uploading ? "Procesando…" : "Seleccionar archivo"}
                  <input
                    type="file"
                    accept=".xlsm,.xlsx,application/vnd.ms-excel.sheet.macroEnabled.12,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    disabled={uploading}
                    onChange={(event) => {
                      const file = event.currentTarget.files?.[0]
                      void handleUpload(file)
                      event.currentTarget.value = ""
                    }}
                  />
                </label>
              </div>
              {sourceInfo?.uploadedFile && (
                <div className="kpi-option-meta">
                  <span>Último archivo</span>
                  <strong>{sourceInfo.uploadedFile.fileName}</strong>
                  <small>{sourceInfo.uploadedFile.uploadedAt ? `Subido ${dateLabel(sourceInfo.uploadedFile.uploadedAt)}` : "Guardado en Azure"}</small>
                </div>
              )}
            </article>

            <article className={`kpi-source-option ${sourceInfo?.activeMode === "url" ? "active" : ""}`}>
              <div className="kpi-option-heading">
                <div className="kpi-option-number">2</div>
                <div>
                  <strong>Usar enlace Excel Online</strong>
                  <small>Déjalo preparado para SharePoint / OneDrive.</small>
                </div>
                {sourceInfo?.activeMode === "url" && <b>FUENTE ACTIVA</b>}
              </div>
              <label className="kpi-url-field">
                <span>LINK DEL ARCHIVO KPI</span>
                <input
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://.../dashboard.xlsm"
                />
                <small>Si Microsoft exige inicio de sesión, usa por mientras la opción 1.</small>
              </label>
              <div className="kpi-source-actions">
                <button type="button" className="kpi-save" onClick={() => void handleSave()} disabled={saving || !url.trim()}>
                  <Save size={16} /> {saving ? "Probando enlace…" : "Guardar, probar y activar"}
                </button>
              </div>
            </article>
          </div>

          <div className="kpi-source-footer">
            <span>Fuente actual</span>
            <strong>{sourceInfo?.activeMode === "upload" ? "Archivo subido desde tu equipo" : sourceInfo?.activeMode === "url" ? "Excel Online por link" : "Sin definir"}</strong>
            {data?.meta.checkedAt && <small>Última lectura válida: {dateLabel(data.meta.checkedAt)}</small>}
          </div>
        </section>
      )}

      {message && <div className="kpi-alert success"><CheckCircle2 size={17} /> {message}</div>}
      {error && <div className="kpi-alert error"><XCircle size={17} /> {error}</div>}
      {data?.warning && <div className="kpi-alert warning"><AlertTriangle size={17} /> {data.warning}</div>}

      {!data ? (
        <section className="kpi-empty">
          <BarChart3 size={28} />
          <strong>{loading ? "Leyendo Excel KPI…" : "Todavía no hay datos KPI disponibles"}</strong>
          <span>{experienceView ? "Sube el archivo desde tu equipo o conecta un link arriba." : "Experiencia debe conectar primero la fuente KPI."}</span>
        </section>
      ) : (
        <>
          <section className="kpi-period-bar">
            <div>
              <span>PERIODO DEL ARCHIVO</span>
              <strong>{data.summary.period.month} {data.summary.period.year}</strong>
            </div>
            <div>
              <span>ARCHIVO</span>
              <strong>{data.meta.fileName || "Excel KPI"}</strong>
            </div>
            <div>
              <Clock3 size={15} />
              <span>Última lectura</span>
              <strong>{dateLabel(data.meta.checkedAt)}</strong>
            </div>
            {data.stale && <b>ÚLTIMO SNAPSHOT VÁLIDO</b>}
          </section>

          <section className="kpi-main-grid">
            <MetricCard label="Notas de venta" value={data.summary.notesSales} detail={`VN ${numberLabel(data.summary.newVehicleSales)} · VU ${numberLabel(data.summary.usedVehicleSales)}`} />
            <MetricCard label="Ventas vigentes" value={data.summary.validSalesTotal} detail={`VN ${numberLabel(data.summary.newVehicleValid)} · VU ${numberLabel(data.summary.usedVehicleValid)}`} />
            <MetricCard label="Facturación del mes" value={data.summary.billingCurrentTotal} detail={`VN ${numberLabel(data.summary.billingCurrentNew)} · VU ${numberLabel(data.summary.billingCurrentUsed)}`} featured />
            <MetricCard label="Meta del mes" value={data.summary.goal} detail={`Cumplimiento ${percentLabel(data.summary.compliance)}`} featured />
            <MetricCard label="Fact. mes pasado" value={data.summary.billingPreviousTotal} detail={`Variación total ${percentLabel(data.summary.variationTotal)}`} />
            <MetricCard label="Restante meta" value={percentLabel(data.summary.remaining)} detail={`Meta ${numberLabel(data.summary.goal)}`} />
          </section>

          <section className="kpi-breakdown-grid">
            <Breakdown title="Vehículos nuevos" rows={[
              ["Notas de venta", data.summary.newVehicleSales],
              ["Vigentes", data.summary.newVehicleValid],
              ["Nulas", data.summary.newVehicleCancelled],
              ["Fact. asociada a NV del mes", data.summary.newVehicleOrdersBilled],
              ["Facturación del mes", data.summary.billingCurrentNew],
              ["Facturación mes pasado", data.summary.billingPreviousNew],
              ["Pendiente de facturar", data.summary.pendingInvoiceNew],
              ["Variación", percentLabel(data.summary.variationNew)],
            ]} />
            <Breakdown title="Vehículos usados" rows={[
              ["Notas de venta", data.summary.usedVehicleSales],
              ["Vigentes", data.summary.usedVehicleValid],
              ["Nulas", data.summary.usedVehicleCancelled],
              ["Fact. asociada a NV del mes", data.summary.usedVehicleOrdersBilled],
              ["Facturación del mes", data.summary.billingCurrentUsed],
              ["Facturación mes pasado", data.summary.billingPreviousUsed],
              ["Pendiente de facturar", data.summary.pendingInvoiceUsed],
              ["Variación", percentLabel(data.summary.variationUsed)],
            ]} />
          </section>

          <section className="kpi-evolution-card">
            <div className="kpi-section-head">
              <div><span className="kpi-eyebrow">GRAFICOS</span><strong>Evolución mensual · {data.summary.period.year}</strong></div>
              <small>Valores ya calculados en el archivo.</small>
            </div>
            <div className="kpi-evolution-table-wrap">
              <table className="kpi-evolution-table">
                <thead><tr><th>Serie</th>{data.evolution.total.map((point) => <th key={point.month}>{point.month.slice(0, 3)}</th>)}</tr></thead>
                <tbody>
                  <EvolutionRow label="Total" points={data.evolution.total} />
                  <EvolutionRow label="VN" points={data.evolution.newVehicles} />
                  <EvolutionRow label="VU" points={data.evolution.usedVehicles} />
                </tbody>
              </table>
            </div>
          </section>

          <section className="kpi-detail-card">
            <div className="kpi-section-head">
              <div><span className="kpi-eyebrow">DETALLE DASHBOARD</span><strong>Marca y sucursal</strong></div>
              <label className="kpi-brand-filter">
                <span>Marca</span>
                <select value={brandFilter} onChange={(event) => setBrandFilter(event.target.value)}>
                  <option value="TODAS">Todas</option>
                  {brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}
                </select>
              </label>
            </div>
            <div className="kpi-detail-table-wrap">
              <table className="kpi-detail-table">
                <thead><tr><th>Marca</th><th>Sucursal</th><th>Ventas</th><th>Facturadas</th><th>Meta</th><th>% meta</th></tr></thead>
                <tbody>
                  {detail.map((row) => <DetailRow row={row} key={`${row.row}-${row.brand}-${row.local}`} />)}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, detail, featured = false }: { label: string; value: number | string; detail: string; featured?: boolean }) {
  return <article className={`kpi-metric-card ${featured ? "featured" : ""}`}><span>{label}</span><strong>{typeof value === "number" ? numberLabel(value) : value}</strong><small>{detail}</small></article>
}

function Breakdown({ title, rows }: { title: string; rows: Array<[string, number | string]> }) {
  return <article className="kpi-breakdown"><strong>{title}</strong>{rows.map(([label, value]) => <div key={label}><span>{label}</span><b>{typeof value === "number" ? numberLabel(value) : value}</b></div>)}</article>
}

function EvolutionRow({ label, points }: { label: string; points: Array<{ month: string; value: number }> }) {
  return <tr><th>{label}</th>{points.map((point) => <td key={`${label}-${point.month}`}>{numberLabel(point.value)}</td>)}</tr>
}

function DetailRow({ row }: { row: KpiDetailRow }) {
  return (
    <tr className={row.type === "summary" ? "kpi-detail-summary" : ""}>
      <td>{row.brand || "—"}</td>
      <td>{row.local || (row.type === "summary" ? "TOTAL MARCA" : "—")}</td>
      <td>{numberLabel(row.sales)}</td>
      <td>{numberLabel(row.billed)}</td>
      <td>{numberLabel(row.goal)}</td>
      <td>{percentLabel(row.compliance)}</td>
    </tr>
  )
}
