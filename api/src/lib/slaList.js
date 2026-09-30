import { getAppConfig, setAppConfig } from "./store.js"

const CACHE_KEY = "SLA_CATALOG_CACHE"
const MEMORY_TTL_MS = 60_000
let memory = { checkedAt: 0, catalog: null, source: null, listName: null }

const FALLBACKS = {
  SLA_SOL_REV_LOCAL: 24,
  SLA_SOL_TOMA: 24,
  SLA_SOL_CONFIRM: 48,
}

function normalizeKey(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
}

function pick(fields, aliases) {
  for (const [key, value] of Object.entries(fields || {})) {
    if (aliases.some((alias) => normalizeKey(alias) === normalizeKey(key))) return value
  }
  return undefined
}

function truthy(value) {
  if (value === undefined || value === null || value === "") return true
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  return ["1", "true", "si", "sí", "activo", "vigente", "yes"].includes(String(value).trim().toLowerCase())
}

function asHours(fields) {
  const direct = Number(pick(fields, ["Horas", "Hours", "SLAHoras", "TiempoHoras", "PlazoHoras", "HorasSLA"]))
  if (Number.isFinite(direct) && direct >= 0) return direct

  const raw = pick(fields, ["Valor", "Plazo", "Tiempo", "Cantidad"])
  const value = Number(String(raw ?? "").replace(",", "."))
  if (!Number.isFinite(value) || value < 0) return undefined
  const unit = normalizeKey(pick(fields, ["Unidad", "Unit", "UnidadTiempo", "TipoUnidad"]))
  if (unit.includes("dia")) return value * 24
  if (unit.includes("min")) return value / 60
  return value
}

async function graphAccessToken() {
  const tenant = process.env.GRAPH_TENANT_ID
  const clientId = process.env.GRAPH_CLIENT_ID
  const clientSecret = process.env.GRAPH_CLIENT_SECRET
  if (!tenant || !clientId || !clientSecret) return null

  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  })
  if (!response.ok) throw new Error("No fue posible autenticar Microsoft Graph para leer SLA.")
  return (await response.json()).access_token
}

function preferredListNames() {
  return [
    process.env.SHAREPOINT_SLA_LIST,
    "10_SLA",
    "SLA",
    "SLA Ditalcar",
    "SLA_Gestion",
    "SLA Gestión",
  ].filter(Boolean).map(String)
}

async function loadFromSharePoint() {
  const token = await graphAccessToken()
  if (!token) throw new Error("Microsoft Graph todavía no está habilitado para leer la LIST de SLA.")

  const host = process.env.SHAREPOINT_HOSTNAME || "ditalcarchile.sharepoint.com"
  const sitePath = process.env.SHAREPOINT_SITE_PATH || "/sites/DITALCARSA"
  const headers = { Authorization: `Bearer ${token}` }

  const siteResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${host}:${sitePath}?$select=id`, { headers })
  if (!siteResp.ok) throw new Error("No fue posible acceder al sitio SharePoint para leer SLA.")
  const site = await siteResp.json()

  const listsResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/lists?$select=id,displayName&$top=999`, { headers })
  if (!listsResp.ok) throw new Error("No fue posible listar las LIST de SharePoint.")
  const lists = (await listsResp.json()).value || []
  const preferred = preferredListNames().map((name) => normalizeKey(name))
  const list = lists.find((item) => preferred.includes(normalizeKey(item.displayName))) ||
    lists.find((item) => normalizeKey(item.displayName).includes("sla"))
  if (!list) throw new Error("No encontré la LIST de SLA en SharePoint. Define SHAREPOINT_SLA_LIST si su nombre no contiene SLA.")

  const itemsResp = await fetch(`https://graph.microsoft.com/v1.0/sites/${site.id}/lists/${list.id}/items?expand=fields&$top=999`, { headers })
  if (!itemsResp.ok) throw new Error(`No fue posible leer la LIST ${list.displayName}.`)
  const rows = (await itemsResp.json()).value || []

  const catalog = {}
  for (const row of rows) {
    const fields = row.fields || {}
    if (!truthy(pick(fields, ["Activo", "Active", "Vigente", "Estado"]))) continue
    const code = String(pick(fields, ["Codigo", "Código", "Code", "CodigoSLA", "SLA", "Title"]) || "").trim()
    const hours = asHours(fields)
    if (!code || !Number.isFinite(hours)) continue
    catalog[code] = {
      code,
      hours,
      label: String(pick(fields, ["Nombre", "Descripcion", "Descripción", "Title"]) || code),
      updatedAt: String(fields.Modified || fields.FechaActualizacion || ""),
    }
  }

  if (!Object.keys(catalog).length) {
    throw new Error(`La LIST ${list.displayName} no contiene SLA reconocibles. Se espera Código + Horas o Valor/Unidad.`)
  }

  return { catalog, listName: list.displayName }
}

async function cachedCatalog() {
  const stored = await getAppConfig(CACHE_KEY)
  if (!stored?.value) return null
  try { return JSON.parse(String(stored.value)) } catch { return null }
}

export async function getSlaCatalog({ force = false } = {}) {
  if (!force && memory.catalog && Date.now() - memory.checkedAt < MEMORY_TTL_MS) {
    return { catalog: memory.catalog, source: memory.source, listName: memory.listName, checkedAt: new Date(memory.checkedAt).toISOString() }
  }

  try {
    const live = await loadFromSharePoint()
    const checkedAt = new Date().toISOString()
    const snapshot = { ...live, checkedAt }
    await setAppConfig(CACHE_KEY, JSON.stringify(snapshot), { source: "SHAREPOINT_LIST" }).catch(() => {})
    memory = { checkedAt: Date.now(), catalog: live.catalog, source: "SHAREPOINT_LIST", listName: live.listName }
    return { ...snapshot, source: "SHAREPOINT_LIST" }
  } catch (error) {
    const cached = await cachedCatalog().catch(() => null)
    if (cached?.catalog && Object.keys(cached.catalog).length) {
      memory = { checkedAt: Date.now(), catalog: cached.catalog, source: "CACHE", listName: cached.listName || null }
      return { ...cached, source: "CACHE", warning: error?.message || "No fue posible actualizar SLA desde SharePoint." }
    }
    memory = { checkedAt: Date.now(), catalog: {}, source: "FALLBACK", listName: null }
    return {
      catalog: {},
      source: "FALLBACK",
      listName: null,
      checkedAt: new Date().toISOString(),
      warning: error?.message || "LIST de SLA no disponible.",
    }
  }
}

function resolved(code, catalog, fallbackHours) {
  if (!code) return undefined
  const live = catalog?.[code]?.hours
  const hours = Number.isFinite(live) ? live : (FALLBACKS[code] ?? fallbackHours)
  return Number.isFinite(hours) ? { code, hours } : { code, hours: undefined }
}

export async function resolveSlaSet(codes = {}, options = {}) {
  const result = await getSlaCatalog(options)
  return {
    review: resolved(codes.reviewCode, result.catalog),
    acceptance: resolved(codes.acceptanceCode, result.catalog),
    resolution: resolved(codes.resolutionCode, result.catalog),
    confirmation: resolved(codes.confirmationCode, result.catalog, Number(codes.confirmationFallbackHours || 48)),
    source: result.source,
    listName: result.listName,
    checkedAt: result.checkedAt,
    warning: result.warning,
  }
}
