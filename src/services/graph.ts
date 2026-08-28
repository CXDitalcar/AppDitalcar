import { appConfig } from "../config"
import { getAccessToken } from "./auth"

type SiteInfo = { id: string }
export type Solicitud = { id: string; fields: Record<string, any> }
let siteIdCache: string | null = null

async function graph<T>(path: string): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Graph ${res.status}: ${await res.text()}`)
  return res.json()
}

export async function getSiteId() {
  if (siteIdCache) return siteIdCache
  const { hostname, sitePath } = appConfig.sharePoint
  const site = await graph<SiteInfo>(`/sites/${hostname}:${sitePath}`)
  siteIdCache = site.id
  return site.id
}

export async function getSolicitudes(): Promise<Solicitud[]> {
  const siteId = await getSiteId()
  const listId = appConfig.sharePoint.solicitudesListId
  const data = await graph<{value: Solicitud[]}>(`/sites/${siteId}/lists/${listId}/items?expand=fields&$top=200`)
  return data.value
}

export async function getCurrentUser() {
  return graph<{ displayName:string; mail?:string; userPrincipalName:string }>("/me?$select=displayName,mail,userPrincipalName")
}
