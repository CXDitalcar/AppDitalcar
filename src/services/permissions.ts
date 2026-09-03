import type {
  ProcessAssignment,
  RequestItem,
  RequestPermissions,
  UserScope,
} from "../types"


// ======================================================
// VISIBILIDAD AMPLIA
// Gerencia General queda fuera del módulo de solicitudes.
// ======================================================

const broadVisibilityRoles: UserScope["role"][] = [
  "GERENCIA_VENTAS",
  "GERENCIA_COMERCIAL",
  "GERENCIA_ADMINISTRACION",
  "JEFATURA_COMERCIAL_CLIENTES",
  "EXPERIENCIA_CLIENTES",
]


function assignmentMatchesUser(
  user: UserScope,
  assignment: ProcessAssignment
): boolean {
  if (!assignment.active) {
    return false
  }

  if (
    assignment.email &&
    assignment.email.toLowerCase() ===
      user.email.toLowerCase()
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


function isGeelyLocal(local: string) {
  return local
    .toLowerCase()
    .includes("geely")
}


function isStellantisLocal(local: string) {
  return local
    .toLowerCase()
    .includes("stellantis")
}


function isExactCurrentResponsible(
  user: UserScope,
  request: RequestItem
) {
  return Boolean(
    request.currentResponsibleEmail &&
    request.currentResponsibleEmail.toLowerCase() ===
      user.email.toLowerCase()
  )
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

  // Fuera del flujo de solicitudes.
  if (
    user.role ===
    "GERENCIA_GENERAL"
  ) {
    return false
  }

  if (
    request.requesterEmail.toLowerCase() ===
    user.email.toLowerCase()
  ) {
    return true
  }

  if (
    user.role ===
      "JEFATURA_LOCAL" &&
    user.local ===
      request.local
  ) {
    return true
  }

  if (
    isExactCurrentResponsible(
      user,
      request
    )
  ) {
    return true
  }

  if (
    broadVisibilityRoles.includes(
      user.role
    )
  ) {
    return true
  }

  if (
    user.role ===
    "JEFATURA_MARCA"
  ) {
    return isGeelyLocal(
      request.local
    )
  }

  if (
    user.role ===
    "JEFATURA_ZONAL"
  ) {
    return (
      !isGeelyLocal(
        request.local
      ) &&
      !isStellantisLocal(
        request.local
      )
    )
  }

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
// APROBAR
// ======================================================

export function canApproveRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (
    !user.active ||
    request.status !==
      "PENDIENTE_APROBACION"
  ) {
    return false
  }

  if (
    user.role ===
    "GERENCIA_GENERAL"
  ) {
    return false
  }

  // Seguridad adicional: nadie se aprueba a sí mismo.
  if (
    request.requesterEmail.toLowerCase() ===
    user.email.toLowerCase()
  ) {
    return false
  }

  // ----------------------------------------------------
  // REVISIÓN LOCAL / FALLBACK DE VENDEDOR
  // El workflow deja el email del aprobador exacto.
  // Puede ser Jefatura Local, Marca o Zonal.
  // ----------------------------------------------------

  if (
    request.approvalContext ===
    "JEFATURA_LOCAL"
  ) {
    if (
      isExactCurrentResponsible(
        user,
        request
      )
    ) {
      return [
        "JEFATURA_LOCAL",
        "JEFATURA_MARCA",
        "JEFATURA_ZONAL",
      ].includes(
        user.role
      )
    }

    // Compatibilidad con solicitudes demo antiguas.
    return (
      user.role ===
        "JEFATURA_LOCAL" &&
      Boolean(user.local) &&
      user.local ===
        request.local
    )
  }

  // ----------------------------------------------------
  // APROBACIÓN ADICIONAL DE PRESUPUESTO
  // ----------------------------------------------------

  if (
    request.approvalContext ===
    "PRESUPUESTO_COMERCIAL"
  ) {
    return (
      user.role ===
      "GERENCIA_COMERCIAL"
    )
  }

  // ----------------------------------------------------
  // APROBACIÓN CONFIGURADA POR PROCESO
  // Fuente actual: mock equivalente a 11_AsignacionesProceso.
  // ----------------------------------------------------

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
// GESTIONAR
// ======================================================

export function canManageRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) {
    return false
  }

  if (
    user.role ===
    "GERENCIA_GENERAL"
  ) {
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

  if (
    user.role ===
    "GERENCIA_GENERAL"
  ) {
    return false
  }

  if (
    request.requesterEmail.toLowerCase() ===
    user.email.toLowerCase()
  ) {
    return true
  }

  return (
    user.role ===
      "JEFATURA_LOCAL" &&
    Boolean(user.local) &&
    user.local ===
      request.local
  )
}


// ======================================================
// PERMISOS CONSOLIDADOS
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
      canApprove ||
      canManage,
    canReject:
      canApprove,
    canApproveWithAdjustment:
      canApprove,
  }
}


// ======================================================
// ACCESO A BANDEJA
// ======================================================

export function canAccessApprovalInbox(
  user: UserScope,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active) {
    return false
  }

  if (
    user.role ===
    "GERENCIA_GENERAL"
  ) {
    return false
  }

  if (
    [
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
      "GERENCIA_COMERCIAL",
    ].includes(
      user.role
    )
  ) {
    return true
  }

  return assignments.some(
    (assignment) =>
      assignment.active &&
      (
        assignment.type ===
          "APPROVER" ||
        assignment.type ===
          "MANAGER"
      ) &&
      assignmentMatchesUser(
        user,
        assignment
      )
  )
}


// ======================================================
// DETALLE POR LOCAL
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
    "GERENCIA_GENERAL"
  ) {
    return false
  }

  if (
    user.role ===
      "GERENCIA_VENTAS" ||
    user.role ===
      "GERENCIA_COMERCIAL" ||
    user.role ===
      "JEFATURA_COMERCIAL_CLIENTES" ||
    user.role ===
      "EXPERIENCIA_CLIENTES"
  ) {
    return true
  }

  if (
    user.role ===
      "VENDEDOR" ||
    user.role ===
      "JEFATURA_LOCAL"
  ) {
    return (
      user.local ===
      local
    )
  }

  if (
    user.role ===
    "JEFATURA_MARCA"
  ) {
    return isGeelyLocal(
      local
    )
  }

  if (
    user.role ===
    "JEFATURA_ZONAL"
  ) {
    return (
      !isGeelyLocal(local) &&
      !isStellantisLocal(local)
    )
  }

  return false
}
