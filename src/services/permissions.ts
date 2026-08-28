import type {
  ProcessAssignment,
  RequestItem,
  RequestPermissions,
  UserScope,
} from "../types"


// ======================================================
// HELPERS DE ROL
// ======================================================

const managementRoles = [
  "GERENCIA_VENTAS",
  "GERENCIA_COMERCIAL",
  "GERENCIA_ADMINISTRACION",
  "GERENCIA_GENERAL",
] as const


function isManagementRole(role: UserScope["role"]) {
  return managementRoles.includes(
    role as (typeof managementRoles)[number]
  )
}


// ======================================================
// VISIBILIDAD DE SOLICITUD
// ======================================================
//
// Reglas iniciales:
// - Solicitante siempre puede ver.
// - Jefatura de Local puede ver solicitudes de su local.
// - Gerencias pueden ver solicitudes dentro de su ámbito.
// - Aprobadores/gestores pueden ver solicitudes de procesos
//   que tengan asignados.
// - Más adelante agregaremos Marca/Zona con datos reales.
// ======================================================

export function canViewRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) return false

  // Solicitante
  if (user.email === request.requesterEmail) {
    return true
  }

  // Jefatura local
  if (
    user.role === "JEFATURA_LOCAL" &&
    user.local &&
    user.local === request.local
  ) {
    return true
  }

  // Gerencias con visibilidad amplia
  if (isManagementRole(user.role)) {
    return true
  }

  // Responsables del proceso
  const isAssignedToProcess = assignments.some(
    (assignment) =>
      assignment.active &&
      assignment.processCode === request.processCode &&
      (
        assignment.email === user.email ||
        assignment.role === user.role
      )
  )

  if (isAssignedToProcess) {
    return true
  }

  return false
}


// ======================================================
// APROBACIÓN
// ======================================================

export function canApproveRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) return false

  return assignments.some(
    (assignment) =>
      assignment.active &&
      assignment.processCode === request.processCode &&
      assignment.type === "APPROVER" &&
      (
        assignment.email === user.email ||
        assignment.role === user.role
      )
  )
}


// ======================================================
// GESTIÓN
// ======================================================

export function canManageRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) return false

  return assignments.some(
    (assignment) =>
      assignment.active &&
      assignment.processCode === request.processCode &&
      assignment.type === "MANAGER" &&
      (
        assignment.email === user.email ||
        assignment.role === user.role
      )
  )
}


// ======================================================
// CONFIRMACIÓN DE RESOLUCIÓN
// ======================================================
//
// Puede confirmar:
// - solicitante
// - jefatura del local del solicitante
//
// Más adelante esto podrá parametrizarse por proceso.
// ======================================================

export function canConfirmResolution(
  user: UserScope,
  request: RequestItem
): boolean {
  if (!user.active) return false

  if (user.email === request.requesterEmail) {
    return true
  }

  if (
    user.role === "JEFATURA_LOCAL" &&
    user.local &&
    user.local === request.local
  ) {
    return true
  }

  return false
}


// ======================================================
// PERMISOS COMPLETOS
// ======================================================

export function getRequestPermissions(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): RequestPermissions {
  const canView = canViewRequest(
    user,
    request,
    assignments
  )

  const canApprove = canApproveRequest(
    user,
    request,
    assignments
  )

  const canManage = canManageRequest(
    user,
    request,
    assignments
  )

  const canConfirm = canConfirmResolution(
    user,
    request
  )

  return {
    canView,

    canApprove,

    canManage,

    canConfirmResolution: canConfirm,

    // Estas acciones pertenecen al rol aprobador.
    canRequestInformation: canApprove,

    canReject: canApprove,

    canApproveWithAdjustment: canApprove,
  }
}


// ======================================================
// VISIBILIDAD DE DETALLE DE LOCALES
// ======================================================
//
// Esto prepara la lógica que definimos para ventas/metas:
//
// Vendedor:
// - detalle de su local
// - general del resto
//
// Jefatura Local:
// - detalle de su local
// - general del resto
//
// Jefatura Marca/Zonal:
// - detalle según sus asociaciones
//
// Gerencia Ventas:
// - detalle de todos
//
// Por ahora Marca/Zona quedan preparados para ampliar.
// ======================================================

export function canViewLocalDetail(
  user: UserScope,
  local: string
): boolean {
  if (!user.active) return false

  if (user.role === "GERENCIA_VENTAS") {
    return true
  }

  if (user.role === "GERENCIA_GENERAL") {
    return true
  }

  if (
    user.role === "VENDEDOR" ||
    user.role === "JEFATURA_LOCAL"
  ) {
    return Boolean(
      user.local &&
      user.local === local
    )
  }

  // Más adelante se completará con
  // asociaciones reales de marca y zona.
  if (
    user.role === "JEFATURA_MARCA" ||
    user.role === "JEFATURA_ZONAL"
  ) {
    return false
  }

  return false
}
