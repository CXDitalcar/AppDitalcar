import { useEffect, useMemo, useState } from "react"
import { RefreshCcw, Search, AlertCircle } from "lucide-react"
import { getSolicitudes, type Solicitud } from "../services/graph"
import StatusBadge from "../components/StatusBadge"

function pick(fields: Record<string, any>, names: string[]) {
  for (const name of names) if (fields[name] !== undefined && fields[name] !== null) return fields[name]
  return ""
}

export default function Solicitudes({ branch }: { branch: string }) {
  const [rows,setRows] = useState<Solicitud[]>([])
  const [loading,setLoading] = useState(true)
  const [error,setError] = useState("")
  const [query,setQuery] = useState("")

  async function load() {
    setLoading(true); setError("")
    try { setRows(await getSolicitudes()) }
    catch(e:any) { setError(e?.message || "No fue posible cargar las solicitudes.") }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return rows.filter(r => {
      const f = r.fields
      const local = String(pick(f,["Local","local","Sucursal","Sucursal0"]))
      const solicitud = String(pick(f,["Solicitud","Title","Title0"]))
      const estado = String(pick(f,["Estado","Status"]))
      const area = String(pick(f,["_x00c1_rearesponsable","Area_x0020_responsable","Área responsable","AreaResponsable"]))
      const matchesBranch = !branch || !local || local.toLowerCase().includes(branch.toLowerCase())
      const matchesQuery = !q || `${solicitud} ${estado} ${area} ${local}`.toLowerCase().includes(q)
      return matchesBranch && matchesQuery
    })
  }, [rows,query,branch])

  return (
    <>
      <div className="page-head inline">
        <div><span className="eyebrow">TABLERO GENERAL</span><h1>Solicitudes</h1><p>Fuente: SharePoint · piloto {branch}</p></div>
        <button className="secondary-btn" onClick={load}><RefreshCcw size={17}/> Actualizar</button>
      </div>

      <div className="toolbar"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar solicitud, área o estado..." /></div>

      {loading && <div className="empty">Cargando solicitudes…</div>}
      {error && <div className="error-box"><AlertCircle/><div><strong>No se pudieron cargar las solicitudes</strong><span>{error}</span></div></div>}

      <div className="requests-grid">
        {!loading && !error && filtered.map(({id,fields}) => {
          const title = String(pick(fields,["Solicitud","Title","Title0"])) || `Solicitud #${id}`
          const status = String(pick(fields,["Estado","Status"]))
          const area = String(pick(fields,["_x00c1_rearesponsable","Area_x0020_responsable","Área responsable","AreaResponsable"]))
          const category = String(pick(fields,["Categor_x00ed_as","Categorias","Categorías","Categoria"]))
          const local = String(pick(fields,["Local","local","Sucursal","Sucursal0"]))
          const date = String(pick(fields,["Fecha_x0020_solicitud","FechaSolicitud","Fecha solicitud","Created"]))
          return (
            <article className="request-card" key={id}>
              <div className="request-top"><StatusBadge value={status}/><span>#{id}</span></div>
              <h3>{title}</h3>
              <div className="request-meta"><span>{area || "Área por asignar"}</span><span>{category || "Sin categoría"}</span><span>{local || "Sin local"}</span></div>
              <div className="request-foot"><small>{date ? new Date(date).toLocaleDateString("es-CL") : "Sin fecha"}</small></div>
            </article>
          )
        })}
      </div>
    </>
  )
}
