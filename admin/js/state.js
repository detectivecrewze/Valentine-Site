// State Management Module - FIXED VERSION

const state = {
    // Current wizard step index
    currentStep: 0,

    // Calculated wizard steps (changes based on enabled pages)
    wizardSteps: [],

    // ✅ FIX: This is now the ABSOLUTE SOURCE OF TRUTH
    // All data is stored here, never read from DOM
    configData: {
        pages: [],
        // ✅ NEW: Store all form values here
        theme: {
            backgroundColor: '#F5E6D3',
            fontDisplay: 'Playfair Display, serif',
            fontSans: 'Poppins, sans-serif',
            particles: 'hearts',
            backgroundImage: ''
        },
        navigation: {
            showPageIndicator: true,
            enableSwipe: true
        },
        login: {
            password: 'cintaislam1234512345',
            errorMessage: "Incorrect password, try again!",
            collectionText: 'For you, Always',
            title: 'Key to My Heart',
            instruction: 'Enter the secret password',
            placeholder: "*your secret word...*"
        },
        countdown: {
            targetDate: '2026-02-14T22:00:00Z',
            finishMessage: "It's Time! ❤️",
            finishLabel: "Happy Valentine's Day!"
        },
        greeting: {
            title: "Happy Valentine's Day",
            message: 'You mean the world to me',
            imageSrc: '',
            signature: 'With all my love',
            footerText: '♥'
        },
        metadata: {
            brandName: 'For you, Always',
            brandIcon: 'diamond',
            customerName: '',
            generatedAt: new Date().toISOString()
        },
        adminLang: 'en'
    },

    // Debounce timer for sync
    syncTimer: null,
    statusTimer: null,

    // Initialize state from CONFIG or localStorage
    init() {
        this.ensurePageConfig();
        this.loadFromStorage();
    },

    // Ensure CONFIG.pageConfig exists
    ensurePageConfig() {
        if (typeof CONFIG === 'undefined') {
            window.CONFIG = {};
        }
        if (!CONFIG.pageConfig) {
            CONFIG.pageConfig = JSON.parse(JSON.stringify(DEFAULT_PAGE_CONFIG));
        }
    },

    // ✅ IMPROVED: Load data from localStorage or CONFIG, merging with defaults
    loadFromStorage() {
        // 1. ALWAYS load from existing CONFIG first if available (from data.js)
        // This ensures data.js values are the baseline defaults
        if (typeof CONFIG !== 'undefined') {
            this.loadFromExistingConfig();
            console.log('[State] 📊 Baseline loaded from data.js');
        } else {
            this.loadDefaultPages();
            console.log('[State] ⚠️ No data.js found, using hardcoded defaults');
        }

        // 2. THEN overwrite with localStorage if available
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.restoreFromConfig(data);
                console.log('[State] 🔄 Merged with localStorage data');
                return true;
            } catch (e) {
                console.error('[State] ❌ LocalStorage load failed:', e);
            }
        }

        return false;
    },

    // ✅ NEW: Load from existing CONFIG (preserves user data from data.js)
    loadFromExistingConfig() {
        // Merge existing CONFIG values into configData
        if (CONFIG.theme) {
            this.configData.theme = { ...this.configData.theme, ...CONFIG.theme };
        }
        if (CONFIG.navigation) {
            this.configData.navigation = { ...this.configData.navigation, ...CONFIG.navigation };
        }
        if (CONFIG.login) {
            this.configData.login = { ...this.configData.login, ...CONFIG.login };
        }
        if (CONFIG.countdown) {
            this.configData.countdown = { ...this.configData.countdown, ...CONFIG.countdown };
        }
        if (CONFIG.greeting) {
            this.configData.greeting = { ...this.configData.greeting, ...CONFIG.greeting };
        }
        if (CONFIG.metadata) {
            this.configData.metadata = { ...this.configData.metadata, ...CONFIG.metadata };
            // Ensure brand defaults if not in CONFIG
            if (!this.configData.metadata.brandName) this.configData.metadata.brandName = 'For you, Always';
            if (!this.configData.metadata.brandIcon) this.configData.metadata.brandIcon = 'diamond';
        }

        if (CONFIG.adminLang) {
            this.configData.adminLang = CONFIG.adminLang;
        }

        // Load pages from CONFIG
        this.configData.pages = [];

        // Music Page
        if (CONFIG.music && CONFIG.music.length > 0) {
            this.configData.pages.push({
                pageId: 'page-3',
                type: 'music-section',
                songTitle: CONFIG.musicSectionTitle || 'Our Playlist',
                music: CONFIG.music
            });
        } else {
            this.loadDefaultMusicPage();
        }

        // Wrapped Page
        if (CONFIG.wrapped) {
            this.configData.pages.push({
                pageId: 'page-4',
                type: 'wrapped-section',
                ...CONFIG.wrapped
            });
        } else {
            this.loadDefaultWrappedPage();
        }

        // Quiz Page
        if (CONFIG.quiz) {
            this.configData.pages.push({
                pageId: 'page-5',
                type: 'quiz-section',
                title: CONFIG.quiz.title || 'How Well Do You Know Me?',
                resultMessage: CONFIG.quiz.resultMessage || 'You know me so well! ❤️',
                questions: CONFIG.quiz.questions || []
            });
        } else {
            this.loadDefaultQuizPage();
        }

        // Gallery Page
        if (CONFIG.gallery) {
            this.configData.pages.push({
                pageId: 'page-6',
                type: 'gallery-section',
                title: CONFIG.gallery.title || 'Our Memories',
                subtitle: CONFIG.gallery.subtitle || 'Scratch to reveal',
                memories: CONFIG.gallery.memories || []
            });
        } else {
            this.loadDefaultGalleryPage();
        }

        // Map Page
        if (CONFIG.map) {
            this.configData.pages.push({
                pageId: 'page-7',
                type: 'map-section',
                title: CONFIG.map.title || 'The Atlas of Us',
                description: CONFIG.map.description || '',
                locations: (CONFIG.map.locations || []).map(loc => ({
                    lat: loc.coordinates[0],
                    lng: loc.coordinates[1],
                    title: loc.title || '',
                    memory: loc.memory || '',
                    date: loc.date || '',
                    imageSrc: loc.imageSrc || '',
                    icon: loc.icon || 'favorite'
                }))
            });
        } else {
            this.loadDefaultMapPage();
        }

        // Letter Page
        if (CONFIG.letter) {
            this.configData.pages.push({
                pageId: 'page-8',
                type: 'letter-section',
                recipient: CONFIG.letter.recipientName || 'Dearest Love',
                message: CONFIG.letter.message || '',
                signature: CONFIG.letter.signature || 'Your Favorite Person',
                finaleChoice: CONFIG.letter.finaleChoice || 'choice'
            });
        } else {
            this.loadDefaultLetterPage();
        }

        // Lock Page
        if (CONFIG.lock) {
            this.configData.pages.push({
                pageId: 'page-9',
                type: 'lock-section',
                initials: CONFIG.lock.initials || 'A + B',
                instruction: CONFIG.lock.instruction || 'Click to lock our love forever...',
                finalMessage: CONFIG.lock.finalMessage || 'Safely locked in my heart. Always.'
            });
        } else {
            this.loadDefaultLockPage();
        }

        // Infinity Scroll Page
        if (CONFIG.infinityScroll) {
            this.configData.pages.push({
                pageId: 'page-10',
                type: 'infinity-section',
                headerTitle: CONFIG.infinityScroll.headerTitle || 'I love you because...',
                headerSubtitle: CONFIG.infinityScroll.headerSubtitle || 'An endless collection of reasons',
                reasons_generic: CONFIG.infinityScroll.reasons?.generic || [],
                reasons_personal: CONFIG.infinityScroll.reasons?.personal || [],
                reasons_poetic: CONFIG.infinityScroll.reasons?.poetic || [],
                photos: CONFIG.infinityScroll.photos || []
            });
        } else {
            this.loadDefaultInfinityPage();
        }
    },

    // Load default page structure
    loadDefaultPages() {
        this.configData.pages = [];
        this.loadDefaultMusicPage();
        this.loadDefaultWrappedPage();
        this.loadDefaultQuizPage();
        this.loadDefaultGalleryPage();
        this.loadDefaultMapPage();
        this.loadDefaultLetterPage();
        this.loadDefaultLockPage();
        this.loadDefaultInfinityPage();
    },

    loadDefaultMusicPage() {
        this.configData.pages.push({
            pageId: 'page-3',
            type: 'music-section',
            songTitle: 'Our Playlist',
            music: [
                { songTitle: "Selfless", artist: "The Strokes", audioSrc: "assets/song1.dat", coverSrc: "assets/cover1.jpg", lyrics: "Life is too short..." },
                { songTitle: "Ivy", artist: "Frank Ocean", audioSrc: "assets/song2.dat", coverSrc: "assets/cover2.jpg", lyrics: "I thought that I was dreaming..." }
            ]
        });
    },

    loadDefaultWrappedPage() {
        this.configData.pages.push({
            pageId: 'page-4',
            type: 'wrapped-section',
            vibeLabel: "Our Vibe",
            vibe: "Bonnie & Clyde",
            HoursTogetherLabel: "Minutes Together",
            HoursTogether: "525,600",
            imageSrc: "assets/images/photo2.jpg",
            topPlaces: ["The Sunset Pier", "Corner Bakery", "Botanical Garden"],
            coreMemories: ["The Rainy Hike", "First Road Trip", "Cooking Fail"]
        });
    },

    loadDefaultQuizPage() {
        this.configData.pages.push({
            pageId: 'page-5',
            type: 'quiz-section',
            title: 'How Well Do You Know Me?',
            resultMessage: 'You know me so well! ❤️',
            questions: [
                { question: "Where was our very first date?", options: ["Starbucks", "Cinema", "Park", "Restaurant"], correctIndex: 0, correctMessage: "You remembered! ❤️", wrongMessage: "Try again!" }
            ]
        });
    },

    loadDefaultGalleryPage() {
        this.configData.pages.push({
            pageId: 'page-6',
            type: 'gallery-section',
            title: 'Our Memories',
            subtitle: 'Scratch to reveal',
            memories: [
                { type: 'image', src: 'assets/images/photo2.jpg', caption: 'Our first coffee', tape: 'washi-tape-gold', rotation: 'rotate-2' }
            ]
        });
    },

    loadDefaultMapPage() {
        this.configData.pages.push({
            pageId: 'page-7',
            type: 'map-section',
            title: 'The Atlas of Us',
            description: 'Every pin is a heartbeat, every line a path we walked together.',
            locations: [
                { lat: -6.24625885, lng: 106.9913550, title: "Where we first met", memory: "The air was sweet...", date: "2020-01-20" }
            ]
        });
    },

    loadDefaultLetterPage() {
        this.configData.pages.push({
            pageId: 'page-8',
            type: 'letter-section',
            recipient: 'Dearest Love',
            message: 'I find myself sitting here, thinking about all the moments we\'ve shared...',
            signature: 'Your Favorite Person'
        });
    },

    loadDefaultLockPage() {
        this.configData.pages.push({
            pageId: 'page-9',
            type: 'lock-section',
            initials: 'A + B',
            instruction: 'Click to lock our love forever...',
            finalMessage: 'Safely locked in my heart. Always.'
        });
    },

    loadDefaultInfinityPage() {
        this.configData.pages.push({
            pageId: 'page-10',
            type: 'infinity-section',
            headerTitle: 'I love you because...',
            headerSubtitle: 'An endless collection of reasons',
            reasons_generic: ["...your smile lights up the room", "...you make me a better person"],
            reasons_personal: ["...of how we met that one rainy day"],
            reasons_poetic: ["...you are the melody to my song"],
            photos: []
        });
    },

    // Restore state from saved configuration
    restoreFromConfig(data) {
        // Support both old and new save formats
        const config = data.config || data;
        const pages = data.pages;

        if (pages && Array.isArray(pages) && pages.length > 0) {
            this.configData.pages = pages;
        }

        // ✅ RESTORE ALL CATEGORIES
        if (config.theme) this.configData.theme = { ...this.configData.theme, ...config.theme };
        if (config.navigation) this.configData.navigation = { ...this.configData.navigation, ...config.navigation };
        if (config.login) this.configData.login = { ...this.configData.login, ...config.login };
        if (config.countdown) this.configData.countdown = { ...this.configData.countdown, ...config.countdown };
        if (config.greeting) this.configData.greeting = { ...this.configData.greeting, ...config.greeting };
        if (config.metadata) this.configData.metadata = { ...this.configData.metadata, ...config.metadata };

        // Restore top-level state
        if (config.adminLang) this.configData.adminLang = config.adminLang;
        if (config.currentStep !== undefined) this.currentStep = config.currentStep;

        if (config.pageConfig) {
            CONFIG.pageConfig = config.pageConfig;
        }
    },

    // Save current state to localStorage
    save() {
        try {
            const dataToSave = {
                config: this.getConfig(),
                pages: this.configData.pages
            };
            localStorage.setItem(LS_KEY, JSON.stringify(dataToSave));
            // Update UI status if available
            const statusEl = document.getElementById('saveStatus');
            const statusText = document.getElementById('saveStatusText');
            if (statusEl && statusText) {
                const now = new Date();
                const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                statusText.textContent = `${t('status_autosaved')} ${timeStr}`;
                statusEl.classList.remove('opacity-0');

                // Keep visible for 3 seconds then fade slightly
                if (this.statusTimer) clearTimeout(this.statusTimer);
                this.statusTimer = setTimeout(() => {
                    statusEl.classList.add('opacity-50');
                }, 3000);
            }

            console.log('[State] ✅ Saved to localStorage');
            return true;
        } catch (e) {
            console.error('[State] ❌ Save failed:', e);
            const statusText = document.getElementById('saveStatusText');
            if (statusText) statusText.textContent = t('notif_error');
            return false;
        }
    },

    // ✅ CRITICAL FIX: Get config from STATE, not DOM
    getConfig() {
        // Extract page data from state
        const wrappedPage = this.configData.pages.find(p => p.type === 'wrapped-section');
        const quizPage = this.configData.pages.find(p => p.type === 'quiz-section');
        const musicPage = this.configData.pages.find(p => p.type === 'music-section');
        const galleryPage = this.configData.pages.find(p => p.type === 'gallery-section');
        const mapPage = this.configData.pages.find(p => p.type === 'map-section');
        const letterPage = this.configData.pages.find(p => p.type === 'letter-section');
        const lockPage = this.configData.pages.find(p => p.type === 'lock-section');
        const infinityPage = this.configData.pages.find(p => p.type === 'infinity-section');

        return {
            theme: this.configData.theme,
            navigation: this.configData.navigation,
            login: this.configData.login,
            countdown: this.configData.countdown,
            greeting: this.configData.greeting,
            wrapped: wrappedPage ? {
                vibeLabel: wrappedPage.vibeLabel || "Our Vibe",
                vibe: wrappedPage.vibe || "",
                HoursTogetherLabel: wrappedPage.HoursTogetherLabel || "Hours Together",
                HoursTogether: wrappedPage.HoursTogether || "",
                imageSrc: wrappedPage.imageSrc || "",
                topPlacesLabel: wrappedPage.topPlacesLabel || "Top Places We've Been",
                topPlaces: wrappedPage.topPlaces || [],
                coreMemoriesLabel: wrappedPage.coreMemoriesLabel || "Core Memories",
                coreMemories: wrappedPage.coreMemories || []
            } : null,
            quiz: quizPage ? {
                title: quizPage.title,
                questions: quizPage.questions,
                resultMessage: quizPage.resultMessage
            } : null,
            music: musicPage ? musicPage.music : [],
            musicSectionTitle: musicPage ? musicPage.songTitle : 'Our Playlist',
            gallery: galleryPage ? {
                title: galleryPage.title,
                subtitle: galleryPage.subtitle,
                memories: galleryPage.memories
            } : null,
            map: mapPage ? {
                title: mapPage.title,
                description: mapPage.description,
                locations: (mapPage.locations || []).map(loc => ({
                    coordinates: [loc.lat, loc.lng],
                    title: loc.title || '',
                    memory: loc.memory || '',
                    date: loc.date || '',
                    imageSrc: loc.imageSrc || '',
                    icon: loc.icon || 'favorite'
                }))
            } : null,
            letter: letterPage ? {
                recipientName: letterPage.recipient || '',
                message: letterPage.message || '',
                signature: letterPage.signature || '',
                finaleChoice: letterPage.finaleChoice || 'choice'
            } : null,
            lock: lockPage ? {
                initials: lockPage.initials || '',
                instruction: lockPage.instruction || '',
                finalMessage: lockPage.finalMessage || ''
            } : null,
            infinityScroll: infinityPage ? {
                headerTitle: infinityPage.headerTitle || 'I love you because...',
                headerSubtitle: infinityPage.headerSubtitle || 'An endless collection of reasons',
                reasons: {
                    generic: infinityPage.reasons_generic || [],
                    personal: infinityPage.reasons_personal || [],
                    poetic: infinityPage.reasons_poetic || []
                },
                photos: infinityPage.photos || []
            } : null,
            metadata: {
                brandName: this.configData.metadata.brandName || 'For you, Always',
                brandIcon: this.configData.metadata.brandIcon || 'diamond',
                customerName: this.configData.metadata.customerName || '',
                generatedAt: new Date().toISOString()
            },
            adminLang: this.configData.adminLang || 'en',
            currentStep: this.currentStep || 0,
            pageConfig: CONFIG.pageConfig
        };
    },

    // ✅ NEW: Update state fields directly (called by input handlers)
    updateField(category, field, value) {
        if (!this.configData[category]) {
            this.configData[category] = {};
        }
        this.configData[category][field] = value;
        console.log(`[State] Updated ${category}.${field}:`, value);
        this.save();
        this.syncToPreview();
    },

    // Sync configuration to preview iframe
    syncToPreview() {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        this.syncTimer = setTimeout(() => {
            const config = this.getConfig();
            console.log('[State] Syncing to preview...');

            const iframe = document.getElementById('previewIframe');
            if (iframe && iframe.contentWindow && iframe.getAttribute('src')) {
                iframe.contentWindow.postMessage({
                    type: 'UPDATE_CONFIG',
                    config: config
                }, '*');
            }

            const modalIframe = document.getElementById('previewModalIframe');
            if (modalIframe && modalIframe.contentWindow && modalIframe.getAttribute('src')) {
                modalIframe.contentWindow.postMessage({
                    type: 'UPDATE_CONFIG',
                    config: config
                }, '*');
            }
        }, 300);
    },

    syncToPreviewImmediate() {
        const config = this.getConfig();
        console.log('[State] Immediate sync to preview');

        const iframe = document.getElementById('previewIframe');
        if (iframe && iframe.contentWindow && iframe.getAttribute('src')) {
            iframe.contentWindow.postMessage({
                type: 'UPDATE_CONFIG',
                config: config
            }, '*');
        }

        const modalIframe = document.getElementById('previewModalIframe');
        if (modalIframe && modalIframe.contentWindow && modalIframe.getAttribute('src')) {
            modalIframe.contentWindow.postMessage({
                type: 'UPDATE_CONFIG',
                config: config
            }, '*');
        }
    },

    getPages(enabledOnly = true) {
        const pages = Object.values(CONFIG.pageConfig.pages)
            .sort((a, b) => a.order - b.order);
        return enabledOnly ? pages.filter(p => p.enabled) : pages;
    },

    findPageById(pageId) {
        const page = this.configData.pages.find(p => p.pageId === pageId);
        return page || null;
    },

    updatePageData(pageId, data) {
        const index = this.configData.pages.findIndex(p => p.pageId === pageId);
        if (index !== -1) {
            this.configData.pages[index] = { ...this.configData.pages[index], ...data };
        } else {
            this.configData.pages.push({ pageId, ...data });
        }
        this.save();
        this.syncToPreview();
    },

    setLanguage(lang) {
        this.configData.adminLang = lang;
        this.save();
        // Since many things are rendered dynamically, we need to refresh the current view
        if (window.app) {
            app.renderCurrentStep();
            app.updateHeader();
        }
        console.log(`[State] Language changed to: ${lang}`);
    }
};

// Initialize state on load
if (typeof window !== 'undefined') {
    window.state = state;
}
