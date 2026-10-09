// Rutas de Ventas (estado de NV sin datos del cliente), Frogmi y Gespark.

import { json, body } from "./lib/http.js"
import { frogmiLocal } from "./lib/datosParsers.js"
import { readAllMasters, readJsonBlob, readMaster, writeJsonBlob } from "./lib/datosStore.js"
import { readSegData } from "./lib/segStore.js"
import { DEFAULT_RULES, computeSeguimiento, inMacroScope, isFullViewer } from "./lib/seguimiento.js"
import { getAppConfig } from "./lib/store.js"
import { buildVenta, matchesQuery } from "./lib/ventas.js"
import { EVOLUTIVO_BASE, JUNIOR_FORMS, JUNIOR_LOCALS, TM_LOCALS, UMBRAL, computeFrogmi, formsSummary } from "./lib/frogmi.js"
import { computeGespark } from "./lib/gespark.js"

const FROGMI_CONFIG = "datos/frogmi-config.json"
const LOCAL_ROLES = new Set(["ASISTENTE_JUNIOR", "JEFATURA_LOCAL"])

async function readFrogmiConfig() {
  const value = await readJsonBlob(FROGMI_CONFIG).catch(() => null)
  return { activos: {}, aprobaciones: {}, tourManager: {}, ...(value || {}) }
}

async function frogmiMasters() {
  const [base, notificados, frogmi] = await Promise.all([readAllMasters(), readMaster("notificados"), readMaster("frogmi")])
  return { ...base, notificados, frogmi }
}

function userFrogmiLocal(user) {
  return [user?.local, user?.localPrincipal, ...(Array.isArray(user?.assignedLocals) ? user.assignedLocals : [])].map(frogmiLocal).find(Boolean) || ""
}

function publicFrogmiRow(r) {
  const forms = {}
  for (const [k, v] of Object.entries(r.forms)) forms[k] = v ? { fecha: v.fecha, vinDigitado: v.vinDigitado, metodo: v.metodo, local: v.local } : null
  return {
    vin: r.vin, nv: r.nv, fechaVenta: r.fechaVenta, marca: r.marca, modelo: r.modelo, local: r.local, vendedor: r.vendedor,
    exclusion: r.exclusion, activo: r.activo, llegada: r.llegada, forms, pendientes: Object.fromEntries(Object.keys(r.pendientes).map((k) => [k, true])),
    juniorOk: r.juniorOk, otroLocal: r.otroLocal,
  }
}

export function registerOpsRoutes({ app, currentUser, isExperienceUser }) {
  const forbidden = () => json(403, { message: "Esta sección no está disponible para tu cargo." })
  const handle = (fn) => async (request) => {
    try { return await fn(request) } catch (error) {
      console.error("opsRoutes", error?.message)
      return json(500, { message: error?.message || "Error inesperado." })
    }
  }

  // ================= VENTAS =================
  app.http("ventas-lista", {
    methods: ["GET"], authLevel: "anonymous", route: "ventas",
    handler: handle(async (request) => {
      const user = await currentUser(request)
      if (!user) return json(401, { message: "Sesión no válida." })
      const q = String(request.query.get("q") || "").trim()
      const soloAlertas = request.query.get("alertas") === "1"
      const [masters, seg, stored] = await Promise.all([readAllMasters(), readSegData(), getAppConfig("SEG_REGLAS")])
      let rules = DEFAULT_RULES
      try { rules = { ...DEFAULT_RULES, ...JSON.parse(String(stored?.value || "{}")) } } catch { /* reglas por defecto */ }
      const result = computeSeguimiento(masters, seg, rules)
      const today = new Date().toISOString().slice(0, 10)
      const scoped = result.rows.filter((r) => isFullViewer(user) || isExperienceUser(user) || inMacroScope(user, r))
      const ventas = scoped.filter((r) => matchesQuery(r, q)).map((r) => buildVenta(r, masters, today))
      const filtered = soloAlertas ? ventas.filter((v) => v.alertas.length) : ventas

      // Junior (y Experiencia): estado de los formularios Frogmi por VIN.
      let frogmi = null
      if (user.role === "ASISTENTE_JUNIOR" || isExperienceUser(user)) {
        const [notificados, frogmiForms, config] = await Promise.all([readMaster("notificados"), readMaster("frogmi"), readFrogmiConfig()])
        const calc = computeFrogmi({ ...masters, notificados, frogmi: frogmiForms }, config)
        frogmi = Object.fromEntries(filtered.slice(0, 300).filter((v) => v.vin).map((v) => [v.vin, formsSummary(calc.formsByVin, v.vin)]))
      }
      return json(200, {
        total: filtered.length,
        enAlcance: scoped.length,
        conAlertas: ventas.filter((v) => v.alertas.length).length,
        rows: filtered.slice(0, 300),
        frogmi,
        actualizado: masters.siga?.updatedAt || null,
      })
    }),
  })

  // ================= FROGMI =================
  app.http("frogmi-resumen", {
    methods: ["GET"], authLevel: "anonymous", route: "frogmi/resumen",
    handler: handle(async (request) => {
      const user = await currentUser(request)
      if (!user) return json(401, { message: "Sesión no válida." })
      const full = isExperienceUser(user)
      const ownLocal = LOCAL_ROLES.has(user.role) ? userFrogmiLocal(user) : ""
      if (!full && !ownLocal) return forbidden()
      const [masters, config] = await Promise.all([frogmiMasters(), readFrogmiConfig()])
      const calc = computeFrogmi(masters, config, String(request.query.get("corte") || ""))
      const { formsByVin, rows, ...rest } = calc
      const base = {
        ...rest, umbral: UMBRAL, forms: JUNIOR_FORMS, locales: JUNIOR_LOCALS, tmLocales: TM_LOCALS, evolutivo: EVOLUTIVO_BASE,
        fuentes: { notificados: masters.notificados?.updatedAt || null, frogmi: masters.frogmi?.updatedAt || null, siga: masters.siga?.updatedAt || null },
      }
      if (full) return json(200, { ...base, alcance: "RED", rows: rows.map(publicFrogmiRow) })
      // Alcance local (junior y jefatura): solo su local, sin aprobaciones ni ranking de otros locales.
      // Todos los totales se recalculan con el local, para no mostrar cifras de la red.
      const localRows = rows.filter((r) => r.local === ownLocal)
      const local = calc.porLocal.find((l) => l.local === ownLocal) || null
      const evaluables = localRows.filter((r) => !r.exclusion)
      const juniorRows = evaluables.filter((r) => r.activo)
      const pctOf = (ok, total) => (total ? Math.round((ok * 1000) / total) / 10 : null)
      const juniorOk = juniorRows.reduce((sum, r) => sum + r.juniorOk, 0)
      const entregaOk = evaluables.filter((r) => r.forms.ENTREGA).length
      const exclusiones = {}
      for (const r of localRows) if (r.exclusion) exclusiones[r.exclusion] = (exclusiones[r.exclusion] || 0) + 1
      const tmRows = calc.tourManager.rows.filter((t) => TM_LOCALS.find((l) => l.key === t.key)?.junior === ownLocal)
      const tmActive = tmRows.filter((r) => r.activo)
      const tmSum = (k) => tmActive.reduce((sum, r) => sum + (k === "registros" ? r.fechas.length : r[k]), 0)
      const tourManager = { planificados: tmSum("planificados"), validos: tmSum("validos"), pendientes: tmSum("pendientes"), registros: tmSum("registros"), rows: tmRows }
      tourManager.pct = pctOf(tourManager.validos, tourManager.planificados)
      return json(200, {
        ...base,
        alcance: "LOCAL", local: ownLocal,
        universo: { notificados: localRows.length, evaluables: evaluables.length, junior: juniorRows.length, exclusiones },
        porLocal: local && local.vin ? [local] : [],
        formTotals: local ? local.forms : [],
        junior: { ok: juniorOk, total: juniorRows.length * 4, pct: pctOf(juniorOk, juniorRows.length * 4), completos: juniorRows.filter((r) => r.juniorOk === 4).length, cumplen: (local?.forms || []).filter((f) => f.pct !== null && f.pct >= UMBRAL * 100).length },
        entrega: { ok: entregaOk, total: evaluables.length, pct: pctOf(entregaOk, evaluables.length), ranking: calc.entrega.ranking.filter((v) => v.local === ownLocal) },
        ajustada: { forms: [], total: { ok: 0, total: 0, pct: null }, arrastres: 0, llegadasTardias: 0 },
        pendientesAprobacion: [],
        tourManager,
        rows: localRows.map(publicFrogmiRow),
      })
    }),
  })

  app.http("frogmi-aprobar", {
    methods: ["POST"], authLevel: "anonymous", route: "frogmi/aprobar",
    handler: handle(async (request) => {
      const user = await currentUser(request)
      if (!isExperienceUser(user)) return forbidden()
      const data = await body(request)
      const key = String(data.key || "")
      const decision = data.decision === "APROBADO" ? "APROBADO" : data.decision === "RECHAZADO" ? "RECHAZADO" : data.decision === "QUITAR" ? "QUITAR" : ""
      if (!key || !decision) return json(400, { message: "Falta el cruce o la decisión." })
      const vin = String(data.vin || "").toUpperCase().replace(/[^A-Z0-9]/g, "")
      if (decision === "APROBADO" && vin.length !== 17) return json(400, { message: "Indica el VIN completo que corresponde." })
      const config = await readFrogmiConfig()
      if (decision === "QUITAR") delete config.aprobaciones[key]
      else config.aprobaciones[key] = { vin: decision === "APROBADO" ? vin : "", decision, by: user.email, byName: user.name, at: new Date().toISOString() }
      await writeJsonBlob(FROGMI_CONFIG, config)
      return json(200, { message: decision === "APROBADO" ? "Cruce aprobado. Se usará también en los próximos cortes." : decision === "RECHAZADO" ? "Cruce rechazado: no cuenta para el cumplimiento." : "Decisión eliminada." })
    }),
  })

  app.http("frogmi-config", {
    methods: ["POST"], authLevel: "anonymous", route: "frogmi/config",
    handler: handle(async (request) => {
      const user = await currentUser(request)
      if (!isExperienceUser(user)) return forbidden()
      const data = await body(request)
      const corte = String(data.corte || "")
      if (!/^\d{4}-\d{2}$/.test(corte)) return json(400, { message: "Corte no válido." })
      const config = await readFrogmiConfig()
      if (data.activos && typeof data.activos === "object") {
        const clean = {}
        for (const l of JUNIOR_LOCALS) if (typeof data.activos[l.key] === "boolean") clean[l.key] = data.activos[l.key]
        config.activos[corte] = { ...(config.activos[corte] || {}), ...clean }
      }
      if (data.tourManager && typeof data.tourManager === "object") {
        const local = String(data.tourManager.local || "")
        if (!TM_LOCALS.some((l) => l.key === local)) return json(400, { message: "Local de Tour Manager no válido." })
        const fechas = (Array.isArray(data.tourManager.fechas) ? data.tourManager.fechas : []).map(String).filter((f) => /^\d{4}-\d{2}-\d{2}$/.test(f))
        config.tourManager[corte] = { ...(config.tourManager[corte] || {}), [local]: [...new Set(fechas)].sort() }
      }
      config.updatedAt = new Date().toISOString()
      config.updatedBy = user.email
      await writeJsonBlob(FROGMI_CONFIG, config)
      return json(200, { message: "Configuración guardada." })
    }),
  })

  // ================= GESPARK =================
  app.http("gespark", {
    methods: ["GET"], authLevel: "anonymous", route: "gespark",
    handler: handle(async (request) => {
      const user = await currentUser(request)
      if (!isExperienceUser(user)) return forbidden()
      const [traslados, extranet] = await Promise.all([readMaster("traslados"), readMaster("extranet")])
      return json(200, computeGespark({ traslados, extranet }, String(request.query.get("mes") || "")))
    }),
  })
}
