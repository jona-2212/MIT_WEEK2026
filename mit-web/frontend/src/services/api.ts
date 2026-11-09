import type { Language } from "../i18n"
import { JeliApiError, readApiError } from "./errors"

export type RiskCategory = "low" | "medium" | "high" | "insufficient_data"
export type IndicatorCode =
  | "upfront_payment"
  | "credential_request"
  | "premature_sensitive_data"
  | "urgency_pressure"
  | "unrealistic_offer"
  | "unofficial_channel"

export interface JobAnalysisResponse {
  request_id?: string
  status?: "completed" | "insufficient_data"
  input_mode?: "text" | "image" | "both" | "url"
  analysis_version: "recognition-v2"
  fraud_assessment: {
    risk_category: RiskCategory
    summary: string
    indicators: {
      code: IndicatorCode
      state: "detected" | "uncertain" | "not_detected"
      reason: string
      evidence: { source: "text" | "image"; quote: string }[]
    }[]
    recommendations: string[]
  }
  legal_screening: {
    status: "potential_issue" | "needs_more_context" | "no_relevant_reference" | "reference_unavailable"
    summary: string
    references: {
      chunk_id: string
      title: string
      article: string | null
      official_url: string
      excerpt: string
    }[]
  }
  disclaimer: string
}

const apiUrl = import.meta.env.VITE_AI_API_URL?.trim().replace(/\/+$/, "")
  || (import.meta.env.DEV ? "http://127.0.0.1:8000" : "")
export const AHU_COMPANY_SEARCH_URL = "https://ahu.go.id/pencarian/profil-pt/"

export async function analyzeJob({
  text,
  file,
  url,
  lang = "ID",
  signal,
}: {
  text?: string
  file?: File
  url?: string
  lang?: Language
  signal?: AbortSignal
}): Promise<JobAnalysisResponse> {
  if (!apiUrl) {
    throw new JeliApiError("missing_api", lang)
  }

  const body = new FormData()
  if (text) body.append("text", text)
  if (file) body.append("file", file)
  if (url) body.append("url", url)

  const response = await fetch(`${apiUrl}/api/v1/analyze?lang=${lang}`, {
    method: "POST",
    body,
    signal,
  }).catch((error: unknown) => {
    if (signal?.aborted) throw error
    throw new JeliApiError("network", lang)
  })
  if (!response.ok) {
    throw await readApiError(response, lang)
  }
  const result = (await response.json().catch(() => null)) as JobAnalysisResponse | null
  if (result?.analysis_version !== "recognition-v2" || !result.fraud_assessment || !result.legal_screening) {
    throw new JeliApiError("invalid_response", lang)
  }
  return result
}
