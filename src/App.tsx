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

import { appConfig } from "./config"

import {
  getAccount,
  getCurrentUser,
  signIn,
} from "./services/auth"

import {
  mockProcessAssignments,
  mockUsers,
} from "./data/mockData"

import {
  canAccessApprovalInbox,
} from "./services/permissions"

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


  // ======================================================
  // USUARIO MICROSOFT
  // ======================================================

  useEffect(() => {
    if (
      !signedIn ||
      demoUser
    ) {
      return
    }

    getCurrentUser()
      .then((user) =>
        setName(
          user.displayName
        )
      )
      .catch(() => {})
  }, [
    signedIn,
    demoUser,
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
    demoUser ?? {
      email:
        microsoftAccount?.username ??
        "",

      name,

      role: "VENDEDOR",

      local:
        appConfig.pilot.branch,

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
      mockProcessAssignments
    )


  // ======================================================
  // APP
  // ======================================================

  return (
    <BrowserRouter>

      <Shell
        userName={name}
        branch={currentBranch}
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

          {/* INICIO */}

          <Route
            path="/"
            element={
              <Home
                userName={name}
                branch={
                  currentBranch
                }
              />
            }
          />


          {/* ACADEMIA */}

          <Route
            path="/academia"
            element={
              <Academia />
            }
          />


          {/* MI LOCAL */}

          <Route
            path="/mi-local"
            element={
              <MiLocal
                branch={
                  currentBranch
                }
              />
            }
          />


          {/* MIS SOLICITUDES */}

          <Route
            path="/solicitudes"
            element={
              <Solicitudes
                branch={
                  currentBranch
                }
              />
            }
          />


          {/* NUEVA SOLICITUD */}

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


          {/* APROBACIONES */}

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


          {/* DETALLE DE SOLICITUD */}

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


          {/* FORMULARIOS */}

          <Route
            path="/formularios"
            element={
           <Formularios
                   currentUser={currentUser}

              />
            }
          />

        </Routes>

      </Shell>

    </BrowserRouter>
  )
}
