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
        theme_label_presets: "Quick Theme Presets",
        theme_label_bg_image: "Custom Background Image",
        theme_label_bg_color: "Fallback Background Color",
        theme_label_font_display: "Primary Font (Titles)",
        theme_label_font_sans: "Secondary Font (Body Text)",
        theme_label_particles: "Atmospheric Particle Effect",
        theme_placeholder_bg: "assets/bg.png or Leave empty",
        theme_label_language: "Admin Language",

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
        pageman_hint: "Drag and drop to reorder the pages in your story.",
        pageman_required: "Required",

        // Specific Pages
        page_greeting_title: "Greeting Card",
        page_greeting_desc: "Personalized welcome message for your Valentine",
        page_greeting_label_hero: "Card Hero Title",
        page_greeting_label_msg: "Personal Message",
        page_greeting_label_img: "Magazine Cover Image",
        page_greeting_label_sig: "Signature (Closing)",
        page_greeting_label_footer: "Footer Brand Tagline",

        page_music_title: "Our Playlist",
        page_music_desc: "Create your personal mixtape with songs and lyrics",
        page_music_tips: "Music Tips",
        page_music_tips_desc: "Turn this into your personal mixtape! Upload your own MP3 files and add a cover image to make it look like a real Spotify player.",
        page_music_label_section: "Section Label",
        page_music_label_song: "Song Title",
        page_music_label_artist: "Artist",
        page_music_label_audio: "Audio File (.mp3)",
        page_music_label_cover: "Cover Image",
        page_music_label_lyrics: "Lyrics (Optional)",
        page_music_btn_add: "Add Song",

        page_wrapped_title: "Our Vibe (Wrapped)",
        page_wrapped_desc: "Create a Spotify-style recap of your relationship",
        page_wrapped_label_year: "Year Recapped",
        page_wrapped_label_top_song: "Our Top Song",
        page_wrapped_label_song_desc: "Song Description",
        page_wrapped_label_minutes: "Minutes Together",
        page_wrapped_label_score: "Love Score",
        page_wrapped_label_vibe: "Our Vibe Type",
        page_wrapped_label_vibe_desc: "Short Vibe Bio",

        page_quiz_title: "Memory Quiz",
        page_quiz_desc: "Test how well your partner remembers your moments",
        page_quiz_label_title: "Quiz Page Title",
        page_quiz_label_finish: "Finish Message (on Correct)",
        page_quiz_btn_add: "Add Question",
        page_quiz_label_q: "Question Text",
        page_quiz_label_options: "Options",
        page_quiz_label_correct: "Correct Option Index (0-3)",

        page_gallery_title: "Photo Gallery",
        page_gallery_desc: "Display your favorite photos together",
        page_gallery_btn_add: "Add Photo",
        page_gallery_label_img: "Image File",
        page_gallery_label_caption: "Caption",

        page_map_title: "The Atlas of Us",
        page_map_header: "The Atlas of Us",
        page_map_desc: "Mark the geography of your love on an interactive map",
        page_map_label_title: "Map Title",
        page_map_label_desc: "Map Description",
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
        map_help_title: "Interactive Map Picker",
        map_help_desc: "You can choose locations in two ways: 1) Click the 'Pick' button and search for a place (e.g., 'Central Park'), or 2) Click directly on the interactive map to set your pin. If you have specific coordinates from Google Maps, you can also paste them directly into the Coordinates field!",

        page_letter_title: "Love Letter",
        page_letter_desc: "Write an intimate letter that fills up line by line",
        page_letter_label_title: "Letter Page Title",
        page_letter_label_content: "Letter Content",
        page_letter_label_footer: "Footer Note",
        page_letter_label_polaroid: "Polaroid Photo",
        page_letter_label_polaroid_cap: "Polaroid Caption",

        page_lock_title: "The Final Lock",
        page_lock_desc: "A fun way to unlock the final surprise",
        page_lock_label_title: "Lock Page Title",
        page_lock_label_hint: "Unlock Hint",
        page_lock_label_msg: "Locked Message",
        page_lock_label_success: "Success Message",

        page_infinity_title: "Infinity Scroll",
        page_infinity_desc: "A never-ending wall of love and images",
        page_infinity_label_title: "Infinity Page Title",
        page_infinity_label_msg: "The Message",
        page_infinity_btn_add: "Add Image",

        // Particle Options
        part_none: "None (Clean)",
        part_hearts: "Hearts & Petals (Romantic)",
        part_stars: "Twinkling Stars (Magic)",
        part_dust: "Vintage Dust (Nostalgic)",
        part_snow: "Soft Snow (Winter/Dreamy)"
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
        theme_label_presets: "Pilihan Tema Cepat (Presets)",
        theme_label_bg_image: "Gambar Latar Kustom",
        theme_label_bg_color: "Warna Latar (Cadangan)",
        theme_label_font_display: "Font Utama (Judul)",
        theme_label_font_sans: "Font Sekunder (Teks Isi)",
        theme_label_particles: "Efek Animasi Partikel",
        theme_placeholder_bg: "assets/bg.png atau biarkan kosong",
        theme_label_language: "Bahasa Admin",

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
        count_finish: "Pesan Selesai",
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
        pageman_hint: "Geser dan urutkan halaman sesuai keinginanmu.",
        pageman_required: "Wajib",

        // Specific Pages
        page_greeting_title: "Kartu Ucapan",
        page_greeting_desc: "Pesan selamat datang personal untuk pasanganmu",
        page_greeting_label_hero: "Judul Utama Kartu",
        page_greeting_label_msg: "Pesan Pribadi",
        page_greeting_label_img: "Gambar Sampul Majalah",
        page_greeting_label_sig: "Tanda Tangan (Penutup)",
        page_greeting_label_footer: "Tagline Brand (Bawah)",

        page_music_title: "Playlist Kita",
        page_music_desc: "Buat mixtape pribadi dengan lagu dan lirik",
        page_music_tips: "Tips Musik",
        page_music_tips_desc: "Jadikan ini mixtape pribadimu! Upload file MP3 dan tambahkan gambar cover agar terlihat seperti Spotify asli.",
        page_music_label_section: "Label Bagian",
        page_music_label_song: "Judul Lagu",
        page_music_label_artist: "Artis/Penyanyi",
        page_music_label_audio: "File Audio (.mp3)",
        page_music_label_cover: "Gambar Sampul",
        page_music_label_lyrics: "Lirik (Opsional)",
        page_music_btn_add: "Tambah Lagu",

        page_wrapped_title: "Our Vibe (Wrapped)",
        page_wrapped_desc: "Buat rangkuman hubungan ala Spotify Wrapped",
        page_wrapped_label_year: "Tahun Rangkuman",
        page_wrapped_label_top_song: "Lagu Teratas Kita",
        page_wrapped_label_song_desc: "Deskripsi Lagu",
        page_wrapped_label_minutes: "Menit Bersama",
        page_wrapped_label_score: "Skor Cinta",
        page_wrapped_label_vibe: "Tipe Vibe Kita",
        page_wrapped_label_vibe_desc: "Biodata Singkat Vibe",

        page_quiz_title: "Kuis Kenangan",
        page_quiz_desc: "Tes seberapa ingat pasanganmu tentang momen kalian",
        page_quiz_label_title: "Judul Halaman Kuis",
        page_quiz_label_finish: "Pesan Selesai (saat benar)",
        page_quiz_btn_add: "Tambah Pertanyaan",
        page_quiz_label_q: "Teks Pertanyaan",
        page_quiz_label_options: "Pilihan Jawaban",
        page_quiz_label_correct: "Indeks Jawaban Benar (0-3)",

        page_gallery_title: "Galeri Foto",
        page_gallery_desc: "Tampilkan foto-foto favorit kalian berdua",
        page_gallery_btn_add: "Tambah Foto",
        page_gallery_label_img: "File Gambar",
        page_gallery_label_caption: "Keterangan (Caption)",

        page_map_title: "The Atlas of Us",
        page_map_header: "The Atlas of Us",
        page_map_desc: "Tandai geografi cintamu di peta interaktif ini",
        page_map_label_title: "Judul Peta",
        page_map_label_desc: "Deskripsi Peta",
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
        map_help_title: "Pilih Lokasi Interaktif",
        map_help_desc: "Kamu bisa memilih lokasi dengan dua cara: 1) Klik tombol 'Pilih' lalu cari nama tempat (misal: 'Monas'), atau 2) Klik langsung pada peta interaktif untuk menentukan titik. Jika kamu punya koordinat dari Google Maps, kamu juga bisa langsung menempelkannya (paste) ke kolom Koordinat!",

        page_letter_title: "Surat Cinta",
        page_letter_desc: "Tulis surat intim yang muncul baris demi baris",
        page_letter_label_title: "Judul Halaman Surat",
        page_letter_label_content: "Isi Surat",
        page_letter_label_footer: "Catatan Kaki",
        page_letter_label_polaroid: "Foto Polaroid",
        page_letter_label_polaroid_cap: "Keterangan Foto (Caption)",

        page_lock_title: "Kunci Terakhir",
        page_lock_desc: "Cara seru untuk membuka kejutan terakhir",
        page_lock_label_title: "Judul Halaman Kunci",
        page_lock_label_hint: "Petunjuk Kunci",
        page_lock_label_msg: "Pesan Terkunci",
        page_lock_label_success: "Pesan Berhasil",

        page_infinity_title: "Infinity Scroll",
        page_infinity_desc: "Dinding cinta dan foto yang tak ada habisnya",
        page_infinity_label_title: "Judul Halaman Infinity",
        page_infinity_label_msg: "Pesan Cintamu",
        page_infinity_btn_add: "Tambah Gambar",

        // Particle Options
        part_none: "Tidak Ada (Bersih)",
        part_hearts: "Hati & Kelopak Bunga",
        part_stars: "Bintang Berkelap-kelip",
        part_dust: "Debu Vintage (Klasik)",
        part_snow: "Salju Lembut (Musim Dingin)"
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
