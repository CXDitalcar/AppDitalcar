import { Link } from "react-router-dom"
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileSpreadsheet,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react"
import SignalLight, { type SignalTone } from "../components/SignalLight"
import "./Gestion.css"

// ======================================================
// GESTIÓN · punto de entrada único a las herramientas administrativas.
// La visibilidad de cada acceso se calcula en App.tsx con los mismos
// permisos que protegen cada ruta; aquí sólo se muestran.
// ======================================================

type GestionProps = {
  showApprovals: boolean
  showRequests: boolean
  showKpi: boolean
  // Usuarios y fuentes de datos: sólo con el perfil REAL de Experiencia
  // (no se habilita con "Ver como"). El backend también lo valida.
  showAdmin: boolean
}

type GestionItem = {
  key: string
  title: string
  description: string
  to?: string
  icon: LucideIcon
  tone: SignalTone
  status: string
}

export default function Gestion({
  showApprovals,
  showRequests,
  showKpi,
  showAdmin,
}: GestionProps) {
  const operation: GestionItem[] = [
    showApprovals && {
      key: "approvals",
      title: "Bandeja de gestión",
      description: "Solicitudes que esperan tu aprobación, toma o respuesta.",
      to: "/aprobaciones",
      icon: ShieldCheck,
      tone: "green" as SignalTone,
      status: "Disponible",
    },
    showRequests && {
      key: "requests",
      title: "Solicitudes",
      description: "Seguimiento de las solicitudes que ingresaste o que involucran a tu local.",
      to: "/solicitudes",
      icon: ClipboardList,
      tone: "green" as SignalTone,
      status: "Disponible",
    },
    showKpi && {
      key: "kpi",
      title: "KPI",
      description: "Indicadores comerciales del archivo Dashboard y, más adelante, Experiencia · Estándares.",
      to: "/kpi",
      icon: BarChart3,
      tone: "green" as SignalTone,
      status: "Disponible",
    },
  ].filter(Boolean) as GestionItem[]

  const administration: GestionItem[] = showAdmin
    ? [
        {
          key: "users",
          title: "Usuarios",
          description: "Directorio, perfiles y fuente de usuarios (02_Usuarios o Excel temporal).",
          to: "/usuarios",
          icon: UsersRound,
          tone: "green",
          status: "Disponible",
        },
        {
          key: "surveys",
          title: "Encuestas",
          description: "Archivo activo, última actualización y estado de procesamiento.",
          icon: MessageSquareText,
          tone: "neutral",
          status: "En desarrollo",
        },
        {
          key: "frogmi",
          title: "Frogmi",
          description: "Archivo activo, última actualización y estado de procesamiento.",
          icon: FileSpreadsheet,
          tone: "neutral",
          status: "En desarrollo",
        },
      ]
    : []

  return (
    <div className="gestion-page">
      <header className="gestion-head">
        <span className="eyebrow">GESTIÓN</span>
        <h1>Herramientas de gestión</h1>
        <p>Solicitudes, indicadores y administración en un solo lugar.</p>
      </header>

      {operation.length > 0 && (
        <section className="gestion-section">
          <h2>Operación</h2>
          <div className="gestion-grid">
            {operation.map((item) => (
              <GestionCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      )}

      {administration.length > 0 && (
        <section className="gestion-section">
          <h2>Administración y fuentes de datos</h2>
          <p className="gestion-section-note">Visible sólo para Experiencia de Clientes y Project Manager.</p>
          <div className="gestion-grid">
            {administration.map((item) => (
              <GestionCard key={item.key} item={item} />
            ))}
          </div>
        </section>
      )}

      {operation.length === 0 && administration.length === 0 && (
        <div className="gestion-empty">
          Tu perfil todavía no tiene herramientas de gestión habilitadas.
        </div>
      )}
    </div>
  )
}

function GestionCard({ item }: { item: GestionItem }) {
  const Icon = item.icon
  const content = (
    <>
      <div className="gestion-card-top">
        <span className="gestion-card-icon">
          <Icon size={22} strokeWidth={1.9} />
        </span>
        <span className="gestion-card-status">
          <SignalLight tone={item.tone} compact />
          {item.status}
        </span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.description}</p>
      {item.to && (
        <span className="gestion-card-link">
          Abrir <ArrowRight size={16} />
        </span>
      )}
    </>
  )

  return item.to ? (
    <Link className="gestion-card" to={item.to}>
      {content}
    </Link>
  ) : (
    <article className="gestion-card gestion-card-disabled" aria-disabled="true">
      {content}
    </article>
  )
}
