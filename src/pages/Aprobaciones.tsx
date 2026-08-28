import {
  useMemo,
  useState,
  type KeyboardEvent,
} from "react"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Hourglass,
  Search,
} from "lucide-react"

import { useNavigate } from "react-router-dom"

import "./Aprobaciones.css"

import {
  mockProcessAssignments,
  mockRequests,
} from "../data/mockData"

import {
  canApproveRequest,
  canManageRequest,
  canViewRequest,
} from "../services/permissions"

import type {
  RequestItem,
  RequestStatus,
  SLAStatus,
  UserScope,
} from "../types"


type ApprovalView =
  | "POR_APROBAR"
  | "EN_GESTION"
  | "POR_CONFIRMAR"
  | "FUERA_SLA"
  | "TODAS"


type SLAInfo = {
  status: SLAStatus
  label: string
  detail: string
  percentage?: number
  sortPriority: number
}


export default function Aprobaciones({
  currentUser,
}: {
  currentUser: UserScope
}) {
  const navigate = useNavigate()

  const [view, setView] =
    useState<ApprovalView>("POR_APROBAR")

  const [search, setSearch] =
    useState("")

  const [localFilter, setLocalFilter] =
    useState("TODOS")

  const [processFilter, setProcessFilter] =
    useState("TODOS")

  const [statusFilter, setStatusFilter] =
    useState("TODOS")


  // ======================================================
  // SOLICITUDES VISIBLES PARA ESTE USUARIO
  // ======================================================

  const accessibleRequests = useMemo(() => {
    return mockRequests.filter((request) => {
      const canView = canViewRequest(
        currentUser,
        request,
        mockProcessAssignments
      )

      const canApprove = canApproveRequest(
        currentUser,
        request,
        mockProcessAssignments
      )

      const canManage = canManageRequest(
        currentUser,
        request,
        mockProcessAssignments
      )

      return canView && (canApprove || canManage)
    })
  }, [currentUser])


  // ======================================================
  // MÉTRICAS
  // ======================================================

  const metrics = useMemo(() => {
    const approvalPending =
      accessibleRequests.filter(
        (request) =>
          request.status ===
            "PENDIENTE_APROBACION" ||
          request.status ===
            "INFORMACION_REQUERIDA"
      )

    const inManagement =
      accessibleRequests.filter(
        (request) =>
          request.status ===
          "EN_GESTION"
      )

    const waitingConfirmation =
      accessibleRequests.filter(
        (request) =>
          request.status ===
          "RESUELTA_POR_CONFIRMAR"
      )

    const outsideSLA =
      accessibleRequests.filter(
        (request) =>
          getRequestSLA(request).status ===
          "FUERA_DE_SLA"
      )

    const nearSLA =
      accessibleRequests.filter(
        (request) =>
          getRequestSLA(request).status ===
          "PROXIMO_A_VENCER"
      )

    return {
      approvalPending:
        approvalPending.length,

      inManagement:
        inManagement.length,

      waitingConfirmation:
        waitingConfirmation.length,

      outsideSLA:
        outsideSLA.length,

      nearSLA:
        nearSLA.length,
    }
  }, [accessibleRequests])


  // ======================================================
  // OPCIONES DE FILTRO
  // ======================================================

  const locals = useMemo(
    () =>
      Array.from(
        new Set(
          accessibleRequests.map(
            (request) => request.local
          )
        )
      ).sort(),
    [accessibleRequests]
  )


  const processes = useMemo(
    () =>
      Array.from(
        new Set(
          accessibleRequests.map(
            (request) =>
              request.processName
          )
        )
      ).sort(),
    [accessibleRequests]
  )


  // ======================================================
  // FILTRADO + ORDEN
  // ======================================================

  const filteredRequests = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase()

    return accessibleRequests
      .filter((request) => {
        if (
          view === "POR_APROBAR" &&
          request.status !==
            "PENDIENTE_APROBACION" &&
          request.status !==
            "INFORMACION_REQUERIDA"
        ) {
          return false
        }

        if (
          view === "EN_GESTION" &&
          request.status !== "EN_GESTION"
        ) {
          return false
        }

        if (
          view === "POR_CONFIRMAR" &&
          request.status !==
            "RESUELTA_POR_CONFIRMAR"
        ) {
          return false
        }

        if (
          view === "FUERA_SLA" &&
          getRequestSLA(request).status !==
            "FUERA_DE_SLA"
        ) {
          return false
        }

        if (
          localFilter !== "TODOS" &&
          request.local !== localFilter
        ) {
          return false
        }

        if (
          processFilter !== "TODOS" &&
          request.processName !==
            processFilter
        ) {
          return false
        }

        if (
          statusFilter !== "TODOS" &&
          request.status !== statusFilter
        ) {
          return false
        }

        if (normalizedSearch) {
          const searchable = [
            request.id,
            request.processName,
            request.local,
            request.requesterName,
            request.currentResponsibleName ??
              "",
          ]
            .join(" ")
            .toLowerCase()

          if (
            !searchable.includes(
              normalizedSearch
            )
          ) {
            return false
          }
        }

        return true
      })
      .sort(sortRequests)
  }, [
    accessibleRequests,
    view,
    localFilter,
    processFilter,
    statusFilter,
    search,
  ])


  // ======================================================
  // ABRIR FILA
  // ======================================================

  function openRequest(
    request: RequestItem
  ) {
    navigate(
      `/solicitudes/${request.id}`
    )
  }


  function handleRowKey(
    event: KeyboardEvent<HTMLTableRowElement>,
    request: RequestItem
  ) {
    if (
      event.key === "Enter" ||
      event.key === " "
    ) {
      event.preventDefault()
      openRequest(request)
    }
  }


  return (
    <div className="approvals-page">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="page-head inline">

        <div>
          <div className="eyebrow">
            GESTIÓN
          </div>

          <h1>
            Aprobaciones
          </h1>

          <p>
            Revisa solicitudes pendientes,
            gestiones activas y cumplimiento
            de SLA.
          </p>
        </div>

      </div>


      {/* ==================================================
          INDICADORES
      ================================================== */}

      <div className="approval-metrics">

        <MetricCard
          label="Por aprobar"
          value={metrics.approvalPending}
          icon={Hourglass}
          active={view === "POR_APROBAR"}
          onClick={() =>
            setView("POR_APROBAR")
          }
        />

        <MetricCard
          label="Próximas a vencer"
          value={metrics.nearSLA}
          icon={Clock3}
          tone="warning"
          onClick={() =>
            setView("TODAS")
          }
        />

        <MetricCard
          label="Fuera de SLA"
          value={metrics.outsideSLA}
          icon={AlertTriangle}
          tone="danger"
          active={view === "FUERA_SLA"}
          onClick={() =>
            setView("FUERA_SLA")
          }
        />

        <MetricCard
          label="En gestión"
          value={metrics.inManagement}
          icon={Clock3}
          active={view === "EN_GESTION"}
          onClick={() =>
            setView("EN_GESTION")
          }
        />

        <MetricCard
          label="Por confirmar"
          value={
            metrics.waitingConfirmation
          }
          icon={CheckCircle2}
          active={
            view === "POR_CONFIRMAR"
          }
          onClick={() =>
            setView("POR_CONFIRMAR")
          }
        />

      </div>


      {/* ==================================================
          PESTAÑAS
      ================================================== */}

      <div className="approval-tabs">

        <ApprovalTab
          active={view === "POR_APROBAR"}
          label="Por aprobar"
          onClick={() =>
            setView("POR_APROBAR")
          }
        />

        <ApprovalTab
          active={view === "EN_GESTION"}
          label="En gestión"
          onClick={() =>
            setView("EN_GESTION")
          }
        />

        <ApprovalTab
          active={
            view === "POR_CONFIRMAR"
          }
          label="Por confirmar"
          onClick={() =>
            setView("POR_CONFIRMAR")
          }
        />

        <ApprovalTab
          active={view === "FUERA_SLA"}
          label="Fuera de SLA"
          onClick={() =>
            setView("FUERA_SLA")
          }
        />

        <ApprovalTab
          active={view === "TODAS"}
          label="Todas"
          onClick={() =>
            setView("TODAS")
          }
        />

      </div>


      {/* ==================================================
          FILTROS
      ================================================== */}

      <div className="approval-toolbar">

        <div className="approval-search">

          <Search size={17} />

          <input
            type="search"
            value={search}
            placeholder="Buscar solicitud, local o solicitante..."
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

        </div>


        <div className="approval-filter-icon">
          <Filter size={16} />
        </div>


        <select
          value={localFilter}
          onChange={(event) =>
            setLocalFilter(
              event.target.value
            )
          }
        >
          <option value="TODOS">
            Todos los locales
          </option>

          {locals.map((local) => (
            <option
              key={local}
              value={local}
            >
              {local}
            </option>
          ))}
        </select>


        <select
          value={processFilter}
          onChange={(event) =>
            setProcessFilter(
              event.target.value
            )
          }
        >
          <option value="TODOS">
            Todos los procesos
          </option>

          {processes.map((process) => (
            <option
              key={process}
              value={process}
            >
              {process}
            </option>
          ))}
        </select>


        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="TODOS">
            Todos los estados
          </option>

          <option value="PENDIENTE_APROBACION">
            Pendiente de aprobación
          </option>

          <option value="INFORMACION_REQUERIDA">
            Información requerida
          </option>

          <option value="EN_GESTION">
            En gestión
          </option>

          <option value="RESUELTA_POR_CONFIRMAR">
            Por confirmar
          </option>

          <option value="RESUELTA">
            Resuelta
          </option>

          <option value="RECHAZADA">
            Rechazada
          </option>
        </select>

      </div>


      {/* ==================================================
          TABLA ESCRITORIO
      ================================================== */}

      <div className="approval-table-wrap">

        <table className="approval-table">

          <thead>
            <tr>
              <th>Solicitud</th>
              <th>Local</th>
              <th>Solicitante</th>
              <th>Recibida</th>
              <th>Responsable actual</th>
              <th>SLA</th>
              <th>Estado</th>
              <th />
            </tr>
          </thead>


          <tbody>

            {filteredRequests.map(
              (request) => {
                const sla =
                  getRequestSLA(request)

                return (
                  <tr
                    key={request.id}
                    tabIndex={0}
                    role="button"
                    onClick={() =>
                      openRequest(request)
                    }
                    onKeyDown={(event) =>
                      handleRowKey(
                        event,
                        request
                      )
                    }
                  >

                    <td>
                      <div className="approval-request-main">

                        <strong>
                          {request.processName}
                        </strong>

                        <span>
                          {request.id}
                        </span>

                      </div>
                    </td>


                    <td>
                      {request.local}
                    </td>


                    <td>
                      {request.requesterName}
                    </td>


                    <td>
                      {formatReceivedDate(
                        request.createdAt
                      )}
                    </td>


                    <td>
                      {request.currentResponsibleName ??
                        "—"}
                    </td>


                    <td>
                      <SLABadge sla={sla} />
                    </td>


                    <td>
                      <RequestStatusBadge
                        status={request.status}
                        reopened={
                          request.reopened
                        }
                      />
                    </td>


                    <td className="approval-row-arrow">
                      <ChevronRight
                        size={17}
                      />
                    </td>

                  </tr>
                )
              }
            )}

          </tbody>

        </table>


        {!filteredRequests.length && (
          <div className="approval-empty">

            <CheckCircle2 size={28} />

            <strong>
              No hay solicitudes
            </strong>

            <span>
              No encontramos solicitudes
              para los filtros seleccionados.
            </span>

          </div>
        )}

      </div>


      {/* ==================================================
          TARJETAS MÓVIL
      ================================================== */}

      <div className="approval-mobile-list">

        {filteredRequests.map(
          (request) => {
            const sla =
              getRequestSLA(request)

            return (
              <button
                key={request.id}
                className="approval-mobile-card"
                onClick={() =>
                  openRequest(request)
                }
              >

                <div className="approval-mobile-top">

                  <div>
                    <small>
                      {request.id}
                    </small>

                    <strong>
                      {request.processName}
                    </strong>
                  </div>

                  <SLABadge sla={sla} />

                </div>


                <div className="approval-mobile-info">

                  <div>
                    <span>Local</span>
                    <strong>
                      {request.local}
                    </strong>
                  </div>

                  <div>
                    <span>Solicitante</span>
                    <strong>
                      {request.requesterName}
                    </strong>
                  </div>

                  <div>
                    <span>Recibida</span>
                    <strong>
                      {formatReceivedDate(
                        request.createdAt
                      )}
                    </strong>
                  </div>

                </div>


                <div className="approval-mobile-foot">

                  <RequestStatusBadge
                    status={request.status}
                    reopened={
                      request.reopened
                    }
                  />

                  <span>
                    Ver solicitud
                    <ChevronRight
                      size={15}
                    />
                  </span>

                </div>

              </button>
            )
          }
        )}

      </div>

    </div>
  )
}


// ======================================================
// TARJETA MÉTRICA
// ======================================================

function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  active = false,
  onClick,
}: {
  label: string
  value: number
  icon: typeof Clock3
  tone?: "default" | "warning" | "danger"
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      className={[
        "approval-metric",
        `approval-metric-${tone}`,
        active
          ? "approval-metric-active"
          : "",
      ].join(" ")}
      onClick={onClick}
    >

      <div className="approval-metric-icon">
        <Icon size={18} />
      </div>

      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>

    </button>
  )
}


// ======================================================
// TAB
// ======================================================

function ApprovalTab({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={
        active
          ? "approval-tab active"
          : "approval-tab"
      }
      onClick={onClick}
    >
      {label}
    </button>
  )
}


// ======================================================
// SLA
// ======================================================

function getRequestSLA(
  request: RequestItem
): SLAInfo {
  const now = new Date().getTime()


  // ------------------------------------------------------
  // CONFIRMACIÓN DE RESOLUCIÓN
  // ------------------------------------------------------

  if (
    request.status ===
      "RESUELTA_POR_CONFIRMAR" &&
    request.resolutionConfirmationDeadline
  ) {
    const deadline =
      new Date(
        request.resolutionConfirmationDeadline
      ).getTime()

    const remaining =
      deadline - now

    if (remaining <= 0) {
      return {
        status: "FUERA_DE_SLA",
        label: "Confirmación vencida",
        detail:
          "Pendiente de cierre automático",
        percentage: 100,
        sortPriority: 0,
      }
    }

    return {
      status: "EN_PLAZO",
      label: formatRemainingTime(
        remaining
      ),
      detail:
        "Plazo de confirmación",
      sortPriority: 3,
    }
  }


  // ------------------------------------------------------
  // SLA RESOLUCIÓN
  // ------------------------------------------------------

  if (
    (
      request.status === "APROBADA" ||
      request.status ===
        "APROBADA_CON_AJUSTE" ||
      request.status === "EN_GESTION"
    ) &&
    request.resolutionSLAHours &&
    request.resolutionSLAStartedAt
  ) {
    return calculateSLA(
      request.resolutionSLAStartedAt,
      request.resolutionSLAHours,
      0,
      undefined
    )
  }


  // ------------------------------------------------------
  // SLA APROBACIÓN
  // ------------------------------------------------------

  if (
    request.status ===
      "INFORMACION_REQUERIDA"
  ) {
    if (
      !request.approvalSLAStartedAt
    ) {
      return {
        status: "NO_INICIADO",
        label: "Sin iniciar",
        detail:
          "Esperando información",
        sortPriority: 5,
      }
    }

    return {
      status: "PAUSADO",
      label: "Pausado",
      detail:
        "Esperando información",
      sortPriority: 4,
    }
  }


  if (
    request.status ===
      "PENDIENTE_APROBACION" &&
    request.approvalSLAHours &&
    request.approvalSLAStartedAt
  ) {
    return calculateSLA(
      request.approvalSLAStartedAt,
      request.approvalSLAHours,
      request.approvalSLAPausedMinutes,
      request.approvalSLAPausedAt
    )
  }


  if (
    request.status ===
      "PENDIENTE_APROBACION" &&
    !request.approvalSLAHours
  ) {
    return {
      status: "NO_INICIADO",
      label: "Por definir",
      detail:
        "SLA no configurado",
      sortPriority: 5,
    }
  }


  return {
    status: "FINALIZADO",
    label: "—",
    detail: "",
    sortPriority: 6,
  }
}


function calculateSLA(
  startedAt: string,
  slaHours: number,
  pausedMinutes: number,
  pausedAt?: string
): SLAInfo {
  const start =
    new Date(startedAt).getTime()

  const now =
    new Date().getTime()

  const totalSLA =
    slaHours * 60 * 60 * 1000

  let totalPaused =
    pausedMinutes * 60 * 1000

  if (pausedAt) {
    totalPaused +=
      Math.max(
        0,
        now -
          new Date(pausedAt).getTime()
      )
  }

  const elapsed =
    Math.max(
      0,
      now - start - totalPaused
    )

  const percentage =
    totalSLA > 0
      ? elapsed / totalSLA
      : 0

  const remaining =
    totalSLA - elapsed


  if (percentage >= 1) {
    return {
      status: "FUERA_DE_SLA",
      label: "Vencido",
      detail:
        `${formatElapsedTime(
          Math.abs(remaining)
        )} fuera de SLA`,
      percentage: 100,
      sortPriority: 0,
    }
  }


  if (percentage >= 0.75) {
    return {
      status:
        "PROXIMO_A_VENCER",
      label:
        formatRemainingTime(
          remaining
        ),
      detail: `${Math.round(
        percentage * 100
      )}% utilizado`,
      percentage:
        percentage * 100,
      sortPriority: 1,
    }
  }


  return {
    status: "EN_PLAZO",
    label:
      formatRemainingTime(
        remaining
      ),
    detail: `${Math.round(
      percentage * 100
    )}% utilizado`,
    percentage:
      percentage * 100,
    sortPriority: 2,
  }
}


// ======================================================
// ORDEN
// ======================================================
//
// 1. Fuera de SLA
// 2. Próximas a vencer
// 3. En plazo
// 4. Pausadas
// 5. Sin SLA iniciado/configurado
//
// Dentro de cada grupo:
// la más antigua primero.
// ======================================================

function sortRequests(
  a: RequestItem,
  b: RequestItem
) {
  const slaA =
    getRequestSLA(a)

  const slaB =
    getRequestSLA(b)

  if (
    slaA.sortPriority !==
    slaB.sortPriority
  ) {
    return (
      slaA.sortPriority -
      slaB.sortPriority
    )
  }

  return (
    new Date(a.createdAt).getTime() -
    new Date(b.createdAt).getTime()
  )
}


// ======================================================
// BADGE SLA
// ======================================================

function SLABadge({
  sla,
}: {
  sla: SLAInfo
}) {
  const className = {
    NO_INICIADO:
      "sla-neutral",

    EN_PLAZO:
      "sla-ok",

    PROXIMO_A_VENCER:
      "sla-warning",

    FUERA_DE_SLA:
      "sla-danger",

    PAUSADO:
      "sla-paused",

    FINALIZADO:
      "sla-neutral",
  }[sla.status]


  return (
    <div
      className={`approval-sla ${className}`}
      title={sla.detail}
    >
      <span>
        {sla.label}
      </span>

      {sla.percentage !==
        undefined && (
        <div className="approval-sla-bar">
          <i
            style={{
              width: `${Math.min(
                100,
                Math.max(
                  0,
                  sla.percentage
                )
              )}%`,
            }}
          />
        </div>
      )}
    </div>
  )
}


// ======================================================
// BADGE ESTADO
// ======================================================

function RequestStatusBadge({
  status,
  reopened,
}: {
  status: RequestStatus
  reopened: boolean
}) {
  const labels: Record<
    RequestStatus,
    string
  > = {
    RECIBIDA:
      "Recibida",

    INFORMACION_REQUERIDA:
      "Información requerida",

    PENDIENTE_APROBACION:
      "Por aprobar",

    APROBADA:
      "Aprobada",

    APROBADA_CON_AJUSTE:
      "Aprobada con ajuste",

    EN_GESTION:
      "En gestión",

    RESUELTA_POR_CONFIRMAR:
      "Por confirmar",

    RESUELTA:
      "Resuelta",

    RECHAZADA:
      "Rechazada",
  }


  const statusClass: Record<
    RequestStatus,
    string
  > = {
    RECIBIDA:
      "approval-status-neutral",

    INFORMACION_REQUERIDA:
      "approval-status-info",

    PENDIENTE_APROBACION:
      "approval-status-pending",

    APROBADA:
      "approval-status-approved",

    APROBADA_CON_AJUSTE:
      "approval-status-approved",

    EN_GESTION:
      "approval-status-management",

    RESUELTA_POR_CONFIRMAR:
      "approval-status-confirm",

    RESUELTA:
      "approval-status-resolved",

    RECHAZADA:
      "approval-status-rejected",
  }


  return (
    <div className="approval-status-wrap">

      {reopened && (
        <span className="approval-reopened">
          Reabierta
        </span>
      )}

      <span
        className={`approval-status ${statusClass[status]}`}
      >
        {labels[status]}
      </span>

    </div>
  )
}


// ======================================================
// FORMATO FECHAS / TIEMPO
// ======================================================

function formatReceivedDate(
  value: string
) {
  const date =
    new Date(value)

  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date)
}


function formatRemainingTime(
  milliseconds: number
) {
  if (milliseconds <= 0) {
    return "Vencido"
  }

  const totalMinutes =
    Math.floor(
      milliseconds /
        (1000 * 60)
    )

  const hours =
    Math.floor(
      totalMinutes / 60
    )

  const minutes =
    totalMinutes % 60

  if (hours >= 24) {
    const days =
      Math.floor(
        hours / 24
      )

    const remainingHours =
      hours % 24

    return `${days}d ${remainingHours}h`
  }

  return `${hours}h ${minutes}m`
}


function formatElapsedTime(
  milliseconds: number
) {
  const totalMinutes =
    Math.floor(
      milliseconds /
        (1000 * 60)
    )

  const hours =
    Math.floor(
      totalMinutes / 60
    )

  const minutes =
    totalMinutes % 60

  if (hours >= 24) {
    const days =
      Math.floor(
        hours / 24
      )

    const remainingHours =
      hours % 24

    return `${days}d ${remainingHours}h`
  }

  return `${hours}h ${minutes}m`
}
