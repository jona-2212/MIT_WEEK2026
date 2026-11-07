# ADR-0004 â€” Penilaian kontekstual oleh Gemini

Disetujui melalui permintaan owner pada 7 November 2026. Memperbarui keputusan kategori pada [ADR-0003](ADR-0003-qualitative-static-rag.md).

## Konteks

Pemotongan teks pendek dan hitungan indikator di Python membuat kasus bermakna seperti permintaan OTP singkat atau satu tanda risiko kontekstual berakhir sebagai `insufficient_data`.

## Keputusan

- Setiap input yang lolos validasi multipart dikirim dalam satu panggilan generatif. Prompt `recognition-v2.1` meminta Gemini menilai konteks, memilih kategori, serta menulis ringkasan dan rekomendasi.
- FastAPI memvalidasi skema respons dan kutipan indikator. Kutipan yang gagal diperiksa dikeluarkan dari bukti dan ditandai pada ringkasan.
- Rujukan hukum berasal dari pencarian atas bundle resmi yang telah diverifikasi. Kontrak publik tetap `recognition-v2`.

## Konsekuensi

Teks pendek yang valid memakai kuota generatif. Kategori bisa bervariasi sesuai pembacaan konteks oleh model. Penilaian model bersifat indikatif dan kutipan yang ditampilkan bisa diperiksa terhadap materi.

