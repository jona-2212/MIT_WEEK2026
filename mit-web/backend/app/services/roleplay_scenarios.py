"""Skenario fiktif, tetap, dan berversi; tidak menerima instruksi dari pengguna."""

from dataclasses import dataclass

from app.schemas.roleplay_chat import ScenarioSummary


@dataclass(frozen=True)
class Scenario:
    summary: ScenarioSummary
    opening: str
    stages: tuple[str, str, str]
    hints: tuple[str, str, str]


SCENARIOS_ID = {
    "uniform_deposit": Scenario(
        summary=ScenarioSummary(
            id="uniform_deposit",
            title="Deposit seragam sebelum wawancara",
            description="Pelamar admin diminta deposit untuk mengamankan jadwal wawancara.",
            objective="Latih cara menolak biaya sebagai syarat dan memverifikasi mandiri.",
        ),
        opening="Halo, saya Rina dari PT Latihan Jeli, perusahaan fiktif. Kamu masuk tahap "
        "wawancara admin. Untuk reservasi jadwal, ada deposit seragam Rp250.000. "
        "Bisa konfirmasi hari ini?",
        stages=(
            "Jelaskan tawaran admin fiktif dan syarat deposit seragam Rp250.000.",
            "Tanggapi pertanyaan pelamar. Perekrut menghindari verifikasi mandiri dan "
            "menekankan reservasi jadwal. Jangan menambah syarat atau nominal baru.",
            "Tekankan bahwa jadwal mungkin dialihkan. Tanyakan apakah pelamar ingin "
            "menunda untuk verifikasi. Jangan mengancam atau mengulang desakan terus.",
        ),
        hints=(
            "Perhatikan apakah kamu diminta membayar agar proses seleksi bisa dilanjutkan.",
            "Meminta email belum sama dengan memverifikasi. Cari kanal resmi secara mandiri.",
            "Kamu berhak menunda atau berhenti saat ditekan mengambil keputusan.",
        ),
    ),
    "task_deposit": Scenario(
        summary=ScenarioSummary(
            id="task_deposit",
            title="Komisi tugas dan deposit VIP",
            description="Tugas like/subscribe berubah menjadi permintaan deposit.",
            objective="Kenali pola membayar untuk memperoleh komisi dan tetapkan batas.",
        ),
        opening="Halo, saya Jessica dari Tim Latihan Jeli, tim fiktif. Ada tugas "
        "like dan subscribe video dengan klaim komisi Rp150.000. Mau tanya detail tugasnya?",
        stages=(
            "Tawarkan tugas like/subscribe dengan klaim komisi Rp150.000. Semua fiktif.",
            "Klaim komisi awal tersedia. Munculkan syarat deposit Rp500.000 untuk "
            "membuka tugas VIP atau menarik komisi. Jangan mengklaim transaksi nyata.",
            "Tanggapi keberatan terhadap deposit. Tanyakan keputusan melanjutkan atau "
            "berhenti. Jangan menambah nominal atau modus baru.",
        ),
        hints=(
            "Tanyakan bagaimana penghasilan diperoleh dan apakah ada syarat mengeluarkan uang.",
            "Saldo yang ditampilkan atau diklaim belum membuktikan uang bisa diterima.",
            "Perhatikan syarat membayar deposit agar bisa memperoleh komisi.",
        ),
    ),
}

SCENARIOS_EN = {
    "uniform_deposit": Scenario(
        summary=ScenarioSummary(
            id="uniform_deposit",
            title="Uniform deposit before the interview",
            description="An admin candidate is asked to pay a deposit to reserve an interview.",
            objective="Practise declining a recruitment fee and verifying the offer yourself.",
            language="EN",
        ),
        opening="Hi, I'm Rina from Jeli Practice Ltd., a fictional company. You've reached "
        "the admin interview stage. A Rp250,000 uniform deposit is required to reserve "
        "your interview slot. Can you confirm today?",
        stages=(
            "Explain the fictional admin offer and the Rp250,000 uniform deposit.",
            "Answer the applicant's question. The recruiter avoids independent verification "
            "and stresses the reservation. Add no new conditions or amounts.",
            "Say the slot could be reassigned. Ask if the applicant wants time to verify. "
            "Avoid threats and repeated pressure.",
        ),
        hints=(
            "Notice whether payment is required to move to the next recruitment stage.",
            "Asking for an email address is only a first step. Find an official channel yourself.",
            "You can take time to verify or walk away if you feel pressured.",
        ),
    ),
    "task_deposit": Scenario(
        summary=ScenarioSummary(
            id="task_deposit",
            title="Task commissions and a VIP deposit",
            description="A job liking and subscribing to videos turns into a deposit request.",
            objective="Spot a pay-to-earn scheme and practise setting a clear boundary.",
            language="EN",
        ),
        opening="Hi, I'm Jessica from the fictional Jeli Practice Team. We're offering "
        "Rp150,000 for liking and subscribing to videos. Would you like to ask about the tasks?",
        stages=(
            "Offer the fictional video tasks with a claimed Rp150,000 commission.",
            "Claim the commission is available, then mention a Rp500,000 deposit to unlock "
            "VIP tasks or withdraw it. Do not claim real transactions.",
            "Respond to concerns about the deposit. Ask whether to continue or stop. "
            "Add no new amounts or schemes.",
        ),
        hints=(
            "Ask how you earn the commission and whether you would have to pay anything.",
            "A claimed balance is no proof that you can withdraw the money.",
            "Notice the demand to pay a deposit before you can earn the commission.",
        ),
    ),
}

SCENARIOS = {"ID": SCENARIOS_ID, "EN": SCENARIOS_EN}
