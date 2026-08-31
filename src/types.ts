// ======================================================
// DITALCAR COLABORADORES · TIPOS GENERALES
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

export type UserScope = {
  email: string
  name: string
  role: UserRole
  local?: string
  zone?: string
  brands?: string[]
  active: boolean
}

export type RequestFamily =
  | "UNIDADES"
  | "INSUMOS_SHOWROOM"
  | "COLABORADORES"
  | "OTROS"

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

export type ApprovalContext =
  | "JEFATURA_LOCAL"
  | "PROCESO"
  | "PRESUPUESTO_COMERCIAL"
  | "INFRAESTRUCTURA_GENERAL"

export type SLAStatus =
  | "NO_INICIADO"
  | "EN_PLAZO"
  | "PROXIMO_A_VENCER"
  | "FUERA_DE_SLA"
  | "PAUSADO"
  | "FINALIZADO"

export type ProcessFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "SELECT"
  | "BOOLEAN"
  | "FILE"

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

export type ProcessAssignmentType = "APPROVER" | "MANAGER" | "VIEWER"

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
  internalCheckpoints?: InternalCheckpointDefinition[]
}

export type RequestFieldValue = {
  fieldId: string
  requestedValue: string
  approvedValue?: string
}

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
  | "BUDGET_REQUESTED"
  | "ESCALATED"

export type RequestTimelineItem = {
  id: string
  requestId: string
  type: RequestTimelineType
  authorEmail: string
  authorName: string
  createdAt: string
  comment?: string
}

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

  approvalContext?: ApprovalContext
  approvalSLAHours?: number
  approvalSLAStartedAt?: string
  approvalSLAPausedMinutes: number
  approvalSLAPausedAt?: string

  acceptanceSLAHours?: number
  acceptanceSLAStartedAt?: string
  managementAcceptedAt?: string

  resolutionSLAHours?: number
  resolutionSLAStartedAt?: string
  resolutionSLAPausedAt?: string
  resolutionSLAPausedMinutes?: number
  slaPausedReason?: string

  returnStatusAfterInfo?: RequestStatus
  returnResponsibleEmail?: string
  returnResponsibleName?: string

  managementOwnerEmail?: string
  managementOwnerName?: string

  resolutionConfirmationDeadline?: string
  reopened: boolean
  autoClosed: boolean

  originFormCode?: string
  originExecutionId?: string
  originBreachId?: string

  internalCheckpoints: InternalCheckpointValue[]
}

export type RequestPermissions = {
  canView: boolean
  canApprove: boolean
  canManage: boolean
  canConfirmResolution: boolean
  canRequestInformation: boolean
  canReject: boolean
  canApproveWithAdjustment: boolean
}
