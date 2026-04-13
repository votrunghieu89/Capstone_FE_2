import axios from "axios"
import {
  getRoleFromAccessToken,
  getRoleFromPersistedStore,
  getTokenFromCookie,
  getTokenFromPersistedStore,
  isTokenExpired,
} from "@/utils/authToken"

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

const adminCookieClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  withCredentials: true,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
})

function getTokenCandidates(): string[] {
  const lsToken = localStorage.getItem("accessToken") || ""
  const legacyToken = localStorage.getItem("fastfix_token") || ""
  const persistedToken = getTokenFromPersistedStore()
  const persistedRole = getRoleFromPersistedStore()
  const cookieToken = getTokenFromCookie()

  const candidates: string[] = []

  if (persistedRole === "admin" && persistedToken && !isTokenExpired(persistedToken)) {
    candidates.push(persistedToken)
  }

  for (const token of [lsToken, cookieToken, legacyToken, persistedToken]) {
    if (!token || isTokenExpired(token)) continue
    const role = getRoleFromAccessToken(token)
    if (!role || role.includes("admin")) {
      candidates.push(token)
    }
  }

  return Array.from(new Set(candidates))
}

async function withTokenRetry<T>(
  requester: (headers?: Record<string, string>) => Promise<T>,
  cookieRequester: () => Promise<T>
): Promise<T> {
  const candidates = getTokenCandidates()

  for (const token of candidates) {
    try {
      const result = await requester({ Authorization: `Bearer ${token}` })
      if (localStorage.getItem("accessToken") !== token) {
        localStorage.setItem("accessToken", token)
      }
      return result
    } catch (error: any) {
      if (error?.response?.status !== 401) throw error
    }
  }

  return cookieRequester()
}

export async function adminGet(path: string): Promise<unknown> {
  return withTokenRetry(
    async (headers) => (await adminClient.get(path, { headers })).data,
    async () => (await adminCookieClient.get(path)).data
  )
}

export async function adminPost(path: string, data: unknown): Promise<unknown> {
  return withTokenRetry(
    async (headers) => (await adminClient.post(path, data, { headers })).data,
    async () => (await adminCookieClient.post(path, data)).data
  )
}

export async function adminPut(path: string, data: unknown): Promise<unknown> {
  return withTokenRetry(
    async (headers) => (await adminClient.put(path, data, { headers })).data,
    async () => (await adminCookieClient.put(path, data)).data
  )
}

export async function adminDelete(path: string): Promise<unknown> {
  return withTokenRetry(
    async (headers) => (await adminClient.delete(path, { headers })).data,
    async () => (await adminCookieClient.delete(path)).data
  )
}

export function normalizeListPayload<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as T[]
    if (Array.isArray(obj.data)) return obj.data as T[]
    if (obj.data && typeof obj.data === "object") {
      const dataObj = obj.data as Record<string, unknown>
      if (Array.isArray(dataObj.items)) return dataObj.items as T[]
    }
  }
  return []
}
