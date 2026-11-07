# Implementasi Recognition v1

Tujuan: mencatat pemetaan [brief pengguna](BRIEF.md) ke implementasi MVP yang benar-benar tersedia. Keputusan utama berada di [ADR-0002](../../decisions/ADR-0002-recognition-pipeline.md); kontrak HTTP di [API Recognition](../../api/recognition.md).

## Alur dan batas komponen

`POST /api/v1/analyze` menerima satu form multipart berisi `text`, `file`, atau keduanya. `read_analyze_form` membatasi body sebelum parsing, menolak field duplikat/tidak dikenal, membatasi satu gambar, memeriksa penutup multipart, dan menjaga spool upload dalam memori. Batas file 5 MiB = 5.242.880 byte; body maksimum 5 MiB + 64 KiB untuk teks dan overhead. Field teks mentah dibatasi 48.000 byte, lalu Pydantic memangkas whitespace dan memeriksa 12.000 karakter.

Pillow memeriksa decode, kecocokan MIME dengan JPEG/PNG/WebP aktual, gambar statis, dan maksimal 16 juta piksel. Gambar didecode penuh dalam thread pool, orientasi EXIF diterapkan, lalu disalin/encode ulang tanpa metadata EXIF/GPS/komentar. Batas 5 MiB juga berlaku setelah normalisasi. Nama file/ekstensi tidak dipakai untuk menentukan format atau lokasi penyimpanan. Isi teks pada gambar **tidak** disamarkan otomatis; pengguna tetap perlu menyamarkan data sebelum submit.

`GeminiProvider` memakai HTTPX dan REST resmi `generateContent`, satu panggilan untuk seluruh kasus, image inline Base64, system instruction terpisah, serta JSON Schema. Tidak ada upload ke Files API, tool pencarian, SDK tambahan, retry otomatis, atau panggilan model kedua. Model dikonfigurasi melalui `GEMINI_MODEL`; default yang diperiksa pada dokumentasi resmi saat implementasi ialah `gemini-3.5-flash-lite`. Pemakaian model/kuota akun masih harus diuji dengan key nyata.

Schema ekstraksi hanya berisi `is_job_related`, `sufficient_content`, `image_text`, serta daftar `code/state/evidence`. Boolean harus bertipe boolean dan field tambahan ditolak. Skor, bobot, kutipan hukum, rekomendasi, dan putusan keamanan tidak diterima dari model. Pydantic memvalidasi hasil sebelum digunakan; respons terpotong, terblokir, terlalu besar, atau salah schema menghasilkan error 502.

## Grounding dan skor

Grounding menormalisasi Unicode NFKC, case, dan whitespace untuk mencari kutipan literal. Kutipan minimal dua kata dan delapan karakter. Sumber `text` harus cocok dengan teks yang dikirim; sumber `image` memerlukan gambar dan kutipan yang cocok dengan transkripsi model. Evidence yang tidak didukung dihapus; klaim detected tanpa bukti valid diturunkan menjadi uncertain. Guard tambahan menolak beberapa pola negasi eksplisit pada biaya/kredensial, termasuk kutipan yang memotong kata "tidak" atau "jangan". Guard ini bukan pemahaman semantik lengkap.

Pembacaan piksel dan transkripsi gambar berasal dari **model yang sama**, bukan pemeriksaan OCR independen. Grounding gambar hanya membuktikan konsistensi terhadap hasil pembacaan tersebut, bukan kebenaran transkripsi piksel. Keterbatasan ini ditampilkan di `unknowns` dan harus dipertimbangkan ketika mengevaluasi hasil.

Scoring `rules-v1`: pembayaran 40, kredensial 40, data sensitif dini 20, tekanan waktu 15, tawaran tidak wajar 10, kanal meragukan dengan bukti pendukung 10. Setiap kode terdeteksi dan berbukti dihitung sekali, meskipun muncul pada kedua sumber. Python mengabaikan bobot pada object masukan scorer dan selalu memakai tabel aturan. Urutan kontribusi stabil. `raw_score` maksimum 135; `final_score=min(100, raw_score)`. Low 0â€“24, medium 25â€“49, high 50â€“100. Ini hipotesis heuristik internal, belum dikalibrasi atau dievaluasi sebagai akurasi/probabilitas.

Materi memerlukan minimal 40 karakter dan enam token kata pada teks/transkripsi gabungan serta konfirmasi model bahwa konteks rekrutmen cukup. Teks sangat pendek tanpa gambar dihentikan sebelum request AI dan mendapat `insufficient_data`. Ini validasi kecukupan deterministik, bukan inferensi offline. Materi tak relevan/tidak terbaca mendapat skor null, level insufficient_data, dan breakdown null tanpa kontribusi. Tidak ada indikator berbukti pada materi cukup menghasilkan 0 dengan disclaimer bahwa lowongan belum terverifikasi.

Ringkasan, penjelasan indikator, unknowns, dan rekomendasi disusun di server dari status yang sudah digrounding; pesan bebas model tidak dipakai sebagai rekomendasi/putusan. UI menampilkan nilai dari respons backend, tanpa membuat skor tiruan.

## Retrieval referensi

Retriever lokal mencocokkan kode indikator detected dengan `data/knowledge/sources.json`. Hanya entri bertanda verified, metadata lengkap, domain resmi HTTPS, tanggal verifikasi tidak di masa depan, dan belum melewati `review_after` yang boleh dikembalikan. Regulasi harus memiliki pasal/bagian, dan semua entri harus menjelaskan batas/pengecualian. File hilang/rusak atau tanpa kecocokan menghasilkan `legal_status=not_available`, `legal_context=[]`; skor tetap berjalan.

Saat implementasi, dua entri aktif: panduan Kemnaker tentang biaya/penyamaran perekrut, serta konteks terbatas Permenaker 18/2024 Pasal 11 dengan pengecualiannya. UU 13/2003 beserta perubahan, UU 27/2022, dan Perpres 57/2023 masih pending dan **tidak** diretrieval. Catatan sumber: [README KB](../../../data/knowledge/README.md). Retrieval tidak memengaruhi angka skor dan tidak membuktikan pelanggaran hukum.

## Reliabilitas dan privasi

Timeout total provider default 45 detik, dapat diatur 1â€“120 detik; connect timeout 5 detik, maksimal empat koneksi HTTP, tanpa retry tersembunyi. Output provider dibatasi 256 KiB. Header `x-goog-api-key` hanya di backend; key tidak dimasukkan ke URL. Error auth, model, kuota, jaringan, timeout, dan invalid response dipetakan ke kategori aman.

Teks/gambar, transkripsi, prompt, dan respons provider tidak dicatat ke disk/log aplikasi. Data hidup di memori selama request; respons klien memuat kutipan yang relevan sesuai brief. Tidak ada database, penyimpanan pengguna, atau browser localStorage. Pemrosesan/retensi provider eksternal mengikuti kebijakannya, bukan dikendalikan backend ini. Logging hanya metadata yang dibolehkan [development rules](../../engineering/DEVELOPMENT_RULES.md).

Belum ada rate limiting lintas pengguna, autentikasi, evaluasi model nyata, OCR independen, atau deployment produksi. Peninjauan API key/kuota/model, evaluasi kasus normal/berisiko/ambigu, hardening deployment, dan kurasi referensi lanjutan merupakan tindak lanjut. [Test plan](TEST_PLAN.md) membedakan bukti mocked dari live.

