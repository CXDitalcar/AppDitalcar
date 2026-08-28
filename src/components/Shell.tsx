import {
  Bell,
  Home,
  GraduationCap,
  ClipboardCheck,
  MessagesSquare,
  Menu,
  X,
  LogOut,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { useState, type ReactNode } from "react"
import Brand from "./Brand"
import { signOut } from "../services/auth"

const nav = [
  ["/", "Inicio", Home],
  ["/academia", "Academia", GraduationCap],
  ["/mi-local", "Mi Local", ClipboardCheck],
  ["/solicitudes", "Solicitudes", MessagesSquare],
] as const

export default function Shell({
  children,
  userName,
  branch,
}: {
  children: ReactNode
  userName: string
  branch: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="shell">
      <aside className={`sidebar ${open ? "open" : ""}`}>
        <div className="sidebar-top">
          <Brand />

          <button
            className="icon-btn mobile-close"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          {nav.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `nav-link ${isActive ? "active" : ""}`
              }
            >
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="pilot-pill">Piloto · {branch}</div>

          <button className="logout" onClick={() => signOut()}>
            <LogOut size={17} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button
            className="icon-btn mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </button>

          <div className="top-title">Ditalcar · Colaboradores</div>

          <div className="top-user">
            <Bell size={18} />

            <div>
              <strong>{userName}</strong>
              <span>{branch}</span>
            </div>
          </div>
        </header>

        <div className="page">{children}</div>
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
