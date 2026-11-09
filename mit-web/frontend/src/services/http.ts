import type { Language } from "../i18n"
import { JeliApiError, readApiError } from "./errors"

const configuredUrl = import.meta.env.VITE_AI_API_URL?.trim().replace(/\/+$/, "")
const loopbackApi = /^http:\/\/(?:localhost|127\.0\.0\.1):8000$/i.test(configuredUrl ?? "")
const localBrowser = import.meta.env.DEV
  || ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname)
const local = localBrowser && (!configuredUrl || loopbackApi)

export async function apiRequest(path: string, lang: Language, options: RequestInit = {}) {
  if (!local && (!configuredUrl || loopbackApi)) throw new JeliApiError("missing_api", lang)

  const response = await fetch(`${local ? "" : configuredUrl}/api/v1/${path}`, options)
    .catch((error: unknown) => {
      if (options.signal?.aborted) throw error
      throw new JeliApiError(local ? "local_api_unavailable" : "network", lang)
    })

  if (!response.ok) {
    if (local && response.status >= 500 && !response.headers.get("content-type")?.includes("json")) {
      throw new JeliApiError("local_api_unavailable", lang)
    }
    throw await readApiError(response, lang)
  }
  return response
}
