import { app } from "@azure/functions"
import { body, json } from "./lib/http.js"
import {
  clearSessionCookie,
  normalizeEmail,
  parseCookieHeader,
  SESSION_COOKIE,
  sessionCookie,
  validCorporateEmail,
  validPassword,
  hashPassword,
  verifyPassword,
} from "./lib/security.js"
import {
  consumeOneTimeToken,
  createOneTimeToken,
  createSession,
  deleteSession,
  getSession,
  getUser,
  upsertUser,
  ensureTables,
} from "./lib/store.js"
import { eligibleUser, publicUser, refreshProfileFromSharePoint } from "./lib/profile.js"
import { sendAuthMail } from "./lib/mailer.js"
import { loadUsersFromExcel } from "./lib/usersExcel.js"
import { getUsersExcelUrl, saveUsersExcelUrl } from "./lib/usersSource.js"
import { loadKpiFromBuffer, loadKpiFromExcel } from "./lib/kpiExcel.js"
import {
  getKpiExcelUrl,
  getKpiSnapshot,
  getKpiSourceMode,
  getKpiUploadMeta,
  saveKpiExcelUrl,
  saveKpiSnapshot,
  saveKpiSourceMode,
  saveKpiUploadMeta,
} from "./lib/kpiSource.js"
import { readKpiUpload, saveKpiUpload } from "./lib/kpiUpload.js"
import { finalizeLargeUpload, largeUploadLimits, stageLargeUploadChunk, startLargeUpload } from "./lib/chunkedUpload.js"
import { getSlaCatalog, resolveSlaSet } from "./lib/slaList.js"
import { getOperationalCatalog } from "./lib/operationalLists.js"
import { loadUsersFromList } from "./lib/usersList.js"
import { dataFilesMaxBytes, getAllDataFileStates, getDataFileState, registerDataFileBlob, saveDataFile } from "./lib/dataFiles.js"

import {
  getRouteExecution,
  listRouteExecutions,
  saveRouteExecution,
} from "./lib/routeStore.js"
import { saveRouteEvidence } from "./lib/routeEvidence.js"
import {
  appendRequestTimeline,
  getRequestStored,
  getRequestTimelineStored,
  listRequestsStored,
  saveRequestStored,
} from "./lib/requestStore.js"

const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS || 1)
const APP_URL = String(process.env.APP_PUBLIC_URL || "").replace(/\/$/, "")

function getSessionToken(request) {
  return parseCookieHeader(request.headers.get("cookie") || "")[SESSION_COOKIE]
}

async function currentUser(request) {
  const token = getSessionToken(request)
  const session = await getSession(token)
  if (!session) return null
  const user = await refreshProfileFromSharePoint(session.email).catch(() => getUser(session.email))
  if (!user || user.active === false) return null
  return publicUser(user)
}



// Acceso nivel Experiencia: Experiencia de Clientes y Project Manager (mismo alcance).
// Debe coincidir con src/services/experienceAccess.ts.
const EXPERIENCE_ACCESS_ROLES = ["EXPERIENCIA_CLIENTES", "PROJECT_MANAGER"]

function isExperienceUser(user) {
  return EXPERIENCE_ACCESS_ROLES.includes(user?.role)
}

function canSeeStoredRequest(user, item) {
  if (!user || !item) return false
  if (["EXPERIENCIA_CLIENTES", "PROJECT_MANAGER", "GERENCIA_GENERAL", "GERENCIA_COMERCIAL", "GERENCIA_VENTAS", "JEFATURA_COMERCIAL_CLIENTES"].includes(user.role)) return true
  const email = String(user.email || "").toLowerCase()
  if (String(item.requesterEmail || "").toLowerCase() === email) return true
  if (String(item.currentResponsibleEmail || "").toLowerCase() === email) return true
  const locals = [user.local, user.localPrincipal, ...(Array.isArray(user.assignedLocals) ? user.assignedLocals : [])].filter(Boolean)
  return locals.includes(item.local)
}

const ROUTE_LOCAL_BRANDS = [
  { name: "Cantagallo", brands: ["Chery", "Mitsubishi", "JMC", "KGM"] },
  { name: "Chery Norte", brands: ["Chery"] },
  { name: "Geely Norte", brands: ["Geely"] },
  { name: "Chery Alameda", brands: ["Chery"] },
  { name: "Geely Alameda", brands: ["Geely"] },
  { name: "Stellantis Nueva Tobalaba", brands: ["Jeep", "RAM", "Fiat", "Peugeot", "Citroën", "Leapmotor"] },
  { name: "KGM-JMC Nueva Tobalaba", brands: ["KGM", "JMC"] },
  { name: "JMC-KGM Nueva Tobalaba", brands: ["KGM", "JMC"] },
  { name: "Seminuevos Nueva Tobalaba", brands: [] },
  { name: "BYD Nueva Tobalaba", brands: ["BYD"] },
  { name: "Chery-MMC Tobalaba", brands: ["Chery", "Mitsubishi"] },
  { name: "Chery Tobalaba", brands: ["Chery"] },
  { name: "Mitsubishi Tobalaba", brands: ["Mitsubishi"] },
  { name: "Geely Tobalaba", brands: ["Geely"] },
  { name: "Chery-Renault Vespucio", brands: ["Chery", "Renault"] },
  { name: "Vespucio", brands: ["Chery", "Renault"] },
  { name: "Seminuevos Florida", brands: [] },
  { name: "Geely Florida", brands: ["Geely"] },
  { name: "Chery Florida", brands: ["Chery"] },
  { name: "Stellantis Costanera", brands: ["Fiat", "Jeep", "RAM", "Peugeot", "Citroën", "Leapmotor"] },
  { name: "Astara Costanera", brands: ["Chery", "JMC", "Mitsubishi", "Nissan", "KGM"] },
  { name: "Geely Costanera", brands: ["Geely"] },
]

function normalizedRouteValue(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase()
}

function canAccessRouteLocal(user, local) {
  if (!user || !local) return false
  if (["EXPERIENCIA_CLIENTES", "PROJECT_MANAGER", "JEFATURA_COMERCIAL_CLIENTES", "GERENCIA_GENERAL", "GERENCIA_COMERCIAL", "GERENCIA_VENTAS"].includes(user.role)) return true

  const localKey = normalizedRouteValue(local)
  const explicitLocals = [user.local, user.localPrincipal, ...(Array.isArray(user.assignedLocals) ? user.assignedLocals : [])]
    .filter(Boolean)
    .map(normalizedRouteValue)
  if (explicitLocals.includes(localKey)) return true

  if (["GERENCIA_MARCA", "JEFATURA_MARCA"].includes(user.role) || user.scope === "MARCA") {
    const userBrands = (Array.isArray(user.brands) ? user.brands : []).map(normalizedRouteValue)
    if (!userBrands.length) return false
    const entry = ROUTE_LOCAL_BRANDS.find((item) => normalizedRouteValue(item.name) === localKey)
    return Boolean(entry?.brands.some((brand) => userBrands.includes(normalizedRouteValue(brand))))
  }

  // Roles zonales deben venir con LocalesAsignados desde la fuente de Usuarios.
  if (user.role === "JEFATURA_ZONAL" || user.scope === "ZONA") return false
  return false
}

function canSeeRouteExecution(user, item) {
  if (!user || !item) return false
  const email = String(user.email || "").toLowerCase()
  if (String(item.completedByEmail || "").toLowerCase() === email) return true
  return canAccessRouteLocal(user, item.local)
}

function routeCounts(answers = []) {
  return answers.reduce((acc, item) => {
    if (item?.status === "CUMPLE") acc.compliant += 1
    if (item?.status === "NO_CUMPLE") acc.nonCompliant += 1
    if (item?.status === "SOLICITADO") acc.requested += 1
    return acc
  }, { compliant: 0, nonCompliant: 0, requested: 0 })
}

function submittedDate(item) {
  return item?.submittedAt || item?.updatedAt || item?.createdAt || ""
}

function monthKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
}

function compareRoutePair(route, audit) {
  if (!route || !audit) return null
  const routeMap = new Map((route.answers || []).filter((item) => item?.itemId).map((item) => [item.itemId, item]))
  const auditMap = new Map((audit.answers || []).filter((item) => item?.itemId).map((item) => [item.itemId, item]))
  const ids = [...new Set([...routeMap.keys(), ...auditMap.keys()])]
  const differences = []
  let compared = 0
  let matches = 0
  for (const itemId of ids) {
    const routeAnswer = routeMap.get(itemId)
    const auditAnswer = auditMap.get(itemId)
    if (!routeAnswer?.status || !auditAnswer?.status) continue
    compared += 1
    if (routeAnswer.status === auditAnswer.status) {
      matches += 1
    } else {
      differences.push({
        itemId,
        routeStatus: routeAnswer.status,
        auditStatus: auditAnswer.status,
        routeDetail: routeAnswer.detail || "",
        auditDetail: auditAnswer.detail || "",
      })
    }
  }
  return {
    local: route.local,
    period: monthKey(submittedDate(audit) || submittedDate(route)),
    routeId: route.id,
    auditId: audit.id,
    routeDate: submittedDate(route),
    auditDate: submittedDate(audit),
    compared,
    matches,
    differences,
    exactitude: compared ? Math.round((matches / compared) * 1000) / 10 : 0,
  }
}

function buildRouteMetrics(items, local) {
  const submitted = items
    .filter((item) => item.status === "SUBMITTED")
    .filter((item) => !local || item.local === local)
    .sort((a, b) => new Date(submittedDate(b)).getTime() - new Date(submittedDate(a)).getTime())

  const routes = submitted.filter((item) => item.mode === "RUTA")
  const audits = submitted.filter((item) => item.mode === "AUDITORIA")
  const latest = compareRoutePair(routes[0], audits[0])

  const months = [...new Set(submitted.map((item) => monthKey(submittedDate(item))).filter(Boolean))].sort().reverse()
  const monthly = months.map((period) => {
    const route = routes.find((item) => monthKey(submittedDate(item)) === period)
    const audit = audits.find((item) => monthKey(submittedDate(item)) === period)
    return compareRoutePair(route, audit)
  }).filter(Boolean)

  return { local: local || undefined, latest, monthly, generatedAt: new Date().toISOString() }
}

app.http("sla-resolve", {
  methods: ["POST"], authLevel: "anonymous", route: "sla/resolve",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const data = await body(request)
    const result = await resolveSlaSet({
      reviewCode: data.reviewCode,
      acceptanceCode: data.acceptanceCode,
      resolutionCode: data.resolutionCode,
      confirmationCode: data.confirmationCode,
      confirmationFallbackHours: data.confirmationFallbackHours,
    }, { force: Boolean(data.force) })
    return json(200, result)
  },
})

app.http("sla-status", {
  methods: ["GET"], authLevel: "anonymous", route: "sla/status",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const [result, operations] = await Promise.all([
      getSlaCatalog({ force: true }),
      getOperationalCatalog({ force: true }),
    ])
    const requiredCodes = [...new Set((operations.processes || []).flatMap((process) => [
      process.slaReviewCode,
      process.slaAcceptanceCode,
      process.slaResolutionCode,
      process.slaConfirmationCode,
    ]).filter(Boolean))]
    const availableCodes = new Set(Object.keys(result.catalog || {}))
    const missingCodes = requiredCodes.filter((code) => !availableCodes.has(code))
    return json(200, {
      source: result.source,
      listName: result.listName,
      checkedAt: result.checkedAt,
      count: Object.keys(result.catalog || {}).length,
      requiredCount: requiredCodes.length,
      resolvedCount: requiredCodes.length - missingCodes.length,
      missingCodes,
      diagnostics: result.diagnostics,
      warning: result.warning || (missingCodes.length ? `${missingCodes.length} código(s) SLA usados por 22_Procesos aún no existen en 09_AcuerdosSLA.` : undefined),
    })
  },
})

app.http("users-source-config", {
  methods: ["GET", "POST"], authLevel: "anonymous", route: "users/source",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    if (request.method === "GET") {
      const url = await getUsersExcelUrl()
      return json(200, {
        configured: Boolean(url),
        url,
        sheet: process.env.USERS_EXCEL_SHEET || "Usuarios",
      })
    }

    const data = await body(request)
    const url = String(data.url || "").trim()
    if (!url) return json(400, { message: "Pega el enlace del Excel online." })

    try {
      const test = await loadUsersFromExcel(url, { force: true })
      await saveUsersExcelUrl(url, user.email)
      return json(200, {
        message: "Excel conectado correctamente.",
        meta: test.meta,
      })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible leer el Excel." })
    }
  },
})

app.http("users-directory", {
  methods: ["GET"], authLevel: "anonymous", route: "users/directory",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    // Fuente maestra: LIST 02_Usuarios. El Excel queda sólo como fallback temporal.
    try {
      const result = await loadUsersFromList({ force: request.query.get("force") === "1" })
      return json(200, result)
    } catch (listError) {
      const url = await getUsersExcelUrl()
      if (!url) {
        return json(503, {
          message: listError?.message || "No fue posible leer 02_Usuarios y no hay Excel temporal conectado.",
          source: "FALLBACK",
        })
      }
      try {
        const result = await loadUsersFromExcel(url)
        return json(200, {
          ...result,
          meta: {
            ...result.meta,
            source: "EXCEL_FALLBACK",
            listName: "02_Usuarios",
            warning: listError?.message || "02_Usuarios no disponible; usando Excel temporal.",
          },
        })
      } catch (error) {
        return json(502, { message: error?.message || "No fue posible leer 02_Usuarios ni el Excel temporal." })
      }
    }
  },
})

app.http("operations-catalog", {
  methods: ["GET"], authLevel: "anonymous", route: "operations/catalog",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const force = request.query.get("force") === "1"
    const result = await getOperationalCatalog({ force })

    // El directorio también se entrega a la capa operativa para resolver responsables,
    // jefaturas, gerencias y permisos sin recurrir a usuarios hardcodeados.
    let directory = { users: [], meta: { source: "FALLBACK" } }
    try {
      directory = await loadUsersFromList({ force })
    } catch (listError) {
      try {
        const url = await getUsersExcelUrl()
        if (url) {
          const excel = await loadUsersFromExcel(url)
          directory = {
            ...excel,
            meta: { ...excel.meta, source: "EXCEL_FALLBACK", listName: process.env.SHAREPOINT_USERS_LIST || "02_Usuarios", warning: listError?.message },
          }
        }
      } catch {
        directory = { users: [], meta: { source: "FALLBACK", listName: process.env.SHAREPOINT_USERS_LIST || "02_Usuarios", warning: listError?.message } }
      }
    }

    return json(200, { ...result, users: directory.users, usersMeta: directory.meta })
  },
})

app.http("operations-status", {
  methods: ["GET"], authLevel: "anonymous", route: "operations/status",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    const [catalog, sla] = await Promise.all([
      getOperationalCatalog({ force: true }),
      getSlaCatalog({ force: true }),
    ])
    let users
    try {
      const liveUsers = await loadUsersFromList({ force: true })
      users = { source: "SHAREPOINT_LIST", listName: liveUsers.meta.listName, count: liveUsers.users.length, checkedAt: liveUsers.meta.checkedAt }
    } catch (error) {
      try {
        const url = await getUsersExcelUrl()
        if (!url) throw error
        const excelUsers = await loadUsersFromExcel(url)
        users = { source: "EXCEL_FALLBACK", listName: process.env.SHAREPOINT_USERS_LIST || "02_Usuarios", count: excelUsers.users.length, checkedAt: excelUsers.meta.checkedAt, warning: error?.message }
      } catch {
        users = { source: "FALLBACK", listName: process.env.SHAREPOINT_USERS_LIST || "02_Usuarios", count: 0, warning: error?.message }
      }
    }
    return json(200, {
      users,
      processes: { source: catalog.meta?.source, listName: catalog.meta?.lists?.processes, count: catalog.processes?.length || 0 },
      fields: { source: catalog.meta?.source, listName: catalog.meta?.lists?.fields, count: catalog.fields?.length || 0 },
      assignments: { source: catalog.meta?.source, listName: catalog.meta?.lists?.assignments, count: catalog.assignments?.length || 0 },
      sla: (() => {
        const requiredCodes = [...new Set((catalog.processes || []).flatMap((process) => [
          process.slaReviewCode,
          process.slaAcceptanceCode,
          process.slaResolutionCode,
          process.slaConfirmationCode,
        ]).filter(Boolean))]
        const availableCodes = new Set(Object.keys(sla.catalog || {}))
        const missingCodes = requiredCodes.filter((code) => !availableCodes.has(code))
        return {
          source: sla.source,
          listName: sla.listName || process.env.SHAREPOINT_SLA_LIST || "09_AcuerdosSLA",
          count: Object.keys(sla.catalog || {}).length,
          requiredCount: requiredCodes.length,
          resolvedCount: requiredCodes.length - missingCodes.length,
          missingCodes,
          diagnostics: sla.diagnostics,
          warning: sla.warning || (missingCodes.length ? `${missingCodes.length} código(s) SLA usados por 22_Procesos aún no existen en 09_AcuerdosSLA.` : undefined),
        }
      })(),
      requestStorage: {
        source: "AZURE_TABLE",
        requestsTable: "DitalcarRequests",
        timelineTable: "DitalcarRequestTimeline",
        futureSharePointLists: ["Tablero General Solicitudes", "20_ValoresSolicitud", "21_SeguimientoSolicitudes"],
      },
      checkedAt: new Date().toISOString(),
    })
  },
})

app.http("kpi-source-config", {
  methods: ["GET", "POST"], authLevel: "anonymous", route: "kpi/source",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    if (request.method === "GET") {
      const [url, snapshot, activeMode, upload] = await Promise.all([
        getKpiExcelUrl(),
        getKpiSnapshot(),
        getKpiSourceMode(),
        getKpiUploadMeta(),
      ])
      return json(200, {
        configured: Boolean(url || upload?.blobName),
        url,
        activeMode: activeMode || null,
        uploadedFile: upload ? {
          fileName: upload.fileName || "Excel KPI",
          uploadedAt: upload.uploadedAt || null,
          size: Number(upload.size || 0),
        } : null,
        lastSnapshotAt: snapshot?.meta?.checkedAt || null,
      })
    }

    const data = await body(request)
    const url = String(data.url || "").trim()
    if (!url) return json(400, { message: "Pega el enlace del Excel KPI online." })

    try {
      const result = await loadKpiFromExcel(url, { force: true })
      await saveKpiExcelUrl(url, user.email)
      await saveKpiSourceMode("url", user.email)
      await saveKpiSnapshot(result, user.email)
      return json(200, {
        message: "Enlace KPI conectado y activado correctamente.",
        data: result,
        activeMode: "url",
      })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible leer el Excel KPI." })
    }
  },
})

app.http("large-upload-start", {
  methods: ["POST"], authLevel: "anonymous", route: "uploads/start",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    try {
      const data = await body(request)
      const session = await startLargeUpload({
        kind: data.kind,
        fileName: data.fileName,
        size: data.size,
        contentType: data.contentType,
        createdBy: user.email,
      })
      const limits = largeUploadLimits()
      return json(200, { uploadId: session.id, chunkBytes: limits.chunkBytes, totalChunks: session.totalChunks, maxBytes: limits.maxBytes })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible iniciar la carga." })
    }
  },
})

app.http("large-upload-chunk", {
  methods: ["POST"], authLevel: "anonymous", route: "uploads/chunk",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    try {
      const url = new URL(request.url)
      const uploadId = String(url.searchParams.get("uploadId") || "")
      const index = Number(url.searchParams.get("index"))
      const buffer = Buffer.from(await request.arrayBuffer())
      return json(200, await stageLargeUploadChunk({ uploadId, index, buffer, userEmail: user.email }))
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible guardar este bloque." })
    }
  },
})

app.http("large-upload-finalize", {
  methods: ["POST"], authLevel: "anonymous", route: "uploads/finalize",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    try {
      const data = await body(request)
      const session = await finalizeLargeUpload({ uploadId: data.uploadId, userEmail: user.email })
      const uploadedAt = session.completedAt || new Date().toISOString()

      if (session.kind === "kpi") {
        const stored = await readKpiUpload(session.blobName)
        const validated = await loadKpiFromBuffer(stored.buffer, {
          sourceUrl: "azure-upload",
          fileName: session.fileName,
          fileSize: Number(session.size || stored.buffer.length),
          sourceType: "upload",
          uploadedAt,
          lastModified: stored.lastModified || uploadedAt,
        })
        const upload = {
          blobName: session.blobName,
          fileName: session.fileName,
          size: Number(session.size || stored.buffer.length),
          uploadedAt,
        }
        await saveKpiUploadMeta(upload, user.email)
        await saveKpiSourceMode("upload", user.email)
        await saveKpiSnapshot(validated, user.email)
        return json(200, {
          message: "Archivo KPI subido, validado y activado correctamente.",
          data: validated,
          activeMode: "upload",
          uploadedFile: upload,
        })
      }

      const state = await registerDataFileBlob(session.kind, {
        blobName: session.blobName,
        fileName: session.fileName,
        size: session.size,
        uploadedAt,
      }, user.email)
      return json(200, { message: "Archivo cargado y activado correctamente.", state })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible finalizar la carga." })
    }
  },
})

app.http("kpi-upload", {
  methods: ["POST"], authLevel: "anonymous", route: "kpi/upload",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    const rawName = request.headers.get("x-file-name") || "KPI_DITALCAR.xlsm"
    let fileName = "KPI_DITALCAR.xlsm"
    try { fileName = decodeURIComponent(rawName) } catch { fileName = rawName }
    const lower = fileName.toLowerCase()
    if (!lower.endsWith(".xlsm") && !lower.endsWith(".xlsx")) {
      return json(400, { message: "Selecciona un archivo Excel .xlsm o .xlsx." })
    }

    const declaredLength = Number(request.headers.get("content-length") || 0)
    const maxBytes = 100 * 1024 * 1024
    if (declaredLength > maxBytes) return json(413, { message: "El archivo supera el máximo de 100 MB." })

    try {
      const buffer = Buffer.from(await request.arrayBuffer())
      if (!buffer.length) return json(400, { message: "El archivo está vacío." })
      if (buffer.length > maxBytes) return json(413, { message: "El archivo supera el máximo de 100 MB." })

      // Primero validamos la misma estructura DASHBOARD/GRAFICOS antes de reemplazar el archivo vigente.
      const validated = await loadKpiFromBuffer(buffer, {
        sourceUrl: "azure-upload",
        fileName,
        sourceType: "upload",
      })

      const upload = await saveKpiUpload(buffer, fileName, request.headers.get("content-type") || undefined)
      validated.meta.fileName = upload.fileName
      validated.meta.uploadedAt = upload.uploadedAt
      validated.meta.lastModified = upload.uploadedAt
      validated.meta.sourceType = "upload"

      await saveKpiUploadMeta(upload, user.email)
      await saveKpiSourceMode("upload", user.email)
      await saveKpiSnapshot(validated, user.email)

      return json(200, {
        message: "Archivo KPI subido y activado correctamente.",
        data: validated,
        activeMode: "upload",
        uploadedFile: upload,
      })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible procesar el archivo KPI." })
    }
  },
})

app.http("kpi-data", {
  methods: ["GET"], authLevel: "anonymous", route: "kpi/data",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const snapshot = await getKpiSnapshot()
    if (snapshot) return json(200, { ...snapshot, stale: false })
    return json(503, { message: "Todavía no existe un snapshot KPI válido. Conecta o sube un archivo desde Gestión → KPI." })
  },
})

app.http("kpi-refresh", {
  methods: ["POST"], authLevel: "anonymous", route: "kpi/refresh",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    const mode = await getKpiSourceMode()
    try {
      let result
      if (mode === "upload") {
        const upload = await getKpiUploadMeta()
        if (!upload?.blobName) throw new Error("No hay un archivo KPI subido todavía.")
        const stored = await readKpiUpload(upload.blobName)
        result = await loadKpiFromBuffer(stored.buffer, {
          sourceUrl: "azure-upload",
          fileName: upload.fileName || "Excel KPI",
          fileSize: stored.buffer.length,
          sourceType: "upload",
          uploadedAt: upload.uploadedAt,
          lastModified: stored.lastModified || upload.uploadedAt,
        })
      } else {
        const url = await getKpiExcelUrl()
        if (!url) throw new Error("No hay una fuente KPI configurada.")
        result = await loadKpiFromExcel(url, { force: true })
      }
      await saveKpiSnapshot(result, user.email)
      return json(200, { message: "KPI actualizado correctamente.", data: result })
    } catch (error) {
      const snapshot = await getKpiSnapshot()
      if (snapshot) return json(200, { message: "No fue posible actualizar; se mantiene el último snapshot válido.", data: { ...snapshot, stale: true, warning: error?.message || "Error de actualización." } })
      return json(502, { message: error?.message || "No fue posible actualizar KPI." })
    }
  },
})


app.http("data-files-status", {
  methods: ["GET"], authLevel: "anonymous", route: "data-files/status",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    const sources = await getAllDataFileStates()
    return json(200, { sources, maxBytes: dataFilesMaxBytes() })
  },
})

app.http("data-files-source", {
  methods: ["GET"], authLevel: "anonymous", route: "data-files/{kind}",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    try {
      return json(200, await getDataFileState(request.params.kind))
    } catch (error) {
      return json(400, { message: error?.message || "Fuente no válida." })
    }
  },
})

app.http("data-files-upload", {
  methods: ["POST"], authLevel: "anonymous", route: "data-files/{kind}/upload",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })
    const maxBytes = dataFilesMaxBytes()
    const declaredLength = Number(request.headers.get("content-length") || 0)
    if (declaredLength > maxBytes) return json(413, { message: "El archivo supera el máximo de 100 MB." })
    const rawName = request.headers.get("x-file-name") || "archivo.xlsx"
    let fileName = rawName
    try { fileName = decodeURIComponent(rawName) } catch {}
    try {
      const buffer = Buffer.from(await request.arrayBuffer())
      if (buffer.length > maxBytes) return json(413, { message: "El archivo supera el máximo de 100 MB." })
      const state = await saveDataFile(request.params.kind, buffer, fileName, request.headers.get("content-type") || undefined, user.email)
      return json(200, { message: "Archivo cargado y activado correctamente.", state })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible guardar el archivo." })
    }
  },
})

app.http("route-metrics", {
  methods: ["GET"], authLevel: "anonymous", route: "route/metrics",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const url = new URL(request.url)
    const requestedLocal = String(url.searchParams.get("local") || "").trim()
    const rows = await listRouteExecutions()
    const visible = rows.filter((item) => canSeeRouteExecution(user, item))
    const scoped = requestedLocal ? visible.filter((item) => item.local === requestedLocal) : visible
    if (requestedLocal && !canAccessRouteLocal(user, requestedLocal)) {
      return json(403, { message: "No tienes acceso a las mediciones de ese local." })
    }
    return json(200, buildRouteMetrics(visible, requestedLocal || undefined))
  },
})

app.http("route-executions", {
  methods: ["GET", "POST"], authLevel: "anonymous", route: "route/executions",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })

    if (request.method === "GET") {
      const rows = await listRouteExecutions()
      return json(200, { executions: rows.filter((item) => canSeeRouteExecution(user, item)).slice(0, 100) })
    }

    const data = await body(request)
    const now = new Date().toISOString()
    const id = String(data.id || `RUTA-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`)
    const previous = await getRouteExecution(id)
    if (previous && !canSeeRouteExecution(user, previous)) return json(403, { message: "No tienes acceso a esta Ruta." })
    if (previous?.status === "SUBMITTED") return json(409, { message: "Esta Ruta ya fue enviada y quedó cerrada." })

    const mode = data.mode === "AUDITORIA" ? "AUDITORIA" : "RUTA"
    if (mode === "AUDITORIA" && !["EXPERIENCIA_CLIENTES", "PROJECT_MANAGER", "JEFATURA_COMERCIAL_CLIENTES", "GERENCIA_MARCA", "JEFATURA_MARCA", "JEFATURA_ZONAL"].includes(user.role)) {
      return json(403, { message: "La Auditoría Ruta está reservada para Experiencia y Gerencias de Marca." })
    }
    const targetLocal = String(data.local || previous?.local || "").trim()
    if (targetLocal && !canAccessRouteLocal(user, targetLocal)) {
      return json(403, { message: "No tienes acceso a realizar una Ruta o Auditoría para ese local." })
    }

    const answers = Array.isArray(data.answers) ? data.answers : []
    const counts = routeCounts(answers)
    const execution = {
      ...(previous || {}),
      id,
      mode,
      local: String(data.local || previous?.local || "").trim(),
      status: data.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT",
      completedByEmail: previous?.completedByEmail || user.email,
      completedByName: previous?.completedByName || user.name,
      createdAt: previous?.createdAt || now,
      updatedAt: now,
      submittedAt: data.status === "SUBMITTED" ? (previous?.submittedAt || now) : previous?.submittedAt,
      answers,
      walkAdjustments: String(data.walkAdjustments || ""),
      pendingActions: String(data.pendingActions || ""),
      additionalComment: String(data.additionalComment || ""),
      ...counts,
    }
    if (!execution.local) return json(400, { message: "Selecciona el local." })
    await saveRouteExecution(execution)
    return json(200, { execution, message: execution.status === "SUBMITTED" ? "Ruta registrada correctamente." : "Borrador guardado." })
  },
})

app.http("route-execution-detail", {
  methods: ["GET"], authLevel: "anonymous", route: "route/executions/{id}",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const item = await getRouteExecution(request.params.id)
    if (!item) return json(404, { message: "Ruta no encontrada." })
    if (!canSeeRouteExecution(user, item)) return json(403, { message: "No tienes acceso a esta Ruta." })
    return json(200, { execution: item })
  },
})

app.http("route-evidence", {
  methods: ["POST"], authLevel: "anonymous", route: "route/evidence",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const url = new URL(request.url)
    const executionId = String(url.searchParams.get("executionId") || "").trim()
    const itemId = String(url.searchParams.get("itemId") || "").trim()
    if (!executionId || !itemId) return json(400, { message: "Falta identificar la Ruta o el punto revisado." })
    const rawName = request.headers.get("x-file-name") || "evidencia"
    let fileName = rawName
    try { fileName = decodeURIComponent(rawName) } catch {}
    const maxBytes = 10 * 1024 * 1024
    const declared = Number(request.headers.get("content-length") || 0)
    if (declared > maxBytes) return json(413, { message: "Cada evidencia puede pesar como máximo 10 MB." })
    const buffer = Buffer.from(await request.arrayBuffer())
    if (!buffer.length) return json(400, { message: "El archivo está vacío." })
    if (buffer.length > maxBytes) return json(413, { message: "Cada evidencia puede pesar como máximo 10 MB." })
    const saved = await saveRouteEvidence(buffer, fileName, request.headers.get("content-type") || undefined, executionId, itemId)
    const { blobName: _blobName, ...evidence } = saved
    return json(200, { evidence })
  },
})

app.http("stored-requests", {
  methods: ["GET", "POST"], authLevel: "anonymous", route: "requests",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    if (request.method === "GET") {
      const rows = await listRequestsStored()
      return json(200, { requests: rows.filter((item) => canSeeStoredRequest(user, item)) })
    }
    const data = await body(request)
    const incoming = data.request || {}
    const sla = await resolveSlaSet({
      reviewCode: incoming.slaReviewCode,
      acceptanceCode: incoming.slaAcceptanceCode,
      resolutionCode: incoming.slaResolutionCode,
      confirmationCode: incoming.slaConfirmationCode,
      confirmationFallbackHours: incoming.confirmationSLAHours || 48,
    }).catch(() => null)
    const item = await saveRequestStored({
      ...incoming,
      id: undefined,
      requesterEmail: user.email,
      requesterName: user.name,
      approvalSLAHours: incoming.approvalSLAStartedAt ? (sla?.review?.hours ?? incoming.approvalSLAHours) : incoming.approvalSLAHours,
      acceptanceSLAHours: sla?.acceptance?.hours ?? incoming.acceptanceSLAHours,
      resolutionSLAHours: sla?.resolution?.hours ?? incoming.resolutionSLAHours,
      confirmationSLAHours: sla?.confirmation?.hours ?? incoming.confirmationSLAHours ?? 48,
      slaSource: sla?.source || incoming.slaSource || "FALLBACK",
      slaListName: sla?.listName || incoming.slaListName,
      slaCheckedAt: sla?.checkedAt || incoming.slaCheckedAt,
    })
    await appendRequestTimeline({
      id: `${item.id}-CREATED-${Date.now()}`, requestId: item.id, type: "CREATED",
      authorEmail: user.email, authorName: user.name, createdAt: item.createdAt || new Date().toISOString(),
      comment: "Solicitud ingresada en Ditalcar Colaboradores.",
    })
    return json(200, { request: item, warnings: [] })
  },
})

app.http("stored-request-detail", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "requests/{id}",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const existing = await getRequestStored(request.params.id)
    if (!existing) return json(404, { message: "Solicitud no encontrada." })
    if (!canSeeStoredRequest(user, existing)) return json(403, { message: "No tienes acceso a esta solicitud." })
    if (request.method === "GET") return json(200, { request: existing })

    const data = await body(request)
    const next = { ...(data.request || existing), id: existing.id }
    const saved = await saveRequestStored(next)
    await appendRequestTimeline({
      id: `${saved.id}-${data.type || "COMMENT"}-${Date.now()}`, requestId: saved.id, type: data.type || "COMMENT",
      authorEmail: user.email, authorName: user.name, createdAt: new Date().toISOString(),
      comment: data.detail ? `${data.title || "Actualización"} · ${data.detail}` : (data.title || "Actualización"),
    })
    return json(200, { request: saved, warnings: [] })
  },
})

app.http("stored-request-history", {
  methods: ["GET"], authLevel: "anonymous", route: "requests/{id}/history",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })
    const existing = await getRequestStored(request.params.id)
    if (!existing) return json(404, { message: "Solicitud no encontrada." })
    if (!canSeeStoredRequest(user, existing)) return json(403, { message: "No tienes acceso a esta solicitud." })
    return json(200, { history: await getRequestTimelineStored(existing.id) })
  },
})

app.http("auth-me", {
  methods: ["GET"], authLevel: "anonymous", route: "auth/me",
  handler: async (request) => {
    const user = await currentUser(request)
    return user ? json(200, { user }) : json(401, { message: "Sesión no válida." })
  },
})

app.http("auth-login", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/login",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const password = String(data.password || "")
    if (!validCorporateEmail(email)) return json(401, { message: "Correo o contraseña incorrectos." })

    const user = await eligibleUser(email)
    if (!user || user.active === false || !user.passwordHash) return json(401, { message: "Cuenta no activada o credenciales incorrectas." })
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) return json(429, { message: "Acceso bloqueado temporalmente por seguridad. Intenta más tarde." })

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      const failed = Number(user.failedLoginCount || 0) + 1
      await upsertUser({ ...user, failedLoginCount: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : undefined })
      return json(401, { message: "Correo o contraseña incorrectos." })
    }

    await upsertUser({ ...user, failedLoginCount: 0, lockedUntil: undefined, lastLoginAt: new Date().toISOString() })
    const session = await createSession(email, SESSION_DAYS)
    return json(200, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(session, SESSION_DAYS * 86400) })
  },
})


app.http("auth-setup-status", {
  methods: ["GET"], authLevel: "anonymous", route: "auth/setup-status",
  handler: async () => {
    const setupEmailConfigured = Boolean(normalizeEmail(process.env.AUTH_SETUP_EMAIL || ""))
    const setupKeyConfigured = String(process.env.AUTH_SETUP_KEY || "").length >= 16
    const storageConfigured = Boolean(process.env.AUTH_STORAGE_CONNECTION_STRING || process.env.AzureWebJobsStorage)

    let storageOk = false
    let storageCode = "NOT_TESTED"
    if (storageConfigured) {
      try {
        await ensureTables()
        storageOk = true
        storageCode = "OK"
      } catch (error) {
        const code = String(error?.code || "")
        const status = Number(error?.statusCode || 0)
        if (code === "KeyBasedAuthenticationNotPermitted") storageCode = "KEY_AUTH_DISABLED"
        else if (status === 403) storageCode = "STORAGE_FORBIDDEN"
        else if (status === 404) storageCode = "STORAGE_NOT_FOUND"
        else storageCode = "STORAGE_ERROR"
        console.error("auth/setup-status storage check failed", { code, status })
      }
    }

    return json(200, {
      setupEmailConfigured,
      setupKeyConfigured,
      storageConfigured,
      storageOk,
      storageCode,
      ready: setupEmailConfigured && setupKeyConfigured && storageConfigured && storageOk,
    })
  },
})

app.http("auth-manual-activate", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/manual-activate",
  handler: async (request) => {
    try {
      const data = await body(request)
      const email = normalizeEmail(data.email)
      const password = String(data.password || "")
      const setupKey = String(data.setupKey || "")
      const allowedEmail = normalizeEmail(process.env.AUTH_SETUP_EMAIL || "")
      const expectedKey = String(process.env.AUTH_SETUP_KEY || "")

      if (!allowedEmail || !expectedKey) {
        return json(503, { message: "La activación manual no está habilitada en Azure. Revisa AUTH_SETUP_EMAIL y AUTH_SETUP_KEY.", code: "SETUP_DISABLED" })
      }
      if (!validCorporateEmail(email) || email !== allowedEmail) {
        return json(403, { message: "Este correo no está autorizado para la activación manual.", code: "EMAIL_NOT_ALLOWED" })
      }
      if (!setupKey || setupKey.length < 16 || setupKey !== expectedKey) {
        return json(403, { message: "La clave temporal de instalación no es válida.", code: "SETUP_KEY_INVALID" })
      }
      if (!validPassword(password)) {
        return json(400, { message: "La contraseña debe tener al menos 10 caracteres, letras y números.", code: "PASSWORD_INVALID" })
      }

      const existing = await getUser(email)
      if (existing?.passwordHash) {
        return json(409, { message: "La cuenta ya está activada. Ingresa normalmente con tu correo y contraseña.", code: "ALREADY_ACTIVE" })
      }
      const passwordHash = await hashPassword(password)
      const updated = await upsertUser({
        ...(existing || {}),
        email,
        name: process.env.AUTH_SETUP_NAME || existing?.name || email.split("@")[0],
        role: "EXPERIENCIA_CLIENTES",
        scope: "RED",
        areaFunctional: "Experiencia de Clientes",
        active: true,
        passwordHash,
        activatedAt: existing?.activatedAt || new Date().toISOString(),
        passwordChangedAt: new Date().toISOString(),
        failedLoginCount: 0,
        lockedUntil: undefined,
      })

      const session = await createSession(email, SESSION_DAYS)
      return json(200, {
        user: publicUser(updated),
        message: "Acceso activado. Ya puedes ingresar con tu correo y contraseña.",
      }, { "Set-Cookie": sessionCookie(session, SESSION_DAYS * 86400) })
    } catch (error) {
      const code = String(error?.code || "")
      const status = Number(error?.statusCode || 0)
      console.error("Manual activation failed", { code, status, name: error?.name })

      if (code === "KeyBasedAuthenticationNotPermitted") {
        return json(503, { message: "Azure Storage está creado, pero rechaza el acceso por Connection String. Habilita el acceso mediante claves en la cuenta de Storage o usa una cuenta que lo permita.", code: "KEY_AUTH_DISABLED" })
      }
      if (status === 403) {
        return json(503, { message: "La API no tiene acceso al Storage. Revisa la Connection String y la configuración de red/acceso de la cuenta de almacenamiento.", code: "STORAGE_FORBIDDEN" })
      }
      if (status === 404) {
        return json(503, { message: "No fue posible encontrar el servicio de Storage configurado. Revisa AUTH_STORAGE_CONNECTION_STRING.", code: "STORAGE_NOT_FOUND" })
      }
      return json(500, { message: "La activación llegó al backend, pero falló al guardar la cuenta. Revisa el diagnóstico en /api/auth/setup-status.", code: "SETUP_STORAGE_ERROR" })
    }
  },
})

app.http("auth-request-activation", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/request-activation",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const generic = "Si tu correo está habilitado en Ditalcar, recibirás un enlace para activar tu cuenta."
    if (!validCorporateEmail(email)) return json(200, { message: generic })
    const user = await eligibleUser(email)
    if (!user || user.active === false || user.passwordHash) return json(200, { message: generic })

    const token = await createOneTimeToken(email, "ACTIVATION", 60)
    const url = `${APP_URL || new URL(request.url).origin}/?activation=${encodeURIComponent(token)}`
    const mail = await sendAuthMail({ to: email, subject: "Activa tu cuenta · Ditalcar Colaboradores", title: "Activa tu cuenta", text: "Crea tu contraseña personal para ingresar a Ditalcar Colaboradores. El enlace vence en 60 minutos.", buttonText: "Crear mi contraseña", url })
    return json(200, { message: generic, ...(mail.devUrl ? { devUrl: mail.devUrl } : {}) })
  },
})

app.http("auth-activate", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/activate",
  handler: async (request) => {
    const data = await body(request)
    if (!validPassword(data.password)) return json(400, { message: "La contraseña debe tener al menos 10 caracteres, letras y números." })
    const token = await consumeOneTimeToken(String(data.token || ""), "ACTIVATION")
    if (!token) return json(400, { message: "El enlace de activación no es válido o ya venció." })
    const user = await eligibleUser(token.email)
    if (!user || user.active === false) return json(403, { message: "Usuario no habilitado." })
    const passwordHash = await hashPassword(data.password)
    const updated = await upsertUser({ ...user, passwordHash, activatedAt: new Date().toISOString(), failedLoginCount: 0, lockedUntil: undefined })
    return json(200, { user: publicUser(updated), message: "Cuenta activada." })
  },
})

app.http("auth-request-reset", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/request-reset",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const generic = "Si el correo está registrado, recibirás un enlace para crear una nueva contraseña."
    const user = validCorporateEmail(email) ? await eligibleUser(email) : null
    if (!user || !user.passwordHash || user.active === false) return json(200, { message: generic })
    const token = await createOneTimeToken(email, "RESET", 30)
    const url = `${APP_URL || new URL(request.url).origin}/?reset=${encodeURIComponent(token)}`
    const mail = await sendAuthMail({ to: email, subject: "Recupera tu acceso · Ditalcar Colaboradores", title: "Recupera tu acceso", text: "Usa este enlace para crear una nueva contraseña. El enlace vence en 30 minutos.", buttonText: "Crear nueva contraseña", url })
    return json(200, { message: generic, ...(mail.devUrl ? { devUrl: mail.devUrl } : {}) })
  },
})

app.http("auth-reset-password", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/reset-password",
  handler: async (request) => {
    const data = await body(request)
    if (!validPassword(data.password)) return json(400, { message: "La contraseña debe tener al menos 10 caracteres, letras y números." })
    const token = await consumeOneTimeToken(String(data.token || ""), "RESET")
    if (!token) return json(400, { message: "El enlace de recuperación no es válido o ya venció." })
    const user = await getUser(token.email)
    if (!user || user.active === false) return json(403, { message: "Usuario no habilitado." })
    await upsertUser({ ...user, passwordHash: await hashPassword(data.password), failedLoginCount: 0, lockedUntil: undefined, passwordChangedAt: new Date().toISOString() })
    return json(200, { message: "Contraseña actualizada." })
  },
})

app.http("auth-logout", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/logout",
  handler: async (request) => {
    await deleteSession(getSessionToken(request))
    return json(200, { message: "Sesión cerrada." }, { "Set-Cookie": clearSessionCookie() })
  },
})
