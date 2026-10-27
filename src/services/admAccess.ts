// Acceso al módulo Administración de Ventas: Experiencia/PM + lista de correos definida por Experiencia.
export type AdmAccess = { allowed: boolean; canManage: boolean; emails?: string[] }

export async function getAdmAccess(): Promise<AdmAccess> {
  try {
    const response = await fetch("/api/adm/acceso", { credentials: "include" })
    if (!response.ok) return { allowed: false, canManage: false }
    return await response.json()
  } catch {
    return { allowed: false, canManage: false }
  }
}

export async function saveAdmAccess(emails: string[]) {
  const response = await fetch("/api/adm/acceso", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ emails }),
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload?.message || `Error ${response.status}`)
  return payload as AdmAccess & { message: string }
}
