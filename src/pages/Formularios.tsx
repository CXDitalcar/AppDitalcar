import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileCheck2,
  TriangleAlert,
} from "lucide-react"

import {
  useNavigate,
} from "react-router-dom"

import "./Formularios.css"
import SignalLight from "../components/SignalLight"

import {
  mockFormBreaches,
  mockFormExecutions,
  mockForms,
  type MockFormDefinition,
  type MockFormExecution,
} from "../data/mockData"

import type {
  UserScope,
} from "../types"
import { hasExperienceAccess } from "../services/experienceAccess"


// ======================================================
// PROPS
// ======================================================

type FormulariosProps = {
  currentUser: UserScope
}


// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

export default function Formularios({
  currentUser,
}: FormulariosProps) {
  const navigate =
    useNavigate()


  const formsToComplete =
    getFormsToComplete(
      currentUser
    )


  const visibleExecutions =
    getVisibleExecutions(
      currentUser
    )


  const canSeeTracking =
    canUserSeeTracking(
      currentUser
    )


  const visibleExecutionIds =
    new Set(
      visibleExecutions.map(
        (execution) =>
          execution.id
      )
    )


  const visibleBreaches =
    mockFormBreaches.filter(
      (breach) =>
        visibleExecutionIds.has(
          breach.executionId
        )
    )


  function openExecution(
    executionId: string
  ) {
    navigate(
      `/formularios/${executionId}`
    )
  }


  return (
    <div className="forms-page">

      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="forms-page-head">

        <div>

          <div className="eyebrow">
            FORMULARIOS
          </div>


          <h1>
            Revisiones del local
          </h1>


          <p>
            Realiza las revisiones
            que te corresponden y
            consulta los resultados
            disponibles según tu rol.
          </p>

        </div>


        <div className="forms-head-badge">

          <ClipboardCheck
            size={20}
          />


          <div>

            <span>
              Perfil actual
            </span>


            <strong>
              {
                formatRole(
                  currentUser.role
                )
              }
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          MIS FORMULARIOS
      ================================================== */}

      <section className="forms-section">

        <div className="forms-section-head">

          <div>

            <div className="eyebrow">
              MIS REVISIONES
            </div>


            <h2>
              Formularios disponibles
            </h2>

          </div>


          <span className="forms-section-count">
            {
              formsToComplete.length
            }{" "}
            disponibles
          </span>

        </div>


        {formsToComplete.length >
        0 ? (
          <div className="forms-grid">

            {formsToComplete.map(
              (form) => (
                <FormCard
                  key={
                    form.code
                  }
                  form={
                    form
                  }
                  currentUser={
                    currentUser
                  }
                  onViewExecution={
                    openExecution
                  }
                />
              )
            )}

          </div>
        ) : (
          <div className="forms-empty">

            <FileCheck2
              size={28}
            />


            <div>

              <strong>
                No tienes formularios
                para realizar con este
                perfil.
              </strong>


              <span>
                Las revisiones disponibles
                dependen de tu rol y del
                tipo de operación.
              </span>

            </div>

          </div>
        )}

      </section>


      {/* ==================================================
          SEGUIMIENTO
      ================================================== */}

      {canSeeTracking && (
        <section className="forms-section">

          <div className="forms-section-head">

            <div>

              <div className="eyebrow">
                SEGUIMIENTO
              </div>


              <h2>
                Últimas revisiones
              </h2>


              <p>
                {
                  getTrackingDescription(
                    currentUser
                  )
                }
              </p>

            </div>

          </div>


          {/* ==================================================
              INDICADORES
          ================================================== */}

          <div className="forms-summary-grid">

            <SummaryCard
              label="Revisiones registradas"
              value={
                visibleExecutions.length
              }
              icon={
                CheckCircle2
              }
            />


            <SummaryCard
              label="Brechas abiertas"
              value={
                visibleBreaches.filter(
                  (breach) =>
                    breach.status ===
                    "NO_CUMPLE"
                ).length
              }
              icon={
                TriangleAlert
              }
            />


            <SummaryCard
              label="Ya solicitadas"
              value={
                visibleBreaches.filter(
                  (breach) =>
                    Boolean(
                      breach.linkedRequestId
                    )
                ).length
              }
              icon={
                FileCheck2
              }
            />

          </div>


          {/* ==================================================
              REVISIONES
          ================================================== */}

          {visibleExecutions.length >
          0 ? (
            <div className="forms-tracking-card">

              <div className="forms-tracking-head">

                <span>
                  Formulario
                </span>

                <span>
                  Local
                </span>

                <span>
                  Última realización
                </span>

                <span>
                  Resultado
                </span>

                <span />

              </div>


              {visibleExecutions.map(
                (execution) => {
                  const form =
                    mockForms.find(
                      (item) =>
                        item.code ===
                        execution.formCode
                    )


                  if (!form) {
                    return null
                  }


                  return (
                    <div
                      key={
                        execution.id
                      }
                      className="forms-tracking-row"
                    >

                      <div>

                        <strong>
                          {
                            form.name
                          }
                        </strong>


                        <small>
                          {
                            frequencyLabel(
                              form
                            )
                          }
                        </small>

                      </div>


                      <div>

                        <strong>
                          {
                            execution.local
                          }
                        </strong>

                      </div>


                      <div>

                        <strong>
                          {
                            formatDateTime(
                              execution.completedAt
                            )
                          }
                        </strong>


                        <small>
                          {
                            execution.completedByName
                          }
                        </small>

                      </div>


                      <div className="tracking-results">

                        <SignalLight tone={execution.nonCompliant > 0 ? "orange" : "green"} compact />

                        <span className="result-pill result-ok">
                          {
                            execution.compliant
                          }{" "}
                          Cumple
                        </span>


                        <span className="result-pill result-alert">
                          {
                            execution.nonCompliant
                          }{" "}
                          No cumple
                        </span>


                        <span className="result-pill result-requested">
                          {
                            execution.requested
                          }{" "}
                          Solicitado
                        </span>

                      </div>


                      <button
                        type="button"
                        className="tracking-view-btn"
                        title="Ver revisión"
                        onClick={() =>
                          openExecution(
                            execution.id
                          )
                        }
                      >
                        <Eye
                          size={18}
                        />
                      </button>

                    </div>
                  )
                }
              )}

            </div>
          ) : (
            <div className="forms-empty">

              <ClipboardCheck
                size={28}
              />


              <div>

                <strong>
                  Todavía no hay revisiones
                  disponibles para tu ámbito.
                </strong>


                <span>
                  Cuando existan ejecuciones
                  correspondientes a tus
                  locales aparecerán aquí.
                </span>

              </div>

            </div>
          )}

        </section>
      )}

    </div>
  )
}


// ======================================================
// TARJETA DE FORMULARIO
// ======================================================

function FormCard({
  form,
  currentUser,
  onViewExecution,
}: {
  form: MockFormDefinition
  currentUser: UserScope
  onViewExecution: (
    executionId: string
  ) => void
}) {
  const navigate = useNavigate()

  const lastExecution =
    getLastExecution(
      form.code,
      currentUser
    )


  const breaches =
    lastExecution
      ? mockFormBreaches.filter(
          (breach) =>
            breach.executionId ===
            lastExecution.id
        )
      : []


  const pendingBreaches =
    breaches.filter(
      (breach) =>
        breach.status ===
        "NO_CUMPLE"
    ).length


  const canComplete =
    form.roles.includes(currentUser.role) &&
    (!form.stellantisOnly || isStellantisLocal(currentUser.local))


  function openForm() {
    if (form.code === "FOR-RUTA-01") {
      navigate("/ruta-experiencia")
      return
    }
    if (form.code === "FOR-AUD-RUTA-01") {
      navigate("/ruta-experiencia?mode=AUDITORIA")
      return
    }
    window.open(
      form.url,
      "_blank",
      "noopener,noreferrer"
    )
  }


  return (
    <article className="form-card">

      <div className="form-card-top">

        <div className="form-card-signal">
          <SignalLight tone={pendingBreaches > 0 ? "orange" : canComplete ? "green" : "neutral"} compact />
          <span>{pendingBreaches > 0 ? "Requiere seguimiento" : canComplete ? "Actividad disponible" : "Solo seguimiento"}</span>
        </div>

        <div className="form-card-icon">

          <ClipboardCheck
            size={24}
          />

        </div>


        <div className="form-frequency">

          <Clock3
            size={14}
          />


          {
            frequencyLabel(
              form
            )
          }

        </div>

      </div>


      <div className="form-card-body">

        <span className="form-code">
          {
            form.code
          }
        </span>


        <h3>
          {
            form.name
          }
        </h3>


        <p>
          {
            form.description
          }
        </p>

      </div>


      <div className="form-last-review">

        <span>
          Última realización
        </span>


        {lastExecution ? (
          <>

            <strong>
              {
                formatDateTime(
                  lastExecution.completedAt
                )
              }
            </strong>


            <small>
              {
                lastExecution.completedByName
              }
            </small>

          </>
        ) : (
          <strong>
            Sin registros todavía
          </strong>
        )}

      </div>


      {lastExecution && (
        <div className="form-result-line">

          <span className="result-pill result-ok">
            {
              lastExecution.compliant
            }{" "}
            Cumple
          </span>


          <span className="result-pill result-alert">
            {
              lastExecution.nonCompliant
            }{" "}
            No cumple
          </span>


          <span className="result-pill result-requested">
            {
              lastExecution.requested
            }{" "}
            Solicitado
          </span>

        </div>
      )}


      {pendingBreaches >
        0 && (
        <div className="form-breach-alert">

          <TriangleAlert
            size={17}
          />


          <span>
            {
              pendingBreaches
            }{" "}
            {
              pendingBreaches === 1
                ? "brecha requiere"
                : "brechas requieren"
            }{" "}
            seguimiento.
          </span>

        </div>
      )}


      <div className="form-card-actions">

        {lastExecution && (
          <button
            type="button"
            className="form-secondary-btn"
            onClick={() =>
              onViewExecution(
                lastExecution.id
              )
            }
          >
            <Eye
              size={17}
            />

            Ver última revisión
          </button>
        )}


        {canComplete ? (
          <button
            type="button"
            className="form-primary-btn"
            onClick={openForm}
          >
            {form.code === "FOR-RUTA-01" || form.code === "FOR-AUD-RUTA-01"
              ? "Realizar en la app"
              : "Realizar formulario"}
            <ArrowUpRight size={17} />
          </button>
        ) : (
          <div
            className="form-readonly-badge"
            title="Visible para seguimiento. No está asignado a este perfil."
          >
            <Eye size={16} />
            Visible para seguimiento
          </div>
        )}

      </div>

    </article>
  )
}


// ======================================================
// TARJETA RESUMEN
// ======================================================

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: typeof CheckCircle2
}) {
  return (
    <div className="forms-summary-card">

      <div className="forms-summary-icon">

        <Icon
          size={20}
        />

      </div>


      <div>

        <strong>
          {
            value
          }
        </strong>


        <span>
          {
            label
          }
        </span>

      </div>

    </div>
  )
}


// ======================================================
// FORMULARIOS QUE EL USUARIO PUEDE REALIZAR
// ======================================================

function getFormsToComplete(
  currentUser: UserScope
) {
  if (!currentUser.active) return []

  // Experiencia mantiene visualización completa durante el piloto para
  // poder revisar en paralelo módulos todavía ocultos al resto de perfiles.
  if (hasExperienceAccess(currentUser)) {
    return mockForms.filter((form) => form.active)
  }

  // Piloto Stellantis Nueva Tobalaba: Ruta visible para Jefatura Local y
  // Gerencia de Marca. La asignación para realizarla sigue siendo solo de
  // Jefatura Local (se valida dentro de FormCard mediante form.roles).
  if (["JEFATURA_LOCAL", "GERENCIA_MARCA"].includes(currentUser.role)) {
    return mockForms.filter(
      (form) => form.active && form.code === "FOR-RUTA-01"
    )
  }

  return []
}


// ======================================================
// ¿PUEDE VER SEGUIMIENTO?
// ======================================================

function canUserSeeTracking(
  currentUser: UserScope
) {
  return [
    "JEFATURA_LOCAL",
    "JEFATURA_MARCA",
    "JEFATURA_ZONAL",
    "GERENCIA_MARCA",
    "GERENCIA_VENTAS",
    "JEFATURA_COMERCIAL_CLIENTES",
    "EXPERIENCIA_CLIENTES", "PROJECT_MANAGER",
  ].includes(
    currentUser.role
  )
}


// ======================================================
// EJECUCIONES VISIBLES SEGÚN ROL
// ======================================================

function getVisibleExecutions(
  currentUser: UserScope
) {
  return mockFormExecutions
    .filter(
      (execution) =>
        canViewExecution(
          currentUser,
          execution
        )
    )
    .sort(
      (a, b) =>
        new Date(
          b.completedAt
        ).getTime() -
        new Date(
          a.completedAt
        ).getTime()
    )
}


// ======================================================
// REGLAS DE VISIBILIDAD
// ======================================================

function canViewExecution(
  currentUser: UserScope,
  execution: MockFormExecution
) {
  if (
    hasExperienceAccess(currentUser)
  ) {
    return true
  }


  if (
    currentUser.role ===
    "JEFATURA_COMERCIAL_CLIENTES"
  ) {
    return true
  }


  if (
    currentUser.role ===
    "GERENCIA_VENTAS"
  ) {
    return true
  }


  if (
    currentUser.role ===
    "JEFATURA_LOCAL"
  ) {
    return (
      Boolean(
        currentUser.local
      ) &&
      execution.local ===
        currentUser.local
    )
  }


  if (
    currentUser.role ===
    "GERENCIA_MARCA"
  ) {
    const assigned = new Set(
      [
        ...(currentUser.assignedLocals ?? []),
        ...(currentUser.local ? [currentUser.local] : []),
        ...(currentUser.localPrincipal ? [currentUser.localPrincipal] : []),
      ]
        .filter(Boolean)
        .map((local) => local.toLowerCase())
    )

    return assigned.has(execution.local.toLowerCase())
  }


  if (
    currentUser.role ===
    "JEFATURA_MARCA"
  ) {
    return isGeelyLocal(
      execution.local
    )
  }


  if (
    currentUser.role ===
    "JEFATURA_ZONAL"
  ) {
    return (
      !isGeelyLocal(
        execution.local
      ) &&
      !isStellantisLocal(
        execution.local
      )
    )
  }


  return false
}


// ======================================================
// ÚLTIMA EJECUCIÓN
// ======================================================

function getLastExecution(
  formCode: string,
  currentUser: UserScope
) {
  const executions =
    mockFormExecutions
      .filter(
        (execution) => {
          if (
            execution.formCode !==
            formCode
          ) {
            return false
          }


          return canViewExecution(
            currentUser,
            execution
          )
        }
      )
      .sort(
        (a, b) =>
          new Date(
            b.completedAt
          ).getTime() -
          new Date(
            a.completedAt
          ).getTime()
      )


  return executions[0]
}


// ======================================================
// IDENTIFICAR STELLANTIS
//
// Temporal.
// Después vendrá desde 01_Sucursales.
// ======================================================

function isStellantisLocal(
  local?: string
) {
  if (!local) {
    return false
  }


  return local
    .toLowerCase()
    .includes(
      "stellantis"
    )
}


// ======================================================
// IDENTIFICAR GEELY
//
// Temporal.
// Después vendrá desde 01_Sucursales.
// ======================================================

function isGeelyLocal(
  local?: string
) {
  if (!local) {
    return false
  }


  return local
    .toLowerCase()
    .includes(
      "geely"
    )
}


// ======================================================
// DESCRIPCIÓN DE SEGUIMIENTO
// ======================================================

function getTrackingDescription(
  currentUser: UserScope
) {
  switch (
    currentUser.role
  ) {
    case "JEFATURA_LOCAL":
      return "Resultados y brechas correspondientes a tu local."

    case "JEFATURA_MARCA":
      return "Resultados y brechas correspondientes a la operación Geely."

    case "JEFATURA_ZONAL":
      return "Resultados de tus locales, excluyendo las operaciones Geely y Stellantis."

    case "GERENCIA_MARCA":
      return "Seguimiento de Ruta y brechas de los locales asignados a tu gerencia de marca."

    case "GERENCIA_VENTAS":
      return "Vista general de revisiones y brechas de toda la red."

    case "JEFATURA_COMERCIAL_CLIENTES":
      return "Vista general de revisiones y brechas de toda la red."

    case "PROJECT_MANAGER":

    case "EXPERIENCIA_CLIENTES":
      return "Control de revisiones, cumplimiento y brechas de toda la red."

    default:
      return "Últimas revisiones disponibles."
  }
}


// ======================================================
// FRECUENCIA
// ======================================================

function frequencyLabel(
  form: MockFormDefinition
) {
  if (
    form.frequency ===
    "SEMANAL"
  ) {
    return "Semanal"
  }


  if (
    form.frequency ===
    "QUINCENAL"
  ) {
    return "Quincenal"
  }


  return "Según plan"
}


// ======================================================
// NOMBRE DEL ROL
// ======================================================

function formatRole(
  role: UserScope["role"]
) {
  const labels: Record<
    UserScope["role"],
    string
  > = {
    VENDEDOR:
      "Vendedor",

    JEFATURA_LOCAL:
      "Jefatura de Sucursal",

    JEFATURA_MARCA:
      "Jefatura Marca · Geely",

    JEFATURA_ZONAL:
      "Gerencia de Marca",

    GERENCIA_MARCA:
      "Gerencia de Marca",

    GERENCIA_VENTAS:
      "Gerencia Ventas",

    JEFATURA_COMERCIAL_CLIENTES:
      "Jefatura Comercial y Clientes",

    JEFATURA_OPERACIONES_COMERCIALES:
      "Jefatura Operaciones Comerciales",

    JEFATURA_ADMINISTRACION:
      "Jefatura Administración",

    GERENCIA_ADMINISTRACION:
      "Gerencia Administración",

    GERENCIA_COMERCIAL:
      "Gerencia Comercial",

    JEFATURA_MARKETING:
      "Equipo de Marketing",

    EXPERIENCIA_CLIENTES:
      "Experiencia de Clientes",


    PROJECT_MANAGER:

      "Project Manager",

    ADMINISTRATIVO:
      "Administrativo",

    EQUIPO_COMERCIAL:
      "Equipo Comercial",

    GERENCIA_GENERAL:
      "Gerencia General",
  }


  return labels[role]
}


// ======================================================
// FECHA
// ======================================================

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  )
}
