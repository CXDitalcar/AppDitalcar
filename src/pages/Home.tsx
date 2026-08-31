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

import {
  Link,
} from "react-router-dom"

import {
  getPilotLocal,
  getVisiblePilotLocals,
  networkKPIs,
  type KPIItem,
} from "../data/pilotData"

import type {
  UserScope,
} from "../types"


const cards = [
  {
    to: "/academia",
    title: "Academia",
    text:
      "Sello Ditalcar, CONSULTA y evaluaciones.",
    icon: GraduationCap,
  },

  {
    to: "/mi-local",
    title: "Mi Local",
    text:
      "KPI, estándares y brechas de la sucursal.",
    icon: ClipboardCheck,
  },

  {
    to: "/solicitudes",
    title: "Solicitudes",
    text:
      "Crear, consultar y seguir requerimientos.",
    icon: MessagesSquare,
  },

  {
    to: "/formularios",
    title: "Formularios",
    text:
      "Ruta, auditorías y seguimiento de brechas.",
    icon: FileCheck2,
  },

  {
    to: "/insumos",
    title: "Insumos",
    text:
      "Stock, sugerencia y pedido inteligente del local.",
    icon: PackageOpen,
  },
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
  const firstName =
    userName.split(" ")[0] ||
    userName


  const local =
    getPilotLocal(
      currentUser.local
    )


  const visibleLocals =
    getVisiblePilotLocals(
      currentUser
    )


  const managementView =
    visibleLocals.length > 1


  return (
    <>

      {/* ==================================================
          HERO
      ================================================== */}

      <section className="hero pilot-hero">

        <div className="hero-copy">

          <div className="eyebrow">
            EXPERIENCIA DITALCAR
          </div>


          <h1>
            Una sola forma de vivir
            <br />

            <em>
              la experiencia Ditalcar.
            </em>
          </h1>


          <p>
            Academia, estándares,
            formularios, KPI y solicitudes
            operativas en un solo lugar.
          </p>


          <div className="welcome">

            <Sparkles
              size={17}
            />

            Hola, {firstName} · {branch}

          </div>


          {demoMode && (
            <div className="pilot-data-note">
              Piloto Vespucio · datos
              demostrativos para validar
              experiencia y flujo.
            </div>
          )}

        </div>


        <div className="hero-orbit">

          <div className="orbit">
            <span>
              D
            </span>
          </div>

        </div>

      </section>


      {/* ==================================================
          KPI RED
      ================================================== */}

      <section className="section">

        <div className="section-head kpi-section-head">

          <div>

            <span className="eyebrow">
              KPI RED DITALCAR
            </span>


            <h2>
              Visión general
            </h2>

          </div>


          <span className="kpi-scope">

            <BarChart3
              size={15}
            />

            Red

          </span>

        </div>


        <div className="kpi-grid">

          {networkKPIs.map(
            (kpi) => (
              <KPICard
                key={
                  kpi.id
                }
                kpi={
                  kpi
                }
                compact={
                  !managementView
                }
              />
            )
          )}

        </div>

      </section>


      {/* ==================================================
          KPI MI LOCAL
      ================================================== */}

      {local && (
        <section className="section">

          <div className="section-head kpi-section-head">

            <div>

              <span className="eyebrow">
                MI LOCAL
              </span>


              <h2>
                {
                  local.name
                }
              </h2>

            </div>


            <Link
              className="kpi-text-link"
              to="/mi-local"
            >
              Ver detalle

              <ChevronRight
                size={15}
              />
            </Link>

          </div>


          <div className="kpi-grid kpi-grid-local">

            {local.kpis
              .slice(
                0,
                6
              )
              .map(
                (kpi) => (
                  <KPICard
                    key={
                      kpi.id
                    }
                    kpi={
                      kpi
                    }
                  />
                )
              )}

          </div>

        </section>
      )}


      {/* ==================================================
          VISTA DE GESTIÓN
      ================================================== */}

      {managementView && (
        <section className="section">

          <div className="section-head kpi-section-head">

            <div>

              <span className="eyebrow">
                LOCALES
              </span>


              <h2>
                Vista de gestión
              </h2>

            </div>


            <Link
              className="kpi-text-link"
              to="/mi-local"
            >
              Abrir locales

              <ChevronRight
                size={15}
              />
            </Link>

          </div>


          <div className="local-overview-grid">

            {visibleLocals.map(
              (item) => {
                const standards =
                  item.kpis.find(
                    (kpi) =>
                      kpi.id ===
                      "estandares"
                  )


                const accuracy =
                  item.kpis.find(
                    (kpi) =>
                      kpi.id ===
                      "exactitud"
                  )


                const sla =
                  item.kpis.find(
                    (kpi) =>
                      kpi.id ===
                      "sla"
                  )


                return (
                  <article
                    className="local-overview-card"
                    key={
                      item.name
                    }
                  >

                    <div className="local-overview-top">

                      <div>

                        <span>
                          {item.operation ===
                          "GENERAL"
                            ? "OPERACIÓN"
                            : item.operation}
                        </span>


                        <strong>
                          {
                            item.name
                          }
                        </strong>

                      </div>


                      <ShieldCheck
                        size={18}
                      />

                    </div>


                    <div className="local-overview-values">

                      <MiniKPI
                        label="Estándares"
                        value={
                          standards?.value
                        }
                      />


                      <MiniKPI
                        label="Exactitud"
                        value={
                          accuracy?.value
                        }
                      />


                      <MiniKPI
                        label="SLA"
                        value={
                          sla?.value
                        }
                      />

                    </div>

                  </article>
                )
              }
            )}

          </div>

        </section>
      )}


      {/* ==================================================
          ACCESOS
      ================================================== */}

      <section className="section">

        <div className="section-head">

          <div>

            <span className="eyebrow">
              ACCESOS PRINCIPALES
            </span>


            <h2>
              ¿Qué necesitas hacer?
            </h2>

          </div>

        </div>


        <div className="module-grid">

          {cards.map(
            ({
              to,
              title,
              text,
              icon: Icon,
            }) => (
              <Link
                className="module-card"
                to={
                  to
                }
                key={
                  title
                }
              >

                <div className="module-icon">

                  <Icon />

                </div>


                <div className="module-number">
                  DITALCAR
                </div>


                <h3>
                  {
                    title
                  }
                </h3>


                <p>
                  {
                    text
                  }
                </p>


                <div className="module-link">

                  Entrar

                  <ChevronRight
                    size={16}
                  />

                </div>

              </Link>
            )
          )}

        </div>

      </section>

    </>
  )
}


// ======================================================
// KPI
// ======================================================

function KPICard({
  kpi,
  compact = false,
}: {
  kpi: KPIItem
  compact?: boolean
}) {
  const value =
    kpi.unit === "%"
      ? `${kpi.value}%`
      : String(
          kpi.value
        )


  return (
    <article
      className={`kpi-card kpi-${kpi.state.toLowerCase()}`}
    >

      <div className="kpi-card-head">

        <span>
          {
            kpi.label
          }
        </span>


        {kpi.target !==
        undefined ? (
          <small>
            Meta{" "}
            {
              kpi.target
            }
            {kpi.unit === "%"
              ? "%"
              : ""}
          </small>
        ) : (
          <Target
            size={15}
          />
        )}

      </div>


      <strong className="kpi-value">
        {
          value
        }
      </strong>


      {!compact && (
        <p>
          {
            kpi.note
          }
        </p>
      )}


      {kpi.unit === "%" && (
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
}


// ======================================================
// KPI MINI
// ======================================================

function MiniKPI({
  label,
  value,
}: {
  label: string
  value?: number
}) {
  return (
    <div>

      <span>
        {
          label
        }
      </span>


      <strong>
        {value ===
        undefined
          ? "—"
          : `${value}%`}
      </strong>

    </div>
  )
}
