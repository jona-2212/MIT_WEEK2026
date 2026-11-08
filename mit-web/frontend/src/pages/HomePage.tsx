import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Eye,
  ShieldAlert,
} from 'lucide-react'
import Button from '../components/Button'
import Card from '../components/Card'
import Navbar from '../components/Navbar'

type Scenario = {
  title: string
  recruiter: string
  avatar: string
  message: string
  highlightPhrase: string
  riskScore: number
  riskLabel: string
  redFlag: string
  salary: string
  companyTag: string
}

const scenarios: Scenario[] = [
  {
    title: 'Biaya Seragam',
    recruiter: 'Ibu Rina • HR PT Surya Indo Sejahtera',
    avatar: '👩‍💼',
    message:
      'Selamat Kak! Lolos tahap berkas Admin WFH. Untuk konfirmasi jadwal interview, silakan transfer Rp350.000 (biaya jaminan seragam & formulir ID card). Akan direfund.',
    highlightPhrase: 'transfer Rp350.000 (biaya jaminan seragam)',
    riskScore: 96,
    riskLabel: 'HIGH RISK SCAM',
    redFlag: 'Perusahaan resmi TIDAK PERNAH memungut biaya seragam atau deposit formulir!',
    salary: 'Rp14.500.000 / bln',
    companyTag: 'PT Palsu / Domain Gratisan',
  },
  {
    title: 'Like & Subscribe',
    recruiter: 'Admin Task • Global Media Promotor',
    avatar: '🤖',
    message:
      'Pekerjaan Freelance Paruh Waktu: Cukup Like 3 video YouTube & follow IG, komisi langsung cair Rp150.000/hari. Deposit awal Rp200.000 untuk buka level VIP!',
    highlightPhrase: 'Deposit awal Rp200.000 untuk buka level VIP',
    riskScore: 98,
    riskLabel: 'PONZI TASK SCAM',
    redFlag: 'Modus tugas berbayar. Uang deposit awal biasanya akan dibawa kabur!',
    salary: 'Komisi Harian Rp800.000',
    companyTag: 'Grup Telegram Liar',
  },
  {
    title: 'BUMN Travel Fee',
    recruiter: 'Panitia Seleksi Rekrutmen BUMN Pertamina',
    avatar: '🏢',
    message:
      'Panggilan Tes Tahap Akhir di Balikpapan. Tiket pesawat & hotel WAJIB dipesan melalui agen travel rekanan resmi PT Buana Wisata Tour. Biaya diganti 100% saat registrasi.',
    highlightPhrase: 'WAJIB dipesan melalui agen travel rekanan resmi',
    riskScore: 99,
    riskLabel: 'BUMN IMPERSONATION',
    redFlag: 'Pencatutan nama BUMN! Jangan transfer ke agen atau rekening pribadi.',
    salary: 'Management Trainee BUMN',
    companyTag: 'Email rekrutmen palsu',
  },
]

function HighlightedMessage({ scenario }: { scenario: Scenario }) {
  const [before, after] = scenario.message.split(scenario.highlightPhrase)

  return (
    <div className="min-w-0 break-words rounded-xl border border-slate-800 bg-slate-900/80 p-3 text-xs leading-relaxed text-slate-200">
      {before}
      <mark className="rounded border-b-2 border-red-500 bg-red-500/30 px-1 font-bold text-red-200">
        🚨 {scenario.highlightPhrase}
      </mark>
      {after}
    </div>
  )
}

function HomePage() {
  const [message, setMessage] = useState('AI siap melindungi langkah kariermu.')
  const [activeScenario, setActiveScenario] = useState(0)
  const [inspecting, setInspecting] = useState(false)
  const currentScenario = scenarios[activeScenario]

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

    fetch(`${apiUrl}/api/data`)
      .then((response) => {
        if (!response.ok) throw new Error('Backend tidak tersedia')
        return response.json() as Promise<{ message: string }>
      })
      .then((data) => setMessage(data.message))
      .catch(() => undefined)
  }, [])

  const handleCheckOffer = () => {
    document.querySelector('#simulator')?.scrollIntoView({ behavior: 'smooth' })
    setInspecting(true)
  }

  return (
    <main className="min-h-screen w-full overflow-x-hidden bg-[#070d1e] bg-[linear-gradient(rgba(59,130,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.08)_1px,transparent_1px)] bg-[size:45px_45px]">
      <Navbar />

      <section className="relative mx-auto grid min-h-[calc(100vh-104px)] w-full min-w-0 grid-cols-1 items-center gap-10 overflow-hidden px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-24 xl:gap-16 xl:px-12" id="beranda">
        <div className="pointer-events-none absolute left-1/2 top-1/4 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-blue-700/20 blur-[100px]" />
        <div className="relative z-10 flex min-w-0 max-w-full flex-col items-start lg:col-span-7">
          <div className="mb-6 flex max-w-full flex-wrap items-center gap-2 rounded-full border border-slate-700/80 bg-slate-900/90 px-3.5 py-1.5 shadow-md">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#ccff00]" />
            <span className="text-xs font-bold uppercase tracking-wide text-slate-300">AI Detektor Penipuan Loker #1 Indonesia</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs font-extrabold text-[#ccff00]">Think Before You Apply.</span>
          </div>

          <h1 className="mb-7 max-w-full break-words text-[clamp(2.5rem,7vw,5.75rem)] font-extrabold leading-[1.05] tracking-tight text-white">
            Not every opportunity
            <br className="hidden sm:inline" />
            {' '}is an <span className="rounded-lg bg-[#ccff00] px-3 py-0.5 text-slate-950 shadow-lg shadow-[#ccff00]/25">opportunity.</span>
          </h1>
          <div className="mb-9 max-w-2xl">
            <p className="mb-3 text-xl font-bold text-blue-300 sm:text-2xl">Pikirkan Sebelum Kamu Mengirim Lamaran.</p>
            <p className="text-lg leading-relaxed text-slate-300 sm:text-xl">
              Cek tawaran kerja mencurigakan, verifikasi identitas perekrut resmi,
              dan lindungi langkah kariermu dari modus biaya admin, penipuan tugas,
              hingga pencurian data pribadi.
            </p>
          </div>
          <div className="mb-12 flex flex-col gap-4 sm:flex-row">
            <Button onClick={handleCheckOffer}>
              <ShieldAlert className="h-5 w-5 text-[#ccff00]" />
              Cek Tawaran Kerja
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary" onClick={() => document.querySelector('#cara-kerja')?.scrollIntoView({ behavior: 'smooth' })}>
              Pelajari Cara Kerjanya
              <ArrowDown className="h-4 w-4 text-slate-400" />
            </Button>
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm text-slate-500"><span className="h-2 w-2 rounded-full bg-[#ccff00]" />{message}</p>
        </div>

        <div className="relative z-10 flex min-w-0 w-full max-w-full flex-col items-center lg:col-span-5" id="simulator">
          <div className="mb-4 flex w-full max-w-md min-w-0 flex-wrap items-center justify-center gap-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-1 shadow-xl backdrop-blur-md sm:justify-between">
            <span className="px-2 text-[11px] font-bold text-slate-400">Uji Modus:</span>
            <div className="flex min-w-0 flex-1 flex-wrap items-center justify-center gap-1">
              {scenarios.map((scenario, index) => (
                <button
                  key={scenario.title}
                  type="button"
                  onClick={() => { setActiveScenario(index); setInspecting(false) }}
                  className={`min-w-0 flex-1 rounded-xl px-2 py-1.5 text-[11px] font-bold transition-all sm:px-3 sm:text-xs ${activeScenario === index ? 'bg-[#ccff00] text-slate-950 shadow-md shadow-[#ccff00]/20' : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'}`}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </div>

          <Card className="w-full max-w-xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 p-5 backdrop-blur-xl sm:p-7 lg:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-lg border border-blue-500/40 bg-blue-600/30"><Eye className="h-4 w-4 text-[#ccff00]" /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold text-white">JobGuard AI Live Monitor <span className="h-2 w-2 animate-ping rounded-full bg-red-500" /></div>
                  <span className="block break-words font-mono text-[10px] text-slate-400">Modus: {currentScenario.companyTag}</span>
                </div>
              </div>
              <div className="ml-auto flex shrink-0 items-center gap-1 rounded-full border border-red-500/30 bg-red-500/20 px-2.5 py-1 text-xs font-black text-red-300"><AlertTriangle className="h-3.5 w-3.5" />{currentScenario.riskScore}% BAHAYA</div>
            </div>

            <button type="button" onClick={() => setInspecting(!inspecting)} className={`relative mx-auto my-2 block h-36 w-36 rounded-full transition-transform ${inspecting ? 'scale-110' : 'hover:scale-105'}`} aria-label="Periksa maskot JobGuard">
              <span className="absolute left-1/2 top-0 h-10 w-1 -translate-x-1/2 bg-blue-400 before:absolute before:-left-1.5 before:-top-2 before:h-4 before:w-4 before:rounded-full before:border-2 before:border-[#ccff00] before:bg-blue-600 before:content-['']" />
              <span className="absolute inset-x-0 top-12 text-center text-3xl text-blue-500">◢ ◣</span>
              <span className="absolute inset-3 top-14 grid h-24 place-items-center rounded-[35px] border-8 border-slate-800 bg-slate-950 text-2xl text-red-500 shadow-[0_0_0_4px_#0f172a]">▲ ▲<small className="absolute bottom-4 text-lg text-[#ccff00]">•</small></span>
              <span className="absolute -bottom-2 -right-2 grid h-14 w-11 place-items-center rounded-xl border-2 border-blue-300 bg-gradient-to-br from-emerald-400 to-blue-400 text-2xl text-[#07101f]">✓</span>
            </button>
            <div className="mb-3 text-center text-[10px] font-bold text-slate-500">{currentScenario.riskLabel} <span className="text-red-500">●</span></div>

            <div className="relative mb-2.5 rounded-2xl border border-slate-800 bg-slate-950/90 p-3.5 shadow-lg">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2"><span className="text-lg">{currentScenario.avatar}</span><div className="min-w-0"><p className="break-words text-xs font-bold leading-tight text-white">{currentScenario.recruiter}</p><p className="text-[10px] text-slate-400">Pesan Masuk WhatsApp / Telegram</p></div></div>
                <span className="rounded border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">Gaji: {currentScenario.salary}</span>
              </div>
              <HighlightedMessage scenario={currentScenario} />
              <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-red-800/60 bg-red-950/40 p-2.5 text-[11px] text-red-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div><span className="mr-1 font-extrabold uppercase tracking-wide text-red-400">Deteksi AI:</span>{currentScenario.redFlag}</div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-[11px] text-slate-400">
              <span>Punya tawaran serupa? <strong className="text-white">Cek gratis dalam 15 detik</strong></span>
              <button type="button" onClick={handleCheckOffer} className="flex items-center gap-1 font-bold text-[#ccff00] hover:underline">Cek Sekarang <ArrowRight className="h-3 w-3" /></button>
            </div>
          </Card>
          {inspecting && <p className="mt-3 text-center text-xs text-[#ccff00]">Wira sedang memeriksa red flag pada skenario ini.</p>}
        </div>
      </section>

      <section className="bg-[#0a1128] px-5 py-24 sm:px-8 lg:px-12 xl:px-16" id="cara-kerja">
        <span className="text-xs font-extrabold tracking-[2px] text-[#ccff00]">KENAPA JOBGUARD?</span>
        <h2 className="my-4 text-4xl font-extrabold leading-tight text-white">Berani melamar.<br /><span className="text-blue-300">Tenang menjalani.</span></h2>
      </section>
    </main>
  )
}

export default HomePage
