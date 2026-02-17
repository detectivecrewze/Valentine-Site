/**
 * Valentine Design Studio - Quiz Editor Module (Redesigned & Translated)
 * Handles adding, removing, and editing quiz questions in a 3-pane layout.
 * Language: Bahasa Indonesia
 */
window.Editor = window.Editor || {};
window.Editor.QuizEditor = {
    presets: [
        {
            question: "Di mana kencan pertama kita?",
            options: ["Di kafe kopi", "Di taman", "Restoran mewah", "Di bioskop"],
            correctIndex: 0,
            correctMessage: "Bener banget! Bau kopi selalu ngingetin aku hari itu. ☕❤️",
            wrongMessage: "Aww, hampir bener! Sebenernya di kafe kopi yang nyaman itu. ☕"
        },
        {
            question: "Bulan apa kita pertama kali ketemu?",
            options: ["Januari", "Juni", "September", "Desember"],
            correctIndex: 2,
            correctMessage: "Benar! Bulan September terbaik. 🍂",
            wrongMessage: "Kurang tepat, waktu itu pas musim gugur yang indah. 🍂"
        },
        {
            question: "Apa panggilan sayang favoritku buat kamu?",
            options: ["Sayang", "Bubba", "Manis", "Cintaku"],
            correctIndex: 1,
            correctMessage: "Kamu tahu aja! Bubba favoritku. 😘",
            wrongMessage: "Lucu sih, tapi ada satu yang paling sering kupakai! 😘"
        }
    ],

    _editingIdx: -1,

    init() {
        const addBtn = document.getElementById('quiz-add-btn');
        const addCustomBtn = document.getElementById('quiz-add-custom-btn');
        const saveBtn = document.getElementById('quiz-save-btn');
        const confirmBtn = document.getElementById('question-update-confirm-btn');

        if (addBtn) addBtn.onclick = () => this.open();
        if (addCustomBtn) addCustomBtn.onclick = () => this.addCustom();
        if (saveBtn) saveBtn.onclick = () => this.save();
        if (confirmBtn) confirmBtn.onclick = () => this.confirmEdit();
    },

    open() {
        const modal = document.getElementById('quizPickerModal');
        const addBtn = document.getElementById('quiz-add-btn');
        if (modal) {
            modal.classList.remove('hidden');
            if (addBtn) addBtn.classList.add('hidden');
            this.closeEditorPanel(); // Reset panel
            this.render();
        }
    },

    close() {
        const modal = document.getElementById('quizPickerModal');
        const addBtn = document.getElementById('quiz-add-btn');
        if (modal) modal.classList.add('hidden');
        if (addBtn) addBtn.classList.remove('hidden');
    },

    render() {
        this.renderLibrary();
        this.renderActive();
    },

    renderLibrary() {
        const container = document.getElementById('modal-quiz-library');
        if (!container) return;

        const config = window.StudioState?.config;
        const currentQuestions = config?.quiz?.questions || [];

        container.innerHTML = this.presets.map((p, idx) => {
            const isAdded = currentQuestions.some(cq => cq.question === p.question);

            return `
            <div class="bg-white border-2 ${isAdded ? 'border-rose-100 bg-rose-50/20' : 'border-gray-50'} p-4 rounded-2xl hover:border-rose-200 transition-all group cursor-pointer relative"
                 onclick="Editor.QuizEditor.addFromLibrary(${idx})">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-rose-100 group-hover:text-rose-500 transition-colors">
                        <span class="material-symbols-outlined text-[20px]">add</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-bold text-gray-800 leading-tight">${p.question}</div>
                    </div>
                </div>
            </div>
            `;
        }).join('');
    },

    renderActive() {
        const container = document.getElementById('modal-quiz-active-list');
        const countLabel = document.getElementById('modal-quiz-count');
        if (!container) return;

        const config = window.StudioState?.config;
        const questions = config?.quiz?.questions || [];
        if (countLabel) countLabel.textContent = questions.length;

        if (questions.length === 0) {
            container.innerHTML = `
                <div class="text-center py-20 flex flex-col items-center">
                    <div class="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <span class="material-symbols-outlined text-3xl text-gray-200">auto_awesome_motion</span>
                    </div>
                    <p class="text-[13px] font-medium text-gray-400">Kuis kamu masih kosong.<br>Pilih atau tambah pertanyaan baru!</p>
                </div>`;
            return;
        }

        container.innerHTML = questions.map((q, idx) => `
            <div class="group relative bg-white border-2 ${this._editingIdx === idx ? 'border-rose-400 ring-4 ring-rose-50' : 'border-gray-100'} rounded-2xl p-4 cursor-pointer hover:border-rose-200 transition-all shadow-sm active:scale-[0.98]"
                 onclick="Editor.QuizEditor.openEdit(${idx})">
                <div class="flex items-center gap-4">
                    <div class="w-8 h-8 rounded-full ${this._editingIdx === idx ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'} flex items-center justify-center text-[12px] font-black shrink-0 border border-rose-100">
                        ${idx + 1}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-[13px] font-bold text-gray-900 truncate">${q.question}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="px-2 py-0.5 rounded-md bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-tighter border border-green-100">Jawaban Terkunci</span>
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); Editor.QuizEditor.remove(${idx})" 
                            class="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <span class="material-symbols-outlined text-lg">delete</span>
                    </button>
                </div>
            </div>
        `).join('');
    },

    addFromLibrary(idx) {
        const preset = this.presets[idx];
        if (!preset) return;

        const config = window.StudioState.config;
        if (!config.quiz) config.quiz = { title: "Love Quiz", questions: [], resultMessage: "Kamu kenal aku banget! ❤️" };

        if (config.quiz.questions.some(q => q.question === preset.question)) {
            if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Pertanyaan sudah ada di daftar!');
            return;
        }

        config.quiz.questions.push(JSON.parse(JSON.stringify(preset)));
        this.render();
        // Automatically open the edit panel for new additions
        this.openEdit(config.quiz.questions.length - 1);
    },

    addCustom() {
        const config = window.StudioState.config;
        if (!config.quiz) config.quiz = { title: "Love Quiz", questions: [], resultMessage: "Kamu kenal aku banget! ❤️" };

        const newQ = {
            question: "Tulis pertanyaanmu di sini ya!",
            options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
            correctIndex: 0,
            correctMessage: "Yeay! Kamu bener! ❤️",
            wrongMessage: "Duh, salah nih."
        };

        config.quiz.questions.push(newQ);
        this.render();
        this.openEdit(config.quiz.questions.length - 1);
    },

    remove(idx) {
        if (!confirm('Kamu yakin mau hapus pertanyaan ini?')) return;
        window.StudioState.config.quiz.questions.splice(idx, 1);
        if (this._editingIdx === idx) this.closeEditorPanel();
        else if (this._editingIdx > idx) this._editingIdx--;
        this.render();
        this.syncToPreview();
    },

    openEdit(idx) {
        const q = window.StudioState.config.quiz.questions[idx];
        if (!q) return;

        this._editingIdx = idx;
        const container = document.getElementById('question-editor-form');
        const emptyState = document.getElementById('quiz-editor-empty');
        const editorPanel = document.getElementById('quiz-editor-panel');

        if (!container || !emptyState || !editorPanel) return;

        emptyState.classList.add('hidden');
        editorPanel.classList.remove('hidden');

        container.innerHTML = `
            <div class="space-y-6">
                <div class="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm">
                    <label class="block text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 ml-1">Pertanyaan Utama</label>
                    <textarea id="edit-q-text" rows="2"
                        class="w-full px-5 py-4 bg-gray-50 border-2 border-gray-50 rounded-2xl text-base font-bold outline-none focus:border-rose-200 focus:bg-white transition-all resize-none">${q.question}</textarea>
                </div>

                <div class="space-y-4">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Pilihan Jawaban (Pilih satu yang benar)</label>
                    ${q.options.map((opt, i) => `
                        <div class="group flex items-center gap-3 bg-white p-3 rounded-2xl border-2 ${q.correctIndex === i ? 'border-green-300 bg-green-50/20' : 'border-gray-50'} hover:border-rose-100 transition-all">
                            <label class="relative flex items-center cursor-pointer">
                                <input type="radio" name="correct-idx" value="${i}" ${q.correctIndex === i ? 'checked' : ''} 
                                    class="peer sr-only" onchange="Editor.QuizEditor.updateCorrectState(${i})">
                                <div class="w-6 h-6 rounded-full border-2 border-gray-200 peer-checked:border-green-500 peer-checked:bg-green-500 flex items-center justify-center transition-all">
                                    <span class="material-symbols-outlined text-white text-[14px] scale-0 peer-checked:scale-100 transition-transform">check</span>
                                </div>
                            </label>
                            <input type="text" id="edit-opt-${i}" value="${opt}" 
                                class="flex-1 bg-transparent border-none text-sm font-bold outline-none text-gray-700">
                        </div>
                    `).join('')}
                </div>

                <div class="grid grid-cols-1 gap-6">
                    <div class="bg-green-50/30 p-5 rounded-[1.5rem] border border-green-100">
                        <label class="block text-[10px] font-black text-green-600 uppercase mb-3 px-1">Pesan Kalau Benar ❤️</label>
                        <input type="text" id="edit-q-success" value="${q.correctMessage}" 
                            class="w-full px-4 py-3 bg-white border border-green-100 rounded-xl text-sm font-medium italic outline-none focus:border-green-300">
                    </div>
                    <div class="bg-rose-50/30 p-5 rounded-[1.5rem] border border-rose-100">
                        <label class="block text-[10px] font-black text-rose-600 uppercase mb-3 px-1">Pesan Kalau Salah 💔</label>
                        <input type="text" id="edit-q-fail" value="${q.wrongMessage}" 
                            class="w-full px-4 py-3 bg-white border border-rose-100 rounded-xl text-sm font-medium italic outline-none focus:border-rose-300">
                    </div>
                </div>
            </div>
        `;

        this.renderActive(); // Re-render to show active state
    },

    updateCorrectState(idx) {
        const options = document.querySelectorAll('#question-editor-form [name="correct-idx"]');
        options.forEach((opt, i) => {
            const container = opt.closest('.group');
            if (i === idx) {
                container.classList.add('border-green-300', 'bg-green-50/20');
                container.classList.remove('border-gray-50');
            } else {
                container.classList.remove('border-green-300', 'bg-green-50/20');
                container.classList.add('border-gray-50');
            }
        });
    },

    closeEditorPanel() {
        this._editingIdx = -1;
        const emptyState = document.getElementById('quiz-editor-empty');
        const editorPanel = document.getElementById('quiz-editor-panel');
        if (emptyState && editorPanel) {
            emptyState.classList.remove('hidden');
            editorPanel.classList.add('hidden');
        }
        this.renderActive();
    },

    confirmEdit() {
        if (this._editingIdx === -1) return;
        const q = window.StudioState.config.quiz.questions[this._editingIdx];
        if (!q) return;

        q.question = document.getElementById('edit-q-text').value;
        q.correctMessage = document.getElementById('edit-q-success').value;
        q.wrongMessage = document.getElementById('edit-q-fail').value;

        const radios = document.getElementsByName('correct-idx');
        for (let i = 0; i < radios.length; i++) {
            if (radios[i].checked) q.correctIndex = i;
            q.options[i] = document.getElementById(`edit-opt-${i}`).value;
        }

        if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Berhasil diubah! Bagus banget.');

        this.render();
        // Important: Reflect in preview immediately
        this.syncToPreview();
    },

    syncToPreview() {
        window.StudioState.sync();
        const frame = document.getElementById('preview-frame');
        if (frame && frame.contentWindow) {
            frame.contentWindow.postMessage({ type: 'QUIZ_REFRESH' }, '*');
        }
    },

    save() {
        window.StudioState.sync();
        if (window.StudioState.currentId) {
            window.StudioState.saveToCloud(window.StudioState.currentId);
        }

        if (typeof EditorUX !== 'undefined') {
            EditorUX.showNotification('Kuis sudah LIVE di HP! 🚀');
        }

        this.syncToPreview();
        document.getElementById('quizPickerModal').classList.add('hidden');
    }
};
