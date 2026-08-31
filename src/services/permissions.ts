import type {
  ProcessAssignment,
  RequestItem,
  RequestPermissions,
  UserScope,
} from "../types"


// ======================================================
// ROLES CON VISIBILIDAD AMPLIA
// ======================================================

const managementRoles: UserScope["role"][] = [
  "GERENCIA_VENTAS",
  "GERENCIA_COMERCIAL",
  "GERENCIA_ADMINISTRACION",
  "GERENCIA_GENERAL",
]


// ======================================================
// REVISAR SI UNA ASIGNACIÓN APLICA AL USUARIO
// ======================================================

function assignmentMatchesUser(
  user: UserScope,
  assignment: ProcessAssignment
): boolean {
  if (!assignment.active) {
    return false
  }

  if (
    assignment.email &&
    assignment.email === user.email
  ) {
    return true
  }

  if (
    assignment.role &&
    assignment.role === user.role
  ) {
    return true
  }

  return false
}


// ======================================================
// VER SOLICITUD
// ======================================================

export function canViewRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) {
    return false
  }


  // Solicitante
  if (
    request.requesterEmail ===
    user.email
  ) {
    return true
  }


  // Jefatura local
  if (
    user.role ===
      "JEFATURA_LOCAL" &&
    user.local &&
    user.local === request.local
  ) {
    return true
  }


  // Gerencias con visión amplia
  if (
    managementRoles.includes(
      user.role
    )
  ) {
    return true
  }


  // Responsable del proceso
  return assignments.some(
    (assignment) =>
      assignment.processCode ===
        request.processCode &&
      assignmentMatchesUser(
        user,
        assignment
      )
  )
}


// ======================================================
// APROBAR SOLICITUD
// ======================================================

export function canApproveRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) {
    return false
  }

  return assignments.some(
    (assignment) =>
      assignment.processCode ===
        request.processCode &&
      assignment.type ===
        "APPROVER" &&
      assignmentMatchesUser(
        user,
        assignment
      )
  )
}


// ======================================================
// GESTIONAR / RESOLVER
// ======================================================

export function canManageRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) {
    return false
  }

  return assignments.some(
    (assignment) =>
      assignment.processCode ===
        request.processCode &&
      assignment.type ===
        "MANAGER" &&
      assignmentMatchesUser(
        user,
        assignment
      )
  )
}


// ======================================================
// CONFIRMAR RESOLUCIÓN
// ======================================================

export function canConfirmResolution(
  user: UserScope,
  request: RequestItem
): boolean {
  if (!user.active) {
    return false
  }


  // Solicitante
  if (
    request.requesterEmail ===
    user.email
  ) {
    return true
  }


  // Jefatura de su local
  if (
    user.role ===
      "JEFATURA_LOCAL" &&
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
  const canView =
    canViewRequest(
      user,
      request,
      assignments
    )

  const canApprove =
    canApproveRequest(
      user,
      request,
      assignments
    )

  const canManage =
    canManageRequest(
      user,
      request,
      assignments
    )

  const canConfirm =
    canConfirmResolution(
      user,
      request
    )


  return {
    canView,
    canApprove,
    canManage,

    canConfirmResolution:
      canConfirm,

    canRequestInformation:
      canApprove,

    canReject:
      canApprove,

    canApproveWithAdjustment:
      canApprove,
  }
}


// ======================================================
// ACCESO A BANDEJA DE APROBACIONES
// ======================================================

export function canAccessApprovalInbox(
  user: UserScope,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) {
    return false
  }

  return assignments.some(
    (assignment) =>
      assignment.active &&
      assignment.type ===
        "APPROVER" &&
      assignmentMatchesUser(
        user,
        assignment
      )
  )
}


// ======================================================
// VISIBILIDAD DETALLE LOCAL
// ======================================================

export function canViewLocalDetail(
  user: UserScope,
  local: string
): boolean {
  if (!user.active) {
    return false
  }

  if (
    user.role ===
      "GERENCIA_VENTAS" ||
    user.role ===
      "GERENCIA_GENERAL"
  ) {
    return true
  }

  if (
    user.role === "VENDEDOR" ||
    user.role ===
      "JEFATURA_LOCAL"
  ) {
    return (
      user.local === local
    )
  }

  // Marca y zonal se completarán
  // cuando configuremos sus ámbitos.
  return false
}
