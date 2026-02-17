/**
 * Valentine Design Studio - Wrapped Editor Module
 * Handles editing the "Our Vibe" (Wrapped) page data.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.WrappedEditor = {
    presets: [
        { name: "Pasangan Paling Gokil", vibe: "Bonnie & Clyde" },
        { name: "Pecinta Senja", vibe: "Sunset Lovers" },
        { name: "Pencari Kuliner", vibe: "Foodie Couple" },
        { name: "Kaum Rebahan Bahagia", vibe: "Home Buddies" },
        { name: "Partner In Crime", vibe: "Partner In Crime" }
    ],

    _editingSection: null, // 'vibe', 'places', 'memories'

    init() {
        console.log('[WrappedEditor] Initializing...');
        const addBtn = document.getElementById('wrapped-add-btn');
        const saveBtn = document.getElementById('wrapped-save-btn');
        const confirmBtn = document.getElementById('wrapped-update-confirm-btn');

        if (addBtn) {
            addBtn.onclick = () => {
                console.log('[WrappedEditor] Edit button clicked');
                this.open();
            };
        }
        if (saveBtn) saveBtn.onclick = () => this.save();
        if (confirmBtn) confirmBtn.onclick = () => this.confirmEdit();
    },

    open() {
        const modal = document.getElementById('wrappedPickerModal');
        const addBtn = document.getElementById('wrapped-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            this.closeEditorPanel();
            this.render();
        }
    },

    close() {
        const modal = document.getElementById('wrappedPickerModal');
        const addBtn = document.getElementById('wrapped-add-btn');
        if (modal) modal.classList.add('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    },

    render() {
        this.renderLibrary();
        this.renderActive();
    },

    /**
     * LEFT PANE: Vibe ideas
     */
    renderLibrary() {
        const container = document.getElementById('modal-wrapped-library');
        if (!container) return;

        container.innerHTML = this.presets.map((p, idx) => `
            <div class="bg-white border-2 border-gray-50 p-4 rounded-2xl hover:border-indigo-200 transition-all group cursor-pointer"
                 onclick="Editor.WrappedEditor.applyVibePreset('${p.vibe}')">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-500 transition-colors">
                        <span class="material-symbols-outlined text-[20px]">magic_button</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-bold text-gray-800 leading-tight">${p.name}</div>
                        <div class="text-[10px] text-gray-400 mt-0.5">${p.vibe}</div>
                    </div>
                </div>
            </div>
        `).join('');
    },

    /**
     * MIDDLE PANE: Main sections of Wrapped
     */
    renderActive() {
        const container = document.getElementById('modal-wrapped-active-list');
        if (!container) return;

        const config = window.StudioState?.config?.wrapped || {};

        container.innerHTML = `
            <!-- Vibe & Stats -->
            <div class="bg-white border-2 ${this._editingSection === 'vibe' ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-100'} rounded-2xl p-5 cursor-pointer hover:border-indigo-200 transition-all shadow-sm"
                 onclick="Editor.WrappedEditor.openEdit('vibe')">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span class="material-symbols-outlined">psychology</span>
                    </div>
                    <div>
                        <div class="text-[14px] font-bold text-gray-900">Foto, Vibe & Statistik</div>
                        <div class="text-[11px] text-gray-400">Atur foto utama, judul vibe, dan jumlah jam bersama</div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3 mt-4">
                    <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div class="text-[9px] font-black text-gray-400 uppercase mb-1">Vibe</div>
                        <div class="text-xs font-bold text-gray-700 truncate">${config.vibe || '-'}</div>
                    </div>
                    <div class="bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div class="text-[9px] font-black text-gray-400 uppercase mb-1">Jam</div>
                        <div class="text-xs font-bold text-gray-700 truncate">${config.HoursTogether || '-'}</div>
                    </div>
                </div>
            </div>

            <!-- Top Places -->
            <div class="bg-white border-2 ${this._editingSection === 'places' ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-100'} rounded-2xl p-5 cursor-pointer hover:border-indigo-200 transition-all shadow-sm"
                 onclick="Editor.WrappedEditor.openEdit('places')">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span class="material-symbols-outlined">explore</span>
                    </div>
                    <div>
                        <div class="text-[14px] font-bold text-gray-900">Tempat Terfavorit</div>
                        <div class="text-[11px] text-gray-400">Daftar 3 tempat paling berkesan</div>
                    </div>
                </div>
                <div class="space-y-2 mt-4">
                    ${(config.topPlaces || []).map((p, i) => `
                        <div class="text-xs font-medium text-gray-600 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-300"></span> ${p}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Core Memories -->
            <div class="bg-white border-2 ${this._editingSection === 'memories' ? 'border-indigo-400 ring-4 ring-indigo-50' : 'border-gray-100'} rounded-2xl p-5 cursor-pointer hover:border-indigo-200 transition-all shadow-sm"
                 onclick="Editor.WrappedEditor.openEdit('memories')">
                <div class="flex items-center gap-4 mb-3">
                    <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <span class="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <div>
                        <div class="text-[14px] font-bold text-gray-900">Momen Terindah</div>
                        <div class="text-[11px] text-gray-400">Daftar 3 memori terbaik kita</div>
                    </div>
                </div>
                <div class="space-y-2 mt-4">
                    ${(config.coreMemories || []).map((m, i) => `
                        <div class="text-xs font-medium text-gray-600 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 rounded-full bg-indigo-300"></span> ${m}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    },

    openEdit(section) {
        this._editingSection = section;
        const config = window.StudioState.config.wrapped;
        const container = document.getElementById('wrapped-editor-form');
        const emptyState = document.getElementById('wrapped-editor-empty');
        const editorPanel = document.getElementById('wrapped-editor-panel');

        if (!container || !emptyState || !editorPanel) return;

        emptyState.classList.add('hidden');
        editorPanel.classList.remove('hidden');

        let html = '';

        if (section === 'vibe') {
            html = `
                <div class="space-y-6">
                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 ml-1">Photo Utama</label>
                        <div class="relative group cursor-pointer" onclick="Editor.WrappedEditor.triggerImageUpload()">
                            <img id="edit-wrapped-preview" src="${config.imageSrc}" class="w-full aspect-video object-cover rounded-2xl border-2 border-gray-50 group-hover:border-indigo-200 transition-all">
                            <div class="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center rounded-2xl">
                                <div class="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
                                    <span class="material-symbols-outlined text-indigo-500">photo_camera</span>
                                </div>
                            </div>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Klik area foto untuk mengganti gambar</p>
                    </div>

                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 ml-1">Vibe Kita</label>
                        <input type="text" id="edit-wrapped-vibe" value="${config.vibe}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-indigo-200 focus:bg-white transition-all">
                        <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Contoh: Bonnie & Clyde, Kaum Rebahan, dll.</p>
                    </div>

                    <div class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                        <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 ml-1">Total Jam Bersama</label>
                        <input type="text" id="edit-wrapped-hours" value="${config.HoursTogether}" 
                            class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-indigo-200 focus:bg-white transition-all">
                        <p class="text-[10px] text-gray-400 mt-2 px-1 italic">Gunakan angka atau teks (misal: 12.000 atau Selamanya)</p>
                    </div>
                </div>
            `;
        } else if (section === 'places') {
            html = `
                <div class="space-y-4">
                    <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 ml-1">3 Tempat Terfavorit</label>
                    ${[0, 1, 2].map(i => `
                        <div class="bg-white p-4 rounded-2xl border-2 border-gray-50 hover:border-indigo-100 transition-all flex items-center gap-3">
                            <span class="text-indigo-400 font-bold text-sm">${i + 1}</span>
                            <input type="text" id="edit-wrapped-place-${i}" value="${config.topPlaces[i] || ''}" 
                                class="flex-1 bg-transparent border-none text-sm font-bold outline-none text-gray-700" placeholder="Nama tempat...">
                        </div>
                    `).join('')}
                </div>
            `;
        } else if (section === 'memories') {
            html = `
                <div class="space-y-4">
                    <label class="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 ml-1">3 Momen Terindah</label>
                    ${[0, 1, 2].map(i => `
                        <div class="bg-white p-4 rounded-2xl border-2 border-gray-50 hover:border-indigo-100 transition-all flex items-center gap-3">
                            <span class="text-indigo-400 font-bold text-sm">${i + 1}</span>
                            <input type="text" id="edit-wrapped-memory-${i}" value="${config.coreMemories[i] || ''}" 
                                class="flex-1 bg-transparent border-none text-sm font-bold outline-none text-gray-700" placeholder="Tulis momen singkat...">
                        </div>
                    `).join('')}
                </div>
            `;
        }

        container.innerHTML = html;
        this.renderActive();
    },

    applyVibePreset(vibe) {
        if (!window.StudioState.config.wrapped) return;
        window.StudioState.config.wrapped.vibe = vibe;

        if (this._editingSection === 'vibe') {
            const input = document.getElementById('edit-wrapped-vibe');
            if (input) input.value = vibe;
        }

        this.renderActive();
        if (typeof EditorUX !== 'undefined') EditorUX.showNotification(`Vibe diubah ke: ${vibe}`);
    },

    confirmEdit() {
        if (!this._editingSection) return;
        const config = window.StudioState.config.wrapped;

        if (this._editingSection === 'vibe') {
            config.vibe = document.getElementById('edit-wrapped-vibe').value;
            config.HoursTogether = document.getElementById('edit-wrapped-hours').value;
            // imageSrc is updated immediately in triggerImageUpload handle, but we ensure it's here too
            const previewImg = document.getElementById('edit-wrapped-preview');
            if (previewImg) config.imageSrc = previewImg.src;
        } else if (this._editingSection === 'places') {
            config.topPlaces = [
                document.getElementById('edit-wrapped-place-0').value,
                document.getElementById('edit-wrapped-place-1').value,
                document.getElementById('edit-wrapped-place-2').value
            ];
        } else if (this._editingSection === 'memories') {
            config.coreMemories = [
                document.getElementById('edit-wrapped-memory-0').value,
                document.getElementById('edit-wrapped-memory-1').value,
                document.getElementById('edit-wrapped-memory-2').value
            ];
        }

        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Berhasil diupdate! ✨');

        this.render();
        this.syncToPreview();
    },

    closeEditorPanel() {
        this._editingSection = null;
        const emptyState = document.getElementById('wrapped-editor-empty');
        const editorPanel = document.getElementById('wrapped-editor-panel');
        if (emptyState && editorPanel) {
            emptyState.classList.remove('hidden');
            editorPanel.classList.add('hidden');
        }
        this.renderActive();
    },

    syncToPreview() {
        window.StudioState.sync();
        // Wrapped page usually refreshes automatically on sync if it's observing StudioState
        // But we can trigger a manual refresh if needed.
        const frame = document.getElementById('preview-frame');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'QUIZ_REFRESH' }, '*'); // Re-using as general refresh
        }
    },

    save() {
        window.StudioState.sync();
        if (window.StudioState.currentId) {
            window.StudioState.saveToCloud(window.StudioState.currentId);
        }

        if (typeof EditorUX !== 'undefined') {
            EditorUX.showNotification('Wrapped sudah LIVE di HP! 🚀');
        }

        this.syncToPreview();
        document.getElementById('wrappedPickerModal').classList.add('hidden');
    },

    triggerImageUpload() {
        const fileInput = document.getElementById('studio-file-input');
        if (!fileInput) return;

        // Backup original onchange
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

                if (!res.ok) throw new Error('Upload failed');
                const result = await res.json();
                const publicUrl = result.url;

                // 🛠️ FIX: Add to global sidebar gallery
                if (window.Editor?.addToMediaGallery) {
                    window.Editor.addToMediaGallery(publicUrl);
                }

                // Update Preview in Modal
                const previewImg = document.getElementById('edit-wrapped-preview');
                if (previewImg) previewImg.src = publicUrl;

                // Update Config directly
                if (window.StudioState.config.wrapped) {
                    window.StudioState.config.wrapped.imageSrc = publicUrl;
                }

                if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Foto berhasil diupload! ✨');
            } catch (err) {
                console.error('[WrappedEditor] Upload error:', err);
                alert('Upload gagal: ' + err.message);
            } finally {
                // Restore original onchange
                fileInput.onchange = originalOnChange;
                fileInput.value = '';
            }
        };

        fileInput.click();
    }
};
