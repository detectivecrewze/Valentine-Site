/**
 * Valentine Design Studio - Infinity Scroll Editor Module
 * Handles managing the endless "I love you because..." content.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.InfinityEditor = {
    _activeConfig: null,
    _currentTab: 'header', // 'header', 'reasons-generic', 'reasons-personal', 'reasons-poetic', 'photos', 'videos'
    _editingIndex: -1,

    init() {
        console.log('[InfinityEditor] Initializing...');
        const addBtn = document.getElementById('infinity-add-btn');
        const saveBtn = document.getElementById('infinity-save-btn');
        const confirmBtn = document.getElementById('infinity-update-confirm-btn');

        if (addBtn) {
            addBtn.onclick = () => {
                console.log('[InfinityEditor] Add button clicked');
                this.open();
            };
        }
        if (saveBtn) saveBtn.onclick = () => this.save();
        if (confirmBtn) confirmBtn.onclick = () => this.confirmEdit();

        // Load initial state
        if (window.StudioState?.config?.infinityScroll) {
            this._activeConfig = JSON.parse(JSON.stringify(window.StudioState.config.infinityScroll));
            // Ensure structure
            if (!this._activeConfig.reasons) this._activeConfig.reasons = { generic: [], personal: [], poetic: [] };
            if (!this._activeConfig.photos) this._activeConfig.photos = [];
            if (!this._activeConfig.videoMemories) this._activeConfig.videoMemories = [];
        }
    },

    open() {
        const modal = document.getElementById('infinityPickerModal');
        const addBtn = document.getElementById('infinity-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            this._activeConfig = JSON.parse(JSON.stringify(window.StudioState.config.infinityScroll || {}));
            if (!this._activeConfig.reasons) this._activeConfig.reasons = { generic: [], personal: [], poetic: [] };
            if (!this._activeConfig.photos) this._activeConfig.photos = [];
            if (!this._activeConfig.videoMemories) this._activeConfig.videoMemories = [];

            this.switchTab('header');
        }
    },

    close() {
        const modal = document.getElementById('infinityPickerModal');
        const addBtn = document.getElementById('infinity-add-btn');
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
        const sidebar = document.getElementById('modal-infinity-sidebar');
        if (!sidebar) return;

        const menuItems = [
            { id: 'header', icon: 'titled', label: 'Judul & Tema' },
            { id: 'reasons-generic', icon: 'favorite', label: 'Alasan Umum' },
            { id: 'reasons-personal', icon: 'auto_awesome', label: 'Alasan Personal' },
            { id: 'reasons-poetic', icon: 'auto_fix_high', label: 'Alasan Puitis' },
            { id: 'photos', icon: 'photo_library', label: 'Foto Khusus' },
            { id: 'videos', icon: 'movie', label: 'Video Milestone' }
        ];

        sidebar.innerHTML = menuItems.map(item => `
            <div class="px-4 py-3 mb-1 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${this._currentTab === item.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'text-gray-500 hover:bg-gray-100'}"
                 onclick="window.Editor.InfinityEditor.switchTab('${item.id}')">
                <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
                <span class="text-sm font-bold">${item.label}</span>
            </div>
        `).join('');
    },

    renderList() {
        const container = document.getElementById('modal-infinity-active-list');
        const header = document.getElementById('modal-infinity-list-header');
        const countBadge = document.getElementById('modal-infinity-count');
        if (!container || !header) return;

        let items = [];
        let title = "";
        let showAdd = true;

        if (this._currentTab === 'header') {
            title = "Pengaturan Header";
            showAdd = false;
        } else if (this._currentTab.startsWith('reasons-')) {
            const type = this._currentTab.split('-')[1];
            items = this._activeConfig.reasons[type] || [];
            title = `Daftar Alasan (${this._currentTab.split('-')[1]})`;
        } else if (this._currentTab === 'photos') {
            items = this._activeConfig.photos || [];
            title = "Foto Khusus Halaman Ini";
        } else if (this._currentTab === 'videos') {
            items = this._activeConfig.videoMemories || [];
            title = "Video Milestone";
        }

        header.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <h4 class="text-[11px] font-bold text-gray-400 uppercase tracking-widest">${title}</h4>
                ${showAdd ? `
                    <button onclick="window.Editor.InfinityEditor.addNewItem()" 
                            class="bg-rose-500 text-white px-4 py-1.5 rounded-full text-[10px] font-bold hover:bg-rose-600 transition-all shadow-md shadow-rose-100 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">add</span> Tambah Baru
                    </button>
                ` : ''}
            </div>
        `;

        if (this._currentTab === 'header') {
            container.innerHTML = `
                <div class="p-4 bg-white border-2 border-rose-400 ring-4 ring-rose-50 rounded-2xl cursor-pointer" onclick="window.Editor.InfinityEditor.openEdit('header')">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                            <span class="material-symbols-outlined text-[24px]">settings</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-[14px] font-bold text-gray-900">${this._activeConfig.headerTitle || 'I love you because...'}</div>
                            <div class="text-[11px] text-gray-400 line-clamp-1">${this._activeConfig.headerSubtitle || 'An endless collection of reasons'}</div>
                        </div>
                    </div>
                </div>
            `;
            this.openEdit('header');
            return;
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20">
                    <div class="text-4xl mb-3">✨</div>
                    <p class="text-gray-400 text-sm">Belum ada item di sini.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map((item, idx) => {
            let label = "";
            let sublabel = "";
            let preview = "";

            if (this._currentTab.startsWith('reasons-')) {
                label = item;
                sublabel = "Teks Alasan";
                preview = `<div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-rose-300"><span class="material-symbols-outlined text-[20px]">favorite</span></div>`;
            } else if (this._currentTab === 'photos') {
                label = item.caption || "Foto Tanpa Judul";
                sublabel = "Foto Memori";
                preview = `<div class="w-10 h-10 rounded-lg overflow-hidden bg-gray-100"><img src="${item.src}" class="w-full h-full object-cover"></div>`;
            } else if (this._currentTab === 'videos') {
                label = item.caption || "Video Milestone";
                sublabel = `Muncul di Alasan #${item.milestone}`;
                preview = `<div class="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-indigo-300"><span class="material-symbols-outlined text-[20px]">movie</span></div>`;
            }

            return `
                <div class="bg-white border-2 ${this._editingIndex === idx ? 'border-rose-400 ring-4 ring-rose-50' : 'border-gray-100'} rounded-2xl p-4 cursor-pointer hover:border-rose-200 transition-all shadow-sm group">
                    <div class="flex items-center gap-4">
                        <div onclick="window.Editor.InfinityEditor.openEdit(${idx})">${preview}</div>
                        <div class="flex-1 min-w-0" onclick="window.Editor.InfinityEditor.openEdit(${idx})">
                            <div class="text-[13px] font-bold text-gray-900 truncate">${label}</div>
                            <div class="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wider">${sublabel}</div>
                        </div>
                        <button onclick="window.Editor.InfinityEditor.removeItem(${idx})" 
                                class="w-8 h-8 rounded-full bg-gray-50 text-gray-400 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-colors">
                            <span class="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    openEdit(index) {
        this._editingIndex = index;
        const container = document.getElementById('infinity-editor-form');
        const emptyState = document.getElementById('infinity-editor-empty');
        const editorPanel = document.getElementById('infinity-editor-panel');

        if (!container || !emptyState || !editorPanel) return;

        emptyState.classList.add('hidden');
        editorPanel.classList.remove('hidden');

        let html = "";

        if (this._currentTab === 'header') {
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Judul Utama Halaman</label>
                        <input type="text" id="edit-infinity-title" value="${this._activeConfig.headerTitle || 'I love you because...'}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-rose-200 focus:bg-white transition-all">
                    </div>
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Sub-judul (Ketik Miring)</label>
                        <input type="text" id="edit-infinity-subtitle" value="${this._activeConfig.headerSubtitle || 'An endless collection of reasons'}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-medium outline-none focus:border-rose-200 focus:bg-white transition-all italic">
                    </div>
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Pengaturan Muncul</label>
                        <div class="space-y-4">
                            <div>
                                <p class="text-[10px] text-gray-400 mb-1 ml-1 font-bold">Foto di-selipkan setiap berapa alasan?</p>
                                <input type="number" id="edit-infinity-photo-interval" value="${this._activeConfig.photoInterval || 7}" 
                                    class="w-full px-5 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl text-sm font-bold outline-none focus:border-rose-200 focus:bg-white transition-all">
                            </div>
                            <div>
                                <p class="text-[10px] text-gray-400 mb-1 ml-1 font-bold">Jumlah alasan sekali "load" (Scroll)</p>
                                <input type="number" id="edit-infinity-batch-size" value="${this._activeConfig.batchSize || 10}" 
                                    class="w-full px-5 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl text-sm font-bold outline-none focus:border-rose-200 focus:bg-white transition-all">
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (this._currentTab.startsWith('reasons-')) {
            const type = this._currentTab.split('-')[1];
            const text = this._activeConfig.reasons[type][index];
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Teks Alasan Utama</label>
                        <textarea id="edit-infinity-reason-text" rows="6"
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-rose-200 focus:bg-white transition-all resize-none"
                            placeholder="Tuliskan alasan kenapa kamu mencintainya...">${text || ''}</textarea>
                        <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Ingat: Halaman ini akan di-acak, jadi buatlah setiap alasan bermakna!</p>
                    </div>
                </div>
            `;
        } else if (this._currentTab === 'photos') {
            const photo = this._activeConfig.photos[index];
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Pratinjau Foto</label>
                        <div class="relative group cursor-pointer" onclick="window.Editor.InfinityEditor.triggerImageUpload()">
                            <img id="edit-infinity-photo-preview" src="${photo.src}" class="w-full aspect-square object-cover rounded-2xl border-2 border-gray-50 group-hover:border-rose-200 transition-all">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                                <div class="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
                                    <span class="material-symbols-outlined text-rose-500">photo_camera</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Klik foto untuk mengganti gambar.</p>
                    </div>
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Caption Foto (Opsional)</label>
                        <input type="text" id="edit-infinity-photo-caption" value="${photo.caption || ''}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold outline-none focus:border-rose-200 focus:bg-white transition-all"
                            placeholder="Momen berharga kita...">
                    </div>
                </div>
            `;
        } else if (this._currentTab === 'videos') {
            const video = this._activeConfig.videoMemories[index];
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Muncul di Alasan Ke-?</label>
                        <input type="number" id="edit-infinity-video-milestone" value="${video.milestone || 10}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-black text-rose-600 outline-none focus:border-rose-200 focus:bg-white transition-all text-center">
                        <p class="text-[10px] text-gray-400 mt-2 text-center italic">Video akan muncul saat customer scroll sampai alasan nomor ini.</p>
                    </div>
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">URL Video (MP4)</label>
                        <input type="text" id="edit-infinity-video-url" value="${video.url || ''}" 
                            class="w-full px-5 py-3 bg-gray-50 border-2 border-gray-50 rounded-xl text-xs font-medium font-mono outline-none focus:border-rose-200 focus:bg-white transition-all"
                            placeholder="https://...mp4">
                        <p class="text-[10px] text-gray-400 mt-2 px-1">Ganti URL dengan link video MP4 kamu.</p>
                    </div>
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Judul Video</label>
                        <input type="text" id="edit-infinity-video-caption" value="${video.caption || ''}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold outline-none focus:border-rose-200 focus:bg-white transition-all"
                            placeholder="Tonton ini ya sayang...">
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
        this.renderList();
    },

    addNewItem() {
        if (this._currentTab === 'header') return;

        if (this._currentTab.startsWith('reasons-')) {
            const type = this._currentTab.split('-')[1];
            this._activeConfig.reasons[type].unshift("Alasan baru...");
        } else if (this._currentTab === 'photos') {
            this._activeConfig.photos.unshift({
                src: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop",
                caption: "Momen Indah"
            });
        } else if (this._currentTab === 'videos') {
            const lastMilestone = this._activeConfig.videoMemories.length > 0
                ? Math.max(...this._activeConfig.videoMemories.map(v => v.milestone))
                : 0;
            this._activeConfig.videoMemories.unshift({
                milestone: lastMilestone + 10,
                url: "",
                caption: "Video Spesial"
            });
        }

        this.renderList();
        this.openEdit(0);
        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Item baru ditambahkan!');
    },

    removeItem(index) {
        if (confirm('Hapus item ini?')) {
            if (this._currentTab.startsWith('reasons-')) {
                const type = this._currentTab.split('-')[1];
                this._activeConfig.reasons[type].splice(index, 1);
            } else if (this._currentTab === 'photos') {
                this._activeConfig.photos.splice(index, 1);
            } else if (this._currentTab === 'videos') {
                this._activeConfig.videoMemories.splice(index, 1);
            }

            if (this._editingIndex === index) {
                this.closeEditorPanel();
            } else if (this._editingIndex > index) {
                this._editingIndex--;
            }
            this.renderList();
        }
    },

    confirmEdit() {
        if (this._editingIndex === -1 && this._currentTab !== 'header') return;

        if (this._currentTab === 'header') {
            this._activeConfig.headerTitle = document.getElementById('edit-infinity-title').value;
            this._activeConfig.headerSubtitle = document.getElementById('edit-infinity-subtitle').value;
            this._activeConfig.photoInterval = parseInt(document.getElementById('edit-infinity-photo-interval').value);
            this._activeConfig.batchSize = parseInt(document.getElementById('edit-infinity-batch-size').value);
        } else if (this._currentTab.startsWith('reasons-')) {
            const type = this._currentTab.split('-')[1];
            this._activeConfig.reasons[type][this._editingIndex] = document.getElementById('edit-infinity-reason-text').value;
        } else if (this._currentTab === 'photos') {
            const photo = this._activeConfig.photos[this._editingIndex];
            photo.caption = document.getElementById('edit-infinity-photo-caption').value;
            const previewImg = document.getElementById('edit-infinity-photo-preview');
            if (previewImg) photo.src = previewImg.src;
        } else if (this._currentTab === 'videos') {
            const video = this._activeConfig.videoMemories[this._editingIndex];
            video.milestone = parseInt(document.getElementById('edit-infinity-video-milestone').value);
            video.url = document.getElementById('edit-infinity-video-url').value;
            video.caption = document.getElementById('edit-infinity-video-caption').value;
        }

        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Perubahan disimpan! ✨');

        this.renderList();
        this.syncToPreview();
    },

    closeEditorPanel() {
        this._editingIndex = -1;
        const emptyState = document.getElementById('infinity-editor-empty');
        const editorPanel = document.getElementById('infinity-editor-panel');
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

                const previewImg = document.getElementById('edit-infinity-photo-preview');
                if (previewImg) previewImg.src = publicUrl;

                if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Foto berhasil diganti! ✨');
            } catch (err) {
                console.error('[InfinityEditor] Upload error:', err);
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
            window.StudioState.config.infinityScroll = JSON.parse(JSON.stringify(this._activeConfig));
            window.StudioState.sync();
        }
    },

    save() {
        if (window.StudioState) {
            window.StudioState.config.infinityScroll = JSON.parse(JSON.stringify(this._activeConfig));
            window.StudioState.save();
            window.StudioState.sync();

            if (window.StudioState.currentId) {
                window.StudioState.saveToCloud(window.StudioState.currentId);
            }

            if (typeof EditorUX !== 'undefined') {
                EditorUX.showNotification('Alasan Infinity sudah LIVE! 🚀');
            }

            document.getElementById('infinityPickerModal').classList.add('hidden');
        }
    }
};
