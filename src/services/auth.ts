import { PublicClientApplication, type AccountInfo } from "@azure/msal-browser"
import { appConfig } from "../config"

const scopes = ["User.Read", "Sites.ReadWrite.All"]

export const msal = new PublicClientApplication({
  auth: {
    clientId: appConfig.entra.clientId,
    authority: `https://login.microsoftonline.com/${appConfig.entra.tenantId}`,
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: { cacheLocation: "localStorage" },
})

export async function initAuth() {
  await msal.initialize()
  const result = await msal.handleRedirectPromise()
  if (result?.account) msal.setActiveAccount(result.account)
  if (!msal.getActiveAccount() && msal.getAllAccounts().length) {
    msal.setActiveAccount(msal.getAllAccounts()[0])
  }
}

export function getAccount(): AccountInfo | null {
  return msal.getActiveAccount() ?? null
}

export async function signIn() {
  await msal.loginRedirect({ scopes })
}

export async function signOut() {
  await msal.logoutRedirect()
}

export async function getAccessToken(): Promise<string> {
  const account = getAccount()
  if (!account) throw new Error("No hay sesión iniciada.")
  try {
    const result = await msal.acquireTokenSilent({ account, scopes })
    return result.accessToken
  } catch {
    await msal.acquireTokenRedirect({ account, scopes })
    throw new Error("Redirigiendo para renovar la sesión.")
  }
}
export async function getCurrentUser(): Promise<{ displayName: string }> {
  const account = getAccount()

  return {
    displayName: account?.name || "Usuario Ditalcar"
  }
}
