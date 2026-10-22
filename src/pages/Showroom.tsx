import { useEffect, useMemo, useState } from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { ArrowRight, CheckCircle2, ClipboardCheck, Plus, Route as RouteIcon } from "lucide-react"
import SignalLight, { signalFromRequest } from "../components/SignalLight"
import { getProcessesForUser, isExperienceProcess, isProcessRequestable } from "../services/requestCatalog"
import { stageLabel } from "../services/requestPresentation"
import { processSlaLabel } from "../services/workflow"
import { listRouteExecutions, getRouteMetrics, type RouteExecution, type RouteMetrics } from "../services/routeExperienceApi"
import { showroomTasks, useShowroomRequests } from "../services/showroomData"
import { hasExperienceAccess } from "../services/experienceAccess"
import type { RequestFamily, UserScope } from "../types"
import "./Portal.css"
import "./Showroom.css"

const FAMILY_LABELS: Partial<Record<RequestFamily, string>> = {
  EXPERIENCIA: "Experiencia del local",
  DOCUMENTACION: "Documentación de unidades",
  COLABORADORES: "Colaboradores",
}

type Tab = "solicitudes" | "ruta"
type Filter = "ABIERTAS" | "CERRADAS"

const fmt = (iso?: string) => (iso ? new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" }).format(new Date(iso)) : "—")

function weekStart(date = new Date()) {
  const d = new Date(date); const day = (d.getDay() + 6) % 7
  d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day)
  return d
}

// Interfaz "Gestión de Showroom": solicitudes que gestiona Experiencia y Ruta de Experiencia.
export default function Showroom({ currentUser, canRoute, canLocalBoard }: { currentUser: UserScope; canRoute: boolean; canLocalBoard: boolean }) {
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get("tab") === "ruta" && canRoute ? "ruta" : "solicitudes"
  const { hash } = useLocation()
  const requests = useShowroomRequests(currentUser)
  const [filter, setFilter] = useState<Filter>("ABIERTAS")
  const network = hasExperienceAccess(currentUser)

  useEffect(() => {
    if (hash === "#para-hoy") document.getElementById("para-hoy")?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [hash])

  const tasks = useMemo(() => showroomTasks(currentUser, requests ?? []), [currentUser, requests])
  const processes = useMemo(
    () => getProcessesForUser(currentUser).filter((p) => isExperienceProcess(p.code) && (p.availability ?? "ACTIVO") === "ACTIVO" && isProcessRequestable(p)),
    [currentUser],
  )
  const groups = useMemo(() => {
    const map = new Map<string, typeof processes>()
    for (const p of processes) {
      const key = FAMILY_LABELS[p.family] ?? "Otras"
      map.set(key, [...(map.get(key) ?? []), p])
    }
    return [...map.entries()]
  }, [processes])

  const open = (requests ?? []).filter((r) => !["RESUELTA", "RECHAZADA"].includes(r.status))
  const closed = (requests ?? []).filter((r) => ["RESUELTA", "RECHAZADA"].includes(r.status))
  const list = (filter === "ABIERTAS" ? open : closed).slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
  const overdue = open.filter((r) => signalFromRequest(r) === "red").length
  const firstName = currentUser.name.split(" ")[0] || currentUser.name

  return (
    <div className="portal-page showroom-page">
      <section className="portal-hello">
        <h1>Hola, {firstName}</h1>
        <p>{currentUser.local ? `${currentUser.local} · ` : ""}Lo que necesita tu showroom: solicitudes de experiencia y Ruta de Experiencia.</p>
      </section>

      {canRoute && (
        <div className="showroom-tabs" role="tablist" aria-label="Gestión de Showroom">
          <button type="button" role="tab" aria-selected={tab === "solicitudes"} className={tab === "solicitudes" ? "active" : ""} onClick={() => setParams({})}>
            <ClipboardCheck size={18} /> Solicitudes {tasks.length > 0 && <b>{tasks.length}</b>}
          </button>
          <button type="button" role="tab" aria-selected={tab === "ruta"} className={tab === "ruta" ? "active" : ""} onClick={() => setParams({ tab: "ruta" })}>
            <RouteIcon size={18} /> Ruta de Experiencia
          </button>
        </div>
      )}

      {tab === "solicitudes" ? (
        <>
          <section id="para-hoy" className="portal-today" aria-labelledby="hoy-title">
            <div className="portal-section-head">
              <h2 id="hoy-title">Te toca</h2>
              {tasks.length > 0 && <span className="portal-pill">{tasks.length}</span>}
            </div>
            {requests === null ? <div className="portal-empty muted">Cargando…</div> : tasks.length === 0 ? (
              <div className="portal-empty"><CheckCircle2 size={18} /> Nada pendiente por ahora.</div>
            ) : (
              <ul className="portal-todo">
                {tasks.map(({ request, action }) => (
                  <li key={request.id}>
                    <Link to={`/solicitudes/${request.id}`}>
                      <SignalLight tone={signalFromRequest(request)} compact />
                      <span className="portal-todo-text"><strong>{action} · {request.processName}</strong><small>{request.local} · {request.requesterName} · {fmt(request.createdAt)}</small></span>
                      <ArrowRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {network && requests && (
            <section className="portal-section" aria-label="Resumen">
              <div className="showroom-tiles">
                <div className="seg-card macro-tile"><span>Abiertas</span><strong>{open.length}</strong></div>
                <div className={`seg-card macro-tile ${overdue ? "bad" : ""}`}><span>Fuera de plazo</span><strong>{overdue}</strong></div>
                <div className="seg-card macro-tile"><span>Por aprobar en el local</span><strong>{open.filter((r) => r.status === "PENDIENTE_APROBACION").length}</strong></div>
                <div className="seg-card macro-tile good"><span>Resueltas</span><strong>{closed.filter((r) => r.status === "RESUELTA").length}</strong></div>
              </div>
            </section>
          )}

          {groups.length > 0 && (
            <section className="portal-section" aria-labelledby="pedir-title">
              <div className="portal-section-head">
                <h2 id="pedir-title">Pedir algo</h2>
                <p>Elige qué necesitas; te pedimos solo lo justo.</p>
              </div>
              {groups.map(([label, items]) => (
                <div key={label} className="showroom-group">
                  <h3>{label}</h3>
                  <div className="showroom-process-grid">
                    {items.map((p) => (
                      <Link key={p.code} to={`/solicitudes/nueva?process=${encodeURIComponent(p.code)}`} className="showroom-process">
                        <Plus size={16} />
                        <span><strong>{p.name}</strong>{processSlaLabel(p.code) && <small>Plazo: {processSlaLabel(p.code)}</small>}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          )}

          <section className="portal-section" aria-labelledby="lista-title">
            <div className="portal-section-head showroom-list-head">
              <h2 id="lista-title">{network ? "Solicitudes" : "Tus solicitudes y las de tu local"}</h2>
              <div className="showroom-filter" role="tablist">
                <button type="button" role="tab" aria-selected={filter === "ABIERTAS"} className={filter === "ABIERTAS" ? "active" : ""} onClick={() => setFilter("ABIERTAS")}>En curso ({open.length})</button>
                <button type="button" role="tab" aria-selected={filter === "CERRADAS"} className={filter === "CERRADAS" ? "active" : ""} onClick={() => setFilter("CERRADAS")}>Cerradas ({closed.length})</button>
              </div>
            </div>
            {requests === null ? <div className="portal-empty muted">Cargando…</div> : list.length === 0 ? (
              <div className="portal-empty"><CheckCircle2 size={18} /> {filter === "ABIERTAS" ? "Nada en curso por ahora." : "Aún no hay solicitudes cerradas."}</div>
            ) : (
              <ul className="showroom-list">
                {list.slice(0, 60).map((r) => (
                  <li key={r.id}>
                    <Link to={`/solicitudes/${r.id}`}>
                      <SignalLight tone={signalFromRequest(r)} compact />
                      <span className="showroom-list-main"><strong>{r.processName}</strong><small>{r.local} · {r.requesterName} · {fmt(r.createdAt)}</small></span>
                      <span className="showroom-stage">{stageLabel(r)}</span>
                      <ArrowRight size={16} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <RutaPanel currentUser={currentUser} canLocalBoard={canLocalBoard} network={network} />
      )}
    </div>
  )
}

function RutaPanel({ currentUser, canLocalBoard, network }: { currentUser: UserScope; canLocalBoard: boolean; network: boolean }) {
  const [executions, setExecutions] = useState<RouteExecution[] | null>(null)
  const [metrics, setMetrics] = useState<RouteMetrics | null>(null)

  useEffect(() => {
    listRouteExecutions().then((r) => setExecutions(r.executions ?? [])).catch(() => setExecutions([]))
    getRouteMetrics(network ? undefined : currentUser.local).then(setMetrics).catch(() => setMetrics(null))
  }, [currentUser.email, currentUser.local, network])

  const isBranchHead = currentUser.role === "JEFATURA_LOCAL"
  const since = weekStart().toISOString()
  const thisWeek = (executions ?? []).find((e) => e.mode === "RUTA" && e.status === "SUBMITTED" && (e.submittedAt ?? e.updatedAt) >= since && (!currentUser.local || e.local === currentUser.local))
  const draft = (executions ?? []).find((e) => e.status === "DRAFT" && e.completedByEmail?.toLowerCase() === currentUser.email.toLowerCase())

  const byLocal = useMemo(() => {
    const map = new Map<string, RouteExecution>()
    for (const e of (executions ?? []).filter((x) => x.status === "SUBMITTED").sort((a, b) => String(b.submittedAt ?? b.updatedAt).localeCompare(String(a.submittedAt ?? a.updatedAt)))) {
      if (!map.has(e.local)) map.set(e.local, e)
    }
    return [...map.values()]
  }, [executions])

  const pct = (e: RouteExecution) => {
    const total = e.compliant + e.nonCompliant
    return total ? Math.round((e.compliant / total) * 100) : null
  }

  return (
    <>
      {isBranchHead && (
        <section className="portal-today" aria-labelledby="semana-title">
          <div className="portal-section-head"><h2 id="semana-title">Esta semana</h2></div>
          {executions === null ? <div className="portal-empty muted">Cargando…</div> : thisWeek ? (
            <div className="portal-empty"><CheckCircle2 size={18} /> Ruta enviada el {fmt(thisWeek.submittedAt ?? thisWeek.updatedAt)}. {pct(thisWeek) !== null ? `Cumplimiento ${pct(thisWeek)}%.` : ""}</div>
          ) : (
            <Link to="/formularios" className="showroom-cta">
              <RouteIcon size={22} />
              <span><strong>{draft ? "Continuar la Ruta de Experiencia" : "Realizar la Ruta de Experiencia"}</strong><small>Recorrido semanal del local. Tarda unos minutos y puedes adjuntar fotos.</small></span>
              <ArrowRight size={18} />
            </Link>
          )}
        </section>
      )}

      <section className="portal-section" aria-labelledby="tablero-title">
        <div className="portal-section-head">
          <h2 id="tablero-title">Tablero</h2>
          <p>{network ? "Última Ruta de cada local." : "Resultados de tu local."}</p>
        </div>
        {metrics?.latest && (
          <div className="showroom-tiles">
            <div className="seg-card macro-tile"><span>Exactitud Ruta vs Auditoría</span><strong>{Math.round(metrics.latest.exactitude)}%</strong><small>{metrics.latest.local} · {metrics.latest.period}</small></div>
            <div className="seg-card macro-tile"><span>Diferencias en la última comparación</span><strong>{metrics.latest.differences.length}</strong></div>
          </div>
        )}
        {executions === null ? <div className="portal-empty muted">Cargando…</div> : byLocal.length === 0 ? (
          <div className="portal-empty muted">Aún no hay Rutas enviadas.</div>
        ) : (
          <ul className="showroom-list">
            {byLocal.map((e) => (
              <li key={e.id}>
                <Link to={`/formularios/${e.id}`}>
                  <SignalLight tone={pct(e) === null ? "neutral" : pct(e)! >= 90 ? "green" : pct(e)! >= 60 ? "orange" : "red"} compact />
                  <span className="showroom-list-main"><strong>{e.local}</strong><small>{e.mode === "AUDITORIA" ? "Auditoría" : "Ruta"} · {fmt(e.submittedAt ?? e.updatedAt)} · {e.completedByName}</small></span>
                  <span className="showroom-stage">{pct(e) !== null ? `${pct(e)}% cumple` : "—"}{e.nonCompliant ? ` · ${e.nonCompliant} brecha${e.nonCompliant > 1 ? "s" : ""}` : ""}</span>
                  <ArrowRight size={16} />
                </Link>
              </li>
            ))}
          </ul>
        )}
        <div className="showroom-links">
          <Link to="/formularios" className="seg-btn">Ver todas las Rutas y auditorías</Link>
          {canLocalBoard && <Link to="/mi-local" className="seg-btn">Tablero completo del local</Link>}
        </div>
      </section>
    </>
  )
}
