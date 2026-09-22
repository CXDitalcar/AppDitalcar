import { useEffect, useMemo, useState } from "react"
import { ArrowRight, BarChart3, CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

import SignalLight, { signalFromRequest, type SignalTone } from "../components/SignalLight"
import {
  academyCourses,
  academyEvaluations,
  PILOT_VISIBLE_COURSE_IDS,
  PILOT_VISIBLE_EVALUATION_IDS,
  type AcademyAudience,
} from "../data/academiaData"
import { requestAssignments } from "../data/requestConfig"
import { isPilotLocal } from "../data/pilotStellantis"
import {
  getCourseProgress,
  getEvaluationAttempts,
  hasAcademyFeedback,
} from "../services/academyStore"
import { getRequestPermissions } from "../services/permissions"
import { listRequests } from "../services/requestRepository"
import type { RequestItem, UserScope } from "../types"
import "./Home.css"

type ActivityItem = {
  id: string
  title: string
  detail: string
  to: string
  tone?: SignalTone
}

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? ""
}

function academyAudience(user: UserScope): AcademyAudience {
  if (user.role === "EXPERIENCIA_CLIENTES") return "EXPERIENCIA"
  if (user.role === "GERENCIA_VENTAS") return "GERENCIA_VENTAS"
  if (["GERENCIA_MARCA", "JEFATURA_MARCA", "JEFATURA_ZONAL"].includes(user.role)) {
    return "GERENCIA_MARCA"
  }
  if (user.role === "JEFATURA_LOCAL") return "JEFATURA"
  if (user.role === "VENDEDOR") return "VENTAS"
  if (
    user.role === "ADMINISTRATIVO" &&
    (normalize(user.name).includes("junior") || normalize(user.areaFunctional).includes("oper"))
  ) {
    return "JUNIOR"
  }
  return "CASA_MATRIZ"
}

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
  const [requests, setRequests] = useState<RequestItem[]>([])

  useEffect(() => {
    let active = true
    listRequests(currentUser)
      .then((items) => {
        if (active) setRequests(items)
      })
      .catch(() => {
        if (active) setRequests([])
      })

    return () => {
      active = false
    }
  }, [currentUser.email, currentUser.role, currentUser.local])

  const { needsAction, pendingItems } = useMemo(() => {
    const actions: ActivityItem[] = []
    const pending: ActivityItem[] = []

    if (currentUser.role === "JEFATURA_LOCAL" && isPilotLocal(currentUser)) {
      actions.push({
        id: "ruta-experiencia",
        title: "Realizar Ruta de Experiencia",
        detail: "Actividad asignada a la Jefatura de Sucursal · Stellantis Nueva Tobalaba.",
        to: "/formularios",
        tone: "green",
      })
    }

    requests.forEach((request) => {
      const permissions = getRequestPermissions(currentUser, request, requestAssignments)
      if (!permissions.canView) return

      const to = `/solicitudes/${request.id}`
      const oversight = ["GERENCIA_MARCA", "GERENCIA_VENTAS", "EXPERIENCIA_CLIENTES"].includes(
        currentUser.role
      )

      if (request.status === "RECIBIDA" && permissions.canManage) {
        actions.push({
          id: `new-${request.id}`,
          title: `Revisar nueva solicitud · ${request.processName}`,
          detail: `${request.local} · disponible para tomar gestión.`,
          to,
          tone: "green",
        })
      }

      if (request.status === "PENDIENTE_APROBACION" && permissions.canApprove) {
        actions.push({
          id: `approve-${request.id}`,
          title: `Revisar aprobación · ${request.processName}`,
          detail: `${request.local} · requiere tu decisión.`,
          to,
          tone: "green",
        })
      }

      if (
        request.status === "INFORMACION_REQUERIDA" &&
        normalize(request.requesterEmail) === normalize(currentUser.email)
      ) {
        actions.push({
          id: `info-${request.id}`,
          title: `Completar información · ${request.processName}`,
          detail: "La gestión está esperando antecedentes del solicitante.",
          to,
          tone: "green",
        })
      }

      if (request.status === "RESUELTA_POR_CONFIRMAR" && permissions.canConfirmResolution) {
        actions.push({
          id: `confirm-${request.id}`,
          title: `Confirmar resolución · ${request.processName}`,
          detail: `${request.local} · confirma si quedó resuelto.`,
          to,
          tone: "green",
        })
      }

      if (request.status === "EN_GESTION" && permissions.canManage) {
        pending.push({
          id: `manage-${request.id}`,
          title: `En gestión · ${request.processName}`,
          detail: `${request.local} · seguimiento activo.`,
          to,
          tone: signalFromRequest(request),
        })
      } else if (request.status === "EN_GESTION" && oversight) {
        pending.push({
          id: `scope-${request.id}`,
          title: `Seguimiento · ${request.processName}`,
          detail: `${request.local} · ${request.isTest ? "caso de prueba" : "gestión activa"}.`,
          to,
          tone: signalFromRequest(request),
        })
      }

      if (request.status === "INFORMACION_REQUERIDA" && oversight) {
        pending.push({
          id: `scope-info-${request.id}`,
          title: `Falta información · ${request.processName}`,
          detail: `${request.local} · gestión temporalmente detenida.`,
          to,
          tone: "orange",
        })
      }
    })

    const audience = academyAudience(currentUser)
    const pilotCourses = academyCourses.filter(
      (course) =>
        PILOT_VISIBLE_COURSE_IDS.includes(
          course.id as (typeof PILOT_VISIBLE_COURSE_IDS)[number]
        ) &&
        course.audience.includes(audience) &&
        course.assignedTo.includes(audience)
    )

    pilotCourses.forEach((course) => {
      const progress = getCourseProgress(course)
      const feedbackDone = hasAcademyFeedback(course.id, currentUser.email)

      if (progress === 0) {
        actions.push({
          id: `course-${course.id}`,
          title: `Comenzar curso · ${course.title}`,
          detail: "Curso asignado · 0% de avance.",
          to: "/academia?tab=cursos",
          tone: "green",
        })
      } else if (progress < 100) {
        pending.push({
          id: `course-progress-${course.id}`,
          title: `Continuar curso · ${course.title}`,
          detail: `${progress}% de avance.`,
          to: "/academia?tab=cursos",
          tone: "orange",
        })
      } else if (!feedbackDone) {
        actions.push({
          id: `course-feedback-${course.id}`,
          title: `Cerrar curso · ${course.title}`,
          detail: "Completa la encuesta breve obligatoria del curso asignado.",
          to: "/academia?tab=cursos",
          tone: "green",
        })
      }
    })

    academyEvaluations
      .filter(
        (evaluation) =>
          PILOT_VISIBLE_EVALUATION_IDS.includes(
            evaluation.id as (typeof PILOT_VISIBLE_EVALUATION_IDS)[number]
          ) &&
          evaluation.audience.includes(audience) &&
          evaluation.assignedTo.includes(audience)
      )
      .forEach((evaluation) => {
        const attempts = getEvaluationAttempts(evaluation.id)
        const passed = attempts.some((attempt) => attempt.passed)
        if (!passed && attempts.length < evaluation.attempts) {
          pending.push({
            id: `evaluation-${evaluation.id}`,
            title: `Evaluación pendiente · ${evaluation.title}`,
            detail: `${evaluation.attempts - attempts.length} intento(s) disponible(s).`,
            to: "/academia?tab=evaluaciones",
            tone: attempts.length ? "orange" : "green",
          })
        }
      })

    return {
      needsAction: dedupeActivities(actions).slice(0, 10),
      pendingItems: dedupeActivities(pending).slice(0, 12),
    }
  }, [currentUser, requests])

  return (
    <div className="home-pilot-page">
      <section className="home-pilot-head">
        <div>
          <span className="eyebrow">DITALCAR COLABORADORES</span>
          <h1>Hola, {firstName}</h1>
          <p>{branch} · aquí se concentra lo que necesita tu atención.</p>
        </div>
        {demoMode && <span className="home-pilot-badge">MODO PILOTO</span>}
      </section>

      <section className="activity-hub-grid home-primary-grid">
        <ActivityPanel
          title="¿Qué necesitas hacer?"
          subtitle="Acciones disponibles para realizar ahora."
          items={needsAction}
          empty="No tienes nuevas acciones por realizar."
        />
        <ActivityPanel
          title="Pendientes"
          subtitle="Gestiones ya abiertas que requieren seguimiento."
          items={pendingItems}
          empty="No tienes pendientes en este momento."
        />
      </section>

      <section className="home-kpi-strip">
        <div className="home-kpi-strip-head">
          <div>
            <span className="eyebrow">KPI COMERCIALES</span>
            <strong>Resumen general</strong>
          </div>
          <Link to="/kpi">Ver KPI <ArrowRight size={14} /></Link>
        </div>
        <div className="home-kpi-mini-grid">
          <KPIPlaceholder label="Ventas vs meta" />
          <KPIPlaceholder label="Facturación vs meta" />
        </div>
        <div className="home-kpi-source-note">
          <BarChart3 size={14} /> Fuente KPI aún no conectada · última actualización: sin conexión.
        </div>
      </section>
    </div>
  )
}

function ActivityPanel({
  title,
  subtitle,
  items,
  empty,
}: {
  title: string
  subtitle: string
  items: ActivityItem[]
  empty: string
}) {
  return (
    <article className="activity-panel">
      <div className="activity-panel-head">
        <div>
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </div>
        <b>{items.length}</b>
      </div>
      <div className="activity-list">
        {items.length ? (
          items.map((item) => (
            <Link className="activity-row" to={item.to} key={item.id}>
              <SignalLight tone={item.tone ?? "green"} compact />
              <div>
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </div>
              <ArrowRight size={15} />
            </Link>
          ))
        ) : (
          <div className="activity-empty"><CheckCircle2 size={17} /> {empty}</div>
        )}
      </div>
    </article>
  )
}

function KPIPlaceholder({ label }: { label: string }) {
  return (
    <article className="home-kpi-mini-card">
      <div>
        <SignalLight tone="neutral" compact />
        <span>{label}</span>
      </div>
      <strong>—</strong>
      <small>Sin conexión</small>
    </article>
  )
}

function dedupeActivities(items: ActivityItem[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}
