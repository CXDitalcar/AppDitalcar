// Contabilidad (interfaz /contabilidad): listas de precio de marca en PDF y bonos por cobrar por NV.
// Solo para Administración (Jefatura y Gerencia) y Experiencia/PM, que administran la app.
// Debe coincidir con src/services/contabilidadAccess.ts.
import { json, body } from "./lib/http.js"
import { readMaster } from "./lib/datosStore.js"
import { leerPdf, sha256 } from "./lib/admPdf.js"
import { calcularBonos } from "./lib/admBonos.js"
import { getLista, listCondiciones, listListas, listasConFilas, saveCondicion, saveLista } from "./lib/admStore.js"

const CONTABILIDAD_ROLES = new Set(["JEFATURA_ADMINISTRACION", "GERENCIA_ADMINISTRACION"])
const PDF_MAX_BYTES = 15 * 1024 * 1024

export function registerAdmRoutes({ app, currentUser, isExperienceUser }) {
  const canAccess = (user) => Boolean(user) && (isExperienceUser(user) || CONTABILIDAD_ROLES.has(user.role))
  const handle = (fn) => async (request) => {
    try {
      const user = await currentUser(request)
      if (!user) return json(401, { message: "Sesión no válida." })
      if (!canAccess(user)) return json(403, { message: "Esta sección no está disponible para tu cargo." })
      return await fn(request, user)
    } catch (error) {
      console.error("admRoutes", error?.message)
      return json(500, { message: error?.message || "Error inesperado." })
    }
  }

  app.http("adm-listas", {
    methods: ["GET", "POST"], authLevel: "anonymous", route: "adm/listas",
    handler: handle(async (request, user) => {
      if (request.method === "GET") return json(200, { listas: await listListas() })
      const declared = Number(request.headers.get("content-length") || 0)
      if (declared > PDF_MAX_BYTES) return json(413, { message: "El PDF puede pesar como máximo 15 MB." })
      const buffer = Buffer.from(await request.arrayBuffer())
      if (!buffer.length) return json(400, { message: "El archivo está vacío." })
      if (buffer.length > PDF_MAX_BYTES) return json(413, { message: "El PDF puede pesar como máximo 15 MB." })
      if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") return json(400, { message: "El archivo no es un PDF." })
      let archivo = request.headers.get("x-file-name") || "lista.pdf"
      try { archivo = decodeURIComponent(archivo) } catch { /* nombre tal cual */ }

      const sha = sha256(buffer)
      const existente = await getLista(sha)
      if (existente) return json(200, { lista: existente, duplicado: true, message: `${archivo} ya estaba cargado. No se duplicó.` })

      const lectura = await leerPdf(buffer)
      const lista = await saveLista({ sha, buffer, archivo, lectura, cargadoPor: user.email })
      const message = lectura.estado === "OK"
        ? `${lista.titulo || archivo}: ${lista.filas} modelos leídos.`
        : `${archivo} quedó guardado para revisar: no hay un lector para este formato todavía.`
      return json(200, { lista, duplicado: false, message })
    }),
  })

  app.http("adm-bonos", {
    methods: ["GET"], authLevel: "anonymous", route: "adm/bonos",
    handler: handle(async () => {
      const [listas, siga, condiciones] = await Promise.all([listasConFilas(), readMaster("siga"), listCondiciones()])
      // Solo lo que el cálculo necesita: sin nombre, RUT ni contacto del cliente.
      const nvs = Object.values(siga.records || {}).map((r) => ({
        nv: r.nv, marca: r.marca, modelo: r.modelo, fechaFactura: r.fechaFactura, fechaNV: r.fechaNV,
        nFactura: r.nFactura, local: r.local, institucionCredito: r.institucionCredito, nula: r.nula,
      }))
      const marcas = [...new Set(listas.map((l) => l.marca))]
      const resultados = marcas.map((marca) => ({ marca, ...calcularBonos({ listas, nvs, condiciones, marca }) }))
      return json(200, {
        marcas: resultados,
        siga: { actualizado: siga.updatedAt || null, nv: nvs.length },
        listas: listas.map(({ filas, ...meta }) => ({ ...meta, filas: filas.length })),
      })
    }),
  })

  app.http("adm-condiciones", {
    methods: ["POST"], authLevel: "anonymous", route: "adm/condiciones",
    handler: handle(async (request, user) => {
      const data = await body(request)
      const nv = String(data.nv || "").trim()
      if (!/^\d{3,10}$/.test(nv)) return json(400, { message: "Falta el número de NV." })
      const flag = (value) => (value === true || value === false ? value : undefined)
      await saveCondicion(nv, { financiaScf: flag(data.financiaScf), tieneRetoma: flag(data.tieneRetoma) }, user.email)
      return json(200, { message: `NV ${nv} actualizada.` })
    }),
  })
}
