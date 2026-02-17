/**
 * Editor UX Enhancements - Tier 1 Must-Haves
 * 
 * Features:
 * 1. Welcome Wizard / First-Time Guide
 * 2. Rich Tooltips on all buttons
 * 3. Save Status Indicator (live)
 * 4. Undo / Redo system
 * 5. Enhanced Click-to-Edit Visual Cues (injected into iframe)
 */

const EditorUX = {
    // 🔔 NEW: Beautiful toast notification system
    showNotification(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 z-[3000] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideUp bg-white border border-rose-50`;

        const icon = type === 'success' ? 'check_circle' : 'info';
        const color = type === 'success' ? 'text-green-500' : 'text-rose-500';

        toast.innerHTML = `
            <span class="material-symbols-outlined ${color}">${icon}</span>
            <span class="text-sm font-bold text-gray-800">${message}</span>
        `;

        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },


    // ============================================================
    // 1. WELCOME WIZARD / FIRST-TIME GUIDE
    // ============================================================

    showWelcomeWizard() {
        // Check if this user already dismissed the wizard
        const projectId = new URLSearchParams(window.location.search).get('id') || 'default';
        if (localStorage.getItem(`studio_wizard_done_${projectId}`)) return;

        const overlay = document.createElement('div');
        overlay.id = 'welcomeWizardOverlay';
        overlay.innerHTML = `
            <div class="ww-backdrop"></div>
            <div class="ww-card">
                <!-- Step Indicator -->
                <div class="ww-steps-indicator">
                    <div class="ww-step-dot active" data-step="0"></div>
                    <div class="ww-step-dot" data-step="1"></div>
                    <div class="ww-step-dot" data-step="2"></div>
                    <div class="ww-step-dot" data-step="3"></div>
                </div>

                <!-- Step 0: Welcome -->
                <div class="ww-step active" data-step="0">
                    <div class="ww-icon">🎉</div>
                    <h2>Welcome to Your Valentine Site!</h2>
                    <p>This is your design studio — where you can customize every detail of your Valentine's surprise. Let's take a quick tour!</p>
                    <div class="ww-features">
                        <div class="ww-feature">
                            <span class="material-symbols-outlined">edit</span>
                            <span>Click any text to edit it</span>
                        </div>
                        <div class="ww-feature">
                            <span class="material-symbols-outlined">photo_camera</span>
                            <span>Click photos to replace them</span>
                        </div>
                        <div class="ww-feature">
                            <span class="material-symbols-outlined">cloud_done</span>
                            <span>Changes save automatically</span>
                        </div>
                    </div>
                </div>

                <!-- Step 1: Text Editing -->
                <div class="ww-step" data-step="1">
                    <div class="ww-icon">✏️</div>
                    <h2>Step 1: Edit Your Text</h2>
                    <p>Click directly on any text in the preview to edit it. You'll see a dashed pink border when you hover over editable elements.</p>
                    <div class="ww-demo">
                        <div class="ww-demo-text">
                            <span class="ww-demo-hover">Your Name Here</span>
                            <span class="ww-demo-label">← Hover & click to edit!</span>
                        </div>
                    </div>
                </div>

                <!-- Step 2: Photos -->
                <div class="ww-step" data-step="2">
                    <div class="ww-icon">📸</div>
                    <h2>Step 2: Upload Your Photos</h2>
                    <p>Click on any photo to replace it. You can upload from your device or paste an image URL. Use the <strong>Uploads</strong> tab on the left sidebar for your photo gallery.</p>
                    <div class="ww-demo">
                        <div class="ww-demo-photo">
                            <span class="material-symbols-outlined">add_a_photo</span>
                            <span>Click photo → Upload</span>
                        </div>
                    </div>
                </div>

                <!-- Step 3: Music & Publish -->
                <div class="ww-step" data-step="3">
                    <div class="ww-icon">🎵</div>
                    <h2>Step 3: Add Music & Publish</h2>
                    <p>Go to the <strong>Music</strong> tab to add romantic songs. When you're happy, hit the <strong>Publish</strong> button to get a shareable link!</p>
                    <div class="ww-demo">
                        <div class="ww-demo-sidebar">
                            <div class="ww-demo-tab">📄 Pages</div>
                            <div class="ww-demo-tab">☁️ Uploads</div>
                            <div class="ww-demo-tab">🎨 Themes</div>
                            <div class="ww-demo-tab active">🎵 Music</div>
                        </div>
                    </div>
                </div>

                <!-- Navigation -->
                <div class="ww-nav">
                    <button class="ww-btn-skip" onclick="EditorUX.closeWelcomeWizard()">Skip Tutorial</button>
                    <div class="ww-nav-right">
                        <button class="ww-btn-back" onclick="EditorUX.wizardPrev()" style="display:none;">
                            <span class="material-symbols-outlined">arrow_back</span>
                            Back
                        </button>
                        <button class="ww-btn-next" onclick="EditorUX.wizardNext()">
                            Next
                            <span class="material-symbols-outlined">arrow_forward</span>
                        </button>
                        <button class="ww-btn-start" onclick="EditorUX.closeWelcomeWizard()" style="display:none;">
                            <span class="material-symbols-outlined">rocket_launch</span>
                            Start Editing!
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        this._wizardStep = 0;
    },

    wizardNext() {
        this._wizardStep = Math.min((this._wizardStep || 0) + 1, 3);
        this.updateWizardStep();
    },

    wizardPrev() {
        this._wizardStep = Math.max((this._wizardStep || 0) - 1, 0);
        this.updateWizardStep();
    },

    updateWizardStep() {
        const steps = document.querySelectorAll('.ww-step');
        const dots = document.querySelectorAll('.ww-step-dot');
        const backBtn = document.querySelector('.ww-btn-back');
        const nextBtn = document.querySelector('.ww-btn-next');
        const startBtn = document.querySelector('.ww-btn-start');
        const skipBtn = document.querySelector('.ww-btn-skip');

        steps.forEach((s, i) => s.classList.toggle('active', i === this._wizardStep));
        dots.forEach((d, i) => d.classList.toggle('active', i === this._wizardStep));

        if (backBtn) backBtn.style.display = this._wizardStep > 0 ? '' : 'none';
        if (this._wizardStep >= 3) {
            if (nextBtn) nextBtn.style.display = 'none';
            if (startBtn) startBtn.style.display = '';
            if (skipBtn) skipBtn.style.display = 'none';
        } else {
            if (nextBtn) nextBtn.style.display = '';
            if (startBtn) startBtn.style.display = 'none';
            if (skipBtn) skipBtn.style.display = '';
        }
    },

    closeWelcomeWizard() {
        const overlay = document.getElementById('welcomeWizardOverlay');
        if (overlay) {
            overlay.querySelector('.ww-card').style.animation = 'ww-fadeOut 0.3s ease forwards';
            overlay.querySelector('.ww-backdrop').style.animation = 'ww-fadeOut 0.3s ease forwards';
            setTimeout(() => overlay.remove(), 300);
        }
        const projectId = new URLSearchParams(window.location.search).get('id') || 'default';
        localStorage.setItem(`studio_wizard_done_${projectId}`, 'true');
    },

    // ============================================================
    // 2. TOOLTIPS ON ALL BUTTONS
    // ============================================================

    setupTooltips() {
        const tooltipMap = [
            // Sidebar tabs
            { sel: '[data-tab="pages"]', tip: 'View & reorder your pages', pos: 'right' },
            { sel: '[data-tab="uploads"]', tip: 'Upload your photos here', pos: 'right' },
            { sel: '[data-tab="elements"]', tip: 'Change colors & themes', pos: 'right' },
            { sel: '[data-tab="music"]', tip: 'Add romantic songs', pos: 'right' },
            { sel: '[data-tab="settings"]', tip: 'Change project password & settings', pos: 'right' },

            // Header buttons
            { sel: '#publish-btn', tip: 'Save & get a shareable link', pos: 'bottom' },
            { sel: '.header-right .btn-secondary', tip: 'Preview how your site looks', pos: 'bottom' },

            // Toolbar buttons
            { sel: '#replace-image-btn', tip: 'Replace with image URL', pos: 'bottom' },
            { sel: '#upload-image-btn', tip: 'Upload from your device', pos: 'bottom' },
            { sel: '#flip-card-btn', tip: 'Flip the card over', pos: 'bottom' },

            // Viewport controls
            { sel: '#btn-device-mobile', tip: 'Mobile phone view', pos: 'top' },
            { sel: '#btn-device-desktop', tip: 'Desktop view', pos: 'top' },
            { sel: '#btn-zoom-out', tip: 'Zoom out', pos: 'top' },
            { sel: '#btn-zoom-in', tip: 'Zoom in', pos: 'top' },

            // FABs
            { sel: '#music-add-btn', tip: 'Add a new song', pos: 'left' },
            { sel: '#gallery-add-btn', tip: 'Add a new photo memory', pos: 'left' },
            { sel: '#map-add-btn', tip: 'Add a new map location', pos: 'left' },

            // Sidebar actions
            { sel: '#reset-defaults-btn', tip: 'Reset page order to original', pos: 'top' },
            { sel: '#sidebar-add-song', tip: 'Add a custom song URL', pos: 'top' },
            { sel: '#sidebar-upload-area', tip: 'Drag & drop photos or click to browse', pos: 'top' },
        ];

        tooltipMap.forEach(({ sel, tip, pos }) => {
            const el = document.querySelector(sel);
            if (!el) return;
            el.setAttribute('data-tooltip', tip);
            el.setAttribute('data-tooltip-pos', pos || 'bottom');
        });
    },

    // ============================================================
    // 3. SAVE STATUS INDICATOR
    // ============================================================

    _saveState: 'idle', // idle | saving | saved | error
    _saveTimer: null,

    initSaveStatus() {
        // 1. Monitor Local Preview Sync (Immediate)
        const originalSync = window.StudioState.sync.bind(window.StudioState);
        window.StudioState.sync = () => {
            originalSync();
            this.showSaveStatus('syncing');
            clearTimeout(this._syncTimer);
            this._syncTimer = setTimeout(() => {
                this.showSaveStatus('synced');
            }, 800);
        };

        // 2. Monitor Cloud Save (Persistence)
        const originalSave = window.StudioState.saveToCloud.bind(window.StudioState);
        window.StudioState.saveToCloud = async (id) => {
            this.showSaveStatus('saving');
            const result = await originalSave(id);
            this.showSaveStatus(result ? 'saved' : 'error');
            return result;
        };
    },

    showSaveStatus(status) {
        const dot = document.querySelector('.status-dot');
        const text = document.querySelector('.status-text');
        if (!dot || !dot.classList || !text) return;

        // Clear previous states
        dot.style.background = '';
        dot.classList.remove('syncing', 'synced', 'saving', 'saved', 'error');

        this._saveState = status;

        switch (status) {
            case 'syncing':
                dot.classList.add('syncing');
                dot.style.background = '#3b82f6'; // blue
                text.textContent = 'Syncing Preview...';
                break;
            case 'synced':
                dot.classList.add('synced');
                dot.style.background = '#94a3b8'; // gray
                text.textContent = 'Preview Updated';
                break;
            case 'saving':
                dot.classList.add('saving');
                dot.style.background = '#f59e0b'; // amber
                text.textContent = 'Saving to Cloud...';
                break;
            case 'saved':
                dot.classList.add('saved');
                dot.style.background = '#10b981'; // emerald
                text.textContent = 'All Changes Saved';
                break;
            case 'error':
                dot.classList.add('error');
                dot.style.background = '#ef4444'; // red
                text.textContent = 'Save Failed';
                break;
        }
    },

    // ============================================================
    // 4. UNDO / REDO
    // ============================================================

    _undoStack: [],
    _redoStack: [],
    _maxHistory: 30,
    _isUndoing: false,

    initUndoRedo() {
        // Capture initial state
        if (window.StudioState?.config) {
            this._undoStack = [JSON.stringify(window.StudioState.config)];
        }

        // Patch updateValue to track changes
        const origUpdate = window.StudioState.updateValue.bind(window.StudioState);
        window.StudioState.updateValue = (path, value, forceSync) => {
            if (!EditorUX._isUndoing) {
                EditorUX.pushUndoState();
            }
            origUpdate(path, value, forceSync);
            EditorUX.updateUndoButtons();
        };

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                EditorUX.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                EditorUX.redo();
            }
        });

        this.updateUndoButtons();
    },

    pushUndoState() {
        if (!window.StudioState?.config) return;
        const snap = JSON.stringify(window.StudioState.config);
        const last = this._undoStack[this._undoStack.length - 1];
        // Don't push if identical to last state
        if (snap === last) return;
        this._undoStack.push(snap);
        if (this._undoStack.length > this._maxHistory) this._undoStack.shift();
        this._redoStack = []; // Clear redo on new action
    },

    undo() {
        if (this._undoStack.length <= 1) return; // Need at least 1 + current
        this._isUndoing = true;
        // Save current state to redo stack
        this._redoStack.push(this._undoStack.pop());
        // Restore previous state
        const prev = this._undoStack[this._undoStack.length - 1];
        window.StudioState.config = JSON.parse(prev);
        window.StudioState.sync();
        this._isUndoing = false;
        this.updateUndoButtons();
        this.showSaveStatus('saving');
        if (window.StudioState) window.StudioState.requestSave();
    },

    redo() {
        if (this._redoStack.length === 0) return;
        this._isUndoing = true;
        const next = this._redoStack.pop();
        this._undoStack.push(next);
        window.StudioState.config = JSON.parse(next);
        window.StudioState.sync();
        this._isUndoing = false;
        this.updateUndoButtons();
        this.showSaveStatus('saving');
        if (window.StudioState) window.StudioState.requestSave();
    },

    updateUndoButtons() {
        const undoBtn = document.getElementById('ux-undo-btn');
        const redoBtn = document.getElementById('ux-redo-btn');
        if (undoBtn) undoBtn.disabled = this._undoStack.length <= 1;
        if (redoBtn) redoBtn.disabled = this._redoStack.length === 0;
    },

    // ============================================================
    // 5. ENHANCED CLICK-TO-EDIT VISUAL CUES (Injected into iframe)
    // ============================================================

    injectEditCues() {
        const frame = document.getElementById('preview-frame');
        if (!frame) return;

        const inject = () => {
            try {
                const frameDoc = frame.contentDocument || frame.contentWindow?.document;
                if (!frameDoc || !frameDoc.body) return;
                if (frameDoc.getElementById('editor-cue-styles')) return; // Already injected

                const style = frameDoc.createElement('style');
                style.id = 'editor-cue-styles';
                style.textContent = `
                    /* Editable text hover: pink dashed border + pencil cursor */
                    [contenteditable="true"]:hover:not(:focus) {
                        outline: 2px dashed rgba(244, 63, 94, 0.5) !important;
                        outline-offset: 2px !important;
                        cursor: text !important;
                        border-radius: 4px;
                    }

                    /* Editable text active/focus: solid pink border */
                    [contenteditable="true"]:focus {
                        outline: 2px solid #f43f5e !important;
                        outline-offset: 2px !important;
                        background: rgba(255, 77, 109, 0.04) !important;
                        border-radius: 4px;
                    }

                    /* Floating edit hint that appears on hover */
                    [contenteditable="true"]:hover:not(:focus)::after {
                        content: "✏️ Click to edit";
                        position: absolute;
                        bottom: -24px;
                        left: 50%;
                        transform: translateX(-50%);
                        font-size: 10px;
                        font-family: 'Inter', sans-serif;
                        color: white;
                        background: #f43f5e;
                        padding: 2px 8px;
                        border-radius: 6px;
                        white-space: nowrap;
                        z-index: 9999;
                        pointer-events: none;
                        font-weight: 600;
                        letter-spacing: 0.02em;
                    }

                    /* Images: show camera icon on hover */
                    img:hover {
                        outline: 2px dashed rgba(244, 63, 94, 0.4) !important;
                        outline-offset: 2px !important;
                        cursor: pointer !important;
                        filter: brightness(0.95);
                        transition: all 0.2s;
                    }

                    /* Polaroid frame hover */
                    .polaroid-frame:hover {
                        transform: scale(1.01);
                        box-shadow: 0 8px 25px rgba(244, 63, 94, 0.15) !important;
                        transition: all 0.2s !important;
                    }
                `;
                frameDoc.head.appendChild(style);
                console.log('[UX] Edit cues injected into preview');
            } catch (e) {
                // Cross-origin, ignore
            }
        };

        // Inject on load and re-inject on subsequent loads
        inject();
        frame.addEventListener('load', inject);
    },

    // ============================================================
    // MASTER INIT
    // ============================================================

    init() {
        console.log('[UX] Initializing UX enhancements...');

        // 1. Welcome Wizard
        this.showWelcomeWizard();

        // 2. Tooltips
        this.setupTooltips();

        // 3. Save Status
        if (window.StudioState) {
            this.initSaveStatus();
        }

        // 4. Undo/Redo
        if (window.StudioState) {
            this.initUndoRedo();
        }

        // 5. Edit cues in iframe
        this.injectEditCues();

        console.log('[UX] All UX enhancements loaded ✓');
    }
};

window.EditorUX = EditorUX;
