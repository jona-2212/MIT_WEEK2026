import asyncio
import json
import logging
import re
import time
import uuid
from typing import Any

import httpx

from app.core.config import Settings
from app.schemas.roleplay import (
    ChatMessageHistory,
    MessageItem,
    Moment,
    Outcome,
    QuestionOption,
    Report,
    RoleplayChatRequest,
    RoleplayChatResponse,
    RoleplaySession,
    Scenario,
    SimulatorQuestion,
    SkillEvaluation,
    SkillStatus,
)
from app.services.scenarios_en import SCENARIOS_DATA_EN

logger = logging.getLogger("job_scam_guardian.roleplay")

# 5 Preset Scenarios with 5 Progressive Questions Each
SCENARIOS_DATA: list[dict[str, Any]] = [
    {
        "id": "wfh-deposit",
        "title": "Biaya Deposit Seragam WFH",
        "description": "Perekrut mendesak transfer uang jaminan seragam kerja Rp350.000 agar jadwal interview WFH tidak hangus.",
        "objective": "Tolak transfer uang ke rekening pribadi, kenali tekanan waktu, dan minta verifikasi via email korporat resmi.",
        "total_questions": 5,
        "questions": [
            {
                "question_number": 1,
                "title": "Tahap 1: Pancingan Gaji & Tawaran Fantastis",
                "recruiter_message": "Halo Kak! Selamat, berkas lamaran posisi Admin Data WFH kamu lolos seleksi utama kami. Gaji Rp14.500.000/bulan tanpa potongan, jam kerja santai 4 jam/hari dari rumah. Apakah kakak bersedia hadir interview online besok pagi?",
                "challenge_text": "Perekrut menawarkan gaji Rp14,5 juta untuk pekerjaan 4 jam tanpa pengalaman. Bagaimana respons awalmu?",
                "good_answer_summary": "Jangan langsung terlena oleh angka gaji fantastis yang tidak masuk akal dengan beban kerja. Jawaban yang baik memverifikasi legalitas perusahaan dan menanyakan rincian kontrak resmi sebelum menyatakan komitmen.",
                "educational_takeaway": "Gaji yang jauh di atas standar pasar untuk kualifikasi minim adalah umpan utama (baiting) untuk melumpuhkan nalar kritis pelamar.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Siap Bu! Saya tertarik sekali dan bersedia interview besok jam berapa pun.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat (Euforia Berisiko)",
                        "explanation": "Menunjukkan antusiasme buta tanpa memverifikasi perusahaan membuat penipu tahu bahwa Anda mudah diarahkan ke jebakan berikutnya.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Terima kasih atas tawarannya. Bisakah saya dikirimkan profil resmi PT, alamat kantor operasional, dan rincian jobdesk tertulis?",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Refleks Kritis)",
                        "explanation": "Sangat bijak. Anda menahan euforia dan meminta transparansi identitas korporat terlebih dahulu.",
                    },
                ],
            },
            {
                "question_number": 2,
                "title": "Tahap 2: Permintaan Biaya Seragam di Muka",
                "recruiter_message": "Tentu kak, profil PT akan dikirim saat onboarding. Namun untuk konfirmasi jadwal wawancara besok dan pemesanan ID Card seragam kerja, kakak diwajibkan transfer uang deposit Rp350.000 ke rekening BCA atas nama Rahmat. Uang 100% direfund di hari pertama kerja.",
                "challenge_text": "Perekrut meminta transfer biaya seragam ke rekening pribadi perorangan. Apa tindakan tegasmu?",
                "good_answer_summary": "Sesuai Pasal 11 Permenaker No. 18 Tahun 2024, perusahaan dilarang memungut biaya penempatan dari pencari kerja. Tolak segala transfer dana ke rekening perseorangan.",
                "educational_takeaway": "Perusahaan legal menanggung biaya seragam dan ID Card karyawan. Rekening atas nama pribadi adalah tanda mutlak penipuan.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Baik Bu, saya transfer Rp350.000 sekarang ke rekening Pak Rahmat agar jadwal interview saya aman.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Terjebak Penipuan Biaya)",
                        "explanation": "Uang Anda akan lenyap seketika dan kontak WhatsApp akan langsung diblokir begitu bukti transfer dikirim.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Sesuai aturan ketenagakerjaan, seleksi kerja resmi bebas biaya. Saya tidak bersedia mentransfer dana ke rekening pribadi sebelum ada kontrak resmi.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Tolak Pungutan)",
                        "explanation": "Refleks luar biasa. Menolak biaya di awal mematahkan 99% modus penipuan lowongan kerja.",
                    },
                ],
            },
            {
                "question_number": 3,
                "title": "Tahap 3: Tekanan Batas Waktu Palsu (FOMO)",
                "recruiter_message": "Slot interview tinggal 15 menit lagi kak! Kalau dalam 15 menit kakak belum kirim bukti transfer, berkas kakak terpaksa kami blacklist dan posisi ini langsung kami alihkan ke kandidat lain!",
                "challenge_text": "Perekrut mengancam blacklist dan membatasi waktu 15 menit agar Anda panik. Bagaimana sikapmu?",
                "good_answer_summary": "Penipu menciptakan rasa panik agar korban tidak sempat berkonsultasi dengan keluarga atau berpikir jernih. Jawaban yang baik tetap tenang dan tidak gentar terhadap gertakan pembatalan.",
                "educational_takeaway": "Perekrut profesional memberikan tenggat waktu yang wajar (minimal 1-3 hari kerja) untuk mengonfirmasi kehadiran.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Tunggu Bu jangan dibatalkan! Saya usahakan pinjam uang teman dulu sekarang demi posisi ini.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Terperangkap Panik)",
                        "explanation": "Anda membiarkan rasa takut kehilangan kesempatan (FOMO) mengalahkan akal sehat, berujung kerugian finansial ganda.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Silakan dialihkan jika memang ketentuannya mewajibkan biaya di muka. Saya memilih tidak melanjutkan proses yang tidak transparan.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Kepala Dingin)",
                        "explanation": "Pilihan juara. Mengikhlaskan tawaran palsu jauh lebih berharga daripada kehilangan uang tabungan.",
                    },
                ],
            },
            {
                "question_number": 4,
                "title": "Tahap 4: Menghadapi Dalih Pemotongan Gaji",
                "recruiter_message": "Kalau kakak keberatan, apakah kakak mau potong gaji pertama saja Rp500.000? Tapi untuk biaya materai dan aktivasi sistem pendaftaran sekarang cukup transfer Rp100.000 saja, bisa?",
                "challenge_text": "Perekrut menurunkan nominal transfer menjadi Rp100.000 dengan dalih materai. Apa keputusanmu?",
                "good_answer_summary": "Taktik tawar-menawar nominal kecil adalah cara penipu mendapatkan uang berapa pun yang ada di rekening korban. Jangan pernah mentransfer sepeser pun.",
                "educational_takeaway": "Penipu sering melakukan 'foot-in-the-door technique'—meminta nominal kecil terlebih dahulu sebelum meminta nominal lebih besar.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Kalau cuma Rp100.000 untuk materai tidak apa-apa deh Bu, saya transfer sekarang.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Kompromi Berisiko)",
                        "explanation": "Meskipun nominalnya lebih kecil, transfer ini tetap penipuan dan Anda telah memberikan akses keuangan Anda kepada pelaku.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Tetap tidak bersedia. Biaya materai atau administrasi apapun adalah kewajiban operasional perusahaan, bukan beban pencari kerja.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Konsisten)",
                        "explanation": "Ketegasan Anda konsisten. Penipu tidak bisa menembus batasan keamanan finansial yang Anda tetapkan.",
                    },
                ],
            },
            {
                "question_number": 5,
                "title": "Tahap 5: Tindakan Penutup & Proteksi Diri",
                "recruiter_message": "Baik, Anda sudah kami catat menolak SOP rekrutmen kami.",
                "challenge_text": "Setelah proses percakapan mencurigakan ini berakhir, apa langkah perlindungan terbaik yang harus kamu ambil?",
                "good_answer_summary": "Langkah mitigasi yang benar adalah mendokumentasikan tangkapan layar, memblokir nomor penipu, dan melaporkan nomor rekening pelaku ke kanal resmi seperti CekRekening.id atau Patroli Siber.",
                "educational_takeaway": "Melaporkan kontak penipu membantu mencegah korban lain yang mungkin kurang waspada terjerat modus serupa.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Membiarkan saja nomor tersebut dan berharap mereka tidak menghubungi saya lagi.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat (Pasif)",
                        "explanation": "Nomor Anda bisa dimasukkan ke dalam daftar nomor aktif untuk ditarget kembali oleh sindikat penipuan lain.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Ambil screenshot percakapan sebagai bukti, blokir nomor kontak, dan laporkan rekening tersebut ke kanal aduan resmi.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Protektif Total)",
                        "explanation": "Langkah pamungkas yang sempurna! Anda melindungi diri dan berkontribusi memutus rantai kejahatan siber.",
                    },
                ],
            },
        ],
    },
    {
        "id": "telegram-task",
        "title": "Misi Tugas Berbayar Telegram",
        "description": "Admin paruh waktu menawarkan komisi harian besar hanya dengan like video, tetapi mewajibkan deposit awal.",
        "objective": "Kenali skema Ponzi tugas berantai (task scam) dan tolak menyetor modal deposit apapun untuk bekerja.",
        "total_questions": 5,
        "questions": [
            {
                "question_number": 1,
                "title": "Tahap 1: Pancingan Misi Sederhana Uang Receh",
                "recruiter_message": "Halo Kak! Mau komisi sampingan Rp150.000/hari cukup dari rumah? Tugasnya gampang banget cuma like 3 video YouTube dan follow toko Shopee. Komisi langsung cair ke DANA/Gopay kakak. Mau coba misi gratis pertamanya?",
                "challenge_text": "Admin menawarkan uang mudah untuk tugas yang sangat sepele. Bagaimana responsmu?",
                "good_answer_summary": "Skema Ponzi Task Scam selalu memancing dengan komisi receh di tahap awal untuk membangun rasa percaya semu. Sadari bahwa tidak ada model bisnis riil yang membayar mahal hanya untuk like video.",
                "educational_takeaway": "Tidak ada bisnis yang membayar Rp50.000 per klik tombol like. Komisi receh di awal adalah umpan pancingan.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Wah mau banget kak! Boleh kirimkan link videonya sekarang, saya kerjakan.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat (Terpancing Umpan)",
                        "explanation": "Anda mulai masuk ke dalam corong rekrutmen penipuan tugas berantai (funnel scam).",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Pekerjaan legal tidak memberikan uang tanpa kontrak dan tugas nyata. Saya minta penjelasan resmi tentang perusahaan Anda.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Waspada Sejak Awal)",
                        "explanation": "Sikap kritis sejak kontak pertama memotong siklus manipulasi sebelum Anda terpikat imbalan semu.",
                    },
                ],
            },
            {
                "question_number": 2,
                "title": "Tahap 2: Jebakan Deposit Modal Level VIP",
                "recruiter_message": "Hebat kak! Nah untuk membuka paket misi VIP komisi Rp800.000 per hari, kakak harus deposit awal Rp200.000 ke rekening bendahara kami. Nanti cair bersama modal + profit 30% dalam 10 menit!",
                "challenge_text": "Admin meminta deposit Rp200.000 untuk mencairkan komisi besar. Apa keputusanmu?",
                "good_answer_summary": "Pekerjaan nyata membayar tenaga dan keahlian Anda, bukan mewajibkan Anda membayar uang modal. Sekali menyetor deposit, dana Anda akan dikunci.",
                "educational_takeaway": "Prinsip dasar ketenagakerjaan: Anda bekerja untuk menerima upah, bukan membayar upah kepada pemberi kerja.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Oke saya transfer Rp200.000 ke rekening bendahara biar dapat komisi harian Rp800.000.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Terperangkap Deposit)",
                        "explanation": "Uang deposit Rp200.000 Anda telah masuk ke kantong penipu dan saldo di aplikasi hanyalah angka fiktif.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Saya tidak akan pernah menyetor deposit uang untuk bekerja. Konsep ini adalah skema Ponzi ilegal.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Paham Skema Ponzi)",
                        "explanation": "Refleks hebat! Anda mengidentifikasi pola penipuan tugas berbayar yang paling marak saat ini.",
                    },
                ],
            },
            {
                "question_number": 3,
                "title": "Tahap 3: Dalih Saldo Tertahan & Permintaan Top-Up Jutaan",
                "recruiter_message": "Mohon maaf kak, sistem mendeteksi kode transaksi kakak keliru. Saldo komisi Rp2.500.000 tertahan di website. Untuk mencairkannya, kakak wajib top-up penalti Rp1.500.000 sekarang atau seluruh uang hangus!",
                "challenge_text": "Admin berdalih uang tersangkut dan memaksa transfer jutaan rupiah lagi. Apa tindakanmu?",
                "good_answer_summary": "Ini adalah manipulasi psikologis 'Sunk Cost Fallacy'. Pelaku menakut-nakuti bahwa uang sebelumnya akan hilang jika tidak mentransfer lagi. Potong kerugian (stop-loss) seketika.",
                "educational_takeaway": "Jangan pernah menuruti permintaan top-up untuk membuka saldo yang terkunci. Uang tersebut tidak akan pernah bisa ditarik.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Saya transfer Rp1.500.000 sekarang supaya uang saya yang Rp2,5 juta bisa kembali.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Terjerat Sunk Cost)",
                        "explanation": "Kerugian Anda justru bertambah besar. Pelaku akan terus membuat alasan kesalahan sistem baru.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Hentikan pemerasan ini. Saya tidak akan mentransfer sepeser pun dan akan melaporkan grup Telegram ini ke kepolisian.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Stop Loss)",
                        "explanation": "Keputusan tegas menghentikan kerugian lebih besar dan menutup ruang negosiasi bagi pelaku.",
                    },
                ],
            },
            {
                "question_number": 4,
                "title": "Tahap 4: Rayuan Anggota Grup Fiktif (Social Proof Palsu)",
                "recruiter_message": "Lihat di grup Telegram kami kak, member Budi dan Siti barusan cair Rp10.000.000 setelah top up. Semua bukti transfer asli bank ada di sini kak. Tinggal selangkah lagi uang kakak cair!",
                "challenge_text": "Admin menunjukkan testimoni puluhan member grup yang mengaku berhasil cair. Bagaimana pandanganmu?",
                "good_answer_summary": "Anggota lain di grup Telegram penipuan adalah akun kloningan / bot komplotan penipu yang bertugas menciptakan bukti sosial palsu (fake social proof).",
                "educational_takeaway": "Testimoni tangkapan layar m-banking di grup publik sangat mudah dipalsukan dengan generator struk palsu.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Ternyata banyak yang berhasil ya, saya percaya deh kalau begitu.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Tertipu Bukti Palsu)",
                        "explanation": "Grup tersebut disetting untuk menjebak korban baru dengan testimoni rekayasa.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Testimoni dan tangkapan layar di grup mudah direkayasa. Bukti tersebut tidak membuktikan legalitas usaha Anda.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Kritis Terhadap Testimoni)",
                        "explanation": "Pemikiran kritis yang tajam! Anda tidak mudah terpengaruh oleh kerumunan fiktif.",
                    },
                ],
            },
            {
                "question_number": 5,
                "title": "Tahap 5: Tindakan Pencegahan & Edukasi Rekan",
                "recruiter_message": "Kakak akan kami kick dari grup dan akun dibekukan.",
                "challenge_text": "Setelah keluar dari skema penipuan ini, apa langkah paling konstruktif yang kamu lakukan?",
                "good_answer_summary": "Tinggalkan dan laporkan grup ke Telegram (Report Spam/Scam), peringatkan teman/keluarga agar tidak tergiur tawaran like video berbayar.",
                "educational_takeaway": "Literasi digital kolektif adalah benteng terkuat melawan epidemi penipuan tugas berbayar.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Hapus chat tanpa melaporkan akun penipu.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat (Kurang Pencegahan)",
                        "explanation": "Akun penipu akan terus leluasa memangsa pencari kerja lain jika tidak dilaporkan.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Laporkan channel Telegram sebagai Scam, simpan nomor rekening pelaku untuk dilaporkan ke CekRekening.id.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Aksi Nyata)",
                        "explanation": "Sempurna. Anda menjadi benteng pertahanan digital bagi ekosistem pencari kerja Indonesia.",
                    },
                ],
            },
        ],
    },
    {
        "id": "soe-travel",
        "title": "Undangan Seleksi BUMN & Travel Rekanan",
        "description": "Surat panggilan tes mencatut BUMN dan mewajibkan pemesanan tiket penerbangan via agen travel tertentu.",
        "objective": "Verifikasi pengumuman melalui portal resmi FHCI BUMN dan tolak pemesanan tiket lewat pihak ketiga.",
        "total_questions": 5,
        "questions": [
            {
                "question_number": 1,
                "title": "Tahap 1: Panggilan Tes di Luar Kota",
                "recruiter_message": "Selamat! Anda dinyatakan lolos berkas BUMN Pertamina dan diundang Tes Wawancara Direksi di Balikpapan hari Kamis. Surat panggilan resmi berkop BUMN telah kami kirimkan. Bersediakah hadir?",
                "challenge_text": "Anda menerima panggilan tes BUMN di luar kota melalui WhatsApp/email pribadi. Apa langkah awalmu?",
                "good_answer_summary": "BUMN resmi mengumumkan seluruh tahapan seleksi secara terpusat melalui dashboard resmi (seperti fhcibumn.id), bukan via pesan berantai atau email domain gratisan.",
                "educational_takeaway": "Rekrutmen Bersama BUMN selalu terpusat di portal resmi FHCI. Tidak ada komunikasi panggilan seleksi di luar portal resmi.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Siap hadir Pak! Saya akan langsung persiapkan diri berangkat ke Balikpapan.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat (Terburu-buru)",
                        "explanation": "Anda melangkah tanpa memverifikasi keabsahan surat di portal resmi BUMN.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Saya akan mengecek terlebih dahulu pengumuman resmi di portal fhcibumn.id dan akun pendaftaran saya.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Cek Sumber Primer)",
                        "explanation": "Langkah fundamental. Memeriksa portal utama mencegah Anda tertipu kop surat dan cap stempel palsu.",
                    },
                ],
            },
            {
                "question_number": 2,
                "title": "Tahap 2: Pemaksaan Beli Tiket via Travel Tertentu",
                "recruiter_message": "Seluruh tiket penerbangan dan reservasi hotel WAJIB dipesan melalui agen travel rekanan resmi 'PT Buana Tour'. Pembelian mandiri ditolak demi standarisasi logistik. Biaya diganti 100% tunai di lokasi.",
                "challenge_text": "Panitia mewajibkan transfer tiket ke biro travel tertentu dengan janji ganti tunai. Apa keputusanmu?",
                "good_answer_summary": "Kementerian BUMN secara tegas melarang pungutan tiket atau penunjukan biro perjalanan rekanan. Janji reimbursement tunai adalah umpan palsu.",
                "educational_takeaway": "Panitia BUMN tidak pernah bekerja sama dengan agen travel mana pun untuk memungut pembayaran tiket dari kandidat.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Baik, saya hubungi travel rekanan tersebut dan transfer tiketnya karena yakin akan diganti penuh.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Terperangkap Modus Tiket)",
                        "explanation": "Uang jutaan rupiah untuk tiket pesawat palsu akan hilang dan tidak ada tes nyata di lokasi.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "FHCI BUMN menegaskan tidak ada pungutan tiket melalui biro travel rekanan. Saya tolak membeli tiket via agen tersebut.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Tolak Agen Palsu)",
                        "explanation": "Tepat sekali. Anda mengenali modus tertua dan paling sering memakan korban dalam rekrutmen BUMN.",
                    },
                ],
            },
            {
                "question_number": 3,
                "title": "Tahap 3: Intimidasi Diskualifikasi & Kop Dinas Palsu",
                "recruiter_message": "Surat ini resmi ditandatangani panitia berstempel basah. Jika Anda tidak mengirimkan kode booking tiket dari agen rekanan sampai jam 17.00 WIB, nomor registrasi Anda diblacklist permanen!",
                "challenge_text": "Perekrut mengancam blacklist dengan memamerkan kop surat dinas dan tanda tangan palsu. Bagaimana sikapmu?",
                "good_answer_summary": "Penipu kerap mencatut logo BUMN, barcode palsu, dan nama pejabat publik untuk mengintimidasi. Jawaban yang baik tidak gentar pada gertakan blacklist.",
                "educational_takeaway": "Ancaman diskualifikasi dan blacklist adalah taktik intimidasi klasik untuk mendesak pelamar yang mulai ragu.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Aduh jangan diblacklist Pak! Saya kirim uang tiketnya sekarang demi masa depan saya di BUMN.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Tergertak Ancaman)",
                        "explanation": "Anda panik terhadap gertakan palsu dari oknum yang bahkan bukan karyawan BUMN.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Ancaman blacklist tidak berdasar. Pemalsuan kop surat dan nama pejabat BUMN adalah tindak pidana. Saya akan laporkan surat ini.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Paham Regulasi)",
                        "explanation": "Sikap pemberani dan cerdas! Penipu langsung kehilangan kendali saat berhadapan dengan fakta hukum.",
                    },
                ],
            },
            {
                "question_number": 4,
                "title": "Tahap 4: Identifikasi Domain Email Pengirim",
                "recruiter_message": "Undangan resmi kami kirim dari rekrutmen.bumn.pertamina@gmail.com. Mohon diperiksa foldernya sekarang.",
                "challenge_text": "Email pengirim menggunakan domain publik gratisan (@gmail.com). Bagaimana analisismu?",
                "good_answer_summary": "Badan Usaha Milik Negara dan institusi korporat bonafide SELALU menggunakan domain email korporat resmi (seperti @pertamina.com atau @fhcibumn.id), bukan domain gratisan.",
                "educational_takeaway": "Domain email adalah identitas digital resmi. Domain gratisan adalah bukti langsung bahwa pengirim bukan institusi yang sah.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Emailnya valid karena ada kata 'bumn.pertamina' di dalam alamat emailnya.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Tertipu Nama Email)",
                        "explanation": "Siapa pun di internet bisa membuat alamat email gratisan dengan mencantumkan nama perusahaan terkenal.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Email berdomain @gmail.com membuktikan ini palsu. Institusi BUMN resmi selalu menggunakan domain korporat terdaftar.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Verifikasi Domain)",
                        "explanation": "Kemampuan verifikasi teknis yang sangat baik. Anda mengenali red flag domain email secara akurat.",
                    },
                ],
            },
            {
                "question_number": 5,
                "title": "Tahap 5: Laporan ke Saluran Resmi BUMN",
                "recruiter_message": "Panggilan Anda telah kami batalkan.",
                "challenge_text": "Apa tindakan terbaik yang harus kamu lakukan terhadap dokumen surat panggilan palsu tersebut?",
                "good_answer_summary": "Laporkan ke kanal resmi pengaduan rekrutmen FHCI BUMN (helpdesk resmi) atau media sosial terverifikasi (@fhci.bumn) agar dibuatkan klarifikasi publik.",
                "educational_takeaway": "Klarifikasi resmi dari institusi membantu ribuan pelamar lain tidak terjebak surat palsu yang sama.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Menghapus pesan dan tidak menceritakannya ke siapa pun.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat",
                        "explanation": "Informasi penipuan ini berhenti di Anda dan berpotensi memakan korban teman atau keluarga.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Meneruskan dokumen palsu tersebut ke helpdesk resmi FHCI BUMN dan membagikan peringatan di media sosial.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Solidaritas Sosial)",
                        "explanation": "Luar biasa! Anda menjadi pahlawan pelindung ruang digital bagi sesama pencari kerja.",
                    },
                ],
            },
        ],
    },
    {
        "id": "apk-phishing",
        "title": "Undangan Interview via File .APK",
        "description": "Perekrut mengirim file berekstensi .apk di WhatsApp berkedok surat undangan interview resmi.",
        "objective": "Tolak mengunduh atau menginstal file .apk dari nomor tidak dikenal dan minta berkas dalam format dokumen resmi (PDF).",
        "total_questions": 5,
        "questions": [
            {
                "question_number": 1,
                "title": "Tahap 1: Kiriman File .APK Berkedok Surat Undangan",
                "recruiter_message": "Halo Kak! CV Anda sangat memuaskan. Surat panggilan tes ber-barcode resmi sudah saya kirimkan via WhatsApp berupa file: 'Surat_Panggilan_PT_IndoMedia.apk' (12 MB). Tolong segera diunduh dan dipasang di HP Android kakak ya.",
                "challenge_text": "Perekrut mengirim file berekstensi .apk di chat dan menyuruh Anda mengunduhnya. Bagaimana tindakanmu?",
                "good_answer_summary": "Jangan pernah mengunduh atau menginstal file berekstensi .apk dari aplikasi perpesanan. Perusahaan resmi selalu mengirimkan dokumen dalam format PDF atau via email korporat.",
                "educational_takeaway": "File .apk adalah paket aplikasi Android, bukan berkas dokumen bacaan. Menginstalnya dapat menyusupkan malware ke ponsel Anda.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Baik Kak, langsung saya unduh dan install file APK-nya di HP Android saya.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Bahaya Malware Akut)",
                        "explanation": "Ponsel Anda akan disusupi Trojan pencuri SMS yang dapat membobol akun perbankan dan e-wallet dalam sekejap.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Saya tidak mengunduh file .apk dari nomor asing. Mohon kirimkan surat panggilan dalam format PDF resmi.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Benteng Siber Kuat)",
                        "explanation": "Pertahanan digital sempurna. Menolak instalasi file tidak dikenal menyelamatkan ponsel dan rekening Anda.",
                    },
                ],
            },
            {
                "question_number": 2,
                "title": "Tahap 2: Dalih Sistem Barcode Wawancara Khusus",
                "recruiter_message": "File APK ini adalah aplikasi scanner barcode registrasi internal kantor kami kak. Kalau tidak diinstall, barcode tes kakak tidak akan muncul di meja resepsionis besok. Aman kok kak tidak ada virus.",
                "challenge_text": "Perekrut meyakinkan bahwa aplikasi aman dan wajib dipasang untuk barcode tes. Apa responsmu?",
                "good_answer_summary": "Sistem rekrutmen profesional tidak mewajibkan instalasi aplikasi pihak ketiga di luar Play Store. Menolak aktivasi 'Sumber Tak Dikenal' adalah benteng pertahanan terbaik smartphone Anda.",
                "educational_takeaway": "Surat undangan resmi cukup memuat QR code gambar di dalam berkas PDF yang bisa dipindai oleh kamera panitia, tanpa perlu aplikasi khusus.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Oh begitu ya kak, saya klik 'Izinkan Instalasi dari Sumber Tak Dikenal' sekarang.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Membuka Pintu Masuk Peretas)",
                        "explanation": "Anda memberikan izin berbahaya bagi malware untuk membaca seluruh data pribadi dan pesan OTP perbankan.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Sistem rekrutmen profesional tidak mewajibkan instalasi aplikasi khusus di ponsel pelamar. Saya tolak menginstall.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Tolak Izin Ilegal)",
                        "explanation": "Ketegasan tepat! Anda memahami prinsip keamanan perangkat digital.",
                    },
                ],
            },
            {
                "question_number": 3,
                "title": "Tahap 3: Peringatan Sistem Keamanan Ponsel Berbunyi",
                "recruiter_message": "Kalau muncul peringatan merah 'Aplikasi Berbahaya' di HP kakak, diabaikan saja ya kak, itu karena server kantor kami belum terdaftar di Google. Klik 'Tetap Install / Tetap Lanjutkan' ya!",
                "challenge_text": "Perekrut meminta Anda mengabaikan peringatan keamanan ponsel dan tetap memasang malware. Apa tindakanmu?",
                "good_answer_summary": "Jika sistem proteksi perangkat (Google Play Protect / Antivirus) memberi sinyal peringatan, jangan pernah mengabaikannya atas instruksi siapa pun. Hapus file seketika.",
                "educational_takeaway": "Peringatan Google Play Protect aktif mendeteksi tanda tangan malware. Perintah 'abaikan peringatan' adalah ciri khas rekayasa sosial penipu.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Oke kak, peringatan keamanannya saya abaikan dan klik tetap lanjutkan pasang.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Melumpuhkan Proteksi)",
                        "explanation": "Sistem keamanan ponsel Anda sengaja dinonaktifkan secara sadar atas bujukan penjahat siber.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Peringatan Google Play Protect membuktikan file ini berbahaya. Saya hapus berkas ini dan membatalkan keikutsertaan.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Dengarkan Sistem Keamanan)",
                        "explanation": "Pilihan cerdas! Anda memercayai sistem keamanan perangkat daripada bujukan orang asing.",
                    },
                ],
            },
            {
                "question_number": 4,
                "title": "Tahap 4: Permintaan Izin Akses SMS & Notifikasi",
                "recruiter_message": "Untuk pelamar yang sudah install, klik 'Izinkan' saat aplikasi meminta izin baca SMS dan akses notifikasi ya kak.",
                "challenge_text": "Jika suatu aplikasi asing meminta izin akses baca SMS dan notifikasi ponsel, bagaimana analisismu?",
                "good_answer_summary": "Izin akses SMS dan notifikasi adalah kunci yang digunakan sindikat malware untuk membaca kode OTP m-banking yang dikirim bank via SMS tanpa sepengetahuan pemilik ponsel.",
                "educational_takeaway": "Tidak ada aplikasi lowongan kerja yang membutuhkan izin akses SMS pribadi Anda.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Saya berikan izin baca SMS karena mungkin kantor mau kirim jadwal lewat SMS.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Akses OTP Bocor)",
                        "explanation": "Malware otomatis meneruskan seluruh SMS perbankan Anda ke server penipu, rekening Anda dalam bahaya pengurasan saldo.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Izin baca SMS adalah ciri mutlak pencurian OTP. Segera tolak izin dan uninstall aplikasi tersebut.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Paham Anatomi Malware)",
                        "explanation": "Analisis tajam! Anda mengenali modus operandi utama pencurian saldo m-banking via APK phishing.",
                    },
                ],
            },
            {
                "question_number": 5,
                "title": "Tahap 5: Tindakan Darurat Jika Terlanjur Mengunduh",
                "recruiter_message": "Nomor Anda telah kami catat di database.",
                "challenge_text": "Jika Anda atau teman Anda terlanjur mengunduh dan memasang file APK mencurigakan, apa tindakan darurat pertama?",
                "good_answer_summary": "Aktifkan Airplane Mode seketika untuk memutus transmisi data malware, hapus aplikasi via Settings (Safe Mode jika perlu), dan segera hubungi Call Center Bank untuk memblokir sementara rekening m-banking.",
                "educational_takeaway": "Memutus koneksi internet secepat mungkin menghentikan malware mengirimkan SMS OTP Anda ke server penipu.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Mendiamkan ponsel dan menunggu sampai besok pagi.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Fatal)",
                        "explanation": "Dalam hitungan menit saat ponsel terhubung internet, transaksi perbankan ilegal dapat dieksekusi secara otomatis.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Matikan koneksi internet (Airplane Mode), uninstal aplikasi dari Safe Mode, dan segera blokir m-banking via call center bank resmi.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Mitigasi Cepat)",
                        "explanation": "Langkah mitigasi tanggap darurat yang tepat sesuai protokol keamanan siber nasional!",
                    },
                ],
            },
        ],
    },
    {
        "id": "overseas-job",
        "title": "Kerja Luar Negeri Tanpa Visa Resmi",
        "description": "Tawaran posisi Customer Service di Kamboja bergaji $1.500/bulan tanpa visa kerja atau izin resmi Kemnaker.",
        "objective": "Kenali indikasi tindak pidana perdagangan orang (TPPO), tolak berangkat dengan visa turis, dan tuntut jalur resmi P3MI.",
        "total_questions": 5,
        "questions": [
            {
                "question_number": 1,
                "title": "Tahap 1: Tawaran Gaji Dolar Fantastis Tanpa Syarat Ketat",
                "recruiter_message": "Halo! Kami merekrut 5 orang muda untuk posisi Customer Service & Data Operator di kantor cabang Kamboja. Gaji mulai $1.500 USD (Rp24.000.000/bulan), mess mewah, makan 3x ditanggung, dan tiket pesawat PP kami yang bayar. Tidak butuh pengalaman atau paspor ribet. Siap berangkat minggu ini?",
                "challenge_text": "Tawaran kerja bergaji Rp24 juta di luar negeri tanpa mensyaratkan keahlian khusus atau visa kerja. Apa responsmu?",
                "good_answer_summary": "Bekerja ke luar negeri secara prosedural selalu memerlukan proses verifikasi ketat melalui P3MI berizin Kemnaker dan penerbitan Visa Kerja (Work Visa). Waspadai iming-iming gaji dolar instan.",
                "educational_takeaway": "Tawaran kerja luar negeri tanpa kualifikasi spesifik namun bergaji fantastis adalah indikator nomor 1 sindikat penipuan daring lintas negara (scam centers).",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Gaji besar banget! Saya sangat tertarik dan siap berangkat minggu ini.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat (Euforia TPPO)",
                        "explanation": "Anda masuk ke radar perekrutan sindikat perdagangan orang yang mengincar anak muda pencari kerja.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Apakah agen Anda terdaftar resmi sebagai P3MI di Kemnaker dan proses keberangkatan menggunakan Visa Kerja resmi?",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Verifikasi Legalitas Penempatan)",
                        "explanation": "Pertanyaan wajib bagi siapa pun yang hendak bekerja ke luar negeri demi keselamatan jiwa.",
                    },
                ],
            },
            {
                "question_number": 2,
                "title": "Tahap 2: Penyelundupan Menggunakan Visa Turis",
                "recruiter_message": "Tenang kak, berangkatnya pakai visa turis dulu biar cepat, nanti pas tiba di bandara Kamboja visa kerja baru diurus sama kantor. Di bandara ada orang dalam kami jadi dijamin bebas tanya jawab imigrasi.",
                "challenge_text": "Perekrut mengajak berangkat memakai visa turis dengan dalih visa kerja diurus di lokasi. Bagaimana keputusanmu?",
                "good_answer_summary": "Modus Tindak Pidana Perdagangan Orang (TPPO) hampir selalu memberangkatkan korban dengan visa turis. Begitu tiba di negara tujuan, paspor korban disita dan dipaksa bekerja sebagai operator penipuan daring.",
                "educational_takeaway": "Undang-Undang melarang keras WNI bekerja ke luar negeri hanya dengan visa kunjungan atau turis.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Boleh kalau ada orang dalam yang jamin, saya berangkat pakai visa turis saja.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Bahaya Penyekapan)",
                        "explanation": "Di negara tujuan, Anda tidak memiliki perlindungan hukum ketenagakerjaan dan berisiko menjadi korban penyekapan sindikat.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Berangkat kerja dengan visa turis adalah ilegal dan melanggar hukum. Saya tolak tawaran non-prosedural ini.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Tolak Jalur Ilegal)",
                        "explanation": "Refleks hebat yang menyelamatkan masa depan dan keselamatan fisik Anda dari jeratan sindikat luar negeri.",
                    },
                ],
            },
            {
                "question_number": 3,
                "title": "Tahap 3: Permintaan Dokumen Asli & Penahanan Ponsel",
                "recruiter_message": "Untuk pemesanan tiket, mohon kirimkan KTP asli, KK, dan ijazah asli ke alamat kami. Selama masa penempatan 3 bulan pertama, ponsel pribadi disimpan kantor demi kerahasiaan data perusahaan ya.",
                "challenge_text": "Perekrut meminta dokumen fisik asli dan mensyaratkan penyitaan ponsel pribadi. Apa langkahmu?",
                "good_answer_summary": "Tidak ada perusahaan legal yang berhak menahan dokumen identitas asli atau mengisolasi komunikasi pekerja dari keluarga. Ini adalah tanda bahaya penyekapan dan perbudakan modern.",
                "educational_takeaway": "Penyitaan paspor/KTP dan isolasi alat komunikasi adalah tanda utama kerja paksa (forced labor).",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Ijazah asli dan KTP saya kirimkan lewat paket sekarang demi dapat tiketnya.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Kehilangan Identitas Diri)",
                        "explanation": "Dokumen Anda akan disandera dan Anda tidak akan bisa pulang ke tanah air secara mandiri.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Penyitaan dokumen identitas asli dan pembatasan komunikasi adalah ciri nyata eksploitasi dan TPPO. Saya tolak dan laporkan ke BP2MI.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Kenali Indikasi TPPO)",
                        "explanation": "Kecermatan luar biasa! Anda mengenali modus perbudakan modern dan mengambil tindakan tegas.",
                    },
                ],
            },
            {
                "question_number": 4,
                "title": "Tahap 4: Ancaman Denda Ratusan Juta Jika Mundur",
                "recruiter_message": "Kalau kakak membatalkan sekarang, kakak harus bayar ganti rugi tiket dan biaya booking hotel $3.000 USD (Rp48 juta)! Jika tidak, data keluarga kakak akan kami laporkan ke polisi!",
                "challenge_text": "Perekrut memeras dengan ancaman denda puluhan juta dan intimidasi lapor polisi. Bagaimana sikapmu?",
                "good_answer_summary": "Perekrut ilegal tidak memiliki dasar hukum apa pun untuk menuntut ganti rugi. Ancaman lapor polisi hanyalah gertakan kosong karena merekalah pihak yang melakukan tindak pidana kejahatan perdagangan orang.",
                "educational_takeaway": "Pelaku TPPO tidak berani melapor polisi karena aktivitas rekrutmen mereka sendiri melanggar UU Nomor 21 Tahun 2007 tentang TPPO.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Saya takut dilaporkan polisi, saya transfer dendanya saja deh.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Salah (Tergertak Pemerasan)",
                        "explanation": "Anda menyerahkan uang kepada penjahat yang menakut-nakuti Anda dengan hukum palsu.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Ancaman denda tidak sah karena tidak ada kontrak resmi. Aktivitas perekrutan Anda melanggar UU TPPO dan justru saya yang akan melaporkan Anda ke Bareskrim Polri.",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Hukum di Pihak Anda)",
                        "explanation": "Langkah berani berlandaskan hukum! Anda tahu hak Anda dan tidak bisa diperdaya ancaman kosong.",
                    },
                ],
            },
            {
                "question_number": 5,
                "title": "Tahap 5: Pelaporan ke Satgas TPPO & Perlindungan Komunitas",
                "recruiter_message": "Nomor Anda telah kami blokir.",
                "challenge_text": "Setelah berhasil meloloskan diri dari jerat perekrut TPPO ini, apa kanal pelaporan resmi yang tepat di Indonesia?",
                "good_answer_summary": "Lapor ke Satgas TPPO Bareskrim Polri melalui hotline resmi, Kementerian Ketenagakerjaan (Kemnaker), atau BP2MI melalui call center 133 untuk membantu pencegahan keberangkatan korban lain di bandara.",
                "educational_takeaway": "Laporan dini ke BP2MI / Imigrasi bandara dapat menyelamatkan puluhan anak muda yang berpotensi diberangkatkan pada jadwal yang sama.",
                "options": [
                    {
                        "id": "A",
                        "label": "Opsi A",
                        "text": "Mendiamkannya saja karena saya sendiri sudah aman.",
                        "is_correct": False,
                        "feedback_label": "Jawaban Kurang Tepat",
                        "explanation": "Kandidat lain yang minim literasi bisa menjadi korban berikutnya.",
                    },
                    {
                        "id": "B",
                        "label": "Opsi B",
                        "text": "Melaporkan nomor dan tawaran tersebut ke Posko Satgas TPPO Polri dan Hotline BP2MI (133).",
                        "is_correct": True,
                        "feedback_label": "Jawaban Tepat & Aman (Penyelamat Sesama)",
                        "explanation": "Aksi heroik warga digital yang bertanggung jawab. Anda berkontribusi melindungi generasi muda bangsa!",
                    },
                ],
            },
        ],
    },
]

SCENARIOS: dict[str, Scenario] = {}
for s in SCENARIOS_DATA:
    SCENARIOS[s["id"]] = Scenario.model_validate(s)

SCENARIOS_EN: dict[str, Scenario] = {}
for s in SCENARIOS_DATA_EN:
    SCENARIOS_EN[s["id"]] = Scenario.model_validate(s)


class RoleplayService:
    def __init__(self, settings: Settings, client: httpx.AsyncClient | None = None) -> None:
        self.settings = settings
        self.client = client or httpx.AsyncClient(timeout=settings.gemini_timeout_seconds)
        self.sessions: dict[str, RoleplaySession] = {}

    def get_scenarios(self, lang: str = "id") -> list[Scenario]:
        if lang.lower() == "en":
            return list(SCENARIOS_EN.values())
        return list(SCENARIOS.values())

    async def generate_custom_scenario(self, user_prompt: str) -> Scenario:
        custom_id = f"custom-{uuid.uuid4().hex[:8]}"
        title = "Kasus Latihan: " + user_prompt.strip()[:35]
        description = user_prompt.strip()[:140] + ("…" if len(user_prompt) > 140 else "")
        objective = "Identifikasi modus mencurigakan pada kasus ini dan tentukan pilihan terbaik di tiap tahapan."

        questions: list[SimulatorQuestion] = []

        if bool(self.settings.gemini_api_key.get_secret_value()):
            try:
                ai_data = await self._call_gemini_generate_scenario(user_prompt)
                if ai_data and isinstance(ai_data, dict):
                    title = ai_data.get("title", title)
                    description = ai_data.get("description", description)
                    objective = ai_data.get("objective", objective)
                    raw_questions = ai_data.get("questions", [])
                    if isinstance(raw_questions, list) and len(raw_questions) >= 3:
                        for idx, q in enumerate(raw_questions[:7]):
                            raw_opts = q.get("options", [])
                            parsed_opts: list[QuestionOption] = []
                            for o in raw_opts:
                                parsed_opts.append(
                                    QuestionOption(
                                        id=str(o.get("id", "A")),
                                        label=str(o.get("label", "Opsi")),
                                        text=str(o.get("text", "")),
                                        is_correct=bool(o.get("is_correct", False)),
                                        feedback_label=str(o.get("feedback_label", "Evaluasi")),
                                        explanation=str(o.get("explanation", "")),
                                    )
                                )
                            questions.append(
                                SimulatorQuestion(
                                    question_number=idx + 1,
                                    title=q.get("title", f"Tahap {idx + 1}"),
                                    recruiter_message=q.get("recruiter_message", ""),
                                    challenge_text=q.get("challenge_text", "Bagaimana pilihan responsmu?"),
                                    options=parsed_opts,
                                    good_answer_summary=q.get("good_answer_summary", "Pilihlah opsi yang menolak risiko."),
                                    educational_takeaway=q.get("educational_takeaway", "Verifikasi kanal resmi perusahaan."),
                                )
                            )
            except Exception as e:
                logger.warning("gemini_custom_scenario_failed", extra={"error": str(e)})

        # Fallback if AI did not return complete questions
        if not questions:
            questions = self._generate_fallback_questions(user_prompt)

        scenario = Scenario(
            id=custom_id,
            title=title,
            description=description,
            objective=objective,
            language="ID",
            version="roleplay-v1",
            total_questions=len(questions),
            questions=questions,
        )
        SCENARIOS[custom_id] = scenario
        return scenario

    def _generate_fallback_questions(self, user_prompt: str) -> list[SimulatorQuestion]:
        return [
            SimulatorQuestion(
                question_number=1,
                title="Tahap 1: Evaluasi Kontak Awal",
                recruiter_message=f"Halo Kak! Menindaklanjuti kasus Anda: '{user_prompt[:70]}...', kami ingin mengonfirmasi slot seleksi Anda. Mohon konfirmasi kesiapan Anda.",
                challenge_text="Bagaimana sikap awalmu dalam merespons kontak tawaran ini?",
                good_answer_summary="Selalu pastikan keabsahan perusahaan dan mintalah surat panggilan resmi sebelum menindaklanjuti instruksi apa pun.",
                educational_takeaway="Jangan pernah mengambil keputusan dalam kondisi tergesa-gesa tanpa melakukan cross-check.",
                options=[
                    QuestionOption(
                        id="A",
                        label="Opsi A",
                        text="Siap, saya ikuti saja semua arahan yang diminta tanpa banyak tanya.",
                        is_correct=False,
                        feedback_label="Jawaban Kurang Tepat (Pasif)",
                        explanation="Kepatuhan buta adalah celah utama yang dimanfaatkan oleh pelaku penipuan.",
                    ),
                    QuestionOption(
                        id="B",
                        label="Opsi B",
                        text="Saya minta penjelasan resmi profil PT dan surat kontrak kerja resmi tertulis.",
                        is_correct=True,
                        feedback_label="Jawaban Tepat & Aman (Kritis)",
                        explanation="Sangat baik! Meminta dokumen tertulis adalah hak mutlak setiap pencari kerja profesional.",
                    ),
                ],
            ),
            SimulatorQuestion(
                question_number=2,
                title="Tahap 2: Menghadapi Syarat Biaya / Data Sensitif",
                recruiter_message="Untuk proses administrasi, kakak diminta mentransfer sejumlah dana atau mengirimkan foto dokumen pribadi sekarang.",
                challenge_text="Pihak perekrut mulai meminta biaya atau data pribadi berlebih. Apa tindakanmu?",
                good_answer_summary="Tolak segala bentuk pungutan uang di awal seleksi dan jangan berikan foto KTP/KK/OTP kepada pihak yang belum terverifikasi.",
                educational_takeaway="Pasal 11 Permenaker No. 18 Tahun 2024 melarang keras pungutan biaya rekrutmen dari pencari kerja.",
                options=[
                    QuestionOption(
                        id="A",
                        label="Opsi A",
                        text="Saya kirimkan uang / dokumennya agar proses seleksi saya tidak terkendala.",
                        is_correct=False,
                        feedback_label="Jawaban Salah (Terjebak Modus)",
                        explanation="Ini adalah jebakan. Biaya akan hilang atau data Anda akan disalahgunakan untuk pinjaman online ilegal.",
                    ),
                    QuestionOption(
                        id="B",
                        label="Opsi B",
                        text="Saya tolak dengan tegas. Perusahaan resmi dilarang memungut biaya atau meminta data identitas sensitif di awal.",
                        is_correct=True,
                        feedback_label="Jawaban Tepat & Aman (Tegas)",
                        explanation="Refleks juara! Anda melindungi keamanan data dan finansial diri Anda.",
                    ),
                ],
            ),
            SimulatorQuestion(
                question_number=3,
                title="Tahap 3: Resolusi & Pelaporan",
                recruiter_message="Jika kakak menolak, posisi ini akan kami batalkan secara sepihak.",
                challenge_text="Perekrut mengancam membatalkan posisi. Apa langkah penutup yang paling bijak?",
                good_answer_summary="Mengikhlaskan tawaran palsu dan melaporkan nomor pelaku ke kanal aduan resmi seperti CekRekening.id atau Patroli Siber.",
                educational_takeaway="Jangan menyesali lowongan yang hilang jika lowongan tersebut sejak awal bermuatan penipuan.",
                options=[
                    QuestionOption(
                        id="A",
                        label="Opsi A",
                        text="Panik dan berusaha bernegosiasi agar tidak dibatalkan.",
                        is_correct=False,
                        feedback_label="Jawaban Kurang Tepat",
                        explanation="Negosiasi dengan penipu hanya akan membuka celah pemerasan baru.",
                    ),
                    QuestionOption(
                        id="B",
                        label="Opsi B",
                        text="Terima pembatalan, simpan bukti chat, dan laporkan kontak tersebut ke kanal pengaduan siber.",
                        is_correct=True,
                        feedback_label="Jawaban Tepat & Aman (Keputusan Matang)",
                        explanation="Langkah sempurna! Anda selamat dari penipuan dan berkontribusi melindungi sesama pencari kerja.",
                    ),
                ],
            ),
        ]

    async def _call_gemini_generate_scenario(self, user_prompt: str) -> dict[str, Any] | None:
        prompt = f"""
Anda adalah AI perancang skenario simulasi roleplay penipuan lowongan kerja (Job Scam Guardian).
Pengguna memberikan studi kasus / pertanyaan nyata:
"{user_prompt}"

Tugas Anda: Rancang 5 tahapan pertanyaan interaktif bertahap (maksimal 7 pertanyaan) dari kasus tersebut.
Setiap pertanyaan menggambarkan eskalasi situasi (dari pancingan awal, permintaan biaya/data, desakan waktu, dalih, hingga penutup).
Setiap pertanyaan memiliki 2 opsi jawaban (1 Benar/Aman, 1 Salah/Jebakan).
Sertakan 'good_answer_summary' (Deskripsi mengenai jawaban yang baik) dan 'educational_takeaway'.

Format output WAJIB JSON murni tanpa markdown dengan skema:
{{
  "title": "Judul singkat (3-6 kata)",
  "description": "Deskripsi singkat skenario (1-2 kalimat)",
  "objective": "Tujuan latihan untuk pelamar (1-2 kalimat)",
  "questions": [
    {{
      "question_number": 1,
      "title": "Judul Tahap 1",
      "recruiter_message": "Pesan chat dari perekrut fiktif",
      "challenge_text": "Pertanyaan instruksi untuk pelamar: Bagaimana responsmu?",
      "good_answer_summary": "Deskripsi mendalam mengenai jawaban yang baik dan trik penipunya",
      "educational_takeaway": "Tips kunci pencegahan / dasar hukum",
      "options": [
        {{
          "id": "A",
          "label": "Opsi A",
          "text": "Kalimat opsi jawaban pelamar",
          "is_correct": false,
          "feedback_label": "Jawaban Salah / Berisiko",
          "explanation": "Penjelasan rinci mengapa opsi ini berisiko atau salah"
        }},
        {{
          "id": "B",
          "label": "Opsi B",
          "text": "Kalimat opsi jawaban pelamar",
          "is_correct": true,
          "feedback_label": "Jawaban Tepat & Aman",
          "explanation": "Penjelasan rinci mengapa opsi ini benar dan aman"
        }}
      ]
    }}
  ]
}}
"""
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.4, "responseMimeType": "application/json"},
        }
        response = await self.client.post(
            url,
            headers={"x-goog-api-key": self.settings.gemini_api_key.get_secret_value()},
            json=payload,
            timeout=25.0,
        )
        if response.status_code != 200:
            return None
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        text_content = candidates[0]["content"]["parts"][0]["text"]
        return json.loads(text_content)

    def create_session(self, scenario_id: str) -> RoleplaySession:
        if scenario_id not in SCENARIOS:
            scenario_id = "wfh-deposit"
        scenario = SCENARIOS[scenario_id]
        token = str(uuid.uuid4())
        now = int(time.time())

        first_q = scenario.questions[0] if scenario.questions else None
        opening = first_q.recruiter_message if first_q else "Halo Kak, selamat berkas Anda lolos seleksi."

        session = RoleplaySession(
            roleplay_version="roleplay-v1",
            mode="live" if bool(self.settings.gemini_api_key.get_secret_value()) else "mock",
            scenario_id=scenario.id,
            session_token=token,
            expires_at=now + 1200,
            turn_index=1,
            max_turns=len(scenario.questions) if scenario.questions else 5,
            outcome="active",
            messages=[MessageItem(id="msg-1", role="recruiter", text=opening)],
            hint=first_q.good_answer_summary if first_q else "Amati pola red flag.",
            report=Report(
                outcome="active",
                skills=[
                    SkillEvaluation(code="critical_questioning", label="Kekritisan terhadap Syarat Rekrutmen", status="unobserved"),
                    SkillEvaluation(code="upfront_fee_refusal", label="Ketegasan Menolak Pungutan / Tindakan Berisiko", status="unobserved"),
                    SkillEvaluation(code="official_channel_verification", label="Tuntutan Verifikasi Kanal Resmi", status="unobserved"),
                ],
                moments=[],
                next_step="Pilih respons terbaikmu di setiap pertanyaan dan amati penjelasannya.",
                safe_reply=first_q.options[1].text if (first_q and len(first_q.options) > 1) else "Saya tolak segala bentuk biaya.",
            ),
        )
        self.sessions[token] = session
        return session

    async def process_turn(
        self, session_token: str, client_turn_id: str | None, user_message: str
    ) -> RoleplaySession:
        session = self.sessions.get(session_token)
        if not session:
            session = self.create_session("wfh-deposit")
            session.session_token = session_token

        user_text = user_message.strip()
        user_msg_id = client_turn_id or f"msg-{len(session.messages) + 1}"
        session.messages.append(MessageItem(id=user_msg_id, role="user", text=user_text))

        scenario = SCENARIOS.get(session.scenario_id)
        next_q_idx = session.turn_index  # 1-indexed turn_index is the 0-indexed next question
        if scenario and scenario.questions and next_q_idx < len(scenario.questions):
            next_q = scenario.questions[next_q_idx]
            session.messages.append(
                MessageItem(
                    id=f"msg-{len(session.messages) + 1}",
                    role="recruiter",
                    text=next_q.recruiter_message,
                )
            )
            session.hint = next_q.good_answer_summary
            if len(next_q.options) > 1:
                session.report.safe_reply = next_q.options[1].text
        else:
            session.outcome = "verified_exit"
            session.report.outcome = "verified_exit"
            session.messages.append(
                MessageItem(
                    id=f"msg-{len(session.messages) + 1}",
                    role="recruiter",
                    text="Percakapan berakhir. Kamu berhasil mempertahankan kewaspadaan sampai akhir simulasi.",
                )
            )

        session.turn_index += 1
        self.sessions[session.session_token] = session
        return session

    async def chat_conversation(self, req: RoleplayChatRequest) -> RoleplayChatResponse:
        """Endpoint percakapan AI live (voice/text) dengan avatar animasi."""
        user_msg = req.message.strip().lower()

        # Try Gemini first if key available
        if bool(self.settings.gemini_api_key.get_secret_value()):
            try:
                gemini_resp = await self._call_gemini_chat(req)
                if gemini_resp:
                    return gemini_resp
            except Exception as e:
                logger.warning(f"Gemini live chat call failed: {e}, falling back to local reasoning.")

        # Smart rule-based conversational fallback
        return self._generate_fallback_chat_reply(req.message, req.character, req.language)

    async def synthesize_speech(self, text: str, lang: str = "id") -> bytes:
        """Menghasilkan audio MP3 Text-to-Speech bahasa Indonesia untuk respon suara Jeli."""
        clean = re.sub(r"https?://\S+", "tautan web", text)
        clean = re.sub(r"[*_#`~\[\]]", "", clean)
        clean = re.sub(r"\s+", " ", clean).strip()
        if not clean:
            return b""

        cache_key = f"{lang}:{clean[:160]}"
        if not hasattr(self, "_tts_cache"):
            self._tts_cache: dict[str, bytes] = {}
        if cache_key in self._tts_cache:
            return self._tts_cache[cache_key]

        parts = re.split(r"([.?!,;:]+)", clean)
        chunks: list[str] = []
        curr = ""
        for p in parts:
            if len(curr) + len(p) < 170:
                curr += p
            else:
                if curr.strip():
                    chunks.append(curr.strip())
                curr = p
        if curr.strip():
            chunks.append(curr.strip())

        audio_parts: list[bytes] = []
        try:
            for c in chunks[:5]:  # max 5 chunks for snappy streaming
                r = await self.client.get(
                    "https://translate.google.com/translate_tts",
                    params={"ie": "UTF-8", "q": c, "tl": lang, "client": "tw-ob"},
                    headers={"User-Agent": "Mozilla/5.0"},
                    timeout=8.0,
                )
                if r.status_code == 200 and r.content:
                    audio_parts.append(r.content)
        except Exception as e:
            logger.warning(f"TTS synthesis network error: {e}")

        result = b"".join(audio_parts)
        if result and len(self._tts_cache) < 100:
            self._tts_cache[cache_key] = result
        return result

    async def _call_gemini_chat(self, req: RoleplayChatRequest) -> RoleplayChatResponse | None:
        is_en = req.language == "EN"
        if req.character == "recruiter":
            system_role = (
                "You are a Fictitious Recruiter in a job scam roleplay simulation. "
                "Your goal is to test the candidate's vigilance. Write a short message (max 3 sentences) that sounds polite but deceptive. "
                "If the user firmly refuses based on labor law or safety, praise their sharpness!"
                if is_en
                else "Kamu adalah Perekrut Fiktif dalam simulasi roleplay penipuan lowongan kerja. "
                "Tujuanmu menguji ketegasan kandidat. Tuliskan pesan pendek (maksimal 3 kalimat) yang ramah tapi licik, "
                "seperti mendesak konfirmasi, meminta biaya administrasi/seragam, atau meminta data sensitif. "
                "Jika pengguna menolak dengan tegas berlandaskan hukum, akui kejelian mereka dan berikan pujian!"
            )
        else:
            system_role = (
                "You are Jeli, an intelligent, friendly, and protective AI career security companion from Job Scam Guardian. "
                "You speak natural, fluent English. "
                "Your task is to answer user questions about job offers, detect scam indicators (red flags), "
                "and provide practical cybersecurity and career safety advice. "
                "Your response will be read aloud via Text-to-Speech, so keep it to 2-3 concise, well-spoken, informative sentences."
                if is_en
                else "Kamu adalah Jeli, maskot AI sahabat pencari kerja yang cerdas, ramah, dan protektif dari Job Scam Guardian. "
                "Kamu berbicara dalam bahasa Indonesia yang luwes, bersahabat, dan jelas. "
                "Tugasmu menjawab pertanyaan pengguna mengenai lowongan kerja, mendeteksi indikasi penipuan (red flags), "
                "dan memberikan saran hukum praktis (misal Permenaker No. 18/2024 atau tips keamanan siber). "
                "Teks jawabanmu akan dibacakan dengan suara (Text-to-Speech), jadi batasi panjangnya maksimal 2-3 kalimat yang padat, "
                "sangat enak didengar, dan informatif."
            )

        history_lines = []
        for h in req.history[-4:]:
            role_name = "User" if h.role == "user" else "AI"
            history_lines.append(f"{role_name}: {h.text}")
        history_str = "\n".join(history_lines)

        prompt = f"""{system_role}

Format output WAJIB JSON murni tanpa markdown dengan skema:
{{
  "reply": "{'Polite, concise response in English (max 2-3 sentences, clean for Text-to-Speech)' if is_en else 'Kalimat balasan santun, lugas, bersahabat (maks 2-3 kalimat, tanpa simbol aneh agar bagus saat dibacakan suara)'}",
  "emotion": "talking",
  "key_takeaway": "{'Key takeaway point for the user in English' if is_en else 'Poin kunci penting untuk pengguna'}",
  "suggested_replies": {['Suggested question 1', 'Suggested question 2'] if is_en else ['Pertanyaan usulan 1', 'Pertanyaan usulan 2']}
}}

Percakapan sebelumnya:
{history_str}

Pesan terbaru pengguna: "{req.message}"
JSON:"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.settings.gemini_model}:generateContent"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.5, "responseMimeType": "application/json"},
        }
        response = await self.client.post(
            url,
            headers={"x-goog-api-key": self.settings.gemini_api_key.get_secret_value()},
            json=payload,
            timeout=12.0,
        )
        if response.status_code != 200:
            return None
        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        text_content = candidates[0]["content"]["parts"][0]["text"]
        parsed = json.loads(text_content)
        return RoleplayChatResponse(
            reply=parsed.get(
                "reply",
                "Hello, is there any suspicious job offer you would like us to inspect?"
                if is_en
                else "Halo, ada yang bisa saya bantu terkait lowongan kerjamu?",
            ),
            emotion=parsed.get("emotion", "talking"),
            key_takeaway=parsed.get(
                "key_takeaway",
                "Always verify corporate legitimacy before proceeding."
                if is_en
                else "Selalu verifikasi legalitas perusahaan sebelum melangkah.",
            ),
            suggested_replies=parsed.get(
                "suggested_replies",
                ["What are common uniform scam signs?", "How to decline politely?", "Test me again!"]
                if is_en
                else ["Ciri-ciri penipuan biaya seragam?", "Bagaimana cara menolak yang sopan?", "Uji saya lagi!"],
            ),
        )

    def _generate_fallback_chat_reply(
        self, message: str, character: str, language: str = "ID"
    ) -> RoleplayChatResponse:
        low = message.lower()
        is_en = language == "EN"

        if is_en:
            if any(w in low for w in ["fee", "money", "uniform", "transfer", "deposit", "pay", "charge"]):
                return RoleplayChatResponse(
                    reply="Be extremely cautious! This is a major red flag. Legitimate employers never charge uniform, placement, or administrative fees to applicants. Never transfer funds to personal bank accounts!",
                    emotion="warning",
                    key_takeaway="Authentic corporations cover employee onboarding and selection expenses.",
                    suggested_replies=["How do I decline politely?", "Where should I report scam accounts?", "Test me with another scenario!"],
                )
            elif any(w in low for w in ["apk", "file", "download", "link", "invitation", "install"]):
                return RoleplayChatResponse(
                    reply="Alert: never install that .APK file! It is banking trojan malware engineered to intercept SMS and OTP credentials. Genuine interview letters are always sent as PDF documents or through official corporate emails.",
                    emotion="warning",
                    key_takeaway=".APK files sent via chat apps are malicious tools used to siphon bank accounts.",
                    suggested_replies=["What should I do if I installed it?", "What does a real invitation look like?", "Give me another safety tip!"],
                )
            elif any(w in low for w in ["telegram", "like", "task", "commission", "youtube"]):
                return RoleplayChatResponse(
                    reply="Watch out for paid task scams! They initially provide tiny payouts to win your trust, then demand thousands in non-refundable capital deposits. Avoid this scheme completely!",
                    emotion="warning",
                    key_takeaway="Task scams lure victims with easy money before demanding large deposits.",
                    suggested_replies=["Why can't deposit money be withdrawn?", "How do I report task fraud?", "Show me common scam tactics!"],
                )
            elif any(w in low for w in ["overseas", "cambodia", "myanmar", "thailand", "visa", "trafficking"]):
                return RoleplayChatResponse(
                    reply="High risk alert! Working abroad without an official employment visa carries severe human trafficking risks. Only travel through legally licensed foreign employment agencies.",
                    emotion="warning",
                    key_takeaway="Never depart for overseas employment on a tourist visa.",
                    suggested_replies=["How to verify licensed foreign agencies?", "What are red flags of trafficking?", "Check my job offer!"],
                )
            elif any(w in low for w in ["hello", "hi", "hey", "morning", "who are you"]):
                return RoleplayChatResponse(
                    reply="Hello! I'm Jeli, your AI career security guardian. You can chat or ask me directly via voice or text about any suspicious job offers. Is there an offer you'd like us to inspect together?",
                    emotion="happy",
                    key_takeaway="Jeli is ready to help evaluate job offers anytime via voice and text.",
                    suggested_replies=["An admin job asks for uniform fees", "How do .APK malware scams work?", "Explain common job scam signs"],
                )
            else:
                return RoleplayChatResponse(
                    reply="Great question! Whenever evaluating job offers, always remember: never transfer upfront money, never install unknown APKs, and independently verify corporate contact info. What specific details would you like to examine?",
                    emotion="talking",
                    key_takeaway="Vigilance at the start protects your career and financial security.",
                    suggested_replies=["An offer asks to pay for uniforms", "How do fake interview letters look?", "Test my reflexes with a scenario!"],
                )

        # Default Indonesian fallback
        if any(w in low for w in ["biaya", "uang", "seragam", "transfer", "deposit", "materai", "bayar"]):
            return RoleplayChatResponse(
                reply="Waspada ya! Ini adalah tanda bahaya (red flag) yang sangat nyata. Pasal 11 Permenaker No. 18 Tahun 2024 melarang keras perusahaan memungut biaya penempatan dari pelamar. Jangan transfer uang ke rekening pribadi perorangan!",
                emotion="warning",
                key_takeaway="Perusahaan legal menanggung biaya seragam dan proses seleksi kerja.",
                suggested_replies=["Bagaimana cara menolak yang sopan?", "Cek legalitas rekening di mana?", "Uji saya dengan skenario penipu!"],
            )
        elif any(w in low for w in ["apk", "file", "download", "unduh", "undangan", "link"]):
            return RoleplayChatResponse(
                reply="Awas, jangan pernah menginstal file berekstensi .APK tersebut! Itu adalah malware pencuri SMS dan OTP perbankan. Surat panggilan kerja resmi selalu dikirim dalam format dokumen PDF atau melalui email korporat perusahaan.",
                emotion="warning",
                key_takeaway="File APK di chat adalah modus pencurian data sensitif dan saldo m-banking.",
                suggested_replies=["Apa yang harus dilakukan jika sudah terlanjur?", "Bagaimana format email resmi?", "Uji saya skenario lain!"],
            )
        elif any(w in low for w in ["telegram", "like", "tugas", "misi", "komisi", "youtube"]):
            return RoleplayChatResponse(
                reply="Hati-hati dengan modus tugas berbayar (task scam)! Awalnya mereka memberikan komisi kecil Rp20.000 untuk memancing kepercayaan, lalu menuntut deposit jutaan rupiah yang tidak bisa ditarik lagi. Hindari skema ini ya!",
                emotion="warning",
                key_takeaway="Skema Ponzi tugas paruh waktu memanfaatkan iming-iming uang cepat.",
                suggested_replies=["Kenapa uang deposit tidak bisa cair?", "Bagaimana cara melaporkannya?", "Beri saya tips lainnya!"],
            )
        elif any(w in low for w in ["luar negeri", "kamboja", "myanmar", "thailand", "tanpa visa", "tppo"]):
            return RoleplayChatResponse(
                reply="Perhatian serius! Lowongan kerja luar negeri tanpa visa kerja resmi berisiko tinggi Tindak Pidana Perdagangan Orang (TPPO). Pastikan hanya berangkat lewat P3MI berizin resmi Kemnaker dan tercatat di BP2MI (Call Center: 133).",
                emotion="warning",
                key_takeaway="Jangan pernah berangkat bekerja ke luar negeri hanya bermodal visa turis.",
                suggested_replies=["Apa nomor aduan resmi BP2MI?", "Ciri-ciri agen penyalur resmi?", "Cek tawaran kerja saya!"],
            )
        elif any(w in low for w in ["halo", "hai", "selamat", "pagi", "siang", "sore", "malam", "siapa kamu"]):
            return RoleplayChatResponse(
                reply="Halo! Saya Jeli, sahabat cerdas penjaga keamanan karirmu. Kamu bisa mengobrol atau bertanya langsung lewat suara dan tulisan tentang tawaran kerja yang mencurigakan. Ada yang ingin kamu ceritakan?",
                emotion="happy",
                key_takeaway="Jeli siap membantumu menguji tawaran kerja kapan saja lewat suara dan teks.",
                suggested_replies=["Ada tawaran admin minta biaya seragam", "Coba tes saya dengan roleplay penipu!", "Jelaskan ciri-ciri lowongan palsu"],
            )
        else:
            return RoleplayChatResponse(
                reply="Pertanyaan yang sangat bagus! Setiap menerima tawaran kerja, terapkan selalu rumus JELI: Jaga kerahasiaan data, Evaluasi rincian gaji, Lacak legalitas PT, dan Ingat bahwa rekrutmen resmi tidak memungut biaya. Ada detail tawaran yang ingin kita bedah bersama?",
                emotion="talking",
                key_takeaway="Kecermatan di awal melindungi masa depan karir dan finansialmu.",
                suggested_replies=["Ada tawaran disuruh bayar seragam", "Bagaimana modus file .APK?", "Uji saya dengan skenario perekrut!"],
            )

