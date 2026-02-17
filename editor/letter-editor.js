/**
 * Valentine Design Studio - Love Letter Editor Module
 * Handles editing the romantic letter, signature, and polaroid photo.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.LetterEditor = {
    _activeConfig: null,
    _currentTab: 'content', // 'content', 'memories'

    init() {
        console.log('[LetterEditor] Initializing...');
        const addBtn = document.getElementById('letter-add-btn');
        const saveBtn = document.getElementById('letter-save-btn');
        const confirmBtn = document.getElementById('letter-update-confirm-btn');

        if (addBtn) {
            addBtn.onclick = () => {
                console.log('[LetterEditor] Add button clicked');
                this.open();
            };
        }
        if (saveBtn) saveBtn.onclick = () => this.save();
        if (confirmBtn) confirmBtn.onclick = () => this.confirmEdit();

        // Load initial state
        if (window.StudioState?.config?.letter) {
            this._activeConfig = JSON.parse(JSON.stringify(window.StudioState.config.letter));
        }
    },

    open() {
        const modal = document.getElementById('letterPickerModal');
        const addBtn = document.getElementById('letter-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            this._activeConfig = JSON.parse(JSON.stringify(window.StudioState.config.letter || {}));
            this.switchTab('content');
        }
    },

    close() {
        const modal = document.getElementById('letterPickerModal');
        const addBtn = document.getElementById('letter-add-btn');
        if (modal) modal.classList.add('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    },

    switchTab(tab) {
        this._currentTab = tab;
        this.renderSidebar();
        this.renderEditor();
    },

    renderSidebar() {
        const sidebar = document.getElementById('modal-letter-sidebar');
        if (!sidebar) return;

        const menuItems = [
            { id: 'content', icon: 'history_edu', label: 'Isi Surat' },
            { id: 'memories', icon: 'photo_camera', label: 'Kenangan & Polaroid' }
        ];

        sidebar.innerHTML = menuItems.map(item => `
            <div class="px-4 py-3 mb-1 rounded-xl cursor-pointer transition-all flex items-center gap-3 ${this._currentTab === item.id ? 'bg-rose-500 text-white shadow-lg shadow-rose-100' : 'text-gray-500 hover:bg-gray-100'}"
                 onclick="window.Editor.LetterEditor.switchTab('${item.id}')">
                <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
                <span class="text-sm font-bold">${item.label}</span>
            </div>
        `).join('');
    },

    renderEditor() {
        const container = document.getElementById('letter-editor-container');
        if (!container) return;

        let html = "";

        if (this._currentTab === 'content') {
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Nama Panggilan (Penerima)</label>
                        <input type="text" id="edit-letter-recipient" value="${this._activeConfig.recipient || ''}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-rose-200 focus:bg-white transition-all"
                            placeholder="Contoh: Sayangku, [Nama]...">
                    </div>
                    
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Isi Surat Romantis</label>
                        <textarea id="edit-letter-message" rows="12"
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-medium leading-relaxed outline-none focus:border-rose-200 focus:bg-white transition-all resize-none"
                            placeholder="Tuliskan semua perasaanmu di sini...">${this.stripHtml(this._activeConfig.message || '')}</textarea>
                        <p class="text-[10px] text-gray-400 mt-2 px-1">Teks akan otomatis diketik dengan efek mesin tik di halaman surat.</p>
                    </div>

                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Salam Penutup</label>
                        <input type="text" id="edit-letter-signature-prefix" value="${this._activeConfig.signature || ''}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-rose-200 focus:bg-white transition-all"
                            placeholder="Contoh: Tertanda, [Namamu]...">
                    </div>
                </div>
            `;
        } else if (this._currentTab === 'memories') {
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Foto Polaroid di Surat</label>
                        <div class="relative group cursor-pointer max-w-sm mx-auto" onclick="window.Editor.LetterEditor.triggerImageUpload('polaroid')">
                            <div class="bg-white p-3 pb-12 shadow-xl border border-gray-100 rounded-sm transform -rotate-2 group-hover:rotate-0 transition-transform duration-500">
                                <img id="edit-letter-polaroid-preview" src="${this._activeConfig.polaroidSrc || 'https://images.unsplash.com/photo-1518199266791-5375a83190b7'}" 
                                    class="w-full aspect-square object-cover grayscale-[0.2] contrast-[1.1]">
                                <div class="mt-4 text-center">
                                    <span class="font-dancing text-rose-900/60 text-lg">${this._activeConfig.polaroidCaption || 'Us ♡'}</span>
                                </div>
                            </div>
                            <div class="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <div class="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
                                    <span class="material-symbols-outlined text-rose-500">add_a_photo</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-6 text-center italic">Klik foto untuk mengganti gambar Polaroid.</p>
                    </div>

                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 ml-1">Tulisan di Polaroid</label>
                        <input type="text" id="edit-letter-polaroid-caption" value="${this._activeConfig.polaroidCaption || ''}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-sm font-bold outline-none focus:border-rose-200 focus:bg-white transition-all"
                            placeholder="Contoh: Our best day... ♡">
                    </div>
                </div>
            `;
        }

        container.innerHTML = html;
    },

    stripHtml(html) {
        let doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    },

    wrapHtml(text) {
        return text.split('\n').filter(p => p.trim() !== '').map(p => `<p>${p}</p>`).join('');
    },

    confirmEdit() {
        if (this._currentTab === 'content') {
            this._activeConfig.recipient = document.getElementById('edit-letter-recipient').value;
            this._activeConfig.message = this.wrapHtml(document.getElementById('edit-letter-message').value);
            this._activeConfig.signature = document.getElementById('edit-letter-signature-prefix').value;
        } else if (this._currentTab === 'memories') {
            this._activeConfig.polaroidCaption = document.getElementById('edit-letter-polaroid-caption').value;
            // Images are updated during upload
        }

        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Isi surat telah diperbarui! 💌');
        this.syncToPreview();
    },

    triggerImageUpload(type) {
        const fileInput = document.getElementById('studio-file-input');
        if (!fileInput) return;

        const originalOnChange = fileInput.onchange;

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Sedang mengunggah...', 'info');

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

                if (type === 'polaroid') {
                    this._activeConfig.polaroidSrc = publicUrl;
                    const preview = document.getElementById('edit-letter-polaroid-preview');
                    if (preview) preview.src = publicUrl;
                }

                if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Foto berhasil diubah! ✨');
            } catch (err) {
                console.error('[LetterEditor] Upload error:', err);
                alert('Gagal mengunggah foto: ' + err.message);
            } finally {
                fileInput.onchange = originalOnChange;
                fileInput.value = '';
            }
        };

        fileInput.click();
    },

    syncToPreview() {
        if (window.StudioState) {
            window.StudioState.config.letter = JSON.parse(JSON.stringify(this._activeConfig));
            window.StudioState.sync();
        }
    },

    save() {
        if (window.StudioState) {
            this.confirmEdit(); // Ensure current tab is saved
            window.StudioState.config.letter = JSON.parse(JSON.stringify(this._activeConfig));
            window.StudioState.save();
            window.StudioState.sync();

            if (window.StudioState.currentId) {
                window.StudioState.saveToCloud(window.StudioState.currentId);
            }

            if (typeof EditorUX !== 'undefined') {
                EditorUX.showNotification('Surat Cinta sudah LIVE! 💌🚀');
            }

            document.getElementById('letterPickerModal').classList.add('hidden');
        }
    }
};
