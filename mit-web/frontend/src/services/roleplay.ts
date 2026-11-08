export type Outcome = "active" | "verified_exit" | "risky_choice" | "needs_clarification" | "stopped"
export interface Scenario {
  id: string
  title: string
  description: string
  objective: string
  language: "ID"
  version: "roleplay-v1"
}
export interface Report {
  outcome: Outcome
  skills: { code: string; label: string; status: "observed" | "practice" | "unobserved" }[]
  moments: { message_id: string; quote: string; trigger: string; explanation: string }[]
  next_step: string
  safe_reply: string
}
export interface RoleplaySession {
  roleplay_version: "roleplay-v1"
  mode: "live" | "mock"
  scenario_id: string
  session_token: string
  expires_at: number
  turn_index: number
  max_turns: number
  outcome: Outcome
  messages: { id: string; role: "recruiter" | "user"; text: string }[]
  hint: string
  report: Report
}

const baseUrl = import.meta.env.VITE_AI_API_URL?.trim().replace(/\/+$/, "")
  || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")

async function request<T>(path: string, signal: AbortSignal, body?: unknown): Promise<T> {
  if (!baseUrl) throw new Error("Alamat backend AI belum dikonfigurasi. Atur VITE_AI_API_URL.")
  const response = await fetch(`${baseUrl}/api/v1/roleplay/${path}`, {
    signal,
    ...(body === undefined ? {} : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
  }).catch((error: unknown) => {
    if (signal.aborted) throw error
    throw new Error("Tidak dapat menghubungi backend AI. Coba lagi atau akhiri latihan.")
  })
  const value = await response.json().catch(() => null)
  if (!response.ok) throw new Error(value?.error?.message ?? `Permintaan gagal (${response.status}).`)
  if (!value) throw new Error("Respons roleplay tidak valid.")
  return value as T
}

export async function getScenarios(signal: AbortSignal): Promise<Scenario[]> {
  const result = await request<Scenario[]>("scenarios", signal)
  if (!Array.isArray(result) || result.some((s) => s.version !== "roleplay-v1")) {
    throw new Error("Daftar latihan tidak valid.")
  }
  return result
}

export async function roleplayRequest(
  path: "start" | "turn", body: unknown, signal: AbortSignal,
): Promise<RoleplaySession> {
  const result = await request<RoleplaySession>(path, signal, body)
  if (result.roleplay_version !== "roleplay-v1" || !Array.isArray(result.messages)
    || !result.report || !Array.isArray(result.report.skills) || !Array.isArray(result.report.moments)
    || !["active", "verified_exit", "risky_choice", "needs_clarification", "stopped"].includes(result.outcome)) {
    throw new Error("Respons roleplay tidak valid.")
  }
  return result
}
