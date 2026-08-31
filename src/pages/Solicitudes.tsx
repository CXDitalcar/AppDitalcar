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
  mockProcessAssignments,
  mockRequests,
} from "../data/mockData"

import {
  canViewRequest,
} from "../services/permissions"

import type {
  RequestItem,
  UserScope,
} from "../types"

import StatusBadge from "../components/StatusBadge"


// ======================================================
// UTILIDAD PARA LEER COLUMNAS SHAREPOINT
// ======================================================

function pick(
  fields: Record<string, any>,
  names: string[]
) {
  for (
    const name of names
  ) {
    if (
      fields[name] !== undefined &&
      fields[name] !== null
    ) {
      return fields[name]
    }
  }

  return ""
}


// ======================================================
// COMPONENTE
// ======================================================

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


  // ======================================================
  // CARGAR SHAREPOINT
  // ======================================================

  async function load() {
    setError("")


    if (demoMode) {
      setLoading(false)
      return
    }


    setLoading(true)


    try {
      const data =
        await getSolicitudes()

      setRows(data)
    } catch (
      errorValue: any
    ) {
      setError(
        errorValue?.message ||
          "No fue posible cargar las solicitudes."
      )
    } finally {
      setLoading(false)
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
  // SOLICITUDES DEMO VISIBLES
  // ======================================================

  const visibleDemo =
    useMemo(
      () => {
        const normalizedQuery =
          query
            .trim()
            .toLowerCase()


        return mockRequests
          .filter(
            (request) =>
              canViewRequest(
                currentUser,
                request,
                mockProcessAssignments
              )
          )
          .filter(
            (request) => {
              if (
                !normalizedQuery
              ) {
                return true
              }


              const searchableText =
                [
                  request.id,
                  request.processName,
                  request.local,
                  request.requesterName,
                  request.currentResponsibleName ??
                    "",
                  request.status,
                ]
                  .join(" ")
                  .toLowerCase()


              return searchableText.includes(
                normalizedQuery
              )
            }
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
        query,
        currentUser,
      ]
    )


  // ======================================================
  // SHAREPOINT FILTRADO
  // ======================================================

  const filteredLive =
    useMemo(
      () => {
        const normalizedQuery =
          query
            .trim()
            .toLowerCase()


        return rows.filter(
          (row) => {
            const fields =
              row.fields


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


            const solicitud =
              String(
                pick(
                  fields,
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


            const searchableText =
              `${solicitud} ${estado} ${area} ${local}`
                .toLowerCase()


            const matchesQuery =
              !normalizedQuery ||
              searchableText.includes(
                normalizedQuery
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


  // ======================================================
  // VISTA
  // ======================================================

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
              ? "Piloto interactivo · solicitudes según rol y proceso."
              : "Fuente: SharePoint · Tablero General Solicitudes"}
          </p>

        </div>


        <div className="request-head-actions">

          <button
            type="button"
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
          onChange={(
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
          CARGANDO
      ================================================== */}

      {loading && (
        <div className="empty">
          Cargando solicitudes…
        </div>
      )}


      {/* ==================================================
          ERROR
      ================================================== */}

      {error && (
        <div className="error-box">

          <AlertCircle
            size={20}
          />


          <div>

            <strong>
              No se pudieron cargar
              las solicitudes
            </strong>


            <span>
              {error}
            </span>

          </div>

        </div>
      )}


      {/* ==================================================
          MODO DEMO
      ================================================== */}

      {demoMode ? (
        <>

          {visibleDemo.length >
          0 ? (
            <div className="requests-grid">

              {visibleDemo.map(
                (request) => (
                  <button
                    type="button"
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
                          request.currentResponsibleName ??
                          "Por asignar"
                        }
                      </span>

                    </div>


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
            <div className="empty">
              No hay solicitudes
              visibles para este perfil.
            </div>
          )}

        </>
      ) : (
        <>

          {/* ==================================================
              SHAREPOINT
          ================================================== */}

          {!loading &&
            !error && (
            <>

              {filteredLive.length >
              0 ? (
                <div className="requests-grid">

                  {filteredLive.map(
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
              ) : (
                <div className="empty">
                  No encontramos
                  solicitudes para este
                  filtro.
                </div>
              )}

            </>
          )}

        </>
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


  const className =
    value ===
    "RESUELTA"
      ? "ok"
      : value ===
          "RECHAZADA"
        ? "bad"
        : value ===
            "PENDIENTE_APROBACION"
          ? "requested"
          : value ===
              "EN_GESTION"
            ? "neutral"
            : "neutral"


  return (
    <span
      className={`status ${className}`}
    >
      {
        labels[value]
      }
    </span>
  )
}
