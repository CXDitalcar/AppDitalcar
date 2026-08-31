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

  demoMode?: boolean

  onDemoLogout?: () => void

  showApprovals?: boolean
}


// ======================================================
// MENÚ
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
  demoMode = false,
  onDemoLogout,
  showApprovals = false,
}: ShellProps) {
  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false)


  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }


  return (
    <div className="shell">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className={`sidebar ${
          mobileMenuOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        {/* CABECERA */}

        <div className="sidebar-head">

          <Brand />

          <button
            type="button"
            className="sidebar-close"
            onClick={
              closeMobileMenu
            }
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>

        </div>


        {/* NAVEGACIÓN */}

        <nav className="sidebar-nav">

          <div className="sidebar-nav-label">
            PRINCIPAL
          </div>


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
                    item.to ===
                    "/"
                  }
                  onClick={
                    closeMobileMenu
                  }
                  className={({
                    isActive,
                  }) =>
                    `sidebar-link ${
                      isActive
                        ? "active"
                        : ""
                    }`
                  }
                >

                  <Icon
                    size={18}
                  />

                  <span>
                    {
                      item.label
                    }
                  </span>

                </NavLink>
              )
            }
          )}


          {/* APROBACIONES */}

          {showApprovals && (
            <>
              <div className="sidebar-nav-label sidebar-nav-label-secondary">
                GESTIÓN
              </div>


              <NavLink
                to="/aprobaciones"
                onClick={
                  closeMobileMenu
                }
                className={({
                  isActive,
                }) =>
                  `sidebar-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <ShieldCheck
                  size={18}
                />

                <span>
                  Aprobaciones
                </span>

              </NavLink>
            </>
          )}

        </nav>


        {/* ==================================================
            USUARIO
        ================================================== */}

        <div className="sidebar-user">

          {demoMode && (
            <div className="demo-mode-badge">

              <BadgeCheck
                size={14}
              />

              MODO DEMO

            </div>
          )}


          {currentUser && (
            <div className="sidebar-user-info">

              <div className="sidebar-user-avatar">
                {
                  getInitials(
                    currentUser.name
                  )
                }
              </div>


              <div className="sidebar-user-text">

                <strong>
                  {
                    currentUser.name
                  }
                </strong>


                <span>
                  {
                    formatRole(
                      currentUser.role
                    )
                  }
                </span>


                {currentUser.local && (
                  <small>
                    {
                      currentUser.local
                    }
                  </small>
                )}

              </div>

            </div>
          )}


          {demoMode &&
            onDemoLogout && (
            <button
              type="button"
              className="demo-logout-btn"
              onClick={
                onDemoLogout
              }
            >

              <LogOut
                size={16}
              />

              Cambiar perfil

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
          className="sidebar-overlay"
          onClick={
            closeMobileMenu
          }
          aria-label="Cerrar menú"
        />
      )}


      {/* ==================================================
          CONTENIDO
      ================================================== */}

      <main className="shell-main">

        {/* TOPBAR MÓVIL */}

        <header className="shell-mobile-header">

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() =>
              setMobileMenuOpen(
                true
              )
            }
            aria-label="Abrir menú"
          >
            <Menu size={21} />
          </button>


          <Brand />

        </header>


        <div className="shell-content">
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
