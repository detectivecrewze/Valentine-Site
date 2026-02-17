/**
 * Valentine Design Studio - Music Editor Module
 * Handles managing the romantic soundtrack, presets, and lyrics.
 * Language: Bahasa Indonesia (User Friendly)
 */
window.Editor = window.Editor || {};
window.Editor.MusicEditor = {
    _activePlaylist: [],
    _editingIndex: -1,
    _currentTab: 'playlist', // 'playlist' or 'library'

    resolveMediaPath(path) {
        if (!path || typeof path !== 'string') return path;

        // 🚀 DROPBOX AUTO-FIXER: Convert share links to direct stream links
        if (path.includes('dropbox.com')) {
            return path.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                .replace(/\?dl=[01]$/, '')
                .replace(/&dl=[01]$/, '');
        }

        if (path.startsWith('http') || path.startsWith('data:')) return path;
        if (path.startsWith('assets/')) return '../' + path;
        return path;
    },

    presets: [
        {
            songTitle: "Always With Me",
            artist: "Spirited Away",
            audioSrc: "https://www.dropbox.com/scl/fi/3uzwqdycyb6952lq3gui6/Always-With-Me-Spirited-Away.mp3?rlkey=anrzxikooe5b3zntghe6wtihk&st=urapanyk&dl=0",
            coverSrc: "assets/music/Always With Me - Spirited Away.jpg",
            lyrics: "Itsumo nando demo yume wo egakou..."
        },
        {
            songTitle: "Who Knows",
            artist: "Daniel Caesar",
            audioSrc: "https://www.dropbox.com/scl/fi/nqpvliyw9r780t3wk4636/Daniel-Caesar-Who-Knows.mp3?rlkey=vnfwwhsmuwdyt2lrgwuhjyf9u&st=5n9y60l9&dl=0",
            coverSrc: "assets/music/Daniel Caesar - Who Knows.jpg",
            lyrics: "Who knows where the wind blows..."
        },
        {
            songTitle: "Can't Help Falling in Love",
            artist: "Elvis Presley",
            audioSrc: "https://www.dropbox.com/scl/fi/qvpmw73ob28mrhb4mq81e/Elvis-Prasley-Can-t-Help-Falling-In-Love-with-You.mp3?rlkey=jycw1l6ktfrcelvlnjlqm2mpm&st=bit2i8p3&dl=0",
            coverSrc: "assets/music/Elvis Presley - Can't Help Falling In Love With You.jpg",
            lyrics: "Wise men say only fools rush in\nBut I can't help falling in love with you"
        },
        {
            songTitle: "Ivy",
            artist: "Frank Ocean",
            audioSrc: "https://www.dropbox.com/scl/fi/dpigzk2rhhvr4lfsxti47/Frank-Ocean-Ivy.mp3?rlkey=9opgczft19mbg6weviwg12wdz&st=qzr1pf93&dl=0",
            coverSrc: "assets/music/Frank Ocean - Ivy.jpg",
            lyrics: "I thought that I was dreaming when you said that you loved me"
        },
        {
            songTitle: "Sailor Song",
            artist: "Gigi Perez",
            audioSrc: "https://www.dropbox.com/scl/fi/cwucmfzv2pli58t3mg5im/Gigi-Perez-Sailor-Song.mp3?rlkey=y18ihrykfxt8b0pjc204xwnoc&st=5u41iz22&dl=0",
            coverSrc: "assets/music/Gigi Perez - Sailor Song.jpg",
            lyrics: "He said, 'I'm a sailor and I'm sailing on the sea'..."
        },
        {
            songTitle: "Everything U Are",
            artist: "Hindia",
            audioSrc: "https://www.dropbox.com/scl/fi/eta02fedtrjp04q1ax0u4/Hindia-everything-u-are.mp3?rlkey=jvuvoeud3tveq87bluqdgobd1&st=eo7n58q9&dl=0",
            coverSrc: "assets/music/Hindia - Everything u Are.jpg",
            lyrics: "You are the light in my darkest day..."
        },
        {
            songTitle: "High Hopes",
            artist: "Kodaline",
            audioSrc: "https://www.dropbox.com/scl/fi/6h4i5ezb00to62f1x54px/Kodaline-High-Hopes.mp3?rlkey=7m8dt1g8ynuensacwqjmbj2mr&st=p6n5xfqa&dl=0",
            coverSrc: "assets/music/Kodaline High Hopes.jpg",
            lyrics: "But I've got high hopes, it takes me back to when we started"
        },
        {
            songTitle: "My Love Mine All Mine",
            artist: "Mitski",
            audioSrc: "https://www.dropbox.com/scl/fi/71ib9m69dm2ed9squj191/Mitski-My-Love-Mine-All-Mine.mp3?rlkey=i43d8ng7tbndbuflm1yw3j3r9&st=5ziowz09&dl=0",
            coverSrc: "assets/music/Mitski - My Love Mine All Mine.jpg",
            lyrics: "Moon, tell me if my love is mine all mine..."
        }
    ],

    init() {
        console.log('[MusicEditor] Initializing...');
        const addBtn = document.getElementById('music-add-btn');
        const sidebarAddBtn = document.getElementById('sidebar-add-song');
        const saveBtn = document.getElementById('music-save-btn');

        if (addBtn) addBtn.onclick = () => this.open();
        if (sidebarAddBtn) sidebarAddBtn.onclick = () => this.open();
        if (saveBtn) saveBtn.onclick = () => this.saveToCloud();

        // Load initial state
        this.refreshPlaylistFromState();
    },

    refreshPlaylistFromState() {
        if (window.StudioState?.config?.music) {
            this._activePlaylist = JSON.parse(JSON.stringify(window.StudioState.config.music));
        }
        this.renderSidebarPlaylist();
    },

    open() {
        const modal = document.getElementById('musicPickerModal');
        const addBtn = document.getElementById('music-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            this.refreshPlaylistFromState();
            this.switchTab('playlist');
        }
    },

    close() {
        const modal = document.getElementById('musicPickerModal');
        const addBtn = document.getElementById('music-add-btn');
        if (modal) modal.classList.add('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    },

    switchTab(tab) {
        this._currentTab = tab;
        this._editingIndex = -1;
        this.renderSidebar();
        this.renderList();
        this.closeEditorPanel();
    },

    renderSidebar() {
        const sidebar = document.getElementById('modal-music-sidebar');
        if (!sidebar) return;

        const menuItems = [
            { id: 'playlist', icon: 'queue_music', label: 'Playlist Aktif' },
            { id: 'library', icon: 'library_music', label: 'Rekomendasi Romantis' }
        ];

        sidebar.innerHTML = menuItems.map(item => `
            <div class="px-5 py-3.5 mb-2 rounded-2xl cursor-pointer transition-all flex items-center gap-3 ${this._currentTab === item.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-200' : 'text-gray-500 hover:bg-rose-50 hover:text-rose-600'}"
                 onclick="window.Editor.MusicEditor.switchTab('${item.id}')">
                <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
                <span class="text-sm font-bold">${item.label}</span>
            </div>
        `).join('');
    },

    renderList() {
        const container = document.getElementById('modal-music-active-list');
        const header = document.getElementById('modal-music-list-header');
        if (!container || !header) return;

        let items = this._currentTab === 'playlist' ? this._activePlaylist : this.presets;
        let title = this._currentTab === 'playlist' ? "Playlist Lagu Kamu" : "Lagu Pilihan Editor";
        let showAdd = this._currentTab === 'playlist';

        header.innerHTML = `
            <div class="flex items-center justify-between w-full mb-6">
                <div>
                    <h4 class="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">${title}</h4>
                    <p class="text-[11px] text-gray-400 italic">${items.length} lagu tersedia</p>
                </div>
                ${showAdd ? `
                    <button onclick="window.Editor.MusicEditor.addNewCustomSong()" 
                            class="bg-rose-500 text-white px-5 py-2 rounded-full text-[11px] font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-100 flex items-center gap-2 active:scale-95">
                        <span class="material-symbols-outlined text-[16px]">add</span> Tambah Lagu Baru
                    </button>
                ` : ''}
            </div>
        `;

        if (items.length === 0) {
            container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-20 text-center">
                    <div class="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-gray-200 text-4xl">music_note</span>
                    </div>
                    <p class="text-gray-400 text-sm font-medium">Belum ada lagu di sini.<br>Pilih dari perpustakaan atau tambah sendiri!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map((item, idx) => `
            <div class="bg-white border-2 ${this._editingIndex === idx ? 'border-rose-400 ring-4 ring-rose-50' : 'border-gray-50'} rounded-2xl p-4 cursor-pointer hover:border-rose-200 transition-all shadow-sm group relative overflow-hidden">
                <div class="flex items-center gap-4 relative z-10">
                    <div class="w-14 h-14 rounded-xl overflow-hidden shadow-md flex-shrink-0" onclick="window.Editor.MusicEditor.openEdit(${idx})">
                        <img src="${this.resolveMediaPath(item.coverSrc) || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + idx}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0" onclick="window.Editor.MusicEditor.openEdit(${idx})">
                        <div class="text-[14px] font-bold text-gray-900 truncate">${item.songTitle}</div>
                        <div class="text-[11px] font-bold text-rose-500 uppercase tracking-tight mt-0.5">${item.artist}</div>
                    </div>
                    
                    <div class="flex items-center gap-1">
                        ${this._currentTab === 'library' ? `
                            <button onclick="window.Editor.MusicEditor.addFromLibrary(${idx})" 
                                    class="w-9 h-9 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all shadow-sm active:scale-90">
                                <span class="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        ` : `
                            <button onclick="window.Editor.MusicEditor.removeSong(${idx})" 
                                    class="w-9 h-9 rounded-full bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all active:scale-90">
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `).join('');
    },

    openEdit(index) {
        if (this._currentTab === 'library') {
            // If clicking library item, maybe just add it? 
            // Better: User-friendly - click library item to see details then add
            this._editingIndex = index;
            this.renderLibraryDetail(index);
            return;
        }

        this._editingIndex = index;
        const song = this._activePlaylist[index];
        const container = document.getElementById('music-editor-form');
        const emptyState = document.getElementById('music-editor-empty');
        const editorPanel = document.getElementById('music-editor-panel');

        if (!container || !emptyState || !editorPanel) return;

        emptyState.classList.add('hidden');
        editorPanel.classList.remove('hidden');

        container.innerHTML = `
            <div class="space-y-6 pb-10">
                <!-- Cover Image -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Gambar Cover Album</label>
                    <div class="flex items-center gap-6">
                        <div class="relative group cursor-pointer w-28 h-28 flex-shrink-0" onclick="window.Editor.MusicEditor.triggerImageUpload()">
                            <img id="edit-music-cover-preview" src="${this.resolveMediaPath(song.coverSrc) || 'https://api.dicebear.com/7.x/shapes/svg?seed=new-song'}" 
                                 class="w-full h-full object-cover rounded-2xl border-2 border-gray-50 group-hover:border-rose-200 transition-all shadow-md">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                                <span class="material-symbols-outlined text-white">photo_camera</span>
                            </div>
                        </div>
                        <div class="flex-1">
                            <p class="text-[11px] text-gray-500 leading-relaxed mb-3">Gunakan foto favoritmu atau cover asli lagu ini. Klik gambar untuk upload.</p>
                            <input type="text" id="edit-music-cover-url" value="${song.coverSrc || ''}" 
                                   class="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-[11px] font-mono outline-none focus:border-rose-200"
                                   placeholder="Atau tempel link gambar di sini...">
                        </div>
                    </div>
                </div>

                <!-- Song Info -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Informasi Lagu</label>
                    <div class="space-y-4">
                        <div>
                            <input type="text" id="edit-music-title" value="${song.songTitle || ''}" 
                                   class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-[15px] font-bold outline-none focus:border-rose-200 focus:bg-white transition-all"
                                   placeholder="Judul Lagu">
                        </div>
                        <div>
                            <input type="text" id="edit-music-artist" value="${song.artist || ''}" 
                                   class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold text-rose-400 outline-none focus:border-rose-200 focus:bg-white transition-all uppercase tracking-tight"
                                   placeholder="Nama Artis">
                        </div>
                    </div>
                </div>

                <!-- Audio URL -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Link Audio (MP3/External)</label>
                    <input type="text" id="edit-music-audio-url" value="${song.audioSrc || ''}" 
                           class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-[12px] font-mono outline-none focus:border-rose-200 focus:bg-white transition-all"
                           placeholder="https://...mp3">
                    <p class="text-[10px] text-gray-400 mt-3 px-1 italic">Link ini harus bisa diputar langsung di browser (Dropbox/CloudLink).</p>
                </div>

                <!-- Lyrics -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4">Lirik Lagu (Ketik Pesan Cintamu)</label>
                    <textarea id="edit-music-lyrics" rows="6"
                              class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-medium leading-relaxed outline-none focus:border-rose-200 focus:bg-white transition-all resize-none shadow-inner"
                              placeholder="Tulis lirik di sini atau pesan khusus untuknya saat lagu ini diputar...">${song.lyrics || ''}</textarea>
                    <p class="text-[10px] text-gray-400 mt-3 px-1 italic">Lirik akan muncul di player saat customer mendengarkan.</p>
                </div>
            </div>
        `;
        this.renderList();
    },

    renderLibraryDetail(index) {
        const song = this.presets[index];
        const container = document.getElementById('music-editor-form');
        const emptyState = document.getElementById('music-editor-empty');
        const editorPanel = document.getElementById('music-editor-panel');

        if (!container || !emptyState || !editorPanel) return;

        emptyState.classList.add('hidden');
        editorPanel.classList.remove('hidden');

        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 animate-fadeIn">
                <div class="w-48 h-48 rounded-[2.5rem] overflow-hidden shadow-2xl ring-8 ring-rose-50">
                    <img src="${this.resolveMediaPath(song.coverSrc)}" class="w-full h-full object-cover">
                </div>
                <div>
                    <h3 class="text-2xl font-black text-gray-900 mb-1">${song.songTitle}</h3>
                    <p class="text-rose-500 font-bold uppercase tracking-widest text-sm">${song.artist}</p>
                </div>
                <div class="bg-gray-50 p-6 rounded-3xl text-sm text-gray-500 leading-relaxed italic max-w-xs">
                    "${song.lyrics || 'Lagu romantis pilihan untuk menemani perjalanan kalian.'}"
                </div>
                <button onclick="window.Editor.MusicEditor.addFromLibrary(${index})" 
                        class="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-rose-100 hover:bg-rose-600 transition-all active:scale-95">
                    <span class="material-symbols-outlined">add_circle</span>
                    Tambahkan ke Playlist Saya
                </button>
            </div>
        `;
        this.renderList();
    },

    addNewCustomSong() {
        const newSong = {
            songTitle: "Lagu Baru",
            artist: "Nama Artis",
            audioSrc: "",
            coverSrc: "https://api.dicebear.com/7.x/shapes/svg?seed=" + Date.now(),
            lyrics: ""
        };
        this._activePlaylist.unshift(newSong);
        this._editingIndex = 0;
        this.renderList();
        this.openEdit(0);
        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Lagu baru ditambahkan! Silakan lengkapi datanya.');
    },

    removeSong(index) {
        if (confirm('Hapus lagu ini dari playlist?')) {
            this._activePlaylist.splice(index, 1);
            if (this._editingIndex === index) {
                this.closeEditorPanel();
            } else if (this._editingIndex > index) {
                this._editingIndex--;
            }
            this.renderList();
        }
    },

    addFromLibrary(index) {
        const song = JSON.parse(JSON.stringify(this.presets[index]));
        // Avoid duplicates in active playlist
        if (this._activePlaylist.some(s => s.audioSrc === song.audioSrc)) {
            if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Lagu ini sudah ada di playlistmu!', 'info');
            return;
        }

        this._activePlaylist.unshift(song);
        this.switchTab('playlist');
        this.openEdit(0);
        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Lagu berhasil ditambahkan dari Library! ❤️');
    },

    confirmEdit() {
        if (this._editingIndex === -1) return;

        const song = this._activePlaylist[this._editingIndex];
        song.songTitle = document.getElementById('edit-music-title').value;
        song.artist = document.getElementById('edit-music-artist').value;
        song.audioSrc = document.getElementById('edit-music-audio-url').value;
        song.coverSrc = document.getElementById('edit-music-cover-url').value;
        song.lyrics = document.getElementById('edit-music-lyrics').value;

        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Perubahan lagu disimpan! 🎵');

        this.renderList();
        this.syncToState();
    },

    closeEditorPanel() {
        this._editingIndex = -1;
        const emptyState = document.getElementById('music-editor-empty');
        const editorPanel = document.getElementById('music-editor-panel');
        if (emptyState && editorPanel) {
            emptyState.classList.remove('hidden');
            editorPanel.classList.add('hidden');
        }
    },

    triggerImageUpload() {
        const fileInput = document.getElementById('studio-file-input');
        if (!fileInput) return;

        const originalOnChange = fileInput.onchange;

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Mengupload cover...', 'info');

            try {
                const formData = new FormData();
                formData.append('file', file);

                const apiUrl = window.StudioState ? window.StudioState.API_BASE_URL : '';
                const res = await fetch(`${apiUrl}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Upload gagal');
                const result = await res.json();
                const publicUrl = result.url;

                // 🛠️ FIX: Add to global sidebar gallery
                if (window.Editor?.addToMediaGallery) {
                    window.Editor.addToMediaGallery(publicUrl);
                }

                const previewImg = document.getElementById('edit-music-cover-preview');
                const urlInput = document.getElementById('edit-music-cover-url');
                if (previewImg) previewImg.src = publicUrl;
                if (urlInput) urlInput.value = publicUrl;

                if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Cover album diganti! ✨');
            } catch (err) {
                console.error('[MusicEditor] Upload error:', err);
                alert('Upload gagal: ' + err.message);
            } finally {
                fileInput.onchange = originalOnChange;
                fileInput.value = '';
            }
        };

        fileInput.click();
    },

    syncToState() {
        if (window.StudioState) {
            window.StudioState.config.music = JSON.parse(JSON.stringify(this._activePlaylist));
            window.StudioState.sync();
            this.renderSidebarPlaylist();
        }
    },

    renderSidebarPlaylist() {
        const musicList = document.getElementById('sidebar-music-list');
        if (!musicList) return;

        const songs = this._activePlaylist || [];
        musicList.innerHTML = songs.map((s, idx) => `
            <div class="flex items-center gap-4 p-3 bg-white rounded-2xl border border-gray-100 hover:border-rose-400 hover:shadow-lg transition-all group cursor-pointer" 
                 onclick="window.Editor.MusicEditor.open(); window.Editor.MusicEditor.openEdit(${idx})">
                <div class="relative w-12 h-12 flex-shrink-0">
                    <img src="${this.resolveMediaPath(s.coverSrc) || 'https://api.dicebear.com/7.x/shapes/svg?seed=' + idx}" class="w-full h-full rounded-xl object-cover">
                </div>
                <div class="flex-1 min-w-0">
                    <div class="text-[13px] font-bold text-gray-900 truncate">${s.songTitle}</div>
                    <div class="text-[11px] font-bold text-rose-500 uppercase tracking-tight">${s.artist}</div>
                </div>
            </div>
        `).join('');

        if (songs.length === 0) {
            musicList.innerHTML = `
                <div class="py-12 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center text-gray-300">
                    <span class="material-symbols-outlined text-3xl mb-2">music_off</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest">No songs added</p>
                </div>
            `;
        }
    },

    saveToCloud() {
        this.syncToState();
        if (window.StudioState && window.StudioState.currentId) {
            window.StudioState.saveToCloud(window.StudioState.currentId);
            if (typeof EditorUX !== 'undefined') {
                EditorUX.showNotification('Soundtrack berhasil di-update ke Cloud! 🚀');
            }
            document.getElementById('musicPickerModal').classList.add('hidden');
        }
    }
};
