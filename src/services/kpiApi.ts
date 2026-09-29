export type KpiPeriod = {
  monthNumber: number
  month: string
  year: number
}

export type KpiSummary = {
  period: KpiPeriod
  notesSales: number
  newVehicleSales: number
  newVehicleValid: number
  newVehicleCancelled: number
  newVehicleOrdersBilled: number
  usedVehicleSales: number
  usedVehicleValid: number
  usedVehicleCancelled: number
  usedVehicleOrdersBilled: number
  validSalesTotal: number
  cancelledTotal: number
  ordersBilledTotal: number
  billingCurrentTotal: number
  billingCurrentNew: number
  billingCurrentUsed: number
  billingPreviousTotal: number
  billingPreviousNew: number
  billingPreviousUsed: number
  variationTotal: number
  variationNew: number
  variationUsed: number
  pendingInvoiceNew: number
  pendingInvoiceUsed: number
  goal: number | string
  compliance: number
  remaining: number
}

export type KpiDetailRow = {
  row: number
  type: "summary" | "detail"
  brand: string
  local: string
  sales: number | string
  billed: number | string
  goal: number | string
  compliance: number
}

export type KpiEvolutionPoint = {
  month: string
  value: number
}

export type KpiData = {
  summary: KpiSummary
  detail: KpiDetailRow[]
  evolution: {
    total: KpiEvolutionPoint[]
    newVehicles: KpiEvolutionPoint[]
    usedVehicles: KpiEvolutionPoint[]
  }
  meta: {
    sourceUrl: string
    finalUrl?: string
    checkedAt: string
    lastModified?: string
    dashboardSheet: string
    graphsSheet: string
    fileName?: string
  }
  stale?: boolean
  warning?: string
}

async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Error ${response.status}`)
  return payload as T
}

export async function getKpiSource() {
  return apiJson<{ configured: boolean; url: string; lastSnapshotAt?: string | null }>("/api/kpi/source")
}

export async function saveKpiSource(url: string) {
  return apiJson<{ message: string; data: KpiData }>("/api/kpi/source", {
    method: "POST",
    body: JSON.stringify({ url }),
  })
}

export async function getKpiData() {
  return apiJson<KpiData>("/api/kpi/data")
}
