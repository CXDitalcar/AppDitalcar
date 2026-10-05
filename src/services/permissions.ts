import { assignmentMatchesUser } from "./requestCatalog"
import type {
  ProcessAssignment,
  RequestItem,
  RequestPermissions,
  UserScope,
} from "../types"
import { hasExperienceAccess } from "./experienceAccess"

const broadVisibilityRoles: UserScope["role"][] = [
  "GERENCIA_VENTAS",
  "GERENCIA_COMERCIAL",
  "GERENCIA_ADMINISTRACION",
  "JEFATURA_COMERCIAL_CLIENTES",
  "EXPERIENCIA_CLIENTES", "PROJECT_MANAGER",
]

function normalized(value?: string) {
  return value?.trim().toLowerCase() ?? ""
}

function userHasLocal(user: UserScope, local: string) {
  const target = normalized(local)
  const locals = [
    user.local,
    user.localPrincipal,
    ...(user.assignedLocals ?? []),
  ]
    .filter(Boolean)
    .map((value) => normalized(value))

  return locals.includes(target)
}

function isGeelyLocal(local: string) {
  return normalized(local).includes("geely")
}

function isStellantisLocal(local: string) {
  return normalized(local).includes("stellantis")
}

function isExactCurrentResponsible(
  user: UserScope,
  request: RequestItem
) {
  return Boolean(
    request.currentResponsibleEmail &&
      normalized(request.currentResponsibleEmail) ===
        normalized(user.email)
  )
}

export function canViewRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active || user.role === "GERENCIA_GENERAL") return false

  if (normalized(request.requesterEmail) === normalized(user.email)) {
    return true
  }

  if (user.role === "JEFATURA_LOCAL" && userHasLocal(user, request.local)) {
    return true
  }

  if (isExactCurrentResponsible(user, request)) {
    return true
  }

  if (broadVisibilityRoles.includes(user.role)) {
    return true
  }

  if (user.role === "GERENCIA_MARCA") {
    // La Gerencia de Marca ve los locales asignados a su perfil.
    // Si aún no se cargaron, usamos marcas explícitas solo como respaldo
    // cuando el nombre del local contiene la marca.
    if (userHasLocal(user, request.local)) return true
    return Boolean(
      user.brands?.some((brand) =>
        normalized(request.local).includes(normalized(brand))
      )
    )
  }

  if (user.role === "JEFATURA_MARCA") {
    return isGeelyLocal(request.local)
  }

  if (user.role === "JEFATURA_ZONAL") {
    return !isGeelyLocal(request.local) && !isStellantisLocal(request.local)
  }

  return assignments.some(
    (assignment) =>
      assignment.processCode === request.processCode &&
      assignmentMatchesUser(user, assignment)
  )
}

export function canApproveRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (
    !user.active ||
    user.role === "GERENCIA_GENERAL" ||
    request.status !== "PENDIENTE_APROBACION"
  ) {
    return false
  }

  if (normalized(request.requesterEmail) === normalized(user.email)) {
    return false
  }

  if (request.approvalContext === "JEFATURA_LOCAL") {
    if (isExactCurrentResponsible(user, request)) {
      return [
        "JEFATURA_LOCAL",
        "JEFATURA_MARCA",
        "JEFATURA_ZONAL",
        "GERENCIA_MARCA",
      ].includes(user.role)
    }

    // Compatibilidad demo y futuro perfil multilocal.
    return (
      user.role === "JEFATURA_LOCAL" && userHasLocal(user, request.local)
    )
  }

  if (request.approvalContext === "PRESUPUESTO_COMERCIAL") {
    return user.role === "GERENCIA_COMERCIAL"
  }

  return assignments.some(
    (assignment) =>
      assignment.processCode === request.processCode &&
      assignment.type === "APPROVER" &&
      assignmentMatchesUser(user, assignment)
  )
}

export function canManageRequest(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active || user.role === "GERENCIA_GENERAL") return false

  return assignments.some(
    (assignment) =>
      assignment.processCode === request.processCode &&
      assignment.type === "MANAGER" &&
      assignmentMatchesUser(user, assignment)
  )
}

export function canConfirmResolution(
  user: UserScope,
  request: RequestItem
): boolean {
  if (!user.active || user.role === "GERENCIA_GENERAL") return false

  if (normalized(request.requesterEmail) === normalized(user.email)) {
    return true
  }

  return user.role === "JEFATURA_LOCAL" && userHasLocal(user, request.local)
}

export function getRequestPermissions(
  user: UserScope,
  request: RequestItem,
  assignments: ProcessAssignment[]
): RequestPermissions {
  const canView = canViewRequest(user, request, assignments)
  const canApprove = canApproveRequest(user, request, assignments)
  const canManage = canManageRequest(user, request, assignments)
  const canConfirm = canConfirmResolution(user, request)

  return {
    canView,
    canApprove,
    canManage,
    canConfirmResolution: canConfirm,
    canRequestInformation: canApprove || canManage,
    canReject: canApprove,
    canApproveWithAdjustment: canApprove,
  }
}

export function canAccessApprovalInbox(
  user: UserScope,
  assignments: ProcessAssignment[]
): boolean {
  if (!user.active || user.role === "GERENCIA_GENERAL") return false

  if (
    [
      "JEFATURA_LOCAL",
      "JEFATURA_MARCA",
      "JEFATURA_ZONAL",
      "GERENCIA_MARCA",
      "GERENCIA_COMERCIAL",
    ].includes(user.role)
  ) {
    return true
  }

  return assignments.some(
    (assignment) =>
      assignment.active &&
      (assignment.type === "APPROVER" || assignment.type === "MANAGER") &&
      assignmentMatchesUser(user, assignment)
  )
}

export function canViewLocalDetail(user: UserScope, local: string): boolean {
  if (!user.active || user.role === "GERENCIA_GENERAL") return false

  if (
    user.role === "GERENCIA_VENTAS" ||
    user.role === "GERENCIA_COMERCIAL" ||
    user.role === "JEFATURA_COMERCIAL_CLIENTES" ||
    hasExperienceAccess(user)
  ) {
    return true
  }

  if (user.role === "VENDEDOR" || user.role === "JEFATURA_LOCAL") {
    return userHasLocal(user, local)
  }

  if (user.role === "GERENCIA_MARCA") {
    if (userHasLocal(user, local)) return true
    return Boolean(
      user.brands?.some((brand) => normalized(local).includes(normalized(brand)))
    )
  }

  if (user.role === "JEFATURA_MARCA") return isGeelyLocal(local)

  if (user.role === "JEFATURA_ZONAL") {
    return !isGeelyLocal(local) && !isStellantisLocal(local)
  }

  return false
}
