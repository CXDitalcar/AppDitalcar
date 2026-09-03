import {
  mockRequests,
} from "../data/mockData"

import type {
  RequestItem,
  RequestTimelineItem,
} from "../types"


const REQUESTS_KEY =
  "ditalcar-pilot-requests-v3"


const TIMELINE_KEY =
  "ditalcar-pilot-request-timeline-v1"


// ======================================================
// COPIA INICIAL
// ======================================================

function cloneSeed():
  RequestItem[] {
  return JSON.parse(
    JSON.stringify(
      mockRequests
    )
  ) as RequestItem[]
}


// ======================================================
// LEER SOLICITUDES DEMO
// ======================================================

export function getDemoRequests():
  RequestItem[] {
  try {
    const raw =
      localStorage.getItem(
        REQUESTS_KEY
      )


    if (!raw) {
      return cloneSeed()
    }


    const parsed =
      JSON.parse(
        raw
      ) as RequestItem[]


    return Array.isArray(
      parsed
    )
      ? parsed
      : cloneSeed()
  } catch {
    return cloneSeed()
  }
}


// ======================================================
// GUARDAR SOLICITUDES
// ======================================================

export function saveDemoRequests(
  requests:
    RequestItem[]
) {
  localStorage.setItem(
    REQUESTS_KEY,
    JSON.stringify(
      requests
    )
  )
}


// ======================================================
// CREAR
// ======================================================

export function createDemoRequest(
  request: RequestItem
) {
  const requests =
    getDemoRequests()


  saveDemoRequests([
    request,

    ...requests.filter(
      (item) =>
        item.id !==
        request.id
    ),
  ])


  appendDemoTimeline({
    id:
      `${request.id}-created-${Date.now()}`,

    requestId:
      request.id,

    type:
      "CREATED",

    authorEmail:
      request.requesterEmail,

    authorName:
      request.requesterName,

    createdAt:
      request.createdAt,

    comment:
      "Solicitud ingresada en Ditalcar Colaboradores.",
  })
}


// ======================================================
// ACTUALIZAR
// ======================================================

export function updateDemoRequest(
  id: string,
  patch:
    Partial<RequestItem>
) {
  const requests =
    getDemoRequests().map(
      (request) =>
        request.id === id
          ? {
              ...request,
              ...patch,
            }
          : request
    )


  saveDemoRequests(
    requests
  )
}


// ======================================================
// HISTORIAL
// ======================================================

export function getDemoTimeline(
  requestId: string
):
  RequestTimelineItem[] {
  try {
    const raw =
      localStorage.getItem(
        TIMELINE_KEY
      )


    if (!raw) {
      return []
    }


    const items =
      JSON.parse(
        raw
      ) as RequestTimelineItem[]


    return items
      .filter(
        (item) =>
          item.requestId ===
          requestId
      )
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.createdAt
          ).getTime() -
          new Date(
            a.createdAt
          ).getTime()
      )
  } catch {
    return []
  }
}


// ======================================================
// AGREGAR MOVIMIENTO
// ======================================================

export function appendDemoTimeline(
  item:
    RequestTimelineItem
) {
  let items:
    RequestTimelineItem[] =
    []


  try {
    const raw =
      localStorage.getItem(
        TIMELINE_KEY
      )


    if (raw) {
      items =
        JSON.parse(
          raw
        ) as RequestTimelineItem[]
    }
  } catch {
    items = []
  }


  localStorage.setItem(
    TIMELINE_KEY,
    JSON.stringify([
      item,
      ...items,
    ])
  )
}


// ======================================================
// REINICIAR PILOTO
// ======================================================

export function resetDemoRequests() {
  localStorage.removeItem(
    REQUESTS_KEY
  )

  localStorage.removeItem(
    TIMELINE_KEY
  )
}


// ======================================================
// SIGUIENTE ID
// ======================================================

export function nextDemoRequestId() {
  const max =
    getDemoRequests().reduce(
      (
        current,
        request
      ) => {
        const value =
          Number(
            request.id.replace(
              /\D/g,
              ""
            )
          )


        return Number.isFinite(
          value
        )
          ? Math.max(
              current,
              value
            )
          : current
      },
      0
    )


  return `SOL-${String(
    max + 1
  ).padStart(
    3,
    "0"
  )}`
}
