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
import Gestion from "./pages/Gestion"

import { appConfig } from "./config"
import { demoViewUsers } from "./data/mockData"
import { canAccessPilotModule } from "./data/pilotStellantis"
import { canAccessApprovalInbox } from "./services/permissions"
import { getApiSession, logoutApiSession } from "./services/auth"
import { getUsersDirectory } from "./services/usersDirectoryApi"
import {
  getAllOperationalUsers,
  getAllRequestAssignments,
  loadOperationalCatalog,
  setRuntimeUsers,
} from "./services/requestCatalog"
import type { UserScope } from "./types"
import { hasExperienceAccess } from "./services/experienceAccess"

export default function App() {
  const [apiUser, setApiUser] = useState<UserScope | null>(null)
  const [viewAsUser, setViewAsUser] = useState<UserScope | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [directoryUsers, setDirectoryUsers] = useState<UserScope[]>([])
  const [catalogVersion, setCatalogVersion] = useState(0)

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
    if (!apiUser) return
    let active = true
    const refreshCatalog = () => {
      loadOperationalCatalog()
        .finally(() => {
          if (active) setCatalogVersion((value) => value + 1)
        })
    }
    refreshCatalog()
    const timer = window.setInterval(refreshCatalog, 60_000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [apiUser?.email])

  useEffect(() => {
    if (!hasExperienceAccess(apiUser)) {
      setDirectoryUsers([])
      return
    }

    let active = true
    const refresh = () => {
      getUsersDirectory()
        .then((result) => {
          if (active) {
            const activeUsers = result.users.filter((user) => user.active)
            setDirectoryUsers(activeUsers)
            setRuntimeUsers(result.users, result.meta)
            setCatalogVersion((value) => value + 1)
          }
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
  const experienceCanViewAs = hasExperienceAccess(baseUser)
  const baseUserEmail = baseUser.email
  const currentUser = viewAsUser ?? baseUser
  const dataPilotMode = appConfig.data.mode === "pilot"

  const currentBranch =
    currentUser.local ??
    currentUser.localPrincipal ??
    currentUser.zone ??
    "Red Ditalcar"

  const showApprovals = canAccessApprovalInbox(currentUser, getAllRequestAssignments())
  const canSeeAcademia = canAccessPilotModule(currentUser, "ACADEMIA")
  const canSeeMiLocal = canAccessPilotModule(currentUser, "MI_LOCAL")
  const canSeeFormularios = canAccessPilotModule(currentUser, "FORMULARIOS")
  const canSeeInsumos = canAccessPilotModule(currentUser, "INSUMOS")
  const canSeeKPI = canAccessPilotModule(currentUser, "KPI")
  const canSeeSolicitudes = canAccessPilotModule(currentUser, "SOLICITUDES")
  // Gestión aparece si el perfil tiene al menos una herramienta dentro.
  // Usuarios/fuentes dependen del perfil REAL (experienceCanViewAs), no de "Ver como".
  const showGestion = showApprovals || canSeeSolicitudes || canSeeKPI || experienceCanViewAs

  // “Ver como” es una herramienta administrativa de Experiencia, no una vía de ingreso.
  const operationalUsers = getAllOperationalUsers().filter((user) => user.active)
  void catalogVersion
  const viewAsOptions = (directoryUsers.length ? directoryUsers : operationalUsers.length ? operationalUsers : demoViewUsers).map((user) => ({
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
        showGestion={showGestion}
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

          <Route
            path="/gestion"
            element={
              showGestion ? (
                <Gestion
                  showApprovals={showApprovals}
                  showRequests={canSeeSolicitudes}
                  showKpi={canSeeKPI}
                  showAdmin={experienceCanViewAs}
                />
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
