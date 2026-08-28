import { useEffect, useState } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import Shell from "./components/Shell"
import Brand from "./components/Brand"
import Home from "./pages/Home"
import Academia from "./pages/Academia"
import MiLocal from "./pages/MiLocal"
import Solicitudes from "./pages/Solicitudes"
import { appConfig } from "./config"
import { getAccount, getCurrentUser, signIn } from "./services/auth"

export default function App() {
  const [signedIn, setSignedIn] = useState(Boolean(getAccount()))
  const [name, setName] = useState(getAccount()?.name || "Usuario Ditalcar")

  useEffect(() => {
    if (!signedIn) return

    getCurrentUser()
      .then((u) => setName(u.displayName))
      .catch(() => {})
  }, [signedIn])

  if (!signedIn) {
    return (
      <div className="login">
        <div className="login-card">
          <Brand large />

          <h1>Colaboradores</h1>

          <p>
            Ingresa con tu cuenta corporativa para acceder al portal interno
            Ditalcar.
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

          <small>Acceso restringido a DITALCAR SA</small>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Shell userName={name} branch={appConfig.pilot.branch}>
        <Routes>
          <Route
            path="/"
            element={
              <Home
                userName={name}
                branch={appConfig.pilot.branch}
              />
            }
          />
          <Route path="/academia" element={<Academia />} />
          <Route
            path="/mi-local"
            element={<MiLocal branch={appConfig.pilot.branch} />}
          />
          <Route
            path="/solicitudes"
            element={<Solicitudes branch={appConfig.pilot.branch} />}
          />
        </Routes>
      </Shell>
    </BrowserRouter>
  )
}
