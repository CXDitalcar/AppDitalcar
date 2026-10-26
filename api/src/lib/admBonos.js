// Contabilidad · bonos por cobrar a la marca por cada NV.
// Reglas del paquete de Administración de Ventas (montos del PDF son brutos, con IVA):
//   Bono marca  = "Uso CES · Bono marca" ÷ 1,19            siempre
//   Bono SCF    = bono financiamiento ÷ 1,19                si la NV financió con SCF (Forum)
//   Bono VPP    = (bono VPP ÷ 1,19) × (1 − margen)          si la NV tuvo retoma
//   Por cobrar  = suma neta × 1,19, redondeada a la centena
// La NV recibe el bono de la lista vigente a la fecha de su factura de venta.

const IVA = 1.19
const SINONIMOS = { "4WD": "4X4", "2WD": "4X2", AT: "AUT", CVT: "AUT", DCT: "AUT", MT: "MT" }
const sinTildes = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "")

function tokens(nombre) {
  return new Set(sinTildes(nombre).toUpperCase().replace(/[()]/g, " ").split(/\s+/)
    .filter((t) => t && !/^\d\.\d+T?D?$/.test(t) && t !== "ORIGINAL")
    .map((t) => SINONIMOS[t] || t))
}

function familiaDe(nombre) {
  const m = sinTildes(nombre).toUpperCase().match(/^(TIGGO \d( PRO MAX| PRO)?|HIMLA|ARRIZO \d( PRO)?)/)
  return m ? m[1] : null
}

// Enlaza el modelo de SIGA con una fila de la lista por parecido de palabras dentro de la misma familia.
// Bajo 60 % no se enlaza; bajo 100 % (o empate) queda "por confirmar".
export function enlazarModelo(modeloSistema, filas) {
  const familia = familiaDe(modeloSistema)
  if (!familia) return null
  const tm = tokens(modeloSistema)
  const candidatos = []
  for (const fila of filas) {
    if (familiaDe(fila.modelo) !== familia) continue
    const tl = tokens(fila.modelo)
    const inter = [...tm].filter((x) => tl.has(x)).length
    const union = new Set([...tm, ...tl]).size
    candidatos.push({ puntaje: inter / union, fila })
  }
  if (!candidatos.length) return null
  candidatos.sort((a, b) => b.puntaje - a.puntaje || b.fila.linea - a.fila.linea)
  const mejor = candidatos[0]
  if (mejor.puntaje < 0.6) return null
  const empate = candidatos.length > 1 && Math.abs(candidatos[1].puntaje - mejor.puntaje) < 1e-9
  return { fila: mejor.fila, puntaje: Math.round(mejor.puntaje * 1000) / 1000, porConfirmar: empate || mejor.puntaje < 1 }
}

export function bonoDeFila(fila, { financiaScf, tieneRetoma }) {
  const marca = Math.round((fila.bonoMarcaPago || 0) / IVA)
  const scf = financiaScf ? Math.round((fila.bonoFinanciamiento || 0) / IVA) : 0
  const vpp = tieneRetoma ? Math.round(Math.round((fila.bonoVpp || 0) / IVA) * (1 - (fila.margen || 0))) : 0
  const neto = marca + scf + vpp
  return { marca, scf, vpp, neto, bruto: Math.round((neto * IVA) / 100) * 100 }
}

// SCF: la institución de crédito de SIGA nombra a Forum / SCF. Sin crédito informado, no se sabe.
export function financiaConScf(institucion) {
  const t = sinTildes(institucion).toUpperCase().trim()
  if (!t) return null
  return /FORUM|\bSCF\b/.test(t)
}

const enVigencia = (fecha, lista) => Boolean(fecha) && lista.desde <= fecha && fecha <= lista.hasta

// Calcula los bonos de las NV de una marca con las listas cargadas.
// nvs: [{ nv, marca, modelo, fechaFactura, fechaNV, nFactura, local, institucionCredito, nula }]
// condiciones: { [nv]: { financiaScf?: boolean, tieneRetoma?: boolean } } (ingresadas por Contabilidad)
export function calcularBonos({ listas, nvs, condiciones = {}, marca = "CHERY" }) {
  const filas = []
  const sinLista = []
  const marcaKey = sinTildes(marca).toUpperCase()
  for (const nv of nvs) {
    if (nv.nula || !sinTildes(nv.marca).toUpperCase().includes(marcaKey)) continue
    const fecha = nv.fechaFactura || nv.fechaNV
    const lista = listas.find((l) => l.marca === marcaKey && enVigencia(fecha, l))
    if (!lista) {
      if (fecha) sinLista.push({ nv: nv.nv, fecha, modelo: nv.modelo, local: nv.local, mes: fecha.slice(0, 7) })
      continue
    }
    const enlace = enlazarModelo(nv.modelo, lista.filas)
    const manual = condiciones[nv.nv] || {}
    const scfSiga = financiaConScf(nv.institucionCredito)
    const financiaScf = manual.financiaScf ?? scfSiga
    const tieneRetoma = manual.tieneRetoma ?? null
    const bono = enlace ? bonoDeFila(enlace.fila, { financiaScf, tieneRetoma }) : null
    const revision = !enlace
      ? "SIN_MODELO"
      : enlace.porConfirmar
        ? "MODELO_POR_CONFIRMAR"
        : financiaScf === null || tieneRetoma === null
          ? "SOLO_MARCA"
          : "CALCULADO"
    filas.push({
      nv: nv.nv,
      fecha,
      factura: nv.nFactura || "",
      local: nv.local || "",
      modeloSistema: nv.modelo,
      modeloLista: enlace?.fila.modelo || null,
      puntaje: enlace?.puntaje ?? null,
      lista: lista.sha,
      financiaScf,
      tieneRetoma,
      bono,
      revision,
    })
  }
  filas.sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)) || String(a.nv).localeCompare(String(b.nv)))
  const conBono = filas.filter((f) => f.bono)
  const totales = {
    nv: conBono.length,
    neto: conBono.reduce((s, f) => s + f.bono.neto, 0),
    bruto: conBono.reduce((s, f) => s + f.bono.bruto, 0),
    porRevision: filas.reduce((acc, f) => ({ ...acc, [f.revision]: (acc[f.revision] || 0) + 1 }), {}),
    sinLista: sinLista.length,
  }
  return { filas, sinLista, totales }
}
