import { useEffect, useState } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import Shell from "./components/Shell"
import AuthScreen from "./components/AuthScreen"

import Home from "./pages/Home"
import Academia from "./pages/Academia"
import MiLocal from "./pages/MiLocal"
import Solicitudes from "./pages/Solicitudes"
import NuevaSolicitud from "./pages/NuevaSolicitud"
import Aprobaciones from "./pages/Aprobaciones"
import SolicitudDetalle from "./pages/SolicitudDetalle"
import Formularios from "./pages/Formularios"
import FormularioDetalle from "./pages/FormularioDetalle"
import PedidoInsumos from "./pages/PedidoInsumos"
import KPI from "./pages/KPI"
import Usuarios from "./pages/Usuarios"
import RutaExperiencia from "./pages/RutaExperiencia"

import { appConfig } from "./config"
import { demoViewUsers } from "./data/mockData"
import { requestAssignments } from "./data/requestConfig"
import { canAccessPilotModule } from "./data/pilotStellantis"
import { canAccessApprovalInbox } from "./services/permissions"
import { getApiSession, logoutApiSession } from "./services/auth"
import { getUsersDirectory } from "./services/usersDirectoryApi"
import type { UserScope } from "./types"

export default function App() {
  const [apiUser, setApiUser] = useState<UserScope | null>(null)
  const [viewAsUser, setViewAsUser] = useState<UserScope | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [directoryUsers, setDirectoryUsers] = useState<UserScope[]>([])

  useEffect(() => {
    let active = true
    getApiSession()
      .then((user) => {
        if (active) setApiUser(user)
      })
      .finally(() => {
        if (active) setAuthLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (apiUser?.role !== "EXPERIENCIA_CLIENTES") {
      setDirectoryUsers([])
      return
    }

    let active = true
    const refresh = () => {
      getUsersDirectory()
        .then((result) => {
          if (active) setDirectoryUsers(result.users.filter((user) => user.active))
        })
        .catch(() => {
          if (active) setDirectoryUsers([])
        })
    }

    refresh()
    window.addEventListener("ditalcar-users-source-updated", refresh)
    return () => {
      active = false
      window.removeEventListener("ditalcar-users-source-updated", refresh)
    }
  }, [apiUser?.role])

  async function exitApi() {
    await logoutApiSession()
    setApiUser(null)
    setViewAsUser(null)
  }

  if (authLoading) {
    return (
      <div className="auth-loading-screen">
        <strong>Ditalcar Colaboradores</strong>
        <span>Validando sesión…</span>
      </div>
    )
  }

  if (!apiUser) {
    return <AuthScreen onAuthenticated={setApiUser} />
  }

  const baseUser = apiUser
  const experienceCanViewAs = baseUser.role === "EXPERIENCIA_CLIENTES"
  const baseUserEmail = baseUser.email
  const currentUser = viewAsUser ?? baseUser
  const dataPilotMode = appConfig.data.mode === "pilot"

  const currentBranch =
    currentUser.local ??
    currentUser.localPrincipal ??
    currentUser.zone ??
    "Red Ditalcar"

  const showApprovals = canAccessApprovalInbox(currentUser, requestAssignments)
  const canSeeAcademia = canAccessPilotModule(currentUser, "ACADEMIA")
  const canSeeMiLocal = canAccessPilotModule(currentUser, "MI_LOCAL")
  const canSeeFormularios = canAccessPilotModule(currentUser, "FORMULARIOS")
  const canSeeInsumos = canAccessPilotModule(currentUser, "INSUMOS")
  const canSeeKPI = canAccessPilotModule(currentUser, "KPI")

  // “Ver como” es una herramienta administrativa de Experiencia, no una vía de ingreso.
  const viewAsOptions = (directoryUsers.length ? directoryUsers : demoViewUsers).map((user) => ({
    ...user,
    active: true,
    testingView: true,
  }))

  function handleViewAs(email: string) {
    if (!experienceCanViewAs) return
    if (!email || email === baseUserEmail) {
      setViewAsUser(null)
      return
    }
    const profile = viewAsOptions.find((user) => user.email === email)
    setViewAsUser(profile ?? null)
  }

  return (
    <BrowserRouter>
      <Shell
        currentUser={currentUser}
        authenticatedUser={baseUser}
        userName={currentUser.name}
        branch={currentBranch}
        demoMode={false}
        onLogout={exitApi}
        showApprovals={showApprovals}
        showUsersAdmin={experienceCanViewAs}
        viewAsOptions={experienceCanViewAs ? viewAsOptions : undefined}
        viewAsEmail={viewAsUser?.email ?? baseUserEmail}
        onViewAs={experienceCanViewAs ? handleViewAs : undefined}
        showPilotFeedback={canAccessPilotModule(currentUser, "HOME")}
      >
        <Routes>
          <Route
            path="/"
            element={
              <Home
                userName={currentUser.name}
                branch={currentBranch}
                currentUser={currentUser}
                demoMode={dataPilotMode}
              />
            }
          />

          <Route
            path="/academia"
            element={
              canSeeAcademia ? (
                <Academia currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="/playbooks-venta" element={<Navigate to="/academia?tab=playbooks" replace />} />

          <Route
            path="/mi-local"
            element={
              canSeeMiLocal ? (
                <MiLocal branch={currentBranch} currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/solicitudes"
            element={
              <Solicitudes
                branch={currentBranch}
                currentUser={currentUser}
                demoMode={dataPilotMode}
              />
            }
          />

          <Route path="/solicitudes/nueva" element={<NuevaSolicitud currentUser={currentUser} />} />

          <Route
            path="/aprobaciones"
            element={
              showApprovals ? (
                <Aprobaciones currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="/solicitudes/:requestId" element={<SolicitudDetalle currentUser={currentUser} />} />

          <Route
            path="/insumos"
            element={
              canSeeInsumos ? (
                <PedidoInsumos currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/kpi"
            element={
              canSeeKPI ? <KPI currentUser={currentUser} /> : <Navigate to="/" replace />
            }
          />

          <Route
            path="/usuarios"
            element={
              experienceCanViewAs ? (
                <Usuarios />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/ruta-experiencia"
            element={
              canSeeFormularios ? (
                <RutaExperiencia currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/formularios"
            element={
              canSeeFormularios ? (
                <Formularios currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/formularios/:executionId"
            element={
              canSeeFormularios ? (
                <FormularioDetalle currentUser={currentUser} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
