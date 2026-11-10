import type { Language } from "../i18n"
import type { IndicatorCode, JobAnalysisResponse, RiskCategory } from "../services/api"

export const riskLabels: Record<RiskCategory, Record<Language, string>> = {
  low: { ID: "Risiko Rendah", EN: "Low Risk" },
  medium: { ID: "Perlu Waspada", EN: "Needs Caution" },
  high: { ID: "Risiko Tinggi", EN: "High Risk" },
  insufficient_data: { ID: "Data Belum Cukup", EN: "Insufficient Data" },
}

export const indicatorLabels: Record<IndicatorCode, Record<Language, string>> = {
  upfront_payment: { ID: "Permintaan Pembayaran Awal", EN: "Upfront Payment Request" },
  credential_request: { ID: "Permintaan Kredensial / OTP", EN: "Credential / OTP Request" },
  premature_sensitive_data: { ID: "Data Sensitif Terlalu Dini", EN: "Premature Sensitive Data" },
  urgency_pressure: { ID: "Tekanan Waktu / Larangan Verifikasi", EN: "Urgency Pressure" },
  unrealistic_offer: { ID: "Tawaran Gaji Tidak Wajar", EN: "Unrealistic Offer" },
  unofficial_channel: { ID: "Kanal Komunikasi Meragukan", EN: "Suspicious Channel" },
}

const legalSummaries: Record<JobAnalysisResponse["legal_screening"]["status"], Record<Language, string>> = {
  potential_issue: {
    ID: "Rujukan relevan ditemukan. Periksa cakupan dan pengecualian sebelum menerapkannya.",
    EN: "Relevant references were found. Check their scope and exceptions before applying them.",
  },
  needs_more_context: {
    ID: "Diperlukan informasi tambahan untuk meninjau konteks hukum tawaran ini.",
    EN: "More information is needed to assess the legal context of this offer.",
  },
  no_relevant_reference: {
    ID: "Belum ditemukan rujukan yang cukup relevan untuk materi ini.",
    EN: "No sufficiently relevant references were found for this material.",
  },
  reference_unavailable: {
    ID: "Rujukan hukum sedang tidak tersedia.",
    EN: "Legal references are currently unavailable.",
  },
}

export function legalSummary(legal: JobAnalysisResponse["legal_screening"], lang: Language) {
  return legalSummaries[legal.status][lang]
}