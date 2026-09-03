import {
  mockProcessAssignments,
  mockProcesses,
  mockUsers,
} from "../data/mockData"

import type {
  ProcessAssignment,
  RequestItem,
  UserScope,
} from "../types"


const LOCAL_APPROVAL_HOURS =
  24


const MANAGER_ACCEPTANCE_HOURS =
  24


// ======================================================
// PERSONA ASIGNADA
// ======================================================

function assignmentPerson(
  assignment?:
    ProcessAssignment
) {
  if (!assignment) {
    return {
      email:
        undefined,

      name:
        "Por asignar",
    }
  }


  if (
    assignment.email
  ) {
    const user =
      mockUsers.find(
        (item) =>
          item.email.toLowerCase() ===
          assignment.email?.toLowerCase()
      )


    return {
      email:
        assignment.email,

      name:
        user?.name ??
        assignment.email,
    }
  }


  if (
    assignment.role
  ) {
    const user =
      mockUsers.find(
        (item) =>
          item.role ===
          assignment.role
      )


    return {
      email:
        user?.email,

      name:
        user?.name ??
        "Responsable del proceso",
    }
  }


  return {
    email:
      undefined,

    name:
      "Por asignar",
  }
}


// ======================================================
// APROBADOR DEL PROCESO
// ======================================================

export function getProcessApprover(
  processCode: string
) {
  return mockProcessAssignments.find(
    (assignment) =>
      assignment.active &&
      assignment.processCode ===
        processCode &&
      assignment.type ===
        "APPROVER"
  )
}


// ======================================================
// GESTOR DEL PROCESO
// ======================================================

export function getProcessManager(
  processCode: string
) {
  return mockProcessAssignments.find(
    (assignment) =>
      assignment.active &&
      assignment.processCode ===
        processCode &&
      assignment.type ===
        "MANAGER"
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
  const process =
    mockProcesses.find(
      (item) =>
        item.code ===
        processCode
    )


  // ----------------------------------------------------
  // SI NO CREA JEFATURA LOCAL:
  // PRIMERO REVISIÓN LOCAL
  // ----------------------------------------------------

  if (
    user.role !==
      "JEFATURA_LOCAL" &&
    local
  ) {
    const localHead =
      mockUsers.find(
        (item) =>
          item.role ===
            "JEFATURA_LOCAL" &&
          item.local ===
            local
      )


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
        localHead?.email,

      currentResponsibleName:
        localHead?.name ??
        "Jefatura Local",
    }
  }


  // ----------------------------------------------------
  // APROBACIÓN ESPECÍFICA DEL PROCESO
  // ----------------------------------------------------

  const approver =
    getProcessApprover(
      processCode
    )


  if (
    approver ||
    process?.requiresApproval
  ) {
    const person =
      assignmentPerson(
        approver
      )


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


  // ----------------------------------------------------
  // INGRESA DIRECTAMENTE AL ÁREA
  // ----------------------------------------------------

  const manager =
    assignmentPerson(
      getProcessManager(
        processCode
      )
    )


  return {
    status:
      "RECIBIDA" as const,

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
// DESPUÉS DE APROBAR
// ======================================================

export function routeAfterApproval(
  request: RequestItem
) {
  // ----------------------------------------------------
  // APROBACIÓN DE PRESUPUESTO
  // VUELVE AL GESTOR ORIGINAL
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
        ) +
        pausedMinutes,

      slaPausedReason:
        undefined,
    }
  }


  // ----------------------------------------------------
  // DESPUÉS DE REVISIÓN LOCAL
  // ----------------------------------------------------

  if (
    request.approvalContext ===
    "JEFATURA_LOCAL"
  ) {
    const processApprover =
      getProcessApprover(
        request.processCode
      )


    if (
      processApprover
    ) {
      const person =
        assignmentPerson(
          processApprover
        )


      const process =
        mockProcesses.find(
          (item) =>
            item.code ===
            request.processCode
        )


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
  }


  // ----------------------------------------------------
  // PASA AL ÁREA RESPONSABLE
  // ----------------------------------------------------

  const manager =
    assignmentPerson(
      getProcessManager(
        request.processCode
      )
    )


  return {
    status:
      "RECIBIDA" as const,

    approvalContext:
      undefined,

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
// SOLICITAR APROBACIÓN ADICIONAL
// ======================================================

export function budgetApprovalRouting(
  request: RequestItem
) {
  const approver =
    mockUsers.find(
      (item) =>
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
