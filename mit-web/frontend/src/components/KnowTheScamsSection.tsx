import React, { useState } from "react"
import {
  AlertTriangle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  Eye,
  Search,
} from "lucide-react"

interface KnowTheScamsSectionProps {
  onCheckJobOffer: () => void
  lang: "ID" | "EN"
}

export const KnowTheScamsSection: React.FC<KnowTheScamsSectionProps> = ({
  onCheckJobOffer,
  lang,
}) => {
  const [activeCategory, setActiveCategory] = useState<number>(0)

  const scamCategories = [
    {
      id: 0,
      title: lang === "ID" ? "Biaya Rekrutmen Fiktif" : "Fake Recruitment Fees",
      tagline:
        lang === "ID"
          ? "Modus Transfer Seragam, Tes Medis, & Tiket Travel"
          : "Advance fees for uniforms, medical checkup, or travel",
      badge: lang === "ID" ? "BIAYA DI AWAL" : "UPFRONT FEES",
      explanation:
        lang === "ID"
          ? "Pelamar diminta mentransfer sejumlah uang di awal dengan alasan biaya administrasi, seragam kerja, tes psikotes, atau pemesanan tiket travel agen rekanan. Penipu menjanjikan uang akan dikembalikan (reimburse) saat hari pertama kerja, yang tidak pernah terjadi."
          : "Candidates are asked to transfer money upfront for uniform deposits, ID badges, medical checkups, or partner travel agencies with a false reimbursement promise.",
      sampleQuote:
        lang === "ID"
          ? '"Harap transfer biaya pembuatan ID Card & Seragam Rp350.000 ke rekening Bendahara Panitia (Bank BCA 8820xxxx). Bukti transfer dikirim sebelum jam 17:00."'
          : '"Please transfer ID card fee of Rp350.000 to our committee account before 5 PM to confirm your placement."',
      warningSigns: [
        lang === "ID"
          ? "Permintaan transfer uang sebelum ada kontrak kerja resmi atau hari pertama kerja."
          : "Any upfront payment request before an official employment contract.",
        lang === "ID"
          ? "Pembayaran diarahkan ke nomor rekening atas nama pribadi, bukan rekening korporat PT."
          : "Bank transfer requested to personal names instead of an official company account.",
        lang === "ID"
          ? "Penyedia akomodasi / travel wajib memakai satu agen travel tertentu yang tidak dikenal."
          : "Mandatory booking through an unknown exclusive travel agent.",
      ],
      safetyActions: [
        lang === "ID"
          ? "Tunda pembayaran dan periksa permintaan biaya melalui kanal resmi perusahaan."
          : "Pause before paying and verify the fee request through an official company channel.",
        lang === "ID"
          ? "Tolak mentransfer uang dan segera cek reputasi nomor rekening di situs resmi CekRekening.id."
          : "Refuse payment and verify bank account on official police blacklists.",
        lang === "ID"
          ? "Gunakan kanal pengaduan resmi bila perlu."
          : "Use an official reporting channel if needed.",
      ],
      handwrittenNote:
        lang === "ID"
          ? "Inget ya: Kalau bayar, itu bukan cari kerja tapi beli kerjaan bodong! 💸"
          : "Rule of thumb: real jobs pay you, not the other way around!",
      type: "fee",
    },
    {
      id: 1,
      title: lang === "ID" ? "Gaji Tidak Masuk Akal" : "Unrealistic Salary",
      tagline:
        lang === "ID"
          ? "Tawaran Gaji Puluhan Juta Tanpa Syarat & Misi Paruh Waktu"
          : "Astronomical wages for simple tasks without requirements",
      badge: lang === "ID" ? "PENIPUAN TUGAS BERBAYAR" : "PAID TASK SCAM",
      explanation:
        lang === "ID"
          ? 'Lowongan menawarkan gaji belasan hingga puluhan juta rupiah per bulan untuk pekerjaan enteng seperti ketik data, like video media sosial, atau ulas produk. Pada awalnya pelamar diberi sedikit uang receh, lalu dipaksa deposit uang jutaan untuk membuka "misi bernilai tinggi".'
          : "Offers enticing astronomical salaries for trivial tasks like rating products or liking YouTube videos. Starts with small payouts to build trust, then demands hefty deposits.",
      sampleQuote:
        lang === "ID"
          ? '"Lowongan WFH Paruh Waktu: Gaji Rp15.000.000 - Rp25.000.000/bln. Tugas: Cukup like & subscribe 5 video per hari. Bebas usia, tanpa pengalaman, cukup HP!"'
          : '"Part-time WFH: Earn Rp15M - Rp25M/mo just by liking videos. No experience or CV needed!"',
      warningSigns: [
        lang === "ID"
          ? "Rentang gaji jauh melampaui UMR daerah dan tidak sebanding dengan kualifikasi yang diminta."
          : "Salary range exceeds market standards by 5x-10x for entry-level tasks.",
        lang === "ID"
          ? "Tanpa syarat pengalaman kerja, tanpa seleksi portofolio, dan tanpa wawancara mendalam."
          : "No experience required, no CV review, and no real interview screening.",
        lang === "ID"
          ? 'Pelamar dimasukkan ke grup Telegram bersama "peserta lain" yang memamerkan bukti transfer palsu.'
          : "Added to Telegram groups where bots spam fake payment receipts to induce FOMO.",
      ],
      safetyActions: [
        lang === "ID"
          ? "Bandingkan rata-rata standar gaji posisi tersebut di portal terpercaya (Glints, JobStreet, Gajimu)."
          : "Cross-check industry salary benchmarks on reputable job boards.",
        lang === "ID"
          ? "Jangan pernah mengirim deposit saldo dengan iming-iming komisi berlipat ganda."
          : 'Never transfer funds for "upgrade level" or promised mission multipliers.',
        lang === "ID"
          ? "Tinggalkan dan blokir grup Telegram tugas berbayar tanpa basa-basi."
          : "Immediately exit and report telegram task groups.",
      ],
      handwrittenNote:
        lang === "ID"
          ? "Gaji 20jt cuma modal like video? Logika jalanin dulu guys! 🧐"
          : "High salary with zero effort is always bait!",
      type: "salary",
    },
    {
      id: 2,
      title:
        lang === "ID" ? "Pencatutan Nama Perusahaan" : "Company Impersonation",
      tagline:
        lang === "ID"
          ? "Memalsukan Identitas BUMN, Bank, & Startup Ternama"
          : "Forging BUMN, multinational banks, & tech unicorns",
      badge: lang === "ID" ? "BUMN & BRAND SPOOFING" : "CORPORATE BRAND SPOOFING",
      explanation:
        lang === "ID"
          ? "Penipu membuat kop surat palsu dengan logo BUMN besar (seperti Pertamina, PLN, Telkom) atau unicorn teknologi. Mereka menggunakan domain email gratisan atau domain tiruan tipuan (typosquatting) untuk mengelabui pelamar yang tergiur nama besar perusahaan."
          : "Scammers forge official letterheads of prominent state-owned enterprises or tech companies using lookalike domains or free email addresses to mislead job seekers.",
      sampleQuote:
        lang === "ID"
          ? '"Surat Panggilan Wawancara PT PERTAMINA (PERSERO) No. 048/REK/2025. Dikirim dari: hrd.recruitment.pertamina@gmail.com atau pertamina-karir.xyz."'
          : '"Official Interview Invitation PT PERTAMINA. Sent from: pertamina.recruitment@gmail.com"',
      warningSigns: [
        lang === "ID"
          ? "Email rekrutmen memakai domain publik gratis (@gmail.com, @yahoo.com) bukan domain resmi."
          : "Recruiter emails using public webmail (@gmail, @yahoo) instead of corporate domains.",
        lang === "ID"
          ? "Situs karir beralamat ganjil (contoh: pt-telkom-rekrutmen.site bukan telkom.co.id)."
          : "Career websites hosted on suspicious domains (.xyz, .top, .site) with typoed brand names.",
        lang === "ID"
          ? "Format surat panggilan tes massal berisi puluhan nama kandidat dari berbagai kota."
          : "Mass invitation PDF listing dozens of candidate names from random cities.",
      ],
      safetyActions: [
        lang === "ID"
          ? "Verifikasi lowongan langsung di situs web karir resmi perusahaan (buka tab baru sendiri)."
          : "Check open vacancies directly on the company official verified careers portal.",
        lang === "ID"
          ? "Periksa akun LinkedIn HR resmi atau hubungi customer service resmi perusahaan."
          : "Audit HR profiles on LinkedIn and verify directly via official corporate channels.",
        lang === "ID"
          ? "Gunakan Jeli untuk memindai keaslian domain pengirim secara cermat."
          : "Use Jeli to verify email headers and domain authentication records.",
      ],
      handwrittenNote:
        lang === "ID"
          ? "BUMN gak pernah kirim surat PDF 15 halaman isi nama sekampung! 📑"
          : "Big companies never recruit via random Gmail addresses!",
      type: "impersonation",
    },
    {
      id: 3,
      title: lang === "ID" ? "Pencurian Data Pribadi" : "Personal Data Theft",
      tagline:
        lang === "ID"
          ? "Eksploitasi Foto KTP, KK, & Selfie Rekening untuk Pinjol"
          : "Stealing ID card, family card, & bank selfie for illegal loans",
      badge: lang === "ID" ? "BAHAYA PINJOL ILEGAL & IDENTITY THEFT" : "ILLEGAL LOANS & IDENTITY THEFT",
      explanation:
        lang === "ID"
          ? "Dalam tahap awal sebelum interview, pelamar diminta mengisi Google Form atau formulir mencurigakan yang mewajibkan upload foto KTP depan-belakang, Kartu Keluarga, dan foto selfie memegang buku tabungan. Data ini kemudian disalahgunakan untuk pengajuan pinjaman online ilegal atas nama korban."
          : "Candidates are required to submit high-resolution scans of ID cards, family registries, and selfie holding bank books upfront. These are weaponized to open fraudulent online loans.",
      sampleQuote:
        lang === "ID"
          ? '"Tahap Administrasi Awal: Wajib upload foto KTP asli, foto selfie memegang KTP, scan Kartu Keluarga, dan nomor rekening beserta PIN token untuk verifikasi payroll."'
          : '"Pre-screening requirement: Please upload KTP scan, selfie holding KTP, and banking details to proceed."',
      warningSigns: [
        lang === "ID"
          ? "Meminta dokumen kependudukan sensitif (KTP, KK, NPWP, Selfie) di tahap awal seleksi."
          : "Requesting highly sensitive KYC documents before an interview or formal job offer.",
        lang === "ID"
          ? "Formulir dibuat dengan Google Form / Typeform gratisan tanpa enkripsi korporat."
          : "Application forms hosted on generic public forms without corporate privacy guarantees.",
        lang === "ID"
          ? "Meminta nama gadis ibu kandung, nomor kartu debit/kredit, atau kode OTP."
          : "Asking for mother maiden name, debit card CVV, or banking OTP codes.",
      ],
      safetyActions: [
        lang === "ID"
          ? "Jangan pernah mengirim foto KTP & selfie KTP sebelum ada penandatanganan kontrak kerja resmi."
          : "Never provide ID scans or selfie verification before a verified employment contract.",
        lang === "ID"
          ? 'Beri watermark digital tebal pada KTP: "HANYA UNTUK KEPERLUAN LAMARAN DI PT X [TANGGAL]".'
          : "Apply a visible watermark on any shared document stating the exact date and employer.",
        lang === "ID"
          ? "Segera buat laporan ke Satgas Waspada Investasi & OJK jika data terlanjur terkirim."
          : "Immediately alert financial authorities if identity documents were compromised.",
      ],
      handwrittenNote:
        lang === "ID"
          ? "Jangan sampai niat cari nafkah malah ditagih DC pinjol! 😱"
          : "Always watermark your ID card before sending anywhere!",
      type: "data",
    },
    {
      id: 4,
      title:
        lang === "ID"
          ? "Tekanan & Batas Waktu Terburu-buru"
          : "Urgency & Pressure",
      tagline:
        lang === "ID"
          ? "Manipulasi Psikologis: Posisi Hangus Dalam 30 Menit"
          : "Psychological manipulation to panic victims into hasty transfer",
      badge: lang === "ID" ? "PSIKOLOGI MANIPULATIF" : "MANIPULATIVE PSYCHOLOGY",
      explanation:
        lang === "ID"
          ? 'Perekrut menciptakan kepanikan buatan dengan menetapkan batas waktu sangat sempit (misalnya "konfirmasi dalam 1 jam atau kuota diberikan ke kandidat lain"). Tujuannya adalah mematikan logika berpikir kritis pelamar agar segera mentransfer uang atau membagikan data rahasia tanpa sempat mengecek.'
          : "Scammers induce artificial panic by setting tight deadlines ('confirm within 1 hour or lose your spot'). Designed to disable critical thinking and force immediate action.",
      sampleQuote:
        lang === "ID"
          ? '"PENTING! Kuota tersisa 1 slot lagi. Waktu konfirmasi transfer Anda tinggal 28 menit 14 detik. Jika lewat, posisi otomatis dialihkan ke pelamar cadangan."'
          : '"URGENT! Only 1 slot left. Confirm transfer within 25 minutes or your slot is forfeited to the waiting list."',
      warningSigns: [
        lang === "ID"
          ? "Adanya ancaman kuota hangus atau denda pembatalan jika tidak segera mentransfer uang."
          : "Threats of spot forfeiture, cancellation penalties, or aggressive urgency timers.",
        lang === "ID"
          ? "Perekrut marah atau mendesak berkali-kali melalui telepon dan pesan beruntun."
          : "Recruiter becomes irritable or spams calls when you ask for time to verify.",
        lang === "ID"
          ? "Melarang pelamar berdiskusi dengan orang tua, teman, atau pihak luar."
          : "Discouraging you from consulting parents, mentors, or official company offices.",
      ],
      safetyActions: [
        lang === "ID"
          ? "Tarik napas dalam-dalam. Rekrutmen profesional SELALU memberikan waktu wajar untuk berpikir."
          : "Slow down. Legitimate corporate recruitment always grants reasonable review periods.",
        lang === "ID"
          ? "Tanyakan kontak resmi kantor pusat perusahaan untuk melakukan konfirmasi mandiri."
          : "Request official company headquarters contact details to confirm independently.",
        lang === "ID"
          ? "Gunakan tombol Cek Tawaran di Jeli untuk memverifikasi teks pesan dalam hitungan detik."
          : "Use Jeli AI scanner to verify the pressure message in 15 seconds.",
      ],
      handwrittenNote:
        lang === "ID"
          ? "Semakin diburu-buru, semakin 1000% itu penipuan! ⏳"
          : "The higher the urgency, the higher the scam probability!",
      type: "urgency",
    },
  ]

  const cur = scamCategories[activeCategory]

  return (
    <section
      id="know-the-scams"
      className="relative py-24 bg-[#F7F7F0] text-[#202C2B] overflow-hidden border-t border-[#064B50]/10"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Headline & Description */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#064B50]/15 mb-4 shadow-2xs">
            <Eye className="w-3.5 h-3.5 text-[#087F7A]" />
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#064B50]">
              {lang === "ID"
                ? "PANDUAN MODUS PENIPUAN"
                : "SCAM PATTERN RECOGNITION"}
            </span>
          </div>
          <h2 tabIndex={-1} className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#064B50] mb-4">
            {lang === "ID"
              ? "Tidak semua tawaran kerja seperti yang terlihat."
              : "Not every job offer is what it seems."}
          </h2>
          <p className="text-base sm:text-lg text-[#202C2B]/80">
            {lang === "ID"
              ? "Pelajari cara mengenali modus penipuan lowongan kerja paling umum dan pahami tanda bahayanya sebelum menjadi korban kerugian finansial."
              : "Learn to recognize common job scams and understand the warning signs before becoming a victim."}
          </p>
        </div>

        {/* ONE Large Interactive Showcase Panel */}
        <div className="bg-white border border-[#064B50]/15 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-lg">
          {/* Five Clickable Rounded Category Tabs at Top */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            {scamCategories.map((cat, idx) => {
              const isSelected = activeCategory === idx
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(idx)}
                  aria-pressed={isSelected}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? "bg-[#064B50] text-[#B8F000] shadow-sm font-black"
                      : "bg-[#F7F7F0] text-[#202C2B]/80 hover:text-[#064B50] hover:bg-[#EBECE1] border border-[#064B50]/12"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSelected ? "bg-[#B8F000]" : "bg-[#064B50]/30"
                    }`}
                  />
                  <span>{cat.title}</span>
                </button>
              )
            })}
          </div>

          {/* Dynamic Interactive Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Visual Scenario Illustration Mockup */}
            <div className="lg:col-span-6 relative flex flex-col items-center justify-center">
              {/* Handwritten Post-it Note */}
              <div className="relative mb-3 max-w-xs rounded-xl border border-[#064B50]/20 bg-[#B8F000] px-3 py-1 font-handwriting text-base font-bold text-[#064B50] shadow-sm sm:text-lg">
                {cur.handwrittenNote}
                <div className="absolute -bottom-1.5 left-4 w-3 h-3 bg-[#B8F000] transform rotate-45 border-r border-b border-[#064B50]/20" />
              </div>

              {/* Custom Detailed Illustration Box depending on Category */}
              <div className="w-full max-w-md bg-[#F7F7F0] border border-[#064B50]/15 rounded-3xl p-5 shadow-2xs relative overflow-hidden transition-all duration-300">
                {/* Header Badge */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#064B50]/10 pb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-red-700 bg-red-100 border border-red-200 px-2.5 py-1 rounded-lg">
                    {cur.badge}
                  </span>
                  <span className="text-xs text-[#202C2B]/75">
                    {lang === "ID" ? "Contoh fiktif" : "Fictional example"}
                  </span>
                </div>

                {/* Illustration 1: Fake Recruitment Fees */}
                {cur.type === "fee" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-white border border-[#064B50]/12 rounded-2xl p-4 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-100 border border-red-300 flex items-center justify-center text-red-700 mx-auto mb-2 text-xl">
                        💸
                      </div>
                      <p className="text-xs text-[#202C2B]/70">
                        {lang === "ID"
                          ? "Total Tagihan Administrasi Seragam:"
                          : "Total Uniform Administration Invoice:"}
                      </p>
                      <p className="text-2xl font-black text-red-700 font-mono my-1">
                        {lang === "ID" ? "Rp350.000" : "$350"}
                      </p>
                      <p className="text-[11px] text-[#202C2B]/60 font-mono">
                        {lang === "ID"
                          ? "BCA: 8820-9123-4512 a.n. RAHMAT (Pribadi)"
                          : "Wire: 8820-9123-4512 c/o RAHMAT (Personal)"}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {lang === "ID" ? (
                        <>
                          🚨 <strong>Jebakan:</strong> Menyebut uang seragam{" "}
                          &quot;pasti direfund hari pertama&quot;. Begitu transfer,
                          kontak langsung diblokir.
                        </>
                      ) : (
                        <>
                          🚨 <strong>Trap:</strong> Promises uniform fee{" "}
                          &quot;guaranteed refund on day one&quot;. Once transferred,
                          you are immediately blocked.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Illustration 2: Unrealistic Salary */}
                {cur.type === "salary" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-white border border-amber-200 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-amber-800">
                          {lang === "ID" ? "Loker Paruh Waktu Viral" : "Viral Part-Time Vacancy"}
                        </span>
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold border border-amber-200">
                          {lang === "ID" ? "Tanpa Syarat" : "No Requirements"}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-[#202C2B]">
                        {lang === "ID" ? "Misi Like & Subscribe Video" : "Like & Subscribe Video Task"}
                      </h4>
                      <p className="text-xl font-black text-[#087F7A] font-mono mt-1">
                        {lang === "ID" ? "Rp500.000 - Rp1.200.000 / Hari" : "$50 - $120 / Day"}
                      </p>
                      <p className="text-[11px] text-[#202C2B]/80 mt-2">
                        {lang === "ID"
                          ? '"Tugas pertama gratis cair Rp20.000. Untuk ambil tugas VIP, silakan transfer deposit modal Rp1.500.000."'
                          : '"First task pays $20 instantly. To unlock VIP high-tier tasks, transfer a $150 capital deposit."'}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {lang === "ID" ? (
                        <>
                          🚨 <strong>Jebakan:</strong> Modus penipuan tugas berbayar. Uang
                          deposit besar tidak akan pernah bisa ditarik kembali.
                        </>
                      ) : (
                        <>
                          🚨 <strong>Trap:</strong> Ponzi Task Scam tactic. Large
                          deposit funds can never be withdrawn.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Illustration 3: Company Impersonation */}
                {cur.type === "impersonation" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-white border border-[#064B50]/12 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-[10px] text-[#202C2B]/60 font-mono ml-2">
                          {lang === "ID"
                            ? "https://rekrutmen-pertamina.site/tes"
                            : "https://recruitment-globalcorp.site/test"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#202C2B] mb-1">
                        {lang === "ID"
                          ? "Pengirim: Panitia Seleksi BUMN"
                          : "Sender: Enterprise Selection Committee"}
                      </p>
                      <p className="text-[11px] text-red-700 font-mono bg-red-50 p-2 rounded-lg border border-red-200">
                        {lang === "ID"
                          ? "Email: hrd.pertamina.rekrut@gmail.com ❌"
                          : "Email: hrd.globalcorp.recruit@gmail.com ❌"}
                      </p>
                      <p className="text-[11px] text-[#202C2B]/75 mt-2">
                        {lang === "ID"
                          ? "Lampiran PDF surat panggilan dengan logo BUMN buram beresolusi rendah."
                          : "PDF invitation attachment featuring a blurry, low-resolution enterprise logo."}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {lang === "ID" ? (
                        <>
                          🚨 <strong>Jebakan:</strong> Pencatutan nama korporasi
                          besar untuk menipu lewat tiket travel fiktif.
                        </>
                      ) : (
                        <>
                          🚨 <strong>Trap:</strong> Impersonating reputable corporations
                          to scam candidates through fake travel agency bookings.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Illustration 4: Personal Data Theft */}
                {cur.type === "data" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-white border border-[#064B50]/12 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#202C2B]">
                          {lang === "ID"
                            ? "Formulir Verifikasi Berkas Awal"
                            : "Initial File Verification Form"}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold border border-red-200">
                          {lang === "ID" ? "Wajib Diisi" : "Required"}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs text-[#202C2B] mt-2">
                        <div className="p-2 rounded bg-[#F7F7F0] border border-[#064B50]/10 flex justify-between">
                          <span>{lang === "ID" ? "Upload Foto KTP Asli:" : "Upload Original ID Photo:"}</span>
                          <span className="text-red-600 font-bold">{lang === "ID" ? "*Wajib" : "*Required"}</span>
                        </div>
                        <div className="p-2 rounded bg-[#F7F7F0] border border-[#064B50]/10 flex justify-between">
                          <span>{lang === "ID" ? "Foto Selfie Pegang KTP:" : "Selfie Holding ID:"}</span>
                          <span className="text-red-600 font-bold">{lang === "ID" ? "*Wajib" : "*Required"}</span>
                        </div>
                        <div className="p-2 rounded bg-[#F7F7F0] border border-[#064B50]/10 flex justify-between">
                          <span>{lang === "ID" ? "Ibu Kandung & Rekening:" : "Mother's Name & Bank Account:"}</span>
                          <span className="text-red-600 font-bold">{lang === "ID" ? "*Wajib" : "*Required"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {lang === "ID" ? (
                        <>
                          🚨 <strong>Jebakan:</strong> Data KYC dijual atau
                          digunakan untuk mencairkan pinjaman online ilegal atas
                          nama pelamar.
                        </>
                      ) : (
                        <>
                          🚨 <strong>Trap:</strong> KYC identity data is sold or
                          weaponized to take out illegal online loans under the applicant&apos;s name.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Illustration 5: Urgency & Pressure */}
                {cur.type === "urgency" && (
                  <div className="space-y-3 animate-in fade-in duration-300">
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-700 mb-1">
                        <Clock className="w-5 h-5 animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {lang === "ID" ? "BATAS WAKTU SELEKSI" : "SELECTION DEADLINE"}
                        </span>
                      </div>
                      <p className="text-3xl font-black text-red-700 font-mono my-2 animate-pulse">
                        00:27:14
                      </p>
                      <p className="text-xs text-[#202C2B]/80">
                        {lang === "ID"
                          ? '"Sisa 1 slot lagi! Segera konfirmasi sekarang atau nama Anda dibatalkan permanen."'
                          : '"Only 1 slot left! Confirm now or your placement will be permanently cancelled."'}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                      {lang === "ID" ? (
                        <>
                          🚨 <strong>Jebakan:</strong> Menggunakan teknik rekayasa
                          sosial agar korban panik dan tidak sempat bertanya ke
                          orang lain.
                        </>
                      ) : (
                        <>
                          🚨 <strong>Trap:</strong> Uses psychological urgency
                          so victims panic without consulting others or verifying facts.
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Realistic Scam Quote Box */}
                <div className="mt-4 p-3 bg-white border border-[#064B50]/12 rounded-xl text-xs text-[#202C2B]/80 italic">
                  <span className="not-italic font-bold text-[#064B50] block mb-1">
                    {lang === "ID" ? "Contoh Pesan Penipu:" : "Scammer Message Example:"}
                  </span>
                  {cur.sampleQuote}
                </div>
              </div>
            </div>

            {/* Right Column: Title, Explanations, 3 Warning Signs & Safety Actions */}
            <div className="lg:col-span-6 flex flex-col items-start text-left">
              {/* Scam Title & Tagline */}
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#087F7A] mb-1">
                {lang === "ID" ? "KATEGORI MODUS" : "TACTIC CATEGORY"}
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-[#064B50] tracking-tight mb-2">
                {cur.title}
              </h3>
              <p className="text-sm font-bold text-[#087F7A] mb-4">
                {cur.tagline}
              </p>
              <p className="text-sm text-[#202C2B]/80 leading-relaxed mb-6">
                {cur.explanation}
              </p>

              {/* Three Suspicious Warning Signs */}
              <div className="w-full mb-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-red-700 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span>{lang === "ID" ? "Tanda bahaya" : "Warning signs"}</span>
                </h4>
                <div className="space-y-2">
                  {cur.warningSigns.map((sign, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-red-50/70 border border-red-200 text-xs text-[#202C2B]"
                    >
                      <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 font-extrabold flex items-center justify-center shrink-0 text-[11px]">
                        {i + 1}
                      </span>
                      <span>{sign}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Safety Actions */}
              <div className="w-full mb-6">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#087F7A] mb-3 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#087F7A]" />
                  <span>{lang === "ID" ? "Langkah Aman yang Harus Dilakukan:" : "Safety Steps to Take:"}</span>
                </h4>
                <div className="space-y-2">
                  {cur.safetyActions.map((action, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-[#202C2B]"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Call to Action */}
              <div className="pt-2 w-full">
                <button
                  onClick={onCheckJobOffer}
                  className="bg-[#064B50] hover:bg-[#087F7A] text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-xs transition-all hover:scale-102"
                >
                  <Search className="w-4 h-4 text-[#B8F000]" />
                  <span>{lang === "ID" ? "Punya Tawaran Serupa? Cek di Sini" : "Have a Similar Offer? Check It Here"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default KnowTheScamsSection
