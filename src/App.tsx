import {
  useEffect,
  useState,
} from "react"

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom"

import Shell from "./components/Shell"
import Brand from "./components/Brand"
import DemoLogin from "./components/DemoLogin"

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

import { appConfig } from "./config"

import {
  getAccount,
  getCurrentUser,
  signIn,
} from "./services/auth"

import {
  mockUsers,
} from "./data/mockData"

import {
  requestAssignments,
} from "./data/requestConfig"

import {
  canAccessApprovalInbox,
} from "./services/permissions"

import {
  getUserScopeFromList,
} from "./services/userDirectory"

import type {
  UserScope,
} from "./types"


const DEMO_STORAGE_KEY =
  "ditalcar-demo-user"


export default function App() {
  const microsoftAccount =
    getAccount()


  // ======================================================
  // USUARIO DEMO
  // ======================================================

  const [demoUser, setDemoUser] =
    useState<UserScope | null>(() => {
      const storedEmail =
        localStorage.getItem(
          DEMO_STORAGE_KEY
        )

      if (!storedEmail) {
        return null
      }

      return (
        mockUsers.find(
          (user) =>
            user.email === storedEmail
        ) ?? null
      )
    })


  // ======================================================
  // SESIÓN
  // ======================================================

  const [signedIn, setSignedIn] =
    useState(
      Boolean(
        microsoftAccount ||
        demoUser
      )
    )


  const [name, setName] =
    useState(
      demoUser?.name ||
      microsoftAccount?.name ||
      "Usuario Ditalcar"
    )

  const [liveProfile, setLiveProfile] =
    useState<UserScope | null>(null)


  // ======================================================
  // USUARIO MICROSOFT + PERFIL DESDE 02_USUARIOS
  // ======================================================

  useEffect(() => {
    if (
      !signedIn ||
      demoUser ||
      !microsoftAccount
    ) {
      return
    }

    let active = true

    async function loadLiveUser() {
      const fallbackName =
        microsoftAccount?.name ||
        "Usuario Ditalcar"

      try {
        const user =
          await getCurrentUser()

        if (!active) return

        const displayName =
          user.displayName ||
          fallbackName

        setName(displayName)

        const profile =
          await getUserScopeFromList(
            microsoftAccount?.username ?? "",
            displayName
          )

        if (
          active &&
          profile
        ) {
          setLiveProfile(profile)
          setName(profile.name)
        }
      } catch {
        // Si la ficha todavía no existe en 02_Usuarios,
        // la app conserva el perfil piloto de respaldo.
      }
    }

    loadLiveUser()

    return () => {
      active = false
    }
  }, [
    signedIn,
    demoUser,
    microsoftAccount?.username,
  ])


  // ======================================================
  // ENTRAR EN DEMO
  // ======================================================

  function enterDemo(
    user: UserScope
  ) {
    localStorage.setItem(
      DEMO_STORAGE_KEY,
      user.email
    )

    setDemoUser(user)

    setName(user.name)

    setSignedIn(true)
  }


  // ======================================================
  // SALIR DE DEMO
  // ======================================================

  function exitDemo() {
    localStorage.removeItem(
      DEMO_STORAGE_KEY
    )

    setDemoUser(null)

    setSignedIn(false)

    setName(
      "Usuario Ditalcar"
    )
  }


  // ======================================================
  // LOGIN
  // ======================================================

  if (!signedIn) {
    return (
      <div className="login">

        <div className="login-card">

          <Brand large />

          <h1>
            Colaboradores
          </h1>

          <p>
            Ingresa con tu cuenta
            corporativa para acceder
            al portal interno Ditalcar.
          </p>

          <button
            className="primary-btn"
            onClick={async () => {
              await signIn()

              setSignedIn(true)
            }}
          >
            Ingresar con Microsoft 365
          </button>

          <small>
            Acceso restringido a
            DITALCAR SA
          </small>


          <DemoLogin
            users={mockUsers}
            onEnter={enterDemo}
          />

        </div>

      </div>
    )
  }


  // ======================================================
  // USUARIO ACTUAL
  // ======================================================

  const currentUser: UserScope =
    demoUser ??
    liveProfile ?? {
      email:
        microsoftAccount?.username ??
        "",

      name,

      role: "VENDEDOR",

      local:
        appConfig.pilot.branch,

      localPrincipal:
        appConfig.pilot.branch,

      assignedLocals: [
        appConfig.pilot.branch,
      ],

      scope: "LOCAL",

      active: true,
    }


  // ======================================================
  // ÁMBITO ACTUAL
  // ======================================================

  const currentBranch =
    currentUser.local ??
    currentUser.zone ??
    "Red Ditalcar"


  // ======================================================
  // PERMISOS
  // ======================================================

  const showApprovals =
    canAccessApprovalInbox(
      currentUser,
      requestAssignments
    )


  // ======================================================
  // APP
  // ======================================================

  return (
    <BrowserRouter>

      <Shell
        currentUser={
          currentUser
        }
        userName={
          name
        }
        branch={
          currentBranch
        }
        demoMode={Boolean(
          demoUser
        )}
        onDemoLogout={
          demoUser
            ? exitDemo
            : undefined
        }
        showApprovals={
          showApprovals
        }
      >

        <Routes>

          {/* ==================================================
              INICIO
          ================================================== */}

          <Route
            path="/"
            element={
              <Home
                userName={name}
                branch={currentBranch}
                currentUser={currentUser}
                demoMode={Boolean(demoUser)}
              />
            }
          />


          {/* ==================================================
              ACADEMIA
          ================================================== */}

          <Route
            path="/academia"
            element={
              <Academia currentUser={currentUser} />
            }
          />


          {/* ==================================================
              PLAYBOOKS DE VENTA
          ================================================== */}

          <Route
            path="/playbooks-venta"
            element={<Navigate to="/academia?tab=playbooks" replace />}
          />


          {/* ==================================================
              MI LOCAL
          ================================================== */}

          <Route
            path="/mi-local"
            element={
              <MiLocal
                branch={currentBranch}
                currentUser={currentUser}
              />
            }
          />


          {/* ==================================================
              MIS SOLICITUDES
          ================================================== */}

          <Route
            path="/solicitudes"
            element={
              <Solicitudes
                branch={currentBranch}
                currentUser={currentUser}
                demoMode={Boolean(demoUser)}
              />
            }
          />


          {/* ==================================================
              NUEVA SOLICITUD
          ================================================== */}

          <Route
            path="/solicitudes/nueva"
            element={
              <NuevaSolicitud
                currentUser={
                  currentUser
                }
              />
            }
          />


          {/* ==================================================
              APROBACIONES
          ================================================== */}

          <Route
            path="/aprobaciones"
            element={
              showApprovals ? (
                <Aprobaciones
                  currentUser={
                    currentUser
                  }
                />
              ) : (
                <Navigate
                  to="/"
                  replace
                />
              )
            }
          />


          {/* ==================================================
              DETALLE DE SOLICITUD
          ================================================== */}

          <Route
            path="/solicitudes/:requestId"
            element={
              <SolicitudDetalle
                currentUser={
                  currentUser
                }
              />
            }
          />


          <Route
            path="/insumos"
            element={
              <PedidoInsumos currentUser={currentUser} />
            }
          />

          {/* ==================================================
              FORMULARIOS
          ================================================== */}

          <Route
            path="/formularios"
            element={
              <Formularios
                currentUser={
                  currentUser
                }
              />
            }
          />


          {/* ==================================================
              DETALLE DE REVISIÓN
          ================================================== */}

          <Route
            path="/formularios/:executionId"
            element={
              <FormularioDetalle
                currentUser={
                  currentUser
                }
              />
            }
          />

        </Routes>

      </Shell>

    </BrowserRouter>
  )
}
