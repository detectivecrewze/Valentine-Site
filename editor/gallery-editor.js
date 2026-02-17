/**
 * Valentine Design Studio - Gallery Editor Module
 * Handles managing the photo memories gallery.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.GalleryEditor = {
    presets: [
        { caption: "Makan Malam Romantis", secretNote: "Malam itu steaknya enak, tapi senyum kamu jauh lebih manis. ❤️" },
        { caption: "Jalan-jalan Sore", secretNote: "Cuma muter-muter komplek tapi kalau sama kamu rasanya kayak keliling dunia." },
        { caption: "Nonton Film Bareng", secretNote: "Filmnya horor, tapi aku gak takut karena ada kamu yang aku peluk." },
        { caption: "Kencan di Coffee Shop", secretNote: "Kopi pahit pun jadi manis kalau diminum sambil liatin kamu." },
        { caption: "First Trip Kita!", secretNote: "Capek di jalan gak kerasa karena kita nyanyi-nyanyi bareng sepanjang waktu." }
    ],

    _activeMemories: [],
    _editingIndex: -1,

    init() {
        console.log('[GalleryEditor] Initializing...');
        const addBtn = document.getElementById('gallery-add-btn');
        const customAddBtn = document.getElementById('gallery-add-custom-btn');
        const saveBtn = document.getElementById('gallery-save-btn');
        const confirmBtn = document.getElementById('gallery-update-confirm-btn');

        if (addBtn) addBtn.onclick = () => this.open();
        if (customAddBtn) customAddBtn.onclick = () => this.addNewMemory();
        if (saveBtn) saveBtn.onclick = () => this.save();
        if (confirmBtn) confirmBtn.onclick = () => this.confirmEdit();

        // Load initial state
        if (window.StudioState?.config?.gallery?.memories) {
            this._activeMemories = JSON.parse(JSON.stringify(window.StudioState.config.gallery.memories));
        }
    },

    open() {
        const modal = document.getElementById('galleryPickerModal');
        const addBtn = document.getElementById('gallery-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            // Reset state from config
            this._activeMemories = JSON.parse(JSON.stringify(window.StudioState.config.gallery.memories || []));
            this.closeEditorPanel();
            this.render();
        }
    },

    close() {
        const modal = document.getElementById('galleryPickerModal');
        const addBtn = document.getElementById('gallery-add-btn');
        if (modal) modal.classList.add('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    },

    render() {
        this.renderLibrary();
        this.renderActive();
    },

    /**
     * LEFT PANE: Caption Ideas
     */
    renderLibrary() {
        const container = document.getElementById('modal-gallery-library');
        if (!container) return;

        container.innerHTML = this.presets.map((p, idx) => `
            <div class="bg-white border-2 border-gray-50 p-4 rounded-2xl hover:border-amber-200 transition-all group cursor-pointer"
                 onclick="window.Editor.GalleryEditor.usePreset(${idx})">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-500 transition-colors">
                        <span class="material-symbols-outlined text-[20px]">short_text</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-bold text-gray-800 leading-tight truncate">${p.caption}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5 truncate">${p.secretNote}</div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * MIDDLE PANE: Active Memories List
     */
    renderActive() {
        const container = document.getElementById('modal-gallery-active-list');
        const countBadge = document.getElementById('modal-gallery-count');
        if (!container) return;

        countBadge.textContent = this._activeMemories.length;

        if (this._activeMemories.length === 0) {
            container.innerHTML = `
                <div class="text-center py-10">
                    <div class="text-4xl mb-3">📸</div>
                    <p class="text-gray-400 text-sm">Belum ada foto. Klik tombol di atas untuk menambah!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this._activeMemories.map((m, idx) => `
            <div class="bg-white border-2 ${this._editingIndex === idx ? 'border-amber-400 ring-4 ring-amber-50' : 'border-gray-100'} rounded-2xl p-4 cursor-pointer hover:border-amber-200 transition-all shadow-sm group">
                <div class="flex gap-4">
                    <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0" onclick="window.Editor.GalleryEditor.openEdit(${idx})">
                        <img src="${m.src}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0" onclick="window.Editor.GalleryEditor.openEdit(${idx})">
                        <div class="text-[13px] font-bold text-gray-900 truncate">${m.caption || 'Tanpa Judul'}</div>
                        <div class="text-[11px] text-gray-400 line-clamp-2 mt-1">${m.secretNote || 'Klik untuk tambah catatan rahasia...'}</div>
                    </div>
                    <button onclick="window.Editor.GalleryEditor.removeMemory(${idx})" 
                            class="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    },

    openEdit(index) {
        this._editingIndex = index;
        const memory = this._activeMemories[index];
        const container = document.getElementById('gallery-editor-form');
        const emptyState = document.getElementById('gallery-editor-empty');
        const editorPanel = document.getElementById('gallery-editor-panel');

        if (!container || !emptyState || !editorPanel) return;

        emptyState.classList.add('hidden');
        editorPanel.classList.remove('hidden');

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Image Upload -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <label class="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 ml-1">Foto Memori</label>
                    <div class="relative group cursor-pointer" onclick="window.Editor.GalleryEditor.triggerImageUpload()">
                        <img id="edit-gallery-preview" src="${memory.src}" class="w-full aspect-[4/3] object-cover rounded-2xl border-2 border-gray-50 group-hover:border-amber-200 transition-all">
                        <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                            <div class="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
                                <span class="material-symbols-outlined text-amber-500">photo_camera</span>
                            </div>
                        </div>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Klik foto untuk mengganti gambar</p>
                </div>

                <!-- Caption -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <label class="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 ml-1">Judul Momen (Caption)</label>
                    <input type="text" id="edit-gallery-caption" value="${memory.caption || ''}" 
                        class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-amber-200 focus:bg-white transition-all"
                        placeholder="Misal: Kencan Pertama Kita">
                </div>

                <!-- Secret Note -->
                <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                    <label class="block text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 ml-1">Catatan Rahasia (Pesan Hati)</label>
                    <textarea id="edit-gallery-note" rows="4"
                        class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-medium outline-none focus:border-amber-200 focus:bg-white transition-all resize-none"
                        placeholder="Tulis apa yang kamu rasakan saat momen ini terjadi...">${memory.secretNote || ''}</textarea>
                    <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Catatan ini akan muncul saat foto di-klik di HP.</p>
                </div>
            </div>
        `;

        this.renderActive();
    },

    addNewMemory() {
        const newMemory = {
            type: "image",
            src: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop",
            caption: "Momen Baru",
            secretNote: "Tuliskan cerita di balik foto ini...",
            tape: "washi-tape",
            rotation: "rotate-1"
        };
        this._activeMemories.unshift(newMemory);
        this._editingIndex = 0;
        this.render();
        this.openEdit(0);
        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Momen baru ditambahkan! Silakan edit.');
    },

    removeMemory(index) {
        if (confirm('Hapus foto memori ini?')) {
            this._activeMemories.splice(index, 1);
            if (this._editingIndex === index) {
                this.closeEditorPanel();
            } else if (this._editingIndex > index) {
                this._editingIndex--;
            }
            this.render();
        }
    },

    usePreset(index) {
        const preset = this.presets[index];
        if (this._editingIndex !== -1) {
            document.getElementById('edit-gallery-caption').value = preset.caption;
            document.getElementById('edit-gallery-note').value = preset.secretNote;
            if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Caption ide diterapkan!');
        } else {
            // Add as new instead
            const newMemory = {
                type: "image",
                src: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop",
                caption: preset.caption,
                secretNote: preset.secretNote,
                tape: "washi-tape",
                rotation: "rotate-1"
            };
            this._activeMemories.unshift(newMemory);
            this._editingIndex = 0;
            this.render();
            this.openEdit(0);
        }
    },

    confirmEdit() {
        if (this._editingIndex === -1) return;

        const memory = this._activeMemories[this._editingIndex];
        memory.caption = document.getElementById('edit-gallery-caption').value;
        memory.secretNote = document.getElementById('edit-gallery-note').value;
        const previewImg = document.getElementById('edit-gallery-preview');
        if (previewImg) memory.src = previewImg.src;

        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Perubahan memori disimpan! ✨');

        this.render();
        this.syncToPreview();
    },

    closeEditorPanel() {
        this._editingIndex = -1;
        const emptyState = document.getElementById('gallery-editor-empty');
        const editorPanel = document.getElementById('gallery-editor-panel');
        if (emptyState && editorPanel) {
            emptyState.classList.remove('hidden');
            editorPanel.classList.add('hidden');
        }
        this.renderActive();
    },

    triggerImageUpload() {
        const fileInput = document.getElementById('studio-file-input');
        if (!fileInput) return;

        const originalOnChange = fileInput.onchange;

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Mengupload foto...', 'info');

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

                const previewImg = document.getElementById('edit-gallery-preview');
                if (previewImg) previewImg.src = publicUrl;

                if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Foto berhasil diganti! ✨');
            } catch (err) {
                console.error('[GalleryEditor] Upload error:', err);
                alert('Upload gagal: ' + err.message);
            } finally {
                fileInput.onchange = originalOnChange;
                fileInput.value = '';
            }
        };

        fileInput.click();
    },

    syncToPreview() {
        if (window.StudioState) {
            window.StudioState.config.gallery.memories = [...this._activeMemories];
            window.StudioState.sync();
        }
    },

    save() {
        if (window.StudioState) {
            window.StudioState.config.gallery.memories = [...this._activeMemories];
            window.StudioState.save();
            window.StudioState.sync();

            if (window.StudioState.currentId) {
                window.StudioState.saveToCloud(window.StudioState.currentId);
            }

            if (typeof EditorUX !== 'undefined') {
                EditorUX.showNotification('Galeri sudah LIVE di HP! 🚀');
            }

            document.getElementById('galleryPickerModal').classList.add('hidden');
        }
    }
};
