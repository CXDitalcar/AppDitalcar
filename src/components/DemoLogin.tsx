import { useState } from "react"
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import type { UserScope } from "../types"

import "./DemoLogin.css"


export default function DemoLogin({
  users,
  onEnter,
}: {
  users: UserScope[]
  onEnter: (user: UserScope) => void
}) {
  const [selectedEmail, setSelectedEmail] =
    useState(users[0]?.email ?? "")

  const selectedUser =
    users.find(
      (user) =>
        user.email === selectedEmail
    ) ?? users[0]


  if (!selectedUser) {
    return null
  }


  return (
    <div className="demo-login">

      <div className="demo-login-head">

        <div className="demo-login-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <strong>
            Modo demo
          </strong>

          <span>
            Vista temporal para probar
            roles y permisos.
          </span>
        </div>

      </div>


      <label className="demo-user-select">

        <span>
          Entrar como
        </span>

        <select
          value={selectedEmail}
          onChange={(event) =>
            setSelectedEmail(
              event.target.value
            )
          }
        >
          {users
            .filter((user) => user.active)
            .map((user) => (
              <option
                key={user.email}
                value={user.email}
              >
                {user.name}
              </option>
            ))}
        </select>

      </label>


      <div className="demo-user-card">

        <div className="demo-user-avatar">
          <UserRound size={23} />
        </div>

        <div className="demo-user-data">

          <strong>
            {selectedUser.name}
          </strong>

          <span>
            {formatRole(
              selectedUser.role
            )}
          </span>

          <small>
            <Building2 size={13} />

            {selectedUser.local ??
              selectedUser.zone ??
              "Red Ditalcar"}
          </small>

        </div>

      </div>


      <button
        className="demo-enter-btn"
        type="button"
        onClick={() =>
          onEnter(selectedUser)
        }
      >
        Entrar en modo demo

        <ArrowRight size={17} />
      </button>


      <small className="demo-warning">
        Los datos mostrados en modo demo
        son simulados y no modifican
        SharePoint.
      </small>

    </div>
  )
}


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
      "Jefatura de Local",

    JEFATURA_MARCA:
      "Jefatura de Marca",

    JEFATURA_ZONAL:
      "Jefatura Zonal",

    GERENCIA_VENTAS:
      "Gerencia de Ventas",

    JEFATURA_COMERCIAL_CLIENTES:
      "Jefatura Comercial y Clientes",

    JEFATURA_OPERACIONES_COMERCIALES:
      "Jefatura Operaciones Comerciales",

    JEFATURA_ADMINISTRACION:
      "Jefatura de Administración",

    GERENCIA_ADMINISTRACION:
      "Gerencia de Administración",

    GERENCIA_COMERCIAL:
      "Gerencia Comercial",

    JEFATURA_MARKETING:
      "Jefatura de Marketing",

    ADMINISTRATIVO:
      "Administrativo",

    EQUIPO_COMERCIAL:
      "Equipo Comercial",

    GERENCIA_GENERAL:
      "Gerencia General",
  }

  return labels[role]
}
