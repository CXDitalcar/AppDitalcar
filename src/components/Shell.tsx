import {
  Bell,
  ClipboardCheck,
  FilePlus2,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  MessagesSquare,
  ShieldCheck,
  X,
} from "lucide-react"

import {
  NavLink,
} from "react-router-dom"

import {
  useState,
  type ReactNode,
} from "react"

import Brand from "./Brand"

import {
  signOut,
} from "../services/auth"


const nav = [
  [
    "/",
    "Inicio",
    Home,
  ],

  [
    "/academia",
    "Academia",
    GraduationCap,
  ],

  [
    "/mi-local",
    "Mi Local",
    ClipboardCheck,
  ],

  [
    "/solicitudes",
    "Solicitudes",
    MessagesSquare,
  ],

  [
    "/solicitudes/nueva",
    "Nueva solicitud",
    FilePlus2,
  ],
] as const


export default function Shell({
  children,
  userName,
  branch,
  demoMode = false,
  onDemoLogout,
}: {
  children: ReactNode
  userName: string
  branch: string
  demoMode?: boolean
  onDemoLogout?: () => void
}) {
  const [open, setOpen] =
    useState(false)


  async function handleLogout() {
    if (
      demoMode &&
      onDemoLogout
    ) {
      onDemoLogout()

      return
    }

    await signOut()
  }


  return (
    <div className="shell">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${
          open
            ? "open"
            : ""
        }`}
      >

        <div className="sidebar-top">

          <Brand />


          <button
            className="icon-btn mobile-close"
            onClick={() =>
              setOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>


        {demoMode && (
          <div
            className="pilot-pill"
            style={{
              marginBottom: 12,
              color: "#ff757b",
            }}
          >
            <ShieldCheck
              size={13}
              style={{
                marginRight: 6,
                verticalAlign:
                  "middle",
              }}
            />

            Modo demo
          </div>
        )}


        <nav>

          {nav.map(
            (
              [
                to,
                label,
                Icon,
              ]
            ) => (
              <NavLink
                key={to}
                to={to}
                onClick={() =>
                  setOpen(false)
                }
                className={({
                  isActive,
                }) =>
                  `nav-link ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >
                <Icon
                  size={19}
                />

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}

        </nav>


        <div className="sidebar-foot">

          <div className="pilot-pill">
            {demoMode
              ? "Vista"
              : "Piloto"}{" "}
            · {branch}
          </div>


          <button
            className="logout"
            onClick={
              handleLogout
            }
          >
            <LogOut size={17} />

            Cerrar sesión
          </button>

        </div>

      </aside>


      {/* CONTENIDO */}

      <main className="main">

        <header className="topbar">

          <button
            className="icon-btn mobile-menu"
            onClick={() =>
              setOpen(true)
            }
          >
            <Menu size={21} />
          </button>


          <div className="top-title">
            Ditalcar · Colaboradores
          </div>


          <div className="top-user">

            <Bell size={18} />

            <div>

              <strong>
                {userName}
              </strong>

              <span>
                {branch}
                {demoMode
                  ? " · Demo"
                  : ""}
              </span>

            </div>

          </div>

        </header>


        <div className="page">
          {children}
        </div>

      </main>


      {open && (
        <div
          className="scrim"
          onClick={() =>
            setOpen(false)
          }
        />
      )}

    </div>
  )
}
