import { useMemo, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Package,
  Paperclip,
  Users,
  Layers3,
} from "lucide-react"

import {
  mockCurrentUserEmail,
  mockProcessFields,
  mockProcesses,
  mockUsers,
} from "../data/mockData"

import type {
  ProcessDefinition,
  ProcessFieldDefinition,
  RequestFamily,
} from "../types"


type FormValues = Record<string, string>


const familyInfo: Record<
  RequestFamily,
  {
    label: string
    description: string
    icon: typeof Package
  }
> = {
  UNIDADES: {
    label: "Unidades",
    description:
      "Bonificaciones, pedidos, traslados, devoluciones y otras gestiones de unidades.",
    icon: Package,
  },

  INSUMOS_ADMINISTRACION: {
    label: "Insumos y Administración",
    description:
      "Patentes, materiales, reposiciones e insumos administrativos.",
    icon: Layers3,
  },

  COLABORADORES: {
    label: "Colaboradores",
    description:
      "Credenciales, uniformes, accesos, sistemas, capacitación y otras necesidades del equipo.",
    icon: Users,
  },

  OTROS: {
    label: "Otros",
    description:
      "Solicitudes que aún no están incorporadas al catálogo de procesos.",
    icon: FileText,
  },
}


export default function NuevaSolicitud() {
  const currentUser =
    mockUsers.find(
      (user) => user.email === mockCurrentUserEmail
    ) ?? mockUsers[0]

  const [step, setStep] = useState(1)

  const [selectedFamily, setSelectedFamily] =
    useState<RequestFamily | null>(null)

  const [selectedProcess, setSelectedProcess] =
    useState<ProcessDefinition | null>(null)

  const [values, setValues] = useState<FormValues>({})

  const [attachments, setAttachments] =
    useState<File[]>([])

  const [submitted, setSubmitted] =
    useState(false)


  // ======================================================
  // FAMILIAS VISIBLES SEGÚN ROL
  // ======================================================

  const visibleFamilies = useMemo(() => {
    const allFamilies = Object.keys(
      familyInfo
    ) as RequestFamily[]

    // Regla definida:
    // vendedores no ven Insumos y Administración.
    if (currentUser.role === "VENDEDOR") {
      return allFamilies.filter(
        (family) =>
          family !== "INSUMOS_ADMINISTRACION"
      )
    }

    return allFamilies
  }, [currentUser.role])


  // ======================================================
  // PROCESOS DISPONIBLES
  // ======================================================

  const availableProcesses = useMemo(() => {
    if (!selectedFamily) return []

    return mockProcesses
      .filter(
        (process) =>
          process.active &&
          process.family === selectedFamily &&
          process.requesterRoles.includes(
            currentUser.role
          )
      )
      .sort((a, b) => a.order - b.order)
  }, [
    selectedFamily,
    currentUser.role,
  ])


  // ======================================================
  // CAMPOS DEL PROCESO
  // ======================================================

  const processFields = useMemo(() => {
    if (!selectedProcess) return []

    return mockProcessFields
      .filter(
        (field) =>
          field.active &&
          field.processCode ===
            selectedProcess.code
      )
      .sort((a, b) => a.order - b.order)
  }, [selectedProcess])


  // ======================================================
  // VALIDACIÓN
  // ======================================================

  const formIsValid = processFields
    .filter((field) => field.required)
    .every(
      (field) =>
        values[field.id]?.trim()
    )


  // ======================================================
  // HELPERS
  // ======================================================

  function updateValue(
    fieldId: string,
    value: string
  ) {
    setValues((current) => ({
      ...current,
      [fieldId]: value,
    }))
  }


  function selectFamily(
    family: RequestFamily
  ) {
    setSelectedFamily(family)
    setSelectedProcess(null)
    setValues({})
    setStep(2)
  }


  function selectProcess(
    process: ProcessDefinition
  ) {
    setSelectedProcess(process)
    setValues({})
    setStep(3)
  }


  function handleFiles(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(
      event.target.files ?? []
    )

    setAttachments((current) => [
      ...current,
      ...files,
    ])
  }


  function submitRequest() {
    if (!selectedProcess || !formIsValid) {
      return
    }

    // Todavía no guardamos en SharePoint.
    // En esta etapa solo simulamos el envío.
    setSubmitted(true)
    setStep(4)
  }


  // ======================================================
  // ENVÍO EXITOSO
  // ======================================================

  if (submitted && selectedProcess) {
    return (
      <div className="new-request-page">
        <div className="request-success">
          <div className="request-success-icon">
            <CheckCircle2 size={34} />
          </div>

          <div className="eyebrow">
            SOLICITUD REGISTRADA
          </div>

          <h1>
            Tu solicitud fue enviada
          </h1>

          <p>
            <strong>
              {selectedProcess.name}
            </strong>{" "}
            quedó registrada para revisión.
          </p>

          <div className="request-success-info">
            <div>
              <span>Solicitante</span>
              <strong>
                {currentUser.name}
              </strong>
            </div>

            <div>
              <span>Local</span>
              <strong>
                {currentUser.local ?? "—"}
              </strong>
            </div>

            <div>
              <span>Estado inicial</span>
              <strong>
                Pendiente de aprobación
              </strong>
            </div>

            <div>
              <span>Confirmación</span>
              <strong>
                {selectedProcess.confirmationHours} h
              </strong>
            </div>
          </div>

          <button
            className="primary-btn"
            onClick={() => {
              setSubmitted(false)
              setStep(1)
              setSelectedFamily(null)
              setSelectedProcess(null)
              setValues({})
              setAttachments([])
            }}
          >
            Crear otra solicitud
          </button>
        </div>
      </div>
    )
  }


  return (
    <div className="new-request-page">

      {/* ===============================================
          CABECERA
      =============================================== */}

      <div className="page-head">
        <div className="eyebrow">
          SOLICITUDES
        </div>

        <h1>Nueva solicitud</h1>

        <p>
          Selecciona qué necesitas.
          La app identificará automáticamente
          el proceso, responsable y SLA
          correspondiente.
        </p>
      </div>


      {/* ===============================================
          PASOS
      =============================================== */}

      <div className="request-stepper">

        <div
          className={`request-step ${
            step >= 1 ? "active" : ""
          }`}
        >
          <span>1</span>
          <div>
            <strong>Familia</strong>
            <small>¿Qué necesitas?</small>
          </div>
        </div>

        <div
          className={`request-step ${
            step >= 2 ? "active" : ""
          }`}
        >
          <span>2</span>
          <div>
            <strong>Proceso</strong>
            <small>Tipo de gestión</small>
          </div>
        </div>

        <div
          className={`request-step ${
            step >= 3 ? "active" : ""
          }`}
        >
          <span>3</span>
          <div>
            <strong>Datos</strong>
            <small>Completar solicitud</small>
          </div>
        </div>

        <div
          className={`request-step ${
            step >= 4 ? "active" : ""
          }`}
        >
          <span>4</span>
          <div>
            <strong>Enviar</strong>
            <small>Revisión final</small>
          </div>
        </div>

      </div>


      {/* ===============================================
          PASO 1 · FAMILIA
      =============================================== */}

      {step === 1 && (
        <section className="request-section">

          <div className="section-head">
            <div className="eyebrow">
              PASO 1
            </div>

            <h2>
              ¿Qué necesitas solicitar?
            </h2>
          </div>

          <div className="request-family-grid">

            {visibleFamilies.map(
              (family) => {
                const config =
                  familyInfo[family]

                const Icon = config.icon

                return (
                  <button
                    key={family}
                    className="request-family-card"
                    onClick={() =>
                      selectFamily(family)
                    }
                  >
                    <div className="request-family-icon">
                      <Icon size={25} />
                    </div>

                    <div>
                      <h3>
                        {config.label}
                      </h3>

                      <p>
                        {config.description}
                      </p>
                    </div>

                    <ArrowRight
                      className="family-arrow"
                      size={20}
                    />
                  </button>
                )
              }
            )}

          </div>
        </section>
      )}


      {/* ===============================================
          PASO 2 · PROCESO
      =============================================== */}

      {step === 2 && (
        <section className="request-section">

          <button
            className="back-btn"
            onClick={() => setStep(1)}
          >
            <ArrowLeft size={17} />
            Volver a familias
          </button>

          <div className="section-head">
            <div className="eyebrow">
              PASO 2
            </div>

            <h2>
              Selecciona la gestión
            </h2>

            <p>
              {
                selectedFamily
                  ? familyInfo[selectedFamily]
                      .label
                  : ""
              }
            </p>
          </div>

          {availableProcesses.length ? (
            <div className="process-choice-list">

              {availableProcesses.map(
                (process) => (
                  <button
                    key={process.code}
                    className="process-choice-card"
                    onClick={() =>
                      selectProcess(process)
                    }
                  >
                    <div>
                      <span className="process-code">
                        {process.code}
                      </span>

                      <h3>
                        {process.name}
                      </h3>

                      <p>
                        {process.description}
                      </p>
                    </div>

                    <ArrowRight size={20} />
                  </button>
                )
              )}

            </div>
          ) : (
            <div className="empty">
              Todavía no hay procesos
              configurados para esta familia.
            </div>
          )}
        </section>
      )}


      {/* ===============================================
          PASO 3 · DATOS
      =============================================== */}

      {step === 3 && selectedProcess && (
        <section className="request-section">

          <button
            className="back-btn"
            onClick={() => setStep(2)}
          >
            <ArrowLeft size={17} />
            Volver a procesos
          </button>

          <div className="request-form-layout">

            <div className="request-form-main">

              <div className="section-head">
                <div className="eyebrow">
                  PASO 3
                </div>

                <h2>
                  {selectedProcess.name}
                </h2>

                <p>
                  Completa los antecedentes
                  necesarios para enviar
                  la solicitud.
                </p>
              </div>


              <div className="dynamic-form">

                {processFields.map(
                  (field) => (
                    <DynamicField
                      key={field.id}
                      field={field}
                      value={
                        values[field.id] ?? ""
                      }
                      onChange={(value) =>
                        updateValue(
                          field.id,
                          value
                        )
                      }
                    />
                  )
                )}

              </div>


              {/* ADJUNTOS */}

              <div className="request-upload">

                <div className="request-upload-head">
                  <Paperclip size={19} />

                  <div>
                    <strong>
                      Adjuntos
                    </strong>

                    <span>
                      Puedes agregar evidencia
                      o documentos de respaldo.
                    </span>
                  </div>
                </div>

                <label className="secondary-btn">
                  Agregar archivo

                  <input
                    type="file"
                    multiple
                    hidden
                    onChange={handleFiles}
                  />
                </label>

                {!!attachments.length && (
                  <div className="upload-file-list">

                    {attachments.map(
                      (file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="upload-file"
                        >
                          <FileText size={16} />

                          <span>
                            {file.name}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setAttachments(
                                (current) =>
                                  current.filter(
                                    (_, i) =>
                                      i !== index
                                  )
                              )
                            }
                          >
                            Quitar
                          </button>
                        </div>
                      )
                    )}

                  </div>
                )}

              </div>

            </div>


            {/* PANEL DERECHO */}

            <aside className="request-process-summary">

              <div className="eyebrow">
                ANTES DE ENVIAR
              </div>

              <h3>
                {selectedProcess.name}
              </h3>

              <div className="request-summary-row">
                <span>
                  Solicitante
                </span>

                <strong>
                  {currentUser.name}
                </strong>
              </div>

              <div className="request-summary-row">
                <span>Local</span>

                <strong>
                  {currentUser.local ?? "—"}
                </strong>
              </div>

              <div className="request-summary-row">
                <span>
                  Aprobación
                </span>

                <strong>
                  Jefatura Comercial y Clientes
                </strong>
              </div>

              <div className="request-summary-row">
                <span>
                  SLA aprobación
                </span>

                <strong>
                  {selectedProcess
                    .approvalSLAHours
                    ? `${selectedProcess.approvalSLAHours} h`
                    : "Por definir"}
                </strong>
              </div>

              <div className="request-summary-row">
                <span>
                  Confirmación
                </span>

                <strong>
                  {
                    selectedProcess
                      .confirmationHours
                  }{" "}
                  h
                </strong>
              </div>

              <button
                className="process-manual-link"
                type="button"
              >
                <FileText size={17} />

                Ver proceso, SLA y manual
              </button>

            </aside>

          </div>


          {/* SIGUIENTE */}

          <div className="request-actions">

            <button
              className="secondary-btn"
              onClick={() => setStep(2)}
            >
              Atrás
            </button>

            <button
              className="primary-btn"
              disabled={!formIsValid}
              onClick={() => setStep(4)}
            >
              Revisar solicitud
              <ArrowRight size={17} />
            </button>

          </div>

        </section>
      )}


      {/* ===============================================
          PASO 4 · REVISIÓN
      =============================================== */}

      {step === 4 && selectedProcess && (
        <section className="request-section">

          <button
            className="back-btn"
            onClick={() => setStep(3)}
          >
            <ArrowLeft size={17} />
            Volver a editar
          </button>

          <div className="section-head">
            <div className="eyebrow">
              PASO 4
            </div>

            <h2>
              Revisa antes de enviar
            </h2>
          </div>


          <div className="request-review">

            <div className="request-review-head">

              <div>
                <span>
                  {familyInfo[
                    selectedProcess.family
                  ].label}
                </span>

                <h3>
                  {selectedProcess.name}
                </h3>
              </div>

              <span className="status requested">
                Nueva solicitud
              </span>

            </div>


            <div className="request-review-grid">

              {processFields.map(
                (field) => (
                  <div
                    key={field.id}
                    className="request-review-field"
                  >
                    <span>
                      {field.label}
                    </span>

                    <strong>
                      {formatReviewValue(
                        field,
                        values[field.id]
                      )}
                    </strong>
                  </div>
                )
              )}

            </div>


            {!!attachments.length && (
              <div className="review-attachments">

                <span>
                  Adjuntos
                </span>

                {attachments.map(
                  (file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                    >
                      <Paperclip size={15} />
                      {file.name}
                    </div>
                  )
                )}

              </div>
            )}

          </div>


          <div className="request-actions">

            <button
              className="secondary-btn"
              onClick={() => setStep(3)}
            >
              Editar
            </button>

            <button
              className="primary-btn"
              onClick={submitRequest}
            >
              Enviar solicitud
              <CheckCircle2 size={17} />
            </button>

          </div>

        </section>
      )}

    </div>
  )
}


// ======================================================
// COMPONENTE DE CAMPO DINÁMICO
// ======================================================

function DynamicField({
  field,
  value,
  onChange,
}: {
  field: ProcessFieldDefinition
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="dynamic-field">

      <span>
        {field.label}

        {field.required && (
          <strong className="required-mark">
            *
          </strong>
        )}
      </span>

      {field.type === "TEXTAREA" ? (
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      ) : field.type === "SELECT" ? (
        <select
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        >
          <option value="">
            Seleccionar
          </option>

          {field.options?.map(
            (option) => (
              <option
                key={option}
                value={option}
              >
                {option}
              </option>
            )
          )}
        </select>
      ) : (
        <input
          value={value}
          placeholder={field.placeholder}
          type={
            field.type === "NUMBER" ||
            field.type === "CURRENCY"
              ? "number"
              : field.type === "DATE"
                ? "date"
                : "text"
          }
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      )}

    </label>
  )
}


// ======================================================
// FORMATO VISTA REVISIÓN
// ======================================================

function formatReviewValue(
  field: ProcessFieldDefinition,
  value?: string
) {
  if (!value) {
    return "—"
  }

  if (field.type === "CURRENCY") {
    const number = Number(value)

    if (!Number.isNaN(number)) {
      return new Intl.NumberFormat(
        "es-CL",
        {
          style: "currency",
          currency: "CLP",
          maximumFractionDigits: 0,
        }
      ).format(number)
    }
  }

  return value
}
