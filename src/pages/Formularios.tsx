import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Eye,
  FileCheck2,
  TriangleAlert,
} from "lucide-react"

import "./Formularios.css"

import {
  mockFormBreaches,
  mockFormExecutions,
  mockForms,
  type MockFormDefinition,
} from "../data/mockData"

import type {
  UserScope,
} from "../types"


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
  const formsToComplete =
    getFormsToComplete(
      currentUser
    )

  const canSeeNetworkTracking =
    currentUser.role ===
      "EXPERIENCIA_CLIENTES" ||
    currentUser.role ===
      "JEFATURA_COMERCIAL_CLIENTES"


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
            consulta los últimos
            resultados registrados.
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
                pendientes para realizar
                con este perfil.
              </strong>


              <span>
                Las revisiones se
                muestran según tu rol,
                local y operación.
              </span>

            </div>

          </div>
        )}

      </section>


      {/* ==================================================
          SEGUIMIENTO DE RED
      ================================================== */}

      {canSeeNetworkTracking && (
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
                Vista general de las
                últimas ejecuciones y
                brechas registradas.
              </p>

            </div>

          </div>


          <div className="forms-summary-grid">

            <SummaryCard
              label="Revisiones registradas"
              value={
                mockFormExecutions.length
              }
              icon={
                CheckCircle2
              }
            />


            <SummaryCard
              label="Brechas abiertas"
              value={
                mockFormBreaches.filter(
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
                mockFormBreaches.filter(
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


            {mockFormExecutions.map(
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

        </section>
      )}

    </div>
  )
}


// ======================================================
// TARJETA FORMULARIO
// ======================================================

function FormCard({
  form,
  currentUser,
}: {
  form: MockFormDefinition
  currentUser: UserScope
}) {
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


  function openForm() {
    window.open(
      form.url,
      "_blank",
      "noopener,noreferrer"
    )
  }


  return (
    <article className="form-card">

      <div className="form-card-top">

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
          {form.code}
        </span>


        <h3>
          {form.name}
        </h3>


        <p>
          {form.description}
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
            {pendingBreaches}{" "}
            {pendingBreaches === 1
              ? "brecha requiere"
              : "brechas requieren"}{" "}
            seguimiento.
          </span>

        </div>
      )}


      <div className="form-card-actions">

        {lastExecution && (
          <button
            type="button"
            className="form-secondary-btn"
          >
            <Eye
              size={17}
            />

            Ver última revisión
          </button>
        )}


        <button
          type="button"
          className="form-primary-btn"
          onClick={
            openForm
          }
        >
          Realizar formulario

          <ArrowUpRight
            size={17}
          />
        </button>

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
          {value}
        </strong>

        <span>
          {label}
        </span>

      </div>

    </div>
  )
}


// ======================================================
// FORMULARIOS DISPONIBLES POR ROL
// ======================================================

function getFormsToComplete(
  currentUser: UserScope
) {
  return mockForms.filter(
    (form) => {
      if (!form.active) {
        return false
      }


      if (
        !form.roles.includes(
          currentUser.role
        )
      ) {
        return false
      }


      if (
        form.stellantisOnly &&
        !isStellantisLocal(
          currentUser.local
        )
      ) {
        return false
      }


      return true
    }
  )
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


          if (
            currentUser.role ===
              "JEFATURA_LOCAL" &&
            currentUser.local
          ) {
            return (
              execution.local ===
              currentUser.local
            )
          }


          return true
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
// LOCAL STELLANTIS
//
// Temporal para el modo demo.
// Luego vendrá desde 01_Sucursales.
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
// TEXTOS
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
      "Jefatura Local",

    JEFATURA_MARCA:
      "Jefatura Marca",

    JEFATURA_ZONAL:
      "Jefatura Zonal",

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
      "Jefatura Marketing",

    EXPERIENCIA_CLIENTES:
      "Experiencia de Clientes",

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
