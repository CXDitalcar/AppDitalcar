// Interfaces separadas por tema, con su propio link y el mismo ingreso/usuarios.
// Al entrar por /showroom, la pestaña queda en "Gestión de Showroom" hasta salir.
export type InterfaceId = "showroom"

export const INTERFACES: Record<InterfaceId, { name: string; description: string; home: string }> = {
  showroom: {
    name: "Gestión de Showroom",
    description: "Solicitudes de experiencia del local y Ruta de Experiencia.",
    home: "/showroom",
  },
}

const KEY = "ditalapp-interfaz"

export function currentInterface(): InterfaceId | null {
  const path = window.location.pathname
  // Dominio propio (por ejemplo showroom.ditalcar.cl apuntando a la misma app): entra directo a la interfaz.
  if (/^showroom\./i.test(window.location.hostname)) return "showroom"
  try {
    if (path === "/showroom" || path.startsWith("/showroom/")) {
      sessionStorage.setItem(KEY, "showroom")
      return "showroom"
    }
    const stored = sessionStorage.getItem(KEY)
    return stored === "showroom" ? stored : null
  } catch {
    return path.startsWith("/showroom") ? "showroom" : null
  }
}

export function leaveInterface() {
  try { sessionStorage.removeItem(KEY) } catch { /* sin almacenamiento */ }
  // Desde el dominio propio de Showroom se vuelve al dominio principal de DitalApp si está configurado.
  const main = import.meta.env.VITE_MAIN_APP_URL as string | undefined
  if (/^showroom\./i.test(window.location.hostname) && main) window.location.assign(main)
  else window.location.assign("/")
}
