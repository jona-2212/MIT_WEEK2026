import type { Language } from "../i18n"
import { JeliApiError, readApiError } from "./errors"

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
  language: Language
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
  language?: Language
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

async function request<T>(path: string, signal: AbortSignal, lang: Language, body?: unknown): Promise<T> {
  if (!baseUrl) throw new JeliApiError("missing_api", lang)
  const response = await fetch(`${baseUrl}/api/v1/roleplay/${path}`, {
    signal,
    ...(body === undefined ? {} : {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }),
  }).catch((error: unknown) => {
    if (signal.aborted) throw error
    throw new JeliApiError("network", lang)
  })
  if (!response.ok) throw await readApiError(response, lang)
  const value: unknown = await response.json().catch(() => null)
  if (!value) throw new JeliApiError("invalid_response", lang)
  return value as T
}

async function requestCatalog(path: "scenarios" | "chat-scenarios", signal: AbortSignal, lang: Language) {
  const result = await request<Scenario[]>(`${path}?lang=${lang.toLowerCase()}`, signal, lang)
  if (!Array.isArray(result) || result.some((item) => item?.version !== "roleplay-v1" || (item.language ?? "ID") !== lang)) {
    throw new JeliApiError("invalid_response", lang)
  }
  return result
}

export function getScenarios(signal: AbortSignal, lang: Language = "ID") {
  return requestCatalog("scenarios", signal, lang)
}

export async function roleplayRequest(
  path: "start" | "turn", body: unknown, signal: AbortSignal, lang: Language = "ID",
): Promise<RoleplaySession> {
  const result = await request<RoleplaySession>(path, signal, lang, body)
  if (result.roleplay_version !== "roleplay-v1" || (result.language ?? "ID") !== lang
    || !Array.isArray(result.messages)
    || !result.report || !Array.isArray(result.report.skills) || !Array.isArray(result.report.moments)
    || !["active", "verified_exit", "risky_choice", "needs_clarification", "stopped"].includes(result.outcome)) {
    throw new JeliApiError("invalid_response", lang)
  }
  return result
}

export function getChatScenarios(signal: AbortSignal, lang: Language = "ID") {
  return requestCatalog("chat-scenarios", signal, lang)
}

export async function generateCustomScenario(prompt: string, signal: AbortSignal, language: Language): Promise<Scenario> {
  const result = await request<Scenario>("custom", signal, language, { user_prompt: prompt, language })
  if (result.version !== "roleplay-v1" || result.language !== language || !result.questions?.length) {
    throw new JeliApiError("invalid_response", language)
  }
  return result
}

export interface ChatMessageItem {
  id: string
  role: "user" | "assistant"
  text: string
  mode?: "live" | "fallback"
  timestamp: string
  emotion?: "talking" | "happy" | "warning" | "thinking" | "celebrate"
}

export interface LiveChatResponse {
  mode: "live" | "fallback"
  reply: string
  emotion: "talking" | "happy" | "warning" | "thinking" | "celebrate"
  key_takeaway: string
  suggested_replies: string[]
}

export async function chatLiveRoleplay(
  message: string,
  character: "jeli" | "recruiter",
  history: { role: "user" | "assistant"; text: string }[],
  language: Language = "ID",
  signal?: AbortSignal
): Promise<LiveChatResponse> {
  const result = await request<LiveChatResponse>("chat", signal || new AbortController().signal, language, {
    message,
    character,
    language,
    history: history.slice(-6),
  })
  if (typeof result.reply !== "string" || !["live", "fallback"].includes(result.mode)
    || !["talking", "happy", "warning", "thinking", "celebrate"].includes(result.emotion)) {
    throw new JeliApiError("invalid_response", language)
  }
  return result
}

export async function getTtsAudio(text: string, lang: "id" | "en", signal: AbortSignal) {
  if (!baseUrl) throw new Error("TTS unavailable.")
  const response = await fetch(`${baseUrl}/api/v1/roleplay/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, lang }),
    signal,
  })
  if (response.status !== 200) throw new Error("TTS unavailable.")
  return response.blob()
}
