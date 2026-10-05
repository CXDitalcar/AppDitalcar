import {
  useState,
  type ReactNode,
} from "react"

import {
  BadgeCheck,
  BookOpen,
  Briefcase,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
} from "lucide-react"

import {
  NavLink,
  useLocation,
} from "react-router-dom"

import Brand from "./Brand"
import PilotFeedback from "./PilotFeedback"

import "./Shell.css"

import type {
  UserScope,
} from "../types"
import {
  canAccessPilotModule,
  type PilotModule,
} from "../data/pilotStellantis"


// ======================================================
// PROPS
// ======================================================

type ShellProps = {
  children?: ReactNode

  currentUser?: UserScope
  authenticatedUser?: UserScope

  // Compatibilidad con App.tsx actual
  userName?: string
  branch?: string

  demoMode?: boolean

  onDemoLogout?: () => void
  onLogout?: () => void | Promise<void>

  // Compatibilidad: estas dos ya no generan menú propio; todo vive en /gestion.
  showApprovals?: boolean
  showUsersAdmin?: boolean
  showGestion?: boolean

  viewAsOptions?: UserScope[]
  viewAsEmail?: string
  onViewAs?: (email: string) => void

  showPilotFeedback?: boolean
}


// ======================================================
// MENÚ PRINCIPAL
// ======================================================

type NavigationItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
  // Sin module = acceso a Gestión (se resuelve con showGestion).
  module?: PilotModule
  // Rutas internas que también marcan este ítem como activo.
  activePaths?: string[]
  badge?: string
}

// Menú acordado: Inicio · Academia · Formularios · Gestión.
// "Mi local" se mantiene TEMPORALMENTE hasta que Inicio pase a ser Mi Local.


const mainNavigation: NavigationItem[] = [
  {
    label: "Inicio",
    to: "/",
    icon: LayoutDashboard,
    module: "HOME",
  },
  {
    label: "Academia",
    to: "/academia",
    icon: BookOpen,
    module: "ACADEMIA",
  },
  {
    label: "Mi local",
    to: "/mi-local",
    icon: Building2,
    module: "MI_LOCAL",
  },
  {
    label: "Formularios",
    to: "/formularios",
    icon: ClipboardCheck,
    module: "FORMULARIOS",
    activePaths: ["/ruta-experiencia"],
  },
  {
    label: "Gestión",
    to: "/gestion",
    icon: Briefcase,
    activePaths: ["/solicitudes", "/aprobaciones", "/kpi", "/usuarios", "/insumos"],
  },
]


// ======================================================
// COMPONENTE
// ======================================================

export default function Shell({
  children,
  currentUser,
  authenticatedUser,
  userName,
  branch,
  demoMode = false,
  onDemoLogout,
  onLogout,
  showGestion = false,
  viewAsOptions,
  viewAsEmail,
  onViewAs,
  showPilotFeedback = false,
}: ShellProps) {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)


  const displayName =
    currentUser?.name ??
    userName ??
    "Usuario Ditalcar"


  const displayBranch =
    currentUser?.local ??
    branch


  const displayRole =
    currentUser
      ? formatRole(
          currentUser.role
        )
      : "Ditalcar Colaboradores"


  const { pathname } = useLocation()

  const visibleNavigation = mainNavigation.filter((item) => {
    if (!item.module) return showGestion
    return currentUser ? canAccessPilotModule(currentUser, item.module) : true
  })

  function isItemActive(item: NavigationItem, routerActive: boolean) {
    if (routerActive) return true
    return (item.activePaths ?? []).some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  }


  function closeMobileMenu() {
    setMobileMenuOpen(false)
  }


  return (
    <div className="app-shell">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`app-sidebar ${
          mobileMenuOpen
            ? "app-sidebar-open"
            : ""
        }`}
      >

        {/* ==================================================
            LOGO
        ================================================== */}

        <div className="app-sidebar-brand">

          <Brand />

          <button
            type="button"
            className="app-sidebar-close"
            onClick={
              closeMobileMenu
            }
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>

        </div>


        {/* ==================================================
            NAVEGACIÓN
        ================================================== */}

        <nav className="app-sidebar-nav">

          <div className="app-sidebar-section-label">
            PRINCIPAL
          </div>


          <div className="app-sidebar-links">

            {visibleNavigation.map(
              (item) => {
                const Icon =
                  item.icon


                return (
                  <NavLink
                    key={
                      item.to
                    }
                    to={
                      item.to
                    }
                    end={
                      item.to === "/"
                    }
                    onClick={
                      closeMobileMenu
                    }
                    className={({
                      isActive,
                    }) =>
                      `app-sidebar-link ${
                        isItemActive(item, isActive)
                          ? "app-sidebar-link-active"
                          : ""
                      }`
                    }
                  >

                    <span className="app-sidebar-link-icon">

                      <Icon
                        size={18}
                        strokeWidth={1.9}
                      />

                    </span>


                    <span className="app-sidebar-link-text">
                      {item.label}
                    </span>

                    {item.badge && (
                      <span className="app-sidebar-link-badge">{item.badge}</span>
                    )}

                  </NavLink>
                )
              }
            )}

          </div>


        </nav>


        {/* ==================================================
            USUARIO
        ================================================== */}

        <div className="app-sidebar-user">

          {demoMode && (
            <div className="app-demo-badge">

              <BadgeCheck
                size={14}
              />

              <span>
                DATOS PILOTO
              </span>

            </div>
          )}


          {viewAsOptions && onViewAs && (
            <label className="app-view-as">
              <span>VER COMO</span>
              <select
                value={viewAsEmail ?? authenticatedUser?.email ?? currentUser?.email ?? ""}
                onChange={(event) => onViewAs(event.target.value)}
              >
                {authenticatedUser && (
                  <option value={authenticatedUser.email}>
                    Mi perfil · {formatRole(authenticatedUser.role)}
                  </option>
                )}
                {viewAsOptions
                  .filter((user) => user.email !== authenticatedUser?.email)
                  .map((user) => (
                    <option key={`${user.role}-${user.email}`} value={user.email}>
                      {formatRole(user.role)} · {user.name}
                    </option>
                  ))}
              </select>
              <small>Solo visible para Experiencia durante el piloto.</small>
            </label>
          )}

          <div className="app-user-card">

            <div className="app-user-avatar">
              {
                getInitials(
                  displayName
                )
              }
            </div>


            <div className="app-user-data">

              <strong>
                {
                  displayName
                }
              </strong>


              <span>
                {
                  displayRole
                }
              </span>


              {displayBranch && (
                <small>
                  {
                    displayBranch
                  }
                </small>
              )}

            </div>

          </div>


          {demoMode && onDemoLogout && (
            <button
              type="button"
              className="app-demo-logout"
              onClick={onDemoLogout}
            >
              <LogOut size={16} />
              <span>Cambiar perfil</span>
            </button>
          )}

          {!demoMode && onLogout && (
            <button
              type="button"
              className="app-demo-logout"
              onClick={() => void onLogout()}
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          )}

        </div>

      </aside>


      {/* ==================================================
          OVERLAY MÓVIL
      ================================================== */}

      {mobileMenuOpen && (
        <button
          type="button"
          className="app-sidebar-overlay"
          onClick={
            closeMobileMenu
          }
          aria-label="Cerrar menú"
        />
      )}


      {/* ==================================================
          ÁREA PRINCIPAL
      ================================================== */}

      <main className="app-main">

        {/* ==================================================
            HEADER MÓVIL
        ================================================== */}

        <header className="app-mobile-header">

          <button
            type="button"
            className="app-mobile-menu-button"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            aria-label="Abrir menú"
          >
            <Menu
              size={21}
            />
          </button>


          <div className="app-mobile-brand">
            <Brand />
          </div>

        </header>


        {/* ==================================================
            CONTENIDO
        ================================================== */}

        <div className="app-main-content">
          {children}
        </div>

      </main>

      {showPilotFeedback && currentUser && (
        <PilotFeedback currentUser={currentUser} />
      )}

    </div>
  )
}


// ======================================================
// INICIALES
// ======================================================

function getInitials(
  name: string
) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part.charAt(0)
    )
    .join("")
    .toUpperCase()
}


// ======================================================
// NOMBRE VISIBLE DEL ROL
// ======================================================

function formatRole(
  role: UserScope["role"]
) {
  const labels: Record<
    UserScope["role"],
    string
  > = {
    VENDEDOR:
      "Vendedor",

    JEFATURA_LOCAL:
      "Jefatura de Sucursal",

    JEFATURA_MARCA:
      "Gerencia de Marca",

    JEFATURA_ZONAL:
      "Gerencia de Marca",

    GERENCIA_MARCA:
      "Gerencia de Marca",

    GERENCIA_VENTAS:
      "Gerencia Ventas",

    JEFATURA_COMERCIAL_CLIENTES:
      "Jefatura Comercial y Clientes",

    JEFATURA_OPERACIONES_COMERCIALES:
      "Jefatura Operaciones Comerciales",

    JEFATURA_ADMINISTRACION:
      "Jefatura Administración",

    GERENCIA_ADMINISTRACION:
      "Gerencia Administración",

    GERENCIA_COMERCIAL:
      "Gerencia Comercial",

    JEFATURA_MARKETING:
      "Equipo de Marketing",

    EXPERIENCIA_CLIENTES:
      "Experiencia de Clientes",


    PROJECT_MANAGER:

      "Project Manager",

    ADMINISTRATIVO:
      "Administrativo",

    EQUIPO_COMERCIAL:
      "Equipo Comercial",

    GERENCIA_GENERAL:
      "Gerencia General",
  }


  return labels[role]
}
