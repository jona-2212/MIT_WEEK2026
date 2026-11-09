# Konsep F03 — AI Roleplay Jeli

**Nama fitur:** Jeli Lakon — Latihan Menghadapi Perekrut Fiktif  
**Versi:** 0.1  
**Tanggal riset:** 7 November 2026, Asia/Jakarta  
**Status:** DISETUJUI pemilik proyek pada 8 November 2026; baseline SRS F03  
**Deliverable tahap konsep (7 November):** satu dokumen konsep dan hasil riset. Implementasi yang disetujui 8 November dirinci dalam SRS F03.

## 1. Usulan yang diminta untuk disetujui

Jeli Lakon mengembangkan Scam Simulator menjadi **latihan percakapan teks dengan AI**. Pengguna berperan sebagai pencari kerja dan membalas dengan kalimatnya sendiri. AI memerankan perekrut fiktif sesuai skenario terkurasi. Respons pengguna memengaruhi kelanjutan percakapan, sementara Jeli menjelaskan keputusan dan bukti setelah latihan berakhir.

Rekomendasi MVP: **dua skenario berbahasa Indonesia, maksimal delapan balasan pengguna per sesi, satu tingkat kesulitan, tanpa akun, dan tanpa suara**. Mesin skenario backend mengendalikan tahap dan akhir sesi. Model membantu memahami jawaban bebas dan menulis percakapan dalam batas tahap tersebut.

Tujuan pembelajaran: pengguna dapat mengenali permintaan yang berisiko, meminta verifikasi melalui kanal yang ditemukan sendiri, melindungi uang/data, serta mengakhiri interaksi saat diperlukan. Keberhasilan tidak diukur dari panjang percakapan atau kemampuan membuat perekrut menyetujui pengguna.

Semua angka batas dan rancangan API di dokumen ini adalah usulan desain Jeli, bukan hasil benchmark atau kontrak yang sudah berlaku.

## 2. Dasar riset dan implikasinya

Riset menggunakan publikasi peneliti, dokumentasi resmi penyedia AI, dan sumber pemerintah. Temuan sumber dibedakan dari keputusan desain yang diusulkan.

| Temuan sumber | Implikasi yang diusulkan untuk Jeli |
|---|---|
| Paper *Role-Playing Simulation Games using ChatGPT* mengeksplorasi penggunaan LLM sebagai peserta dalam simulasi untuk pembelajaran aktif. Paper ini merupakan contoh pendekatan, bukan pembuktian efektivitas Jeli. [S1] | Beri pengguna kesempatan menyusun respons sendiri dan melihat dampaknya dalam skenario. |
| Studi acak tentang latihan anamnesis memakai pasien berbasis GPT, pustaka skenario, dan laporan umpan balik dengan rubrik tetap. Keterbatasannya mencakup satu institusi, sampel relatif kecil, dan tindak lanjut singkat. [S2] | Pakai skenario terkurasi dan rubrik eksplisit. Temuan pada pendidikan medis tidak dapat langsung dianggap berlaku untuk literasi penipuan kerja. |
| Kemnaker menjelaskan penyamaran perekrut serta biaya administrasi, pelatihan, atau akomodasi sebagai pola yang perlu diwaspadai dalam penipuan lowongan. [S3] | Jadikan biaya sebagai syarat proses seleksi dan penolakan verifikasi sebagai materi latihan kontekstual; hindari vonis hukum otomatis. |
| FTC menjelaskan task scam: tawaran tugas sederhana, komisi semu, kemudian deposit untuk melanjutkan tugas atau menarik penghasilan. [S4] | Skenario kedua memperlihatkan perubahan dari tawaran menarik menjadi permintaan deposit. Penjelasan FTC adalah rujukan pola, bukan otoritas hukum Indonesia. |
| Dokumentasi Gemini menyatakan structured output tetap membutuhkan validasi nilai dan penanganan keluaran yang keliru secara semantik. [S5] | JSON valid belum cukup. Backend memeriksa tindakan, kutipan, perpindahan tahap, dan materi yang boleh ditampilkan. |
| Dokumentasi Generate Content menjelaskan penggunaan riwayat percakapan sebagai konteks tiap giliran; dokumentasi Interactions menyediakan pilihan pengelolaan state yang berbeda. [S6, S7] | Untuk MVP, usulkan riwayat terbatas dan adapter REST yang sesuai pola repo. Migrasi API penyedia menjadi keputusan terpisah jika diperlukan. |
| Live API menyediakan autentikasi token sementara untuk koneksi langsung klien. [S8] | Suara memerlukan desain koneksi dan kredensial tambahan. Tunda ke fase setelah simulasi teks tervalidasi. |
| Ketentuan Gemini membedakan perlakuan data layanan berbayar dan tidak berbayar, termasuk penggunaan konten dan kemungkinan peninjauan manusia pada layanan tidak berbayar. [S9] | Beri pemberitahuan pemrosesan pihak ketiga, gunakan identitas fiktif, dan verifikasi jenis layanan akun sebelum pilot publik. Jangan menjanjikan bahwa provider tidak menyimpan data. |

**Kesimpulan desain dari riset:** gunakan percakapan yang adaptif di dalam alur yang terkontrol, diikuti refleksi berbasis bukti. Ini hipotesis produk yang perlu diuji pada pengguna Jeli. Belum ada dasar untuk mengklaim persentase peningkatan kewaspadaan atau penurunan korban.

## 3. Hubungan dengan repo dan batas produk

Baseline repo yang dibaca:

- `frontend/src/components/ScamSimulatorPage.tsx` memiliki dua skenario, pilihan respons tetap, pengurangan skor, dan state umpan balik. Percakapan maju berdasarkan urutan yang sudah ditulis.
- `frontend/src/App.tsx` menyediakan halaman `#simulator`; halaman ini menjadi titik masuk fitur baru.
- Backend memakai FastAPI, HTTPX, Pydantic, konfigurasi environment, request ID, serta adapter Gemini. Struktur ini dapat dipakai kembali tanpa framework agen baru.
- Recognition memakai kontrak `recognition-v2`. Roleplay mendapat kontrak terpisah dan tidak mengubah kategori atau endpoint checker.
- Blueprint menempatkan Simulator pada F03 dan membedakannya dari AI Assistant serta Voice Experience.

Konsep ini merupakan usulan perluasan scope Simulator melalui permintaan pemilik proyek. Dokumen F01 yang membatasi implementasi ke Recognition tetap menjadi acuan untuk F01. Persetujuan konsep ini menjadi dasar menulis spesifikasi F03 dan ADR terkait sebelum kode fitur ditambahkan.

## 4. Pengalaman pengguna

### A. Pilih latihan

Pengguna membuka Scam Simulator dan memilih kartu skenario. Kartu menampilkan situasi singkat, sasaran latihan, serta perkiraan panjang **4–8 balasan**. Rentang ini merupakan target desain; waktu penyelesaian belum diukur.

Sebelum mulai, tampilkan:

> Kamu akan berbicara dengan perekrut fiktif yang diperankan AI. Gunakan jawaban dan identitas rekaan. Jangan kirim OTP, rekening, nomor identitas, atau data pribadi. Percakapan diproses melalui Gemini. Kamu bisa berhenti kapan saja.

### B. Bercakap sebagai pelamar

Perekrut mengirim pesan pembuka yang sudah ditulis tim. Pengguna mengetik balasan bebas. Tiga bantuan opsional berbentuk maksud tindakan: **Tanya detail**, **Minta verifikasi**, dan **Tolak permintaan**. Bantuan mengisi draf yang bisa diedit; mengklik bantuan tidak langsung mengirim jawaban atau menetapkan hasil evaluasi.

Tampilan memisahkan gelembung perekrut, balasan pengguna, dan pesan sistem Jeli. Label **SIMULASI • PEREKRUT AI FIKTIF** selalu terlihat. Status menunggu respons dan giliran saat ini diumumkan secara aksesibel. Tidak ada penghitung mundur yang menghukum pengguna karena membaca perlahan.

### C. Minta petunjuk atau berhenti

Tombol **Petunjuk Jeli** memberikan satu petunjuk terkurasi sesuai tahap, di luar suara perekrut. Contoh: “Perhatikan apakah kamu diminta mengeluarkan uang agar proses bisa dilanjutkan.” Pemakaian petunjuk dicatat sebagai konteks refleksi, tanpa penalti tersembunyi.

Tombol **Akhiri latihan** selalu tersedia dan dapat menutup sesi secara lokal saat provider gagal. Pengguna yang menolak dan mengakhiri percakapan secara jelas juga dapat mencapai akhir skenario lebih awal. Perekrut tidak boleh terus mendesak setelah sesi dinyatakan berakhir.

### D. Baca pembahasan

Pembahasan menampilkan:

1. Hasil sesi: **Berhenti dan memverifikasi**, **Masih perlu klarifikasi**, **Memilih tindakan berisiko dalam simulasi**, atau **Latihan dihentikan**.
2. Maksimal tiga momen penting: pesan pemicu → balasan pengguna → alasan evaluasi.
3. Tindakan yang sudah membantu melindungi pengguna dan satu hal yang dapat dilatih berikutnya.
4. Contoh balasan alternatif yang aman dan bisa disalin.
5. Pertanyaan refleksi: “Apa yang akan kamu verifikasi sebelum melanjutkan?”

Gunakan bahasa suportif: “Dalam simulasi ini, jawabanmu menyetujui deposit sebelum verifikasi.” Hindari label seperti “mudah ditipu” dan klaim bahwa saldo atau uang nyata telah hilang.

Sesudahnya tersedia **Ulangi skenario**, **Latihan berikutnya**, dan **Cek tawaran kerja**. Pergantian skenario ketika sesi aktif meminta pengguna memilih melanjutkan sesi atau mengakhiri dan berganti.

## 5. Skenario MVP

| ID | Situasi dan perkembangan | Perilaku yang dilatih | Contoh akhir |
|---|---|---|---|
| `uniform_deposit` | Tawaran kerja admin fiktif → deposit seragam sebagai syarat wawancara → tekanan tenggat atau upaya menghindari verifikasi. | Meminta kejelasan proses, menolak pembayaran sebagai syarat, memilih kanal verifikasi mandiri. | Pengguna berhenti untuk memverifikasi; menyetujui deposit dalam simulasi; atau belum membuat keputusan sampai batas giliran. |
| `task_deposit` | Tawaran tugas like/subscribe → klaim komisi awal → deposit untuk membuka tugas atau menarik komisi. | Mengenali pembayaran untuk memperoleh penghasilan, mempertanyakan komisi semu, menolak deposit. | Pengguna keluar dari skema; menyetujui deposit dalam simulasi; atau masih perlu klarifikasi. |

Nama orang, perusahaan, dan nominal sepenuhnya fiktif. Tidak ada rekening lengkap, QR pembayaran, URL transaksi, maupun instruksi instalasi aplikasi. Tautan yang diketik model atau pengguna tidak dibuat menjadi tautan aktif.

Klarifikasi biasa tidak otomatis dianggap keputusan aman. Mengatakan “saya transfer sekarang” berarti komitmen berisiko dalam cerita, bukan bukti transfer nyata. Kalimat “kalau diminta transfer, saya menolak” harus dibedakan dari persetujuan transfer. Pengguna yang meminta penjelasan belum tentu ingin mengakhiri percakapan.

Untuk MVP, kedua skenario memang latihan menghadapi pola penipuan. Kasus rekrutmen wajar/ambigu menjadi materi evaluasi pemahaman dan calon perluasan, agar produk kelak tidak mengajarkan bahwa semua perekrut atau semua pesan WhatsApp pasti palsu.

## 6. Pembagian peran AI dan aplikasi

| Komponen | Tanggung jawab | Batas kewenangan |
|---|---|---|
| Pustaka skenario | Persona fiktif, fakta tetap, tahap, pesan pembuka, tujuan, petunjuk, dan cabang yang diizinkan. | Dikelola tim; tidak diganti oleh instruksi pengguna. |
| Penafsir respons AI | Mengusulkan maksud tindakan pengguna dan mengutip teks yang mendukungnya. | Hasil dapat keliru; backend memvalidasi bukti dan menangani ketidakpastian. |
| Mesin skenario backend | Memilih transisi sah, menghitung giliran, menerapkan penghentian, dan menyusun catatan keputusan. | Menjadi sumber state resmi; tidak menerima state bebas dari browser atau model. |
| Pemeran perekrut AI | Menulis respons pendek yang relevan dengan balasan terakhir dan tahap yang sudah dipilih. | Tidak membuat tujuan, kanal pembayaran, fakta perusahaan, atau tahap baru. |
| Jeli sebagai pembimbing | Menampilkan petunjuk dan pembahasan berdasarkan rubrik serta catatan tervalidasi. | Tidak menyatakan sifat kepribadian, kepastian hukum, atau kemampuan nyata pengguna. |

Ini pemisahan tanggung jawab dalam satu aplikasi, bukan kebutuhan beberapa agen otonom. Tidak diperlukan agent framework, tool browsing, function calling untuk tindakan eksternal, fine-tuning, atau database vektor baru.

## 7. Alur percakapan dan kendali tahap

Alur usulan:

```text
Pilih skenario → Briefing → Pembuka terkurasi → Tunggu balasan
  → Tafsirkan tindakan → Validasi bukti → Tentukan transisi
  → Tulis respons perekrut sesuai tahap → Validasi respons → Tunggu balasan

Cabang akhir: berhenti untuk verifikasi / komitmen berisiko /
             batas giliran / pengguna mengakhiri / interupsi layanan
  → Pembahasan berbasis catatan yang tersedia
```

Usulan maksud tindakan: `ask_details`, `verify_independently`, `refuse_request`, `agree_to_payment`, `agree_to_share_sensitive_data`, `end_conversation`, `unclear`, dan `off_topic`. Gabungan maksud dan urutan kalimat harus diperiksa; daftar tersebut bukan aturan pencocokan kata kunci.

Contoh transisi: pengguna meminta verifikasi → perekrut dapat menjawab atau mengelak sesuai skenario → pengguna menolak dan mengatakan akan memeriksa melalui kanal mandiri → sesi berakhir dengan pembahasan. Respons yang tidak jelas menghasilkan klarifikasi, bukan penalti.

Setiap balasan pengguna yang diterima menghabiskan satu dari maksimal delapan giliran, termasuk balasan di luar topik. Permintaan yang gagal sebelum perubahan state tidak memajukan sesi. Setelah dua respons di luar topik berturut-turut, Jeli menawarkan kembali ke skenario atau mengakhiri latihan.

## 8. Penilaian dan pembahasan

MVP menggunakan status per keterampilan, tanpa skor 0–100: **Terlihat**, **Perlu dilatih**, dan **Belum teramati**.

| Keterampilan | Bukti yang dicari |
|---|---|
| Memeriksa proses | Pengguna mempertanyakan tahap seleksi, tujuan biaya, atau kejelasan penawaran. |
| Memverifikasi secara mandiri | Pengguna memilih mencari kontak resmi sendiri atau menunda keputusan sampai verifikasi. Meminta email saja belum membuktikan verifikasi dilakukan. |
| Melindungi uang dan data | Pengguna menolak deposit/akses akun atau tidak menyetujui permintaan berisiko yang muncul. |
| Menetapkan batas | Pengguna menunda, menolak, atau mengakhiri interaksi ketika tekanan meningkat. |

Pembahasan selalu menunjuk pesan dan kutipan literal yang relevan. Penilaian penafsir disertai `message_id`, `quote`, dan `uncertain`; kutipan harus cocok dengan pesan. Jika bukti tidak cukup, tampilkan **Belum teramati**. Tidak menjawab bukan bukti bahwa pengguna telah menguasai keterampilan.

Model tidak diberi wewenang menghitung nilai akhir sendiri. Pemetaan bukti ke status dilakukan oleh rubrik aplikasi yang terdokumentasi. Ringkasan pembahasan MVP disusun dari template dan catatan tervalidasi sehingga tetap tersedia saat generasi respons gagal.

## 9. Rancangan teknis yang diusulkan

Frontend memperluas halaman simulator yang ada dengan briefing, riwayat chat, composer, petunjuk, serta pembahasan. Backend menambahkan schema, service orkestrasi roleplay, pustaka skenario berversi, dan adapter provider khusus percakapan. Infrastruktur HTTPX, konfigurasi, error envelope, serta request ID dipakai kembali.

Usulan kontrak awal, yang akan dirinci menjadi spesifikasi setelah approval:

| Endpoint | Masukan/keluaran utama |
|---|---|
| `GET /api/v1/roleplay/scenarios` | Daftar skenario publik, tujuan latihan, versi, dan bahasa tersedia; tanpa kunci penilaian internal. |
| `POST /api/v1/roleplay/start` | `scenario_id` → pembuka terkurasi, `session_token`, `turn_index`, `expires_at`, `roleplay_version`. |
| `POST /api/v1/roleplay/turn` | `session_token`, `client_turn_id`, `message` → pesan berikutnya atau akhir, token state terbaru, progres, dan pembahasan bila selesai. |

Satu giliran normal memakai maksimal **dua panggilan generatif**: penafsiran tindakan, kemudian penulisan respons setelah backend memilih tahap. Giliran akhir cukup penafsiran dan pembahasan template. Pembuka, petunjuk, dan tombol akhir lokal tidak memerlukan AI. Pemisahan dua tahap menambah latensi tetapi membuat kendali alur lebih jelas; penggabungan menjadi satu panggilan dapat dievaluasi kemudian.

Keluaran penafsir dan pemeran sama-sama memakai schema terbatas. `GEMINI_ROLEPLAY_MODEL` diusulkan sebagai konfigurasi terpisah agar pemilihan model tidak mengubah Recognition. Kandidat awal mengikuti model akun yang benar-benar tersedia; nama model, dukungan schema, kualitas bahasa, dan latensi harus diverifikasi sebelum live pilot. Dokumentasi terbaru menyediakan Interactions, sementara repo menggunakan Generate Content; tidak ada migrasi provider otomatis melalui konsep ini. [S5–S7]

### State dan kompatibilitas deployment

Usulan MVP tanpa database persisten: backend mengembalikan snapshot sesi yang ditandatangani dengan HMAC. Snapshot memuat versi skenario, riwayat terbatas, giliran, catatan keputusan, ID sesi, dan waktu kedaluwarsa. Backend memverifikasi tanda tangan serta batas ukuran pada setiap request. Browser tidak dapat menetapkan hasil evaluasi atau tahap resmi sendiri.

Token disimpan di memori halaman dan tidak diletakkan pada URL, log, atau localStorage. Tanda tangan melindungi integritas, **bukan mengenkripsi isi**; token tetap diperlakukan sebagai data percakapan sensitif. Refresh menutup sesi pada MVP. Usulan kedaluwarsa: 20 menit sejak mulai, diperiksa saat request berikutnya.

Signing secret disimpan hanya di environment backend dan harus konsisten pada instance/deployment yang melayani sesi. Secret kosong menonaktifkan start/turn roleplay dengan error konfigurasi yang jelas; startup dan health tetap berjalan. Rotasi secret dapat membatalkan sesi aktif dan harus didokumentasikan.

State bertanda tangan tidak mencegah replay token lama dan tidak menjamin idempotensi lintas instance. `client_turn_id` serta penguncian kirim di UI membantu satu tab; token hanya diperbarui setelah respons valid. Retry/replay masih dapat memakai kuota. Pilot publik membutuhkan pembatas request pada gateway/hosting dan anggaran provider. Bila kelak diperlukan resume lintas perangkat, kuota global per sesi, atau idempotensi ketat, evaluasi penyimpanan server sebagai perubahan arsitektur terpisah.

## 10. Batas penggunaan, privasi, dan kegagalan

| Aspek | Usulan MVP |
|---|---|
| Ukuran pesan | Maksimal 1.000 karakter per balasan; maksimal delapan balasan; total body request maksimal 96 KiB termasuk token. |
| Panjang respons | Perekrut maksimal 600 karakter dan satu fokus permintaan per giliran. |
| Waktu provider | Anggaran total giliran 40 detik, dibagi ke penafsiran dan generasi. Tanpa retry otomatis; batas hosting perlu diperiksa sebelum deploy. |
| Penyimpanan | Tidak menambah database transcript atau logging isi pesan. Retensi provider mengikuti layanan akun dan ketentuannya. [S9] |
| Data sensitif | UI melarang data nyata. Pola jelas seperti nomor identitas atau rekening panjang ditahan sebelum request AI dan pengguna diminta mengganti dengan placeholder. Deteksi otomatis bersifat terbatas dan bukan jaminan redaksi sempurna. |
| Konten keluaran | Tolak tautan/kontak/rekening operasional, markup aktif, serta konten di luar tujuan latihan. Render sebagai teks biasa. Pemeriksaan otomatis tidak menjamin semua kesalahan semantik tertangkap. |
| Provider gagal | Tampilkan error yang jujur, pertahankan riwayat yang sudah valid, sediakan coba lagi atau akhiri. Jangan menampilkan hasil AI seolah request berhasil. |
| Generasi gagal setelah tafsir valid | Jangan commit setengah giliran. Pertahankan snapshot lama; retry dapat menambah biaya. |
| Sesi terputus | Pembahasan lokal hanya memakai catatan yang sudah diterima dan dilabeli latihan dihentikan; pesan yang belum dievaluasi tidak diberi penilaian. |
| Key kosong | Briefing tetap bisa dilihat; start latihan AI memberi error konfigurasi, tanpa respons mock tersamar. |

Input pengguna dan keluaran model adalah data tidak tepercaya. Instruksi seperti “abaikan skenario”, permintaan membuka prompt, atau permintaan menjadi penipu di luar latihan tidak mengubah aturan. Hentikan eskalasi saat pengguna berhenti; tidak ada transaksi, browsing, pesan ke orang lain, atau permintaan dokumen asli. Uji negatif tetap diperlukan karena system prompt saja tidak cukup menjamin kepatuhan.

Jika pengguna menyatakan mengalami kejadian nyata, Jeli menawarkan keluar dari simulasi dan membuka checker. Emergency Guide belum dianggap tersedia. Pembahasan tidak menghasilkan pasal hukum dari model; indeks hukum Recognition yang terbatas tidak dijadikan syarat roleplay.

## 11. Contoh pengalaman satu sesi

**Skenario:** deposit seragam, semua pihak fiktif.

> **Perekrut AI:** Selamat, kamu masuk tahap wawancara admin. Untuk reservasi jadwal, ada deposit seragam Rp250.000. Bisa konfirmasi hari ini?
>
> **Pengguna:** Sebelum bayar, saya mau cek lowongannya melalui kontak resmi perusahaan yang saya cari sendiri.
>
> **Perekrut AI:** Jadwalnya sedang penuh. Apakah kamu tetap ingin menunda konfirmasi sambil melakukan pengecekan?
>
> **Pengguna:** Ya, saya tidak akan membayar untuk mengamankan jadwal. Saya berhenti dulu sampai bisa memverifikasi.
>
> **Jeli — Pembahasan:** Kamu menunda pembayaran dan memilih kanal verifikasi mandiri. Kutipan “saya tidak akan membayar untuk mengamankan jadwal” mendukung keputusan menetapkan batas. Permintaan deposit sebagai syarat wawancara perlu diwaspadai. Latihan ini tidak membuktikan status hukum suatu perusahaan nyata.

Contoh tersebut adalah naskah ilustrasi, bukan hasil inferensi live. Respons AI tidak harus sama kata demi kata, tetapi harus mempertahankan fakta dan batas skenario.

## 12. Cakupan dan pengembangan berikutnya

**MVP yang diusulkan:** dua skenario di atas, balasan teks bebas, bantuan draf, petunjuk terkurasi, penghentian yang benar, pembahasan berbasis bukti, state terbatas, error jujur, tes mock, dan integrasi React–FastAPI. UI tetap mendukung navigasi ID/EN yang sudah ada; konten latihan MVP jelas diberi label Bahasa Indonesia. Pergantian bahasa antarmuka tidak mengubah bahasa atau reset sesi aktif.

**Sesudah MVP tervalidasi:** skenario permintaan kredensial, rekrutmen wajar/ambigu, versi latihan berbahasa Inggris, tingkat kesulitan, serta rekomendasi latihan dari kategori checker. Penggunaan hasil checker memerlukan pilihan eksplisit pengguna dan tidak otomatis menyalin materi pribadinya ke simulasi.

**Fase lanjutan terpisah:** suara melalui Live API atau STT/TTS, roleplay telepon, histori akun, personalisasi, dan dashboard pengajar. Suara memerlukan izin mikrofon, transkrip aksesibel, interupsi bicara, pilihan model, retensi audio, serta pengujian biaya/koneksi. Penggunaan ElevenLabs tidak menjadi dependency MVP. [S8]

## 13. Kriteria penerimaan dan evaluasi

| Area | Kriteria penerimaan MVP |
|---|---|
| Adaptasi | Penolakan, klarifikasi, persetujuan deposit, dan keputusan keluar menghasilkan transisi yang berbeda dan sesuai aturan. |
| Penghentian | Tombol akhir segera menghentikan UI dan mengabaikan respons request yang sudah tidak aktif. Model tidak melanjutkan percakapan setelah terminal state. |
| Bukti | Setiap evaluasi merujuk kutipan yang cocok; bukti yang tidak cocok tidak boleh menjadi dasar status keterampilan. |
| Bahasa dan konteks | Negasi, respons campuran, bahasa informal, dan rujukan hipotetis diuji. Ambiguitas memicu klarifikasi. |
| State | Token diubah, kedaluwarsa, versi salah, body berlebih, dan giliran di atas batas ditolak tanpa panggilan AI. |
| Kegagalan | Timeout, kuota habis, key kosong, schema salah, respons berbahaya, dan error di tengah dua panggilan menghasilkan state yang konsisten. |
| Pembahasan | Sesi selesai, berhenti awal, dan terputus mempunyai pembahasan yang sesuai data tersedia; tidak mengarang transfer atau keterampilan. |
| Aksesibilitas | Composer berlabel, fokus terlihat, status loading diumumkan, chat dapat dibaca dengan keyboard, dan layout diuji pada mobile serta desktop. |
| Integrasi | Checker `recognition-v2`, startup tanpa key, health, dan demo existing tetap diverifikasi. |

Evaluasi dilakukan dalam tiga lapis:

1. **Tes otomatis dengan provider mock:** state machine, kontrak, kutipan, batas giliran, error, dan privasi log. Tidak menghabiskan kuota AI.
2. **Evaluasi live terkurasi setelah izin kuota:** minimal 24 balasan uji yang mencakup penolakan, persetujuan, klarifikasi, negasi, jawaban campuran, dan upaya mengganti instruksi. Tambahkan delapan percakapan penuh lintas kedua skenario. Catat model, versi prompt, validitas schema, kesalahan transisi, latensi, dan token. Ini target evaluasi awal, bukan bukti akurasi populasi.
3. **Pilot pengguna:** usulan 5–8 peserta untuk menemukan hambatan penggunaan, kemudian penilaian sebelum/sesudah dengan kasus berbeda. Perubahan pada sampel kecil dilaporkan deskriptif dan tidak dipromosikan sebagai efektivitas ilmiah atau perlindungan dari penipuan nyata.

Target minimum sebelum pilot publik: seluruh kasus kritis pada fixture pengujian lolos dan tidak ada pelanggaran kritis yang belum ditangani pada evaluasi live. Ini kriteria terhadap dataset yang diuji, bukan jaminan perilaku seluruh keluaran AI.

## 14. Tahapan implementasi setelah persetujuan

1. Turunkan konsep yang disetujui menjadi SRS F03, kontrak API, rubrik, dan ADR state sesi. Perbarui acuan scope agar pekerjaan Simulator dapat ditelusuri.
2. Bangun pustaka dua skenario serta mesin transisi; verifikasi dengan mock tanpa AI eksternal.
3. Tambahkan adapter penafsir/pemeran, validasi keluaran, batas request, signing, dan penanganan kegagalan.
4. Integrasikan halaman simulator dengan composer, petunjuk, penghentian, dan pembahasan. Verifikasi tampilan serta interaksi.
5. Jalankan pemeriksaan frontend/backend, dokumentasikan perubahan, dan lakukan evaluasi live ketika izin kuota diberikan.

Temuan baseline dari pembacaan repo harus dibedakan dari regresi fitur: lint frontend gagal pada dua whitespace halaman lama, satu tes mock backend gagal karena referensi tidak muncul, bundle hukum mengalami ketidakcocokan checksum LF/CRLF, dan workflow CI berada di folder backend. Perbaikan yang diperlukan untuk verifikasi dicatat dengan scope jelas; tidak menjadi alasan mengubah seluruh modul Recognition.

Tidak ada commit, push, atau deployment melalui persetujuan konsep saja. Pengujian Gemini nyata tetap mengikuti izin kuota terpisah sesuai instruksi repo. Persetujuan konsep memberi dasar untuk implementasi dan pengujian mock dalam cakupan yang disepakati.

## 15. Paket keputusan untuk pemilik proyek

Jika konsep disetujui tanpa revisi, baseline implementasinya adalah:

- **Nama kerja:** Jeli Lakon, di halaman Scam Simulator yang sudah ada.
- **Interaksi:** percakapan teks bebas berbahasa Indonesia dengan bantuan draf dan petunjuk.
- **Materi:** dua skenario, satu tingkat kesulitan, maksimal delapan balasan per sesi.
- **Kendali:** backend mengatur state dan transisi; AI menafsirkan respons serta memerankan perekrut dalam batas skenario.
- **Penilaian:** status keterampilan dengan kutipan dan pembahasan; tanpa angka akurasi atau skor kepribadian.
- **Infrastruktur:** FastAPI–Gemini yang ada, state bertanda tangan tanpa database transcript, dan tanpa suara pada MVP.
- **Batas approval:** implementasi setelah persetujuan dokumen; live quota dan deployment memerlukan otorisasi tersendiri.

**Catatan persetujuan:** pemilik proyek menyetujui implementasi pada 8 November 2026 melalui instruksi “yes implement”. Spesifikasi implementasi ada di [SRS F03](SRS_F03_AI_Roleplay.md). Voice/ElevenLabs tetap fase lanjutan.

## 16. Referensi riset

Semua sumber diakses atau ditelusuri pada 7 November 2026. Dokumentasi provider dapat berubah; kontrak API dan ketentuan akun perlu diperiksa kembali saat implementasi/live pilot.

- **[S1]** Stampfl, Ivkić, dan Geyer (2024), [Role-Playing Simulation Games using ChatGPT](https://arxiv.org/abs/2402.09161). Contoh pendekatan roleplay pendidikan; bukan evaluasi produk Jeli.
- **[S2]** [Feasibility study of using GPT for history-taking training in medical education: a randomized clinical trial](https://pmc.ncbi.nlm.nih.gov/articles/PMC12243320/). Rujukan desain skenario dan umpan balik; domain dan keterbatasannya membatasi generalisasi.
- **[S3]** Kemnaker (10 Oktober 2024), [Kemnaker Imbau Masyarakat Waspada Penipuan Lowongan Pekerjaan](https://www.kemnaker.go.id/news/detail/kemnaker-imbau-masyarakat-waspada-penipuan-lowongan-pekerjaan). Sumber pola penipuan lokal, bukan dasar vonis hukum individual.
- **[S4]** FTC (November 2024), [Task scams create the illusion of making money](https://consumer.ftc.gov/consumer-alerts/2024/11/task-scams-create-illusion-making-money). Sumber pola skenario tugas dan deposit.
- **[S5]** Google AI for Developers, [Structured outputs](https://ai.google.dev/gemini-api/docs/structured-output?lang=rest). Dukungan schema dan kebutuhan validasi semantik aplikasi.
- **[S6]** Google AI for Developers, [Generate Content — Text generation](https://ai.google.dev/gemini-api/docs/generate-content/text-generation?hl=en). Pola multi-turn dengan riwayat percakapan.
- **[S7]** Google AI for Developers, [Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview?authuser=0). Alternatif API dan pengelolaan state; bukan keputusan migrasi repo.
- **[S8]** Google AI for Developers, [Live API — Ephemeral tokens](https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens?authuser=31&hl=en). Pertimbangan autentikasi untuk pengembangan suara.
- **[S9]** Google AI for Developers, [Gemini API Additional Terms of Service](https://ai.google.dev/gemini-api/terms?authuser=00). Perlakuan data tergantung layanan akun; cek ketentuan yang berlaku sebelum pilot.

Referensi internal: [Product Blueprint](<../../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>), [System overview](../architecture/SYSTEM_OVERVIEW.md), [Document router](../engineering/DOCUMENT_ROUTER.md), dan [instruksi repo](../../AGENTS.md).
