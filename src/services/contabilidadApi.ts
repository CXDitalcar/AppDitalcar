// Contabilidad: listas de precio de marca (PDF) y bonos por cobrar por NV.
export type ListaPrecio = {
  sha: string
  marca: string | null
  estado: "OK" | "REVISAR"
  archivo: string
  titulo: string | null
  canal: string | null
  desde: string | null
  hasta: string | null
  filas: number
  avisos: string[]
  observaciones: string[]
  cargadoPor: string
  cargadoEn: string
}

export type Revision = "CALCULADO" | "SOLO_MARCA" | "MODELO_POR_CONFIRMAR" | "SIN_MODELO"

export type BonoNv = {
  nv: string
  fecha: string
  factura: string
  local: string
  modeloSistema: string
  modeloLista: string | null
  puntaje: number | null
  lista: string
  financiaScf: boolean | null
  tieneRetoma: boolean | null
  bono: { marca: number; scf: number; vpp: number; neto: number; bruto: number } | null
  revision: Revision
}

export type BonosMarca = {
  marca: string
  filas: BonoNv[]
  sinLista: { nv: string; fecha: string; modelo: string; local: string; mes: string }[]
  totales: { nv: number; neto: number; bruto: number; porRevision: Partial<Record<Revision, number>>; sinLista: number }
}

export type BonosRespuesta = {
  marcas: BonosMarca[]
  siga: { actualizado: string | null; nv: number }
  listas: ListaPrecio[]
}

async function apiJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, { credentials: "include", ...init })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Error ${response.status}`)
  return payload as T
}

export const getListas = () => apiJson<{ listas: ListaPrecio[] }>("/api/adm/listas")
export const getBonos = () => apiJson<BonosRespuesta>("/api/adm/bonos")

export function subirLista(file: File) {
  return apiJson<{ lista: ListaPrecio; duplicado: boolean; message: string }>("/api/adm/listas", {
    method: "POST",
    headers: { "Content-Type": "application/pdf", "x-file-name": encodeURIComponent(file.name) },
    body: file,
  })
}

export function guardarCondicion(nv: string, cambio: { financiaScf?: boolean | null; tieneRetoma?: boolean | null }) {
  return apiJson<{ message: string }>("/api/adm/condiciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nv, ...cambio }),
  })
}
