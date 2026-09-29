import { app } from "@azure/functions"
import { body, json } from "./lib/http.js"
import {
  clearSessionCookie,
  normalizeEmail,
  parseCookieHeader,
  SESSION_COOKIE,
  sessionCookie,
  validCorporateEmail,
  validPassword,
  hashPassword,
  verifyPassword,
} from "./lib/security.js"
import {
  consumeOneTimeToken,
  createOneTimeToken,
  createSession,
  deleteSession,
  getSession,
  getUser,
  upsertUser,
} from "./lib/store.js"
import { eligibleUser, publicUser, refreshProfileFromSharePoint } from "./lib/profile.js"
import { sendAuthMail } from "./lib/mailer.js"
import { loadUsersFromExcel } from "./lib/usersExcel.js"
import { getUsersExcelUrl, saveUsersExcelUrl } from "./lib/usersSource.js"
import { loadKpiFromExcel } from "./lib/kpiExcel.js"
import { getKpiExcelUrl, getKpiSnapshot, saveKpiExcelUrl, saveKpiSnapshot } from "./lib/kpiSource.js"

const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS || 1)
const APP_URL = String(process.env.APP_PUBLIC_URL || "").replace(/\/$/, "")

function getSessionToken(request) {
  return parseCookieHeader(request.headers.get("cookie") || "")[SESSION_COOKIE]
}

async function currentUser(request) {
  const token = getSessionToken(request)
  const session = await getSession(token)
  if (!session) return null
  const user = await refreshProfileFromSharePoint(session.email).catch(() => getUser(session.email))
  if (!user || user.active === false) return null
  return publicUser(user)
}



function isExperienceUser(user) {
  return user?.role === "EXPERIENCIA_CLIENTES"
}

app.http("users-source-config", {
  methods: ["GET", "POST"], authLevel: "anonymous", route: "users/source",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    if (request.method === "GET") {
      const url = await getUsersExcelUrl()
      return json(200, {
        configured: Boolean(url),
        url,
        sheet: process.env.USERS_EXCEL_SHEET || "Usuarios",
      })
    }

    const data = await body(request)
    const url = String(data.url || "").trim()
    if (!url) return json(400, { message: "Pega el enlace del Excel online." })

    try {
      const test = await loadUsersFromExcel(url, { force: true })
      await saveUsersExcelUrl(url, user.email)
      return json(200, {
        message: "Excel conectado correctamente.",
        meta: test.meta,
      })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible leer el Excel." })
    }
  },
})

app.http("users-directory", {
  methods: ["GET"], authLevel: "anonymous", route: "users/directory",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    const url = await getUsersExcelUrl()
    if (!url) return json(503, { message: "Todavía no hay un Excel de usuarios conectado." })

    try {
      const result = await loadUsersFromExcel(url)
      return json(200, result)
    } catch (error) {
      return json(502, { message: error?.message || "No fue posible leer el Excel de usuarios." })
    }
  },
})

app.http("kpi-source-config", {
  methods: ["GET", "POST"], authLevel: "anonymous", route: "kpi/source",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!isExperienceUser(user)) return json(403, { message: "Acceso reservado para Experiencia de Clientes." })

    if (request.method === "GET") {
      const url = await getKpiExcelUrl()
      const snapshot = await getKpiSnapshot()
      return json(200, {
        configured: Boolean(url),
        url,
        lastSnapshotAt: snapshot?.meta?.checkedAt || null,
      })
    }

    const data = await body(request)
    const url = String(data.url || "").trim()
    if (!url) return json(400, { message: "Pega el enlace del Excel KPI online." })

    try {
      const result = await loadKpiFromExcel(url, { force: true })
      await saveKpiExcelUrl(url, user.email)
      await saveKpiSnapshot(result, user.email)
      return json(200, {
        message: "Fuente KPI conectada correctamente.",
        data: result,
      })
    } catch (error) {
      return json(400, { message: error?.message || "No fue posible leer el Excel KPI." })
    }
  },
})

app.http("kpi-data", {
  methods: ["GET"], authLevel: "anonymous", route: "kpi/data",
  handler: async (request) => {
    const user = await currentUser(request)
    if (!user) return json(401, { message: "Sesión no válida." })

    const url = await getKpiExcelUrl()
    if (!url) {
      const snapshot = await getKpiSnapshot()
      if (snapshot) return json(200, { ...snapshot, stale: true, warning: "La fuente KPI no está configurada; mostrando el último snapshot válido." })
      return json(503, { message: "Todavía no hay un Excel KPI conectado." })
    }

    try {
      const result = await loadKpiFromExcel(url)
      await saveKpiSnapshot(result, user.email).catch(() => {})
      return json(200, { ...result, stale: false })
    } catch (error) {
      const snapshot = await getKpiSnapshot()
      if (snapshot) {
        return json(200, {
          ...snapshot,
          stale: true,
          warning: error?.message || "No fue posible actualizar el Excel KPI; mostrando el último snapshot válido.",
        })
      }
      return json(502, { message: error?.message || "No fue posible leer el Excel KPI." })
    }
  },
})

app.http("auth-me", {
  methods: ["GET"], authLevel: "anonymous", route: "auth/me",
  handler: async (request) => {
    const user = await currentUser(request)
    return user ? json(200, { user }) : json(401, { message: "Sesión no válida." })
  },
})

app.http("auth-login", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/login",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const password = String(data.password || "")
    if (!validCorporateEmail(email)) return json(401, { message: "Correo o contraseña incorrectos." })

    const user = await eligibleUser(email)
    if (!user || user.active === false || !user.passwordHash) return json(401, { message: "Cuenta no activada o credenciales incorrectas." })
    if (user.lockedUntil && new Date(user.lockedUntil).getTime() > Date.now()) return json(429, { message: "Acceso bloqueado temporalmente por seguridad. Intenta más tarde." })

    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      const failed = Number(user.failedLoginCount || 0) + 1
      await upsertUser({ ...user, failedLoginCount: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60_000).toISOString() : undefined })
      return json(401, { message: "Correo o contraseña incorrectos." })
    }

    await upsertUser({ ...user, failedLoginCount: 0, lockedUntil: undefined, lastLoginAt: new Date().toISOString() })
    const session = await createSession(email, SESSION_DAYS)
    return json(200, { user: publicUser(user) }, { "Set-Cookie": sessionCookie(session, SESSION_DAYS * 86400) })
  },
})


app.http("auth-manual-activate", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/manual-activate",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const password = String(data.password || "")
    const setupKey = String(data.setupKey || "")
    const allowedEmail = normalizeEmail(process.env.AUTH_SETUP_EMAIL || "")
    const expectedKey = String(process.env.AUTH_SETUP_KEY || "")

    if (!allowedEmail || !expectedKey) {
      return json(503, { message: "La activación manual no está habilitada." })
    }
    if (!validCorporateEmail(email) || email !== allowedEmail) {
      return json(403, { message: "Este correo no está autorizado para la activación manual." })
    }
    if (!setupKey || setupKey.length < 16 || setupKey !== expectedKey) {
      return json(403, { message: "La clave temporal de instalación no es válida." })
    }
    if (!validPassword(password)) {
      return json(400, { message: "La contraseña debe tener al menos 10 caracteres, letras y números." })
    }

    const existing = await getUser(email)
    if (existing?.passwordHash) {
      return json(409, { message: "La cuenta ya está activada. Ingresa normalmente con tu correo y contraseña." })
    }
    const passwordHash = await hashPassword(password)
    const updated = await upsertUser({
      ...(existing || {}),
      email,
      name: process.env.AUTH_SETUP_NAME || existing?.name || email.split("@")[0],
      role: "EXPERIENCIA_CLIENTES",
      scope: "RED",
      areaFunctional: "Experiencia de Clientes",
      active: true,
      passwordHash,
      activatedAt: existing?.activatedAt || new Date().toISOString(),
      passwordChangedAt: new Date().toISOString(),
      failedLoginCount: 0,
      lockedUntil: undefined,
    })

    const session = await createSession(email, SESSION_DAYS)
    return json(200, {
      user: publicUser(updated),
      message: "Acceso activado. Ya puedes ingresar con tu correo y contraseña.",
    }, { "Set-Cookie": sessionCookie(session, SESSION_DAYS * 86400) })
  },
})

app.http("auth-request-activation", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/request-activation",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const generic = "Si tu correo está habilitado en Ditalcar, recibirás un enlace para activar tu cuenta."
    if (!validCorporateEmail(email)) return json(200, { message: generic })
    const user = await eligibleUser(email)
    if (!user || user.active === false || user.passwordHash) return json(200, { message: generic })

    const token = await createOneTimeToken(email, "ACTIVATION", 60)
    const url = `${APP_URL || new URL(request.url).origin}/?activation=${encodeURIComponent(token)}`
    const mail = await sendAuthMail({ to: email, subject: "Activa tu cuenta · Ditalcar Colaboradores", title: "Activa tu cuenta", text: "Crea tu contraseña personal para ingresar a Ditalcar Colaboradores. El enlace vence en 60 minutos.", buttonText: "Crear mi contraseña", url })
    return json(200, { message: generic, ...(mail.devUrl ? { devUrl: mail.devUrl } : {}) })
  },
})

app.http("auth-activate", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/activate",
  handler: async (request) => {
    const data = await body(request)
    if (!validPassword(data.password)) return json(400, { message: "La contraseña debe tener al menos 10 caracteres, letras y números." })
    const token = await consumeOneTimeToken(String(data.token || ""), "ACTIVATION")
    if (!token) return json(400, { message: "El enlace de activación no es válido o ya venció." })
    const user = await eligibleUser(token.email)
    if (!user || user.active === false) return json(403, { message: "Usuario no habilitado." })
    const passwordHash = await hashPassword(data.password)
    const updated = await upsertUser({ ...user, passwordHash, activatedAt: new Date().toISOString(), failedLoginCount: 0, lockedUntil: undefined })
    return json(200, { user: publicUser(updated), message: "Cuenta activada." })
  },
})

app.http("auth-request-reset", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/request-reset",
  handler: async (request) => {
    const data = await body(request)
    const email = normalizeEmail(data.email)
    const generic = "Si el correo está registrado, recibirás un enlace para crear una nueva contraseña."
    const user = validCorporateEmail(email) ? await eligibleUser(email) : null
    if (!user || !user.passwordHash || user.active === false) return json(200, { message: generic })
    const token = await createOneTimeToken(email, "RESET", 30)
    const url = `${APP_URL || new URL(request.url).origin}/?reset=${encodeURIComponent(token)}`
    const mail = await sendAuthMail({ to: email, subject: "Recupera tu acceso · Ditalcar Colaboradores", title: "Recupera tu acceso", text: "Usa este enlace para crear una nueva contraseña. El enlace vence en 30 minutos.", buttonText: "Crear nueva contraseña", url })
    return json(200, { message: generic, ...(mail.devUrl ? { devUrl: mail.devUrl } : {}) })
  },
})

app.http("auth-reset-password", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/reset-password",
  handler: async (request) => {
    const data = await body(request)
    if (!validPassword(data.password)) return json(400, { message: "La contraseña debe tener al menos 10 caracteres, letras y números." })
    const token = await consumeOneTimeToken(String(data.token || ""), "RESET")
    if (!token) return json(400, { message: "El enlace de recuperación no es válido o ya venció." })
    const user = await getUser(token.email)
    if (!user || user.active === false) return json(403, { message: "Usuario no habilitado." })
    await upsertUser({ ...user, passwordHash: await hashPassword(data.password), failedLoginCount: 0, lockedUntil: undefined, passwordChangedAt: new Date().toISOString() })
    return json(200, { message: "Contraseña actualizada." })
  },
})

app.http("auth-logout", {
  methods: ["POST"], authLevel: "anonymous", route: "auth/logout",
  handler: async (request) => {
    await deleteSession(getSessionToken(request))
    return json(200, { message: "Sesión cerrada." }, { "Set-Cookie": clearSessionCookie() })
  },
})
