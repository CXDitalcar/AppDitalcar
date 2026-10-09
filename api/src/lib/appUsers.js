// Alta de usuarios dentro de DitalApp (Experiencia y PM), mientras 02_Usuarios no se pueda editar desde la app.
import { getUser, listAppUsers, upsertUser } from "./store.js"
import { normalizeEmail, validCorporateEmail } from "./security.js"
import { publicUser } from "./profile.js"

const ROLES = new Set([
  "VENDEDOR","ASISTENTE_JUNIOR","JEFATURA_LOCAL","JEFATURA_MARCA","JEFATURA_ZONAL","GERENCIA_MARCA",
  "GERENCIA_VENTAS","JEFATURA_OPERACIONES_COMERCIALES","JEFATURA_ADMINISTRACION","GERENCIA_ADMINISTRACION",
  "GERENCIA_COMERCIAL","JEFATURA_MARKETING","EXPERIENCIA_CLIENTES","PROJECT_MANAGER","ASISTENTE_GERENCIA",
  "ADMINISTRATIVO","EQUIPO_COMERCIAL","GERENCIA_GENERAL",
])
const NETWORK = new Set([
  "GERENCIA_VENTAS","GERENCIA_COMERCIAL","GERENCIA_ADMINISTRACION","GERENCIA_GENERAL","JEFATURA_OPERACIONES_COMERCIALES",
  "JEFATURA_ADMINISTRACION","JEFATURA_MARKETING","EXPERIENCIA_CLIENTES","PROJECT_MANAGER","ASISTENTE_GERENCIA",
])

function list(value) {
  const items = Array.isArray(value) ? value : String(value ?? "").split(/[;,]/)
  return [...new Set(items.map((x) => String(x).trim()).filter(Boolean))]
}

export function toDirectoryUser(entity) {
  const user = publicUser(entity)
  return { ...user, source: "APP", createdBy: entity.createdBy, createdAt: entity.createdAt }
}

export async function listAppDirectoryUsers() {
  return (await listAppUsers()).map(toDirectoryUser)
}

export async function saveAppUser(input, actorEmail) {
  const email = normalizeEmail(input.email)
  if (!email || !validCorporateEmail(email)) throw new Error("Usa un correo corporativo válido (@ditalcar.cl).")
  const name = String(input.name || "").trim()
  if (!name) throw new Error("Escribe el nombre de la persona.")
  const role = String(input.role || "").toUpperCase()
  if (!ROLES.has(role)) throw new Error("Elige un rol válido.")
  const assignedLocals = list(input.assignedLocals)
  const local = String(input.local || assignedLocals[0] || "").trim()
  if (!NETWORK.has(role) && !["GERENCIA_MARCA","JEFATURA_MARCA","JEFATURA_ZONAL"].includes(role) && !local) {
    throw new Error("Indica el local de la persona.")
  }
  const existing = await getUser(email)
  if (existing && existing.source !== "APP" && input.mode === "create") {
    throw new Error("Esa persona ya existe en el directorio (02_Usuarios o Excel). Edítala allí.")
  }
  const scope = NETWORK.has(role) ? "RED"
    : ["GERENCIA_MARCA","JEFATURA_MARCA"].includes(role) ? "MARCA"
    : role === "JEFATURA_ZONAL" ? "ZONA"
    : assignedLocals.length > 1 ? "MULTILOCAL" : "LOCAL"
  const entity = {
    email,
    name,
    role,
    local: local || "",
    localPrincipal: local || "",
    assignedLocals: JSON.stringify(assignedLocals.length ? assignedLocals : local ? [local] : []),
    scope,
    zone: String(input.zone || ""),
    brands: JSON.stringify(list(input.brands)),
    areaFunctional: String(input.areaFunctional || ""),
    active: input.active !== false,
    source: "APP",
    createdBy: existing?.createdBy || actorEmail,
    createdAt: existing?.createdAt || new Date().toISOString(),
    updatedBy: actorEmail,
    updatedAt: new Date().toISOString(),
  }
  await upsertUser(entity)
  return toDirectoryUser(await getUser(email))
}
