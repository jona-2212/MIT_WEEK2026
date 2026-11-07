# System overview â€” Fitur 01 versi 0.3.0

Kebutuhan ada di [SRS v1.2](../features/SRS_Jeli_F01_Backend_AI_Standalone_v1.2.md). Penilaian risiko mengikuti [ADR-0004](../decisions/ADR-0004-contextual-gemini.md), dan RAG mengikuti [ADR-0003](../decisions/ADR-0003-qualitative-static-rag.md).

## Alur runtime

React atau demo HTML â†’ POST multipart â†’ validasi input â†’ penilaian terstruktur Gemini â†’ validasi skema dan kutipan oleh FastAPI.

Fraud dan legal adalah keluaran terpisah. Query hukum hanya memakai kutipan/observasi yang cocok dengan sumber. Jika ada korpus/topik aktif, satu query embedding kompatibel â†’ cosine top-k pada JSON read-only â†’ gating sumber, checksum, tanggal, halaman/pasal, cakupan dan pengecualian â†’ legal screening. Tidak ada generasi hukum bebas atau panggilan generatif kedua.

Indeks/embedding gagal: legal reference_unavailable tanpa sitasi, fraud tetap dilayani bila valid. Materi tidak cukup: tidak memaksa low. Screenshot memakai transkripsi model yang sama, belum OCR independen.

## Alur offline developer

PDF resmi + registry + manifest â†’ parser pypdf â†’ chunk halaman/batas pasal yang ditinjau â†’ embedding dokumen setelah izin kuota â†’ bundle JSON. Opsi tooling owner: simpan vektor yang sudah dibuat ke ChromaDB lokal lalu ekspor kembali sebagai JSON read-only. Chroma tidak membuat embedding default.

Bundle pilot resmi memuat Permenaker 18/2024 Pasal 11 halaman PDF 7. Verifier memeriksa integritas bundle dan registry. Fixture pengujian memiliki penanda `test_fixture` yang dibatasi ke mode tes.

## Batas modul

| Modul | Tanggung jawab |
|---|---|
| app/api/v1/analyze.py | HTTP multipart, OpenAPI, pemanggilan service |
| app/schemas/ | Input, ekstraksi, keluaran kualitatif dan artefak indeks |
| app/services/ai/gemini.py | REST generateContent, timeout, schema, error aman |
| app/services/ai/embeddings.py | Protocol embedding dan REST embedContent, normalisasi/dimensi |
| app/services/risk/grounding.py | Kutipan/negasi, deduplikasi, uncertainty |
| app/services/recognition.py | Orkestrasi fraud dan legal terpisah |
| app/services/knowledge/retrieval.py | Protocol retriever, registry/gating dan query grounded |
| app/services/knowledge/static_index.py | Verifier/loader JSON dan retrieval; tidak memiliki jalur write |
| app/services/knowledge/indexing.py | Tooling parser/chunker/build offline, tidak diimpor factory |
| app/services/knowledge/chroma_store.py | Tooling Chroma lokal offline, tidak diimpor factory |
| app/services/uploads.py | Pembatas body/part, MIME/decode, sanitasi metadata gambar |
| app/main.py | Factory/lifespan HTTPX, middleware, routes/demo |
| index.py | Factory yang sama untuk profil Vercel |
| tests/demo_server.py | Server berlabel MODE UJI MOCK, transport provider fixture |

## Lifecycle, keamanan, dan deployment

Startup memuat konfigurasi dan bundle read-only, tanpa request AI. Settings memisahkan path indeks/registry dan memvalidasi model/dimensi/ambang. HTTPX tidak mengikuti redirect, tidak memakai proxy environment, dan tidak melakukan retry tersembunyi. Provider generatif/embedding memiliki timeout dan batas response.

Upload tidak rollover ke disk. Teks/gambar/transkripsi tidak disimpan persisten. Logging stdout memakai allowlist metadata, request ID UUID, durasi dan error code, tanpa prompt/key/isi pengguna. Dokumen PDF dan retrieval merupakan data tidak tepercaya; tidak dieksekusi atau dipakai sebagai instruksi sistem. Demo menggunakan textContent dan memeriksa tautan referensi.

Runtime hanya memerlukan dependency produksi. Parser dan Chroma adalah dependency dev, PDF sumber/database lokal dikecualikan dari bundle Vercel. JSON, registry, prompt, dan demo harus disertakan. Perubahan sumber/registry/model memerlukan rebuild dan redeploy. Validasi upload Vercel menghitung seluruh multipart di bawah batas platform.

[Runbook](../engineering/LEGAL_INDEX_RUNBOOK.md) menjelaskan batas pilot RAG. [README proyek](../../../README.md) memuat pengaturan React dan deployment Vercel.

