/**
 * Valentine Design Studio - Invitation Editor Module
 * Handles editing the Valentine invitation question and success message.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.InvitationEditor = {
    _activeConfig: null,

    init() {
        console.log('[InvitationEditor] Initializing...');
        const addBtn = document.getElementById('invitation-add-btn');
        const saveBtn = document.getElementById('invitation-save-btn');

        if (addBtn) {
            addBtn.onclick = () => {
                console.log('[InvitationEditor] Add button clicked');
                this.open();
            };
        }
        if (saveBtn) saveBtn.onclick = () => this.save();

        // Load initial state
        if (window.StudioState?.config?.invitation) {
            this._activeConfig = JSON.parse(JSON.stringify(window.StudioState.config.invitation));
        }
    },

    open() {
        const modal = document.getElementById('invitationPickerModal');
        const addBtn = document.getElementById('invitation-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            this._activeConfig = JSON.parse(JSON.stringify(window.StudioState.config.invitation || {}));
            this.renderEditor();
        }
    },

    close() {
        const modal = document.getElementById('invitationPickerModal');
        const addBtn = document.getElementById('invitation-add-btn');
        if (modal) modal.classList.add('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    },

    renderEditor() {
        const container = document.getElementById('invitation-editor-container');
        if (!container) return;

        container.innerHTML = `
            <div class="space-y-6">
                <!-- Question Section -->
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
                            <span class="material-symbols-outlined text-xl">help</span>
                        </div>
                        <label class="text-[11px] font-black text-rose-500 uppercase tracking-widest">Pertanyaan Undangan</label>
                    </div>
                    <input type="text" id="edit-invitation-question" value="${this._activeConfig.question || ''}" 
                        oninput="window.Editor.InvitationEditor.syncToPreview()"
                        class="w-full px-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-2xl text-lg font-bold outline-none focus:border-rose-200 focus:bg-white transition-all shadow-inner"
                        placeholder="Contoh: Would you like to be my Valentine?">
                    <p class="text-[9px] text-gray-400 mt-2 px-1 italic">Teks ini akan muncul sebagai judul utama di halaman undangan.</p>
                </div>

                <!-- Success Message Section -->
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center text-green-500">
                            <span class="material-symbols-outlined text-xl">celebration</span>
                        </div>
                        <label class="text-[11px] font-black text-rose-500 uppercase tracking-widest">Pesan Saat 'YES' Diklik</label>
                    </div>
                    <textarea id="edit-invitation-success" rows="4"
                        oninput="window.Editor.InvitationEditor.syncToPreview()"
                        class="w-full px-6 py-5 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-medium leading-relaxed outline-none focus:border-rose-200 focus:bg-white transition-all resize-none shadow-inner"
                        placeholder="Tuliskan ucapan terima kasihmu...">${this._activeConfig.successMessage || ''}</textarea>
                    <p class="text-[10px] text-gray-400 mt-3 px-1 italic">Pesan ini akan muncul setelah dia menekan tombol 'Ya'.</p>
                </div>

                <!-- Info Box (No Button/GIF) -->
                <div class="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex gap-4">
                    <span class="material-symbols-outlined text-blue-400">info</span>
                    <p class="text-[11px] text-blue-600/80 leading-relaxed font-medium">
                        Catatan: Tombol "Ya", "Tidak", dan animasi beruang tidak bisa diubah untuk menjaga fungsionalitas halaman undangan.
                    </p>
                </div>

                <!-- Quick Action Button -->
                <div class="pt-2">
                    <button onclick="window.Editor.InvitationEditor.save()" 
                        class="w-full bg-rose-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-100 hover:bg-rose-600 transition-all active:scale-[0.98]">
                        <span class="material-symbols-outlined">check_circle</span>
                        Simpan & Update Preview
                    </button>
                </div>
            </div>
        `;
    },

    syncToPreview() {
        if (window.StudioState) {
            this._activeConfig.question = document.getElementById('edit-invitation-question').value;
            this._activeConfig.successMessage = document.getElementById('edit-invitation-success').value;

            window.StudioState.config.invitation = JSON.parse(JSON.stringify(this._activeConfig));
            window.StudioState.sync();
        }
    },

    save() {
        if (window.StudioState) {
            this.syncToPreview();
            window.StudioState.save();

            if (window.StudioState.currentId) {
                window.StudioState.saveToCloud(window.StudioState.currentId);
            }

            if (typeof EditorUX !== 'undefined') {
                EditorUX.showNotification('Undangan Valentine diperbarui! ❤️🚀');
            }

            document.getElementById('invitationPickerModal').classList.add('hidden');
        }
    }
};
