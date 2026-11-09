export type Outcome = "active" | "verified_exit" | "risky_choice" | "needs_clarification" | "stopped"

export interface QuestionOption {
  id: string
  label: string
  text: string
  is_correct: boolean
  feedback_label: string
  explanation: string
}

export interface SimulatorQuestion {
  question_number: number
  title: string
  recruiter_message: string
  challenge_text: string
  options: QuestionOption[]
  good_answer_summary: string
  educational_takeaway: string
}

export interface Scenario {
  id: string
  title: string
  description: string
  objective: string
  language: "ID"
  version: "roleplay-v1"
  total_questions?: number
  questions?: SimulatorQuestion[]
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
    throw new Error("Tidak dapat menghubungi backend AI. Pastikan server backend sedang berjalan.")
  })
  const value = await response.json().catch(() => null)
  if (!response.ok) throw new Error(value?.error?.message ?? `Permintaan gagal (${response.status}).`)
  if (!value) throw new Error("Respons roleplay tidak valid.")
  return value as T
}

export async function getScenarios(signal: AbortSignal, lang: "ID" | "EN" = "ID"): Promise<Scenario[]> {
  const result = await request<Scenario[]>(`scenarios?lang=${lang.toLowerCase()}`, signal)
  if (!Array.isArray(result) || result.some((s) => s.version !== "roleplay-v1")) {
    throw new Error(lang === "ID" ? "Daftar latihan tidak valid." : "Invalid training scenarios list.")
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

export async function generateCustomScenario(prompt: string, signal: AbortSignal): Promise<Scenario> {
  const result = await request<Scenario>("custom", signal, { user_prompt: prompt })
  if (!result || result.version !== "roleplay-v1") {
    throw new Error("Gagal membuat skenario kustom.")
  }
  return result
}

export interface ChatMessageItem {
  id: string
  role: "user" | "assistant"
  text: string
  timestamp: string
  emotion?: "talking" | "happy" | "warning" | "thinking" | "celebrate"
}

export interface LiveChatResponse {
  reply: string
  emotion: "talking" | "happy" | "warning" | "thinking" | "celebrate"
  key_takeaway: string
  suggested_replies: string[]
}

export async function chatLiveRoleplay(
  message: string,
  character: "jeli" | "recruiter",
  history: { role: "user" | "assistant"; text: string }[],
  language: "ID" | "EN" = "ID",
  signal?: AbortSignal
): Promise<LiveChatResponse> {
  return request<LiveChatResponse>("chat", signal || new AbortController().signal, {
    message,
    character,
    language,
    history: history.slice(-6),
  })
}

export function getTtsAudioUrl(text: string, lang: "id" | "en" = "id"): string {
  const clean = text
    .replace(/https?:\/\/\S+/g, lang === "en" ? "web link" : "tautan web")
    .replace(/[*_#`~[\]]/g, "")
    .replace(/\s+/g, " ")
    .trim()
  return `${baseUrl}/api/v1/roleplay/tts?lang=${lang}&text=${encodeURIComponent(clean)}`
}


