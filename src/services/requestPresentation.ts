import {
  mockUsers,
} from "../data/mockData"

import type {
  RequestItem,
  RequestStatus,
  UserRole,
  UserScope,
} from "../types"


// ======================================================
// ROLES QUE PUEDEN VER A LA PERSONA EXACTA
// QUE ESTÁ GESTIONANDO
// ======================================================

const exactManagerRoles:
  UserRole[] = [
    "JEFATURA_ADMINISTRACION",

    "JEFATURA_COMERCIAL_CLIENTES",
    "JEFATURA_OPERACIONES_COMERCIALES",
    "JEFATURA_MARKETING",

    "JEFATURA_ZONAL",
    "JEFATURA_MARCA",

    "GERENCIA_ADMINISTRACION",
    "GERENCIA_COMERCIAL",
    "GERENCIA_VENTAS",
  ]


// ======================================================
// NOMBRE VISIBLE DE CARGOS
// ======================================================

export function roleLabel(
  role?: UserRole
) {
  const labels:
    Partial<
      Record<
        UserRole,
        string
      >
    > = {
      VENDEDOR:
        "Vendedor",

      JEFATURA_LOCAL:
        "Jefatura Local",

      JEFATURA_MARCA:
        "Jefatura de Marca",

      JEFATURA_ZONAL:
        "Jefatura Zonal",

      GERENCIA_VENTAS:
        "Gerencia de Ventas",

      JEFATURA_COMERCIAL_CLIENTES:
        "Jefatura Comercial y Clientes",

      JEFATURA_OPERACIONES_COMERCIALES:
        "Jefatura Operaciones Comerciales",

      JEFATURA_ADMINISTRACION:
        "Jefatura Administración",

      GERENCIA_ADMINISTRACION:
        "Gerencia Administración",

      GERENCIA_COMERCIAL:
        "Gerencia Comercial",

      JEFATURA_MARKETING:
        "Jefatura Marketing",

      EXPERIENCIA_CLIENTES:
        "Experiencia de Clientes",

      ADMINISTRATIVO:
        "Administración",

      EQUIPO_COMERCIAL:
        "Equipo Comercial",
    }


  return role
    ? labels[role] ??
        "Responsable"
    : "Responsable"
}


// ======================================================
// PUEDE VER NOMBRE REAL DEL GESTOR
// ======================================================

export function canSeeExactManager(
  user: UserScope
) {
  return exactManagerRoles.includes(
    user.role
  )
}


// ======================================================
// BUSCAR ROL POR EMAIL
// ======================================================

function roleFromEmail(
  email?: string
) {
  if (!email) {
    return undefined
  }


  return mockUsers.find(
    (item) =>
      item.email.toLowerCase() ===
      email.toLowerCase()
  )?.role
}


// ======================================================
// RESPONSABLE VISIBLE SEGÚN PERFIL
// ======================================================

export function responsibleLabel(
  user: UserScope,
  request: RequestItem
) {
  // ----------------------------------------------------
  // JEFATURAS / GERENCIAS:
  // pueden ver persona exacta + cargo
  // ----------------------------------------------------

  if (
    canSeeExactManager(
      user
    ) &&
    request.currentResponsibleName
  ) {
    const role =
      roleFromEmail(
        request.currentResponsibleEmail
      )


    return role
      ? `${request.currentResponsibleName} · ${roleLabel(
          role
        )}`
      : request.currentResponsibleName
  }


  // ----------------------------------------------------
  // RESTO DE USUARIOS:
  // solo cargo / área
  // ----------------------------------------------------

  if (
    request.approvalContext ===
    "JEFATURA_LOCAL"
  ) {
    return "Jefatura Local"
  }


  if (
    request.approvalContext ===
    "PRESUPUESTO_COMERCIAL"
  ) {
    return "Gerencia Comercial"
  }


  const role =
    roleFromEmail(
      request.currentResponsibleEmail
    )


  if (role) {
    return roleLabel(
      role
    )
  }


  return (
    request.currentResponsibleName ??
    "Por asignar"
  )
}


// ======================================================
// AUTOR DEL HISTORIAL
// ======================================================

export function actorLabel(
  user: UserScope,
  email: string,
  name: string
) {
  const role =
    roleFromEmail(
      email
    )


  if (
    canSeeExactManager(
      user
    )
  ) {
    return role
      ? `${name} · ${roleLabel(
          role
        )}`
      : name
  }


  return roleLabel(
    role
  )
}


// ======================================================
// ESTADOS VISIBLES
// ======================================================

export function visibleStatusLabel(
  request: Pick<
    RequestItem,
    | "status"
    | "approvalContext"
  >
) {
  if (
    request.status ===
      "PENDIENTE_APROBACION" &&
    request.approvalContext ===
      "JEFATURA_LOCAL"
  ) {
    return "Revisión local"
  }


  const labels:
    Record<
      RequestStatus,
      string
    > = {
      RECIBIDA:
        "Ingresada",

      INFORMACION_REQUERIDA:
        "Falta información",

      PENDIENTE_APROBACION:
        "Por aprobar",

      APROBADA:
        "Ingresada",

      APROBADA_CON_AJUSTE:
        "Ingresada",

      EN_GESTION:
        "En gestión",

      RESUELTA_POR_CONFIRMAR:
        "Por confirmar",

      RESUELTA:
        "Resuelta",

      RECHAZADA:
        "Rechazada",
    }


  return labels[
    request.status
  ]
}


// ======================================================
// ETAPA VISIBLE
// ======================================================

export function stageLabel(
  request: RequestItem
) {
  if (
    request.status ===
      "PENDIENTE_APROBACION" &&
    request.approvalContext ===
      "JEFATURA_LOCAL"
  ) {
    return "Revisión local"
  }


  if (
    request.status ===
    "PENDIENTE_APROBACION"
  ) {
    return "Por aprobar"
  }


  return visibleStatusLabel(
    request
  )
}
