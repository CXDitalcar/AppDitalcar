import { requestAssignments } from "../data/requestConfig"
import { mockUsers } from "../data/mockData"
import {
  appendDemoTimeline,
  createDemoRequest,
  getDemoRequests,
  getDemoTimeline,
  nextDemoRequestId,
  updateDemoRequest,
} from "./demoStore"
import {
  createItemInNamedList,
  createSolicitud,
  getItemsFromNamedList,
  getSolicitud,
  getSolicitudes,
  updateItemInNamedList,
  updateSolicitud,
  type GraphListItem,
} from "./graph"
import {
  getFieldDefinition,
  getRequestProcess,
  isDemoUser,
} from "./requestCatalog"
import type {
  ApprovalContext,
  RequestFieldValue,
  RequestItem,
  RequestStatus,
  RequestTimelineItem,
  RequestTimelineType,
  UserRole,
  UserScope,
} from "../types"

const VALUE_LISTS = ["20_ValoresSolicitud"]
const TIMELINE_LISTS = ["21_SeguimientoSolicitudes", "21_SeguimientoSolic"]
const SYSTEM_FIELD_ID = "_SYS_WORKFLOW_STATE"

const activeStatuses = new Set<RequestStatus>([
  "RECIBIDA",
  "INFORMACION_REQUERIDA",
  "PENDIENTE_APROBACION",
  "APROBADA",
  "APROBADA_CON_AJUSTE",
  "EN_GESTION",
  "RESUELTA_POR_CONFIRMAR",
])

export type RequestPersistResult = {
  request: RequestItem
  warnings: string[]
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
}

function pick(fields: Record<string, any>, aliases: string[]) {
  const entries = Object.entries(fields)
  for (const alias of aliases) {
    const target = normalize(alias)
    const match = entries.find(([key]) => normalize(key) === target)
    if (match && match[1] !== undefined && match[1] !== null) return match[1]
  }
  return undefined
}

function asString(value: unknown, fallback = "") {
  if (value === undefined || value === null) return fallback
  return String(value)
}

function asNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null || value === "") return fallback
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value
  if (value === undefined || value === null || value === "") return fallback
  return ["1", "true", "si", "sí", "yes"].includes(String(value).toLowerCase())
}

function splitList(value: unknown) {
  return asString(value)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function familyLabel(request: RequestItem) {
  const labels: Record<RequestItem["family"], string> = {
    UNIDADES: "Unidades",
    INSUMOS_SHOWROOM: "Insumos y Showroom",
    COLABORADORES: "Colaboradores",
    COMERCIAL: "Comercial",
    OTROS: "Otros",
  }
  return labels[request.family]
}

function formatFieldValue(field: RequestFieldValue, processCode: string) {
  const definition = getFieldDefinition(field.fieldId, processCode)
  const label = definition?.label ?? field.fieldId.replace(/__(\d+)$/, "")
  const requested = field.requestedValue || "—"
  if (
    field.approvedValue &&
    field.approvedValue.trim() &&
    field.approvedValue.trim() !== field.requestedValue.trim()
  ) {
    return `${label}: ${requested} → aprobado ${field.approvedValue}`
  }
  return `${label}: ${requested}`
}

export function buildRequestSummary(request: RequestItem) {
  const content = request.fields
    .filter((field) => field.fieldId !== SYSTEM_FIELD_ID)
    .map((field) => formatFieldValue(field, request.processCode))
    .join(" | ")

  const origin = request.originBreachId
    ? `Origen brecha ${request.originBreachId}`
    : ""

  return [content, origin].filter(Boolean).join(" | ").slice(0, 12000)
}

function workflowState(request: RequestItem) {
  const { fields: _fields, id: _id, ...state } = request
  return state
}

function systemStateValue(request: RequestItem) {
  return JSON.stringify(workflowState(request))
}

function valueRowRequestId(item: GraphListItem) {
  return asString(pick(item.fields, ["SolicitudID", "Solicitud ID"]))
}

function valueRowFieldId(item: GraphListItem) {
  return asString(pick(item.fields, ["CampoID", "Campo ID"]))
}

function parseSystemState(rows: GraphListItem[]) {
  const system = rows.find((row) => valueRowFieldId(row) === SYSTEM_FIELD_ID)
  if (!system) return undefined
  const raw = asString(pick(system.fields, ["ValorSolicitado", "Valor Solicitado"]))
  if (!raw) return undefined
  try {
    return JSON.parse(raw) as Partial<RequestItem>
  } catch {
    return undefined
  }
}

function inferApprovalContext(
  status: RequestStatus,
  responsibleEmail: string,
  processCode: string
): ApprovalContext | undefined {
  if (status !== "PENDIENTE_APROBACION") return undefined

  const user = mockUsers.find(
    (item) => item.email.toLowerCase() === responsibleEmail.toLowerCase()
  )
  if (
    user &&
    ["JEFATURA_LOCAL", "JEFATURA_MARCA", "JEFATURA_ZONAL"].includes(user.role)
  ) {
    return "JEFATURA_LOCAL"
  }

  if (user?.role === "GERENCIA_COMERCIAL") {
    return "PRESUPUESTO_COMERCIAL"
  }

  const isProcessApprover = requestAssignments.some(
    (assignment) =>
      assignment.active &&
      assignment.processCode === processCode &&
      assignment.type === "APPROVER" &&
      assignment.email?.toLowerCase() === responsibleEmail.toLowerCase()
  )
  return isProcessApprover ? "PROCESO" : "PROCESO"
}

function fieldRowsToValues(rows: GraphListItem[]): RequestFieldValue[] {
  return rows
    .filter((row) => valueRowFieldId(row) !== SYSTEM_FIELD_ID)
    .map((row) => ({
      fieldId: valueRowFieldId(row),
      requestedValue: asString(
        pick(row.fields, ["ValorSolicitado", "Valor Solicitado"])
      ),
      approvedValue:
        pick(row.fields, ["ValorAprobado", "Valor Aprobado"]) === undefined
          ? undefined
          : asString(pick(row.fields, ["ValorAprobado", "Valor Aprobado"])),
    }))
    .filter((field) => Boolean(field.fieldId))
}

function mapMasterToRequest(master: GraphListItem, allValues: GraphListItem[]) {
  const f = master.fields
  const processCode = asString(pick(f, ["ProcesoCodigo"]))
  if (!processCode) return undefined

  const process = getRequestProcess(processCode)
  if (!process) return undefined

  const rows = allValues.filter((row) => valueRowRequestId(row) === master.id)
  const state = parseSystemState(rows)
  const status = asString(pick(f, ["EstadoFlujo"]), "RECIBIDA") as RequestStatus
  const responsibleEmail = asString(pick(f, ["ResponsableActualEmail"]))
  const responsibleName = asString(pick(f, ["ResponsableActualNombre"]))
  const totalPause = asNumber(pick(f, ["SLAPausaMinutos"]), 0) ?? 0

  const request: RequestItem = {
    id: master.id,
    processCode,
    processName: process.name,
    family: process.family,
    requesterEmail: asString(pick(f, ["SolicitanteEmail"])),
    requesterName: asString(pick(f, ["SolicitanteNombre"]), "Usuario Ditalcar"),
    requesterRole: state?.requesterRole,
    local: asString(pick(f, ["Local"]), "Sin local"),
    status,
    currentResponsibleEmail: responsibleEmail || state?.currentResponsibleEmail,
    currentResponsibleName: responsibleName || state?.currentResponsibleName,
    currentResponsibleLabel: state?.currentResponsibleLabel,
    fields: fieldRowsToValues(rows),
    createdAt: asString(
      pick(f, ["Fecha solicitud", "FechaSolicitud", "Created"]),
      new Date().toISOString()
    ),
    approvalContext:
      state?.approvalContext ?? inferApprovalContext(status, responsibleEmail, processCode),
    approvalSLAHours:
      asNumber(pick(f, ["SLAAprobacionSnapshot"])) ?? state?.approvalSLAHours,
    approvalSLAStartedAt:
      asString(pick(f, ["SLAInicioAprobacion"])) || state?.approvalSLAStartedAt,
    approvalSLAPausedMinutes:
      state?.approvalSLAPausedMinutes ?? totalPause,
    approvalSLAPausedAt: state?.approvalSLAPausedAt,
    acceptanceSLAHours: state?.acceptanceSLAHours,
    acceptanceSLAStartedAt: state?.acceptanceSLAStartedAt,
    managementAcceptedAt: state?.managementAcceptedAt,
    resolutionSLAHours:
      asNumber(pick(f, ["SLAResolucionSnapshot"])) ?? state?.resolutionSLAHours,
    resolutionSLAStartedAt:
      asString(pick(f, ["SLAInicioResolucion"])) || state?.resolutionSLAStartedAt,
    resolutionSLAPausedAt: state?.resolutionSLAPausedAt,
    resolutionSLAPausedMinutes:
      state?.resolutionSLAPausedMinutes ?? 0,
    slaPausedReason: state?.slaPausedReason,
    returnStatusAfterInfo: state?.returnStatusAfterInfo,
    returnResponsibleEmail: state?.returnResponsibleEmail,
    returnResponsibleName: state?.returnResponsibleName,
    returnResponsibleLabel: state?.returnResponsibleLabel,
    managementOwnerEmail: state?.managementOwnerEmail,
    managementOwnerName: state?.managementOwnerName,
    managementOwnerLabel: state?.managementOwnerLabel,
    resolutionConfirmationDeadline:
      asString(pick(f, ["FechaLimiteConfirmacion"])) ||
      state?.resolutionConfirmationDeadline,
    reopened: asBoolean(pick(f, ["Reabierta"]), state?.reopened ?? false),
    autoClosed: asBoolean(
      pick(f, ["CierreAutomatico"]),
      state?.autoClosed ?? false
    ),
    originFormCode:
      asString(pick(f, ["OrigenFormularioCodigo"])) || state?.originFormCode,
    originExecutionId:
      asString(pick(f, ["OrigenEjecucionID"])) || state?.originExecutionId,
    originBreachId:
      asString(pick(f, ["OrigenBrechaID"])) || state?.originBreachId,
    internalCheckpoints: state?.internalCheckpoints ?? [],
  }

  return request
}

function requestToMasterInput(
  request: RequestItem,
  informationComment?: string | null
) {
  const process = getRequestProcess(request.processCode)
  const pauseStart = request.approvalSLAPausedAt ?? request.resolutionSLAPausedAt
  const pauseMinutes =
    request.approvalSLAPausedMinutes + (request.resolutionSLAPausedMinutes ?? 0)

  return {
    title: request.processName,
    areaResponsable: process?.areaLabel ?? request.currentResponsibleLabel ?? "Por asignar",
    categoria: familyLabel(request),
    seccion: request.originFormCode ? "Formulario / brecha" : familyLabel(request),
    solicitud: buildRequestSummary(request),
    fechaSolicitud: request.createdAt,
    local: request.local,
    estado: request.originBreachId ? "Solicitado" : undefined,
    jefeLocal:
      request.approvalContext === "JEFATURA_LOCAL"
        ? request.currentResponsibleEmail
        : undefined,
    solicitarMasInformacion: informationComment,
    procesoCodigo: request.processCode,
    procesoVersion: process?.version ?? 1,
    solicitanteEmail: request.requesterEmail,
    solicitanteNombre: request.requesterName,
    estadoFlujo: request.status,
    responsableActualEmail: request.currentResponsibleEmail ?? null,
    responsableActualNombre: request.currentResponsibleName ?? null,
    slaAprobacionSnapshot: request.approvalSLAHours,
    slaResolucionSnapshot: request.resolutionSLAHours,
    confirmacionHorasSnapshot: process?.confirmationHours ?? 48,
    slaInicioAprobacion: request.approvalSLAStartedAt ?? null,
    slaPausaInicio: pauseStart ?? null,
    slaPausaMinutos: pauseMinutes,
    slaInicioResolucion: request.resolutionSLAStartedAt ?? null,
    fechaLimiteConfirmacion: request.resolutionConfirmationDeadline ?? null,
    reabierta: request.reopened,
    cierreAutomatico: request.autoClosed,
    origenFormularioCodigo: request.originFormCode,
    origenEjecucionID: request.originExecutionId,
    origenBrechaID: request.originBreachId,
  }
}

function valueWrites(requestId: string, request: RequestItem, field: RequestFieldValue) {
  const definition = getFieldDefinition(field.fieldId, request.processCode)
  return [
    { aliases: ["IDValor", "Title"], value: `${requestId}-${field.fieldId}` },
    { aliases: ["SolicitudID", "Solicitud ID"], value: Number(requestId) || requestId },
    { aliases: ["ProcesoCodigo"], value: request.processCode },
    { aliases: ["CampoID", "Campo ID"], value: field.fieldId },
    { aliases: ["Etiqueta"], value: definition?.label ?? field.fieldId },
    { aliases: ["ValorSolicitado", "Valor Solicitado"], value: field.requestedValue },
    { aliases: ["ValorAprobado", "Valor Aprobado"], value: field.approvedValue ?? null },
    { aliases: ["TipoDato", "Tipo Dato"], value: definition?.type ?? "TEXT" },
    { aliases: ["EsAjustable", "Es Ajustable"], value: Boolean(definition?.adjustable || definition?.isAmount) },
    { aliases: ["EsPlantilla", "Es Plantilla"], value: false },
  ]
}

function systemWrites(requestId: string, request: RequestItem) {
  return [
    { aliases: ["IDValor", "Title"], value: `${requestId}-${SYSTEM_FIELD_ID}` },
    { aliases: ["SolicitudID", "Solicitud ID"], value: Number(requestId) || requestId },
    { aliases: ["ProcesoCodigo"], value: request.processCode },
    { aliases: ["CampoID", "Campo ID"], value: SYSTEM_FIELD_ID },
    { aliases: ["Etiqueta"], value: "Estado interno del workflow" },
    { aliases: ["ValorSolicitado", "Valor Solicitado"], value: systemStateValue(request) },
    { aliases: ["ValorAprobado", "Valor Aprobado"], value: null },
    { aliases: ["TipoDato", "Tipo Dato"], value: "INTERNAL_TEXT" },
    { aliases: ["EsAjustable", "Es Ajustable"], value: false },
    { aliases: ["EsPlantilla", "Es Plantilla"], value: false },
  ]
}

function timelineWrites(item: RequestTimelineItem) {
  return [
    { aliases: ["IDSeguimiento", "Title"], value: item.id },
    { aliases: ["SolicitudID", "Solicitud ID"], value: Number(item.requestId) || item.requestId },
    { aliases: ["Tipo"], value: item.type },
    { aliases: ["AutorEmail"], value: item.authorEmail },
    { aliases: ["AutorNombre"], value: item.authorName },
    { aliases: ["FechaHora", "Fecha Hora"], value: item.createdAt },
    { aliases: ["Comentario"], value: item.comment },
    { aliases: ["AdjuntoURL", "Adjunto URL"], value: undefined },
    { aliases: ["VisibleSolicitante", "Visible Solicitante"], value: item.type !== "INTERNAL_CHECKPOINT" },
    { aliases: ["EsPlantilla", "Es Plantilla"], value: false },
  ]
}

async function saveValueRows(request: RequestItem, existing?: GraphListItem[]) {
  const warnings: string[] = []
  const rows = existing ?? (await getItemsFromNamedList(VALUE_LISTS))
  const requestRows = rows.filter((row) => valueRowRequestId(row) === request.id)
  const byFieldId = new Map(requestRows.map((row) => [valueRowFieldId(row), row]))

  const toSave = [
    ...request.fields.map((field) => ({ fieldId: field.fieldId, writes: valueWrites(request.id, request, field) })),
    { fieldId: SYSTEM_FIELD_ID, writes: systemWrites(request.id, request) },
  ]

  for (const entry of toSave) {
    const existingRow = byFieldId.get(entry.fieldId)
    const result = existingRow
      ? await updateItemInNamedList(VALUE_LISTS, existingRow.id, entry.writes)
      : await createItemInNamedList(VALUE_LISTS, entry.writes)
    if (result.skipped.length) {
      warnings.push(`20_ValoresSolicitud: columnas omitidas ${result.skipped.join(", ")}`)
    }
  }

  return warnings
}

async function appendLiveTimeline(item: RequestTimelineItem) {
  const result = await createItemInNamedList(TIMELINE_LISTS, timelineWrites(item))
  return result.skipped.length
    ? [`21_SeguimientoSolicitudes: columnas omitidas ${result.skipped.join(", ")}`]
    : []
}

export async function listRequests(user: UserScope): Promise<RequestItem[]> {
  if (isDemoUser(user)) return getDemoRequests()

  const [masters, values] = await Promise.all([
    getSolicitudes(),
    getItemsFromNamedList(VALUE_LISTS).catch(() => [] as GraphListItem[]),
  ])

  return masters
    .map((master) => mapMasterToRequest(master, values))
    .filter((request): request is RequestItem => Boolean(request))
}

export async function getRequestById(user: UserScope, requestId: string) {
  if (isDemoUser(user)) {
    return getDemoRequests().find((request) => request.id === requestId)
  }

  const [master, values] = await Promise.all([
    getSolicitud(requestId),
    getItemsFromNamedList(VALUE_LISTS).catch(() => [] as GraphListItem[]),
  ])
  return mapMasterToRequest(master, values)
}

export async function findActiveRequestByBreach(user: UserScope, breachId: string) {
  if (!breachId) return undefined
  const requests = await listRequests(user)
  return requests.find(
    (request) => request.originBreachId === breachId && activeStatuses.has(request.status)
  )
}

export async function createRequest(
  user: UserScope,
  input: Omit<RequestItem, "id">
): Promise<RequestPersistResult> {
  if (isDemoUser(user)) {
    const request: RequestItem = { ...input, id: nextDemoRequestId() }
    createDemoRequest(request)
    return { request, warnings: [] }
  }

  const temp: RequestItem = { ...input, id: "PENDIENTE" }
  const masterResult = await createSolicitud(requestToMasterInput(temp))
  const request: RequestItem = { ...input, id: masterResult.item.id }
  const warnings = masterResult.skipped.map(
    (name) => `Tablero General Solicitudes: columna no encontrada ${name}`
  )

  try {
    warnings.push(...(await saveValueRows(request)))
  } catch (error: any) {
    warnings.push(
      `La solicitud quedó creada en Tablero General Solicitudes, pero 20_ValoresSolicitud no pudo sincronizar: ${error?.message ?? error}`
    )
  }

  const createdTimeline: RequestTimelineItem = {
    id: `${request.id}-CREATED-${Date.now()}`,
    requestId: request.id,
    type: "CREATED",
    authorEmail: user.email,
    authorName: user.name,
    createdAt: request.createdAt,
    comment: "Solicitud ingresada en DitalApp.",
  }

  try {
    warnings.push(...(await appendLiveTimeline(createdTimeline)))
  } catch (error: any) {
    warnings.push(
      `La solicitud quedó creada en Tablero General Solicitudes, pero 21_SeguimientoSolicitudes no pudo registrar el hito inicial: ${error?.message ?? error}`
    )
  }

  return { request, warnings }
}

export async function saveRequestTransition(
  user: UserScope,
  previous: RequestItem,
  next: RequestItem,
  type: RequestTimelineType,
  title: string,
  detail?: string
): Promise<RequestPersistResult> {
  const timeline: RequestTimelineItem = {
    id: `${next.id}-${type}-${Date.now()}`,
    requestId: next.id,
    type,
    authorEmail: user.email,
    authorName: user.name,
    createdAt: new Date().toISOString(),
    comment: detail ? `${title} · ${detail}` : title,
  }

  if (isDemoUser(user)) {
    const { id: _id, ...patch } = next
    updateDemoRequest(next.id, patch)
    appendDemoTimeline(timeline)
    return { request: next, warnings: [] }
  }

  const informationComment =
    type === "INFORMATION_REQUESTED"
      ? detail ?? title
      : type === "INFORMATION_PROVIDED"
        ? null
        : undefined

  const masterResult = await updateSolicitud(
    next.id,
    requestToMasterInput(next, informationComment)
  )
  const warnings = masterResult.skipped.map(
    (name) => `Tablero General Solicitudes: columna no encontrada ${name}`
  )

  try {
    warnings.push(...(await saveValueRows(next)))
  } catch (error: any) {
    warnings.push(
      `Tablero actualizado, pero 20_ValoresSolicitud no pudo sincronizar: ${error?.message ?? error}`
    )
  }

  try {
    warnings.push(...(await appendLiveTimeline(timeline)))
  } catch (error: any) {
    warnings.push(
      `Tablero actualizado, pero 21_SeguimientoSolicitudes no pudo registrar el movimiento: ${error?.message ?? error}`
    )
  }

  return { request: next, warnings }
}

export async function getRequestHistory(user: UserScope, requestId: string) {
  if (isDemoUser(user)) return getDemoTimeline(requestId)

  const rows = await getItemsFromNamedList(TIMELINE_LISTS)
  return rows
    .filter(
      (row) =>
        asString(pick(row.fields, ["SolicitudID", "Solicitud ID"])) === requestId
    )
    .map<RequestTimelineItem>((row) => ({
      id: asString(pick(row.fields, ["IDSeguimiento", "Title"]), row.id),
      requestId,
      type: asString(pick(row.fields, ["Tipo"]), "COMMENT") as RequestTimelineType,
      authorEmail: asString(pick(row.fields, ["AutorEmail"])),
      authorName: asString(pick(row.fields, ["AutorNombre"]), "Usuario Ditalcar"),
      createdAt: asString(
        pick(row.fields, ["FechaHora", "Fecha Hora", "Created"]),
        new Date().toISOString()
      ),
      comment: asString(pick(row.fields, ["Comentario"])),
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function parseUserListValue(value: unknown) {
  return splitList(value)
}
