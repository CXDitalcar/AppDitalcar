import { useEffect, useState } from "react"
import {
  ArrowRight,
  Building2,
  ShieldCheck,
  UserRound,
} from "lucide-react"

import type { UserScope } from "../types"
import { PILOT_LOCAL } from "../data/pilotStellantis"
import { ditalcarLocals } from "../data/requestConfig"

import "./DemoLogin.css"

export default function DemoLogin({
  users,
  onEnter,
}: {
  users: UserScope[]
  onEnter: (user: UserScope) => void
}) {
  const activeUsers = users.filter((user) => user.active)

  const [selectedEmail, setSelectedEmail] = useState(
    activeUsers[0]?.email ?? ""
  )

  const selectedUser =
    activeUsers.find((user) => user.email === selectedEmail) ?? activeUsers[0]

  const [sellerName, setSellerName] = useState("Vendedor Piloto")
  const [sellerLocal, setSellerLocal] = useState(PILOT_LOCAL)

  useEffect(() => {
    if (selectedUser?.role === "VENDEDOR") {
      setSellerName(selectedUser.name || "Vendedor Piloto")
      setSellerLocal(selectedUser.local || PILOT_LOCAL)
    }
  }, [selectedUser?.email])

  if (!selectedUser) return null

  const isSeller = selectedUser.role === "VENDEDOR"

  function enterSelectedProfile() {
    if (!isSeller) {
      onEnter(selectedUser)
      return
    }

    const cleanName = sellerName.trim() || "Vendedor Piloto"

    onEnter({
      ...selectedUser,
      name: cleanName,
      local: sellerLocal,
      localPrincipal: sellerLocal,
      assignedLocals: [sellerLocal],
    })
  }

  return (
    <div className="demo-login">
      <div className="demo-login-head">
        <div className="demo-login-icon">
          <ShieldCheck size={21} />
        </div>

        <div>
          <strong>Piloto Stellantis Nueva Tobalaba</strong>
          <span>
            Vista temporal para probar solicitudes, Ruta y permisos mientras
            Microsoft queda habilitado.
          </span>
        </div>
      </div>

      <label className="demo-user-select">
        <span>Entrar como</span>
        <select
          value={selectedEmail}
          onChange={(event) => setSelectedEmail(event.target.value)}
        >
          {activeUsers.map((user) => (
            <option key={user.email} value={user.email}>
              {user.name}
            </option>
          ))}
        </select>
      </label>

      {isSeller && (
        <div className="demo-seller-fields">
          <label className="demo-user-select">
            <span>Nombre del vendedor</span>
            <input
              value={sellerName}
              onChange={(event) => setSellerName(event.target.value)}
              placeholder="Nombre y apellido"
            />
          </label>

          <label className="demo-user-select">
            <span>Local</span>
            <select
              value={sellerLocal}
              onChange={(event) => setSellerLocal(event.target.value)}
            >
              {ditalcarLocals.map((local) => (
                <option key={local.name} value={local.name}>
                  {local.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="demo-user-card">
        <div className="demo-user-avatar">
          <UserRound size={23} />
        </div>

        <div className="demo-user-data">
          <strong>{isSeller ? sellerName || "Vendedor Piloto" : selectedUser.name}</strong>
          <span>{formatRole(selectedUser.role)}</span>
          <small>
            <Building2 size={13} />
            {isSeller
              ? sellerLocal
              : selectedUser.local ??
                selectedUser.localPrincipal ??
                selectedUser.zone ??
                "Red Ditalcar"}
          </small>
        </div>
      </div>

      <button
        className="demo-enter-btn"
        type="button"
        onClick={enterSelectedProfile}
      >
        Entrar en modo piloto
        <ArrowRight size={17} />
      </button>

      <small className="demo-warning">
        En modo piloto las solicitudes se guardan localmente en este navegador
        y no modifican SharePoint. Experiencia de Clientes mantiene acceso
        completo para revisar módulos todavía ocultos al resto de perfiles.
      </small>
    </div>
  )
}

function formatRole(role: UserScope["role"]) {
  const labels: Record<UserScope["role"], string> = {
    VENDEDOR: "Vendedor",
    JEFATURA_LOCAL: "Jefatura de Sucursal",
    JEFATURA_MARCA: "Gerencia de Marca",
    JEFATURA_ZONAL: "Gerencia de Marca",
    GERENCIA_MARCA: "Gerencia de Marca",
    GERENCIA_VENTAS: "Gerencia de Ventas",
    JEFATURA_COMERCIAL_CLIENTES: "Jefatura Comercial y Clientes",
    JEFATURA_OPERACIONES_COMERCIALES: "Jefatura Operaciones Comerciales",
    JEFATURA_ADMINISTRACION: "Jefatura de Administración",
    GERENCIA_ADMINISTRACION: "Gerencia de Administración",
    GERENCIA_COMERCIAL: "Gerencia Comercial",
    JEFATURA_MARKETING: "Equipo de Marketing",
    EXPERIENCIA_CLIENTES: "Experiencia de Clientes",
    ADMINISTRATIVO: "Administrativo",
    EQUIPO_COMERCIAL: "Equipo Comercial",
    GERENCIA_GENERAL: "Gerencia General",
  }

  return labels[role]
}
