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
  Package,
  Paperclip,
  Users,
} from "lucide-react"
import { useNavigate, useSearchParams } from "react-router-dom"
import "./NuevaSolicitud.css"
import {
  mockFormBreaches,
  mockFormExecutions,
  mockForms,
} from "../data/mockData"
import {
  createDemoRequest,
  getDemoRequests,
  nextDemoRequestId,
} from "../services/demoStore"
import {
  getLocalOptions,
  getProcessesForUser,
  getRequestFields,
  getSupplyCatalog,
} from "../services/requestCatalog"
import { initialRequestRouting } from "../services/workflow"
import type {
  ProcessConfig,
  ProcessFieldDefinition,
  RequestFamily,
  RequestItem,
  RequestStatus,
  UserScope,
} from "../types"

type FormValues = Record<string, string>

type RepeatRow = FormValues

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
      "Bonificaciones, traslados, patentes, facturación y otras gestiones asociadas a unidades.",
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
      "Credenciales, pie de firma, habilitación tecnológica y otras necesidades del equipo.",
    icon: Users,
  },
  COMERCIAL: {
    label: "Comercial / Marketing",
    description:
      "Materiales, patentes de exhibición y solicitudes del área Comercial.",
    icon: Layers3,
  },
  OTROS: {
    label: "Otros",
    description:
      "Procesos transversales que no pertenecen a las familias anteriores.",
    icon: FileText,
  },
}

const activeStatuses = new Set<RequestStatus>([
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
    useState<ProcessConfig | null>(null)
  const [values, setValues] = useState<FormValues>({})
  const [repeatRows, setRepeatRows] = useState<RepeatRow[]>([{}])
  const [attachments, setAttachments] = useState<File[]>([])
  const [createdId, setCreatedId] = useState("")
  const [createdStatus, setCreatedStatus] = useState<RequestStatus | null>(null)
  const [duplicateId, setDuplicateId] = useState("")
  const [error, setError] = useState("")

  const sourceBreach = useMemo(
    () =>
      breachFromUrl
        ? mockFormBreaches.find((breach) => breach.id === breachFromUrl)
        : undefined,
    [breachFromUrl]
  )

  const sourceExecution = useMemo(
    () =>
      sourceBreach
        ? mockFormExecutions.find(
            (execution) => execution.id === sourceBreach.executionId
          )
        : undefined,
    [sourceBreach]
  )

  const sourceForm = useMemo(
    () =>
      sourceExecution
        ? mockForms.find((form) => form.code === sourceExecution.formCode)
        : undefined,
    [sourceExecution]
  )

  const localConfig = useMemo(
    () => getLocalOptions(currentUser, sourceBreach?.local),
    [currentUser, sourceBreach?.local]
  )

  const [selectedLocal, setSelectedLocal] = useState(localConfig.selected)

  useEffect(() => {
    setSelectedLocal(localConfig.selected)
  }, [localConfig.selected])

  const availableProcesses = useMemo(
    () => getProcessesForUser(currentUser),
    [currentUser]
  )

  useEffect(() => {
    if (!processFromUrl) return

    const process = availableProcesses.find(
      (item) => item.code === processFromUrl && item.active
    )

    if (!process) return

    setSelectedFamily(process.family)
    setSelectedProcess(process)
    setStep(3)
  }, [processFromUrl, availableProcesses])

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
    return (Object.keys(familyInfo) as RequestFamily[]).filter((family) =>
      availableProcesses.some((process) => process.family === family)
    )
  }, [availableProcesses])

  const familyProcesses = useMemo(() => {
    if (!selectedFamily) return []
    return availableProcesses.filter(
      (process) => process.family === selectedFamily
    )
  }, [availableProcesses, selectedFamily])

  const allProcessFields = useMemo(() => {
    if (!selectedProcess) return []
    return getRequestFields(selectedProcess.code)
  }, [selectedProcess])

  const visibleFields = allProcessFields.filter(
    (field) => field.visibleBeforeSubmit !== false && !field.readOnly
  )
  const simpleFields = visibleFields.filter((field) => !field.repeatable)
  const repeatableFields = visibleFields.filter((field) => field.repeatable)

  useEffect(() => {
    if (!selectedProcess) return

    setValues({})
    setAttachments([])
    setError("")

    if (selectedProcess.formMode === "INSUMOS_2_0") {
      const stockField = allProcessFields.find(
        (field) => field.key === "STOCK_ACTUAL"
      )
      const itemField = allProcessFields.find(
        (field) => field.key === "INSUMO"
      )

      const sample = getSupplyCatalog()
        .filter((item) => item.family.toLowerCase().includes("cafe"))
        .slice(0, 6)

      if (stockField && itemField && sample.length) {
        setRepeatRows(
          sample.map((item) => ({
            [itemField.id]: item.code,
            [stockField.id]: "",
          }))
        )
      } else {
        setRepeatRows([{}])
      }
    } else {
      setRepeatRows([{}])
    }
  }, [selectedProcess, allProcessFields])

  function selectFamily(family: RequestFamily) {
    setSelectedFamily(family)
    setSelectedProcess(null)
    setStep(2)
  }

  function selectProcess(process: ProcessConfig) {
    setSelectedProcess(process)
    setStep(3)
  }

  function updateValue(fieldId: string, value: string) {
    setValues((current) => ({ ...current, [fieldId]: value }))
  }

  function updateRepeatValue(
    rowIndex: number,
    fieldId: string,
    value: string
  ) {
    setRepeatRows((current) =>
      current.map((row, index) =>
        index === rowIndex ? { ...row, [fieldId]: value } : row
      )
    )
  }

  function addRepeatRow() {
    setRepeatRows((current) => [...current, {}])
  }

  function removeRepeatRow(index: number) {
    setRepeatRows((current) => {
      const next = current.filter((_, rowIndex) => rowIndex !== index)
      return next.length ? next : [{}]
    })
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    setAttachments((current) => [...current, ...files])
    event.target.value = ""
  }

  function removeAttachment(index: number) {
    setAttachments((current) =>
      current.filter((_, currentIndex) => currentIndex !== index)
    )
  }

  function validateField(field: ProcessFieldDefinition, value: string) {
    const trimmed = value.trim()

    if (field.required && !trimmed) {
      return `${field.label} es obligatorio.`
    }

    if (!trimmed) return ""

    if (field.type === "PHONE") {
      const digits = trimmed.replace(/\D/g, "")
      if (digits.length < 8) {
        return `${field.label} debe contener un número de teléfono válido.`
      }
    }

    if (field.type === "EMAIL" && !/^\S+@\S+\.\S+$/.test(trimmed)) {
      return `${field.label} debe contener un correo válido.`
    }

    if (field.type === "VIN") {
      const vin = trimmed.replace(/\s/g, "")
      if (vin.length !== 17) {
        return `${field.label} debe tener 17 caracteres.`
      }
    }

    return ""
  }

  function validateForm() {
    if (!selectedLocal) return "Debes seleccionar un local."

    for (const field of simpleFields) {
      const message = validateField(field, values[field.id] ?? "")
      if (message) return message
    }

    if (repeatableFields.length) {
      const meaningfulRows = repeatRows.filter((row) =>
        repeatableFields.some((field) => (row[field.id] ?? "").trim())
      )

      if (!meaningfulRows.length) {
        return "Debes completar al menos una línea de detalle."
      }

      for (const row of meaningfulRows) {
        for (const field of repeatableFields) {
          // En Insumos 2.0 el insumo viene cargado por el sistema.
          const value = row[field.id] ?? ""
          const message = validateField(field, value)
          if (message) return message
        }
      }
    }

    if (selectedProcess?.requiresAttachment && attachments.length === 0) {
      return "Este proceso requiere al menos un adjunto."
    }

    return ""
  }

  function buildRequestFields() {
    const simple = simpleFields.map((field) => ({
      fieldId: field.id,
      requestedValue: values[field.id] ?? "",
    }))

    const repeated = repeatRows
      .filter((row) =>
        repeatableFields.some((field) => (row[field.id] ?? "").trim())
      )
      .flatMap((row, rowIndex) =>
        repeatableFields.map((field) => ({
          fieldId: `${field.id}__${rowIndex + 1}`,
          requestedValue: row[field.id] ?? "",
        }))
      )

    return [...simple, ...repeated]
  }

  function submitRequest() {
    if (!selectedProcess) return

    if (duplicateId) {
      setError("Esta brecha ya tiene una solicitud activa.")
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    const routing = initialRequestRouting(
      currentUser,
      selectedProcess.code,
      selectedLocal
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
      local: selectedLocal,
      fields: buildRequestFields(),
      createdAt: new Date().toISOString(),
      approvalSLAPausedMinutes: 0,
      resolutionSLAPausedMinutes: 0,
      reopened: false,
      autoClosed: false,
      originFormCode: sourceForm?.code,
      originExecutionId: sourceBreach?.executionId,
      originBreachId: sourceBreach?.id,
      internalCheckpoints:
        selectedProcess.code === "UNI-BON-01"
          ? [
              { checkpointId: "BON_SOLICITUD_MARCA", completed: false },
              { checkpointId: "BON_FACTURA_RECIBIDA", completed: false },
            ]
          : [],
      ...routing,
    }

    createDemoRequest(request)
    setCreatedId(id)
    setCreatedStatus(routing.status)
    setStep(4)
  }

  if (createdId && selectedProcess) {
    return (
      <div className="new-request-page">
        <div className="request-success">
          <div className="request-success-icon">
            <CheckCircle2 size={34} />
          </div>
          <div className="eyebrow">SOLICITUD REGISTRADA</div>
          <h1>Solicitud ingresada</h1>
          <p>
            <strong>{selectedProcess.name}</strong> ya forma parte del
            seguimiento del piloto.
          </p>

          <div className="request-success-info">
            <div>
              <span>Solicitud</span>
              <strong>{createdId}</strong>
            </div>
            <div>
              <span>Local</span>
              <strong>{selectedLocal}</strong>
            </div>
            <div>
              <span>Estado inicial</span>
              <strong>{statusLabel(createdStatus)}</strong>
            </div>
            <div>
              <span>Fuente</span>
              <strong>Piloto Demo</strong>
            </div>
          </div>

          {selectedProcess.formMode === "INSUMOS_2_0" && (
            <div className="request-review">
              <div className="request-review-head">
                <div>
                  <span>INSUMOS 2.0</span>
                  <h3>Stock registrado</h3>
                </div>
              </div>
              <p>
                El cálculo automático de cantidad a reponer queda separado de
                esta pantalla. El motor definitivo usará hasta 6 meses de datos
                disponibles de cotizaciones, ventas, stock y consumo histórico,
                sin mostrar el objetivo antes del envío.
              </p>
            </div>
          )}

          <div className="request-actions">
            <button
              className="secondary-btn"
              onClick={() => navigate("/solicitudes")}
            >
              Ver solicitudes
            </button>
            <button
              className="primary-btn"
              onClick={() => navigate(`/solicitudes/${createdId}`)}
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
          El tipo de gestión define los campos, responsable, aprobaciones y
          seguimiento. El local se obtiene automáticamente desde el perfil.
        </p>
      </div>

      {error && (
        <div
          style={{
            display: "flex",
            gap: 10,
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
              <h3>Esta brecha ya está siendo gestionada</h3>
            </div>
            <span className="status requested">Solicitado</span>
          </div>
          <div className="request-actions">
            <button
              className="primary-btn"
              onClick={() => navigate(`/solicitudes/${duplicateId}`)}
            >
              Ver solicitud {duplicateId}
            </button>
          </div>
        </div>
      )}

      <div className="request-stepper">
        <Step number={1} label="Familia" caption="¿Qué necesitas?" active={step >= 1} />
        <Step number={2} label="Proceso" caption="Tipo de gestión" active={step >= 2} />
        <Step number={3} label="Datos" caption="Completar solicitud" active={step >= 3} />
        <Step number={4} label="Enviar" caption="Revisión final" active={step >= 4} />
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
                  <ArrowRight className="family-arrow" size={20} />
                </button>
              )
            })}
          </div>
        </section>
      )}

      {step === 2 && selectedFamily && (
        <section className="request-section">
          <button className="back-btn" onClick={() => setStep(1)}>
            <ArrowLeft size={17} />
            Volver a familias
          </button>
          <div className="section-head">
            <div className="eyebrow">PASO 2</div>
            <h2>Selecciona la gestión</h2>
            <p>{familyInfo[selectedFamily].label}</p>
          </div>
          <div className="process-choice-list">
            {familyProcesses.map((process) => (
              <button
                key={process.code}
                className="process-choice-card"
                onClick={() => selectProcess(process)}
              >
                <div>
                  <span className="process-code">{process.code}</span>
                  <h3>{process.name}</h3>
                  <p>{process.description}</p>
                </div>
                <ArrowRight size={20} />
              </button>
            ))}
          </div>
        </section>
      )}

      {step === 3 && selectedProcess && (
        <section className="request-section">
          {!sourceBreach && (
            <button className="back-btn" onClick={() => setStep(2)}>
              <ArrowLeft size={17} />
              Volver a procesos
            </button>
          )}

          <div className="request-form-layout">
            <div className="request-form-main">
              <div className="section-head">
                <div className="eyebrow">PASO 3</div>
                <h2>{selectedProcess.name}</h2>
                <p>{selectedProcess.description}</p>
              </div>

              <div className="dynamic-form">
                <LocalField
                  localConfig={localConfig}
                  value={selectedLocal}
                  onChange={setSelectedLocal}
                />

                {simpleFields.map((field) => (
                  <DynamicField
                    key={field.id}
                    field={field}
                    value={values[field.id] ?? ""}
                    onChange={(value) => updateValue(field.id, value)}
                    localOptions={localConfig.options}
                  />
                ))}
              </div>

              {repeatableFields.length > 0 && (
                <div className="request-review" style={{ marginTop: 18 }}>
                  <div className="request-review-head">
                    <div>
                      <span>DETALLE</span>
                      <h3>
                        {selectedProcess.formMode === "INSUMOS_2_0"
                          ? "Informa únicamente el stock actual"
                          : "Ítems de la solicitud"}
                      </h3>
                    </div>
                  </div>

                  {selectedProcess.formMode === "INSUMOS_2_0" && (
                    <p>
                      El objetivo de stock no se muestra antes de enviar. En el
                      demo se carga un subconjunto del catálogo; al conectar
                      Lists se filtrará automáticamente por local.
                    </p>
                  )}

                  {repeatRows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="dynamic-form"
                      style={{
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop: "1px solid rgba(255,255,255,.08)",
                      }}
                    >
                      {repeatableFields.map((field) => (
                        <DynamicField
                          key={`${field.id}-${rowIndex}`}
                          field={field}
                          value={row[field.id] ?? ""}
                          onChange={(value) =>
                            updateRepeatValue(rowIndex, field.id, value)
                          }
                          localOptions={localConfig.options}
                          forceReadOnly={
                            selectedProcess.formMode === "INSUMOS_2_0" &&
                            field.type === "CATALOG_ITEM"
                          }
                        />
                      ))}

                      {selectedProcess.formMode !== "INSUMOS_2_0" && (
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => removeRepeatRow(rowIndex)}
                        >
                          Quitar línea
                        </button>
                      )}
                    </div>
                  ))}

                  {selectedProcess.formMode !== "INSUMOS_2_0" && (
                    <button
                      type="button"
                      className="secondary-btn"
                      style={{ marginTop: 14 }}
                      onClick={addRepeatRow}
                    >
                      Agregar otro ítem
                    </button>
                  )}
                </div>
              )}

              {selectedProcess.allowsAttachments && (
                <div className="request-upload">
                  <div className="request-upload-head">
                    <Paperclip size={19} />
                    <div>
                      <strong>Adjuntos</strong>
                      <span>
                        {selectedProcess.requiresAttachment
                          ? "Este proceso requiere respaldo."
                          : "Puedes agregar evidencia o documentos de respaldo."}
                      </span>
                    </div>
                  </div>
                  <label className="secondary-btn">
                    Agregar archivo
                    <input type="file" multiple hidden onChange={handleFiles} />
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
                            onClick={() => removeAttachment(index)}
                          >
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <aside className="request-process-summary">
              <div className="eyebrow">ANTES DE ENVIAR</div>
              <h3>{selectedProcess.name}</h3>
              <SummaryRow label="Solicitante" value={currentUser.name} />
              <SummaryRow label="Local" value={selectedLocal || "—"} />
              <SummaryRow
                label="Área responsable"
                value={selectedProcess.areaLabel ?? "Según configuración"}
              />
              <SummaryRow
                label="Confirmación"
                value={`${selectedProcess.confirmationHours} h`}
              />
            </aside>
          </div>

          <div className="request-actions">
            {!sourceBreach && (
              <button className="secondary-btn" onClick={() => setStep(2)}>
                Atrás
              </button>
            )}
            <button
              className="primary-btn"
              disabled={Boolean(duplicateId)}
              onClick={() => {
                const message = validateForm()
                if (message) {
                  setError(message)
                  return
                }
                setError("")
                setStep(4)
              }}
            >
              Revisar solicitud
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      )}

      {step === 4 && selectedProcess && (
        <section className="request-section">
          <button className="back-btn" onClick={() => setStep(3)}>
            <ArrowLeft size={17} />
            Volver a editar
          </button>
          <div className="section-head">
            <div className="eyebrow">PASO 4</div>
            <h2>Revisa antes de enviar</h2>
          </div>

          <div className="request-review">
            <div className="request-review-head">
              <div>
                <span>{familyInfo[selectedProcess.family].label}</span>
                <h3>{selectedProcess.name}</h3>
              </div>
              <span className="status requested">Nueva solicitud</span>
            </div>

            <div className="request-review-grid">
              <ReviewValue label="Solicitante" value={currentUser.name} />
              <ReviewValue label="Local" value={selectedLocal} />
              {simpleFields.map((field) => (
                <ReviewValue
                  key={field.id}
                  label={field.label}
                  value={formatReviewValue(field, values[field.id])}
                />
              ))}
            </div>

            {repeatableFields.length > 0 && (
              <div style={{ marginTop: 16 }}>
                {repeatRows
                  .filter((row) =>
                    repeatableFields.some(
                      (field) => (row[field.id] ?? "").trim() !== ""
                    )
                  )
                  .map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="request-review-grid"
                      style={{
                        paddingTop: 12,
                        marginTop: 12,
                        borderTop: "1px solid rgba(255,255,255,.08)",
                      }}
                    >
                      {repeatableFields.map((field) => (
                        <ReviewValue
                          key={`${field.id}-${rowIndex}`}
                          label={field.label}
                          value={formatReviewValue(field, row[field.id])}
                        />
                      ))}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="request-actions">
            <button className="secondary-btn" onClick={() => setStep(3)}>
              Editar
            </button>
            <button className="primary-btn" onClick={submitRequest}>
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
    <div className={`request-step ${active ? "active" : ""}`}>
      <span>{number}</span>
      <div>
        <strong>{label}</strong>
        <small>{caption}</small>
      </div>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-summary-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function LocalField({
  localConfig,
  value,
  onChange,
}: {
  localConfig: ReturnType<typeof getLocalOptions>
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="dynamic-field">
      <span>Local</span>
      {localConfig.mode === "LOCKED" ? (
        <input value={value} readOnly />
      ) : (
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar local</option>
          {localConfig.options.map((local) => (
            <option key={local} value={local}>
              {local}
            </option>
          ))}
        </select>
      )}
      <small>
        {localConfig.mode === "LOCKED"
          ? "Asignado automáticamente desde el perfil."
          : "Solo aparecen locales dentro del alcance del perfil."}
      </small>
    </label>
  )
}

function DynamicField({
  field,
  value,
  onChange,
  localOptions,
  forceReadOnly = false,
}: {
  field: ProcessFieldDefinition
  value: string
  onChange: (value: string) => void
  localOptions: string[]
  forceReadOnly?: boolean
}) {
  const catalog = getSupplyCatalog()

  if (forceReadOnly && field.type === "CATALOG_ITEM") {
    const item = catalog.find((catalogItem) => catalogItem.code === value)
    return (
      <label className="dynamic-field">
        <span>{field.label}</span>
        <input value={item?.name ?? value} readOnly />
      </label>
    )
  }

  if (field.type === "TEXTAREA") {
    return (
      <label className="dynamic-field">
        <FieldLabel field={field} />
        <textarea
          value={value}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
        {field.help && <small>{field.help}</small>}
      </label>
    )
  }

  if (field.type === "SELECT") {
    return (
      <label className="dynamic-field">
        <FieldLabel field={field} />
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {field.help && <small>{field.help}</small>}
      </label>
    )
  }

  if (field.type === "LOCAL_SELECT") {
    return (
      <label className="dynamic-field">
        <FieldLabel field={field} />
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar local</option>
          {localOptions.map((local) => (
            <option key={local} value={local}>
              {local}
            </option>
          ))}
        </select>
      </label>
    )
  }

  if (field.type === "CATALOG_ITEM") {
    return (
      <label className="dynamic-field">
        <FieldLabel field={field} />
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Seleccionar insumo</option>
          {catalog.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} · {item.unit}
            </option>
          ))}
        </select>
      </label>
    )
  }

  const inputType =
    field.type === "NUMBER" || field.type === "CURRENCY"
      ? "number"
      : field.type === "DATE"
        ? "date"
        : field.type === "EMAIL"
          ? "email"
          : field.type === "PHONE"
            ? "tel"
            : "text"

  return (
    <label className="dynamic-field">
      <FieldLabel field={field} />
      <input
        type={inputType}
        value={value}
        readOnly={field.readOnly}
        placeholder={field.placeholder}
        onChange={(event) =>
          onChange(
            field.type === "VIN"
              ? event.target.value.toUpperCase()
              : event.target.value
          )
        }
      />
      {field.help && <small>{field.help}</small>}
    </label>
  )
}

function FieldLabel({ field }: { field: ProcessFieldDefinition }) {
  return (
    <span>
      {field.label}
      {field.required ? " *" : ""}
    </span>
  )
}

function ReviewValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="request-review-field">
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
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

  if (field.type === "CATALOG_ITEM") {
    return getSupplyCatalog().find((item) => item.code === value)?.name ?? value
  }

  return value
}

function statusLabel(status: RequestStatus | null) {
  if (status === "PENDIENTE_APROBACION") return "Revisión / aprobación"
  if (status === "RECIBIDA") return "Ingresada"
  return status ? status.replaceAll("_", " ") : "Ingresada"
}
