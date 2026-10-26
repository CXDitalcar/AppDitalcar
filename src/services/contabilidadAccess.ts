import type { UserScope } from "../types"
import { hasExperienceAccess } from "./experienceAccess"

// Contabilidad es solo para Administración (Jefatura y Gerencia) y Experiencia/PM, que administran la app.
// Debe coincidir con CONTABILIDAD_ROLES en api/src/admRoutes.js.
const CONTABILIDAD_ROLES: UserScope["role"][] = ["JEFATURA_ADMINISTRACION", "GERENCIA_ADMINISTRACION"]

export function canAccessContabilidad(user: UserScope) {
  return Boolean(user.active) && (hasExperienceAccess(user) || CONTABILIDAD_ROLES.includes(user.role))
}
