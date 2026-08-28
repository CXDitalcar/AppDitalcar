import {
  useEffect,
  useState,
} from "react"

import {
  BrowserRouter,
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

import { appConfig } from "./config"

import {
  getAccount,
  getCurrentUser,
  signIn,
} from "./services/auth"

import {
  mockUsers,
} from "./data/mockData"

import type {
  UserScope,
} from "./types"


const DEMO_STORAGE_KEY =
  "ditalcar-demo-user"


export default function App() {
  const microsoftAccount =
    getAccount()

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
            user.email ===
            storedEmail
        ) ?? null
      )
    })


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
  // USUARIO REAL MICROSOFT
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
  // ENTRAR EN MODO DEMO
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
  // SALIR
  // ======================================================

  function exitApp() {
    if (demoUser) {
      localStorage.removeItem(
        DEMO_STORAGE_KEY
      )

      setDemoUser(null)

      setSignedIn(false)

      setName(
        "Usuario Ditalcar"
      )

      return
    }

    // El cierre Microsoft sigue
    // realizándose desde Shell
    // cuando no estamos en demo.
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


          {/* MODO DEMO */}

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

  const currentBranch =
    demoUser?.local ??
    (
      demoUser
        ? "Red Ditalcar"
        : appConfig.pilot.branch
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
            ? exitApp
            : undefined
        }
      >

        <Routes>

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


          <Route
            path="/academia"
            element={
              <Academia />
            }
          />


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


          <Route
            path="/solicitudes/nueva"
            element={
              <NuevaSolicitud />
            }
          />

        </Routes>

      </Shell>

    </BrowserRouter>
  )
}
