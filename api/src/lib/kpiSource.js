import { getAppConfig, setAppConfig } from "./store.js"

const URL_KEY = "KPI_EXCEL_URL"
const SNAPSHOT_KEY = "KPI_LAST_SNAPSHOT"

export async function getKpiExcelUrl() {
  const stored = await getAppConfig(URL_KEY)
  return String(stored?.value || process.env.KPI_EXCEL_URL || "").trim()
}

export async function saveKpiExcelUrl(url, updatedBy) {
  const value = String(url || "").trim()
  if (!value.startsWith("https://")) throw new Error("El enlace debe comenzar con https://")
  return setAppConfig(URL_KEY, value, { updatedBy: String(updatedBy || "") })
}

export async function saveKpiSnapshot(snapshot, updatedBy) {
  const value = JSON.stringify(snapshot)
  return setAppConfig(SNAPSHOT_KEY, value, { updatedBy: String(updatedBy || "") })
}

export async function getKpiSnapshot() {
  const stored = await getAppConfig(SNAPSHOT_KEY)
  if (!stored?.value) return null
  try {
    return JSON.parse(String(stored.value))
  } catch {
    return null
  }
}
