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

export type UserScopeLevel =
  | "LOCAL"
  | "MULTILOCAL"
  | "MARCA"
  | "ZONA"
  | "RED"

export type UserScope = {
  email: string
  name: string
  role: UserRole
  local?: string
  localPrincipal?: string
  assignedLocals?: string[]
  scope?: UserScopeLevel
  zone?: string
  brands?: string[]
  areaFunctional?: string
  active: boolean
}

export type RequestFamily =
  | "UNIDADES"
  | "INSUMOS_SHOWROOM"
  | "COLABORADORES"
  | "COMERCIAL"
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

export type ProcessFormMode =
  | "DINAMICO"
  | "INSUMOS_CLASICO"
  | "INSUMOS_2_0"

export type LocalReviewRule =
  | "NUNCA"
  | "SOLO_VENDEDOR"
  | "SIEMPRE"

export type ProcessConfig = {
  code: string
  name: string
  family: RequestFamily
  description: string
  formMode: ProcessFormMode
  requesterRoles: UserRole[]
  localReviewRule: LocalReviewRule
  localRule?: string
  allowsAmountAdjustment: boolean
  allowsAttachments: boolean
  requiresAttachment: boolean
  manualRequest: boolean
  fromBreach: boolean
  areaLabel?: string
  approvalRule?: string
  slaReviewCode?: string
  slaAcceptanceCode?: string
  slaResolutionCode?: string
  slaConfirmationCode?: string
  confirmationHours: number
  version: number
  order: number
  active: boolean
  notes?: string
}

export type ProcessFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "SELECT"
  | "BOOLEAN"
  | "FILE"
  | "PHONE"
  | "EMAIL"
  | "VIN"
  | "LOCAL_SELECT"
  | "CALCULATED_CURRENCY"
  | "INTERNAL_NUMBER"
  | "INTERNAL_TEXT"
  | "CATALOG_ITEM"

export type ProcessFieldDefinition = {
  id: string
  processCode: string
  key?: string
  label: string
  type: ProcessFieldType
  required: boolean
  adjustable: boolean
  order: number
  placeholder?: string
  help?: string
  options?: string[]
  source?: string
  readOnly?: boolean
  visibleBeforeSubmit?: boolean
  visibleAfterSubmit?: boolean
  visibleManager?: boolean
  isAmount?: boolean
  group?: string
  repeatable?: boolean
  validation?: string
  unit?: string
  formula?: string
  snapshot?: boolean
  historical?: boolean
  allowPostComment?: boolean
  active: boolean
  notes?: string
}

export type ProcessAssignmentType =
  | "APPROVER"
  | "MANAGER"
  | "VIEWER"

export type ProcessAssignment = {
  id: string
  processCode: string
  type: ProcessAssignmentType
  mode?: "ROL" | "EMAIL"
  email?: string
  role?: UserRole
  local?: string
  zone?: string
  brand?: string
  areaFunctional?: string
  label?: string
  scope?: string
  condition?: string
  priority?: number
  isPrincipal?: boolean
  active: boolean
}

// Compatibilidad con módulos anteriores del piloto.
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
  currentResponsibleLabel?: string
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
  returnResponsibleLabel?: string

  managementOwnerEmail?: string
  managementOwnerName?: string
  managementOwnerLabel?: string

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
