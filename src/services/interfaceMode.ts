// Interfaces separadas por tema, con su propio link y el mismo ingreso/usuarios.
// Al entrar por su ruta (o por un dominio propio que empiece con su nombre), la pestaña
// queda en esa interfaz hasta salir con "Ir a DitalApp completa".
export type InterfaceId = "showroom" | "academia" | "adm"

export const INTERFACES: Record<InterfaceId, { name: string; description: string; home: string; host: RegExp }> = {
  showroom: {
    name: "Gestión de Showroom",
    description: "Solicitudes de experiencia del local y Ruta de Experiencia.",
    home: "/showroom",
    host: /^showroom\./i,
  },
  academia: {
    name: "Academia DITALCAR",
    description: "Cursos, modelo CONSULTA y material para tu día a día.",
    home: "/academia-ditalcar",
    host: /^academia\./i,
  },
  adm: {
    name: "Administración de Ventas",
    description: "Seguimiento de notas de venta, patentes, transferencias y bonos por marca.",
    home: "/adm-ventas",
    host: /^(adm|administracion)\./i,
  },
}

const KEY = "ditalapp-interfaz"
const IDS = Object.keys(INTERFACES) as InterfaceId[]

export function currentInterface(): InterfaceId | null {
  const path = window.location.pathname
  const byHost = IDS.find((id) => INTERFACES[id].host.test(window.location.hostname))
  if (byHost) return byHost
  const byPath = IDS.find((id) => path === INTERFACES[id].home || path.startsWith(`${INTERFACES[id].home}/`))
  try {
    if (byPath) {
      sessionStorage.setItem(KEY, byPath)
      return byPath
    }
    const stored = sessionStorage.getItem(KEY) as InterfaceId | null
    return stored && IDS.includes(stored) ? stored : null
  } catch {
    return byPath ?? null
  }
}

export function leaveInterface() {
  try { sessionStorage.removeItem(KEY) } catch { /* sin almacenamiento */ }
  // Desde un dominio propio se vuelve al dominio principal de DitalApp si está configurado.
  const main = import.meta.env.VITE_MAIN_APP_URL as string | undefined
  if (IDS.some((id) => INTERFACES[id].host.test(window.location.hostname)) && main) window.location.assign(main)
  else window.location.assign("/")
}
