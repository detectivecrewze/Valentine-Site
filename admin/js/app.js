// Main Application Logic

// --- TELEGRAM CONFIGURATION ---
// Handled securely via Cloudflare Worker (valentine-upload.aldoramadhan16.workers.dev)

const app = {
    currentStep: 0,
    wizardSteps: [],

    // Initialize application
    init() {
        console.log('[App] Initializing wizard...');

        // Initialize state
        state.init();

        // Calculate wizard steps
        this.recalcWizardSteps();

        // Translate the static UI
        this.translateUI();

        // Sync language switcher
        const langSwitcher = document.getElementById('langSwitcher');
        if (langSwitcher) {
            langSwitcher.value = state.configData.adminLang || 'en';
        }

        // Restore last step if available
        if (state.currentStep !== undefined) {
            this.currentStep = state.currentStep;
            // Validate step exists
            if (this.currentStep >= this.wizardSteps.length) {
                this.currentStep = 0;
            }
        }

        // Render first step
        this.renderCurrentStep();

        // Update UI components
        this.updateHeader();
        this.updateNavigation();

        // Show welcome modal if first time
        this.checkWelcomeModal();

        // Auto-save on input changes (debounced)
        this.setupAutoSave();

        // Populate sidebar
        this.updateSidebar();

        console.log('[App] Wizard initialized with', this.wizardSteps.length, 'steps');
    },

    // Recalculate wizard steps based on enabled pages
    recalcWizardSteps() {
        this.wizardSteps = [];

        // Step 1: Setup (always present)
        this.wizardSteps.push({
            id: 'setup',
            name: 'Setup',
            title: 'Theme & Names',
            icon: 'palette',
            previewPageId: 'page-1' // Maps to login page for preview
        });

        // Step 2: Page Manager (always present)
        this.wizardSteps.push({
            id: 'page-manager',
            name: 'Page Manager',
            title: 'Choose Your Pages',
            icon: 'dashboard_customize',
            previewPageId: 'page-1' // Stay on login page
        });

        // Add steps for each enabled page
        const enabledPages = state.getPages(true);
        enabledPages.forEach(page => {
            // Skip login page (it's part of setup)
            if (page.id === 'page-1') return;

            this.wizardSteps.push({
                id: page.id,
                name: page.name,
                title: page.name,
                icon: page.icon,
                type: page.type,
                previewPageId: page.id // Direct mapping to preview page ID
            });
        });

        console.log('[App] Recalculated steps:', this.wizardSteps.map(s => s.name));
    },

    // Render current step
    renderCurrentStep() {
        const step = this.wizardSteps[this.currentStep];
        if (!step) return;

        console.log('[App] Rendering step:', step.name);

        const contentDiv = document.getElementById('stepContent');
        if (!contentDiv) return;

        // Render step content based on step ID
        if (step.id === 'setup') {
            contentDiv.innerHTML = renderers.renderSetupStep();
        } else if (step.id === 'page-manager') {
            contentDiv.innerHTML = renderers.renderPageManagerStep();
            // Re-attach event listeners for page manager
            this.attachPageManagerListeners();
        } else {
            // Render dynamic page step
            contentDiv.innerHTML = renderers.renderPageStep(step);
        }

        // Update Header & Progress
        this.updateHeader();
        this.updateProgress();

        // Update Sidebar
        this.updateSidebar();

        // **FIX: Scroll preview to corresponding page**
        this.scrollPreviewToCurrentPage();

        // **NEW: Post-render initializations (e.g. Quill)**
        if (renderers.initStepLogic) {
            renderers.initStepLogic(step.id);
        }
    },

    // **NEW: Scroll preview iframe to match current wizard step**
    scrollPreviewToCurrentPage() {
        const step = this.wizardSteps[this.currentStep];
        if (!step || !step.previewPageId) return;

        console.log('[App] Scrolling preview to:', step.previewPageId);

        // Send navigation command to both preview iframes
        this.sendMessageToPreview({
            type: 'NAVIGATE_TO_PAGE',
            pageId: step.previewPageId
        });
    },

    // **NEW: Send message to preview iframes**
    sendMessageToPreview(message) {
        // Main preview iframe
        const iframe = document.getElementById('previewIframe');
        if (iframe && iframe.contentWindow && iframe.getAttribute('src')) {
            iframe.contentWindow.postMessage(message, '*');
        }

        // Modal preview iframe
        const modalIframe = document.getElementById('previewModalIframe');
        if (modalIframe && modalIframe.contentWindow && modalIframe.getAttribute('src')) {
            modalIframe.contentWindow.postMessage(message, '*');
        }
    },

    // Sidebar logic
    toggleSidebar() {
        const sidebar = document.getElementById('wizardSidebar');
        if (sidebar) {
            sidebar.classList.toggle('is-minimized');
        }
    },

    togglePreview() {
        const main = document.getElementById('wizardMain');
        if (main) {
            main.classList.toggle('is-preview-hidden');
        }
    },

    updateSidebar() {
        const nav = document.getElementById('sidebarNav');
        if (!nav) return;

        const lang = state.configData.adminLang || 'en';

        nav.innerHTML = this.wizardSteps.map((step, idx) => {
            const isActive = idx === this.currentStep;

            // Try to translate title
            let title = step.name;
            if (step.id === 'setup') title = t('theme_header_title');
            else if (step.id === 'page-manager') title = t('pageman_title');
            else {
                const pageIdKey = step.id.replace(/-/g, '_');
                title = translations[lang][`page_${pageIdKey}_title`] || step.name;
            }

            return `
                <div class="nav-item ${isActive ? 'active' : ''}" onclick="app.goToStep(${idx})">
                    <div class="nav-item-icon">
                        <span class="material-symbols-outlined">${step.icon}</span>
                    </div>
                    <span class="nav-item-text">${title}</span>
                </div>
            `;
        }).join('');
    },

    goToStep(idx) {
        if (idx < 0 || idx >= this.wizardSteps.length) return;
        this.currentStep = idx;
        state.currentStep = idx;
        state.save();
        this.renderCurrentStep();
    },

    // Update progress bar
    updateProgress() {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressBar) {
            const percent = ((this.currentStep + 1) / this.wizardSteps.length) * 100;
            progressBar.style.width = percent + '%';
        }

        if (progressText) {
            progressText.textContent = t('step_progress', { current: this.currentStep + 1, total: this.wizardSteps.length });
        }
    },

    // Update Header Components (Title & Lang Switcher)
    updateHeader() {
        const step = this.wizardSteps[this.currentStep];
        if (!step) return;

        // Update static elements in case language changed
        this.translateUI();

        // Update Current Step Title
        const stepTitle = document.getElementById('stepTitle');
        if (stepTitle) {
            // Check if there is a translation for this page
            const pageIdKey = step.id.replace(/-/g, '_');
            const translationKey = `page_${pageIdKey}_title`;

            // Special steps first
            if (step.id === 'setup') {
                stepTitle.textContent = t('welcome_step1_title');
            } else if (step.id === 'page-manager') {
                stepTitle.textContent = t('pageman_title');
            } else {
                // Try dynamic translation key using t()
                const translated = t(translationKey);
                // If t() returns the key itself, it means translation is missing, fallback to hardcoded title
                stepTitle.textContent = (translated !== translationKey) ? translated : step.title;
            }
        }
    },

    // Translate static UI elements marked with data-i18n
    translateUI() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            el.textContent = t(key);
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            el.placeholder = t(key);
        });
    },

    // Update navigation buttons
    updateNavigation() {
        const btnBack = document.getElementById('btnBack');
        const btnNext = document.getElementById('btnNext');
        const btnFinish = document.getElementById('btnFinish');

        // Back button
        if (btnBack) {
            btnBack.disabled = this.currentStep === 0;
        }

        // Next/Finish buttons
        const isLastStep = this.currentStep === this.wizardSteps.length - 1;

        if (btnNext) {
            if (isLastStep) {
                btnNext.classList.add('hidden');
            } else {
                btnNext.classList.remove('hidden');
            }
        }

        if (btnFinish) {
            if (isLastStep) {
                btnFinish.classList.remove('hidden');
            } else {
                btnFinish.classList.add('hidden');
            }
        }
    },

    // Go to next step
    nextStep() {
        // Save current step data
        this.saveCurrentStep();

        // Recalculate steps just in case (especially if leaving page manager)
        this.recalcWizardSteps();

        // Check if there is a next step
        if (this.currentStep < this.wizardSteps.length - 1) {
            this.currentStep++;
            state.currentStep = this.currentStep;
            this.renderCurrentStep();
            this.updateNavigation();
            state.save();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            // No next step (we are at end), ensure UI reflects this
            this.updateNavigation();
        }
    },

    // Go to previous step
    prevStep() {
        if (this.currentStep > 0) {
            this.saveCurrentStep();
            this.currentStep--;
            state.currentStep = this.currentStep;
            this.renderCurrentStep();
            this.updateNavigation();
            state.save();

            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    },

    // Save current step data
    saveCurrentStep() {
        state.save();
        state.syncToPreview();
    },

    // Save progress
    saveProgress() {
        this.saveCurrentStep();
        utils.showNotification('Progress saved!', 'success');
    },

    // Finish wizard
    finishWizard() {
        this.saveCurrentStep();

        const config = state.getConfig();

        // Show completion modal
        this.showCompletionModal(config);
    },

    // Show completion modal
    showCompletionModal(config) {
        // ✅ FIX: Log config summary for debugging
        console.log('[Completion] Config summary:', {
            hasLogin: !!config.login,
            hasGreeting: !!config.greeting,
            hasMusic: !!(config.music && config.music.length),
            hasGallery: !!(config.gallery && config.gallery.memories),
            hasMap: !!(config.map && config.map.locations),
            hasLetter: !!config.letter,
            musicCount: config.music ? config.music.length : 0,
            galleryCount: config.gallery && config.gallery.memories ? config.gallery.memories.length : 0
        });

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[200] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-2xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
                <div class="text-center mb-6">
                    <div class="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <span class="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                    </div>
                    <h2 class="text-3xl font-bold text-gray-900 mb-2">Configuration Complete!</h2>
                    <p class="text-gray-600">Your Valentine's experience is ready to share</p>
                    <!-- ✅ FIX: Config summary -->
                    <div class="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500 font-mono">
                        📊 ${config.music ? config.music.length : 0} songs | 
                        📷 ${utils.countAllPhotos(config)} photos | 
                        📍 ${config.map && config.map.locations ? config.map.locations.length : 0} locations
                    </div>
                </div>
                
                <!-- PRIMARY ACTION: Publish Online -->
                <div class="bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-6 mb-6 border-2 border-rose-200">
                    <h3 class="font-bold text-rose-900 mb-3 flex items-center gap-2">
                        <span class="material-symbols-outlined text-rose-500">cloud_upload</span>
                        <span data-i18n="publish_title">Publish Online</span>
                    </h3>
                    <p class="text-sm text-rose-700 mb-4" data-i18n="publish_desc">Save to cloud instantly!</p>
                    
                    <div class="flex gap-3 mb-4">
                        <input type="text" id="customerIdInput" 
                            class="flex-1 px-4 py-3 border-2 border-rose-200 rounded-xl focus:border-rose-500 focus:ring-2 focus:ring-rose-200 text-sm"
                            placeholder="e.g., lisa, budi-santi"
                            data-i18n-placeholder="publish_placeholder">
                    </div>
                    
                    <button id="btnPublish" onclick="app.publishOnline()" 
                        class="w-full bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 px-6 rounded-xl font-bold hover:from-rose-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl">
                        <span class="material-symbols-outlined">rocket_launch</span>
                        <span data-i18n="publish_btn">Publish Now</span>
                    </button>
                    
                    <!-- Result Link (hidden initially) -->
                    <div id="publishResult" class="hidden mt-4 p-4 bg-white rounded-xl border border-green-200">
                        <p class="text-xs text-gray-500 mb-2">Your Valentine is live at:</p>
                        <div class="flex gap-2 mb-4">
                            <input type="text" id="resultLink" readonly 
                                class="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono truncate">
                            <button onclick="app.copyResultLink()" 
                                class="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-all text-xs shrink-0">
                                Copy
                            </button>
                        </div>

                        <!-- QR CODE SECTION -->
                        <div class="flex flex-col items-center justify-center p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <div id="qrcode" class="bg-white p-2 rounded-lg shadow-sm mb-3"></div>
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-3" data-i18n="publish_qr_scan">${t('publish_qr_scan')}</p>
                            <button onclick="app.downloadQRCode()" 
                                class="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
                                <span class="material-symbols-outlined text-sm">download</span>
                                <span data-i18n="publish_qr_save">${t('publish_qr_save')}</span>
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- SECONDARY OPTIONS -->
                <details class="group">
                    <summary class="cursor-pointer text-gray-500 hover:text-gray-700 text-sm font-semibold flex items-center gap-2 mb-3">
                        <span class="material-symbols-outlined text-base group-open:rotate-90 transition-transform">chevron_right</span>
                        Other Options (Legacy)
                    </summary>
                    <div class="space-y-3 pl-6">
                        <button id="btnTelegram" onclick="app.submitToTelegram()" class="w-full bg-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm">
                            <span class="material-symbols-outlined">send</span>
                            Send to Admin (Telegram)
                        </button>

                        <button onclick="app.downloadConfig()" class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">download</span>
                            Download Configuration (data.js)
                        </button>
                        
                        <button onclick="app.copyConfig()" class="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined">content_copy</span>
                            Copy to Clipboard
                        </button>
                    </div>
                </details>
                
                <button onclick="this.closest('.fixed').remove()" class="mt-6 w-full py-3 text-gray-500 hover:text-gray-700 font-semibold">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // Submit to Telegram via Cloudflare Worker
    async submitToTelegram() {
        const btn = document.getElementById('btnTelegram');
        const originalContent = btn.innerHTML;
        const originalClass = btn.className;

        if (!confirm("Send configuration to Admin (via Secure Worker)?")) return;

        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Sending...';
        btn.classList.add('opacity-75', 'cursor-not-allowed');

        try {
            // Prepare content
            const config = state.getConfig();
            const customer = config.metadata?.customerName || "Unknown Customer";
            const header = `/**\n * Valentine Surprise Configuration\n * Customer: ${customer}\n */\n\n`;
            const content = header + `const CONFIG = ${JSON.stringify(config, null, 2)};`;

            // Create Blob
            const blob = new Blob([content], { type: 'text/javascript' });
            const formData = new FormData();

            // Note: CHAT_ID and BOT_TOKEN are strictly handled by the Cloudflare Worker now.
            // We only send the file and caption.
            formData.append('document', blob, 'data.js');
            formData.append('caption', `✨ New Valentine Configuration created by ${customer}!`);

            // Send to Cloudflare Worker
            // Ensure this URL matches your deployed worker
            const WORKER_URL = 'https://valentine-upload.aldoramadhan16.workers.dev/telegram';

            const response = await fetch(WORKER_URL, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                btn.innerHTML = '<span class="material-symbols-outlined">verified</span> Sent Successfully!';
                btn.className = "w-full bg-green-500 text-white py-3 px-6 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 shadow-sm";
                utils.showNotification('Successfully sent to Admin!', 'success');
            } else {
                let errorMsg = "Failed to send";
                try {
                    const result = await response.json();
                    if (result.error) errorMsg = result.error;
                } catch (e) { }
                throw new Error(errorMsg);
            }
        } catch (err) {
            console.error(err);
            btn.disabled = false;
            btn.innerHTML = originalContent;
            btn.className = originalClass;
            alert("Errors: " + err.message + "\n\nMake sure your Cloudflare Worker is deployed with the secrets!");
        }
    },

    // 🚀 NEW: Publish config to Cloudflare KV and get shareable link
    async publishOnline() {
        const customerIdInput = document.getElementById('customerIdInput');
        const btn = document.getElementById('btnPublish');
        const resultDiv = document.getElementById('publishResult');
        const resultLink = document.getElementById('resultLink');

        const customerId = customerIdInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

        if (!customerId) {
            utils.showNotification('Please enter a unique ID!', 'error');
            customerIdInput.focus();
            return;
        }

        // Disable button and show loading
        const originalHTML = btn.innerHTML;
        const originalClass = btn.className;
        btn.disabled = true;
        btn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Publishing...';

        try {
            const config = state.getConfig();

            // ✅ FIX: Validate config before sending
            if (!config.login || !config.greeting) {
                throw new Error('Configuration is incomplete. Please fill in at least the login and greeting sections.');
            }

            const API_URL = 'https://valentine-upload.aldoramadhan16.workers.dev';

            console.log('[Publish] Sending config to KV:', {
                id: customerId,
                configSize: JSON.stringify(config).length + ' bytes',
                hasMusic: !!(config.music && config.music.length),
                hasGallery: !!(config.gallery && config.gallery.memories),
                hasMap: !!(config.map && config.map.locations)
            });

            const response = await fetch(`${API_URL}/save-config?id=${encodeURIComponent(customerId)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save configuration');
            }

            const result = await response.json();
            console.log('[Publish] ✅ Success:', result);

            // Generate the shareable link
            const VERCEL_URL = 'https://valentine-site-sigma.vercel.app';
            const shareableUrl = `${VERCEL_URL}/?to=${customerId}`;

            // Show result
            resultDiv.classList.remove('hidden');
            resultLink.value = shareableUrl;

            // GENERATE QR CODE
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer && typeof QRCode !== 'undefined') {
                qrContainer.innerHTML = ''; // Clear previous
                new QRCode(qrContainer, {
                    text: shareableUrl,
                    width: 128,
                    height: 128,
                    colorDark: "#9f1239", // Rose 800
                    colorLight: "#ffffff",
                    correctLevel: QRCode.CorrectLevel.H
                });
            }

            // Update button to success state
            btn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Published!';
            btn.className = originalClass.replace('from-rose-500 to-pink-500', 'from-green-500 to-emerald-500');

            // ✅ FIX: Log success details
            console.log('[Publish] ✅ Shareable URL:', shareableUrl);
            console.log('[Publish] ⏳ Note: Wait 10-30 seconds before testing the link');

            // ✅ FIX: Show warning about propagation delay
            utils.showNotification('🎉 Published! Wait 10-30 seconds, then test your link.', 'success', 6000);

        } catch (error) {
            console.error('[Publish] ❌ Error:', error);
            btn.innerHTML = originalHTML;
            btn.className = originalClass;
            btn.disabled = false;
            utils.showNotification('Failed to publish: ' + error.message, 'error');
        }
    },

    copyResultLink() {
        const resultLink = document.getElementById('resultLink');
        if (resultLink && resultLink.value) {
            navigator.clipboard.writeText(resultLink.value);
            utils.showNotification('Link copied!', 'success');
        }
    },

    // Download QR Code as PNG
    downloadQRCode() {
        const qrContainer = document.getElementById('qrcode');
        if (!qrContainer) return;

        const img = qrContainer.querySelector('img');
        if (img) {
            const a = document.createElement('a');
            a.href = img.src;
            a.download = 'valentine-qr.png';
            a.click();
        } else {
            const canvas = qrContainer.querySelector('canvas');
            if (canvas) {
                const a = document.createElement('a');
                a.href = canvas.toDataURL('image/png');
                a.download = 'valentine-qr.png';
                a.click();
            }
        }
    },

    // Download configuration as data.js
    downloadConfig() {
        const config = state.getConfig();
        const customer = config.metadata?.customerName || "Unknown Customer";
        const header = `/**\n * Valentine Surprise Configuration\n * Customer: ${customer}\n */\n\n`;
        const content = header + `const CONFIG = ${JSON.stringify(config, null, 2)};`;
        const blob = new Blob([content], { type: 'application/javascript' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js';
        a.click();

        URL.revokeObjectURL(url);
        utils.showNotification('Configuration downloaded!', 'success');
    },

    // Copy configuration to clipboard
    copyConfig() {
        const config = state.getConfig();
        const content = `const CONFIG = ${JSON.stringify(config, null, 2)};`;
        utils.copyToClipboard(content);
    },

    // View code in modal
    viewCode() {
        const config = state.getConfig();
        const content = `const CONFIG = ${JSON.stringify(config, null, 2)};`;

        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black/80 backdrop-blur-md z-[300] flex items-center justify-center p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-3xl max-w-4xl w-full h-[80vh] flex flex-col overflow-hidden">
                <div class="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-gray-900">Generated Configuration</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div class="flex-1 overflow-auto p-6">
                    <pre class="text-xs bg-gray-900 text-green-400 p-4 rounded-xl overflow-auto">${utils.escapeHtml(content)}</pre>
                </div>
                <div class="p-6 border-t border-gray-200 flex gap-3">
                    <button onclick="app.copyConfig(); this.closest('.fixed').remove();" class="flex-1 bg-rose-600 text-white py-3 rounded-xl font-semibold hover:bg-rose-700 transition-all">
                        Copy & Close
                    </button>
                    <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-all">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    },

    // Show/hide preview modal (mobile)
    showPreview() {
        const modal = document.getElementById('previewModal');
        const modalIframe = document.getElementById('previewModalIframe');

        if (modal && modalIframe) {
            // Load source if missing
            if (!modalIframe.src || modalIframe.src === 'about:blank' || modalIframe.getAttribute('src') === '') {
                modalIframe.src = "../index.html?preview=modal";
            }

            modal.classList.remove('hidden');
            modal.classList.add('flex');

            // Force immediate sync
            setTimeout(() => {
                if (state.syncToPreviewImmediate) {
                    state.syncToPreviewImmediate();
                } else {
                    state.syncToPreview();
                }
                this.scrollPreviewToCurrentPage();
            }, 100);
        }
    },

    closePreview() {
        const modal = document.getElementById('previewModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    },

    // Welcome modal
    checkWelcomeModal() {
        if (!localStorage.getItem('welcome_guided')) {
            setTimeout(() => {
                const modal = document.getElementById('welcomeModal');
                if (modal) {
                    modal.classList.remove('hidden');
                    modal.classList.add('flex');
                }
            }, 800);
        }
    },

    closeWelcome() {
        const modal = document.getElementById('welcomeModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            localStorage.setItem('welcome_guided', 'true');
        }
    },

    // Setup auto-save
    setupAutoSave() {
        // No debounce needed - state updates happen immediately now
        // Just trigger sync to preview when inputs change
        const debouncedSync = utils.debounce(() => {
            state.save(); // PERSIST TO STORAGE
            state.syncToPreview(); // UPDATE IFRAME
        }, 500);

        document.addEventListener('input', debouncedSync);
        document.addEventListener('change', debouncedSync);
    },

    // Attach event listeners to current step
    attachEventListeners() {
        // Theme preset buttons
        document.querySelectorAll('[data-theme-preset]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const preset = e.currentTarget.dataset.themePreset;
                utils.applyThemePreset(preset);
            });
        });

        // File upload handlers
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', async (e) => {
                const targetId = e.target.dataset.target;
                if (targetId) {
                    await utils.handleMediaUpload(e.target, targetId);
                }
            });
        });

        // Input previews
        document.querySelectorAll('[data-preview]').forEach(input => {
            input.addEventListener('input', (e) => {
                const previewId = e.target.dataset.preview;
                utils.updatePreview(previewId, e.target.value);
            });
        });
    },

    // Attach page manager listeners
    attachPageManagerListeners() {
        // Toggle switches
        document.querySelectorAll('.page-toggle').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                const pageId = e.target.dataset.pageId;
                const isEnabled = e.target.checked;
                this.togglePage(pageId, isEnabled);
            });
        });

        // Drag and drop
        document.querySelectorAll('.page-manager-item').forEach(item => {
            item.draggable = true;
            item.addEventListener('dragstart', this.handleDragStart.bind(this));
            item.addEventListener('dragend', this.handleDragEnd.bind(this));
            item.addEventListener('dragover', this.handleDragOver.bind(this));
            item.addEventListener('dragleave', this.handleDragLeave.bind(this));
            item.addEventListener('drop', this.handleDrop.bind(this));
        });
    },

    // Toggle page enabled/disabled
    togglePage(pageId, isEnabled) {
        if (CONFIG.pageConfig && CONFIG.pageConfig.pages && CONFIG.pageConfig.pages[pageId]) {
            CONFIG.pageConfig.pages[pageId].enabled = isEnabled;

            // Mutually exclusive logic for Final Lock (page-9) and Infinity Scroll (page-10)
            const endingPages = ['page-9', 'page-10'];
            if (endingPages.includes(pageId) && isEnabled) {
                endingPages.forEach(id => {
                    if (id !== pageId && CONFIG.pageConfig.pages[id]) {
                        CONFIG.pageConfig.pages[id].enabled = false;
                    }
                });
            }

            // Re-render page manager to show updated toggles
            this.recalcWizardSteps(); // CRITICAL: Update steps array immediately
            this.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    // Drag and drop handlers
    dragSrcId: null,

    handleDragStart(e) {
        this.dragSrcId = e.currentTarget.dataset.id;
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    },

    handleDragEnd(e) {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.page-manager-item').forEach(item => {
            item.classList.remove('drag-over');
        });
    },

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
        return false;
    },

    handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    },

    handleDrop(e) {
        e.stopPropagation();
        const targetId = e.currentTarget.dataset.id;

        if (this.dragSrcId && this.dragSrcId !== targetId) {
            this.reorderPages(this.dragSrcId, targetId);
        }
        return false;
    },

    // Reorder pages
    reorderPages(fromId, toId) {
        const allPages = state.getPages(false);
        const fromIndex = allPages.findIndex(p => p.id === fromId);
        const toIndex = allPages.findIndex(p => p.id === toId);

        if (fromIndex === -1 || toIndex === -1) return;

        const item = allPages.splice(fromIndex, 1)[0];
        allPages.splice(toIndex, 0, item);

        // Update order property
        allPages.forEach((p, i) => {
            p.order = i + 1;
        });

        this.renderCurrentStep();
        state.save();
        state.syncToPreview();
    }
};

// Make app globally available
if (typeof window !== 'undefined') {
    window.app = app;
}