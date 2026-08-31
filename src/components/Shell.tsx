import {
  useState,
  type ReactNode,
} from "react"

import {
  BadgeCheck,
  BookOpen,
  Building2,
  ClipboardCheck,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react"

import {
  NavLink,
} from "react-router-dom"

import Brand from "./Brand"

import "./Shell.css"

import type {
  UserScope,
} from "../types"


// ======================================================
// PROPS
// ======================================================

type ShellProps = {
  children?: ReactNode

  currentUser?: UserScope

  // Compatibilidad con App.tsx actual
  userName?: string
  branch?: string

  demoMode?: boolean

  onDemoLogout?: () => void

  showApprovals?: boolean
}


// ======================================================
// MENÚ PRINCIPAL
// ======================================================

type NavigationItem = {
  label: string
  to: string
  icon: typeof LayoutDashboard
}


const mainNavigation: NavigationItem[] = [
  {
    label: "Inicio",
    to: "/",
    icon: LayoutDashboard,
  },

  {
    label: "Academia",
    to: "/academia",
    icon: BookOpen,
  },

  {
    label: "Mi local",
    to: "/mi-local",
    icon: Building2,
  },

  {
    label: "Solicitudes",
    to: "/solicitudes",
    icon: ClipboardList,
  },

  {
    label: "Formularios",
    to: "/formularios",
    icon: ClipboardCheck,
  },
]


// ======================================================
// COMPONENTE
// ======================================================

export default function Shell({
  children,
  currentUser,
  userName,
  branch,
  demoMode = false,
  onDemoLogout,
  showApprovals = false,
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

            {mainNavigation.map(
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
                        isActive
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
                      {
                        item.label
                      }
                    </span>

                  </NavLink>
                )
              }
            )}

          </div>


          {/* ==================================================
              GESTIÓN
          ================================================== */}

          {showApprovals && (
            <div className="app-sidebar-management">

              <div className="app-sidebar-section-label">
                GESTIÓN
              </div>


              <div className="app-sidebar-links">

                <NavLink
                  to="/aprobaciones"
                  onClick={
                    closeMobileMenu
                  }
                  className={({
                    isActive,
                  }) =>
                    `app-sidebar-link ${
                      isActive
                        ? "app-sidebar-link-active"
                        : ""
                    }`
                  }
                >

                  <span className="app-sidebar-link-icon">

                    <ShieldCheck
                      size={18}
                      strokeWidth={1.9}
                    />

                  </span>


                  <span className="app-sidebar-link-text">
                    Gestión
                  </span>

                </NavLink>

              </div>

            </div>
          )}

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
                MODO DEMO
              </span>

            </div>
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


          {demoMode &&
            onDemoLogout && (
            <button
              type="button"
              className="app-demo-logout"
              onClick={
                onDemoLogout
              }
            >

              <LogOut
                size={16}
              />

              <span>
                Cambiar perfil
              </span>

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
      "Jefatura Local",

    JEFATURA_MARCA:
      "Jefatura Marca · Geely",

    JEFATURA_ZONAL:
      "Jefatura Zonal",

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
      "Jefatura Marketing",

    EXPERIENCIA_CLIENTES:
      "Experiencia de Clientes",

    ADMINISTRATIVO:
      "Administrativo",

    EQUIPO_COMERCIAL:
      "Equipo Comercial",

    GERENCIA_GENERAL:
      "Gerencia General",
  }


  return labels[role]
}
