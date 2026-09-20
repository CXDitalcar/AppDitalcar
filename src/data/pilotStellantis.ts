import type { UserRole, UserScope } from "../types"

export const PILOT_LOCAL = "Stellantis Nueva Tobalaba"

export const PILOT_REQUEST_CODES = [
  "COL-CRE-01",
  "COL-FIR-01",
  "EXP-HOR-01",
  "EXP-SEN-01",
  "EXP-ORG-01",
  "INS-ZEX-01",
  "INS-MOB-01",
  "INS-MAN-01",
  "EXP-OTR-01",
] as const

export type PilotModule =
  | "HOME"
  | "ACADEMIA"
  | "MI_LOCAL"
  | "SOLICITUDES"
  | "FORMULARIOS"
  | "INSUMOS"

export const PILOT_ACTIVE_ROLES: UserRole[] = [
  "VENDEDOR",
  "JEFATURA_LOCAL",
  "GERENCIA_MARCA",
  "EXPERIENCIA_CLIENTES",
  "JEFATURA_MARKETING",
  "GERENCIA_COMERCIAL",
]

export function isPilotFullAccess(user: UserScope) {
  return user.role === "EXPERIENCIA_CLIENTES"
}

export function canAccessPilotModule(
  user: UserScope,
  module: PilotModule
) {
  if (!user.active) return false
  if (isPilotFullAccess(user)) return true

  if (module === "HOME" || module === "SOLICITUDES") {
    return PILOT_ACTIVE_ROLES.includes(user.role)
  }

  if (module === "FORMULARIOS") {
    return ["JEFATURA_LOCAL", "GERENCIA_MARCA"].includes(user.role)
  }

  return false
}

export function getPilotRequestCodesForUser(user: UserScope) {
  if (isPilotFullAccess(user)) return null

  if (user.role === "VENDEDOR") {
    return new Set([
      "COL-CRE-01",
      "COL-FIR-01",
      "EXP-HOR-01",
      "EXP-SEN-01",
      "EXP-ORG-01",
    ])
  }

  if (["JEFATURA_LOCAL", "GERENCIA_MARCA"].includes(user.role)) {
    return new Set(PILOT_REQUEST_CODES)
  }

  if (["JEFATURA_MARKETING", "GERENCIA_COMERCIAL"].includes(user.role)) {
    return new Set([
      "COL-CRE-01",
      "COL-FIR-01",
      "EXP-HOR-01",
      "EXP-SEN-01",
      "EXP-ORG-01",
    ])
  }

  return new Set<string>()
}

export function isPilotLocal(user: UserScope) {
  const locals = [
    user.local,
    user.localPrincipal,
    ...(user.assignedLocals ?? []),
  ]
    .filter(Boolean)
    .map((value) => value!.trim().toLowerCase())

  return locals.includes(PILOT_LOCAL.toLowerCase())
}
