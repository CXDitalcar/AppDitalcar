import { appConfig } from "../config"
import { getAccessToken } from "./auth"


// ======================================================
// TIPOS
// ======================================================

type SiteInfo = {
  id: string
}


type ListColumn = {
  name: string
  displayName?: string
}


export type Solicitud = {
  id: string
  fields: Record<string, any>
}


export type SolicitudWriteInput = {
  title?: string

  // ----------------------------------------------
  // COLUMNAS HISTÓRICAS
  // ----------------------------------------------

  areaResponsable?: string
  categoria?: string
  seccion?: string
  solicitud?: string
  fechaSolicitud?: string
  local?: string
  estado?: string
  jefeLocal?: string

  // ----------------------------------------------
  // NUEVO WORKFLOW
  // ----------------------------------------------

  procesoCodigo?: string
  procesoVersion?: number

  solicitanteEmail?: string
  solicitanteNombre?: string

  estadoFlujo?: string

  responsableActualEmail?: string
  responsableActualNombre?: string

  slaAprobacionSnapshot?: number
  slaResolucionSnapshot?: number
  confirmacionHorasSnapshot?: number

  slaInicioAprobacion?: string
  slaPausaInicio?: string
  slaPausaMinutos?: number

  slaInicioResolucion?: string

  fechaLimiteConfirmacion?: string

  reabierta?: boolean
  cierreAutomatico?: boolean

  // ----------------------------------------------
  // TRAZABILIDAD FORMULARIOS
  // ----------------------------------------------

  origenFormularioCodigo?: string
  origenEjecucionID?: string
  origenBrechaID?: string
}


// ======================================================
// CACHE
// ======================================================

let siteIdCache:
  string | null =
  null


let columnsCache:
  ListColumn[] | null =
  null


// ======================================================
// GRAPH BASE
// ======================================================

async function graph<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token =
    await getAccessToken()


  const response =
    await fetch(
      `https://graph.microsoft.com/v1.0${path}`,
      {
        ...init,

        headers: {
          Authorization:
            `Bearer ${token}`,

          "Content-Type":
            "application/json",

          ...(init.headers ?? {}),
        },
      }
    )


  const text =
    await response.text()


  if (!response.ok) {
    throw new Error(
      `Graph ${response.status}: ${text}`
    )
  }


  if (!text) {
    return undefined as T
  }


  return JSON.parse(
    text
  ) as T
}


// ======================================================
// SITIO SHAREPOINT
// ======================================================

export async function getSiteId() {
  if (siteIdCache) {
    return siteIdCache
  }


  const {
    hostname,
    sitePath,
  } =
    appConfig.sharePoint


  const site =
    await graph<SiteInfo>(
      `/sites/${hostname}:${sitePath}`
    )


  siteIdCache =
    site.id


  return site.id
}


// ======================================================
// COLUMNAS DE LA LIST
// ======================================================

async function getSolicitudColumns() {
  if (columnsCache) {
    return columnsCache
  }


  const siteId =
    await getSiteId()


  const listId =
    appConfig.sharePoint
      .solicitudesListId


  const data =
    await graph<{
      value: ListColumn[]
    }>(
      `/sites/${siteId}/lists/${listId}/columns?$top=200`
    )


  columnsCache =
    data.value


  return data.value
}


// ======================================================
// UTILIDADES DE COLUMNAS
// ======================================================

function normalize(
  value: string
) {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim()
    .toLowerCase()
}


function findColumn(
  columns: ListColumn[],
  aliases: string[]
) {
  for (
    const alias of aliases
  ) {
    const normalizedAlias =
      normalize(alias)


    const match =
      columns.find(
        (column) =>
          normalize(
            column.name
          ) ===
            normalizedAlias ||
          normalize(
            column.displayName ??
              ""
          ) ===
            normalizedAlias
      )


    if (match) {
      return match.name
    }
  }


  return undefined
}


function addField(
  target:
    Record<string, any>,
  columns:
    ListColumn[],
  aliases:
    string[],
  value:
    unknown
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return
  }


  const columnName =
    findColumn(
      columns,
      aliases
    )


  if (!columnName) {
    return
  }


  target[
    columnName
  ] =
    value
}


// ======================================================
// CONVERTIR INPUT APP → CAMPOS SHAREPOINT
// ======================================================

async function buildSolicitudFields(
  input:
    SolicitudWriteInput
) {
  const columns =
    await getSolicitudColumns()


  const fields:
    Record<
      string,
      any
    > = {}


  // ==================================================
  // CAMPOS HISTÓRICOS
  // ==================================================

  addField(
    fields,
    columns,
    ["Title"],
    input.title ??
      input.solicitud ??
      "Solicitud Ditalcar"
  )


  addField(
    fields,
    columns,
    [
      "Área responsable",
      "Area responsable",
      "AreaResponsable",
    ],
    input.areaResponsable
  )


  addField(
    fields,
    columns,
    [
      "Categorías",
      "Categorias",
      "Categoría",
      "Categoria",
    ],
    input.categoria
  )


  addField(
    fields,
    columns,
    [
      "Sección",
      "Seccion",
    ],
    input.seccion
  )


  addField(
    fields,
    columns,
    ["Solicitud"],
    input.solicitud
  )


  addField(
    fields,
    columns,
    [
      "Fecha solicitud",
      "Fecha Solicitud",
      "FechaSolicitud",
    ],
    input.fechaSolicitud
  )


  addField(
    fields,
    columns,
    ["Local"],
    input.local
  )


  addField(
    fields,
    columns,
    ["Estado"],
    input.estado
  )


  addField(
    fields,
    columns,
    [
      "Jefe de Local",
      "Jefe de local",
      "JefeLocal",
    ],
    input.jefeLocal
  )


  // ==================================================
  // WORKFLOW NUEVO
  // ==================================================

  addField(
    fields,
    columns,
    ["ProcesoCodigo"],
    input.procesoCodigo
  )


  addField(
    fields,
    columns,
    ["ProcesoVersion"],
    input.procesoVersion
  )


  addField(
    fields,
    columns,
    ["SolicitanteEmail"],
    input.solicitanteEmail
  )


  addField(
    fields,
    columns,
    ["SolicitanteNombre"],
    input.solicitanteNombre
  )


  addField(
    fields,
    columns,
    ["EstadoFlujo"],
    input.estadoFlujo
  )


  addField(
    fields,
    columns,
    ["ResponsableActualEmail"],
    input.responsableActualEmail
  )


  addField(
    fields,
    columns,
    ["ResponsableActualNombre"],
    input.responsableActualNombre
  )


  addField(
    fields,
    columns,
    ["SLAAprobacionSnapshot"],
    input.slaAprobacionSnapshot
  )


  addField(
    fields,
    columns,
    ["SLAResolucionSnapshot"],
    input.slaResolucionSnapshot
  )


  addField(
    fields,
    columns,
    ["ConfirmacionHorasSnapshot"],
    input.confirmacionHorasSnapshot
  )


  addField(
    fields,
    columns,
    ["SLAInicioAprobacion"],
    input.slaInicioAprobacion
  )


  addField(
    fields,
    columns,
    ["SLAPausaInicio"],
    input.slaPausaInicio
  )


  addField(
    fields,
    columns,
    ["SLAPausaMinutos"],
    input.slaPausaMinutos
  )


  addField(
    fields,
    columns,
    ["SLAInicioResolucion"],
    input.slaInicioResolucion
  )


  addField(
    fields,
    columns,
    ["FechaLimiteConfirmacion"],
    input.fechaLimiteConfirmacion
  )


  addField(
    fields,
    columns,
    ["Reabierta"],
    input.reabierta
  )


  addField(
    fields,
    columns,
    ["CierreAutomatico"],
    input.cierreAutomatico
  )


  // ==================================================
  // ORIGEN FORMULARIO
  // ==================================================

  addField(
    fields,
    columns,
    ["OrigenFormularioCodigo"],
    input.origenFormularioCodigo
  )


  addField(
    fields,
    columns,
    ["OrigenEjecucionID"],
    input.origenEjecucionID
  )


  addField(
    fields,
    columns,
    ["OrigenBrechaID"],
    input.origenBrechaID
  )


  return fields
}


// ======================================================
// LEER SOLICITUDES
// ======================================================

export async function getSolicitudes():
  Promise<Solicitud[]> {
  const siteId =
    await getSiteId()


  const listId =
    appConfig.sharePoint
      .solicitudesListId


  const data =
    await graph<{
      value: Solicitud[]
    }>(
      `/sites/${siteId}/lists/${listId}/items?expand=fields&$top=500`
    )


  return data.value
}


// ======================================================
// LEER UNA SOLICITUD
// ======================================================

export async function getSolicitud(
  id: string
): Promise<Solicitud> {
  const siteId =
    await getSiteId()


  const listId =
    appConfig.sharePoint
      .solicitudesListId


  return graph<Solicitud>(
    `/sites/${siteId}/lists/${listId}/items/${id}?expand=fields`
  )
}


// ======================================================
// CREAR SOLICITUD REAL
// ======================================================

export async function createSolicitud(
  input:
    SolicitudWriteInput
): Promise<Solicitud> {
  const siteId =
    await getSiteId()


  const listId =
    appConfig.sharePoint
      .solicitudesListId


  const fields =
    await buildSolicitudFields(
      input
    )


  return graph<Solicitud>(
    `/sites/${siteId}/lists/${listId}/items`,
    {
      method: "POST",

      body:
        JSON.stringify({
          fields,
        }),
    }
  )
}


// ======================================================
// ACTUALIZAR SOLICITUD
// ======================================================

export async function updateSolicitud(
  id: string,
  input:
    SolicitudWriteInput
) {
  const siteId =
    await getSiteId()


  const listId =
    appConfig.sharePoint
      .solicitudesListId


  const fields =
    await buildSolicitudFields(
      input
    )


  await graph<void>(
    `/sites/${siteId}/lists/${listId}/items/${id}/fields`,
    {
      method: "PATCH",

      body:
        JSON.stringify(
          fields
        ),
    }
  )
}


// ======================================================
// EVITAR DUPLICADO DESDE UNA BRECHA
// ======================================================

export async function findActiveSolicitudByBreach(
  breachId: string
): Promise<
  Solicitud | undefined
> {
  if (!breachId) {
    return undefined
  }


  const solicitudes =
    await getSolicitudes()


  const activeStatuses =
    new Set([
      "RECIBIDA",
      "INFORMACION_REQUERIDA",
      "PENDIENTE_APROBACION",
      "APROBADA",
      "APROBADA_CON_AJUSTE",
      "EN_GESTION",
      "RESUELTA_POR_CONFIRMAR",
    ])


  return solicitudes.find(
    (item) => {
      const origin =
        String(
          item.fields
            ?.OrigenBrechaID ??
            ""
        )


      const status =
        String(
          item.fields
            ?.EstadoFlujo ??
            ""
        )


      return (
        origin ===
          breachId &&
        activeStatuses.has(
          status
        )
      )
    }
  )
}


// ======================================================
// USUARIO ACTUAL GRAPH
// ======================================================

export async function getCurrentUser() {
  return graph<{
    displayName: string
    mail?: string
    userPrincipalName: string
  }>(
    "/me?$select=displayName,mail,userPrincipalName"
  )
}
