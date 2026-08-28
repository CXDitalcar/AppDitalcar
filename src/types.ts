// ======================================================
// DITALCAR COLABORADORES
// Tipos centrales de la aplicación
// ======================================================

// ---------- ROLES ----------

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
   "JEFATURA_MARKETING"
  | "ADMINISTRATIVO"
  | "EQUIPO_COMERCIAL"
  | "GERENCIA_GENERAL"


// ---------- USUARIOS Y ÁMBITOS ----------

export type UserScope = {
  email: string
  name: string
  role: UserRole

  local?: string
  zone?: string
  brands?: string[]

  active: boolean
}


// ---------- FAMILIAS DE SOLICITUD ----------

export type RequestFamily =
  | "UNIDADES"
  | "INSUMOS_ADMINISTRACION"
  | "COLABORADORES"
  | "OTROS"


// ---------- ESTADOS DE SOLICITUD ----------

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


// ---------- ESTADOS SLA ----------

export type SLAStatus =
  | "NO_INICIADO"
  | "EN_PLAZO"
  | "PROXIMO_A_VENCER"
  | "FUERA_DE_SLA"
  | "PAUSADO"
  | "FINALIZADO"


// ---------- TIPO DE CAMPO DINÁMICO ----------

export type ProcessFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "CURRENCY"
  | "DATE"
  | "SELECT"
  | "BOOLEAN"
  | "FILE"


// ---------- CAMPOS DE CADA PROCESO ----------

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


// ---------- RESPONSABLES DE PROCESO ----------

export type ProcessResponsibilityType =
  | "APPROVER"
  | "MANAGER"


export type ProcessAssignment = {
  id: string
  processCode: string

  type: ProcessResponsibilityType

  email?: string
  role?: UserRole

  local?: string
  zone?: string
  brand?: string

  active: boolean
}


// ---------- CONTROL INTERNO DE PROCESOS ----------

export type InternalCheckpointDefinition = {
  id: string
  label: string
  order: number
}


// ---------- PROCESOS ----------

export type ProcessDefinition = {
  code: string

  family: RequestFamily
  name: string
  description: string

  active: boolean
  order: number

  // Quién puede iniciar el proceso
  requesterRoles: UserRole[]

  // Flujo
  requiresApproval: boolean

  // Algunos procesos pueden saltarse "En gestión".
  hasManagementStage: boolean

  // SLA vigentes del proceso.
  // La solicitud guardará una copia al momento de crearse.
  approvalSLAHours?: number
  resolutionSLAHours?: number

  // Tiempo para que solicitante/jefatura confirme resolución.
  confirmationHours: number

  // Academia / documentación
  manualUrl?: string
  academyEnabled: boolean

  // Controles privados de responsables del proceso.
  // Ej.: Bonificación:
  // "Solicitud realizada a marca" / "Factura recibida"
  internalCheckpoints?: InternalCheckpointDefinition[]
}


// ---------- VALORES INGRESADOS EN UNA SOLICITUD ----------

export type RequestFieldValue = {
  fieldId: string
  label: string

  requestedValue: string

  // Solo existe si hubo aprobación con ajuste.
  approvedValue?: string

  adjustable: boolean
}


// ---------- ADJUNTOS ----------

export type RequestAttachment = {
  id: string
  requestId: string

  fileName: string
  fileUrl: string

  uploadedBy: string
  uploadedAt: string

  stage:
    | "SOLICITUD_INICIAL"
    | "INFORMACION"
    | "GESTION"
    | "RESOLUCION"
}


// ---------- SEGUIMIENTO / HISTORIAL ----------

export type RequestTimelineType =
  | "SOLICITUD_CREADA"
  | "INFORMACION_REQUERIDA"
  | "INFORMACION_ENVIADA"
  | "APROBADA"
  | "APROBADA_CON_AJUSTE"
  | "RECHAZADA"
  | "EN_GESTION"
  | "RESUELTA_POR_CONFIRMAR"
  | "CONFIRMACION_RESOLUCION"
  | "NO_RESUELTA"
  | "CIERRE_AUTOMATICO"
  | "COMENTARIO"
  | "ADJUNTO"
  | "SISTEMA"


export type RequestTimelineItem = {
  id: string
  requestId: string

  type: RequestTimelineType

  authorName: string
  authorEmail?: string

  createdAt: string

  comment?: string
}


// ---------- CONTROL INTERNO DE UNA SOLICITUD ----------

export type InternalCheckpointValue = {
  checkpointId: string
  label: string

  completed: boolean

  completedAt?: string
  completedBy?: string
}


// ---------- SOLICITUD ----------

export type RequestItem = {
  id: string

  processCode: string
  processName: string
  family: RequestFamily

  requesterName: string
  requesterEmail: string
  local: string

  createdAt: string

  status: RequestStatus

  currentResponsibleName?: string
  currentResponsibleEmail?: string

  fields: RequestFieldValue[]

  // SLA congelados al crear la solicitud.
  approvalSLAHours?: number
  resolutionSLAHours?: number
  confirmationHours: number

  // SLA aprobación
  approvalSLAStartedAt?: string
  approvalSLAEndedAt?: string

  // Si se pide información, el SLA se pausa.
  approvalSLAPausedAt?: string
  approvalSLAPausedMinutes: number

  // SLA resolución
  resolutionSLAStartedAt?: string
  resolutionSLAEndedAt?: string

  // IMPORTANTE:
  // Si vuelve a gestión por "No resuelto",
  // este SLA NO se reinicia.

  // Confirmación
  resolutionConfirmationStartedAt?: string
  resolutionConfirmationDeadline?: string

  // Reapertura
  reopened: boolean
  reopenedCount: number

  // Cierre automático después del plazo de confirmación
  autoClosed: boolean

  internalCheckpoints?: InternalCheckpointValue[]
}


// ---------- PERMISOS SOBRE UNA SOLICITUD ----------

export type RequestPermissions = {
  canView: boolean
  canApprove: boolean
  canManage: boolean
  canConfirmResolution: boolean
  canRequestInformation: boolean
  canReject: boolean
  canApproveWithAdjustment: boolean
}
