// ======================================================
// DITALCAR COLABORADORES
// TIPOS GENERALES
// ======================================================


// ======================================================
// ROLES
// ======================================================

export type UserRole =
  | "VENDEDOR"
  | "JEFATURA_LOCAL"
  | "JEFATURA_MARCA"
  | "JEFATURA_ZONAL"
  | "GERENCIA_VENTAS"
  | "JEFATURA_COMERCIAL_CLIENTES"
  | "JEFATURA_OPERACIONES_COMERCIALES"
  | "JEFATURA_ADMINISTRACION"
  | "GERENCIA_ADMINISTRACION"
  | "GERENCIA_COMERCIAL"
  | "JEFATURA_MARKETING"
  | "EXPERIENCIA_CLIENTES"
  | "ADMINISTRATIVO"
  | "EQUIPO_COMERCIAL"
  | "GERENCIA_GENERAL"


// ======================================================
// USUARIO Y ÁMBITO
// ======================================================

export type UserScope = {
  email: string
  name: string
  role: UserRole

  local?: string
  zone?: string
  brands?: string[]

  active: boolean
}


// ======================================================
// FAMILIAS DE SOLICITUD
// ======================================================

export type RequestFamily =
  | "UNIDADES"
  | "INSUMOS_SHOWROOM"
  | "COLABORADORES"
  | "OTROS"


// ======================================================
// ESTADOS DE SOLICITUD
// ======================================================

export type RequestStatus =
  | "RECIBIDA"
  | "INFORMACION_REQUERIDA"
  | "PENDIENTE_APROBACION"
  | "APROBADA"
  | "APROBADA_CON_AJUSTE"
  | "EN_GESTION"
  | "RESUELTA_POR_CONFIRMAR"
  | "RESUELTA"
  | "RECHAZADA"


// ======================================================
// ESTADOS SLA
// ======================================================

export type SLAStatus =
  | "NO_INICIADO"
  | "EN_PLAZO"
  | "PROXIMO_A_VENCER"
  | "FUERA_DE_SLA"
  | "PAUSADO"
  | "FINALIZADO"


// ======================================================
// TIPOS DE CAMPOS
// ======================================================

export type ProcessFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "SELECT"
  | "BOOLEAN"
  | "FILE"


// ======================================================
// DEFINICIÓN DE CAMPO DE PROCESO
// ======================================================

export type ProcessFieldDefinition = {
  id: string

  processCode: string

  label: string

  type: ProcessFieldType

  required: boolean

  adjustable: boolean

  order: number

  placeholder?: string

  options?: string[]

  active: boolean
}


// ======================================================
// ASIGNACIONES DE PROCESO
// ======================================================

export type ProcessAssignmentType =
  | "APPROVER"
  | "MANAGER"
  | "VIEWER"


export type ProcessAssignment = {
  id: string

  processCode: string

  type: ProcessAssignmentType

  email?: string

  role?: UserRole

  local?: string

  zone?: string

  brand?: string

  active: boolean
}


// ======================================================
// CHECKPOINTS INTERNOS
// ======================================================

export type InternalCheckpointDefinition = {
  id: string

  label: string

  order: number
}


export type InternalCheckpointValue = {
  checkpointId: string

  completed: boolean

  completedAt?: string

  completedByEmail?: string

  completedByName?: string
}


// ======================================================
// DEFINICIÓN DE PROCESO
// ======================================================

export type ProcessDefinition = {
  code: string

  family: RequestFamily

  name: string

  description: string

  active: boolean

  order: number

  requesterRoles: UserRole[]

  requiresApproval: boolean

  hasManagementStage: boolean

  approvalSLAHours?: number

  resolutionSLAHours?: number

  confirmationHours: number

  manualUrl?: string

  academyEnabled: boolean

  internalCheckpoints?:
    InternalCheckpointDefinition[]
}


// ======================================================
// VALORES DE SOLICITUD
// ======================================================

export type RequestFieldValue = {
  fieldId: string

  requestedValue: string

  approvedValue?: string
}


// ======================================================
// ARCHIVOS
// ======================================================

export type RequestAttachment = {
  id: string

  requestId: string

  fileName: string

  fileUrl?: string

  stage: string

  uploadedByEmail: string

  uploadedByName: string

  uploadedAt: string
}


// ======================================================
// HISTORIAL / SEGUIMIENTO
// ======================================================

export type RequestTimelineType =
  | "CREATED"
  | "APPROVED"
  | "APPROVED_WITH_ADJUSTMENT"
  | "INFORMATION_REQUESTED"
  | "INFORMATION_PROVIDED"
  | "REJECTED"
  | "MANAGEMENT"
  | "RESOLUTION_REPORTED"
  | "RESOLUTION_CONFIRMED"
  | "NOT_RESOLVED"
  | "REOPENED"
  | "AUTO_CLOSED"
  | "COMMENT"
  | "INTERNAL_CHECKPOINT"


export type RequestTimelineItem = {
  id: string

  requestId: string

  type: RequestTimelineType

  authorEmail: string

  authorName: string

  createdAt: string

  comment?: string
}


// ======================================================
// SOLICITUD
// ======================================================

export type RequestItem = {
  id: string

  processCode: string

  processName: string

  family: RequestFamily

  requesterEmail: string

  requesterName: string

  requesterRole?: UserRole

  local: string

  status: RequestStatus

  currentResponsibleEmail?: string

  currentResponsibleName?: string

  fields: RequestFieldValue[]

  createdAt: string


  // ------------------------------------------------------
  // SLA APROBACIÓN
  // ------------------------------------------------------

  approvalSLAHours?: number

  approvalSLAStartedAt?: string

  approvalSLAPausedMinutes: number

  approvalSLAPausedAt?: string


  // ------------------------------------------------------
  // SLA RESOLUCIÓN
  // ------------------------------------------------------

  resolutionSLAHours?: number

  resolutionSLAStartedAt?: string


  // ------------------------------------------------------
  // CONFIRMACIÓN
  // ------------------------------------------------------

  resolutionConfirmationDeadline?: string


  // ------------------------------------------------------
  // REAPERTURA / CIERRE
  // ------------------------------------------------------

  reopened: boolean

  autoClosed: boolean


  // ------------------------------------------------------
  // CONTROL INTERNO
  // ------------------------------------------------------

  internalCheckpoints:
    InternalCheckpointValue[]
}


// ======================================================
// PERMISOS DE SOLICITUD
// ======================================================

export type RequestPermissions = {
  canView: boolean

  canApprove: boolean

  canManage: boolean

  canConfirmResolution: boolean

  canRequestInformation: boolean

  canReject: boolean

  canApproveWithAdjustment: boolean
}
