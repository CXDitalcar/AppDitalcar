import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Info,
  MessageSquareText,
  Paperclip,
  RotateCcw,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react"

import {
  useNavigate,
  useParams,
} from "react-router-dom"

import "./SolicitudDetalle.css"
import SignalLight, { signalFromRequest } from "../components/SignalLight"

import { requestAssignments } from "../data/requestConfig"
import {
  getFieldDefinition,
  getRequestProcess,
} from "../services/requestCatalog"

import {
  getRequestById,
  getRequestHistory,
  saveRequestTransition,
} from "../services/requestRepository"

import {
  canApproveRequest,
  canConfirmResolution,
  canManageRequest,
  canViewRequest,
} from "../services/permissions"

import {
  actorLabel,
  responsibleLabel,
  stageLabel,
  visibleStatusLabel,
} from "../services/requestPresentation"

import {
  budgetApprovalRouting,
  routeAfterApproval,
} from "../services/workflow"

import type {
  ProcessFieldDefinition,
  RequestFieldValue,
  RequestItem,
  RequestTimelineItem,
  RequestTimelineType,
  UserScope,
} from "../types"


type DetailAction =
  | "INFO"
  | "REJECT"
  | "ADJUST"
  | "NOT_RESOLVED"
  | null


type AdjustmentValues =
  Record<string, string>


// ======================================================
// PÁGINA
// ======================================================

export default function SolicitudDetalle({
  currentUser,
}: {
  currentUser: UserScope
}) {
  const { requestId } =
    useParams<{ requestId: string }>()

  const navigate = useNavigate()
  const [request, setRequest] =
    useState<RequestItem | null | undefined>(undefined)
  const [loadError, setLoadError] =
    useState("")

  useEffect(() => {
    let active = true

    async function load() {
      if (!requestId) {
        setRequest(null)
        return
      }

      setLoadError("")
      try {
        const value = await getRequestById(currentUser, requestId)
        if (active) setRequest(value ?? null)
      } catch (errorValue: any) {
        if (active) {
          setLoadError(errorValue?.message ?? "No fue posible cargar la solicitud.")
          setRequest(null)
        }
      }
    }

    load()
    return () => {
      active = false
    }
  }, [requestId, currentUser.email, currentUser.role])

  if (request === undefined) {
    return (
      <div className="request-detail-page">
        <div className="request-detail-empty">
          <Clock3 size={30} />
          <h2>Cargando solicitud…</h2>
        </div>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="request-detail-page">
        <button
          className="back-btn"
          onClick={() => navigate("/solicitudes")}
        >
          <ArrowLeft size={17} />
          Volver
        </button>

        <div className="request-detail-empty">
          <FileText size={32} />
          <h2>Solicitud no encontrada</h2>
          <p>{loadError || "No encontramos esta solicitud."}</p>
        </div>
      </div>
    )
  }

  return (
    <RequestDetailContent
      seed={request}
      currentUser={currentUser}
    />
  )
}


// ======================================================
// DETALLE
// ======================================================

function RequestDetailContent({
  seed,
  currentUser,
}: {
  seed: RequestItem
  currentUser: UserScope
}) {
  const navigate = useNavigate()
  const showSlaTerm = currentUser.role === "EXPERIENCIA_CLIENTES"

  const [request, setRequest] =
    useState<RequestItem>(seed)

  const [comment, setComment] =
    useState("")

  const [action, setAction] =
    useState<DetailAction>(null)

  const [adjustmentValues, setAdjustmentValues] =
    useState<AdjustmentValues>({})

  const [requestedToBrand, setRequestedToBrand] =
    useState(false)

  const [invoiceReceived, setInvoiceReceived] =
    useState(false)

  const [historyVersion, setHistoryVersion] =
    useState(0)

  const [history, setHistory] =
    useState<RequestTimelineItem[]>([])

  const [saving, setSaving] =
    useState(false)

  const [persistError, setPersistError] =
    useState("")

  const [persistWarnings, setPersistWarnings] =
    useState<string[]>([])

  const process = getRequestProcess(request.processCode)

  const canView = canViewRequest(
    currentUser,
    request,
    requestAssignments
  )

  const canApprove = canApproveRequest(
    currentUser,
    request,
    requestAssignments
  )

  const canManage = canManageRequest(
    currentUser,
    request,
    requestAssignments
  )

  const canConfirm = canConfirmResolution(
    currentUser,
    request
  )

  useEffect(() => {
    let active = true

    getRequestHistory(currentUser, request.id)
      .then((items) => {
        if (active) setHistory(items)
      })
      .catch(() => {
        if (active) setHistory([])
      })

    return () => {
      active = false
    }
  }, [request.id, historyVersion, currentUser.email])

  const fields = useMemo(
    () =>
      request.fields.map(
        (field) => {
          const definition =
            getFieldDefinition(
              field.fieldId,
              request.processCode
            )

          return {
            ...field,
            label:
              definition?.label ??
              field.fieldId,
            type:
              definition?.type,
            isAmount:
              definition?.isAmount,
          }
        }
      ),
    [request.fields]
  )

  // Solo campos monetarios pueden cambiarse durante
  // "Aprobar con ajuste".
  const currencyAdjustmentFields = useMemo(
    () =>
      request.fields
        .map((field) => {
          const definition =
            getFieldDefinition(
              field.fieldId,
              request.processCode
            )

          if (
            !definition ||
            definition.type !== "CURRENCY"
          ) {
            return undefined
          }

          return {
            field,
            definition,
          }
        })
        .filter(
          (
            item
          ): item is {
            field: RequestFieldValue
            definition: ProcessFieldDefinition
          } => Boolean(item)
        ),
    [request.fields]
  )


  // ====================================================
  // PERSISTENCIA DEMO / SHAREPOINT + HISTORIAL
  // ====================================================

  async function persist(
    patch: Partial<RequestItem>,
    type: RequestTimelineType,
    title: string,
    detail?: string
  ) {
    if (saving) return

    const next: RequestItem = {
      ...request,
      ...patch,
    }

    setSaving(true)
    setPersistError("")
    setPersistWarnings([])

    try {
      const result = await saveRequestTransition(
        currentUser,
        request,
        next,
        type,
        title,
        detail
      )

      setRequest(result.request)
      setPersistWarnings(result.warnings)
      setHistoryVersion((value) => value + 1)
    } catch (errorValue: any) {
      setPersistError(
        errorValue?.message ??
          "No fue posible guardar el cambio de la solicitud."
      )
    } finally {
      setSaving(false)
    }
  }


  // ====================================================
  // APROBAR
  // ====================================================

  function approve() {
    const localReview =
      request.approvalContext ===
      "JEFATURA_LOCAL"

    persist(
      routeAfterApproval(request),
      "APPROVED",
      localReview
        ? "Revisión aprobada"
        : "Solicitud aprobada",
      "La solicitud avanzó al siguiente paso."
    )

    setAction(null)
    setComment("")
    setAdjustmentValues({})
  }


  // ====================================================
  // APROBAR CON AJUSTE
  // - comentario obligatorio
  // - solo montos
  // - conserva solicitado y aprobado
  // ====================================================

  function approveWithAdjustment() {
    if (!comment.trim()) {
      return
    }

    if (
      currencyAdjustmentFields.length === 0
    ) {
      return
    }

    let hasRealAdjustment = false

    const nextFields = request.fields.map(
      (field) => {
        const definition =
          getFieldDefinition(
            field.fieldId,
            request.processCode
          )

        if (
          !process?.allowsAmountAdjustment ||
          !definition ||
          (definition.type !== "CURRENCY" && !definition.isAmount)
        ) {
          return field
        }

        const nextApproved =
          adjustmentValues[field.fieldId] ??
          field.approvedValue ??
          field.requestedValue

        if (
          normalizeAmount(nextApproved) !==
          normalizeAmount(field.requestedValue)
        ) {
          hasRealAdjustment = true
        }

        return {
          ...field,
          approvedValue:
            nextApproved,
        }
      }
    )

    if (!hasRealAdjustment) {
      return
    }

    const amountTrace =
      currencyAdjustmentFields
        .map(({ field, definition }) => {
          const previousApproved =
            field.approvedValue

          const nextApproved =
            adjustmentValues[field.fieldId] ??
            previousApproved ??
            field.requestedValue

          const previousPart =
            previousApproved &&
            normalizeAmount(previousApproved) !==
              normalizeAmount(field.requestedValue)
              ? ` · Aprobado anterior: ${formatCurrency(previousApproved)}`
              : ""

          return (
            `${definition.label}: ` +
            `Solicitado ${formatCurrency(field.requestedValue)}` +
            previousPart +
            ` · Aprobado ${formatCurrency(nextApproved)}`
          )
        })
        .join(" | ")

    persist(
      {
        ...routeAfterApproval(request),
        fields: nextFields,
      },
      "APPROVED_WITH_ADJUSTMENT",
      "Aprobada con ajuste",
      `${amountTrace} | Comentario: ${comment.trim()}`
    )

    setAction(null)
    setComment("")
    setAdjustmentValues({})
  }


  // ====================================================
  // RECHAZAR
  // ====================================================

  function reject() {
    if (!comment.trim()) {
      return
    }

    persist(
      {
        status: "RECHAZADA",
      },
      "REJECTED",
      "Solicitud rechazada",
      comment.trim()
    )

    setComment("")
    setAction(null)
  }


  // ====================================================
  // PEDIR INFORMACIÓN
  // ====================================================

  function requestInfo() {
    if (!comment.trim()) {
      return
    }

    persist(
      {
        status:
          "INFORMACION_REQUERIDA",
        returnStatusAfterInfo:
          request.status,
        returnResponsibleEmail:
          request.currentResponsibleEmail,
        returnResponsibleName:
          request.currentResponsibleName,
        returnResponsibleLabel:
          request.currentResponsibleLabel,
        approvalSLAPausedAt:
          request.status ===
          "PENDIENTE_APROBACION"
            ? new Date().toISOString()
            : request.approvalSLAPausedAt,
        resolutionSLAPausedAt:
          request.status ===
          "EN_GESTION"
            ? new Date().toISOString()
            : request.resolutionSLAPausedAt,
        slaPausedReason:
          "Falta información",
        currentResponsibleEmail:
          request.requesterEmail,
        currentResponsibleName:
          request.requesterName,
        currentResponsibleLabel:
          "Solicitante",
      },
      "INFORMATION_REQUESTED",
      "Información solicitada",
      comment.trim()
    )

    setComment("")
    setAction(null)
  }


  // ====================================================
  // ENTREGAR INFORMACIÓN
  // ====================================================

  function provideInformation() {
    if (!comment.trim()) {
      return
    }

    const approvalPaused =
      request.approvalSLAPausedAt
        ? Math.max(
            0,
            Math.round(
              (
                Date.now() -
                new Date(
                  request.approvalSLAPausedAt
                ).getTime()
              ) /
                60000
            )
          )
        : 0

    const resolutionPaused =
      request.resolutionSLAPausedAt
        ? Math.max(
            0,
            Math.round(
              (
                Date.now() -
                new Date(
                  request.resolutionSLAPausedAt
                ).getTime()
              ) /
                60000
            )
          )
        : 0

    persist(
      {
        status:
          request.returnStatusAfterInfo ??
          "RECIBIDA",
        currentResponsibleEmail:
          request.returnResponsibleEmail,
        currentResponsibleName:
          request.returnResponsibleName,
        currentResponsibleLabel:
          request.returnResponsibleLabel,
        approvalSLAPausedAt:
          undefined,
        approvalSLAPausedMinutes:
          request.approvalSLAPausedMinutes +
          approvalPaused,
        resolutionSLAPausedAt:
          undefined,
        resolutionSLAPausedMinutes:
          (
            request.resolutionSLAPausedMinutes ??
            0
          ) + resolutionPaused,
        slaPausedReason:
          undefined,
        returnStatusAfterInfo:
          undefined,
        returnResponsibleEmail:
          undefined,
        returnResponsibleName:
          undefined,
        returnResponsibleLabel:
          undefined,
      },
      "INFORMATION_PROVIDED",
      "Información entregada",
      comment.trim()
    )

    setComment("")
  }


  // ====================================================
  // TOMAR SOLICITUD
  // Aquí nace el gestor individual real.
  // ====================================================

  function takeRequest() {
    persist(
      {
        status:
          "EN_GESTION",
        managementAcceptedAt:
          new Date().toISOString(),
        managementOwnerEmail:
          currentUser.email,
        managementOwnerName:
          currentUser.name,
        managementOwnerLabel:
          request.currentResponsibleLabel,
        currentResponsibleEmail:
          currentUser.email,
        currentResponsibleName:
          currentUser.name,
        resolutionSLAStartedAt:
          request.resolutionSLAStartedAt ??
          new Date().toISOString(),
      },
      "MANAGEMENT",
      "Solicitud tomada",
      "Comienza la gestión del área responsable."
    )
  }


  // ====================================================
  // SOLICITAR APROBACIÓN ADICIONAL
  // ====================================================

  function requestBudget() {
    persist(
      budgetApprovalRouting(request),
      "BUDGET_REQUESTED",
      "Aprobación solicitada",
      "La gestión queda en pausa mientras se revisa la aprobación."
    )
  }


  // ====================================================
  // MARCAR RESUELTA
  // ====================================================

  function resolve() {
    persist(
      {
        status:
          "RESUELTA_POR_CONFIRMAR",
        resolutionConfirmationDeadline:
          new Date(
            Date.now() +
            48 * 3600000
          ).toISOString(),
        slaPausedReason:
          undefined,
        resolutionSLAPausedAt:
          undefined,
        currentResponsibleEmail:
          request.requesterEmail,
        currentResponsibleName:
          request.requesterName,
        currentResponsibleLabel:
          "Solicitante / Jefatura de Sucursal",
      },
      "RESOLUTION_REPORTED",
      "Marcada como resuelta",
      "Queda pendiente de confirmación."
    )
  }


  // ====================================================
  // CONFIRMAR
  // ====================================================

  function confirmResolution() {
    persist(
      {
        status: "RESUELTA",
      },
      "RESOLUTION_CONFIRMED",
      "Resolución confirmada",
      "La solicitud quedó cerrada."
    )
  }


  // ====================================================
  // NO RESUELTO
  // ====================================================

  function reopen() {
    if (!comment.trim()) {
      return
    }

    persist(
      {
        status: "EN_GESTION",
        reopened: true,
        currentResponsibleEmail:
          request.managementOwnerEmail ??
          request.currentResponsibleEmail,
        currentResponsibleName:
          request.managementOwnerName ??
          request.currentResponsibleName,
        currentResponsibleLabel:
          request.managementOwnerLabel ??
          request.currentResponsibleLabel,
      },
      "NOT_RESOLVED",
      "No resuelto",
      comment.trim()
    )

    setComment("")
    setAction(null)
  }


  // ====================================================
  // SIN ACCESO
  // ====================================================

  if (!canView) {
    return (
      <div className="request-detail-page">
        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={17} />
          Volver
        </button>

        <div className="request-detail-empty">
          <ShieldCheck size={34} />
          <h2>Sin acceso</h2>
          <p>
            Tu perfil no tiene permisos
            para visualizar esta solicitud.
          </p>
        </div>
      </div>
    )
  }


  const showBonification =
    request.processCode ===
      "UNI-BON-01" &&
    currentUser.role ===
      "JEFATURA_OPERACIONES_COMERCIALES"

  const isInformationRecipient =
    request.status ===
      "INFORMACION_REQUERIDA" &&
    (
      request.requesterEmail ===
        currentUser.email ||
      (
        currentUser.role ===
          "JEFATURA_LOCAL" &&
        currentUser.local ===
          request.local
      )
    )

  const canShowAdjustment =
    canApprove &&
    currencyAdjustmentFields.length > 0

  const adjustmentIsValid =
    Boolean(comment.trim()) &&
    currencyAdjustmentFields.some(
      ({ field }) => {
        const effective =
          adjustmentValues[field.fieldId] ??
          field.approvedValue ??
          field.requestedValue

        return (
          effective.trim() !== "" &&
          normalizeAmount(effective) !==
            normalizeAmount(field.requestedValue)
        )
      }
    )


  return (
    <div className="request-detail-page">
      <button
        className="back-btn"
        onClick={() =>
          navigate("/aprobaciones")
        }
      >
        <ArrowLeft size={17} />
        Volver a gestión
      </button>


      {/* ==================================================
          CABECERA
      ================================================== */}

      <div className="request-detail-header">
        <div>
          <div className="eyebrow request-id-row">
            {request.id}
            {request.isTest && <span className="pilot-test-tag">PRUEBA</span>}
          </div>

          <h1>{request.processName}</h1>

          <div className="request-detail-meta">
            <span>
              <UserRound size={14} />
              {request.requesterName}
            </span>

            <span>{request.local}</span>
          </div>
        </div>

        <StatusBadge request={request} />
      </div>


      {/* ==================================================
          RESUMEN
      ================================================== */}

      <div className="request-detail-summary">
        <Summary
          label="Solicitante"
          value={request.requesterName}
        />

        <Summary
          label="Local"
          value={request.local}
        />

        <Summary
          label="Responsable actual"
          value={
            responsibleLabel(
              currentUser,
              request
            )
          }
        />

        <Summary
          label={showSlaTerm ? "SLA" : "Plazo"}
          value={
            request.slaPausedReason
              ? "En pausa"
              : "A tiempo"
          }
          icon={Clock3}
        />
      </div>

      <div className="request-user-action">
        <SignalLight tone={signalFromRequest(request)} />
        <div>
          <span>TU ACCIÓN</span>
          <strong>{userActionLabel(currentUser, request, canApprove, canManage, canConfirm)}</strong>
          <small>{userActionDetail(currentUser, request, canApprove, canManage, canConfirm)}</small>
        </div>
      </div>

      {request.isTest && (
        <div className="pilot-flow-alert pilot-test-alert">
          <Info size={17} />
          <div>
            <strong>Solicitud de prueba</strong>
            <span>Este caso existe para que Gerencias y Jefaturas puedan revisar el flujo sin afectar datos reales.</span>
          </div>
        </div>
      )}

      {request.slaPausedReason && (
        <div className="pilot-flow-alert">
          <Clock3 size={17} />
          <div>
            <strong>{showSlaTerm ? "SLA en pausa" : "Plazo en pausa"}</strong>
            <span>
              {request.slaPausedReason}
            </span>
          </div>
        </div>
      )}

      {persistError && (
        <div className="pilot-flow-alert">
          <Info size={17} />
          <div>
            <strong>No se pudo guardar el cambio</strong>
            <span>{persistError}</span>
          </div>
        </div>
      )}

      {persistWarnings.length > 0 && (
        <div className="pilot-flow-alert">
          <Info size={17} />
          <div>
            <strong>Cambio guardado con observaciones</strong>
            <span>{persistWarnings.join(" · ")}</span>
          </div>
        </div>
      )}

      <div className="request-detail-layout">
        <div className="request-detail-main">

          {/* ==============================================
              ANTECEDENTES
          ============================================== */}

          <section className="request-detail-card">
            <div className="request-detail-card-head">
              <div>
                <span className="eyebrow">
                  SOLICITUD
                </span>
                <h2>Antecedentes</h2>
              </div>
            </div>

            <div className="request-data-grid">
              {fields.map((field) => (
                <div
                  key={field.fieldId}
                  className="request-data-field"
                >
                  <span>{field.label}</span>

                  <strong>
                    {formatValue(
                      field.requestedValue,
                      field.type
                    )}
                  </strong>

                  {field.approvedValue &&
                    (field.type === "CURRENCY" || field.isAmount) && (
                    <small>
                      Monto aprobado: {" "}
                      {formatCurrency(
                        field.approvedValue
                      )}
                    </small>
                  )}
                </div>
              ))}
            </div>
          </section>


          {/* ==============================================
              ORIGEN
          ============================================== */}

          {(
            request.originFormCode ||
            request.originBreachId
          ) && (
            <section className="request-detail-card">
              <div className="request-detail-card-head">
                <div>
                  <span className="eyebrow">
                    ORIGEN
                  </span>
                  <h2>
                    Formulario relacionado
                  </h2>
                </div>
                <FileText size={18} />
              </div>

              <div className="request-data-grid">
                <div className="request-data-field">
                  <span>Formulario</span>
                  <strong>
                    {request.originFormCode ?? "—"}
                  </strong>
                </div>

                <div className="request-data-field">
                  <span>Ejecución</span>
                  <strong>
                    {request.originExecutionId ?? "—"}
                  </strong>
                </div>

                <div className="request-data-field">
                  <span>Brecha</span>
                  <strong>
                    {request.originBreachId ?? "—"}
                  </strong>
                </div>
              </div>
            </section>
          )}


          {/* ==============================================
              ADJUNTOS
          ============================================== */}

          <section className="request-detail-card">
            <div className="request-detail-card-head">
              <div>
                <span className="eyebrow">
                  RESPALDO
                </span>
                <h2>Adjuntos</h2>
              </div>
              <Paperclip size={18} />
            </div>

            <div className="request-no-files">
              <FileText size={20} />
              <div>
                <strong>
                  Adjuntos de la solicitud
                </strong>
                <span>
                  Zona preparada para documentos
                  y evidencias.
                </span>
              </div>
            </div>
          </section>


          {/* ==============================================
              CONTROL INTERNO BONIFICACIÓN
          ============================================== */}

          {showBonification && (
            <section className="request-detail-card private-control">
              <div className="request-detail-card-head">
                <div>
                  <span className="eyebrow">
                    CONTROL INTERNO
                  </span>
                  <h2>
                    Seguimiento de bonificación
                  </h2>
                </div>
                <ShieldCheck size={18} />
              </div>

              <p className="private-control-description">
                Visible para Jefatura
                Operaciones Comerciales.
              </p>

              <div className="private-check-list">
                <button
                  className={
                    requestedToBrand
                      ? "private-check checked"
                      : "private-check"
                  }
                  onClick={() =>
                    setRequestedToBrand(
                      !requestedToBrand
                    )
                  }
                >
                  <span>
                    {requestedToBrand ? (
                      <Check size={16} />
                    ) : null}
                  </span>
                  <div>
                    <strong>
                      Solicitud realizada a marca
                    </strong>
                    <small>
                      Checkpoint interno
                    </small>
                  </div>
                </button>

                <button
                  className={
                    invoiceReceived
                      ? "private-check checked"
                      : "private-check"
                  }
                  onClick={() =>
                    setInvoiceReceived(
                      !invoiceReceived
                    )
                  }
                >
                  <span>
                    {invoiceReceived ? (
                      <Check size={16} />
                    ) : null}
                  </span>
                  <div>
                    <strong>
                      Factura recibida
                    </strong>
                    <small>
                      Checkpoint interno
                    </small>
                  </div>
                </button>
              </div>
            </section>
          )}


          {/* ==============================================
              HISTORIAL
          ============================================== */}

          <section className="request-detail-card">
            <div className="request-detail-card-head">
              <div>
                <span className="eyebrow">
                  SEGUIMIENTO
                </span>
                <h2>Historial</h2>
              </div>
            </div>

            <div className="request-history">
              {history.length === 0 && (
                <div className="request-no-files">
                  <Clock3 size={20} />
                  <div>
                    <strong>
                      Sin movimientos registrados todavía
                    </strong>
                    <span>
                      Las próximas acciones
                      quedarán guardadas aquí.
                    </span>
                  </div>
                </div>
              )}

              {history.map((entry) => {
                const parts =
                  entry.comment?.split(" · ") ??
                  []

                return (
                  <div
                    key={entry.id}
                    className="history-entry"
                  >
                    <div className="history-dot" />

                    <div className="history-content">
                      <div className="history-entry-head">
                        <strong>
                          {parts[0] ?? "Movimiento"}
                        </strong>
                        <span>
                          {new Date(
                            entry.createdAt
                          ).toLocaleString("es-CL")}
                        </span>
                      </div>

                      {parts[1] && (
                        <p>
                          {parts
                            .slice(1)
                            .join(" · ")}
                        </p>
                      )}

                      <small>
                        {actorLabel(
                          currentUser,
                          entry.authorEmail,
                          entry.authorName
                        )}
                      </small>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>


        {/* ==================================================
            PANEL DERECHO
        ================================================== */}

        <aside className="request-detail-side">
          <section className="request-side-card">
            <span className="eyebrow">
              SEGUIMIENTO
            </span>

            <h3>
              {process?.name ?? request.processName}
            </h3>

            <div className="request-side-row">
              <span>Estado</span>
              <strong>
                {stageLabel(request)}
              </strong>
            </div>

            <div className="request-side-row">
              <span>Responsable</span>
              <strong>
                {responsibleLabel(
                  currentUser,
                  request
                )}
              </strong>
            </div>

            {request.slaPausedReason && (
              <div className="request-side-row">
                <span>{showSlaTerm ? "SLA" : "Plazo"}</span>
                <strong>En pausa</strong>
              </div>
            )}
          </section>


          {/* ==============================================
              APROBACIÓN
          ============================================== */}

          {canApprove && (
            <section className="request-side-card approval-actions-card">
              <span className="eyebrow">
                ACCIÓN
              </span>

              <h3>
                {request.approvalContext ===
                "JEFATURA_LOCAL"
                  ? "Revisión local"
                  : "Por aprobar"}
              </h3>

              <button
                className="request-action approve"
                onClick={approve}
              >
                <CheckCircle2 size={17} />
                Aprobar
              </button>

              {canShowAdjustment && (
                <button
                  className="request-action adjust"
                  onClick={() => {
                    setAction(
                      action === "ADJUST"
                        ? null
                        : "ADJUST"
                    )
                    setComment("")
                  }}
                >
                  <CircleDollarSign size={17} />
                  Aprobar con ajuste
                </button>
              )}

              <button
                className="request-action information"
                onClick={() => {
                  setAction(
                    action === "INFO"
                      ? null
                      : "INFO"
                  )
                  setComment("")
                }}
              >
                <MessageSquareText size={17} />
                Pedir información
              </button>

              <button
                className="request-action reject"
                onClick={() => {
                  setAction(
                    action === "REJECT"
                      ? null
                      : "REJECT"
                  )
                  setComment("")
                }}
              >
                <X size={17} />
                Rechazar
              </button>


              {action === "ADJUST" && (
                <div className="action-form">
                  <div className="action-form-title">
                    Aprobar con ajuste
                  </div>

                  {currencyAdjustmentFields.map(
                    ({ field, definition }) => (
                      <label key={field.fieldId}>
                        <span>
                          {definition.label}
                        </span>

                        <small>
                          Solicitado: {" "}
                          {formatCurrency(
                            field.requestedValue
                          )}
                          {field.approvedValue
                            ? ` · Aprobado anterior: ${formatCurrency(
                                field.approvedValue
                              )}`
                            : ""}
                        </small>

                        <input
                          type="number"
                          min="0"
                          value={
                            adjustmentValues[
                              field.fieldId
                            ] ??
                            field.approvedValue ??
                            field.requestedValue
                          }
                          onChange={(event) =>
                            setAdjustmentValues(
                              (current) => ({
                                ...current,
                                [field.fieldId]:
                                  event.target.value,
                              })
                            )
                          }
                        />
                      </label>
                    )
                  )}

                  <label>
                    <span>
                      Comentario del ajuste *
                    </span>
                    <textarea
                      value={comment}
                      onChange={(event) =>
                        setComment(
                          event.target.value
                        )
                      }
                      placeholder="Explica el motivo del monto aprobado."
                    />
                  </label>

                  <button
                    className="primary-btn"
                    disabled={!adjustmentIsValid}
                    onClick={approveWithAdjustment}
                  >
                    Aprobar con ajuste
                  </button>

                  {!adjustmentIsValid && (
                    <small>
                      Debes cambiar al menos un monto
                      y agregar un comentario.
                    </small>
                  )}
                </div>
              )}


              {(action === "INFO" ||
                action === "REJECT") && (
                <CommentBox
                  value={comment}
                  onChange={setComment}
                  label={
                    action === "INFO"
                      ? "¿Qué información falta? *"
                      : "Motivo del rechazo *"
                  }
                  button={
                    action === "INFO"
                      ? "Pedir información"
                      : "Rechazar"
                  }
                  danger={
                    action === "REJECT"
                  }
                  onSubmit={
                    action === "INFO"
                      ? requestInfo
                      : reject
                  }
                />
              )}
            </section>
          )}


          {/* ==============================================
              INGRESADA
          ============================================== */}

          {canManage &&
            request.status === "RECIBIDA" && (
            <section className="request-side-card">
              <span className="eyebrow">
                INGRESADA
              </span>

              <h3>Tomar solicitud</h3>

              <p className="side-note">
                El área responsable tiene
                1 día hábil para iniciar
                la gestión.
              </p>

              <button
                className="request-action approve"
                onClick={takeRequest}
              >
                <CheckCircle2 size={17} />
                Tomar y comenzar
              </button>
            </section>
          )}


          {/* ==============================================
              EN GESTIÓN
          ============================================== */}

          {canManage &&
            request.status === "EN_GESTION" && (
            <section className="request-side-card">
              <span className="eyebrow">
                EN GESTIÓN
              </span>

              <h3>Acciones</h3>

              <button
                className="request-action information"
                onClick={() => {
                  setAction(
                    action === "INFO"
                      ? null
                      : "INFO"
                  )
                  setComment("")
                }}
              >
                <MessageSquareText size={17} />
                Pedir información
              </button>

              <button
                className="request-action adjust"
                onClick={requestBudget}
              >
                <CircleDollarSign size={17} />
                Solicitar aprobación
              </button>

              <button
                className="request-action approve"
                onClick={resolve}
              >
                <CheckCircle2 size={17} />
                Marcar resuelta
              </button>

              {action === "INFO" && (
                <CommentBox
                  value={comment}
                  onChange={setComment}
                  label="¿Qué información falta? *"
                  button="Pedir información"
                  onSubmit={requestInfo}
                />
              )}
            </section>
          )}


          {/* ==============================================
              FALTA INFORMACIÓN
          ============================================== */}

          {isInformationRecipient && (
            <section className="request-side-card">
              <span className="eyebrow">
                FALTA INFORMACIÓN
              </span>

              <h3>Responder</h3>

              <p className="side-note">
                {showSlaTerm ? "El SLA" : "El plazo"} está en pausa y continuará
                desde el punto anterior.
              </p>

              <CommentBox
                value={comment}
                onChange={setComment}
                label="Información / comentario *"
                button="Enviar información"
                onSubmit={provideInformation}
              />
            </section>
          )}


          {/* ==============================================
              POR CONFIRMAR
          ============================================== */}

          {request.status ===
            "RESUELTA_POR_CONFIRMAR" && (
            <section className="request-side-card confirmation-card">
              <Info size={19} />

              <div>
                <strong>Por confirmar</strong>
                <p>
                  Puede confirmar el solicitante
                  o la Jefatura de Sucursal.
                  El plazo es 48 h.
                </p>
              </div>

              {canConfirm && (
                <>
                  <button
                    className="request-action approve"
                    onClick={confirmResolution}
                  >
                    <CheckCircle2 size={17} />
                    Confirmar resuelto
                  </button>

                  <button
                    className="request-action reject"
                    onClick={() => {
                      setAction(
                        action === "NOT_RESOLVED"
                          ? null
                          : "NOT_RESOLVED"
                      )
                      setComment("")
                    }}
                  >
                    <RotateCcw size={17} />
                    No resuelto
                  </button>

                  {action === "NOT_RESOLVED" && (
                    <CommentBox
                      value={comment}
                      onChange={setComment}
                      label="¿Qué sigue sin resolverse? *"
                      button="Volver a gestión"
                      danger
                      onSubmit={reopen}
                    />
                  )}
                </>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}


// ======================================================
// COMENTARIO
// ======================================================

function CommentBox({
  value,
  onChange,
  label,
  button,
  onSubmit,
  danger = false,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  button: string
  onSubmit: () => void
  danger?: boolean
}) {
  return (
    <div className="action-form">
      <label>
        <span>{label}</span>
        <textarea
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      </label>

      <button
        className={
          danger
            ? "danger-btn"
            : "primary-btn"
        }
        disabled={!value.trim()}
        onClick={onSubmit}
      >
        {button}
      </button>
    </div>
  )
}


// ======================================================
// RESUMEN
// ======================================================

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon?: typeof Clock3
}) {
  return (
    <div className="request-summary-item">
      {Icon && <Icon size={16} />}
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  )
}


// ======================================================
// ESTADO
// ======================================================

function StatusBadge({
  request,
}: {
  request: RequestItem
}) {
  return (
    <div className="request-detail-status-wrap">
      {request.reopened && (
        <span className="request-reopened">
          <RotateCcw size={11} />
          Reabierta
        </span>
      )}

      <span
        className={
          `request-detail-status status-${request.status.toLowerCase()}`
        }
      >
        {visibleStatusLabel(request)}
      </span>
    </div>
  )
}


// ======================================================
// FORMATO
// ======================================================

function normalizeAmount(value: string) {
  const numeric = Number(value)

  return Number.isFinite(numeric)
    ? String(numeric)
    : value.trim()
}


function formatCurrency(value: string) {
  const number = Number(value)

  if (Number.isNaN(number)) {
    return value || "—"
  }

  return new Intl.NumberFormat(
    "es-CL",
    {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }
  ).format(number)
}


function formatValue(
  value: string,
  type?: string
) {
  if (type === "CURRENCY") {
    return formatCurrency(value)
  }

  return value || "—"
}


function userActionLabel(
  user: UserScope,
  request: RequestItem,
  canApprove: boolean,
  canManage: boolean,
  canConfirm: boolean
) {
  if (request.status === "RECIBIDA" && canManage) return "Tomar solicitud"
  if (request.status === "PENDIENTE_APROBACION" && canApprove) return "Revisar y aprobar"
  if (request.status === "EN_GESTION" && canManage) return "Continuar gestión"
  if (request.status === "RESUELTA_POR_CONFIRMAR" && canConfirm) return "Confirmar si quedó resuelto"
  if (request.status === "INFORMACION_REQUERIDA") {
    if (request.currentResponsibleEmail?.toLowerCase() === user.email.toLowerCase()) {
      return "Completar información solicitada"
    }
    return "Esperar información"
  }
  if (request.status === "RESUELTA") return "Sin acción pendiente"
  if (request.status === "RECHAZADA") return "Sin acción pendiente"
  return "Solo seguimiento"
}

function userActionDetail(
  user: UserScope,
  request: RequestItem,
  canApprove: boolean,
  canManage: boolean,
  canConfirm: boolean
) {
  const action = userActionLabel(user, request, canApprove, canManage, canConfirm)
  if (action === "Solo seguimiento") return "Puedes revisar el avance y el historial, pero no tienes una acción requerida en este estado."
  if (action === "Sin acción pendiente") return "La solicitud no requiere una acción adicional de tu parte."
  if (action === "Esperar información") return "El plazo está detenido mientras la persona responsable completa los antecedentes."
  return "Esta actividad está disponible para tu perfil y requiere continuar el flujo."
}
