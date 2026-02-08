/**
 * Internationalization (i18n) Module
 * Stores all UI strings for multi-language support.
 */

const translations = {
    en: {
        // Navigation & General
        brand_name: "Valentine Admin",
        wizard_subtitle: "Step-by-Step Setup Wizard",
        btn_preview: "Preview",
        btn_back: "Back",
        btn_next: "Next",
        btn_save: "Save Progress",
        btn_finish: "Finish & Submit",
        btn_add_emoji: "Add Emoji",
        step_progress: "Step {current} of {total}",
        notif_saved: "Progress saved successfully!",
        notif_error: "Something went wrong.",
        status_autosaved: "Draft saved at",

        // Welcome Modal
        welcome_title: "Welcome, Lovebirds!",
        welcome_subtitle: "Follow the step-by-step wizard to create your personalized Valentine's experience.",
        welcome_step1_title: "Setup",
        welcome_step1_desc: "Choose your theme and personalize names.",
        welcome_step2_title: "Page Manager",
        welcome_step2_desc: "Toggle which pages to include in your story.",
        welcome_step3_title: "Customize",
        welcome_step3_desc: "Fill in content for each enabled page.",
        welcome_step4_title: "Preview & Submit",
        welcome_step4_desc: "Review your work and submit when ready!",
        welcome_btn: "Got it, let's start!",
        welcome_footer: "Progress is saved automatically",

        // Preview Modal
        preview_title: "Live Preview",

        // Theme Setup Page
        theme_header_title: "Theme & Configuration",
        theme_header_desc: "Choose your visual style and set basic information",
        theme_subtitle: "Subtitle / Tagline",
        theme_label_presets: "Quick Theme Presets",
        theme_label_bg_image: "Custom Background Image",
        theme_label_bg_color: "Fallback Background Color",
        theme_label_font_display: "Primary Font (Titles)",
        theme_label_font_sans: "Secondary Font (Body Text)",
        theme_label_particles: "Atmospheric Particle Effect",
        theme_placeholder_bg: "assets/bg.png or Leave empty",
        theme_label_language: "Admin Language",
        theme_label_recipient: "Customer Name",
        theme_label_sender: "Sender Name",

        // Identity Section (Setup)
        identity_header: "Identity & Metadata",
        identity_desc: "Set the names that appear throughout the site",
        identity_recipient: "Recipient's Name (Her/His Name)",
        identity_sender: "Sender's Name (Your Name)",
        identity_brand: "Brand/Site Name (e.g., Our Story)",
        identity_placeholder_name: "Enter name...",
        brand_protect: "Brand Protection",
        brand_note: "These brand elements are managed by the administrator and cannot be changed here.",

        // Login & Countdown
        login_header: "Login & Countdown Settings",
        login_help_title: "Gatekeeper Settings",
        login_help_desc: "Set a Secret Password so only your partner can enter! The Instruction Hint is the clue shown to help them guess it.",
        login_password: "Secret Password",
        login_subtitle: "Collection Subtitle",
        login_title: "Main Title",
        login_hint: "Instruction Hint",
        count_target: "Target Date (Count to...)",
        count_finish: "Finish Message",
        count_note: "Automatically converted to ISO format.",

        // Navigation Settings
        nav_settings: "Navigation Settings",
        nav_indicator: "Show Page Indicator",
        nav_indicator_desc: "Show '3/9' at the top center",
        nav_swipe: "Enable Swipe Navigation",
        nav_swipe_desc: "Swipe left/right to change pages",

        // Page Manager
        pageman_title: "Page Manager",
        pageman_desc: "Choose which chapters of your story you want to show",
        pageman_enabled: "Enabled",
        pageman_disabled: "Disabled",
        pageman_hint: "Enable or disable pages to customize your story flow.",
        pageman_required: "Required",
        pageman_presets: "Quick Page Presets",
        preset_heartfelt: "Heartfelt Journey",
        preset_heartfelt_desc: "Music, Wrapped, Gallery, Letter, Infinity",
        preset_storyteller: "The Full Storyteller",
        preset_storyteller_desc: "Enable all available chapters",
        preset_playful: "Interactive Fun",
        preset_playful_desc: "Quiz, Map, and Infinity Scroll",
        pageman_ending_tip: "✨ Tip: Choose one special ending: Love Lock, Infinity Scroll, or Valentine Invitation. We recommend Infinity Scroll or Valentine Invitation for the best emotional impact!",

        // Specific Pages
        // Specific Pages
        page_greeting_title: "Greeting Card",
        page_greeting_desc: "A warm, sweet welcome message for when they first arrive.",
        page_greeting_label_hero: "Headline Title",
        page_greeting_label_msg: "Opening Message (Tip: Keep it short & sweet for max aesthetic!)",
        page_greeting_label_img: "Cover Photo",
        page_greeting_label_sig: "Closing Signature",
        page_greeting_label_footer: "Footer Tagline",

        page_music_title: "Music Player",
        page_music_desc: "Create a personal mixtape with songs that tell your story.",
        page_music_tips: "Music Tips",
        page_music_tips_desc: "Make this your emotional mixtape! Upload your favorite songs, and use the Lyrics section to highlight lines that perfectly describe them or your relationship.",
        page_music_label_section: "Section Label",
        page_music_label_song: "Song Title",
        page_music_label_artist: "Artist",
        page_music_label_audio: "Audio File (.mp3)",
        page_music_label_cover: "Cover Image",
        page_music_label_lyrics: "Lyrics / Poetic Message (Tip: Pick lines that scream 'This is you!')",
        page_music_btn_add: "Add Song",

        page_wrapped_title: "Our Vibe (Wrapped)",
        page_wrapped_desc: "Create a Spotify-style recap of your relationship",
        page_wrapped_tips: "Customization Tip",
        page_wrapped_tips_desc: "Did you know? You can rename ALL the section titles (like 'Core Memories' or 'Top Places')! Just change the text in the input fields to match your unique style.",
        page_wrapped_label_year: "Year Recapped",
        page_wrapped_label_top_song: "Our Top Song",
        page_wrapped_label_song_desc: "Song Description",
        page_wrapped_label_minutes: "Minutes Together",
        page_wrapped_label_score: "Time / Hours (Estimate)",
        page_wrapped_label_vibe: "Our Vibe Type",
        page_wrapped_label_vibe_desc: "Short Vibe Bio",

        page_quiz_title: "Memory Quiz",
        page_quiz_desc: "Test how well your partner remembers your moments together.",
        page_quiz_tips: "Unlimited Questions!",
        page_quiz_tips_desc: "There's no limit to how many questions you can ask! We recommend **5-10 questions** to keep it fun without being overwhelming.",
        page_quiz_label_title: "Quiz Page Title",
        page_quiz_label_finish: "Success Message (When they win)",
        page_quiz_btn_add: "Add New Question",
        page_quiz_label_q: "Question",
        page_quiz_label_options: "Options",
        page_quiz_label_correct: "Correct Answer (Select the right one)",

        page_gallery_title: "Photo Gallery",
        page_gallery_desc: "Display your favorite photos together",
        page_gallery_tips: "Aesthetic Gallery Tips",
        page_gallery_tips_desc: "Feel free to add as many photos as you want! You can also include short videos (3-6s). For the best look, we recommend **9-12 photos**. If adding videos, stick to your **top 3 favorites**!",
        page_gallery_btn_add: "Add Photo",
        page_gallery_label_img: "Image File",
        page_gallery_label_caption: "Caption",
        page_gallery_label_secret_note: "Secret Message (Back Side)",
        page_gallery_label_date: "Memory Date (Optional)",
        page_gallery_label_title: "Gallery Page Title",

        page_map_title: "The Atlas of Us",
        page_map_header: "The Atlas of Us",
        page_map_desc: "Mark the geography of your love on an interactive map",
        map_label_title: "Main Map Title",
        map_label_desc: "Map Description / Quote",
        map_btn_add: "Add Location",
        map_label_icon: "Marker Icon",
        map_label_date: "Date",
        map_label_name: "Title",
        map_placeholder_name: "e.g., Where we first met",
        map_search_placeholder: "Search location (e.g. Grand Indonesia)...",
        map_btn_search: "Search",
        map_selected_loc: "Selected Location",
        map_btn_confirm: "Confirm Location",
        map_click_to_pick: "Click on map to pick...",
        map_pick_btn: "Pick",
        map_coordinates: "Coordinates (Lat, Lng)",
        map_coords_tip: "TIP: You can paste 'Lat, Lng' directly from Google Maps here",
        map_help_title: "How to Pin Your Memories 📍",
        map_help_desc: "Three magic ways to add a spot: 1) **Search & Pick** via the button, 2) **Click the Map** directly, or... 3) **✨ Magic Upload**: Just upload a photo! If it has location data (EXIF), we'll automatically fill in the place and date for you. How cool is that?",

        page_letter_title: "Love Letter",
        page_letter_desc: "Write an intimate letter that fills up line by line",
        page_letter_tips: "Writing Tips",
        page_letter_tips_desc: "Write from the heart. **Pro Tip:** Use the [Enter] key to create new lines. The text reveals itself line-by-line, creating a dramatic and emotional reading experience!",
        page_letter_label_title: "Letter Page Title",
        page_letter_label_content: "Letter Content",
        page_letter_label_footer: "Signature / Sender Name",
        page_letter_label_polaroid: "Polaroid Photo",
        page_letter_label_polaroid_cap: "Polaroid Caption",

        page_lock_title: "The Final Lock",
        page_lock_desc: "A fun way to unlock the final surprise",
        page_lock_label_title: "Lock Page Title",
        page_lock_label_hint: "Unlock Hint",
        page_lock_label_msg: "Locked Message",
        page_lock_label_success: "Success Message",

        page_infinity_title: "Infinity Scroll (Endless Memories)",
        page_infinity_desc: "A never-ending scroll of your shared moments",
        page_infinity_tips: "Auto-Magic & Extras",
        page_infinity_tips_desc: "All photos uploaded on previous pages will automatically appear here! But you can also add more photos/videos specifically for this page. Short videos (3-6s) work great too!",
        page_infinity_label_title: "Infinity Page Title",
        page_infinity_tips_music: "Emotional Soundtrack",
        page_infinity_tips_music_desc: "Set the mood! You can upload a special track here (piano recommended). If **left unchanged**, the default page music will play.",
        page_infinity_label_msg: "The Message",
        page_infinity_btn_add: "Add Image",
        page_infinity_btn_add_video: "Add Video Memory",
        page_infinity_video_label: "Video URL / GDrive Link",
        page_infinity_video_milestone: "Appears after Reason #",
        page_infinity_music_title: "Special Background Music",
        page_infinity_music_desc: "This song will automatically play when visiting the Infinity Scroll page, replacing the main site music.",
        page_infinity_label_generic: "Generic Reasons",
        page_infinity_label_personal: "Personal Memories",
        page_infinity_label_poetic: "Poetic Reasons",
        page_infinity_btn_fill: "Fill Presets",

        page_invitation_title: "Valentine Invitation",
        page_invitation_desc: "A playful 'Will you be my Valentine?' page with interactive buttons and a dancing bear!",
        page_invitation_label_question: "The Question",
        page_invitation_label_bear_default: "Dancing Bear GIF (Default)",
        page_invitation_label_bear_success: "Happy Bear GIF (After Yes)",
        page_invitation_label_success_msg: "Success Message",

        // Particle Options
        part_none: "None (Clean)",
        part_hearts: "Hearts & Petals (Romantic)",
        part_stars: "Twinkling Stars (Magic)",
        part_dust: "Vintage Dust (Nostalgic)",
        part_snow: "Soft Snow (Winter/Dreamy)",

        // Publish Step
        publish_title: "Make It Live! (Online)",
        publish_desc: "Click below to create your shareable link immediately.",
        publish_placeholder: "Enter a nice link name (e.g., ryan-sara)",
        publish_btn: "🚀 Activate & Get Link",
        publish_qr_scan: "Scan to Open on Mobile",
        publish_qr_save: "Save QR Image",

        // Confirmations
        confirm_delete: "Are you sure you want to delete this item? This action cannot be undone."
    },
    id: {
        // Navigation & General
        brand_name: "Admin Valentine",
        wizard_subtitle: "Panduan Pengaturan Bertahap",
        btn_preview: "Pratinjau",
        btn_back: "Kembali",
        btn_next: "Lanjut",
        btn_save: "Simpan Progres",
        btn_finish: "Selesai & Kirim",
        btn_add_emoji: "Tambah Emoji",
        step_progress: "Langkah {current} dari {total}",
        notif_saved: "Progres berhasil disimpan!",
        notif_error: "Terjadi kesalahan.",
        status_autosaved: "Draft disimpan pukul",

        // Welcome Modal
        welcome_title: "Halo, Lovebirds!",
        welcome_subtitle: "Ikuti panduan ini untuk membuat kejutan Valentine yang super personal.",
        welcome_step1_title: "Pengaturan Utama",
        welcome_step1_desc: "Pilih tema dan atur nama kalian berdua.",
        welcome_step2_title: "Kelola Halaman",
        welcome_step2_desc: "Pilih halaman mana saja yang ingin kamu tampilkan.",
        welcome_step3_title: "Isi Konten",
        welcome_step3_desc: "Isi cerita dan kenangan kalian di setiap halaman.",
        welcome_step4_title: "Cek & Kirim",
        welcome_step4_desc: "Lihat hasil akhirnya dan kirim ke pasanganmu!",
        welcome_btn: "Siap, ayo mulai!",
        welcome_footer: "Progres kamu tersimpan otomatis",

        // Preview Modal
        preview_title: "Pratinjau Langsung",

        // Theme Setup Page
        theme_header_title: "Tema & Konfigurasi",
        theme_header_desc: "Pilih gaya visual dan atur informasi dasar",
        theme_subtitle: "Sub-judul / Tagline",
        theme_label_presets: "Pilihan Tema Cepat (Presets)",
        theme_label_bg_image: "Gambar Latar Kustom",
        theme_label_bg_color: "Warna Latar (Cadangan)",
        theme_label_font_display: "Font Utama (Judul)",
        theme_label_font_sans: "Font Sekunder (Teks Isi)",
        theme_label_particles: "Efek Animasi Partikel",
        theme_placeholder_bg: "assets/bg.png atau biarkan kosong",
        theme_label_language: "Bahasa Admin",
        theme_label_recipient: "Nama Customer",
        theme_label_sender: "Nama Pengirim",

        // Identity Section (Setup)
        identity_header: "Identitas & Metadata",
        identity_desc: "Atur nama-nama yang akan muncul di seluruh situs",
        identity_recipient: "Nama Pasangan (Dia)",
        identity_sender: "Nama Kamu (Pengirim)",
        identity_brand: "Nama Brand/Situs (misal: Cerita Kita)",
        identity_placeholder_name: "Masukkan nama...",
        brand_protect: "Proteksi Brand",
        brand_note: "Elemen brand ini dikelola oleh admin utama dan tidak dapat diubah di sini.",

        // Login & Countdown
        login_header: "Pengaturan Login & Countdown",
        login_help_title: "Keamanan Gerbang",
        login_help_desc: "Atur Kata Sandi Rahasia agar hanya pasanganmu yang bisa masuk! Petunjuk adalah petunjuk yang muncul untuk membantu mereka menebak.",
        login_password: "Kata Sandi Rahasia",
        login_subtitle: "Sub-judul Koleksi",
        login_title: "Judul Utama",
        login_hint: "Petunjuk (Hint)",
        count_target: "Tanggal Target (Hitung Mundur)",
        count_finish: "Pesan ketika timer sudah selesai",
        count_note: "Otomatis diubah ke format ISO.",

        // Navigation Settings
        nav_settings: "Pengaturan Navigasi",
        nav_indicator: "Indikator Halaman",
        nav_indicator_desc: "Munculkan '3/9' di bagian atas tengah",
        nav_swipe: "Navigasi Geser (Swipe)",
        nav_swipe_desc: "Geser kiri/kanan untuk pindah halaman",

        // Page Manager
        pageman_title: "Kelola Halaman",
        pageman_desc: "Pilih bab cerita mana saja yang ingin kamu tampilkan",
        pageman_enabled: "Aktif",
        pageman_disabled: "Nonaktif",
        pageman_hint: "Aktifkan atau nonaktifkan halaman untuk mengatur alur ceritamu.",
        pageman_required: "Wajib",
        pageman_presets: "Pilihan Paket Halaman",
        preset_heartfelt: "Perjalanan Spesial",
        preset_heartfelt_desc: "Musik, Wrapped, Galeri, Surat, Infinity",
        preset_storyteller: "Cerita Lengkap",
        preset_storyteller_desc: "Aktifkan semua bab yang tersedia",
        preset_playful: "Seru & Interaktif",
        preset_playful_desc: "Kuis, Peta, dan Infinity Scroll",
        pageman_ending_tip: "✨ Tips: Pilih satu penutup spesial: Love Lock, Infinity Scroll, atau Undangan Valentine. Kami sangat menyarankan Infinity Scroll atau Undangan Valentine untuk kesan emosional terbaik!",

        // Specific Pages
        page_greeting_title: "Kartu Sapaan Awal",
        page_greeting_desc: "Kasih sambutan manis pas dia baru masuk ke web ini.",
        page_greeting_label_hero: "Judul Besar (Headline)",
        page_greeting_label_msg: "Pesan Pembuka (Tips: Singkat aja ya, biar aesthetic!)",
        page_greeting_label_img: "Foto Sampul Depan",
        page_greeting_label_sig: "Salam Penutup (Tanda Tangan)",
        page_greeting_label_footer: "Teks Kecil di Bawah (Footer)",

        page_music_title: "Musik Kita",
        page_music_desc: "Buat mixtape pribadi dengan lagu dan lirik",
        page_music_tips: "Tips Musik",
        page_music_tips_desc: "Jadikan ini mixtape perasaanmu! Upload lagu favorit kalian, dan gunakan fitur lirik untuk menyelipkan kata-kata manis atau bagian lagu yang sangat menggambarkan hubungan kalian.",
        page_music_label_section: "Label Bagian",
        page_music_label_song: "Judul Lagu",
        page_music_label_artist: "Artis/Penyanyi",
        page_music_label_audio: "File Audio (.mp3)",
        page_music_label_cover: "Gambar Sampul",
        page_music_label_lyrics: "Kutipan Lirik / Pesan Puitis (Tips: Pilih lirik yang paling 'Dia' banget!)",
        page_music_btn_add: "Tambah Lagu",

        page_wrapped_title: "Our Vibe (Wrapped)",
        page_wrapped_desc: "Buat rangkuman hubungan ala Spotify Wrapped",
        page_wrapped_tips: "Tips Edit Judul",
        page_wrapped_tips_desc: "Semua judul bagian (seperti 'Our Vibe', 'Core Memories', dll) bisa kamu ganti sesuka hati! Cukup ubah teks di kolom input judul agar sesuai dengan gaya bahasa kalian.",
        page_wrapped_label_year: "Tahun Rangkuman",
        page_wrapped_label_top_song: "Lagu Teratas Kita",
        page_wrapped_label_song_desc: "Deskripsi Lagu",
        page_wrapped_label_minutes: "Menit Bersama",
        page_wrapped_label_score: "Waktu / Jam (Estimasi)",
        page_wrapped_label_vibe: "Tipe Vibe Kita",
        page_wrapped_label_vibe_desc: "Biodata Singkat Vibe",

        page_quiz_title: "Kuis Kenangan (Penting!)",
        page_quiz_desc: "Tes seberapa ingat pasanganmu tentang momen kalian berdua.",
        page_quiz_tips: "Bikin Sebanyak Mungkin!",
        page_quiz_tips_desc: "Nggak ada batasan jumlah pertanyaan, lho! Kamu bebas bikin berapa aja. Tapi rekomendasi kami sih **5-10 pertanyaan** biar seru dan nggak terlalu panjang.",
        page_quiz_label_title: "Judul Halaman Kuis",
        page_quiz_label_finish: "Pesan Selesai (Saat dia berhasil jawab)",
        page_quiz_btn_add: "Tambah Pertanyaan Baru",
        page_quiz_label_q: "Pertanyaan",
        page_quiz_label_options: "Pilihan Jawaban (Pisahkan tiap jawaban di kolom baru)",
        page_quiz_label_correct: "Kunci Jawaban (Pilih mana yang benar)",

        page_gallery_title: "Galeri Foto",
        page_gallery_desc: "Tampilkan foto-foto favorit kalian berdua",
        page_gallery_tips: "Tips Galeri Aesthetic",
        page_gallery_tips_desc: "Kamu bebas masukin foto sebanyak apapun! Kamu juga bisa masukin video pendek (3-6 detik). Rekomendasi kami sih **9-12 foto** biar tampilannya pas. Kalau mau pake video, pilih **maksimal 3 video** terbaikmu ya!",
        page_gallery_btn_add: "Tambah Foto",
        page_gallery_label_img: "File Gambar",
        page_gallery_label_caption: "Keterangan (Caption)",
        page_gallery_label_secret_note: "Pesan Rahasia (Bagian Belakang)",
        page_gallery_label_date: "Tanggal Kenangan (Opsional)",
        page_gallery_label_title: "Judul Halaman Galeri",

        page_map_title: "The Atlas of Us",
        page_map_header: "The Atlas of Us",
        page_map_desc: "Tandai geografi cintamu di peta interaktif ini",
        map_label_title: "Judul Peta Utama",
        map_label_desc: "Deskripsi Singkat Peta (Tips: Kata-kata manis tentang perjalanan kalian)",
        map_btn_add: "Tambah Lokasi",
        map_label_icon: "Ikon Penanda",
        map_label_date: "Tanggal",
        map_label_name: "Judul",
        map_placeholder_name: "misal: Tempat pertama ketemu",
        map_search_placeholder: "Cari lokasi (misal: Monas)...",
        map_btn_search: "Cari",
        map_selected_loc: "Lokasi Terpilih",
        map_btn_confirm: "Konfirmasi Lokasi",
        map_click_to_pick: "Klik di peta untuk memilih...",
        map_pick_btn: "Pilih",
        map_coordinates: "Koordinat (Lat, Lng)",
        map_coords_tip: "TIP: Kamu bisa tempel 'Lat, Lng' langsung dari Google Maps di sini",
        map_help_title: "Cara Menandai Kenangan 📍",
        map_help_desc: "Ada 3 cara ajaib buat nambahin lokasi: 1) **Cari & Pilih** lewat tombol, 2) **Klik Peta** langsung di titiknya, atau... 3) **✨ Upload Ajaib**: Cukup upload foto kenangan kalian! Kalau fotonya ada data lokasi (GPS), sistem bakal otomatis ngisi lokasi dan tanggalnya buat kamu. Keren kan?",

        page_letter_title: "Surat Cinta",
        page_letter_desc: "Tulis surat intim yang muncul baris demi baris",
        page_letter_tips: "Cara Bikin Surat",
        page_letter_tips_desc: "Tulis pesan sesuka hatimu di sini! **Tips:** Gunakan tombol [Enter] untuk memisahkan baris paragraf.",
        page_letter_label_title: "Judul Halaman Surat",
        page_letter_label_content: "Isi Surat",
        page_letter_label_footer: "Tanda Tangan / Nama Pengirim",
        page_letter_label_polaroid: "Foto Polaroid",
        page_letter_label_polaroid_cap: "Keterangan Foto (Caption)",

        page_lock_title: "Kunci Terakhir",
        page_lock_desc: "Cara seru untuk membuka kejutan terakhir",
        page_lock_label_title: "Judul Halaman Kunci",
        page_lock_label_hint: "Petunjuk Kunci",
        page_lock_label_msg: "Pesan Terkunci",
        page_lock_label_success: "Pesan Berhasil",

        page_infinity_title: "Infinity Scroll (Kenangan Tak Terbatas)",
        page_infinity_desc: "Halaman scroll tanpa akhir dengan kenangan kalian",
        page_infinity_tips: "Sihir Otomatis & Tambahan",
        page_infinity_tips_desc: "Semua foto yang sudah kamu upload di halaman-halaman sebelumnya bakal otomatis muncul di sini! Tapi kalau mau nambah lagi khusus buat halaman ini juga boleh banget. Video pendek (3-6 detik) juga bisa lho!",
        page_infinity_label_title: "Judul Halaman Infinity",
        page_infinity_tips_music: "Musik Pengiring Emosional",
        page_infinity_tips_music_desc: "Atur suasana dengan musik! Kamu bisa upload lagu spesial di sini (disarankan instrumen piano). Jika **dibiarkan (tidak diganti)**, lagu default pages ini yang akan diputar.",
        page_infinity_label_msg: "Pesan Cintamu",
        page_infinity_btn_add: "Tambah Gambar",
        page_infinity_btn_add_video: "Tambah Video Memori",
        page_infinity_video_label: "URL Video / Link GDrive",
        page_infinity_video_milestone: "Muncul setelah Alasan #",
        page_infinity_music_title: "Musik Latar Spesial",
        page_infinity_music_desc: "Lagu ini akan diputar secara otomatis saat mengunjungi halaman Infinity Scroll, menggantikan musik utama.",
        page_infinity_label_generic: "Alasan Umum",
        page_infinity_label_personal: "Kenangan Pribadi",
        page_infinity_label_poetic: "Kalimat Puitis",
        page_infinity_btn_fill: "Isi Otomatis",

        page_invitation_title: "Undangan Valentine",
        page_invitation_desc: "Halaman 'Maukah kamu jadi Valentine-ku?' yang seru dengan tombol interaktif dan beruang menari!",
        page_invitation_label_question: "Pertanyaan",
        page_invitation_label_bear_default: "GIF Beruang Menari (Default)",
        page_invitation_label_bear_success: "GIF Beruang Senang (Setelah Yes)",
        page_invitation_label_success_msg: "Pesan Sukses",

        // Particle Options
        part_none: "Tidak Ada (Bersih)",
        part_hearts: "Hati & Kelopak Bunga",
        part_stars: "Bintang Berkelap-kelip",
        part_dust: "Debu Vintage (Klasik)",
        part_snow: "Salju Lembut (Musim Dingin)",

        // Publish Step
        publish_title: "Buat Website Kamu Online!",
        publish_desc: "Klik tombol di bawah agar website kalian aktif dan bisa dibuka oleh siapa saja.",
        publish_placeholder: "Tulis nama panggilan kalian (contoh: ryan-sara)",
        publish_btn: "🚀 Aktifkan & Salin Link",
        publish_qr_scan: "Scan untuk Buka di HP",
        publish_qr_save: "Simpan Gambar QR",

        // Confirmations
        confirm_delete: "Apakah Anda yakin ingin menghapus item ini? Tindakan ini tidak dapat dibatalkan."
    }
};

/**
 * Translation Helper
 * @param {string} key - The key in translations dictionary
 * @param {object} params - Dynamic parameters (e.g. {current: 1})
 * @returns {string} - Translated text
 */
function t(key, params = {}) {
    // Get current language from state or default to English
    const lang = (window.state && state.configData && state.configData.adminLang) || 'en';

    let text = translations[lang][key] || translations['en'][key] || key;

    // Replace parameters
    Object.keys(params).forEach(p => {
        text = text.replace(`{${p}}`, params[p]);
    });

    return text;
}

window.translations = translations;
window.t = t;
