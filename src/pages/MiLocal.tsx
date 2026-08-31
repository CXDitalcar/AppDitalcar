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

import {
  getPilotLocal,
  getVisiblePilotLocals,
} from "../data/pilotData"

import type {
  UserScope,
} from "../types"


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
                              kpi.label
                            }
                          </span>


                          <strong>
                            {kpi.unit ===
                            "%"
                              ? `${kpi.value}%`
                              : kpi.value}
                          </strong>

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
            (kpi) => (
              <article
                className={`kpi-card kpi-${kpi.state.toLowerCase()}`}
                key={
                  kpi.id
                }
              >

                <div className="kpi-card-head">

                  <span>
                    {
                      kpi.label
                    }
                  </span>


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


                <strong className="kpi-value">
                  {kpi.unit ===
                  "%"
                    ? `${kpi.value}%`
                    : kpi.value}
                </strong>


                <p>
                  {
                    kpi.note
                  }
                </p>


                {kpi.unit ===
                  "%" && (
                  <div className="kpi-progress">

                    <span
                      style={{
                        width: `${Math.min(
                          kpi.value,
                          100
                        )}%`,
                      }}
                    />

                  </div>
                )}

              </article>
            )
          )}

        </div>

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
