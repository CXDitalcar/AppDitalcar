import {
  Bell,
  CheckSquare2,
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

import { NavLink } from "react-router-dom"

import {
  useState,
  type ReactNode,
} from "react"

import Brand from "./Brand"
import { signOut } from "../services/auth"


export default function Shell({
  children,
  userName,
  branch,
  demoMode = false,
  onDemoLogout,
  showApprovals = false,
}: {
  children: ReactNode
  userName: string
  branch: string
  demoMode?: boolean
  onDemoLogout?: () => void
  showApprovals?: boolean
}) {
  const [open, setOpen] = useState(false)


  // ======================================================
  // NAVEGACIÓN
  // ======================================================

  const nav = [
    {
      to: "/",
      label: "Inicio",
      icon: Home,
      end: true,
    },

    {
      to: "/academia",
      label: "Academia",
      icon: GraduationCap,
      end: false,
    },

    {
      to: "/mi-local",
      label: "Mi Local",
      icon: ClipboardCheck,
      end: false,
    },

    {
      to: "/solicitudes",
      label: "Solicitudes",
      icon: MessagesSquare,
      end: true,
    },

    ...(showApprovals
      ? [
          {
            to: "/aprobaciones",
            label: "Aprobaciones",
            icon: CheckSquare2,
            end: false,
          },
        ]
      : []),

    {
      to: "/solicitudes/nueva",
      label: "Nueva solicitud",
      icon: FilePlus2,
      end: false,
    },
  ]


  // ======================================================
  // CERRAR SESIÓN
  // ======================================================

  async function handleLogout() {
    if (demoMode && onDemoLogout) {
      onDemoLogout()
      return
    }

    await signOut()
  }


  return (
    <div className="shell">

      {/* SIDEBAR */}

      <aside
        className={`sidebar ${open ? "open" : ""}`}
      >

        <div className="sidebar-top">

          <Brand />

          <button
            className="icon-btn mobile-close"
            onClick={() => setOpen(false)}
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
                verticalAlign: "middle",
              }}
            />

            Modo demo
          </div>
        )}


        <nav>

          {nav.map(
            ({
              to,
              label,
              icon: Icon,
              end,
            }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() =>
                  setOpen(false)
                }
                className={({ isActive }) =>
                  `nav-link ${
                    isActive ? "active" : ""
                  }`
                }
              >
                <Icon size={19} />

                <span>
                  {label}
                </span>
              </NavLink>
            )
          )}

        </nav>


        <div className="sidebar-foot">

          <div className="pilot-pill">
            {demoMode ? "Vista" : "Piloto"} · {branch}
          </div>


          <button
            className="logout"
            onClick={handleLogout}
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
            onClick={() => setOpen(true)}
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
                {demoMode ? " · Demo" : ""}
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
          onClick={() => setOpen(false)}
        />
      )}

    </div>
  )
}
