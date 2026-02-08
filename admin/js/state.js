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
        pageConfig: null, // 🚀 Will be initialized by ensurePageConfig
        theme: {
            backgroundColor: '#ffe5ec',
            fontDisplay: 'Cinzel, serif',
            fontSans: 'Cormorant Garamond, serif',
            particles: 'hearts',
            backgroundImage: ''
        },
        navigation: {
            showPageIndicator: true,
            enableSwipe: false
        },
        login: {
            password: '123',
            errorMessage: "Incorrect password, try again!",
            collectionText: 'For you, Always',
            title: 'Key to My Heart',
            instruction: 'Enter the secret password',
            placeholder: "*your secret word...*"
        },
        countdown: {
            targetDate: '2026-02-05T15:00:00.000Z',
            finishMessage: "It's Time! ❤️",
            finishLabel: "Happy Valentine's Day!"
        },
        greeting: {
            title: "Happy Valentine's Day",
            message: "I make this for you, since i've been thinking about you lately, and i want to do something nice for you.",
            imageSrc: 'https://valentine-upload.aldoramadhan16.workers.dev/1769804948149-czoxq7.jpg',
            signature: 'With all my love',
            footerText: '♥'
        },
        metadata: {
            brandName: 'For you, Always',
            brandIcon: 'diamond',
            customerName: '',
            generatedAt: '2026-02-02T00:09:42.276Z'
        },
        adminLang: 'id'
    },

    // Debounce timer for sync
    syncTimer: null,
    statusTimer: null,

    // Initialize state from CONFIG or localStorage
    init() {
        this.ensurePageConfig();
        this.loadFromStorage();
    },

    // Ensure configData.pageConfig exists and is synced with global CONFIG
    ensurePageConfig() {
        if (typeof CONFIG === 'undefined') {
            window.CONFIG = {};
        }

        // Initialize internal pageConfig if missing
        if (!this.configData.pageConfig) {
            this.configData.pageConfig = JSON.parse(JSON.stringify(DEFAULT_PAGE_CONFIG));
        }

        // Keep global CONFIG in sync for other components
        if (!CONFIG.pageConfig) {
            CONFIG.pageConfig = this.configData.pageConfig;
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

    // ✅ NEW: Import from published website link
    async importFromLink(input) {
        if (!input) return;

        // Extract ID from URL if necessary
        let id = input;
        if (input.includes('?to=')) {
            id = input.split('?to=')[1].split('&')[0];
        } else if (input.includes('?id=')) {
            id = input.split('?id=')[1].split('&')[0];
        } else if (input.includes('/')) {
            // Might be a clean URL or something else
            const parts = input.split('/');
            id = parts[parts.length - 1] || parts[parts.length - 2];
        }

        if (!id) {
            alert('Invalid link or ID');
            return;
        }

        try {
            console.log('[State] 📥 Importing from:', id);
            const response = await fetch(`https://valentine-upload.aldoramadhan16.workers.dev/get-config?id=${encodeURIComponent(id)}&_t=${Date.now()}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch: ${response.status}`);
            }

            const data = await response.json();

            if (confirm('Importing will overwrite your current unsaved progress. Continue?')) {
                // Restore state from this config
                this.restoreFromConfig(data);

                // Save to localStorage so it persists
                this.save();

                // Reload UI
                app.init();

                alert('Successfully imported data from: ' + id);
            }
        } catch (e) {
            console.error('[State] ❌ Import failed:', e);
            alert('Failed to import data. Please check the ID and try again.');
        }
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
                type: 'music',
                songTitle: CONFIG.musicSectionTitle || '',
                music: CONFIG.music
            });
        } else {
            this.loadDefaultMusicPage();
        }

        // Wrapped Page
        if (CONFIG.wrapped) {
            this.configData.pages.push({
                pageId: 'page-4',
                type: 'wrapped',
                ...CONFIG.wrapped
            });
        } else {
            this.loadDefaultWrappedPage();
        }

        // Quiz Page
        if (CONFIG.quiz) {
            this.configData.pages.push({
                pageId: 'page-5',
                type: 'quiz',
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
                type: 'gallery',
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
                type: 'map',
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
                type: 'letter',
                recipient: CONFIG.letter.recipient || CONFIG.letter.recipientName || 'Dearest Love',
                message: CONFIG.letter.message || '',
                signature: CONFIG.letter.signature || 'Your Favorite Person',
                stampSrc: CONFIG.letter.stampSrc || 'assets/stamp.png',
                polaroidSrc: CONFIG.letter.polaroidSrc || '',
                polaroidCaption: CONFIG.letter.polaroidCaption || 'Us, 2024 ♡',
                finaleChoice: CONFIG.letter.finaleChoice || 'choice'
            });
        } else {
            this.loadDefaultLetterPage();
        }

        // Lock Page
        if (CONFIG.lock) {
            this.configData.pages.push({
                pageId: 'page-9',
                type: 'lock',
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
                type: 'infinity',
                headerTitle: CONFIG.infinityScroll.headerTitle || 'I love you because...',
                headerSubtitle: CONFIG.infinityScroll.headerSubtitle || 'An endless collection of reasons',
                reasons_generic: CONFIG.infinityScroll.reasons?.generic || [],
                reasons_personal: CONFIG.infinityScroll.reasons?.personal || [],
                reasons_poetic: CONFIG.infinityScroll.reasons?.poetic || [],
                photos: CONFIG.infinityScroll.photos || [],
                videoMemories: CONFIG.infinityScroll.videoMemories || [],
                music: CONFIG.infinityScroll.music || {}
            });
        } else {
            this.loadDefaultInfinityPage();
        }

        // Invitation Page
        if (CONFIG.invitation) {
            this.configData.pages.push({
                pageId: 'page-11',
                type: 'invitation',
                question: CONFIG.invitation.question || 'Would you like to be my Valentine?',
                bearDefault: CONFIG.invitation.bearDefault || 'https://media.tenor.com/63IENW605s0AAAAi/dudu-twisting-dance.gif',
                bearSuccess: CONFIG.invitation.bearSuccess || 'https://media.tenor.com/0_jT8Pyszi8AAAAi/bubu-dudu-dudu-carry.gif',
                successMessage: CONFIG.invitation.successMessage || 'Yay! ❤️'
            });
        } else {
            this.loadDefaultInvitationPage();
        }

        // Load pageConfig if exists
        if (CONFIG.pageConfig) {
            this.configData.pageConfig = JSON.parse(JSON.stringify(CONFIG.pageConfig));
        }
    },

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
        this.loadDefaultInvitationPage();
    },

    loadDefaultMusicPage() {
        this.configData.pages.push({
            pageId: 'page-3',
            type: 'music',
            songTitle: '',
            music: [
                { songTitle: "Selfless", artist: "The Strokes", audioSrc: "https://valentine-upload.aldoramadhan16.workers.dev/1769897932779-xfl03b.mp3", coverSrc: "assets/cover1.jpg", lyrics: "Life is too short, but i will live for you" },
                { songTitle: "Ivy", artist: "Frank Ocean", audioSrc: "https://valentine-upload.aldoramadhan16.workers.dev/1769773133105-34968d.mp3", coverSrc: "assets/cover2.jpg", lyrics: "I thought that I was dreaming when you said that you loves me.." }
            ]
        });
    },

    loadDefaultWrappedPage() {
        this.configData.pages.push({
            pageId: 'page-4',
            type: 'wrapped',
            vibeLabel: "Our Vibe",
            vibe: "Bonnie & Clyde",
            HoursTogetherLabel: "hours Together",
            HoursTogether: "525,600",
            imageSrc: "https://valentine-upload.aldoramadhan16.workers.dev/1769734795217-t4uwbr.jpg",
            topPlaces: ["The Sunset Pier ", "Corner Bakery", "Botanical Garden"],
            coreMemories: ["The Rainy Hike", "First Road Trip", "Cooking Fail"]
        });
    },

    loadDefaultQuizPage() {
        this.configData.pages.push({
            pageId: 'page-5',
            type: 'quiz',
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
            type: 'gallery',
            title: 'Our Memories',
            subtitle: 'Scratch to reveal',
            memories: [
                { type: 'image', src: 'https://valentine-upload.aldoramadhan16.workers.dev/1769805139619-pxnlnf.jpg', caption: 'Our Kiss That Day.', secretNote: '', tape: 'washi-tape', rotation: 'rotate-2' },
                { type: 'image', src: 'https://valentine-upload.aldoramadhan16.workers.dev/1769805183715-20618q.jpg', caption: "We're Dancing While Watching The Sunrise.", secretNote: '', tape: 'washi-tape-gold', rotation: 'rotate-2' },
                { type: 'image', src: 'https://valentine-upload.aldoramadhan16.workers.dev/1769805230987-7ty5b.jpg', caption: 'Our Trip To Berlin!', secretNote: '', tape: 'washi-tape', rotation: 'rotate-2' },
                { type: 'image', src: 'https://valentine-upload.aldoramadhan16.workers.dev/1769805276131-cts88.jpg', caption: "We're Getting Ready For The Dates.", secretNote: '', tape: 'washi-tape', rotation: 'rotate-2' },
                { type: 'image', src: 'https://valentine-upload.aldoramadhan16.workers.dev/1769805302423-nfl0um.jpg', caption: 'Watching The Swains As They Past.', secretNote: '', tape: 'washi-tape', rotation: 'rotate-2' },
                { type: 'image', src: 'https://valentine-upload.aldoramadhan16.workers.dev/1769805374361-oqdib.jpg', caption: 'That Night When We Go Nowhere.', secretNote: '', tape: 'washi-tape', rotation: 'rotate-2' }
            ]
        });
    },


    loadDefaultMapPage() {
        this.configData.pages.push({
            pageId: 'page-7',
            type: 'map',
            title: 'The Atlas of Us',
            description: 'Every pin is a heartbeat, every line a path we walked together.',
            locations: [
                { lat: -6.24625885, lng: 106.9913550, title: "Where we first met.", memory: "The air was sweet...", date: "2020-01-20", imageSrc: "https://valentine-upload.aldoramadhan16.workers.dev/1769735563998-z1hev.jpg", icon: "favorite" },
                { lat: -6.300681, lng: 106.636572, title: "Where you kiss me for the first time.", memory: "The Moments Was Just Perfect.", date: "2020-02-25", imageSrc: "https://valentine-upload.aldoramadhan16.workers.dev/1769805492176-k2bc5u.jpg", icon: "favorite" },
                { lat: -6.824732, lng: 107.438125, title: "Trip to Beach !!", memory: "Our First Trip Ever !!", date: "2021-05-21", imageSrc: "https://valentine-upload.aldoramadhan16.workers.dev/1769805546306-4o1wr.jpg", icon: "favorite" }
            ]
        });
    },

    loadDefaultLetterPage() {
        this.configData.pages.push({
            pageId: 'page-8',
            type: 'letter',
            recipient: 'Dearest Lisa',
            message: "I find myself sitting here, thinking about all the moments we've shared... and it feels like I’m watching the most beautiful movie play out in my mind. It’s not just the big milestones or the dates on the calendar that stick with me; it’s the quiet spaces in between. It’s the way you look at me when you think I’m not noticing, the sound of your laugh filling a room, and the comfort of sitting in silence with you and feeling completely understood.\n\nLooking back, I realize how much you have colored my world. Before you, things were just ordinary. Now, everything seems to have more depth, more meaning. You’ve become the first person I want to tell when something good happens, and the only person I want to hold when the world feels heavy. You are my safe harbor, the place where I can finally just breathe and be myself without fear or pretense.",
            signature: 'Your Favorite Person',
            stampSrc: 'assets/stamp.png',
            polaroidSrc: 'https://valentine-upload.aldoramadhan16.workers.dev/1769894647359-3oq81.jpg',
            polaroidCaption: 'Love You.',
            finaleChoice: 'choice'
        });
    },

    loadDefaultLockPage() {
        this.configData.pages.push({
            pageId: 'page-9',
            type: 'lock',
            initials: 'A + B',
            instruction: 'Click to lock our love forever...',
            finalMessage: 'Safely locked in my heart. Always.'
        });
    },

    loadDefaultInfinityPage() {
        this.configData.pages.push({
            pageId: 'page-10',
            type: 'infinity',
            headerTitle: 'I love you because...',
            headerSubtitle: 'An endless collection of reasons',
            reasons_generic: [
                "...your smile lights up the room",
                "...you make me a better person",
                "...The way you look at me",
                "...Senyummu menerangi duniaku",
                "...Kamu bikin aku ketawa lepas",
                "...Kebaikanmu menginspirasiku",
                "...Kamu adalah tempat ternyamanku",
                "...Cara kamu menatapku"
            ],
            reasons_personal: [
                "...of how we met that one rainy day",
                "...ingat hari hujan pas kita pertama ketemu",
                "...kamu masih ingat pesanan kopiku",
                "...kamu berdansa denganku di dapur",
                "...jalan-jalan tengah malam kita cari makan",
                "...kamu ketawa denger jokes recehku"
            ],
            reasons_poetic: [
                "...you are the melody to my song",
                "...kamu adalah melodi dalam laguku",
                "...jantungku berdebar saat kamu dekat",
                "...kamu jawaban dari doa yang tak terucap",
                "...mencintaimu rasanya seperti pulang ke rumah",
                "...kamu adalah bab favorit dalam hidupku"
            ],
            photos: [
                { src: "https://valentine-upload.aldoramadhan16.workers.dev/1769789202159-7uqa2b.png", caption: "" },
                { src: "https://valentine-upload.aldoramadhan16.workers.dev/1769789221789-206zr.jpg", caption: "" }
            ],
            videoMemories: [
                { url: "https://valentine-upload.aldoramadhan16.workers.dev/1769967296922-6qaedg.mp4", caption: "Kamu Bau", milestone: 25 }
            ],
            music: {
                audioSrc: 'https://valentine-upload.aldoramadhan16.workers.dev/1769968365113-zkoe64.mp3',
                songTitle: '',
                artist: ''
            }
        });
    },

    loadDefaultInvitationPage() {
        this.configData.pages.push({
            pageId: 'page-11',
            type: 'invitation',
            question: 'Would you like to be my Valentine?',
            bearDefault: 'https://media.tenor.com/63IENW605s0AAAAi/dudu-twisting-dance.gif',
            bearSuccess: 'https://media.tenor.com/0_jT8Pyszi8AAAAi/bubu-dudu-dudu-carry.gif',
            successMessage: 'Yay! ❤️'
        });
    },

    // Restore state from saved configuration
    restoreFromConfig(data) {
        // Support both old and new save formats
        const config = data.config || data;
        const pages = data.pages;

        if (pages && Array.isArray(pages) && pages.length > 0) {
            // Migration: Strip '-section' from older types
            this.configData.pages = pages.map(p => ({
                ...p,
                type: p.type ? p.type.replace('-section', '') : p.type
            }));
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
            this.configData.pageConfig = config.pageConfig;
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
        // Extract page data from state with robust fallback (Type first, then ID)
        const findPage = (type, id) => {
            return this.configData.pages.find(p => p.type === type) ||
                this.configData.pages.find(p => p.pageId === id);
        };

        const wrappedPage = findPage('wrapped', 'page-3');
        const quizPage = findPage('quiz', 'page-5');
        const musicPage = findPage('music', 'page-2');
        const galleryPage = findPage('gallery', 'page-4');
        const mapPage = findPage('map', 'page-7');
        const letterPage = findPage('letter', 'page-8');
        const lockPage = findPage('lock', 'page-9');
        const infinityPage = findPage('infinity', 'page-10');
        const invitationPage = findPage('invitation', 'page-11');

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
            musicSectionTitle: musicPage ? musicPage.songTitle : '',
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
                recipient: letterPage.recipient || '',
                message: letterPage.message || '',
                signature: letterPage.signature || '',
                stampSrc: letterPage.stampSrc || 'assets/stamp.png',
                polaroidSrc: letterPage.polaroidSrc || '',
                polaroidCaption: letterPage.polaroidCaption || 'Us, 2024 ♡',
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
                photos: infinityPage.photos || [],
                videoMemories: infinityPage.videoMemories || [],
                music: infinityPage.music || {}
            } : null,
            invitation: invitationPage ? {
                question: invitationPage.question || 'Would you like to be my Valentine?',
                bearDefault: invitationPage.bearDefault || 'https://media.tenor.com/63IENW605s0AAAAi/dudu-twisting-dance.gif',
                bearSuccess: invitationPage.bearSuccess || 'https://media.tenor.com/0_jT8Pyszi8AAAAi/bubu-dudu-dudu-carry.gif',
                successMessage: invitationPage.successMessage || 'Yay! ❤️'
            } : null,
            metadata: {
                brandName: this.configData.metadata.brandName || 'For you, Always',
                brandIcon: this.configData.metadata.brandIcon || 'diamond',
                customerName: this.configData.metadata.customerName || '',
                generatedAt: new Date().toISOString()
            },
            adminLang: this.configData.adminLang || 'en',
            currentStep: this.currentStep || 0,
            pageConfig: this.configData.pageConfig || CONFIG.pageConfig
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
            // Keep existing metadata like 'type' if it's not provided in the new data
            this.configData.pages[index] = { ...this.configData.pages[index], ...data };
        } else {
            // If it's a new page being added, try to infer the type if it's one of our known pages
            const pageTypes = {
                'page-2': 'music',
                'page-3': 'wrapped',
                'page-4': 'gallery',
                'page-5': 'quiz',
                'page-7': 'map',
                'page-8': 'letter',
                'page-9': 'lock',
                'page-10': 'infinity',
                'page-11': 'invitation'
            };
            const type = data.type || pageTypes[pageId] || '';
            this.configData.pages.push({ pageId, type, ...data });
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
    },

    // ✅ NEW: Apply Goal-Oriented Page Preset
    applyPagePreset(presetId) {
        const preset = PAGE_PRESETS[presetId];
        if (!preset) return;

        console.log(`[State] Applying Page Preset: ${presetId}`);

        // 1. Reset all non-required pages to disabled
        Object.keys(this.configData.pageConfig.pages).forEach(id => {
            const p = this.configData.pageConfig.pages[id];
            if (!p.required) {
                p.enabled = false;
            }
        });

        // 2. Enable pages from preset and assign order
        preset.pages.forEach((pageId, index) => {
            const p = this.configData.pageConfig.pages[pageId];
            if (p) {
                p.enabled = true;
                p.order = index + 1;
            }
        });

        // 3. Keep required pages at the top if not in preset (just in case)
        Object.keys(this.configData.pageConfig.pages).forEach(id => {
            const p = this.configData.pageConfig.pages[id];
            if (p.required && !preset.pages.includes(id)) {
                p.order = 0; // Highest priority
            }
        });

        // 4. Save & Refresh
        this.save();
        this.syncToPreview();
        if (window.app) {
            app.renderCurrentStep();
        }
    }
};

// Initialize state on load
if (typeof window !== 'undefined') {
    window.state = state;
}
