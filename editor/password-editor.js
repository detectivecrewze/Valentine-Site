/**
 * Valentine Design Studio - Password Editor Module
 * Handles managing the login password.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.PasswordEditor = {
    init() {
        console.log('[PasswordEditor] Initializing...');
        const addBtn = document.getElementById('password-add-btn');
        const saveBtn = document.getElementById('password-save-btn');

        if (addBtn) addBtn.onclick = () => this.open();
        if (saveBtn) saveBtn.onclick = () => this.save();
    },

    open() {
        const modal = document.getElementById('passwordPickerModal');
        const input = document.getElementById('password-editor-input');

        if (modal && input) {
            // Load current password
            const currentPwd = window.StudioState?.config?.login?.password || "";
            input.value = currentPwd;

            modal.classList.remove('hidden');
        }
    },

    close() {
        const modal = document.getElementById('passwordPickerModal');
        if (modal) modal.classList.add('hidden');
    },

    async save() {
        const input = document.getElementById('password-editor-input');
        const btn = document.getElementById('password-save-btn');

        if (!input || !btn) return;

        const newPassword = input.value.trim();

        if (!newPassword) {
            alert('Password tidak boleh kosong!');
            return;
        }

        // UI Loading State
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Menyimpan...';
        btn.disabled = true;

        try {
            // Update State
            if (window.StudioState) {
                window.StudioState.config.login.password = newPassword;
                window.StudioState.save();
                window.StudioState.sync();

                if (window.StudioState.currentId) {
                    await window.StudioState.saveToCloud(window.StudioState.currentId);
                }

                // BRIDGE: Save to localStorage so local index.html picks it up immediately without 'data.js' edit
                localStorage.setItem('valentine_local_dev_password', newPassword);
                console.log('[PasswordEditor] Saved to local dev bridge:', newPassword);
            }

            // Success Feedback
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Tersimpan!';
            btn.classList.replace('bg-rose-600', 'bg-green-500');

            if (typeof EditorUX !== 'undefined') {
                EditorUX.showNotification('Password berhasil diubah! 🔒');
            }

            setTimeout(() => {
                this.close();
                // Reset button
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.classList.replace('bg-green-500', 'bg-rose-600');
            }, 1000);

        } catch (e) {
            console.error('[PasswordEditor] Save failed:', e);
            btn.innerHTML = 'Gagal Menyimpan';
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }, 2000);
        }
    }
};
