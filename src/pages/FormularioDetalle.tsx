import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Eye,
  FileText,
  Link2,
  Plus,
  TriangleAlert,
} from "lucide-react"

import {
  useNavigate,
  useParams,
} from "react-router-dom"

import "./FormularioDetalle.css"

import {
  mockFormBreaches,
  mockFormExecutions,
  mockForms,
} from "../data/mockData"

import type {
  UserScope,
} from "../types"


// ======================================================
// PROPS
// ======================================================

type FormularioDetalleProps = {
  currentUser: UserScope
}


// ======================================================
// RESULTADO POR ÍTEM · DEMO
//
// Luego estos datos vendrán desde:
// 13_EjecucionesFormulario
// 14_BrechasFormulario
// ======================================================

type ItemResultStatus =
  | "CUMPLE"
  | "NO_CUMPLE"
  | "SOLICITADO"


type MockItemResult = {
  id: string

  executionId: string

  section: string

  question: string

  status: ItemResultStatus

  detail?: string

  evidenceLabel?: string
}


const mockItemResults: MockItemResult[] = [
  // ======================================================
  // RUTA VESPUCIO
  // ======================================================

  {
    id: "ITEM-RUTA-001",
    executionId: "EJ-RUTA-001",
    section: "Sala de Ventas",
    question:
      "¿La fachada y sala de ventas se encuentran limpias y ordenadas?",
    status: "CUMPLE",
  },

  {
    id: "ITEM-RUTA-002",
    executionId: "EJ-RUTA-001",
    section: "Sala de Ventas",
    question:
      "¿El material comercial vigente se encuentra correctamente exhibido?",
    status: "CUMPLE",
  },

  {
    id: "ITEM-RUTA-003",
    executionId: "EJ-RUTA-001",
    section: "Imagen del equipo",
    question:
      "¿Todos los colaboradores cuentan con su credencial?",
    status: "NO_CUMPLE",
    detail:
      "Se identifica al menos un colaborador sin credencial.",
    evidenceLabel:
      "Evidencia registrada en formulario",
  },

  {
    id: "ITEM-RUTA-004",
    executionId: "EJ-RUTA-001",
    section: "Imagen del equipo",
    question:
      "¿Los colaboradores cuentan con pie de firma corporativo?",
    status: "SOLICITADO",
    detail:
      "La gestión ya fue solicitada.",
  },

  {
    id: "ITEM-RUTA-005",
    executionId: "EJ-RUTA-001",
    section: "Zonas de Experiencia",
    question:
      "¿La zona de café se encuentra operativa y correctamente abastecida?",
    status: "NO_CUMPLE",
    detail:
      "Se identifican faltantes que requieren seguimiento.",
    evidenceLabel:
      "Evidencia registrada en formulario",
  },

  {
    id: "ITEM-RUTA-006",
    executionId: "EJ-RUTA-001",
    section: "Zonas de Experiencia",
    question:
      "¿La zona de niños se encuentra operativa y correctamente abastecida?",
    status: "CUMPLE",
  },

  {
    id: "ITEM-RUTA-007",
    executionId: "EJ-RUTA-001",
    section: "Atención y Recepción",
    question:
      "¿Los clientes son recibidos oportunamente al ingresar al local?",
    status: "CUMPLE",
  },

  {
    id: "ITEM-RUTA-008",
    executionId: "EJ-RUTA-001",
    section: "Unidades",
    question:
      "¿Las unidades en exhibición cuentan con los elementos requeridos?",
    status: "CUMPLE",
  },


  // ======================================================
  // TOUR STELLANTIS · DEMO
  // ======================================================

  {
    id: "ITEM-TOUR-001",
    executionId: "EJ-TOUR-001",
    section: "Estándares de sala",
    question:
      "Presentación general del showroom",
    status: "CUMPLE",
  },

  {
    id: "ITEM-TOUR-002",
    executionId: "EJ-TOUR-001",
    section: "Experiencia",
    question:
      "Cumplimiento de elementos de experiencia definidos para el local",
    status: "NO_CUMPLE",
    detail:
      "Se identificaron elementos pendientes de corrección.",
  },

  {
    id: "ITEM-TOUR-003",
    executionId: "EJ-TOUR-001",
    section: "Unidades",
    question:
      "Presentación de vehículos en exhibición",
    status: "CUMPLE",
  },
]


// ======================================================
// COMPONENTE
// ======================================================

export default function FormularioDetalle({
  currentUser,
}: FormularioDetalleProps) {
  const {
    executionId,
  } = useParams()


  const navigate =
    useNavigate()


  const execution =
    mockFormExecutions.find(
      (item) =>
        item.id ===
        executionId
    )


  if (!execution) {
    return (
      <div className="form-detail-page">

        <button
          type="button"
          className="form-detail-back"
          onClick={() =>
            navigate(
              "/formularios"
            )
          }
        >
          <ArrowLeft
            size={17}
          />

          Volver a Formularios
        </button>


        <div className="form-detail-empty">

          <CircleAlert
            size={32}
          />


          <h2>
            Revisión no encontrada
          </h2>


          <p>
            No encontramos esta ejecución
            dentro de los datos disponibles.
          </p>

        </div>

      </div>
    )
  }


  const form =
    mockForms.find(
      (item) =>
        item.code ===
        execution.formCode
    )


  if (!form) {
    return null
  }


  const items =
    mockItemResults.filter(
      (item) =>
        item.executionId ===
        execution.id
    )


  const breaches =
    mockFormBreaches.filter(
      (breach) =>
        breach.executionId ===
        execution.id
    )


  const groupedItems =
    groupBySection(
      items
    )


  const compliancePercentage =
    calculateCompliance(
      execution.compliant,
      execution.nonCompliant,
      execution.requested
    )


  return (
    <div className="form-detail-page">

      {/* ==================================================
          VOLVER
      ================================================== */}

      <button
        type="button"
        className="form-detail-back"
        onClick={() =>
          navigate(
            "/formularios"
          )
        }
      >
        <ArrowLeft
          size={17}
        />

        Volver a Formularios
      </button>


      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="form-detail-head">

        <div>

          <div className="eyebrow">
            DETALLE DE REVISIÓN
          </div>


          <h1>
            {
              form.name
            }
          </h1>


          <p>
            Revisa el resultado por ítem,
            identifica las brechas y accede
            a las solicitudes asociadas.
          </p>

        </div>


        <div className="form-detail-local">

          <ClipboardCheck
            size={20}
          />


          <div>

            <span>
              Local
            </span>


            <strong>
              {
                execution.local
              }
            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          INFORMACIÓN GENERAL
      ================================================== */}

      <div className="form-detail-info-grid">

        <InfoCard
          label="Realizado por"
          value={
            execution.completedByName
          }
        />


        <InfoCard
          label="Fecha"
          value={
            formatDateTime(
              execution.completedAt
            )
          }
        />


        <InfoCard
          label="Cumplimiento"
          value={`${compliancePercentage}%`}
        />


        <InfoCard
          label="Brechas detectadas"
          value={
            String(
              execution.nonCompliant
            )
          }
        />

      </div>


      {/* ==================================================
          RESUMEN
      ================================================== */}

      <div className="form-detail-summary">

        <div className="form-detail-result result-ok-large">

          <CheckCircle2
            size={19}
          />

          <div>

            <strong>
              {
                execution.compliant
              }
            </strong>

            <span>
              Cumple
            </span>

          </div>

        </div>


        <div className="form-detail-result result-alert-large">

          <TriangleAlert
            size={19}
          />

          <div>

            <strong>
              {
                execution.nonCompliant
              }
            </strong>

            <span>
              No cumple
            </span>

          </div>

        </div>


        <div className="form-detail-result result-requested-large">

          <FileText
            size={19}
          />

          <div>

            <strong>
              {
                execution.requested
              }
            </strong>

            <span>
              Solicitado
            </span>

          </div>

        </div>

      </div>


      {/* ==================================================
          BRECHAS QUE REQUIEREN GESTIÓN
      ================================================== */}

      {breaches.length >
        0 && (
        <section className="form-detail-section">

          <div className="form-detail-section-head">

            <div>

              <div className="eyebrow">
                SEGUIMIENTO
              </div>


              <h2>
                Brechas y solicitudes
              </h2>


              <p>
                Los ítems con brecha pueden
                generar una solicitud o
                vincularse con una gestión
                existente.
              </p>

            </div>


            <span className="form-detail-counter">
              {
                breaches.length
              }{" "}
              brechas
            </span>

          </div>


          <div className="form-breach-list">

            {breaches.map(
              (breach) => {
                const hasRequest =
                  Boolean(
                    breach.linkedRequestId
                  )


                return (
                  <div
                    key={
                      breach.id
                    }
                    className="form-breach-item"
                  >

                    <div className="form-breach-status-icon">

                      {breach.status ===
                      "NO_CUMPLE" ? (
                        <TriangleAlert
                          size={20}
                        />
                      ) : (
                        <FileText
                          size={20}
                        />
                      )}

                    </div>


                    <div className="form-breach-content">

                      <span className="form-breach-section">
                        {
                          breach.section
                        }
                      </span>


                      <strong>
                        {
                          breach.question
                        }
                      </strong>


                      {breach.mappedProcessCode && (
                        <small>
                          Proceso sugerido:{" "}
                          {
                            breach.mappedProcessCode
                          }
                        </small>
                      )}

                    </div>


                    <div className="form-breach-action">

                      {hasRequest ? (
                        <button
                          type="button"
                          className="breach-existing-btn"
                          onClick={() =>
                            navigate(
                              `/solicitudes/${breach.linkedRequestId}`
                            )
                          }
                        >
                          <Link2
                            size={16}
                          />

                          Ver solicitud
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="breach-create-btn"
                          onClick={() =>
                            navigate(
                              `/solicitudes/nueva?process=${breach.mappedProcessCode ?? ""}&breach=${breach.id}`
                            )
                          }
                        >
                          <Plus
                            size={16}
                          />

                          Crear solicitud
                        </button>
                      )}

                    </div>

                  </div>
                )
              }
            )}

          </div>

        </section>
      )}


      {/* ==================================================
          RESULTADO POR ÍTEM
      ================================================== */}

      <section className="form-detail-section">

        <div className="form-detail-section-head">

          <div>

            <div className="eyebrow">
              RESULTADO
            </div>


            <h2>
              Revisión por ítem
            </h2>


            <p>
              Visualiza exactamente qué
              elementos cumplen, cuáles
              presentan brechas y cuáles
              ya fueron solicitados.
            </p>

          </div>

        </div>


        {Object.entries(
          groupedItems
        ).map(
          ([
            section,
            sectionItems,
          ]) => (
            <div
              key={
                section
              }
              className="form-item-section"
            >

              <div className="form-item-section-title">

                <span>
                  {
                    section
                  }
                </span>


                <small>
                  {
                    sectionItems.length
                  }{" "}
                  ítems
                </small>

              </div>


              <div className="form-item-list">

                {sectionItems.map(
                  (item) => (
                    <ItemResultRow
                      key={
                        item.id
                      }
                      item={
                        item
                      }
                    />
                  )
                )}

              </div>

            </div>
          )
        )}

      </section>


      {/* ==================================================
          NOTA DEMO
      ================================================== */}

      <div className="form-detail-demo-note">

        <Eye
          size={17}
        />


        <span>
          Vista demo. Los resultados reales
          vendrán desde las Lists de
          ejecuciones y brechas.
        </span>

      </div>

    </div>
  )
}


// ======================================================
// FILA RESULTADO
// ======================================================

function ItemResultRow({
  item,
}: {
  item: MockItemResult
}) {
  return (
    <div
      className={`form-item-row ${getItemStatusClass(
        item.status
      )}`}
    >

      <div className="form-item-status">

        {item.status ===
        "CUMPLE" && (
          <CheckCircle2
            size={19}
          />
        )}


        {item.status ===
        "NO_CUMPLE" && (
          <TriangleAlert
            size={19}
          />
        )}


        {item.status ===
        "SOLICITADO" && (
          <FileText
            size={19}
          />
        )}

      </div>


      <div className="form-item-content">

        <strong>
          {
            item.question
          }
        </strong>


        {item.detail && (
          <p>
            {
              item.detail
            }
          </p>
        )}


        {item.evidenceLabel && (
          <small>
            {
              item.evidenceLabel
            }
          </small>
        )}

      </div>


      <span className="form-item-label">
        {
          formatItemStatus(
            item.status
          )
        }
      </span>

    </div>
  )
}


// ======================================================
// TARJETA INFO
// ======================================================

function InfoCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="form-detail-info-card">

      <span>
        {
          label
        }
      </span>


      <strong>
        {
          value
        }
      </strong>

    </div>
  )
}


// ======================================================
// AGRUPAR POR SECCIÓN
// ======================================================

function groupBySection(
  items: MockItemResult[]
) {
  return items.reduce<
    Record<
      string,
      MockItemResult[]
    >
  >(
    (
      groups,
      item
    ) => {
      if (
        !groups[
          item.section
        ]
      ) {
        groups[
          item.section
        ] = []
      }


      groups[
        item.section
      ].push(
        item
      )


      return groups
    },
    {}
  )
}


// ======================================================
// CUMPLIMIENTO
// ======================================================

function calculateCompliance(
  compliant: number,
  nonCompliant: number,
  requested: number
) {
  const total =
    compliant +
    nonCompliant +
    requested


  if (
    total === 0
  ) {
    return 0
  }


  return Math.round(
    (
      compliant /
      total
    ) *
      100
  )
}


// ======================================================
// CLASE ESTADO
// ======================================================

function getItemStatusClass(
  status: ItemResultStatus
) {
  switch (
    status
  ) {
    case "CUMPLE":
      return "item-status-ok"

    case "NO_CUMPLE":
      return "item-status-alert"

    case "SOLICITADO":
      return "item-status-requested"
  }
}


// ======================================================
// TEXTO ESTADO
// ======================================================

function formatItemStatus(
  status: ItemResultStatus
) {
  switch (
    status
  ) {
    case "CUMPLE":
      return "Cumple"

    case "NO_CUMPLE":
      return "No cumple"

    case "SOLICITADO":
      return "Solicitado"
  }
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  )
}
