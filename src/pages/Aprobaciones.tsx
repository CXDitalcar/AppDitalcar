import {
  useMemo,
  useState,
} from "react"

import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Filter,
  Inbox,
  Search,
} from "lucide-react"

import {
  useNavigate,
} from "react-router-dom"

import "./Aprobaciones.css"

import {
  mockProcessAssignments,
} from "../data/mockData"

import {
  getDemoRequests,
} from "../services/demoStore"

import {
  canApproveRequest,
  canManageRequest,
  canViewRequest,
} from "../services/permissions"

import {
  responsibleLabel,
  visibleStatusLabel,
} from "../services/requestPresentation"

import type {
  RequestItem,
  UserScope,
} from "../types"


type ManagementView =
  | "NUEVAS"
  | "POR_APROBAR"
  | "EN_GESTION"
  | "FALTA_INFO"
  | "POR_CONFIRMAR"
  | "SLA"
  | "TODAS"


function Aprobaciones({
  currentUser,
}: {
  currentUser: UserScope
}) {
  const navigate =
    useNavigate()

  const [
    view,
    setView,
  ] =
    useState<ManagementView>(
      "NUEVAS"
    )

  const [
    search,
    setSearch,
  ] =
    useState("")

  const [
    localFilter,
    setLocalFilter,
  ] =
    useState(
      "TODOS"
    )

  const [
    processFilter,
    setProcessFilter,
  ] =
    useState(
      "TODOS"
    )

  const requests =
    getDemoRequests()


  // ======================================================
  // SOLICITUDES ACCESIBLES
  // ======================================================

  const accessible =
    useMemo(
      () =>
        requests.filter(
          (request) => {
            if (
              !canViewRequest(
                currentUser,
                request,
                mockProcessAssignments
              )
            ) {
              return false
            }

            return (
              canApproveRequest(
                currentUser,
                request,
                mockProcessAssignments
              ) ||
              canManageRequest(
                currentUser,
                request,
                mockProcessAssignments
              ) ||
              (
                request.status ===
                  "RESUELTA_POR_CONFIRMAR" &&
                (
                  request.requesterEmail ===
                    currentUser.email ||
                  (
                    currentUser.role ===
                      "JEFATURA_LOCAL" &&
                    currentUser.local ===
                      request.local
                  )
                )
              )
            )
          }
        ),
      [
        currentUser,
        requests,
      ]
    )


  // ======================================================
  // KPI
  // ======================================================

  const metrics =
    useMemo(
      () => ({
        nuevas:
          accessible.filter(
            (request) =>
              request.status ===
              "RECIBIDA"
          ).length,

        aprobar:
          accessible.filter(
            (request) =>
              request.status ===
              "PENDIENTE_APROBACION"
          ).length,

        gestion:
          accessible.filter(
            (request) =>
              request.status ===
              "EN_GESTION"
          ).length,

        info:
          accessible.filter(
            (request) =>
              request.status ===
              "INFORMACION_REQUERIDA"
          ).length,

        confirmar:
          accessible.filter(
            (request) =>
              request.status ===
              "RESUELTA_POR_CONFIRMAR"
          ).length,

        sla:
          accessible.filter(
            (request) =>
              [
                "warning",
                "danger",
              ].includes(
                getSLA(
                  request
                ).tone
              )
          ).length,
      }),
      [
        accessible,
      ]
    )


  const locals =
    useMemo(
      () =>
        Array.from(
          new Set(
            accessible.map(
              (request) =>
                request.local
            )
          )
        ).sort(),
      [
        accessible,
      ]
    )


  const processes =
    useMemo(
      () =>
        Array.from(
          new Set(
            accessible.map(
              (request) =>
                request.processName
            )
          )
        ).sort(),
      [
        accessible,
      ]
    )


  // ======================================================
  // FILTRADO
  // ======================================================

  const filtered =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase()

        return accessible
          .filter(
            (request) => {
              if (
                view ===
                  "NUEVAS" &&
                request.status !==
                  "RECIBIDA"
              ) {
                return false
              }

              if (
                view ===
                  "POR_APROBAR" &&
                request.status !==
                  "PENDIENTE_APROBACION"
              ) {
                return false
              }

              if (
                view ===
                  "EN_GESTION" &&
                request.status !==
                  "EN_GESTION"
              ) {
                return false
              }

              if (
                view ===
                  "FALTA_INFO" &&
                request.status !==
                  "INFORMACION_REQUERIDA"
              ) {
                return false
              }

              if (
                view ===
                  "POR_CONFIRMAR" &&
                request.status !==
                  "RESUELTA_POR_CONFIRMAR"
              ) {
                return false
              }

              if (
                view ===
                  "SLA" &&
                ![
                  "warning",
                  "danger",
                ].includes(
                  getSLA(
                    request
                  ).tone
                )
              ) {
                return false
              }

              if (
                localFilter !==
                  "TODOS" &&
                request.local !==
                  localFilter
              ) {
                return false
              }

              if (
                processFilter !==
                  "TODOS" &&
                request.processName !==
                  processFilter
              ) {
                return false
              }

              if (
                query &&
                !`${request.id} ${request.processName} ${request.local} ${request.requesterName}`
                  .toLowerCase()
                  .includes(
                    query
                  )
              ) {
                return false
              }

              return true
            }
          )
          .sort(
            (
              a,
              b
            ) =>
              getSLA(
                a
              ).priority -
                getSLA(
                  b
                ).priority ||
              new Date(
                a.createdAt
              ).getTime() -
                new Date(
                  b.createdAt
                ).getTime()
          )
      },
      [
        accessible,
        view,
        search,
        localFilter,
        processFilter,
      ]
    )


  return (
    <div className="approvals-page">

      <div className="page-head inline">

        <div>

          <div className="eyebrow">
            SOLICITUDES
          </div>

          <h1>
            Bandeja de gestión
          </h1>

          <p>
            Nuevas, aprobaciones,
            gestiones, información
            pendiente y SLA en una
            sola vista.
          </p>

        </div>

      </div>


      <div className="approval-metrics">

        <Metric
          label="Nuevas"
          value={
            metrics.nuevas
          }
          icon={
            Inbox
          }
          active={
            view ===
            "NUEVAS"
          }
          onClick={() =>
            setView(
              "NUEVAS"
            )
          }
        />

        <Metric
          label="Por aprobar"
          value={
            metrics.aprobar
          }
          icon={
            Clock3
          }
          active={
            view ===
            "POR_APROBAR"
          }
          onClick={() =>
            setView(
              "POR_APROBAR"
            )
          }
        />

        <Metric
          label="En gestión"
          value={
            metrics.gestion
          }
          icon={
            Clock3
          }
          active={
            view ===
            "EN_GESTION"
          }
          onClick={() =>
            setView(
              "EN_GESTION"
            )
          }
        />

        <Metric
          label="Falta información"
          value={
            metrics.info
          }
          icon={
            AlertTriangle
          }
          active={
            view ===
            "FALTA_INFO"
          }
          onClick={() =>
            setView(
              "FALTA_INFO"
            )
          }
        />

        <Metric
          label="Por confirmar"
          value={
            metrics.confirmar
          }
          icon={
            CheckCircle2
          }
          active={
            view ===
            "POR_CONFIRMAR"
          }
          onClick={() =>
            setView(
              "POR_CONFIRMAR"
            )
          }
        />

        <Metric
          label="Por vencer / vencidas"
          value={
            metrics.sla
          }
          icon={
            AlertTriangle
          }
          tone="danger"
          active={
            view ===
            "SLA"
          }
          onClick={() =>
            setView(
              "SLA"
            )
          }
        />

      </div>


      <div className="approval-tabs">

        {(
          [
            "NUEVAS",
            "POR_APROBAR",
            "EN_GESTION",
            "FALTA_INFO",
            "POR_CONFIRMAR",
            "SLA",
            "TODAS",
          ] as ManagementView[]
        ).map(
          (item) => (
            <button
              key={
                item
              }
              className={
                view === item
                  ? "approval-tab active"
                  : "approval-tab"
              }
              onClick={() =>
                setView(
                  item
                )
              }
            >
              {tabLabel(
                item
              )}
            </button>
          )
        )}

      </div>


      <div className="approval-toolbar">

        <div className="approval-search">

          <Search
            size={17}
          />

          <input
            value={
              search
            }
            onChange={(
              event
            ) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Buscar solicitud, local o solicitante..."
          />

        </div>


        <div className="approval-filter-icon">
          <Filter
            size={16}
          />
        </div>


        <select
          value={
            localFilter
          }
          onChange={(
            event
          ) =>
            setLocalFilter(
              event.target.value
            )
          }
        >
          <option value="TODOS">
            Todos los locales
          </option>

          {locals.map(
            (local) => (
              <option
                key={
                  local
                }
                value={
                  local
                }
              >
                {local}
              </option>
            )
          )}
        </select>


        <select
          value={
            processFilter
          }
          onChange={(
            event
          ) =>
            setProcessFilter(
              event.target.value
            )
          }
        >
          <option value="TODOS">
            Todos los procesos
          </option>

          {processes.map(
            (process) => (
              <option
                key={
                  process
                }
                value={
                  process
                }
              >
                {process}
              </option>
            )
          )}
        </select>

      </div>


      <div className="approval-table-wrap">

        <table className="approval-table">

          <thead>

            <tr>

              <th>
                Solicitud
              </th>

              <th>
                Local
              </th>

              <th>
                Solicitante
              </th>

              <th>
                Ingresada
              </th>

              <th>
                Responsable
              </th>

              <th>
                SLA
              </th>

              <th>
                Estado
              </th>

              <th />

            </tr>

          </thead>


          <tbody>

            {filtered.map(
              (
                request
              ) => (
                <tr
                  key={
                    request.id
                  }
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    navigate(
                      `/solicitudes/${request.id}`
                    )
                  }
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      navigate(
                        `/solicitudes/${request.id}`
                      )
                    }
                  }}
                >

                  <td>

                    <div className="approval-request-main">

                      <strong>
                        {
                          request.processName
                        }
                      </strong>

                      <span>
                        {
                          request.id
                        }
                      </span>

                    </div>

                  </td>


                  <td>
                    {
                      request.local
                    }
                  </td>


                  <td>
                    {
                      request.requesterName
                    }
                  </td>


                  <td>
                    {new Date(
                      request.createdAt
                    ).toLocaleDateString(
                      "es-CL"
                    )}
                  </td>


                  <td>
                    {responsibleLabel(
                      currentUser,
                      request
                    )}
                  </td>


                  <td>

                    <span
                      className={`sla-badge sla-${
                        getSLA(
                          request
                        ).tone
                      }`}
                    >
                      {
                        getSLA(
                          request
                        ).label
                      }
                    </span>

                  </td>


                  <td>

                    <span className="status neutral">
                      {visibleStatusLabel(
                        request
                      )}
                    </span>

                  </td>


                  <td className="approval-row-arrow">

                    <ChevronRight
                      size={17}
                    />

                  </td>

                </tr>
              )
            )}

          </tbody>

        </table>


        {!filtered.length && (
          <div className="approval-empty">

            <CheckCircle2
              size={28}
            />

            <strong>
              Sin pendientes en esta vista
            </strong>

            <span>
              Cambia de pestaña o filtros
              para revisar otras gestiones.
            </span>

          </div>
        )}

      </div>

    </div>
  )
}


// ======================================================
// MÉTRICA
// ======================================================

function Metric({
  label,
  value,
  icon: Icon,
  active,
  onClick,
  tone,
}: {
  label: string
  value: number
  icon: typeof Inbox
  active?: boolean
  onClick: () => void
  tone?: "danger"
}) {
  return (
    <button
      className={`approval-metric ${
        active
          ? "active"
          : ""
      } ${
        tone
          ? `metric-${tone}`
          : ""
      }`}
      onClick={
        onClick
      }
    >

      <Icon
        size={18}
      />

      <div>

        <strong>
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </button>
  )
}


// ======================================================
// ETIQUETA DE PESTAÑA
// ======================================================

function tabLabel(
  value: ManagementView
) {
  const labels:
    Record<
      ManagementView,
      string
    > = {
      NUEVAS:
        "Nuevas",

      POR_APROBAR:
        "Por aprobar",

      EN_GESTION:
        "En gestión",

      FALTA_INFO:
        "Falta información",

      POR_CONFIRMAR:
        "Por confirmar",

      SLA:
        "SLA",

      TODAS:
        "Todas",
    }

  return labels[
    value
  ]
}


// ======================================================
// SLA
// ======================================================

function getSLA(
  request: RequestItem
): {
  label: string

  tone:
    | "ok"
    | "warning"
    | "danger"
    | "paused"
    | "neutral"

  priority: number
} {
  if (
    request.slaPausedReason
  ) {
    return {
      label:
        "En pausa",

      tone:
        "paused",

      priority:
        2,
    }
  }


  if (
    request.status ===
      "RESUELTA" ||
    request.status ===
      "RECHAZADA"
  ) {
    return {
      label:
        "Finalizado",

      tone:
        "neutral",

      priority:
        5,
    }
  }


  let hours:
    number |
    undefined

  let started:
    string |
    undefined


  if (
    request.status ===
    "RECIBIDA"
  ) {
    hours =
      request.acceptanceSLAHours

    started =
      request.acceptanceSLAStartedAt
  }


  if (
    request.status ===
    "PENDIENTE_APROBACION"
  ) {
    hours =
      request.approvalSLAHours

    started =
      request.approvalSLAStartedAt
  }


  if (
    request.status ===
    "EN_GESTION"
  ) {
    hours =
      request.resolutionSLAHours

    started =
      request.resolutionSLAStartedAt
  }


  if (
    !hours ||
    !started
  ) {
    return {
      label:
        "A tiempo",

      tone:
        "ok",

      priority:
        3,
    }
  }


  const startDate =
    new Date(
      started
    )


  const due =
    hours === 24
      ? addBusinessDays(
          startDate,
          1
        )
      : new Date(
          startDate.getTime() +
            hours *
              3600000
        )


  const remaining =
    (
      due.getTime() -
      Date.now()
    ) /
    3600000


  if (
    remaining <= 0
  ) {
    return {
      label:
        "Vencida",

      tone:
        "danger",

      priority:
        0,
    }
  }


  if (
    remaining <= 6
  ) {
    return {
      label:
        "Por vencer",

      tone:
        "warning",

      priority:
        1,
    }
  }


  return {
    label:
      "A tiempo",

    tone:
      "ok",

    priority:
      3,
  }
}


// ======================================================
// DÍAS HÁBILES
// ======================================================

function addBusinessDays(
  date: Date,
  days: number
) {
  const result =
    new Date(
      date
    )

  let added =
    0


  while (
    added < days
  ) {
    result.setDate(
      result.getDate() +
        1
    )

    const day =
      result.getDay()

    if (
      day !== 0 &&
      day !== 6
    ) {
      added += 1
    }
  }


  return result
}


// ======================================================
// EXPORT DEFAULT EXPLÍCITO
// ======================================================

export default Aprobaciones
