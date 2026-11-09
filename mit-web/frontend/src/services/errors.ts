import type { Language } from "../i18n"

const messages: Record<string, [string, string]> = {
  missing_api: ["Layanan Jeli belum dikonfigurasi.", "The Jeli service is not configured."],
  network: ["Tidak dapat terhubung ke Jeli. Coba lagi.", "Could not connect to Jeli. Try again."],
  invalid_response: ["Respons Jeli tidak dapat dibaca. Coba lagi.", "Could not read Jeli's response. Try again."],
  empty_input: ["Masukkan teks, tautan, atau gambar lowongan.", "Enter job posting text, a link, or an image."],
  invalid_url: ["Masukkan tautan HTTP atau HTTPS yang valid.", "Enter a valid HTTP or HTTPS link."],
  url_content_unavailable: ["Halaman tidak dapat dibaca. Tempelkan teks lowongan.", "Could not read the page. Paste the job posting text."],
  invalid_text: ["Teks atau tautan terlalu panjang.", "The text or link is too long."],
  request_too_large: ["Masukan terlalu besar. Kurangi ukurannya dan coba lagi.", "The input is too large. Reduce its size and try again."],
  image_too_large: ["Gambar terlalu besar. Gunakan gambar yang lebih kecil.", "The image is too large. Use a smaller image."],
  unsupported_image_type: ["Gunakan gambar JPEG, PNG, atau WebP.", "Use a JPEG, PNG, or WebP image."],
  image_type_mismatch: ["Isi gambar tidak cocok dengan format berkas.", "The image contents do not match the file format."],
  animated_image: ["Gunakan gambar statis.", "Use a still image."],
  sensitive_input: ["Gunakan contoh fiktif dan hapus kontak atau kode rahasia.", "Use a fictional example and remove contact details or secret codes."],
  validation_error: ["Periksa masukan dan coba lagi.", "Check your input and try again."],
  invalid_session: ["Sesi tidak valid. Mulai latihan baru.", "The session is invalid. Start a new practice session."],
  session_expired: ["Sesi kedaluwarsa. Mulai latihan baru.", "The session expired. Start a new practice session."],
  session_finished: ["Latihan ini sudah selesai.", "This practice session has ended."],
  duplicate_turn: ["Balasan ini sudah diproses.", "This reply has already been processed."],
  scenario_not_found: ["Skenario tidak ditemukan. Pilih skenario lain.", "Scenario not found. Choose another scenario."],
  provider_timeout: ["Jeli belum merespons. Coba lagi.", "Jeli took too long to respond. Try again."],
  provider_rate_limited: ["Layanan sedang sibuk. Coba lagi nanti.", "The service is busy. Try again later."],
}

export class JeliApiError extends Error {
  readonly code: string

  constructor(code: string, lang: Language, status?: number) {
    const fallback: [string, string] = status && status >= 500
      ? ["Layanan Jeli sedang tidak tersedia. Coba lagi nanti.", "The Jeli service is unavailable. Try again later."]
      : ["Permintaan gagal. Periksa masukan dan coba lagi.", "The request failed. Check your input and try again."]
    const copy = Object.hasOwn(messages, code) ? messages[code] : fallback
    super(copy[lang === "ID" ? 0 : 1])
    this.code = code
  }
}

export async function readApiError(response: Response, lang: Language) {
  const payload = (await response.json().catch(() => null)) as { error?: { code?: unknown } } | null
  const code = payload?.error?.code
  return new JeliApiError(typeof code === "string" ? code : "http_error", lang, response.status)
}
