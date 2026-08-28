import {
  useMemo,
  useState,
} from "react"

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
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

import {
  mockProcessAssignments,
  mockProcessFields,
  mockProcesses,
  mockRequests,
} from "../data/mockData"

import {
  canApproveRequest,
  canManageRequest,
  canViewRequest,
} from "../services/permissions"

import type {
  RequestItem,
  RequestStatus,
  UserScope,
} from "../types"


type ActionMode =
  | null
  | "ADJUST"
  | "INFO"
  | "REJECT"


type HistoryEntry = {
  id: string
  title: string
  detail?: string
  author: string
  createdAt: string
  tone?:
    | "default"
    | "success"
    | "warning"
    | "danger"
    | "info"
}


type FieldRow = {
  id: string
  label: string
  requestedValue: string
  approvedValue?: string
  adjustable: boolean
  type?: string
}


export default function SolicitudDetalle({
  currentUser,
}: {
  currentUser: UserScope
}) {
  const navigate = useNavigate()

  const { requestId } =
    useParams<{
      requestId: string
    }>()


  const request =
    mockRequests.find(
      (item) =>
        item.id === requestId
    )


  // ======================================================
  // SOLICITUD NO ENCONTRADA
  // ======================================================

  if (!request) {
    return (
      <div className="request-detail-page">

        <button
          className="back-btn"
          onClick={() =>
            navigate("/aprobaciones")
          }
        >
          <ArrowLeft size={17} />
          Volver
        </button>

        <div className="request-detail-empty">
          <FileText size={32} />

          <h2>
            Solicitud no encontrada
          </h2>

          <p>
            No encontramos la solicitud
            solicitada.
          </p>
        </div>

      </div>
    )
  }


  return (
    <RequestDetailContent
      request={request}
      currentUser={currentUser}
    />
  )
}


// ======================================================
// CONTENIDO
// ======================================================

function RequestDetailContent({
  request,
  currentUser,
}: {
  request: RequestItem
  currentUser: UserScope
}) {
  const navigate = useNavigate()

  const process =
    mockProcesses.find(
      (item) =>
        item.code ===
        request.processCode
    )


  const canView =
    canViewRequest(
      currentUser,
      request,
      mockProcessAssignments
    )


  const canApprove =
    canApproveRequest(
      currentUser,
      request,
      mockProcessAssignments
    )


  const canManage =
    canManageRequest(
      currentUser,
      request,
      mockProcessAssignments
    )


  const [status, setStatus] =
    useState<RequestStatus>(
      request.status
    )


  const [actionMode, setActionMode] =
    useState<ActionMode>(null)


  const [actionComment, setActionComment] =
    useState("")


  const [historyOpen, setHistoryOpen] =
    useState(true)


  const [requestedToBrand, setRequestedToBrand] =
    useState(false)


  const [invoiceReceived, setInvoiceReceived] =
    useState(false)


  const [adjustments, setAdjustments] =
    useState<Record<string, string>>({})


  const [history, setHistory] =
    useState<HistoryEntry[]>([
      {
        id: "created",
        title: "Solicitud creada",
        detail:
          "La solicitud fue registrada y enviada a revisión.",
        author:
          request.requesterName,
        createdAt:
          request.createdAt,
        tone: "default",
      },
    ])


  // ======================================================
  // CAMPOS
  // ======================================================

  const fieldRows =
    useMemo(
      () =>
        getRequestFields(
          request
        ),
      [request]
    )


  const adjustableFields =
    fieldRows.filter(
      (field) =>
        field.adjustable
    )


  // ======================================================
  // ACCESO
  // ======================================================

  if (!canView) {
    return (
      <div className="request-detail-page">

        <button
          className="back-btn"
          onClick={() =>
            navigate("/")
          }
        >
          <ArrowLeft size={17} />

          Volver
        </button>


        <div className="request-detail-empty">

          <ShieldCheck size={34} />

          <h2>
            Sin acceso
          </h2>

          <p>
            Tu perfil no tiene permisos
            para visualizar esta solicitud.
          </p>

        </div>

      </div>
    )
  }


  // ======================================================
  // HISTORIAL
  // ======================================================

  function addHistory(
    entry: Omit<
      HistoryEntry,
      "id" | "createdAt"
    >
  ) {
    setHistory((current) => [
      {
        ...entry,
        id: `${Date.now()}`,
        createdAt:
          new Date().toISOString(),
      },
      ...current,
    ])
  }


  // ======================================================
  // APROBAR
  // ======================================================

  function approve() {
    setStatus("APROBADA")

    setActionMode(null)

    addHistory({
      title: "Solicitud aprobada",
      detail:
        "La solicitud fue aprobada sin modificaciones.",
      author:
        currentUser.name,
      tone: "success",
    })
  }


  // ======================================================
  // APROBAR CON AJUSTE
  // ======================================================

  function approveWithAdjustment() {
    if (
      !adjustableFields.some(
        (field) =>
          adjustments[
            field.id
          ]?.trim()
      )
    ) {
      return
    }

    setStatus(
      "APROBADA_CON_AJUSTE"
    )

    setActionMode(null)

    addHistory({
      title:
        "Solicitud aprobada con ajuste",
      detail:
        actionComment.trim() ||
        "La solicitud fue aprobada con modificación en los valores solicitados.",
      author:
        currentUser.name,
      tone: "success",
    })

    setActionComment("")
  }


  // ======================================================
  // SOLICITAR INFORMACIÓN
  // ======================================================

  function requestInformation() {
    if (!actionComment.trim()) {
      return
    }

    setStatus(
      "INFORMACION_REQUERIDA"
    )

    setActionMode(null)

    addHistory({
      title:
        "Información solicitada",
      detail:
        actionComment.trim(),
      author:
        currentUser.name,
      tone: "info",
    })

    setActionComment("")
  }


  // ======================================================
  // RECHAZAR
  // ======================================================

  function reject() {
    if (!actionComment.trim()) {
      return
    }

    setStatus(
      "RECHAZADA"
    )

    setActionMode(null)

    addHistory({
      title:
        "Solicitud rechazada",
      detail:
        actionComment.trim(),
      author:
        currentUser.name,
      tone: "danger",
    })

    setActionComment("")
  }


  // ======================================================
  // MARCAR RESUELTA
  // ======================================================

  function markResolved() {
    setStatus(
      "RESUELTA_POR_CONFIRMAR"
    )

    addHistory({
      title:
        "Resolución informada",
      detail:
        "La gestión fue marcada como resuelta y queda pendiente de confirmación del solicitante o su jefatura.",
      author:
        currentUser.name,
      tone: "success",
    })
  }


  // ======================================================
  // BONIFICACIÓN
  // ======================================================

  const isBonification =
    request.processCode ===
    "UNI-BON-01"


  const showPrivateBonificationControl =
    isBonification &&
    currentUser.role ===
      "JEFATURA_COMERCIAL_CLIENTES" &&
    (
      status === "APROBADA" ||
      status ===
        "APROBADA_CON_AJUSTE" ||
      status ===
        "RESUELTA_POR_CONFIRMAR" ||
      status === "RESUELTA"
    )


  // ======================================================
  // VISTA
  // ======================================================

  return (
    <div className="request-detail-page">

      {/* CABECERA */}

      <button
        className="back-btn"
        onClick={() =>
          navigate("/aprobaciones")
        }
      >
        <ArrowLeft size={17} />

        Volver a aprobaciones
      </button>


      <div className="request-detail-header">

        <div>

          <div className="eyebrow">
            {request.id}
          </div>

          <h1>
            {request.processName}
          </h1>

          <div className="request-detail-meta">

            <span>
              <UserRound size={14} />
              {request.requesterName}
            </span>

            <span>
              {request.local}
            </span>

          </div>

        </div>


        <StatusBadge
          status={status}
          reopened={
            request.reopened
          }
        />

      </div>


      {/* RESUMEN SUPERIOR */}

      <div className="request-detail-summary">

        <SummaryItem
          label="Solicitante"
          value={
            request.requesterName
          }
        />

        <SummaryItem
          label="Local"
          value={request.local}
        />

        <SummaryItem
          label="Responsable actual"
          value={
            request.currentResponsibleName ??
            "—"
          }
        />

        <SummaryItem
          label="SLA aprobación"
          value={
            request.approvalSLAHours
              ? `${request.approvalSLAHours} h`
              : "Por definir"
          }
          icon={Clock3}
        />

      </div>


      <div className="request-detail-layout">

        {/* ================================================
            CONTENIDO IZQUIERDO
        ================================================ */}

        <div className="request-detail-main">

          {/* DATOS */}

          <section className="request-detail-card">

            <div className="request-detail-card-head">

              <div>
                <span className="eyebrow">
                  SOLICITUD
                </span>

                <h2>
                  Antecedentes
                </h2>
              </div>

            </div>


            <div className="request-data-grid">

              {fieldRows.map(
                (field) => (
                  <div
                    key={field.id}
                    className="request-data-field"
                  >

                    <span>
                      {field.label}
                    </span>

                    <strong>
                      {formatFieldValue(
                        field.requestedValue,
                        field.type
                      )}
                    </strong>


                    {field.approvedValue &&
                      field.approvedValue !==
                        field.requestedValue && (
                        <small>
                          Aprobado:{" "}
                          {formatFieldValue(
                            field.approvedValue,
                            field.type
                          )}
                        </small>
                      )}

                  </div>
                )
              )}

            </div>

          </section>


          {/* ADJUNTOS */}

          <section className="request-detail-card">

            <div className="request-detail-card-head">

              <div>
                <span className="eyebrow">
                  RESPALDO
                </span>

                <h2>
                  Adjuntos
                </h2>
              </div>

              <Paperclip size={18} />

            </div>


            <div className="request-no-files">

              <FileText size={20} />

              <div>
                <strong>
                  Sin archivos adjuntos
                </strong>

                <span>
                  Esta solicitud no tiene
                  documentos de respaldo.
                </span>
              </div>

            </div>

          </section>


          {/* CONTROL PRIVADO BONIFICACIÓN */}

          {showPrivateBonificationControl && (
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
                Visible únicamente para
                Jefatura Comercial y Clientes.
                No modifica el estado que ve
                el vendedor.
              </p>


              <div className="private-check-list">

                <button
                  className={
                    requestedToBrand
                      ? "private-check checked"
                      : "private-check"
                  }
                  onClick={() => {
                    const next =
                      !requestedToBrand

                    setRequestedToBrand(
                      next
                    )

                    if (next) {
                      addHistory({
                        title:
                          "Solicitud realizada a marca",
                        detail:
                          "Se registró internamente el envío de la bonificación a marca.",
                        author:
                          currentUser.name,
                        tone:
                          "default",
                      })
                    }
                  }}
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
                      Control interno
                    </small>
                  </div>
                </button>


                <button
                  className={
                    invoiceReceived
                      ? "private-check checked"
                      : "private-check"
                  }
                  onClick={() => {
                    const next =
                      !invoiceReceived

                    setInvoiceReceived(
                      next
                    )

                    if (next) {
                      addHistory({
                        title:
                          "Factura recibida",
                        detail:
                          "Se registró internamente la recepción de la factura.",
                        author:
                          currentUser.name,
                        tone:
                          "default",
                      })
                    }
                  }}
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
                      Control interno
                    </small>
                  </div>
                </button>

              </div>

            </section>
          )}


          {/* HISTORIAL */}

          <section className="request-detail-card">

            <button
              className="history-toggle"
              onClick={() =>
                setHistoryOpen(
                  !historyOpen
                )
              }
            >
              <div>
                <span className="eyebrow">
                  SEGUIMIENTO
                </span>

                <h2>
                  Historial
                </h2>
              </div>

              {historyOpen ? (
                <ChevronUp size={18} />
              ) : (
                <ChevronDown size={18} />
              )}
            </button>


            {historyOpen && (
              <div className="request-history">

                {[...history]
                  .sort(
                    (a, b) =>
                      new Date(
                        b.createdAt
                      ).getTime() -
                      new Date(
                        a.createdAt
                      ).getTime()
                  )
                  .map((entry) => (
                    <div
                      key={entry.id}
                      className={`history-entry history-${entry.tone ?? "default"}`}
                    >

                      <div className="history-dot" />

                      <div className="history-content">

                        <div className="history-entry-head">

                          <strong>
                            {entry.title}
                          </strong>

                          <span>
                            {formatDate(
                              entry.createdAt
                            )}
                          </span>

                        </div>


                        {entry.detail && (
                          <p>
                            {entry.detail}
                          </p>
                        )}


                        <small>
                          {entry.author}
                        </small>

                      </div>

                    </div>
                  ))}

              </div>
            )}

          </section>

        </div>


        {/* ================================================
            PANEL DERECHO
        ================================================ */}

        <aside className="request-detail-side">

          {/* PROCESO */}

          <section className="request-side-card">

            <span className="eyebrow">
              PROCESO
            </span>

            <h3>
              {process?.name ??
                request.processName}
            </h3>


            <div className="request-side-row">

              <span>
                Aprobación
              </span>

              <strong>
                {isBonification
                  ? "Jefatura Comercial y Clientes"
                  : "Según proceso"}
              </strong>

            </div>


            <div className="request-side-row">

              <span>
                SLA aprobación
              </span>

              <strong>
                {request.approvalSLAHours
                  ? `${request.approvalSLAHours} h`
                  : "Por definir"}
              </strong>

            </div>


            {process?.hasManagementStage && (
              <div className="request-side-row">

                <span>
                  SLA resolución
                </span>

                <strong>
                  {request.resolutionSLAHours
                    ? `${request.resolutionSLAHours} h`
                    : "Por definir"}
                </strong>

              </div>
            )}


            <button
              className="process-manual-link"
              type="button"
            >
              <FileText size={16} />

              Ver proceso, SLA y manual
            </button>

          </section>


          {/* ACCIONES DE APROBACIÓN */}

          {canApprove &&
            (
              status ===
                "PENDIENTE_APROBACION" ||
              status ===
                "INFORMACION_REQUERIDA"
            ) && (
              <section className="request-side-card approval-actions-card">

                <span className="eyebrow">
                  DECISIÓN
                </span>

                <h3>
                  Gestionar solicitud
                </h3>


                <button
                  className="request-action approve"
                  onClick={approve}
                >
                  <CheckCircle2 size={17} />

                  Aprobar
                </button>


                {!!adjustableFields.length && (
                  <button
                    className="request-action adjust"
                    onClick={() => {
                      setActionMode(
                        actionMode ===
                          "ADJUST"
                          ? null
                          : "ADJUST"
                      )
                    }}
                  >
                    <CircleDollarSign
                      size={17}
                    />

                    Aprobar con ajuste
                  </button>
                )}


                <button
                  className="request-action information"
                  onClick={() => {
                    setActionMode(
                      actionMode ===
                        "INFO"
                        ? null
                        : "INFO"
                    )
                  }}
                >
                  <MessageSquareText
                    size={17}
                  />

                  Solicitar información
                </button>


                <button
                  className="request-action reject"
                  onClick={() => {
                    setActionMode(
                      actionMode ===
                        "REJECT"
                        ? null
                        : "REJECT"
                    )
                  }}
                >
                  <X size={17} />

                  Rechazar
                </button>


                {/* AJUSTE */}

                {actionMode ===
                  "ADJUST" && (
                  <div className="action-form">

                    <div className="action-form-title">
                      Aprobar con ajuste
                    </div>


                    {adjustableFields.map(
                      (field) => (
                        <label
                          key={
                            field.id
                          }
                        >
                          <span>
                            {field.label}
                          </span>

                          <small>
                            Solicitado:{" "}
                            {formatFieldValue(
                              field.requestedValue,
                              field.type
                            )}
                          </small>

                          <input
                            type={
                              field.type ===
                              "CURRENCY"
                                ? "number"
                                : "text"
                            }
                            value={
                              adjustments[
                                field.id
                              ] ?? ""
                            }
                            onChange={(
                              event
                            ) =>
                              setAdjustments(
                                (
                                  current
                                ) => ({
                                  ...current,
                                  [field.id]:
                                    event
                                      .target
                                      .value,
                                })
                              )
                            }
                            placeholder="Valor aprobado"
                          />
                        </label>
                      )
                    )}


                    <label>
                      <span>
                        Comentario
                        <small>
                          {" "}
                          opcional
                        </small>
                      </span>

                      <textarea
                        value={
                          actionComment
                        }
                        onChange={(
                          event
                        ) =>
                          setActionComment(
                            event.target
                              .value
                          )
                        }
                        placeholder="Explica el ajuste si es necesario..."
                      />
                    </label>


                    <button
                      className="primary-btn"
                      disabled={
                        !adjustableFields.some(
                          (field) =>
                            adjustments[
                              field.id
                            ]?.trim()
                        )
                      }
                      onClick={
                        approveWithAdjustment
                      }
                    >
                      Aprobar con ajuste
                    </button>

                  </div>
                )}


                {/* INFORMACIÓN */}

                {actionMode ===
                  "INFO" && (
                  <div className="action-form">

                    <div className="action-form-title">
                      Solicitar información
                    </div>

                    <label>
                      <span>
                        ¿Qué información falta?
                        *
                      </span>

                      <textarea
                        value={
                          actionComment
                        }
                        onChange={(
                          event
                        ) =>
                          setActionComment(
                            event.target
                              .value
                          )
                        }
                        placeholder="Indica claramente qué antecedente necesitas..."
                      />
                    </label>

                    <button
                      className="primary-btn"
                      disabled={
                        !actionComment.trim()
                      }
                      onClick={
                        requestInformation
                      }
                    >
                      Enviar solicitud de información
                    </button>

                  </div>
                )}


                {/* RECHAZO */}

                {actionMode ===
                  "REJECT" && (
                  <div className="action-form">

                    <div className="action-form-title">
                      Rechazar solicitud
                    </div>

                    <label>
                      <span>
                        Motivo del rechazo *
                      </span>

                      <textarea
                        value={
                          actionComment
                        }
                        onChange={(
                          event
                        ) =>
                          setActionComment(
                            event.target
                              .value
                          )
                        }
                        placeholder="Indica el motivo..."
                      />
                    </label>

                    <button
                      className="danger-btn"
                      disabled={
                        !actionComment.trim()
                      }
                      onClick={reject}
                    >
                      Rechazar solicitud
                    </button>

                  </div>
                )}

              </section>
            )}


          {/* GESTIÓN / RESOLUCIÓN */}

          {canManage &&
            (
              status === "APROBADA" ||
              status ===
                "APROBADA_CON_AJUSTE" ||
              status ===
                "EN_GESTION"
            ) && (
              <section className="request-side-card">

                <span className="eyebrow">
                  RESOLUCIÓN
                </span>

                <h3>
                  Finalizar gestión
                </h3>


                <p className="side-note">
                  Cuando la gestión esté
                  efectivamente terminada,
                  informa la resolución al
                  solicitante.
                </p>


                <button
                  className="request-action approve"
                  onClick={
                    markResolved
                  }
                >
                  <CheckCircle2
                    size={17}
                  />

                  Marcar resuelta por confirmar
                </button>

              </section>
            )}


          {/* POR CONFIRMAR */}

          {status ===
            "RESUELTA_POR_CONFIRMAR" && (
            <section className="request-side-card confirmation-card">

              <Info size={19} />

              <div>
                <strong>
                  Pendiente de confirmación
                </strong>

                <p>
                  El solicitante o su
                  Jefatura Local debe
                  confirmar la resolución.
                  Si no responde dentro del
                  plazo configurado, el caso
                  se cerrará automáticamente.
                </p>
              </div>

            </section>
          )}


          {/* RECHAZADA */}

          {status ===
            "RECHAZADA" && (
            <section className="request-side-card rejected-card">

              <X size={19} />

              <div>
                <strong>
                  Solicitud rechazada
                </strong>

                <p>
                  El motivo queda registrado
                  en el historial de la
                  solicitud.
                </p>
              </div>

            </section>
          )}

        </aside>

      </div>

    </div>
  )
}


// ======================================================
// RESUMEN
// ======================================================

function SummaryItem({
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

      {Icon && (
        <Icon size={16} />
      )}

      <div>
        <span>
          {label}
        </span>

        <strong>
          {value}
        </strong>
      </div>

    </div>
  )
}


// ======================================================
// ESTADO
// ======================================================

function StatusBadge({
  status,
  reopened,
}: {
  status: RequestStatus
  reopened: boolean
}) {
  const labels: Record<
    RequestStatus,
    string
  > = {
    RECIBIDA:
      "Recibida",

    INFORMACION_REQUERIDA:
      "Información requerida",

    PENDIENTE_APROBACION:
      "Por aprobar",

    APROBADA:
      "Aprobada",

    APROBADA_CON_AJUSTE:
      "Aprobada con ajuste",

    EN_GESTION:
      "En gestión",

    RESUELTA_POR_CONFIRMAR:
      "Resuelta · por confirmar",

    RESUELTA:
      "Resuelta",

    RECHAZADA:
      "Rechazada",
  }


  return (
    <div className="request-detail-status-wrap">

      {reopened && (
        <span className="request-reopened">
          <RotateCcw size={11} />
          Reabierta
        </span>
      )}

      <span
        className={`request-detail-status status-${status.toLowerCase()}`}
      >
        {labels[status]}
      </span>

    </div>
  )
}


// ======================================================
// CAMPOS DINÁMICOS
// ======================================================

function getRequestFields(
  request: RequestItem
): FieldRow[] {
  const rawFields =
    request.fields ?? []


  return rawFields.map(
    (
      rawField,
      index
    ) => {
      const raw =
        rawField as unknown as Record<
          string,
          unknown
        >


      const fieldId =
        getString(
          raw.fieldId
        ) ||
        getString(
          raw.id
        ) ||
        `field-${index}`


      const definition =
        mockProcessFields.find(
          (field) =>
            field.id === fieldId
        )


      const requestedValue =
        getString(
          raw.requestedValue
        ) ||
        getString(
          raw.value
        ) ||
        getString(
          raw.requested
        )


      const approvedValue =
        getString(
          raw.approvedValue
        ) ||
        getString(
          raw.approved
        ) ||
        undefined


      return {
        id: fieldId,

        label:
          definition?.label ??
          getString(
            raw.label
          ) ??
          fieldId,

        requestedValue,

        approvedValue,

        adjustable:
          definition?.adjustable ??
          false,

        type:
          definition?.type,
      }
    }
  )
}


function getString(
  value: unknown
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return ""
  }

  return String(value)
}


// ======================================================
// FORMATO
// ======================================================

function formatFieldValue(
  value: string,
  type?: string
) {
  if (!value) {
    return "—"
  }

  if (
    type === "CURRENCY"
  ) {
    const number =
      Number(value)

    if (
      !Number.isNaN(number)
    ) {
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


function formatDate(
  value: string
) {
  return new Intl.DateTimeFormat(
    "es-CL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  )
}
