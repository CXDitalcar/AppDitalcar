import { useEffect, useState } from "react"
import { markMiLocalSeen } from "../services/homeActivities"
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ClipboardCheck,
  Coffee,
  MapPin,
  Shield,
} from "lucide-react"

import StatusBadge from "../components/StatusBadge"
import SignalLight, { signalFromPercent } from "../components/SignalLight"

import {
  getPilotLocal,
  getVisiblePilotLocals,
} from "../data/pilotData"

import type {
  UserScope,
} from "../types"
import { getRouteMetrics, type RouteMetrics } from "../services/routeExperienceApi"


const standards = [
  [
    "Recepción del local",
    "Cumple",
    "Cliente recibido, orientado y apoyado al ingresar.",
    CheckCircle2,
  ],

  [
    "Zona de café",
    "No cumple",
    "Faltantes levantados desde Ruta; debe generar pedido o solicitud según corresponda.",
    Coffee,
  ],

  [
    "PAI de precio",
    "Solicitado",
    "Información de marca y precio visible según estándar.",
    ClipboardCheck,
  ],

  [
    "Uniformes y credenciales",
    "Cumple",
    "Imagen consistente y reposición gestionada.",
    BadgeCheck,
  ],

  [
    "Patentes / identificadores",
    "No cumple",
    "Reposición pendiente de gestión administrativa.",
    AlertTriangle,
  ],

  [
    "Zona de seguridad",
    "Cumple",
    "Señalética visible y protocolo disponible.",
    Shield,
  ],
]


export default function MiLocal({
  branch,
  currentUser,
}: {
  branch: string
  currentUser: UserScope
}) {
  const local =
    getPilotLocal(
      currentUser.local ??
      branch
    )


  const visibleLocals =
    getVisiblePilotLocals(
      currentUser
    )


  const metricsLocalName = local?.name ?? (visibleLocals.length === 1 ? visibleLocals[0]?.name : "")
  const [routeMetrics, setRouteMetrics] = useState<RouteMetrics | null>(null)

  // Al entrar a Mi local se da por vista la última Ruta/Auditoría (apaga el aviso del menú).
  useEffect(() => { markMiLocalSeen(currentUser.email) }, [currentUser.email])

  useEffect(() => {
    let active = true
    if (!metricsLocalName) {
      setRouteMetrics(null)
      return () => { active = false }
    }
    getRouteMetrics(metricsLocalName)
      .then((result) => { if (active) setRouteMetrics(result) })
      .catch(() => { if (active) setRouteMetrics(null) })
    return () => { active = false }
  }, [metricsLocalName])


  // ======================================================
  // VISTA DE RED
  // ======================================================

  if (
    !local &&
    visibleLocals.length > 1
  ) {
    return (
      <div className="local-page">

        <div className="page-head">

          <span className="eyebrow">
            LOCALES
          </span>


          <h1>
            Vista de red
          </h1>


          <p>
            Indicadores generales por
            local según el ámbito de tu
            rol.
          </p>

        </div>


        <div className="local-management-grid">

          {visibleLocals.map(
            (item) => (
              <article
                className="local-management-card"
                key={
                  item.name
                }
              >

                <div className="local-management-title">

                  <MapPin
                    size={18}
                  />


                  <div>

                    <span>
                      {
                        item.operation
                      }
                    </span>


                    <h3>
                      {
                        item.name
                      }
                    </h3>

                  </div>

                </div>


                <div className="local-management-kpis">

                  {item.kpis
                    .slice(
                      0,
                      4
                    )
                    .map(
                      (kpi) => (
                        <div
                          key={
                            kpi.id
                          }
                        >

                          <span>
                            {
                              kpi.id === "sla" ? "Solicitudes a tiempo" : kpi.label
                            }
                          </span>


                          <strong>
                            {kpi.unit ===
                            "%"
                              ? `${kpi.value}%`
                              : kpi.value}
                          </strong>
                          {kpi.unit === "%" && (
                            <SignalLight tone={signalFromPercent(kpi.value)} compact />
                          )}

                        </div>
                      )
                    )}

                </div>

              </article>
            )
          )}

        </div>

      </div>
    )
  }


  // ======================================================
  // LOCAL ACTIVO
  // ======================================================

  const activeLocal =
    local ??
    getPilotLocal(
      "Vespucio"
    )


  if (!activeLocal) {
    return null
  }


  return (
    <div className="local-page">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="page-head local-page-head">

        <div>

          <span className="eyebrow">
            MI LOCAL
          </span>


          <h1>
            {
              activeLocal.name
            }
          </h1>


          <p>
            La revisión debe reflejar
            la realidad del local y
            movilizar soluciones.
          </p>

        </div>


        <div className="local-route-state">

          <CheckCircle2
            size={18}
          />


          <div>

            <span>
              Ruta semanal
            </span>


            <strong>
              Realizada
            </strong>


            <small>
              Último registro · jueves 10:12
            </small>

          </div>

        </div>

      </div>


      {/* ==================================================
          KPI LOCAL
      ================================================== */}

      <section className="section local-kpi-section">

        <div className="section-head">

          <span className="eyebrow">
            INDICADORES DEL LOCAL
          </span>


          <h2>
            Seguimiento
          </h2>

        </div>


        <div className="kpi-grid kpi-grid-local">

          {activeLocal.kpis.map(
            (kpi) => {
              const liveValue = kpi.id === "exactitud" && routeMetrics?.latest ? routeMetrics.latest.exactitude : kpi.value
              return (
              <article
                className={`kpi-card kpi-${kpi.state.toLowerCase()}`}
                key={
                  kpi.id
                }
              >

                <div className="kpi-card-head">

                  <span>
                    {
                      kpi.id === "sla" ? "Solicitudes a tiempo" : kpi.label
                    }
                  </span>


                  <div className="kpi-signal-row">
                    {kpi.unit === "%" && (
                      <SignalLight tone={signalFromPercent(liveValue)} compact />
                    )}
                  {kpi.target !==
                    undefined && (
                    <small>
                      Meta{" "}
                      {
                        kpi.target
                      }
                      {kpi.unit ===
                      "%"
                        ? "%"
                        : ""}
                    </small>
                  )}
                  </div>

                </div>


                <strong className="kpi-value">
                  {kpi.unit ===
                  "%"
                    ? `${liveValue}%`
                    : liveValue}
                </strong>


                <p>
                  {
                    kpi.note.replace(/SLA/gi, "plazo")
                  }
                </p>


                {kpi.unit ===
                  "%" && (
                  <div className="kpi-progress">

                    <span
                      style={{
                        width: `${Math.min(
                          liveValue,
                          100
                        )}%`,
                      }}
                    />

                  </div>
                )}

              </article>
              )
            }
          )}

        </div>

      </section>


      {/* ==================================================
          EVOLUTIVO RUTA VS AUDITORÍA
      ================================================== */}

      <section className="section local-route-evolution">
        <div className="section-head local-standard-head">
          <div>
            <span className="eyebrow">EXACTITUD DE LA REVISIÓN</span>
            <h2>Evolutivo Ruta vs Auditoría</h2>
          </div>
          {routeMetrics?.latest && (
            <span className="local-breach-pill" style={{ borderColor: "rgba(55,189,112,.28)", color: "#7fe0a7" }}>
              <CheckCircle2 size={14} /> {routeMetrics.latest.exactitude}% última comparación
            </span>
          )}
        </div>

        {routeMetrics?.monthly?.length ? (
          <div className="local-route-evolution-grid">
            {routeMetrics.monthly.slice(0, 6).map((item) => (
              <article key={`${item.period}-${item.routeId}-${item.auditId}`}>
                <div className="local-route-evolution-head">
                  <span>{new Intl.DateTimeFormat("es-CL", { month: "short", year: "numeric" }).format(new Date(`${item.period}-01T12:00:00`))}</span>
                  <strong>{item.exactitude}%</strong>
                </div>
                <div className="local-route-evolution-bar"><i style={{ width: `${Math.max(0, Math.min(100, item.exactitude))}%` }} /></div>
                <small>
                  Ruta {new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit" }).format(new Date(item.routeDate))}
                  {" · "}
                  Auditoría {new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit" }).format(new Date(item.auditDate))}
                  {" · "}{item.differences.length} diferencias
                </small>
              </article>
            ))}
          </div>
        ) : (
          <div className="activity-empty">El evolutivo aparecerá cuando exista al menos un mes con Ruta y Auditoría finalizadas.</div>
        )}
      </section>

      {/* ==================================================
          ESTÁNDARES
      ================================================== */}

      <section className="section">

        <div className="section-head local-standard-head">

          <div>

            <span className="eyebrow">
              ESTÁNDARES
            </span>


            <h2>
              Última revisión
            </h2>

          </div>


          <span className="local-breach-pill">

            <AlertTriangle
              size={14}
            />

            2 brechas activas

          </span>

        </div>


        <div className="standard-list">

          {standards.map(
            (
              [
                name,
                status,
                desc,
                Icon,
              ]: any
            ) => (
              <article
                className="standard-card"
                key={
                  name
                }
              >

                <div className="standard-icon">

                  <Icon />

                </div>


                <div className="standard-copy">

                  <strong>
                    {
                      name
                    }
                  </strong>


                  <span>
                    {
                      desc
                    }
                  </span>

                </div>


                <StatusBadge
                  value={
                    status
                  }
                />

              </article>
            )
          )}

        </div>

      </section>

    </div>
  )
}
