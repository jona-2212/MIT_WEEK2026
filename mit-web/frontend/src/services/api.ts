export interface JobAnalysisResponse {
  score: number
  risk_level: "low" | "medium" | "high"
  summary: string
  indicators: string[]
  recommendations: string[]
  source: string
  disclaimer: string
}

export interface CompanyResult {
  name: string
  registration_number: string
  address: string
  status: "active" | "inactive"
}

export interface CompanySearchResponse {
  found: boolean
  company: CompanyResult | null
  source: string
  official_url: string
  disclaimer: string
}

const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000"
export const AHU_COMPANY_SEARCH_URL = "https://ahu.go.id/pencarian/profil-pt/"

async function request<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${apiUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as { detail?: string } | null
    throw new Error(error?.detail ?? "API request failed.")
  }
  return (await response.json()) as T
}

export function analyzeJob(inputType: "text" | "url" | "image", content: string, language: "ID" | "EN") {
  return request<JobAnalysisResponse>("/api/analyze-job", {
    input_type: inputType,
    content,
    language,
  })
}

export function searchCompany(name: string) {
  return request<CompanySearchResponse>("/api/company-search", { name })
}
