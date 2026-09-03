import {
  mockProcessAssignments,
  mockProcesses,
  mockUsers,
} from "../data/mockData"

import type {
  ProcessAssignment,
  RequestItem,
  UserRole,
  UserScope,
} from "../types"


// ======================================================
// CONFIGURACIÓN DEL MOTOR DE APROBACIONES
// ======================================================

const LOCAL_APPROVAL_HOURS = 24
const MANAGER_ACCEPTANCE_HOURS = 24

// Credencial y Pie de firma NO requieren revisión local,
// incluso cuando las crea un vendedor.
// Más adelante esta regla puede venir desde 09_Procesos.
const LOCAL_REVIEW_EXEMPT_PROCESSES = new Set([
  "COL-CRE-01",
  "COL-FIR-01",
])


// ======================================================
// ETIQUETAS DE CARGO
// ======================================================

export function roleLabel(role: UserRole) {
  const labels: Record<UserRole, string> = {
    VENDEDOR: "Vendedor",
    JEFATURA_LOCAL: "Jefatura Local",
    JEFATURA_MARCA: "Jefatura de Marca",
    JEFATURA_ZONAL: "Jefatura Zonal",
    GERENCIA_VENTAS: "Gerencia de Ventas",
    JEFATURA_COMERCIAL_CLIENTES: "Jefatura Comercial y Clientes",
    JEFATURA_OPERACIONES_COMERCIALES: "Jefatura Operaciones Comerciales",
    JEFATURA_ADMINISTRACION: "Jefatura Administración",
    GERENCIA_ADMINISTRACION: "Gerencia Administración",
    GERENCIA_COMERCIAL: "Gerencia Comercial",
    JEFATURA_MARKETING: "Jefatura Marketing",
    EXPERIENCIA_CLIENTES: "Experiencia de Clientes",
    ADMINISTRATIVO: "Administración",
    EQUIPO_COMERCIAL: "Equipo Comercial",
    GERENCIA_GENERAL: "Gerencia General",
  }

  return labels[role]
}


// ======================================================
// 11_ASIGNACIONESPROCESO · CAPA DE CONFIGURACIÓN
//
// Hoy lee mockProcessAssignments para el demo.
// Cuando Microsoft quede habilitado, esta misma capa
// podrá recibir los registros reales de la List 11.
// ======================================================

export function getProcessAssignments(
  processCode: string
) {
  return mockProcessAssignments.filter(
    (assignment) =>
      assignment.active &&
      assignment.processCode === processCode
  )
}


export function getProcessApprover(
  processCode: string
) {
  return getProcessAssignments(processCode).find(
    (assignment) =>
      assignment.type === "APPROVER"
  )
}


export function getProcessManager(
  processCode: string
) {
  return getProcessAssignments(processCode).find(
    (assignment) =>
      assignment.type === "MANAGER"
  )
}


// ======================================================
// RESOLVER ASIGNACIÓN
//
// Si la asignación es por rol, antes de que alguien
// "tome" la solicitud mostramos el CARGO, no una persona.
// Si la asignación es por email, sí existe un responsable
// individual desde el inicio.
// ======================================================

function assignmentPerson(
  assignment?: ProcessAssignment
) {
  if (!assignment) {
    return {
      email: undefined,
      name: "Por asignar",
    }
  }

  if (assignment.email) {
    const user = mockUsers.find(
      (item) =>
        item.email.toLowerCase() ===
        assignment.email?.toLowerCase()
    )

    return {
      email: assignment.email,
      name: user?.name ?? assignment.email,
    }
  }

  if (assignment.role) {
    return {
      email: undefined,
      name: roleLabel(assignment.role),
    }
  }

  return {
    email: undefined,
    name: "Por asignar",
  }
}


function assignmentWouldSelfApprove(
  user: UserScope,
  assignment?: ProcessAssignment
) {
  if (!assignment) return false

  if (
    assignment.email &&
    assignment.email.toLowerCase() ===
      user.email.toLowerCase()
  ) {
    return true
  }

  return Boolean(
    assignment.role &&
    assignment.role === user.role
  )
}


// ======================================================
// ¿REQUIERE REVISIÓN LOCAL?
//
// Regla acordada por ahora:
// - Solo las solicitudes creadas por VENDEDORES pueden
//   requerir revisión local.
// - Credencial y Pie de firma nunca la requieren.
// - Jefaturas, roles multilocal/marca/red y gerencias
//   no vuelven hacia atrás a una revisión local.
// ======================================================

export function requiresLocalReview(
  user: UserScope,
  processCode: string
) {
  if (user.role !== "VENDEDOR") {
    return false
  }

  return !LOCAL_REVIEW_EXEMPT_PROCESSES.has(
    processCode
  )
}


// ======================================================
// APROBADOR DE VENDEDOR CUANDO REQUIERE REVISIÓN LOCAL
//
// 1. Jefatura Local del local.
// 2. Si no existe y es Geely -> Jefatura de Marca.
// 3. Si no existe -> Jefatura Zonal.
//
// Por ahora esta regla alternativa se aplica SOLO a
// solicitudes de vendedores, tal como acordamos.
// ======================================================

function getSellerLocalReviewer(
  local: string
) {
  const normalizedLocal =
    local.trim().toLowerCase()

  const localHead = mockUsers.find(
    (item) =>
      item.active &&
      item.role === "JEFATURA_LOCAL" &&
      item.local?.trim().toLowerCase() ===
        normalizedLocal
  )

  if (localHead) {
    return {
      email: localHead.email,
      name: localHead.name,
      role: localHead.role,
    }
  }

  const isGeely =
    normalizedLocal.includes("geely")

  if (isGeely) {
    const brandHead = mockUsers.find(
      (item) =>
        item.active &&
        item.role === "JEFATURA_MARCA"
    )

    if (brandHead) {
      return {
        email: brandHead.email,
        name: brandHead.name,
        role: brandHead.role,
      }
    }
  }

  const zoneHead = mockUsers.find(
    (item) =>
      item.active &&
      item.role === "JEFATURA_ZONAL"
  )

  if (zoneHead) {
    return {
      email: zoneHead.email,
      name: zoneHead.name,
      role: zoneHead.role,
    }
  }

  return {
    email: undefined,
    name: "Jefatura correspondiente",
    role: undefined,
  }
}


// ======================================================
// ENVIAR AL GESTOR DEL PROCESO
// ======================================================

function routeToManager(
  processCode: string
) {
  const manager = assignmentPerson(
    getProcessManager(processCode)
  )

  return {
    status: "RECIBIDA" as const,
    approvalContext: undefined,
    acceptanceSLAHours:
      MANAGER_ACCEPTANCE_HOURS,
    acceptanceSLAStartedAt:
      new Date().toISOString(),
    currentResponsibleEmail:
      manager.email,
    currentResponsibleName:
      manager.name,
  }
}


// ======================================================
// ENVIAR A APROBACIÓN DEL PROCESO
// ======================================================

function routeToProcessApproval(
  user: UserScope,
  processCode: string
) {
  const process = mockProcesses.find(
    (item) =>
      item.code === processCode
  )

  const approver =
    getProcessApprover(processCode)

  // Nadie debe aprobarse a sí mismo.
  if (
    approver &&
    assignmentWouldSelfApprove(
      user,
      approver
    )
  ) {
    return routeToManager(
      processCode
    )
  }

  if (
    approver ||
    process?.requiresApproval
  ) {
    const person =
      assignmentPerson(approver)

    return {
      status:
        "PENDIENTE_APROBACION" as const,
      approvalContext:
        "PROCESO" as const,
      approvalSLAHours:
        process?.approvalSLAHours,
      approvalSLAStartedAt:
        new Date().toISOString(),
      currentResponsibleEmail:
        person.email,
      currentResponsibleName:
        person.name,
    }
  }

  return routeToManager(
    processCode
  )
}


// ======================================================
// RUTA INICIAL
// ======================================================

export function initialRequestRouting(
  user: UserScope,
  processCode: string,
  local: string
) {
  // ----------------------------------------------------
  // VENDEDOR + PROCESO CON REVISIÓN LOCAL
  // ----------------------------------------------------

  if (
    local &&
    requiresLocalReview(
      user,
      processCode
    )
  ) {
    const reviewer =
      getSellerLocalReviewer(local)

    return {
      status:
        "PENDIENTE_APROBACION" as const,
      approvalContext:
        "JEFATURA_LOCAL" as const,
      approvalSLAHours:
        LOCAL_APPROVAL_HOURS,
      approvalSLAStartedAt:
        new Date().toISOString(),
      currentResponsibleEmail:
        reviewer.email,
      currentResponsibleName:
        reviewer.name,
    }
  }

  // ----------------------------------------------------
  // SIN REVISIÓN LOCAL
  // Credencial/Pie de firma y cualquier cargo superior
  // ----------------------------------------------------

  return routeToProcessApproval(
    user,
    processCode
  )
}


// ======================================================
// DESPUÉS DE UNA APROBACIÓN
// ======================================================

export function routeAfterApproval(
  request: RequestItem
) {
  // ----------------------------------------------------
  // APROBACIÓN ADICIONAL / PRESUPUESTO
  // vuelve al gestor que ya tenía la solicitud.
  // ----------------------------------------------------

  if (
    request.approvalContext ===
    "PRESUPUESTO_COMERCIAL"
  ) {
    const pausedMinutes =
      request.resolutionSLAPausedAt
        ? Math.max(
            0,
            Math.round(
              (
                Date.now() -
                new Date(
                  request.resolutionSLAPausedAt
                ).getTime()
              ) /
                60000
            )
          )
        : 0

    return {
      status:
        "EN_GESTION" as const,
      approvalContext:
        undefined,
      currentResponsibleEmail:
        request.managementOwnerEmail,
      currentResponsibleName:
        request.managementOwnerName ??
        "Responsable de gestión",
      resolutionSLAPausedAt:
        undefined,
      resolutionSLAPausedMinutes:
        (
          request.resolutionSLAPausedMinutes ??
          0
        ) + pausedMinutes,
      slaPausedReason:
        undefined,
    }
  }

  // ----------------------------------------------------
  // DESPUÉS DE REVISIÓN LOCAL DE VENDEDOR:
  // si el proceso tiene aprobación propia, va a ella.
  // ----------------------------------------------------

  if (
    request.approvalContext ===
    "JEFATURA_LOCAL"
  ) {
    const requester: UserScope = {
      email: request.requesterEmail,
      name: request.requesterName,
      role:
        request.requesterRole ??
        "VENDEDOR",
      local: request.local,
      active: true,
    }

    return routeToProcessApproval(
      requester,
      request.processCode
    )
  }

  // ----------------------------------------------------
  // DESPUÉS DE APROBACIÓN PROPIA DEL PROCESO:
  // llega al área gestora.
  // ----------------------------------------------------

  return routeToManager(
    request.processCode
  )
}


// ======================================================
// SOLICITAR APROBACIÓN ADICIONAL EN GESTIÓN
// ======================================================

export function budgetApprovalRouting(
  request: RequestItem
) {
  const approver = mockUsers.find(
    (item) =>
      item.active &&
      item.role ===
        "GERENCIA_COMERCIAL"
  )

  return {
    status:
      "PENDIENTE_APROBACION" as const,
    approvalContext:
      "PRESUPUESTO_COMERCIAL" as const,
    currentResponsibleEmail:
      approver?.email,
    currentResponsibleName:
      approver?.name ??
      "Gerencia Comercial",
    managementOwnerEmail:
      request.managementOwnerEmail ??
      request.currentResponsibleEmail,
    managementOwnerName:
      request.managementOwnerName ??
      request.currentResponsibleName,
    resolutionSLAPausedAt:
      request.resolutionSLAPausedAt ??
      new Date().toISOString(),
    slaPausedReason:
      "Esperando aprobación",
  }
}
