import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
} from "react"

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Layers3,
  Link2,
  Package,
  Paperclip,
  Users,
} from "lucide-react"

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom"

import "./NuevaSolicitud.css"

import {
  mockFormBreaches,
  mockFormExecutions,
  mockForms,
  mockProcessFields,
  mockProcesses,
} from "../data/mockData"

import {
  createDemoRequest,
  getDemoRequests,
  nextDemoRequestId,
} from "../services/demoStore"

import {
  initialRequestRouting,
} from "../services/workflow"

import type {
  ProcessDefinition,
  ProcessFieldDefinition,
  RequestFamily,
  RequestItem,
  UserScope,
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
      "Bonificaciones, pedidos, traslados, patentes y otras gestiones asociadas a unidades.",
    icon: Package,
  },
  INSUMOS_SHOWROOM: {
    label: "Insumos y Showroom",
    description:
      "Insumos, zonas de experiencia, mobiliario, equipamiento e instalaciones del local.",
    icon: Layers3,
  },
  COLABORADORES: {
    label: "Colaboradores",
    description:
      "Credenciales, pie de firma, accesos y otras necesidades del equipo.",
    icon: Users,
  },
  OTROS: {
    label: "Otros",
    description:
      "Solicitudes que todavía no están incorporadas al catálogo de procesos.",
    icon: FileText,
  },
}


const activeStatuses = new Set([
  "RECIBIDA",
  "INFORMACION_REQUERIDA",
  "PENDIENTE_APROBACION",
  "APROBADA",
  "APROBADA_CON_AJUSTE",
  "EN_GESTION",
  "RESUELTA_POR_CONFIRMAR",
])


export default function NuevaSolicitud({
  currentUser,
}: {
  currentUser: UserScope
}) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const processFromUrl = searchParams.get("process")
  const breachFromUrl = searchParams.get("breach")

  const [step, setStep] = useState(1)
  const [selectedFamily, setSelectedFamily] =
    useState<RequestFamily | null>(null)
  const [selectedProcess, setSelectedProcess] =
    useState<ProcessDefinition | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [attachments, setAttachments] = useState<File[]>([])
  const [createdId, setCreatedId] = useState("")
  const [duplicateId, setDuplicateId] = useState("")
  const [error, setError] = useState("")


  const sourceBreach = useMemo(
    () =>
      breachFromUrl
        ? mockFormBreaches.find(
            (breach) => breach.id === breachFromUrl
          )
        : undefined,
    [breachFromUrl]
  )


  const sourceExecution = useMemo(
    () =>
      sourceBreach
        ? mockFormExecutions.find(
            (execution) =>
              execution.id === sourceBreach.executionId
          )
        : undefined,
    [sourceBreach]
  )


  const sourceForm = useMemo(
    () =>
      sourceExecution
        ? mockForms.find(
            (form) => form.code === sourceExecution.formCode
          )
        : undefined,
    [sourceExecution]
  )


  const requestLocal =
    sourceBreach?.local ?? currentUser.local ?? "Vespucio"


  useEffect(() => {
    if (!processFromUrl || !sourceBreach) return

    const process = mockProcesses.find(
      (item) =>
        item.code === processFromUrl && item.active
    )

    if (!process) return

    setSelectedFamily(process.family)
    setSelectedProcess(process)
    setStep(3)

    setValues((current) => {
      const next = { ...current }

      if (process.code === "COL-CRE-01") {
        next["CRE_LOCAL"] = sourceBreach.local
      }

      if (process.code === "COL-FIR-01") {
        next["FIR_LOCAL"] = sourceBreach.local
      }

      return next
    })
  }, [processFromUrl, sourceBreach])


  useEffect(() => {
    if (!sourceBreach) {
      setDuplicateId("")
      return
    }

    const existing = getDemoRequests().find(
      (request) =>
        request.originBreachId === sourceBreach.id &&
        activeStatuses.has(request.status)
    )

    setDuplicateId(existing?.id ?? "")
  }, [sourceBreach])


  const visibleFamilies = useMemo(() => {
    const all = Object.keys(familyInfo) as RequestFamily[]

    if (currentUser.role === "VENDEDOR") {
      return all.filter(
        (family) => family !== "INSUMOS_SHOWROOM"
      )
    }

    return all
  }, [currentUser.role])


  const availableProcesses = useMemo(() => {
    if (!selectedFamily) return []

    return mockProcesses
      .filter(
        (process) =>
          process.active &&
          process.family === selectedFamily &&
          process.requesterRoles.includes(currentUser.role)
      )
      .sort((a, b) => a.order - b.order)
  }, [selectedFamily, currentUser.role])


  const processFields = useMemo(() => {
    if (!selectedProcess) return []

    return mockProcessFields
      .filter(
        (field) =>
          field.active &&
          field.processCode === selectedProcess.code
      )
      .sort((a, b) => a.order - b.order)
  }, [selectedProcess])


  const formIsValid = processFields
    .filter((field) => field.required)
    .every((field) => values[field.id]?.trim())


  function updateValue(fieldId: string, value: string) {
    setValues((current) => ({
      ...current,
      [fieldId]: value,
    }))
  }


  function selectFamily(family: RequestFamily) {
    setSelectedFamily(family)
    setSelectedProcess(null)
    setValues({})
    setAttachments([])
    setError("")
    setStep(2)
  }


  function selectProcess(process: ProcessDefinition) {
    setSelectedProcess(process)
    setValues({})
    setAttachments([])
    setError("")
    setStep(3)
  }


  function handleFiles(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files ?? [])

    setAttachments((current) => [
      ...current,
      ...files,
    ])

    event.target.value = ""
  }


  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter(
        (_, currentIndex) => currentIndex !== index
      )
    )
  }


  function submitRequest() {
    if (!selectedProcess || !formIsValid) return

    if (duplicateId) {
      setError(
        "Esta brecha ya tiene una solicitud activa."
      )
      return
    }

    const routing = initialRequestRouting(
      currentUser,
      selectedProcess.code,
      requestLocal
    )

    const id = nextDemoRequestId()

    const request: RequestItem = {
      id,
      processCode: selectedProcess.code,
      processName: selectedProcess.name,
      family: selectedProcess.family,
      requesterEmail: currentUser.email,
      requesterName: currentUser.name,
      requesterRole: currentUser.role,
      local: requestLocal,
      fields: processFields.map((field) => ({
        fieldId: field.id,
        requestedValue: values[field.id] ?? "",
      })),
      createdAt: new Date().toISOString(),
      approvalSLAPausedMinutes: 0,
      resolutionSLAHours:
        selectedProcess.resolutionSLAHours,
      resolutionSLAPausedMinutes: 0,
      reopened: false,
      autoClosed: false,
      originFormCode: sourceForm?.code,
      originExecutionId: sourceBreach?.executionId,
      originBreachId: sourceBreach?.id,
      internalCheckpoints:
        selectedProcess.internalCheckpoints?.map(
          (checkpoint) => ({
            checkpointId: checkpoint.id,
            completed: false,
          })
        ) ?? [],
      ...routing,
    }

    createDemoRequest(request)
    setCreatedId(id)
    setStep(4)
  }


  function resetRequest() {
    setStep(1)
    setSelectedFamily(null)
    setSelectedProcess(null)
    setValues({})
    setAttachments([])
    setCreatedId("")
    setDuplicateId("")
    setError("")
  }


  if (createdId && selectedProcess) {
    return (
      <div className="new-request-page">
        <div className="request-success">
          <div className="request-success-icon">
            <CheckCircle2 size={34} />
          </div>

          <div className="eyebrow">
            SOLICITUD REGISTRADA
          </div>

          <h1>Solicitud ingresada</h1>

          <p>
            <strong>{selectedProcess.name}</strong>{" "}
            ya forma parte del seguimiento del piloto.
          </p>

          <div className="request-success-info">
            <div>
              <span>Solicitud</span>
              <strong>{createdId}</strong>
            </div>

            <div>
              <span>Local</span>
              <strong>{requestLocal}</strong>
            </div>

            <div>
              <span>Estado inicial</span>
              <strong>
                {currentUser.role === "JEFATURA_LOCAL"
                  ? "Ingresada"
                  : "Revisión local"}
              </strong>
            </div>

            <div>
              <span>Fuente</span>
              <strong>Piloto Demo</strong>
            </div>
          </div>

          {sourceBreach && (
            <div className="request-review">
              <div className="request-review-head">
                <div>
                  <span>ORIGEN</span>
                  <h3>
                    {sourceForm?.name ?? "Formulario"}
                  </h3>
                </div>

                <span className="status requested">
                  Brecha vinculada
                </span>
              </div>

              <div className="request-review-grid">
                <div className="request-review-field">
                  <span>Local</span>
                  <strong>{sourceBreach.local}</strong>
                </div>

                <div className="request-review-field">
                  <span>Sección</span>
                  <strong>{sourceBreach.section}</strong>
                </div>

                <div className="request-review-field">
                  <span>Brecha</span>
                  <strong>{sourceBreach.question}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="request-actions">
            <button
              className="secondary-btn"
              onClick={resetRequest}
            >
              Crear otra
            </button>

            <button
              className="primary-btn"
              onClick={() =>
                navigate(`/solicitudes/${createdId}`)
              }
            >
              Ver solicitud
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="new-request-page">
      <div className="page-head">
        <div className="eyebrow">SOLICITUDES</div>
        <h1>Nueva solicitud</h1>
        <p>
          Selecciona qué necesitas. La app identificará
          el proceso y el flujo correspondiente.
        </p>
      </div>

      <div
        style={{
          marginBottom: 18,
          padding: "11px 14px",
          border: "1px solid rgba(255,183,77,.25)",
          borderRadius: 10,
          background: "rgba(255,183,77,.06)",
          fontSize: 12,
          color: "#e8c37e",
        }}
      >
        Modo Demo · La solicitud se guarda en el piloto
        y puede continuar su flujo al cambiar de perfil.
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginBottom: 18,
            padding: 14,
            border: "1px solid rgba(239,57,67,.35)",
            borderRadius: 10,
            color: "#ffadb2",
            background: "rgba(239,57,67,.07)",
          }}
        >
          <AlertCircle size={19} />
          <span>{error}</span>
        </div>
      )}

      {duplicateId && (
        <div className="request-review">
          <div className="request-review-head">
            <div>
              <span>SOLICITUD EXISTENTE</span>
              <h3>
                Esta brecha ya está siendo gestionada
              </h3>
            </div>

            <span className="status requested">
              Solicitado
            </span>
          </div>

          <div className="request-actions">
            <button
              className="primary-btn"
              onClick={() =>
                navigate(`/solicitudes/${duplicateId}`)
              }
            >
              Ver solicitud {duplicateId}
            </button>
          </div>
        </div>
      )}

      {sourceBreach && (
        <div className="request-review">
          <div className="request-review-head">
            <div>
              <span>SOLICITUD DESDE BRECHA</span>
              <h3>
                {sourceForm?.name ?? "Revisión del local"}
              </h3>
            </div>

            <span className="status requested">
              Precargada
            </span>
          </div>

          <div className="request-review-grid">
            <div className="request-review-field">
              <span>Local</span>
              <strong>{sourceBreach.local}</strong>
            </div>

            <div className="request-review-field">
              <span>Sección</span>
              <strong>{sourceBreach.section}</strong>
            </div>

            <div className="request-review-field">
              <span>Brecha detectada</span>
              <strong>{sourceBreach.question}</strong>
            </div>

            <div className="request-review-field">
              <span>Proceso sugerido</span>
              <strong>
                {selectedProcess?.name ??
                  sourceBreach.mappedProcessCode ??
                  "—"}
              </strong>
            </div>
          </div>
        </div>
      )}

      <div className="request-stepper">
        <Step
          number={1}
          label="Familia"
          caption="¿Qué necesitas?"
          active={step >= 1}
        />
        <Step
          number={2}
          label="Proceso"
          caption="Tipo de gestión"
          active={step >= 2}
        />
        <Step
          number={3}
          label="Datos"
          caption="Completar solicitud"
          active={step >= 3}
        />
        <Step
          number={4}
          label="Enviar"
          caption="Revisión final"
          active={step >= 4}
        />
      </div>

      {step === 1 && (
        <section className="request-section">
          <div className="section-head">
            <div className="eyebrow">PASO 1</div>
            <h2>¿Qué necesitas solicitar?</h2>
          </div>

          <div className="request-family-grid">
            {visibleFamilies.map((family) => {
              const config = familyInfo[family]
              const Icon = config.icon

              return (
                <button
                  key={family}
                  className="request-family-card"
                  onClick={() => selectFamily(family)}
                >
                  <div className="request-family-icon">
                    <Icon size={25} />
                  </div>

                  <div>
                    <h3>{config.label}</h3>
                    <p>{config.description}</p>
                  </div>

                  <ArrowRight
                    className="family-arrow"
                    size={20}
                  />
                </button>
              )
            })}
          </div>
        </section>
      )}

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
            <div className="eyebrow">PASO 2</div>
            <h2>Selecciona la gestión</h2>
            <p>
              {selectedFamily
                ? familyInfo[selectedFamily].label
                : ""}
            </p>
          </div>

          {availableProcesses.length > 0 ? (
            <div className="process-choice-list">
              {availableProcesses.map((process) => (
                <button
                  key={process.code}
                  className="process-choice-card"
                  onClick={() => selectProcess(process)}
                >
                  <div>
                    <span className="process-code">
                      {process.code}
                    </span>
                    <h3>{process.name}</h3>
                    <p>{process.description}</p>
                  </div>

                  <ArrowRight size={20} />
                </button>
              ))}
            </div>
          ) : (
            <div className="empty">
              Todavía no hay procesos configurados para
              esta familia y este perfil.
            </div>
          )}
        </section>
      )}

      {step === 3 && selectedProcess && (
        <section className="request-section">
          {!sourceBreach && (
            <button
              className="back-btn"
              onClick={() => setStep(2)}
            >
              <ArrowLeft size={17} />
              Volver a procesos
            </button>
          )}

          <div className="request-form-layout">
            <div className="request-form-main">
              <div className="section-head">
                <div className="eyebrow">PASO 3</div>
                <h2>{selectedProcess.name}</h2>
                <p>
                  Completa los antecedentes necesarios
                  para enviar la solicitud.
                </p>
              </div>

              <div className="dynamic-form">
                {processFields.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={values[field.id] ?? ""}
                    onChange={(value) =>
                      updateValue(field.id, value)
                    }
                  />
                ))}
              </div>

              <div className="request-upload">
                <div className="request-upload-head">
                  <Paperclip size={19} />
                  <div>
                    <strong>Adjuntos</strong>
                    <span>
                      Puedes agregar evidencia o documentos
                      de respaldo.
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

                {attachments.length > 0 && (
                  <div className="upload-file-list">
                    {attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="upload-file"
                      >
                        <FileText size={16} />
                        <span>{file.name}</span>
                        <button
                          type="button"
                          onClick={() =>
                            removeAttachment(index)
                          }
                        >
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <aside className="request-process-summary">
              <div className="eyebrow">ANTES DE ENVIAR</div>
              <h3>{selectedProcess.name}</h3>

              <SummaryRow
                label="Solicitante"
                value={currentUser.name}
              />
              <SummaryRow
                label="Local"
                value={requestLocal}
              />
              {sourceBreach && (
                <SummaryRow
                  label="Origen"
                  value={sourceForm?.name ?? "Formulario"}
                />
              )}
              <SummaryRow
                label="Confirmación"
                value={`${selectedProcess.confirmationHours} h`}
              />

              <button
                className="process-manual-link"
                type="button"
              >
                <FileText size={17} />
                Ver proceso, SLA y manual
              </button>
            </aside>
          </div>

          <div className="request-actions">
            {!sourceBreach && (
              <button
                className="secondary-btn"
                onClick={() => setStep(2)}
              >
                Atrás
              </button>
            )}

            <button
              className="primary-btn"
              disabled={!formIsValid || Boolean(duplicateId)}
              onClick={() => setStep(4)}
            >
              Revisar solicitud
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      )}

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
            <div className="eyebrow">PASO 4</div>
            <h2>Revisa antes de enviar</h2>
            <p>
              Confirma que la información esté correcta.
            </p>
          </div>

          <div className="request-review">
            <div className="request-review-head">
              <div>
                <span>
                  {familyInfo[selectedProcess.family].label}
                </span>
                <h3>{selectedProcess.name}</h3>
              </div>

              <span className="status requested">
                Nueva solicitud
              </span>
            </div>

            <div className="request-review-grid">
              <div className="request-review-field">
                <span>Solicitante</span>
                <strong>{currentUser.name}</strong>
              </div>

              <div className="request-review-field">
                <span>Local</span>
                <strong>{requestLocal}</strong>
              </div>

              {processFields.map((field) => (
                <div
                  key={field.id}
                  className="request-review-field"
                >
                  <span>{field.label}</span>
                  <strong>
                    {formatReviewValue(
                      field,
                      values[field.id]
                    )}
                  </strong>
                </div>
              ))}
            </div>

            {attachments.length > 0 && (
              <div className="review-attachments">
                <span>Adjuntos</span>
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${index}`}>
                    <Paperclip size={15} />
                    {file.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          {sourceBreach && (
            <div className="request-review">
              <div className="request-review-head">
                <div>
                  <span>TRAZABILIDAD</span>
                  <h3>Origen de la solicitud</h3>
                </div>
                <Link2 size={18} />
              </div>

              <div className="request-review-grid">
                <div className="request-review-field">
                  <span>Formulario</span>
                  <strong>
                    {sourceForm?.code ?? sourceBreach.formCode}
                  </strong>
                </div>

                <div className="request-review-field">
                  <span>Ejecución</span>
                  <strong>{sourceBreach.executionId}</strong>
                </div>

                <div className="request-review-field">
                  <span>ID Brecha</span>
                  <strong>{sourceBreach.id}</strong>
                </div>
              </div>
            </div>
          )}

          <div className="request-actions">
            <button
              className="secondary-btn"
              onClick={() => setStep(3)}
            >
              Editar
            </button>

            <button
              className="primary-btn"
              disabled={Boolean(duplicateId)}
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


function Step({
  number,
  label,
  caption,
  active,
}: {
  number: number
  label: string
  caption: string
  active: boolean
}) {
  return (
    <div
      className={`request-step ${active ? "active" : ""}`}
    >
      <span>{number}</span>
      <div>
        <strong>{label}</strong>
        <small>{caption}</small>
      </div>
    </div>
  )
}


function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="request-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}


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
          <strong className="required-mark">*</strong>
        )}
      </span>

      {field.type === "TEXTAREA" ? (
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : field.type === "SELECT" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">Seleccionar</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
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
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </label>
  )
}


function formatReviewValue(
  field: ProcessFieldDefinition,
  value?: string
) {
  if (!value) return "—"

  if (field.type === "CURRENCY") {
    const number = Number(value)

    if (!Number.isNaN(number)) {
      return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0,
      }).format(number)
    }
  }

  return value
}
