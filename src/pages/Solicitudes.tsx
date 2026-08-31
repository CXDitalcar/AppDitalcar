import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  AlertCircle,
  Plus,
  RefreshCcw,
  Search,
} from "lucide-react"

import {
  Link,
  useNavigate,
} from "react-router-dom"

import {
  getSolicitudes,
  type Solicitud,
} from "../services/graph"

import {
  getDemoRequests,
} from "../services/demoStore"

import {
  mockProcessAssignments,
} from "../data/mockData"

import {
  canViewRequest,
} from "../services/permissions"

import type {
  RequestItem,
  UserScope,
} from "../types"

import StatusBadge from "../components/StatusBadge"


function pick(
  fields: Record<string, any>,
  names: string[]
) {
  for (
    const name of names
  ) {
    if (
      fields[name] !==
        undefined &&
      fields[name] !== null
    ) {
      return fields[name]
    }
  }


  return ""
}


export default function Solicitudes({
  branch,
  currentUser,
  demoMode,
}: {
  branch: string
  currentUser: UserScope
  demoMode: boolean
}) {
  const navigate =
    useNavigate()


  const [
    rows,
    setRows,
  ] =
    useState<Solicitud[]>([])


  const [
    demoRows,
    setDemoRows,
  ] =
    useState<RequestItem[]>([])


  const [
    loading,
    setLoading,
  ] =
    useState(
      !demoMode
    )


  const [
    error,
    setError,
  ] =
    useState("")


  const [
    query,
    setQuery,
  ] =
    useState("")


  async function load() {
    setError("")


    if (
      demoMode
    ) {
      setDemoRows(
        getDemoRequests()
      )

      setLoading(
        false
      )

      return
    }


    setLoading(
      true
    )


    try {
      setRows(
        await getSolicitudes()
      )
    } catch (
      e: any
    ) {
      setError(
        e?.message ||
        "No fue posible cargar las solicitudes."
      )
    } finally {
      setLoading(
        false
      )
    }
  }


  useEffect(
    () => {
      load()
    },
    [
      demoMode,
    ]
  )


  // ======================================================
  // DEMO
  // ======================================================

  const visibleDemo =
    useMemo(
      () => {
        const q =
          query
            .trim()
            .toLowerCase()


        return demoRows
          .filter(
            (request) =>
              canViewRequest(
                currentUser,
                request,
                mockProcessAssignments
              )
          )
          .filter(
            (request) =>
              !q ||
              `${request.id} ${request.processName} ${request.local} ${request.requesterName} ${request.status}`
                .toLowerCase()
                .includes(
                  q
                )
          )
          .sort(
            (a, b) =>
              new Date(
                b.createdAt
              ).getTime() -
              new Date(
                a.createdAt
              ).getTime()
          )
      },
      [
        demoRows,
        query,
        currentUser,
      ]
    )


  // ======================================================
  // LIVE
  // ======================================================

  const filteredLive =
    useMemo(
      () => {
        const q =
          query
            .toLowerCase()
            .trim()


        return rows.filter(
          (row) => {
            const f =
              row.fields


            const local =
              String(
                pick(
                  f,
                  [
                    "Local",
                    "local",
                    "Sucursal",
                    "Sucursal0",
                  ]
                )
              )


            const solicitud =
              String(
                pick(
                  f,
                  [
                    "Solicitud",
                    "Title",
                    "Title0",
                  ]
                )
              )


            const estado =
              String(
                pick(
                  f,
                  [
                    "EstadoFlujo",
                    "Estado",
                    "Status",
                  ]
                )
              )


            const area =
              String(
                pick(
                  f,
                  [
                    "_x00c1_rearesponsable",
                    "Area_x0020_responsable",
                    "Área responsable",
                    "AreaResponsable",
                  ]
                )
              )


            const matchesBranch =
              branch ===
                "Red Ditalcar" ||
              !branch ||
              !local ||
              local
                .toLowerCase()
                .includes(
                  branch.toLowerCase()
                )


            const matchesQuery =
              !q ||
              `${solicitud} ${estado} ${area} ${local}`
                .toLowerCase()
                .includes(
                  q
                )


            return (
              matchesBranch &&
              matchesQuery
            )
          }
        )
      },
      [
        rows,
        query,
        branch,
      ]
    )


  return (
    <div className="requests-page-pilot">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="page-head inline">

        <div>

          <span className="eyebrow">
            SOLICITUDES
          </span>


          <h1>
            Seguimiento
          </h1>


          <p>
            {demoMode
              ? "Piloto interactivo · flujo por rol y SLA"
              : "Fuente: SharePoint · Tablero General Solicitudes"}
          </p>

        </div>


        <div className="request-head-actions">

          <button
            className="secondary-btn"
            onClick={
              load
            }
          >
            <RefreshCcw
              size={17}
            />

            Actualizar
          </button>


          <Link
            className="primary-btn"
            to="/solicitudes/nueva"
          >
            <Plus
              size={17}
            />

            Nueva solicitud
          </Link>

        </div>

      </div>


      {/* ==================================================
          BUSCADOR
      ================================================== */}

      <div className="toolbar">

        <Search
          size={18}
        />


        <input
          value={
            query
          }
          onChange={
            (
              event
            ) =>
              setQuery(
                event.target.value
              )
          }
          placeholder="Buscar solicitud, local, proceso o estado..."
        />

      </div>


      {/* ==================================================
          ESTADOS
      ================================================== */}

      {loading && (
        <div className="empty">
          Cargando solicitudes…
        </div>
      )}


      {error && (
        <div className="error-box">

          <AlertCircle />


          <div>

            <strong>
              No se pudieron cargar
              las solicitudes
            </strong>


            <span>
              {
                error
              }
            </span>

          </div>

        </div>
      )}


      {/* ==================================================
          DEMO
      ================================================== */}

      {demoMode ? (
        <div className="requests-grid">

          {visibleDemo.map(
            (request) => (
              <button
                className="request-card request-card-button"
                key={
                  request.id
                }
                onClick={() =>
                  navigate(
                    `/solicitudes/${request.id}`
                  )
                }
              >

                <div className="request-top">

                  <PilotStatus
                    value={
                      request.status
                    }
                  />


                  <span>
                    #
                    {
                      request.id
                    }
                  </span>

                </div>


                <h3>
                  {
                    request.processName
                  }
                </h3>


                <div className="request-meta">

                  <span>
                    {
                      request.local
                    }
                  </span>


                  <span>
                    {
                      request.requesterName
                    }
                  </span>


                  <span>
                    {
                      request.currentResponsibleName ||
                      "Por asignar"
                    }
                  </span>

                </div>


                {request.slaPausedReason && (
                  <div className="request-paused">
                    SLA pausado ·{" "}
                    {
                      request.slaPausedReason
                    }
                  </div>
                )}


                <div className="request-foot">

                  <small>
                    {new Date(
                      request.createdAt
                    ).toLocaleDateString(
                      "es-CL"
                    )}
                  </small>

                </div>

              </button>
            )
          )}

        </div>
      ) : (
        <div className="requests-grid">

          {!loading &&
            !error &&
            filteredLive.map(
              ({
                id,
                fields,
              }) => {
                const title =
                  String(
                    pick(
                      fields,
                      [
                        "Solicitud",
                        "Title",
                        "Title0",
                      ]
                    )
                  ) ||
                  `Solicitud #${id}`


                const status =
                  String(
                    pick(
                      fields,
                      [
                        "EstadoFlujo",
                        "Estado",
                        "Status",
                      ]
                    )
                  )


                const area =
                  String(
                    pick(
                      fields,
                      [
                        "_x00c1_rearesponsable",
                        "Area_x0020_responsable",
                        "Área responsable",
                        "AreaResponsable",
                      ]
                    )
                  )


                const category =
                  String(
                    pick(
                      fields,
                      [
                        "Categor_x00ed_as",
                        "Categorias",
                        "Categorías",
                        "Categoria",
                      ]
                    )
                  )


                const local =
                  String(
                    pick(
                      fields,
                      [
                        "Local",
                        "local",
                        "Sucursal",
                        "Sucursal0",
                      ]
                    )
                  )


                const date =
                  String(
                    pick(
                      fields,
                      [
                        "Fecha_x0020_solicitud",
                        "FechaSolicitud",
                        "Fecha solicitud",
                        "Created",
                      ]
                    )
                  )


                return (
                  <article
                    className="request-card"
                    key={
                      id
                    }
                  >

                    <div className="request-top">

                      <StatusBadge
                        value={
                          status
                        }
                      />


                      <span>
                        #
                        {
                          id
                        }
                      </span>

                    </div>


                    <h3>
                      {
                        title
                      }
                    </h3>


                    <div className="request-meta">

                      <span>
                        {
                          area ||
                          "Área por asignar"
                        }
                      </span>


                      <span>
                        {
                          category ||
                          "Sin categoría"
                        }
                      </span>


                      <span>
                        {
                          local ||
                          "Sin local"
                        }
                      </span>

                    </div>


                    <div className="request-foot">

                      <small>
                        {date
                          ? new Date(
                              date
                            ).toLocaleDateString(
                              "es-CL"
                            )
                          : "Sin fecha"}
                      </small>

                    </div>

                  </article>
                )
              }
            )}

        </div>
      )}

    </div>
  )
}


// ======================================================
// ESTADO DEMO
// ======================================================

function PilotStatus({
  value,
}: {
  value:
    RequestItem["status"]
}) {
  const labels: Record<
    RequestItem["status"],
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


  return (
    <span
      className={`status ${
        value ===
        "RESUELTA"
          ? "ok"
          : value ===
              "RECHAZADA"
            ? "bad"
            : value ===
                "PENDIENTE_APROBACION"
              ? "requested"
              : "neutral"
      }`}
    >
      {
        labels[value]
      }
    </span>
  )
}
