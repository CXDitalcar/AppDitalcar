import { mockUsers } from "../data/mockData"
import {
  getAssignmentVisibleLabel,
  getKnownPersonName,
  getPrimaryAssignment,
  getRequestProcess,
  isDemoUser,
} from "./requestCatalog"
import type {
  ProcessAssignment,
  RequestItem,
  UserRole,
  UserScope,
} from "../types"

const LOCAL_APPROVAL_HOURS = 24
const MANAGER_ACCEPTANCE_HOURS = 24

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    VENDEDOR: "Vendedor",
    JEFATURA_LOCAL: "Jefatura de Sucursal",
    JEFATURA_MARCA: "Jefatura de Marca",
    JEFATURA_ZONAL: "Gerencia de Marca",
    GERENCIA_MARCA: "Gerencia de Marca",
    GERENCIA_VENTAS: "Gerencia de Ventas",
    JEFATURA_COMERCIAL_CLIENTES: "Jefatura Comercial y Clientes",
    JEFATURA_OPERACIONES_COMERCIALES: "Jefatura Operaciones Comerciales",
    JEFATURA_ADMINISTRACION: "Jefatura Administración",
    GERENCIA_ADMINISTRACION: "Gerencia Administración",
    GERENCIA_COMERCIAL: "Gerencia Comercial",
    JEFATURA_MARKETING: "Equipo de Marketing",
    EXPERIENCIA_CLIENTES: "Experiencia de Clientes",
    ADMINISTRATIVO: "Administración",
    EQUIPO_COMERCIAL: "Equipo Comercial",
    GERENCIA_GENERAL: "Gerencia General",
  }

  return labels[role]
}

function assignmentPerson(assignment?: ProcessAssignment) {
  if (!assignment) {
    return {
      email: undefined,
      name: "Por asignar",
      label: "Por asignar",
    }
  }

  const label = getAssignmentVisibleLabel(assignment)

  if (assignment.email) {
    return {
      email: assignment.email,
      name:
        getKnownPersonName(assignment.email) ??
        label,
      label,
    }
  }

  return {
    email: undefined,
    name: assignment.role
      ? roleLabel(assignment.role)
      : label,
    label,
  }
}

function assignmentWouldSelfApprove(
  user: UserScope,
  assignment?: ProcessAssignment
) {
  if (!assignment) return false

  if (
    assignment.email &&
    assignment.email.toLowerCase() === user.email.toLowerCase()
  ) {
    return true
  }

  if (
    !assignment.email &&
    assignment.role === user.role
  ) {
    return true
  }

  // En demo permitimos simular el cargo, pero tampoco debe
  // generarse una autoaprobación del mismo perfil demo.
  if (
    isDemoUser(user) &&
    assignment.role === user.role
  ) {
    return true
  }

  return false
}

export function requiresLocalReview(
  user: UserScope,
  processCode: string
) {
  const process = getRequestProcess(processCode)
  if (!process) return user.role === "VENDEDOR"

  if (process.localReviewRule === "NUNCA") return false
  if (process.localReviewRule === "SOLO_VENDEDOR") {
    return user.role === "VENDEDOR"
  }

  // SIEMPRE no obliga a una persona a aprobarse a sí misma.
  if (user.role === "JEFATURA_LOCAL") return false

  return true
}

function getSellerLocalReviewer(local: string) {
  const normalizedLocal = local.trim().toLowerCase()

  const localHead = mockUsers.find(
    (item) =>
      item.active &&
      item.role === "JEFATURA_LOCAL" &&
      item.local?.trim().toLowerCase() === normalizedLocal
  )

  if (localHead) {
    return {
      email: localHead.email,
      name: localHead.name,
      label: "Jefatura de Sucursal",
    }
  }

  // Nueva estructura comercial: Gerencia de Marca es el respaldo
  // de Jefatura Local. Durante la migración conservamos compatibilidad
  // con los antiguos perfiles de Jefatura de Marca / Zonal.
  const brandManager = mockUsers.find(
    (item) =>
      item.active &&
      item.role === "GERENCIA_MARCA" &&
      (
        item.assignedLocals?.some(
          (assigned) => assigned.trim().toLowerCase() === normalizedLocal
        ) ||
        item.local?.trim().toLowerCase() === normalizedLocal
      )
  )

  if (brandManager) {
    return {
      email: brandManager.email,
      name: brandManager.name,
      label: "Gerencia de Marca",
    }
  }

  if (normalizedLocal.includes("geely")) {
    const legacyBrandHead = mockUsers.find(
      (item) => item.active && item.role === "JEFATURA_MARCA"
    )

    if (legacyBrandHead) {
      return {
        email: legacyBrandHead.email,
        name: legacyBrandHead.name,
        label: "Gerencia de Marca",
      }
    }
  }

  const legacyZoneHead = mockUsers.find(
    (item) => item.active && item.role === "JEFATURA_ZONAL"
  )

  if (legacyZoneHead) {
    return {
      email: legacyZoneHead.email,
      name: legacyZoneHead.name,
      label: "Gerencia de Marca",
    }
  }

  return {
    email: undefined,
    name: "Jefatura correspondiente",
    label: "Jefatura correspondiente",
  }
}

function routeToManager(processCode: string) {
  const manager = assignmentPerson(
    getPrimaryAssignment(processCode, "MANAGER")
  )

  return {
    status: "RECIBIDA" as const,
    approvalContext: undefined,
    acceptanceSLAHours: MANAGER_ACCEPTANCE_HOURS,
    acceptanceSLAStartedAt: new Date().toISOString(),
    currentResponsibleEmail: manager.email,
    currentResponsibleName: manager.name,
    currentResponsibleLabel: manager.label,
  }
}

function routeToProcessApproval(
  user: UserScope,
  processCode: string
) {
  const approver = getPrimaryAssignment(processCode, "APPROVER")

  if (!approver || (approver.condition && approver.condition !== "SIEMPRE")) {
    return routeToManager(processCode)
  }

  if (assignmentWouldSelfApprove(user, approver)) {
    return routeToManager(processCode)
  }

  const person = assignmentPerson(approver)

  return {
    status: "PENDIENTE_APROBACION" as const,
    approvalContext: "PROCESO" as const,
    approvalSLAStartedAt: new Date().toISOString(),
    currentResponsibleEmail: person.email,
    currentResponsibleName: person.name,
    currentResponsibleLabel: person.label,
  }
}

export function initialRequestRouting(
  user: UserScope,
  processCode: string,
  local: string
) {
  if (local && requiresLocalReview(user, processCode)) {
    const reviewer = getSellerLocalReviewer(local)

    // Protección adicional: nadie se envía una aprobación a sí mismo.
    if (
      reviewer.email &&
      reviewer.email.toLowerCase() === user.email.toLowerCase()
    ) {
      return routeToProcessApproval(user, processCode)
    }

    return {
      status: "PENDIENTE_APROBACION" as const,
      approvalContext: "JEFATURA_LOCAL" as const,
      approvalSLAHours: LOCAL_APPROVAL_HOURS,
      approvalSLAStartedAt: new Date().toISOString(),
      currentResponsibleEmail: reviewer.email,
      currentResponsibleName: reviewer.name,
      currentResponsibleLabel: reviewer.label,
    }
  }

  return routeToProcessApproval(user, processCode)
}

export function routeAfterApproval(request: RequestItem) {
  if (request.approvalContext === "PRESUPUESTO_COMERCIAL") {
    const pausedMinutes = request.resolutionSLAPausedAt
      ? Math.max(
          0,
          Math.round(
            (Date.now() -
              new Date(request.resolutionSLAPausedAt).getTime()) /
              60000
          )
        )
      : 0

    return {
      status: "EN_GESTION" as const,
      approvalContext: undefined,
      currentResponsibleEmail: request.managementOwnerEmail,
      currentResponsibleName:
        request.managementOwnerName ?? "Responsable de gestión",
      currentResponsibleLabel:
        request.managementOwnerLabel ?? "Responsable de gestión",
      resolutionSLAPausedAt: undefined,
      resolutionSLAPausedMinutes:
        (request.resolutionSLAPausedMinutes ?? 0) + pausedMinutes,
      slaPausedReason: undefined,
    }
  }

  if (request.approvalContext === "JEFATURA_LOCAL") {
    const requester: UserScope = {
      email: request.requesterEmail,
      name: request.requesterName,
      role: request.requesterRole ?? "VENDEDOR",
      local: request.local,
      active: true,
    }

    return routeToProcessApproval(requester, request.processCode)
  }

  return routeToManager(request.processCode)
}

export function budgetApprovalRouting(request: RequestItem) {
  const approver = mockUsers.find(
    (item) => item.active && item.role === "GERENCIA_COMERCIAL"
  )

  return {
    status: "PENDIENTE_APROBACION" as const,
    approvalContext: "PRESUPUESTO_COMERCIAL" as const,
    currentResponsibleEmail: approver?.email,
    currentResponsibleName: approver?.name ?? "Gerencia Comercial",
    currentResponsibleLabel: "Gerencia Comercial",
    managementOwnerEmail:
      request.managementOwnerEmail ?? request.currentResponsibleEmail,
    managementOwnerName:
      request.managementOwnerName ?? request.currentResponsibleName,
    managementOwnerLabel:
      request.managementOwnerLabel ?? request.currentResponsibleLabel,
    resolutionSLAPausedAt:
      request.resolutionSLAPausedAt ?? new Date().toISOString(),
    slaPausedReason: "Esperando aprobación",
  }
}
