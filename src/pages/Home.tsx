import {
  BarChart3,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  GraduationCap,
  MessagesSquare,
  PackageOpen,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"
import { Link } from "react-router-dom"

import { getPilotLocal, getVisiblePilotLocals, networkKPIs, type KPIItem } from "../data/pilotData"
import type { UserScope } from "../types"
import { canAccessPilotModule, isPilotFullAccess, type PilotModule } from "../data/pilotStellantis"

const cards: Array<{
  to: string
  title: string
  text: string
  icon: typeof GraduationCap
  module: PilotModule
}> = [
  { to: "/academia", title: "Academia", text: "Modelo, playbooks, cursos, evaluaciones, biblioteca y progreso por rol.", icon: GraduationCap, module: "ACADEMIA" },
  { to: "/mi-local", title: "Mi Local", text: "KPI, estándares y brechas de la sucursal.", icon: ClipboardCheck, module: "MI_LOCAL" },
  { to: "/solicitudes", title: "Solicitudes", text: "Crear, consultar y seguir requerimientos del piloto.", icon: MessagesSquare, module: "SOLICITUDES" },
  { to: "/formularios", title: "Ruta de Experiencia", text: "Realización y seguimiento de la Ruta según tu perfil.", icon: FileCheck2, module: "FORMULARIOS" },
  { to: "/insumos", title: "Insumos", text: "Stock, sugerencia y pedido inteligente del local.", icon: PackageOpen, module: "INSUMOS" },
]
export default function Home({
  userName,
  branch,
  currentUser,
  demoMode,
}: {
  userName: string
  branch: string
  currentUser: UserScope
  demoMode: boolean
}) {
  const firstName = userName.split(" ")[0] || userName
  const local = getPilotLocal(currentUser.local)
  const visibleLocals = getVisiblePilotLocals(currentUser)
  const managementView = visibleLocals.length > 1
  const fullAccess = isPilotFullAccess(currentUser)
  const visibleCards = cards.filter((card) =>
    canAccessPilotModule(currentUser, card.module)
  )

  return (
    <>
      <section className="hero pilot-hero">
        <div className="hero-copy">
          <div className="eyebrow">EXPERIENCIA DITALCAR</div>
          <h1>Una sola forma de vivir<br/><em>la experiencia Ditalcar.</em></h1>
          <p>Academia, estándares, formularios, KPI y solicitudes operativas en un solo lugar.</p>
          <div className="welcome"><Sparkles size={17}/> Hola, {firstName} · {branch}</div>
          {demoMode && <div className="pilot-data-note">Piloto Stellantis Nueva Tobalaba · perfiles y datos demostrativos para validar Ruta y Solicitudes.</div>}
        </div>
        <div className="hero-orbit"><div className="orbit"><span>D</span></div></div>
      </section>

      {fullAccess ? (
        <>
      <section className="section">
        <div className="section-head kpi-section-head">
          <div>
            <span className="eyebrow">KPI RED DITALCAR</span>
            <h2>Visión general</h2>
          </div>
          <span className="kpi-scope"><BarChart3 size={15}/> Red</span>
        </div>
        <div className="kpi-grid">
          {networkKPIs.map((kpi) => <KPICard key={kpi.id} kpi={kpi} compact={!managementView} />)}
        </div>
      </section>

      {local && (
        <section className="section">
          <div className="section-head kpi-section-head">
            <div>
              <span className="eyebrow">MI LOCAL</span>
              <h2>{local.name}</h2>
            </div>
            <Link className="kpi-text-link" to="/mi-local">Ver detalle <ChevronRight size={15}/></Link>
          </div>
          <div className="kpi-grid kpi-grid-local">
            {local.kpis.slice(0, 6).map((kpi) => <KPICard key={kpi.id} kpi={kpi} />)}
          </div>
        </section>
      )}

      {managementView && (
        <section className="section">
          <div className="section-head kpi-section-head">
            <div>
              <span className="eyebrow">LOCALES</span>
              <h2>Vista de gestión</h2>
            </div>
            <Link className="kpi-text-link" to="/mi-local">Abrir locales <ChevronRight size={15}/></Link>
          </div>
          <div className="local-overview-grid">
            {visibleLocals.map((item) => {
              const standards = item.kpis.find((kpi) => kpi.id === "estandares")
              const accuracy = item.kpis.find((kpi) => kpi.id === "exactitud")
              const sla = item.kpis.find((kpi) => kpi.id === "sla")
              return (
                <article className="local-overview-card" key={item.name}>
                  <div className="local-overview-top">
                    <div><span>{item.operation === "GENERAL" ? "OPERACIÓN" : item.operation}</span><strong>{item.name}</strong></div>
                    <ShieldCheck size={18}/>
                  </div>
                  <div className="local-overview-values">
                    <MiniKPI label="Estándares" value={standards?.value}/>
                    <MiniKPI label="Exactitud" value={accuracy?.value}/>
                    <MiniKPI label="SLA" value={sla?.value}/>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

        </>
      ) : (
        <section className="section">
          <div className="section-head">
            <div>
              <span className="eyebrow">PILOTO ACTIVO</span>
              <h2>Stellantis Nueva Tobalaba</h2>
            </div>
          </div>
          <div className="module-grid">
            <article className="module-card" style={{cursor:"default"}}>
              <div className="module-number">01</div>
              <h3>Ruta de Experiencia</h3>
              <p>Visible para Jefatura de Sucursal, Gerencia de Marca y Experiencia. Solo la Jefatura la tiene asignada para realizar.</p>
            </article>
            <article className="module-card" style={{cursor:"default"}}>
              <div className="module-number">02</div>
              <h3>Solicitudes</h3>
              <p>Credenciales, pie de firma, horarios, señalizaciones, organigrama y solicitudes de Experiencia habilitadas según perfil.</p>
            </article>
            <article className="module-card" style={{cursor:"default"}}>
              <div className="module-number">03</div>
              <h3>Modo piloto</h3>
              <p>Mientras Microsoft no esté habilitado, la prueba guarda la información localmente en este navegador.</p>
            </article>
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <div><span className="eyebrow">ACCESOS PRINCIPALES</span><h2>¿Qué necesitas hacer?</h2></div>
        </div>
        <div className="module-grid">
          {visibleCards.map(({to,title,text,icon:Icon}) => (
            <Link className="module-card" to={to} key={title}>
              <div className="module-icon"><Icon/></div>
              <div className="module-number">DITALCAR</div>
              <h3>{title}</h3>
              <p>{text}</p>
              <div className="module-link">Entrar <ChevronRight size={16}/></div>
            </Link>
          ))}
        </div>
      </section>
    </>
  )
}

function KPICard({ kpi, compact = false }: { kpi: KPIItem; compact?: boolean }) {
  const value = kpi.unit === "%" ? `${kpi.value}%` : String(kpi.value)
  return (
    <article className={`kpi-card kpi-${kpi.state.toLowerCase()}`}>
      <div className="kpi-card-head">
        <span>{kpi.label}</span>
        {kpi.target !== undefined ? <small>Meta {kpi.target}{kpi.unit === "%" ? "%" : ""}</small> : <Target size={15}/>} 
      </div>
      <strong className="kpi-value">{value}</strong>
      {!compact && <p>{kpi.note}</p>}
      {kpi.unit === "%" && <div className="kpi-progress"><span style={{width: `${Math.min(kpi.value, 100)}%`}}/></div>}
    </article>
  )
}

function MiniKPI({ label, value }: { label: string; value?: number }) {
  return <div><span>{label}</span><strong>{value === undefined ? "—" : `${value}%`}</strong></div>
}
