# Data pengembangan

Tujuan: menetapkan kebijakan data untuk fixture, evaluasi, skenario, dan knowledge base. Folder `examples/` berisi tiga contoh teks serta satu PNG fiktif untuk smoke test Recognition; `knowledge/` berisi metadata terkurasi. Konteks kebutuhan: [Product Blueprint](<../01_Product_Blueprint_Job_Scam_Guardian_MIT_WEEK_2026 (1).md>).

Gunakan skenario fiktif atau contoh publik yang disanitasi. Jangan memasukkan KTP, nomor rekening, kredensial, OTP, kontak pribadi, screenshot/audio mentah, atau input pengguna yang nyata. Jangan menyimpan input mentah secara default. Fixture unit test yang kecil tetap ditempatkan dekat tes bila diperlukan.

Setiap sumber harus mencantumkan judul, penerbit/nomor dokumen, pasal/ketentuan bila relevan, URL resmi, tanggal pemeriksaan, dan ringkasan konteks. Verifikasi keberlakuan sumber sebelum digunakan; jangan mengarang pasal atau menganggap semua biaya/permintaan identitas memiliki status hukum yang sama. [README KB](knowledge/README.md) menjelaskan dua sumber aktif beserta pengecualian serta tiga kandidat yang dikecualikan dari runtime.

Pisahkan data evaluasi dari contoh yang dipakai merancang prompt/aturan. Contoh fiktif saat ini bukan holdout benchmark dan tidak dapat menjadi dasar klaim akurasi. Tidak ada penyimpanan raw input pengguna dalam folder ini. Ikuti [development rules](../docs/engineering/DEVELOPMENT_RULES.md) serta [document router](../docs/engineering/DOCUMENT_ROUTER.md).
