// Contabilidad · lectura de PDF de listas de precio y bonos de marca.
// Misma lógica del Cargador PDF de Administración de Ventas (lector_pdf_y_bonos.js):
// el texto se arma por líneas según la posición en la página y cada formato de marca tiene su lector.
import { createHash } from "node:crypto"

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex")
}

// Texto de cada página, agrupando los trozos que comparten altura en una misma línea.
export async function textoPaginas(buffer) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs")
  const pdf = await getDocument({ data: new Uint8Array(buffer), isEvalSupported: false, useSystemFonts: false }).promise
  const paginas = []
  for (let p = 1; p <= pdf.numPages; p++) {
    const tc = await (await pdf.getPage(p)).getTextContent()
    const items = tc.items.filter((i) => i.str && i.str.trim()).map((i) => ({ s: i.str, x: i.transform[4], y: i.transform[5], w: i.width }))
    items.sort((a, b) => b.y - a.y || a.x - b.x)
    const lines = []
    for (const it of items) {
      const line = lines.find((l) => Math.abs(l.y - it.y) < 2.5)
      if (line) line.items.push(it)
      else lines.push({ y: it.y, items: [it] })
    }
    lines.sort((a, b) => b.y - a.y)
    paginas.push(lines.map((l) => {
      l.items.sort((a, b) => a.x - b.x)
      let s = ""
      let end = null
      for (const it of l.items) {
        if (end !== null) s += it.x - end > 4 ? "   " : " "
        s += it.s
        end = it.x + it.w
      }
      return s
    }).join("\n"))
  }
  await pdf.destroy()
  return paginas
}

const MESES = { ENERO: 1, FEBRERO: 2, MARZO: 3, ABRIL: 4, MAYO: 5, JUNIO: 6, JULIO: 7, AGOSTO: 8, SEPTIEMBRE: 9, SETIEMBRE: 9, OCTUBRE: 10, NOVIEMBRE: 11, DICIEMBRE: 12 }
const sinTildes = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "")
const diasMes = (anio, mes) => new Date(anio, mes, 0).getDate()
const p2 = (n) => String(n).padStart(2, "0")
const monto = (t) => (t.trim() === "-" || t.trim() === "" ? 0 : parseInt(t.replace(/[^\d]/g, ""), 10))

// Un lector por formato de marca: reconoce el PDF y devuelve vigencia y filas (montos brutos, con IVA).
const LECTORES = [{
  nombre: "lista_chery_v1",
  marca: "CHERY",
  reconoce: (txt) => {
    const t = sinTildes(txt).toUpperCase()
    return t.includes("BONO CHERY") && t.includes("CODIGO CIT") && t.includes("LISTA DE PRECIOS")
  },
  leer(paginas) {
    const t = sinTildes(paginas.join("\n")).toUpperCase()
    const meta = { titulo: null, canal: null, desde: null, hasta: null, observaciones: [], avisos: [] }
    const m = t.match(/LISTA DE PRECIOS\s+(\d{1,2})\s+([A-Z]+)/)
    const y = t.match(/\b(20\d\d)\b/)
    if (m && y && MESES[m[2]]) {
      const mes = MESES[m[2]]
      const anio = +y[1]
      const ultimo = diasMes(anio, mes)
      meta.titulo = `Lista de Precios ${m[1]} ${m[2][0] + m[2].slice(1).toLowerCase()} ${anio}`
      meta.desde = `${anio}-${p2(mes)}-${p2(+m[1])}`
      meta.hasta = `${anio}-${p2(mes)}-${p2(ultimo)}`
      const v = t.match(/HASTA EL (\d{1,2}) DE ([A-Z]+)/)
      if (v && MESES[v[2]] && +v[1] > diasMes(anio, MESES[v[2]])) meta.avisos.push(`El PDF dice vigencia hasta el ${v[1]} de ${v[2].toLowerCase()}; se usó el último día real del mes (${ultimo}).`)
      else if (v && MESES[v[2]]) meta.hasta = `${anio}-${p2(MESES[v[2]])}-${p2(+v[1])}`
    }
    if (t.includes("CANAL TRADICIONAL")) meta.canal = "Tradicional"
    const re = /^\s*([A-Z0-9][A-Za-z0-9 .\-()/]+?)\s{2,}(CY[0-9A-Z]+-\d)\s+(Euro\s?\w+)\s+(\d+)\s?%\s+(.*)$/
    const filas = []
    let familia = null
    paginas.forEach((pagina, i) => pagina.split("\n").forEach((linea) => {
      const r = linea.match(re)
      if (!r) {
        const s = linea.trim()
        const cand = s.split("   ")[0].trim()
        if (s && /^[A-Z0-9 ]{3,40}$/.test(cand) && !s.includes("$") && !s.includes("CIT") && /^(TIGGO|HIMLA|ARRIZO|EXEED|OMODA|JAECOO|[A-Z]+ ?\d)/.test(cand)) familia = cand
        return
      }
      const ms = [...r[5].matchAll(/\$\s*([\d,.]+|-)/g)].map((x) => monto(x[1]))
      if (ms.length !== 9 && ms.length !== 10) {
        meta.observaciones.push(`Fila no reconocida (${ms.length} montos): ${linea.trim().slice(0, 80)}`)
        return
      }
      const fila = {
        linea: filas.length + 1,
        pagina: i + 1,
        familia,
        modelo: r[1].replace(/\s+/g, " ").trim(),
        cit: r[2],
        norma: r[3].replace(" ", ""),
        margen: +r[4] / 100,
        precioConcesionario: ms[0],
        precioPublico: ms[1],
        bonoMarcaCliente: ms[2],
        bonoFinanciamiento: ms[4],
        bonoVpp: ms[6],
        precioFinal: ms[7],
        netoSinVpp: ms.length === 10 ? ms[8] : null,
        bonoMarcaPago: ms[ms.length - 1],
      }
      if (ms[1] - ms[2] !== ms[3]) meta.observaciones.push(`${fila.modelo}: precio público − bono no cuadra con "precio c/bonos".`)
      filas.push(fila)
    }))
    return { meta, filas }
  },
}]

// Lee un PDF: identifica la marca por su formato. Si ninguno lo reconoce, queda "Revisar" y no calcula.
export async function leerPdf(buffer) {
  const paginas = await textoPaginas(buffer)
  const lector = LECTORES.find((l) => l.reconoce(paginas.join("\n")))
  if (!lector) return { estado: "REVISAR", marca: null, lector: null, meta: { observaciones: ["No hay un lector para este formato de PDF."], avisos: [] }, filas: [] }
  const { meta, filas } = lector.leer(paginas)
  const estado = filas.length && meta.desde && meta.hasta ? "OK" : "REVISAR"
  return { estado, marca: lector.marca, lector: lector.nombre, meta, filas }
}
