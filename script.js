// ============================================================
// 🔧 FIXED: Core Architecture - Reactive CONFIG System
// ============================================================
// This fix prevents "Cannot redefine property: CONFIG" error
// when data.js already declares "const CONFIG = { ... }"

// Store original CONFIG if it exists (from data.js)
const ORIGINAL_CONFIG = typeof CONFIG !== 'undefined' ? { ...CONFIG } : {};
console.log('[BOOT] Script loaded. ORIGINAL_CONFIG keys:', Object.keys(ORIGINAL_CONFIG));
console.log('[BOOT] window.CONFIG exists:', typeof window.CONFIG !== 'undefined');
console.log('[BOOT] typeof CONFIG:', typeof CONFIG);

// Create reactive storage for CONFIG updates
if (!window._CONFIG_DATA) {
    window._CONFIG_DATA = null;
}

/**
 * Safe getter for CONFIG - works regardless of property definition
 * Priority: _CONFIG_DATA (from API) > window.CONFIG (from data.js) > ORIGINAL_CONFIG (backup)
 */
function safeGetConfig() {
    const result = window._CONFIG_DATA || window.CONFIG || ORIGINAL_CONFIG;
    console.log('[safeGetConfig] Returning config with keys:', Object.keys(result || {}).length);
    return result;
}

/**
 * Safe setter for CONFIG - updates internal storage and dispatches events
 */
function safeSetConfig(value) {
    if (!value) return;
    window._CONFIG_DATA = value;

    // Attempt to keep window.CONFIG in sync for iframes and legacy scripts
    try {
        // We set it as a property if possible
        window.CONFIG = value;
    } catch (e) {
        // Expected if 'const CONFIG' exists in data.js
        // In this case, window.CONFIG is already defined by the browser
    }

    console.log('[CONFIG] ✅ Global CONFIG updated reactively');

    // Dispatch custom event for reactivity
    if (typeof CustomEvent !== 'undefined') {
        window.dispatchEvent(new CustomEvent('config-updated', {
            detail: { config: value }
        }));
    }
}

// Initialize with original CONFIG if available
if (ORIGINAL_CONFIG && Object.keys(ORIGINAL_CONFIG).length > 0) {
    console.log('[CONFIG] Initializing with ORIGINAL_CONFIG from data.js');
    safeSetConfig(ORIGINAL_CONFIG);
} else {
    console.warn('[CONFIG] ORIGINAL_CONFIG is empty at boot time!');
    // Try to get from window.CONFIG directly (might be available even if const wasn't captured)
    if (typeof window.CONFIG !== 'undefined' && window.CONFIG && Object.keys(window.CONFIG).length > 0) {
        console.log('[CONFIG] Found window.CONFIG, using that instead');
        safeSetConfig(window.CONFIG);
    }
}

let isNavigating = false;
let currentPageId = 'page-1';
let currentSongIndex = 0;
let mapInstance = null;
let revealedMemories = [];
let transitionTimeout = null;
let musicLoadingPromise = null;
let loadingTargetIndex = null;
let isMusicLoading = false;

const bgMusic = new Audio();
window.bgMusic = bgMusic;
const printerSfx = new Audio();
const scratchSfx = new Audio();
scratchSfx.volume = 0.4;

// ============================================================
// 🚀 DYNAMIC CONFIG SYSTEM - Load from API based on URL parameter
// ============================================================
const API_BASE_URL = 'https://valentine-upload.aldoramadhan16.workers.dev';
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2000;

/**
 * Get customer ID from URL parameter (?to=xxx)
 */
function getCustomerId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('to') || urlParams.get('id');
}

/**
 * Show/hide loading screen
 */
function showLoadingScreen(show, message = 'Loading your Valentine...') {
    const loader = document.getElementById('config-loader');
    const loaderText = document.getElementById('config-loader-text');

    if (loader) {
        if (show) {
            loader.classList.remove('hidden');
            if (loaderText) loaderText.textContent = message;
        } else {
            loader.classList.add('fade-out');
            setTimeout(() => loader.remove(), 500);
        }
    }
}

/**
 * Show error screen when config fails to load
 */
function showConfigError(customerId, error) {
    const loader = document.getElementById('config-loader');
    if (loader) {
        loader.innerHTML = `
            <div class="flex flex-col items-center justify-center p-8 text-center">
                <div class="text-6xl mb-4">💔</div>
                <h2 class="text-2xl font-display text-rose-800 mb-4">Configuration Not Found</h2>
                <p class="text-rose-600 mb-4 max-w-md">
                    We couldn't find a Valentine configuration for "<strong>${customerId}</strong>".
                </p>
                <p class="text-sm text-gray-500 mb-6">Error: ${error}</p>
                <div class="flex gap-3">
                    <button onclick="window.location.href='?'" class="px-6 py-3 bg-rose-500 text-white rounded-xl font-semibold hover:bg-rose-600 transition-all">
                        Use Default Config
                    </button>
                    <button onclick="location.reload()" class="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all">
                        Try Again
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Fetch config from API with cache busting and retry logic
 */
async function loadConfig() {
    const customerId = getCustomerId();

    // If no customer ID in URL, use local CONFIG (backward compatible)
    if (!customerId) {
        console.log('[Config] No customer ID in URL, using local CONFIG');
        console.log('[Config] window.CONFIG exists:', typeof window.CONFIG !== 'undefined');
        console.log('[Config] window.CONFIG keys:', window.CONFIG ? Object.keys(window.CONFIG) : 'N/A');
        const localConfig = safeGetConfig();
        console.log('[Config] localConfig keys:', Object.keys(localConfig || {}).length);
        if (!localConfig || Object.keys(localConfig).length === 0) {
            console.error('[Config] ❌ CRITICAL: Local config is empty!');
            console.error('[Config] ORIGINAL_CONFIG keys:', Object.keys(ORIGINAL_CONFIG).length);
        }
        return localConfig;
    }

    console.log(`[Config] Fetching config for customer: ${customerId}`);

    // Try with retry logic
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
        try {
            // ✅ FIX: Add cache busting to prevent cached 404 responses
            const cacheBuster = `&_t=${Date.now()}_${attempt}`;
            const url = `${API_BASE_URL}/get-config?id=${encodeURIComponent(customerId)}${cacheBuster}`;

            console.log(`[Config] Attempt ${attempt}/${MAX_RETRY_ATTEMPTS}: ${url}`);
            showLoadingScreen(true, `Loading configuration... (attempt ${attempt}/${MAX_RETRY_ATTEMPTS})`);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    // ✅ FIX: Don't immediately fallback - KV might still be propagating
                    if (attempt < MAX_RETRY_ATTEMPTS) {
                        console.warn(`[Config] 404 on attempt ${attempt}, retrying in ${RETRY_DELAY_MS}ms... (KV propagation delay)`);
                        showLoadingScreen(true, `Waiting for configuration to propagate... (${attempt}/${MAX_RETRY_ATTEMPTS})`);
                        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
                        continue;
                    }

                    // Final attempt - config really doesn't exist
                    throw new Error(`Configuration "${customerId}" not found. Please check your link or publish your configuration first.`);
                }
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            console.log('[Config] ✅ Successfully loaded config from API');
            console.log('[Config] Config keys:', Object.keys(data));
            return data;

        } catch (error) {
            console.error(`[Config] Attempt ${attempt} failed:`, error);

            if (attempt < MAX_RETRY_ATTEMPTS) {
                console.log(`[Config] Retrying in ${RETRY_DELAY_MS}ms...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
            } else {
                // All retries exhausted - show error
                console.error('[Config] All retry attempts exhausted');
                showConfigError(customerId, error.message);
                return null; // ✅ FIX: Return null instead of silent fallback
            }
        }
    }

    return null;
}

/**
 * Initialize app with dynamic config - UPDATED VERSION
 */
async function initializeApp() {
    showLoadingScreen(true, 'Initializing your Valentine experience...');

    console.log('[Init] Starting initializeApp...');
    console.log('[Init] window.CONFIG at start:', window.CONFIG ? 'EXISTS' : 'MISSING');

    try {
        // Load config (from API or local)
        let config = await loadConfig();
        console.log('[Init] loadConfig returned:', config ? 'CONFIG object' : 'NULL/EMPTY');
        console.log('[Init] Config keys:', config ? Object.keys(config).length : 0);

        // ✅ FIX: If API config failed or empty, FORCE fallback to local CONFIG
        if (!config || Object.keys(config || {}).length === 0) {
            console.warn('[Config] ⚠️ API config failed or empty, falling back to local data.js');

            // Try safeGetConfig first, then window.CONFIG, then global CONFIG
            const localConfig = safeGetConfig();
            if (localConfig && Object.keys(localConfig).length > 0) {
                config = localConfig;
                console.log('[Config] ✅ Using local config via safeGetConfig()');
            } else if (typeof window.CONFIG !== 'undefined' && window.CONFIG && Object.keys(window.CONFIG).length > 0) {
                config = window.CONFIG;
                console.log('[Config] ✅ Using window.CONFIG directly');
            } else if (typeof CONFIG !== 'undefined' && CONFIG && Object.keys(CONFIG).length > 0) {
                config = CONFIG;
                console.log('[Config] ✅ Using global CONFIG');
            } else {
                console.error('[Config] ❌ No local config available!');
                console.error('[Config] ❌ No config available at all!');
                showLoadingScreen(true, 'Error: No configuration found');
                return;
            }

            // Show subtle indicator that using local config
            setTimeout(() => {
                const indicator = document.createElement('div');
                indicator.id = 'local-config-indicator';
                indicator.className = 'fixed bottom-4 left-4 z-[9999] bg-yellow-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-lg';
                indicator.innerHTML = '⚠️ Using Local Config';
                document.body.appendChild(indicator);

                // Auto-hide after 5 seconds
                setTimeout(() => {
                    indicator.style.opacity = '0';
                    setTimeout(() => indicator.remove(), 500);
                }, 5000);
            }, 1000);
        } else {
            const source = getCustomerId() ? 'API (Cloudflare KV)' : 'LOCAL (data.js)';
            console.log(`[Config] ✅ Config loaded from: ${source}`);
        }

        // ✅ CRITICAL FIX: Ensure config is valid
        if (!config || typeof config !== 'object') {
            console.error('[Config] ❌ Invalid config object:', config);
            showLoadingScreen(true, 'Error: Invalid configuration');
            return;
        }

        // ✅ CRITICAL FIX: Force global CONFIG update yang reaktif
        // Delete any existing CONFIG to avoid conflicts
        try {
            delete window.CONFIG;
        } catch (e) {
            // Ignore if can't delete (const from data.js)
        }

        // Set via our reactive property
        safeSetConfig(config);

        // Also set the internal storage
        window._CONFIG_DATA = config;

        // Verify assignment worked
        if (window.CONFIG !== config) {
            console.warn('[Config] ⚠️ Direct assignment verification failed, using fallback');
            window._CONFIG_DATA = config;
        }

        // ✅ CONFIRM: Detect if this is local or API config
        const isLocalConfig = !getCustomerId();
        const sourceLabel = isLocalConfig ? 'LOCAL (data.js)' : 'API (Cloudflare KV)';
        console.log(`[Config] ✅ FINAL: Using ${sourceLabel}`);
        console.log('[Config] Config summary:', {
            source: sourceLabel,
            windowConfigMatches: window.CONFIG === config,
            hasLogin: !!(config.login && config.login.password),
            loginTitle: config.login ? config.login.title : 'MISSING',
            hasGreeting: !!(config.greeting && config.greeting.title),
            greetingTitle: config.greeting ? config.greeting.title : 'MISSING',
            hasMusic: !!(config.music && config.music.length),
            musicCount: config.music ? config.music.length : 0,
            hasGallery: !!(config.gallery && config.gallery.memories),
            galleryCount: config.gallery && config.gallery.memories ? config.gallery.memories.length : 0,
            hasMap: !!(config.map && config.map.locations),
            mapCount: config.map && config.map.locations ? config.map.locations.length : 0,
            hasWrapped: !!(config.wrapped),
            wrappedVibe: config.wrapped ? config.wrapped.vibe : 'MISSING',
            hasLetter: !!(config.letter && config.letter.message),
            configKeys: Object.keys(config)
        });

        // Now initialize the app
        startApp();
    } catch (error) {
        console.error('[Config] ❌ Initialization failed:', error);
        // Even if error, try to use local config
        const localConf = safeGetConfig();
        if (localConf && Object.keys(localConf).length > 0) {
            console.warn('[Config] Emergency fallback back to local data.js after error');
            safeSetConfig(localConf);
            startApp();
        } else {
            console.error('[Config] ❌ No config available even after fallback');
            showConfigError('Unknown', 'No configuration available');
        }
    } finally {
        setTimeout(() => showLoadingScreen(false), 500);
    }
}

/**
 * Start app after config is loaded
 */
function startApp() {
    // ✅ FIX: Use safeGetConfig to get proper config
    const activeConfig = safeGetConfig();
    console.log('[App] Starting with config loaded...');
    console.log('[App] activeConfig keys:', Object.keys(activeConfig || {}).length);
    console.log('[App] activeConfig check:', {
        exists: !!activeConfig,
        hasLogin: !!(activeConfig && activeConfig.login),
        hasGreeting: !!(activeConfig && activeConfig.greeting),
        hasMusic: !!(activeConfig && activeConfig.music && activeConfig.music.length),
        hasGallery: !!(activeConfig && activeConfig.gallery && activeConfig.gallery.memories)
    });

    // Create local CONFIG reference for this function
    const CONFIG = activeConfig;

    updateSEO();
    applyTheme();
    initParticles();

    // Initialize SFX with Blob Shield
    fetchMediaBlob('assets/sfx1.dat').then(blobUrl => {
        printerSfx.src = blobUrl;
        printerSfx.loop = true;
        console.log('[App] Printer SFX initialized');
    }).catch(err => console.warn('[App] Printer SFX failed:', err));

    // Initialize Scratch SFX
    fetchMediaBlob('assets/scratching.mp3').then(blobUrl => {
        scratchSfx.src = blobUrl;
        scratchSfx.loop = true;
        console.log('[App] Scratch SFX initialized');
    }).catch(err => console.warn('[App] Scratch SFX failed:', err));

    loadDynamicContent();
    initLogin();
    initCountdown();

    // ✅ DEBUG: Check music before init
    console.log('[App] Music config before initMusicPlayer:', {
        configMusic: window.CONFIG && window.CONFIG.music,
        musicLength: window.CONFIG && window.CONFIG.music ? window.CONFIG.music.length : 0
    });

    initMusicPlayer();
    loadGallery();
    loadQuiz();
    initLetterPage();
    syncPageVisibility();

    // Initialize current page ID
    const activePage = document.querySelector('.page:not(.hidden)');
    if (activePage) currentPageId = activePage.id;

    // Pre-load the first song
    if (window.CONFIG && window.CONFIG.music && window.CONFIG.music.length > 0) {
        console.log('[Init] Preloading first song...', window.CONFIG.music[0]);
        preloadFirstSong();
    } else {
        console.warn('[Init] No music to preload:', window.CONFIG && window.CONFIG.music);
    }

    // Set muted state for preview mode
    if (shouldMuteAudio()) {
        bgMusic.muted = true;
        console.log('🤫 [App] Background music will be muted (modal preview)');
    }

    console.log('[App] Initialization complete');
}

// Debug Helper: Send logs to parent admin
function logToParent(message) {
    if (window.self !== window.top) {
        window.parent.postMessage({ type: 'LOG', message: message }, '*');
    }
}

window.onerror = function (msg, url, lineNo, columnNo, error) {
    logToParent(`Error: ${msg} at ${lineNo}:${columnNo}`);
    return false;
};

// ============================================================
// FIX 2: Silence Mux - Proper preview detection
// ============================================================
function getPreviewMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const previewMode = urlParams.get('preview');
    return previewMode; // Returns: 'modal', 'side', or null
}

function shouldMuteAudio() {
    const mode = getPreviewMode();
    // Only mute in modal preview to avoid dual audio
    return mode === 'modal';
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[App] DOMContentLoaded - Starting dynamic initialization...');

    // Detect preview mode early
    const previewMode = getPreviewMode();
    if (previewMode) {
        console.log(`[App] Running in preview mode: ${previewMode}`);
        // In preview mode, use local CONFIG directly (for admin panel live preview)
        if (typeof CONFIG !== 'undefined') {
            safeSetConfig(CONFIG);
            startApp();
            showLoadingScreen(false); // 🚀 Ensure loader is hidden in preview
        }
    } else {
        // Normal mode: Load config dynamically from API
        initializeApp();
    }

    // Listen for config updates from admin
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_CONFIG') {
            try {
                const newConfig = event.data.config;
                console.log("[Preview] UPDATE_CONFIG received");

                // Shallow merge
                for (let key in newConfig) {
                    if (typeof newConfig[key] === 'object' && newConfig[key] !== null && !Array.isArray(newConfig[key])) {
                        CONFIG[key] = { ...CONFIG[key], ...newConfig[key] };
                    } else {
                        CONFIG[key] = newConfig[key];
                    }
                }

                // Clear music cache when music changes
                if (newConfig.music) {
                    musicLoadingPromise = null;
                    loadingTargetIndex = -1;
                }

                // Re-initialize components
                if (typeof applyTheme === 'function') applyTheme();
                if (typeof updateSEO === 'function') updateSEO();
                if (typeof loadDynamicContent === 'function') loadDynamicContent();
                if (typeof initCountdown === 'function') initCountdown();
                if (typeof loadGallery === 'function') loadGallery(); // 🚀 Sync gallery
                if (typeof loadQuiz === 'function') loadQuiz();       // 🚀 Sync quiz
                if (typeof initMap === 'function') initMap();         // 🚀 Sync map
                if (typeof loadLetter === 'function') loadLetter();   // 🚀 Sync letter
                syncPageVisibility();

                // Refresh current page
                const activePage = document.querySelector('.page:not(.hidden)');
                if (activePage) {
                    const pageId = activePage.id;
                    if (pageId === 'page-3' && typeof loadSong === 'function') {
                        loadSong(currentSongIndex, true); // Force reload on config change
                    }
                    if (pageId === 'page-5' && typeof loadQuiz === 'function') loadQuiz();
                    if (pageId === 'page-6' && typeof loadGallery === 'function') loadGallery();
                    if (pageId === 'page-7' && typeof initMap === 'function') initMap();
                    if (pageId === 'page-8' && typeof resetLetterPage === 'function') resetLetterPage();
                    if (pageId === 'page-10') {
                        const iframe = document.getElementById('infinity-frame');
                        if (iframe) iframe.contentWindow.location.reload();
                    }
                }
            } catch (err) {
                console.error("[Preview] Update failed:", err);
            }
        }

        if (event.data && event.data.type === 'NAVIGATE_TO_PAGE') {
            const targetId = event.data.pageId;
            if (!targetId) return;

            if (currentPageId !== targetId && typeof MapsTo === 'function') {
                console.log(`🚀 Manual Sync: Navigating to ${targetId}`);
                MapsTo(currentPageId, targetId);
            }
        }

        // Handle STOP_MUSIC from Infinity Scroll page
        if (event.data && event.data.type === 'STOP_MUSIC') {
            console.log('[Music] Received STOP_MUSIC from iframe, starting fade out...');
            fadeOutAudio(bgMusic, 2000); // 2 seconds fade out
        }
    });


    // Notify parent that we're ready
    if (window.self !== window.top) {
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }

    console.log('[App] Initialization complete');
});

// ============================================================
// IFRAME MESSAGE LISTENER - Handle messages from Infinity Scroll iframe
// ============================================================
window.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'STOP_MUSIC') {
        console.log('[Music] Received STOP_MUSIC request from iframe');

        // Mark that we're on page 10
        window.isOnPage10 = true;

        // Fade out
        fadeOutAudio(bgMusic, 800);

        // Hard stop failsafe for iOS
        setTimeout(() => {
            if (bgMusic && !bgMusic.paused) {
                bgMusic.pause();
                bgMusic.currentTime = 0;
                console.log('[Music] Hard stopped via message (iOS failsafe)');
            }
        }, 1000);
    }
});

// Helper: Smooth Audio Fade Out
let fadeOutInterval = null;
function fadeOutAudio(audio, duration) {
    if (!audio || audio.paused) return;

    // Clear any existing fade
    if (fadeOutInterval) {
        clearInterval(fadeOutInterval);
        fadeOutInterval = null;
    }

    const startVolume = audio.volume;
    const speed = 50; // Interval in ms
    const step = startVolume / (duration / speed);

    fadeOutInterval = setInterval(() => {
        if (audio.volume > step) {
            audio.volume -= step;
        } else {
            audio.volume = 0;
            audio.pause();
            audio.volume = startVolume; // Reset volume for next play
            clearInterval(fadeOutInterval);
            fadeOutInterval = null;
            console.log('[Music] Main music faded out and paused');
        }
    }, speed);
}

// ✅ NEW: Preload first song (Claude's Recommendation)
async function preloadFirstSong() {
    try {
        // ✅ FIX: Use window.CONFIG explicitly
        const CONFIG = safeGetConfig();
        if (!CONFIG || !CONFIG.music || CONFIG.music.length === 0) return;

        const song = CONFIG.music[0];
        console.log(`[Init] Fetching blob for preload: ${song.audioSrc.substring(0, 50)}...`);
        const blobUrl = await fetchMediaBlob(song.audioSrc);

        bgMusic.dataset.originalSrc = song.audioSrc;
        bgMusic.src = blobUrl;
        bgMusic.load(); // Force browser to buffer
        console.log("[Init] First song preloaded successfully");
    } catch (err) {
        console.error("[Init] Failed to preload first song:", err);
    }
}

// Update SEO/OG Settings
function updateSEO() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG || !CONFIG.seo) return;

    const { title, description, image } = CONFIG.seo;

    // Update browser title
    if (title) document.title = title;

    // Update description
    const descTag = document.querySelector('meta[name="description"]');
    if (descTag) descTag.setAttribute('content', description);

    // Update OpenGraph
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) ogImage.setAttribute('content', image);

    // Update Twitter
    const twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute('content', title);

    const twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute('content', description);

    const twImage = document.querySelector('meta[name="twitter:image"]');
    if (twImage) twImage.setAttribute('content', image);
}

// Particle System
function initParticles() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    const container = document.getElementById('particle-container');
    if (!container || !CONFIG || !CONFIG.theme || !CONFIG.theme.particles || CONFIG.theme.particles === 'none') return;

    const type = CONFIG.theme.particles;
    const count = 20; // Maintain performance

    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = `particle particle-${type}`;

        // Randomize starting positions
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        const size = Math.random() * (type === 'hearts' ? 20 : 10) + 5;
        const delay = Math.random() * 10;
        const duration = Math.random() * 10 + 5;

        p.style.left = `${x}%`;
        p.style.top = `${y}%`;
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.animationDelay = `${delay}s`;
        p.style.animationDuration = `${duration}s`;

        if (type === 'hearts') {
            p.innerHTML = '❤️';
            p.style.fontSize = `${size}px`;
            p.style.background = 'none';
        }

        container.appendChild(p);
    }
}

// Apply Theme Settings
function applyTheme() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();

    if (!CONFIG || !CONFIG.theme) {
        console.warn('[Theme] No theme config available');
        return;
    }

    console.log('[Theme] Applying theme:', CONFIG.theme);

    // Apply background color
    if (CONFIG.theme.backgroundColor) {
        document.body.style.backgroundColor = CONFIG.theme.backgroundColor;
    }

    // Apply custom background image if specified
    if (CONFIG.theme.backgroundImage && CONFIG.theme.backgroundImage.trim() !== '') {
        document.body.style.backgroundImage = `url('${CONFIG.theme.backgroundImage}')`;
    } else {
        document.body.style.backgroundImage = 'none';
    }

    // Apply dynamic fonts
    if (CONFIG.theme.fontDisplay) {
        document.documentElement.style.setProperty('--font-display', CONFIG.theme.fontDisplay);
        loadGoogleFont(CONFIG.theme.fontDisplay);
    }
    if (CONFIG.theme.fontSans) {
        document.documentElement.style.setProperty('--font-sans', CONFIG.theme.fontSans);
        loadGoogleFont(CONFIG.theme.fontSans);
    }

    console.log('[Theme] ✅ Theme applied successfully');
}

// Dynamic Font Loader helper
function loadGoogleFont(fontFamily) {
    if (!fontFamily) return;
    const name = fontFamily.split(',')[0].replace(/['"]/g, '').trim();
    // Skip if it's a generic family
    const generics = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];
    if (generics.includes(name.toLowerCase())) return;

    const fontId = `font-dyn-${name.toLowerCase().replace(/\s+/g, '-')}`;
    if (document.getElementById(fontId)) return;

    const link = document.createElement('link');
    link.id = fontId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, '+')}:wght@400;600;700&display=swap`;
    document.head.appendChild(link);
}

// Helper Function: MapsTo
function MapsTo(fromId, toId) {
    if (isNavigating || fromId === toId) return;
    isNavigating = true;

    // Check if target page is enabled
    if (!isPageEnabled(toId)) {
        console.warn(`⚠️ Page ${toId} is disabled, finding alternative...`);
        const currentConf = getPageConfig(fromId);
        const targetConf = getPageConfig(toId);
        const currentOrder = currentConf ? currentConf.order : 0;
        const targetOrder = targetConf ? targetConf.order : 0;

        if (targetOrder > currentOrder) {
            toId = getNextPage(fromId);
        } else {
            toId = getPreviousPage(fromId);
        }

        if (!toId) {
            console.warn('❌ No enabled page available');
            isNavigating = false;
            return;
        }
    }

    const fromPage = document.getElementById(fromId);
    const toPage = document.getElementById(toId);

    if (fromPage && toPage) {
        // Cleanup previous timeout if existing
        if (transitionTimeout) {
            clearTimeout(transitionTimeout);
            transitionTimeout = null;
        }

        currentPageId = toId; // Update global state immediately
        updatePageIndicator(toId);

        // Start Animation
        fromPage.classList.add('page-flip-exit');
        toPage.classList.remove('hidden');
        toPage.classList.add('page-flip-enter');

        // Cleanup fromPage specific state
        if (fromId === 'page-4') {
            const printerComp = document.getElementById('printer-comp');
            if (printerComp) printerComp.classList.remove('is-printing');
            printerSfx.pause();
            printerSfx.currentTime = 0;
        }

        // Reset page 10 flag when leaving
        if (fromId === 'page-10') {
            window.isOnPage10 = false;
            console.log('[Nav] Left Infinity Scroll page, parent music can play now');
        }

        // Finalize transition (Restored drama: 1.8s)
        transitionTimeout = setTimeout(() => {
            fromPage.classList.add('hidden');
            fromPage.classList.remove('page-flip-exit');
            toPage.classList.remove('page-flip-enter');
            transitionTimeout = null;
            isNavigating = false; // Release lock
        }, 1800);
    } else {
        if (fromPage) fromPage.classList.add('hidden');
        if (toPage) {
            toPage.classList.remove('hidden');
            updatePageIndicator(toId);
        }
        currentPageId = toId;
        isNavigating = false;
    }

    if (toPage) {
        // Reset page 10 flag when navigating to any page except page-10
        if (toId !== 'page-10') {
            window.isOnPage10 = false;
        }

        // Page-Specific Logic
        if (toId === 'page-4') {
            const printerComp = document.getElementById('printer-comp');
            const printerDevice = document.getElementById('printer-device');
            const printerLed = document.getElementById('printer-led');

            if (printerComp) {
                printerComp.classList.remove('is-printing');
                if (printerDevice) printerDevice.classList.remove('printer-vibrating');
                if (printerLed) printerLed.classList.remove('led-printing');

                setTimeout(() => {
                    printerComp.classList.add('is-printing');
                    if (printerDevice) printerDevice.classList.add('printer-vibrating');
                    if (printerLed) printerLed.classList.add('led-printing');

                    printerSfx.currentTime = 0;
                    printerSfx.volume = 0.6;
                    const playPromise = printerSfx.play();

                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.error("Auto-play was prevented:", error);
                        });
                    }

                    setTimeout(() => {
                        printerSfx.pause();
                        if (printerDevice) printerDevice.classList.remove('printer-vibrating');
                        if (printerLed) printerLed.classList.remove('led-leading');
                    }, 6000);
                }, 300);
            }
        } else if (toId === 'page-2') {
            // Reset page 10 flag when on page 2
            window.isOnPage10 = false;

            // ✅ FIX: Don't try to play if music is already playing from login
            // The music was started in validateLogin() with the user gesture, so it should continue here
            if (bgMusic.paused && !window.musicStartedFromLogin) {
                console.log('[Navigation] Music was paused, attempting to start for Greeting Card');
                // Only try if user explicitly paused, not on initial navigation
                setTimeout(() => {
                    if (bgMusic.paused && !window.isOnPage10) {
                        playMusic();
                    }
                }, 100);
            } else {
                console.log('[Navigation] Music already playing from login - continuing to Greeting Card ✅');
            }
        } else if (toId === 'page-3') {
            // ✅ CRITICAL FIX: Smart song loading for Music Player page
            const CONFIG = safeGetConfig();
            const currentSong = CONFIG.music[currentSongIndex];
            const isSameSong = bgMusic.dataset.originalSrc === currentSong.audioSrc;
            const isMusicPlaying = !bgMusic.paused;

            if (isSameSong && isMusicPlaying) {
                // Song already loaded and playing - just update UI instantly
                console.log('[Navigation] ✅ Music Player: Song already playing, updating UI only');

                // Force immediate UI update using helper function
                updateMusicPlayerUI();
            } else if (bgMusic.paused) {
                // Music was paused - reload song and play
                console.log('[Navigation] Music paused, reloading for Music Player');
                loadSong(currentSongIndex).then(() => {
                    setTimeout(() => {
                        if (!window.isOnPage10) {
                            playMusic();
                        }
                    }, 500);
                });
            } else {
                // Music playing but different song - shouldn't happen but handle it
                console.log('[Navigation] Music playing but need to sync UI');
                loadSong(currentSongIndex); // This will now update UI instantly
            }
        } else if (toId === 'page-5') {
            if (typeof loadQuiz === 'function') loadQuiz();
        } else if (toId === 'page-6') {
            if (typeof loadGallery === 'function') loadGallery();
        } else if (toId === 'page-7') {
            if (typeof initMap === 'function') initMap();
        } else if (toId === 'page-8') {
            if (typeof resetLetterPage === 'function') resetLetterPage();
            if (typeof initLetterPage === 'function') initLetterPage();
        } else if (toId === 'page-9') {
            if (typeof initInvitationPage === 'function') initInvitationPage();
        } else if (toId === 'page-10') {
            console.log('[Nav] Navigated to Infinity Scroll page');
            window.isOnPage10 = true; // Flag to prevent parent music from auto-playing later

            // ✅ NOTE: Parent music keeps playing until user taps the start overlay
            // The iframe will send STOP_MUSIC message when user taps to begin
            console.log('[Music] Parent music continues until user taps overlay');

            const iframe = document.getElementById('infinity-frame');
            if (iframe) {
                // Determine if we need to reload (to get fresh data or if first load)
                // We avoid force-reloading every time to preserve user interaction states for autoplay
                const needsReload = !iframe.src || iframe.src === 'about:blank' || iframe.src.includes('?v=1.0.1');

                if (needsReload) {
                    const currentSrc = iframe.src.split('?')[0] || 'page-10-infinity-scroll.html';
                    iframe.src = `${currentSrc}?t=${Date.now()}`;
                }

                // Robust notification system
                const notify = () => {
                    if (iframe.contentWindow) {
                        iframe.contentWindow.postMessage({ type: 'PAGE_VISIBLE' }, '*');
                        console.log('[Nav] Sent PAGE_VISIBLE to infinity scroll');
                    }
                };

                // Notify immediately and in sequences to ensure iframe catches it
                notify();
                [100, 500, 1000, 2000, 5000].forEach(ms => setTimeout(notify, ms));

                // Also notify when iframe reloads
                iframe.onload = () => {
                    notify();
                    setTimeout(notify, 500);
                };
            }
        }
    }
}
// --- Navigation UI & Swipe Support ---

function updatePageIndicator(pageId) {
    // Get ALL page indicator elements (now one per page)
    const allIndicatorContainers = document.querySelectorAll('.page-indicator-container');
    const allIndicatorTexts = document.querySelectorAll('.page-indicator-text');

    if (!pageId) return;

    // Respect configuration
    const showIndicator = CONFIG.navigation ? CONFIG.navigation.showPageIndicator !== false : true;

    // Get current page number among enabled pages
    const currentNum = getCurrentPageNumber(pageId);
    const totalNum = getTotalEnabledPages();

    // Update text in ALL indicators across all pages
    allIndicatorTexts.forEach(textEl => {
        textEl.textContent = `${currentNum}/${totalNum}`;
    });

    // Hide indicator on first page, Q&A (page-5), Map (page-7), infinity scroll (page-10), or if disabled
    const hiddenPages = ['page-1', 'page-5', 'page-7', 'page-10'];
    const shouldHide = currentNum === 1 || !showIndicator || hiddenPages.includes(pageId);

    allIndicatorContainers.forEach(container => {
        if (shouldHide) {
            container.classList.remove('opacity-100');
            container.classList.add('opacity-0');
        } else {
            container.classList.remove('opacity-0');
            container.classList.add('opacity-100');
        }
    });
}

/**
 * Update all music toggles visibility based on audio state
 */
function updateMusicToggleVisibility() {
    const allMusicToggles = document.querySelectorAll('.page-music-toggle');

    allMusicToggles.forEach(toggle => {
        const isPlaying = bgMusic && !bgMusic.paused && !bgMusic.ended;
        if (isPlaying) {
            toggle.classList.remove('hidden');
            toggle.textContent = '🎵';
            window.musicStarted = true; // Mark that music has been active
        } else {
            // Keep visible with muted icon IF it was already started
            // This prevents it from disappearing when user clicks to pause
            if (window.musicStarted || !toggle.classList.contains('hidden')) {
                toggle.classList.remove('hidden');
                toggle.textContent = '🔇';
            } else {
                toggle.classList.add('hidden');
            }
        }
    });
}

// Swipe Navigation Logic
let touchStartX = 0;
let touchEndX = 0;

document.addEventListener('touchstart', e => {
    touchStartX = e.changedTouches[0].screenX;
}, false);

document.addEventListener('touchend', e => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
}, false);

function handleSwipe() {
    // Respect configuration
    if (CONFIG.navigation && CONFIG.navigation.enableSwipe === false) return;

    const swipeDistance = touchEndX - touchStartX;
    const threshold = 100;
    const activePage = document.querySelector('.page:not(.hidden)');

    // Don't swipe on login or quiz
    if (!activePage || activePage.id === 'page-1' || activePage.id === 'page-5') return;

    const currentId = activePage.id;

    if (swipeDistance < -threshold) {
        // Swipe Left -> Next
        const nextId = getNextPage(currentId);
        if (nextId) MapsTo(currentId, nextId);
    } else if (swipeDistance > threshold) {
        // Swipe Right -> Back
        const prevId = getPreviousPage(currentId);
        if (prevId) MapsTo(currentId, prevId);
    }
}

// Dynamic Content Loader
function loadDynamicContent() {
    // ✅ FIX: Use window.CONFIG explicitly to avoid shadowing
    const CONFIG = safeGetConfig();

    console.log('[LoadContent] Starting with CONFIG:', {
        configExists: !!CONFIG,
        configIsObject: typeof CONFIG === 'object',
        hasLogin: !!(CONFIG && CONFIG.login),
        hasGreeting: !!(CONFIG && CONFIG.greeting),
        hasMusic: !!(CONFIG && CONFIG.music && CONFIG.music.length),
        hasGallery: !!(CONFIG && CONFIG.gallery && CONFIG.gallery.memories),
        hasWrapped: !!(CONFIG && CONFIG.wrapped)
    });

    if (!CONFIG) {
        console.error('[LoadContent] ❌ CONFIG is undefined! Cannot load content.');
        return;
    }

    // Page 1: Login
    const p1Subtitle = document.getElementById('p1-subtitle');
    const p1Title = document.getElementById('p1-title');
    const p1Instruction = document.getElementById('p1-instruction');
    const loginInput = document.getElementById('login-input');

    if (CONFIG.login) {
        if (p1Subtitle) {
            p1Subtitle.textContent = CONFIG.login.collectionText;
            console.log('[LoadContent] Updated p1-subtitle:', CONFIG.login.collectionText);
        }
        if (p1Title) {
            p1Title.textContent = CONFIG.login.title;
            console.log('[LoadContent] Updated p1-title:', CONFIG.login.title);
        }
        if (p1Instruction) {
            p1Instruction.textContent = CONFIG.login.instruction;
        }
        if (loginInput) {
            loginInput.placeholder = CONFIG.login.placeholder;
        }
        console.log('[LoadContent] ✅ Login section loaded');
    } else {
        console.warn('[LoadContent] CONFIG.login missing!');
    }

    // Music Section
    if (CONFIG.music && CONFIG.music.length > 0) {
        const musicTitle = document.getElementById('music-section-title');
        if (musicTitle && CONFIG.musicSectionTitle !== undefined) {
            musicTitle.textContent = CONFIG.musicSectionTitle;
            if (CONFIG.musicSectionTitle.trim() === "") {
                musicTitle.classList.add('hidden');
            } else {
                musicTitle.classList.remove('hidden');
            }
        }
        console.log('[LoadContent] ✅ Music section updated, songs:', CONFIG.music.length);
    }

    // Page 4: Wrapped
    if (CONFIG.wrapped) {
        console.log('[LoadContent] Loading Wrapped with data:', CONFIG.wrapped);

        const minutesEl = document.getElementById('minutes-together');
        const vibeEl = document.getElementById('vibe-text');
        const wrappedImg = document.getElementById('wrapped-image');
        const topPlacesList = document.getElementById('top-places-list');
        const coreMemoriesList = document.getElementById('core-memories-list');

        // Section labels
        const topPlacesLabel = document.getElementById('top-places-label');
        const coreMemoriesLabel = document.getElementById('core-memories-label');
        const hoursTogetherLabel = document.getElementById('minutes-together-label');
        const vibeLabel = document.getElementById('vibe-label');

        // Populate labels
        if (topPlacesLabel && CONFIG.wrapped.topPlacesLabel) {
            topPlacesLabel.textContent = CONFIG.wrapped.topPlacesLabel;
        }
        if (coreMemoriesLabel && CONFIG.wrapped.coreMemoriesLabel) {
            coreMemoriesLabel.textContent = CONFIG.wrapped.coreMemoriesLabel;
        }
        if (hoursTogetherLabel && CONFIG.wrapped.HoursTogetherLabel) {
            hoursTogetherLabel.textContent = CONFIG.wrapped.HoursTogetherLabel;
        }
        if (vibeLabel && CONFIG.wrapped.vibeLabel) {
            vibeLabel.textContent = CONFIG.wrapped.vibeLabel;
        }

        // Populate data
        if (minutesEl) {
            minutesEl.textContent = CONFIG.wrapped.HoursTogether;
            console.log('[LoadContent] Updated minutes-together:', CONFIG.wrapped.HoursTogether);
        }
        if (vibeEl) {
            vibeEl.textContent = CONFIG.wrapped.vibe;
            console.log('[LoadContent] Updated vibe-text:', CONFIG.wrapped.vibe);
        }

        if (wrappedImg && CONFIG.wrapped.imageSrc) {
            wrappedImg.src = CONFIG.wrapped.imageSrc;
            wrappedImg.onerror = function () {
                this.src = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop";
                console.warn("Wrapped image failed to load, using fallback.");
            };
        }

        if (topPlacesList && CONFIG.wrapped.topPlaces && Array.isArray(CONFIG.wrapped.topPlaces)) {
            topPlacesList.innerHTML = CONFIG.wrapped.topPlaces.map(place => `<li>${place}</li>`).join('');
            console.log('[LoadContent] Updated top places:', CONFIG.wrapped.topPlaces.length, 'items');
        }

        if (coreMemoriesList && CONFIG.wrapped.coreMemories && Array.isArray(CONFIG.wrapped.coreMemories)) {
            coreMemoriesList.innerHTML = CONFIG.wrapped.coreMemories.map(mem => `<li>${mem}</li>`).join('');
            console.log('[LoadContent] Updated core memories:', CONFIG.wrapped.coreMemories.length, 'items');
        }

        console.log('[LoadContent] ✅ Wrapped section loaded');
    } else {
        console.warn('[LoadContent] CONFIG.wrapped missing!');
    }

    // Page 2: Greeting Card
    if (CONFIG.greeting) {
        const p3Title = document.getElementById('p3-title');
        const p3Message = document.getElementById('p3-message');
        const p3Image = document.getElementById('p3-image');
        const p3Signature = document.getElementById('p3-signature');
        const p3Footer = document.getElementById('p3-footer');

        if (p3Title) {
            p3Title.textContent = CONFIG.greeting.title;
            console.log('[LoadContent] Updated p3-title:', CONFIG.greeting.title);
        }
        if (p3Message) {
            p3Message.textContent = CONFIG.greeting.message;
        }
        if (p3Image && CONFIG.greeting.imageSrc) {
            p3Image.src = CONFIG.greeting.imageSrc;
        }
        if (p3Signature) {
            p3Signature.textContent = CONFIG.greeting.signature || "With Love";
        }
        if (p3Footer) {
            p3Footer.textContent = CONFIG.greeting.footerText;
        }
        console.log('[LoadContent] ✅ Greeting section loaded');
    } else {
        console.warn('[LoadContent] CONFIG.greeting missing!');
    }

    // Page 7: Map
    if (CONFIG.map) {
        const mapTitle = document.getElementById('map-title');
        const mapDesc = document.getElementById('map-description');

        if (mapTitle && CONFIG.map.title) mapTitle.textContent = CONFIG.map.title;
        if (mapDesc && CONFIG.map.description) mapDesc.textContent = CONFIG.map.description;
        console.log('[LoadContent] ✅ Map section loaded');
    }

    // Page 8: Letter
    if (CONFIG.letter) {
        const recipientEl = document.getElementById('letter-recipient');
        const bodyEl = document.getElementById('letter-body');
        const signatureEl = document.getElementById('letter-signature');

        if (signatureEl) signatureEl.textContent = '';
        if (bodyEl) bodyEl.innerHTML = '';
        console.log('[LoadContent] ✅ Letter section prepared');
    }

    // Page 9: Love Lock
    if (CONFIG.lock) {
        const lockInitials = document.getElementById('lock-initials');
        const lockInstr = document.getElementById('lock-instruction');
        const lockFinal = document.getElementById('lock-final-message');

        if (lockInitials) lockInitials.textContent = CONFIG.lock.initials || "A + B";
        if (lockInstr) lockInstr.textContent = CONFIG.lock.instruction || "Click to lock our love forever...";
        if (lockFinal) lockFinal.textContent = CONFIG.lock.finalMessage || "Safely locked in my heart. Always.";
        console.log('[LoadContent] ✅ Lock section loaded');
    }

    // Global Brand Identity
    if (CONFIG.metadata) {
        const brandName = CONFIG.metadata.brandName || "For you, Always";
        const brandIcon = CONFIG.metadata.brandIcon || "diamond";

        document.querySelectorAll('.brand-name').forEach(el => {
            el.textContent = brandName;
        });

        document.querySelectorAll('.brand-logo').forEach(el => {
            el.textContent = brandIcon;
        });
        console.log('[LoadContent] ✅ Metadata loaded');
    }

    console.log('[LoadContent] ✅ All content successfully updated!');
}


// ============================================================
// FIX 1: Improved fetchMediaBlob - Handles data: URLs correctly
// ============================================================
async function fetchMediaBlob(url) {
    try {
        // ✅ CRITICAL FIX: Don't add query params to data: URLs
        if (url.startsWith('data:')) {
            console.log('[Media] Data URL detected, using directly');
            return url;
        }

        // ✅ Add retry logic for unreliable R2 connections
        const maxRetries = 3;
        let lastError;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const shieldedUrl = url + (url.includes('?') ? '&' : '?') + 'shield=' + Date.now();
                console.log(`[Media] Attempt ${attempt}/${maxRetries}:`, url.substring(0, 60) + '...');

                const response = await fetch(shieldedUrl, {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const blob = await response.blob();

                // Force MIME type to audio/mp3 if it's one of our renamed .dat files
                const type = url.endsWith('.dat') ? 'audio/mpeg' : blob.type;
                const audioBlob = new Blob([blob], { type: type });

                console.log('[Media] ✅ Successfully fetched');
                return URL.createObjectURL(audioBlob);

            } catch (err) {
                lastError = err;
                console.warn(`[Media] Attempt ${attempt} failed:`, err.message);

                // Wait before retry (exponential backoff)
                if (attempt < maxRetries) {
                    const delay = 1000 * attempt;
                    console.log(`[Media] Retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        // All retries failed
        console.error("[Media] ❌ All fetch attempts failed for:", url);
        console.error("[Media] Last error:", lastError);

        // Show helpful error for R2 URLs
        if (url.includes('valentine-upload.aldoramadhan16.workers.dev')) {
            console.error('[Media] 💡 Troubleshooting:');
            console.error('[Media]    1. Check R2 bucket CORS configuration');
            console.error('[Media]    2. Verify file exists in bucket');
            console.error('[Media]    3. Check worker permissions');
        }

        return url; // Fallback to original URL

    } catch (e) {
        console.error("[Media] Fatal error in fetchMediaBlob:", e);
        return url;
    }
}

// ============================================================
// FIX 3: Improved loadSong - Robust against all URL types
// ============================================================
isMusicLoading = false;

async function loadSong(index, forceReload = false) {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG.music || CONFIG.music.length === 0) {
        console.log('[Music] No music configured');
        return;
    }

    // Safety wrap for playlist boundaries
    if (index < 0) index = CONFIG.music.length - 1;
    if (index >= CONFIG.music.length) index = 0;

    // If already loading this specific song AND not forcing reload, return that promise
    if (musicLoadingPromise && loadingTargetIndex === index && !forceReload) {
        return musicLoadingPromise;
    }

    loadingTargetIndex = index;
    musicLoadingPromise = (async () => {
        try {
            currentSongIndex = index;
            const song = CONFIG.music[currentSongIndex];

            console.log(`[Music] Loading song ${index}: ${song.songTitle}`);

            const songTitle = document.getElementById('song-title');
            const artistName = document.getElementById('artist-name');
            const musicCover = document.getElementById('music-cover');
            const lyrics = document.getElementById('song-lyrics');

            // ✅ CRITICAL FIX: Update UI IMMEDIATELY (synchronously) regardless of audio state
            // This prevents "Loading..." from being stuck when audio is already playing
            if (songTitle) {
                songTitle.textContent = song.songTitle;
                console.log(`[Music] ✅ Title updated: ${song.songTitle}`);
            }
            if (artistName) {
                artistName.textContent = song.artist;
                console.log(`[Music] ✅ Artist updated: ${song.artist}`);
            }

            if (musicCover) {
                musicCover.src = song.coverSrc;
                musicCover.onerror = () => {
                    musicCover.src = "https://images.unsplash.com/photo-1518193583867-0ef427db9aa2?q=80&w=400&h=400&auto=format&fit=crop";
                };
                console.log(`[Music] ✅ Cover updated: ${song.coverSrc}`);
            }

            if (lyrics) {
                // Cancel previous typing if any
                if (window.lyricsTypingTimeout) clearTimeout(window.lyricsTypingTimeout);

                lyrics.textContent = "";
                lyrics.classList.remove('animate-fade-in-up');
                void lyrics.offsetWidth; // Trigger reflow
                lyrics.classList.add('animate-fade-in-up');

                const fullText = song.lyrics || "";
                let i = 0;
                function type() {
                    if (i < fullText.length) {
                        lyrics.textContent += fullText.charAt(i);
                        i++;
                        window.lyricsTypingTimeout = setTimeout(type, 40);
                    }
                }
                type();
            }

            // Load audio source ONLY if it's different or missing
            const newSrc = song.audioSrc;

            // ✅ CRITICAL FIX: Check if audio already loaded with same source
            const isSameSong = bgMusic.dataset.originalSrc === newSrc;
            const hasAudioLoaded = bgMusic.src && bgMusic.readyState >= 2; // HAVE_CURRENT_DATA or better

            if (isSameSong && hasAudioLoaded) {
                console.log(`[Music] ✅ Song already loaded and playing - UI updated instantly!`);
                updatePlayIcon();
                return; // Exit early - no need to fetch
            }

            // Different song or audio not loaded - fetch it
            if (!bgMusic.src || bgMusic.dataset.originalSrc !== newSrc) {
                // Revoke old blob URL if it exists
                if (bgMusic.src && bgMusic.src.startsWith('blob:') && bgMusic.dataset.originalSrc !== newSrc) {
                    URL.revokeObjectURL(bgMusic.src);
                }

                console.log(`[Music] Fetching audio: ${newSrc.substring(0, 50)}...`);
                const blobUrl = await fetchMediaBlob(newSrc);

                // RACE CONDITION FIX: Check if song changed while fetching
                if (currentSongIndex !== index) {
                    console.log(`[Music] Ignoring stale blob load for index ${index}. Current is ${currentSongIndex}`);
                    return;
                }

                bgMusic.dataset.originalSrc = newSrc;
                bgMusic.src = blobUrl;

                console.log(`[Music] Audio source set: ${blobUrl.substring(0, 50)}...`);

                bgMusic.load(); // Force browser to buffer

                // Wait for audio to be ready
                await new Promise((resolve, reject) => {
                    const onCanPlay = () => {
                        console.log('[Music] Audio ready (canplay)');
                        bgMusic.removeEventListener('canplay', onCanPlay);
                        bgMusic.removeEventListener('error', onError);
                        resolve();
                    };

                    const onError = (e) => {
                        console.error('[Music] Audio load error:', e);
                        bgMusic.removeEventListener('canplay', onCanPlay);
                        bgMusic.removeEventListener('error', onError);
                        reject(e);
                    };

                    bgMusic.addEventListener('canplay', onCanPlay);
                    bgMusic.addEventListener('error', onError);

                    // Fallback timeout
                    setTimeout(() => {
                        bgMusic.removeEventListener('canplay', onCanPlay);
                        bgMusic.removeEventListener('error', onError);
                        resolve();
                    }, 3000);
                });

                if (currentSongIndex === index) {
                    updatePlayIcon();
                }
            }

            console.log(`[Music] Song ${index} loaded successfully`);
        } catch (err) {
            console.error("[Music] loadSong failed:", err);
            throw err;
        }
    })();

    return musicLoadingPromise;
}

/**
 * ✅ NEW: Force update music player UI with current song data
 * Called when navigating to page-3 to prevent "Loading..." state
 */
function updateMusicPlayerUI() {
    const CONFIG = safeGetConfig();
    if (!CONFIG || !CONFIG.music || CONFIG.music.length === 0) return;

    const currentSong = CONFIG.music[currentSongIndex];
    if (!currentSong) return;

    console.log(`[Music UI] Force updating UI for: ${currentSong.songTitle}`);

    const songTitle = document.getElementById('song-title');
    const artistName = document.getElementById('artist-name');
    const musicCover = document.getElementById('music-cover');
    const lyrics = document.getElementById('song-lyrics');

    // Remove "Loading..." and set actual song data
    if (songTitle) {
        songTitle.textContent = currentSong.songTitle;
        console.log(`[Music UI] ✅ Title: ${currentSong.songTitle}`);
    }

    if (artistName) {
        artistName.textContent = currentSong.artist;
        console.log(`[Music UI] ✅ Artist: ${currentSong.artist}`);
    }

    if (musicCover) {
        musicCover.src = currentSong.coverSrc;
        musicCover.onerror = () => {
            musicCover.src = "https://images.unsplash.com/photo-1518193583867-0ef427db9aa2?q=80&w=400&h=400&auto=format&fit=crop";
        };
        console.log(`[Music UI] ✅ Cover updated`);
    }

    if (lyrics && currentSong.lyrics) {
        // Cancel previous typing if any
        if (window.lyricsTypingTimeout) clearTimeout(window.lyricsTypingTimeout);

        lyrics.textContent = currentSong.lyrics; // Show immediately, no typing animation
        console.log(`[Music UI] ✅ Lyrics updated`);
    }

    // Update play/pause button state
    updatePlayIcon();
    updateMusicToggleVisibility();

    console.log(`[Music UI] ✅ All UI elements updated successfully`);
}

function initMusicPlayer() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    const toggleBtn = document.getElementById('p2-music-toggle');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');

    // ✅ NEW: Force UI update on page load if music is already playing
    updateMusicPlayerUI();

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            if (bgMusic.paused) {
                playMusic();
            } else {
                pauseMusic();
            }
        });
    }

    if (prevBtn) prevBtn.addEventListener('click', () => changeSong(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => changeSong(1));

    // Handle Volume Slider
    const volumeSlider = document.getElementById('volume-slider');
    if (volumeSlider) {
        // Set initial volume
        bgMusic.volume = volumeSlider.value;
        volumeSlider.addEventListener('input', (e) => {
            bgMusic.volume = e.target.value;
        });
    }

    // Handle Progress Bar
    bgMusic.addEventListener('timeupdate', () => {
        if (progressBar && bgMusic.duration) {
            const percent = (bgMusic.currentTime / bgMusic.duration) * 100;
            progressBar.style.width = `${percent}%`;

            const handle = document.getElementById('progress-handle');
            if (handle) {
                handle.style.left = `${percent}%`;
            }
        }
    });

    // Handle song ended
    bgMusic.addEventListener('ended', () => {
        changeSong(1);
    });

    // === MODIFIED: Initialize ALL music toggles (one per page) ===
    const allMusicToggles = document.querySelectorAll('.page-music-toggle');
    allMusicToggles.forEach(globalToggle => {
        if (globalToggle) {
            globalToggle.addEventListener('click', () => {
                if (bgMusic.paused) {
                    playMusic();
                } else {
                    pauseMusic();
                }
            });
        }
    });

    // SYNC UI with Audio State
    bgMusic.addEventListener('play', () => {
        updatePlayIcon();
        updateMusicToggleVisibility();
    });
    bgMusic.addEventListener('pause', () => {
        updatePlayIcon();
        updateMusicToggleVisibility();
    });
    bgMusic.addEventListener('playing', updatePlayIcon);
    bgMusic.addEventListener('waiting', updatePlayIcon);
    bgMusic.addEventListener('stalled', updatePlayIcon);
    bgMusic.addEventListener('error', updatePlayIcon);
    bgMusic.addEventListener('loadstart', updatePlayIcon);
}

// --- Quiz Logic ---
let currentQuestionIndex = 0;
let quizScore = 0;

function loadQuiz() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG.quiz || !CONFIG.quiz.questions) return;

    const totalQuestions = CONFIG.quiz.questions.length;

    const questionGameplay = document.getElementById('quiz-gameplay');
    const quizResult = document.getElementById('quiz-result');
    const finalScoreEl = document.getElementById('final-score');

    if (currentQuestionIndex >= totalQuestions) {
        // Quiz Finished - Show result summary
        if (questionGameplay) questionGameplay.classList.add('hidden');
        if (quizResult) {
            quizResult.classList.remove('hidden');
            quizResult.classList.add('animate-fade-in-up');
        }

        // Dynamic Result Text
        const resTitleEl = document.getElementById('quiz-result-title');
        const resMsgEl = document.getElementById('quiz-result-message');

        let title = "You scored {score}/{total}!";
        let message = CONFIG.quiz?.resultMessage || "You know me so well, love! ❤️";

        title = title.replace('{score}', quizScore).replace('{total}', totalQuestions);
        message = message.replace('{score}', quizScore).replace('{total}', totalQuestions);

        if (resTitleEl) resTitleEl.innerHTML = title;
        if (resMsgEl) resMsgEl.textContent = message;

        return;
    }

    // Ensure gameplay is visible if re-loading
    if (questionGameplay) questionGameplay.classList.remove('hidden');
    if (quizResult) quizResult.classList.add('hidden');

    const questionData = CONFIG.quiz.questions[currentQuestionIndex];
    if (!questionData) return;

    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');

    // Update Progress UI
    const currentQEl = document.getElementById('current-q');
    const totalQEl = document.getElementById('total-q');
    const progressPercentEl = document.getElementById('progress-percent');
    const progressBarEl = document.getElementById('quiz-progress-bar');

    if (currentQEl) currentQEl.textContent = currentQuestionIndex + 1;
    if (totalQEl) totalQEl.textContent = totalQuestions;

    const percent = Math.round(((currentQuestionIndex) / totalQuestions) * 100);
    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    if (progressBarEl) progressBarEl.style.width = `${percent}%`;

    if (questionEl) questionEl.textContent = questionData.question;

    // Reset UI: Strictly hide feedback and remove animation classes
    if (optionsEl) optionsEl.innerHTML = '';
    if (feedbackEl) {
        feedbackEl.classList.add('hidden');
        feedbackEl.classList.remove('animate-fade-in-up');
    }

    // Create Options
    questionData.options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = "option-button w-full bg-white/70 py-3 px-5 md:py-4 md:px-8 rounded-xl md:rounded-2xl border border-transparent text-rose-800 font-sans text-base md:text-lg flex items-center justify-between group shadow-sm";
        btn.onclick = () => checkAnswer(index, btn, questionData);
        btn.innerHTML = `
            <span>${opt}</span>
            <span class="material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity text-rose-300 text-sm md:text-base">colors_spark</span>
        `;
        optionsEl.appendChild(btn);
    });
}

function checkAnswer(selectedIndex, btnElement, data) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const feedbackMsg = document.getElementById('quiz-feedback-message');
    const optionsEl = document.getElementById('quiz-options');

    // Visual feedback for selection
    btnElement.classList.add('selected');

    // Disable all buttons to prevent double clicking
    const allBtns = optionsEl.querySelectorAll('button');
    allBtns.forEach(b => {
        b.disabled = true;
        if (b !== btnElement) {
            b.classList.add('cursor-not-allowed', 'opacity-60');
        }
    });

    if (selectedIndex === data.correctIndex) {
        // Correct Answer
        quizScore++;
        createSparkles(btnElement);

        btnElement.classList.remove('bg-white/70', 'border-transparent', 'selected');
        btnElement.classList.add('bg-rose-100', 'border-rose-400', 'scale-105');

        // Show Feedback
        if (feedbackMsg) {
            feedbackMsg.textContent = data.correctMessage;
            feedbackMsg.className = "font-display italic text-4xl text-rose-600 animate-fade-in-up";
        }

        if (feedbackEl) {
            feedbackEl.classList.remove('hidden');
            feedbackEl.classList.add('animate-fade-in-up');

            // Always hide the internal "Next Question" button since we auto-advance
            const nextBtn = document.getElementById('quiz-next-btn');
            if (nextBtn) {
                nextBtn.classList.add('hidden');
            }

            // Auto-advance to next question or result screen after 1.5 seconds
            setTimeout(() => {
                currentQuestionIndex++;
                loadQuiz();
            }, 1500);
        }
    } else {
        // Wrong Answer
        const quizContainer = document.querySelector('#page-5-container');
        if (quizContainer) {
            quizContainer.classList.add('screen-shake');
            setTimeout(() => quizContainer.classList.remove('screen-shake'), 400);
        }

        btnElement.classList.add('withered');
        btnElement.classList.remove('selected');

        // Re-enable all buttons for retry after a short delay
        setTimeout(() => {
            allBtns.forEach(b => {
                // Only re-enable if NOT withered (the one they already guessed wrong)
                if (!b.classList.contains('withered')) {
                    b.disabled = false;
                    b.classList.remove('cursor-not-allowed', 'opacity-60');
                }
            });
        }, 500);
    }
}

// Global Next Question Function
window.nextQuestion = function () {
    console.log("Next Question Triggered");
    currentQuestionIndex++;
    loadQuiz();
};

function nextQuestion() {
    window.nextQuestion();
}

// --- Gallery Logic ---
// --- Gallery Logic with Real scratching ---
function loadGallery() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    console.log("Loading Gallery...");
    if (!CONFIG.gallery || !CONFIG.gallery.memories) return;

    // ✅ FIX: Initialize revealedMemories array if empty or wrong size
    if (revealedMemories.length === 0) {
        console.log('[Gallery] Initializing revealedMemories array...');
        revealedMemories = new Array(CONFIG.gallery.memories.length).fill(false);
    } else if (revealedMemories.length !== CONFIG.gallery.memories.length) {
        // Resize array if memories count changed
        const newArray = new Array(CONFIG.gallery.memories.length).fill(false);
        // Copy existing values
        for (let i = 0; i < Math.min(revealedMemories.length, newArray.length); i++) {
            newArray[i] = revealedMemories[i];
        }
        revealedMemories = newArray;
        console.log('[Gallery] Resized revealedMemories to:', revealedMemories.length);
    }

    // ✅ FIX: Auto-reveal all in preview mode so admin can see images
    const isPreview = getPreviewMode() !== null;
    if (isPreview) {
        console.log('[Gallery] Preview mode detected - auto-revealing all images');
        revealedMemories = revealedMemories.map(() => true);
    }

    const titleEl = document.getElementById('gallery-title');
    const subtitleEl = document.getElementById('gallery-subtitle');
    const gridEl = document.getElementById('gallery-grid');

    if (titleEl) titleEl.textContent = CONFIG.gallery.title;
    if (subtitleEl) subtitleEl.textContent = CONFIG.gallery.subtitle;

    if (gridEl) {
        gridEl.innerHTML = '';

        CONFIG.gallery.memories.forEach(async (mem, index) => {

            const card = document.createElement('div');
            card.className = `polaroid-frame bg-white p-3 shadow-2xl relative ${mem.rotation} group`;

            // Determine media HTML based on type
            let mediaHTML = "";
            if (mem.type === "video") {
                const blobUrl = await fetchMediaBlob(mem.src);
                mediaHTML = `
                    <div class="relative w-full h-full">
                        <video class="w-full h-full object-cover" autoplay muted loop playsinline preload="auto">
                            <source src="${blobUrl}" type="video/mp4">
                        </video>
                        <!-- IDM Shield for Gallery Video -->
                        <div class="absolute inset-0 z-20 bg-transparent"></div>
                    </div>`;
            } else {
                // handles "image" and default
                mediaHTML = `<img alt="Memory" class="w-full h-full object-cover" src="${mem.src}" referrerpolicy="no-referrer" />`;
            }

            card.innerHTML = `
                <div class="${mem.tape} absolute -top-3 ${mem.rotation.includes('-') ? '-left-4' : '-right-3'} w-14 h-6 z-10"></div>
                <div class="aspect-[3/4] w-full relative overflow-hidden bg-gray-100 ${revealedMemories[index] ? 'shadow-inner' : ''}"
                     onclick="if(revealedMemories[${index}]) openLightbox(${index})">
                    ${mediaHTML}
                    ${revealedMemories[index] ? '' : `<canvas id="scratch-canvas-${index}" class="absolute inset-0 w-full h-full cursor-crosshair z-30"></canvas>`}
                </div>
                <div class="pt-5 pb-6 px-3 text-center">
                    <p id="caption-${index}" class="polaroid-caption ${revealedMemories[index] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000">
                        ${mem.caption}
                    </p>
                </div>
            `;
            gridEl.appendChild(card);

            // Force play video if already revealed (uncovered)
            if (revealedMemories[index]) {
                const video = card.querySelector('video');
                if (video) {
                    video.play().catch(e => console.log("Manual play block:", e));
                }
            }

            // Initialize the canvas only if it exists
            if (!revealedMemories[index]) {
                setTimeout(() => initScratchCard(index), 50);
            }
        });
    }
}

function initScratchCard(index) {
    const canvas = document.getElementById(`scratch-canvas-${index}`);
    const caption = document.getElementById(`caption-${index}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;

    // Set internal resolution to match display size
    // Use offsetWidth to avoid 0 size during 3D transform
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    // Fill with scratch color/pattern
    ctx.fillStyle = '#d1d5db'; // Silver/Gray
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add some "texture" to the scratch layer
    ctx.fillStyle = '#9ca3af';
    for (let i = 0; i < 200; i++) {
        ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
    }

    let isDrawing = false;
    let lastX, lastY;

    function scratch(e) {
        if (!isDrawing) return;

        // Start video playback on interaction if it's not already playing
        const video = canvas.parentElement.querySelector('video');
        if (video && video.paused) {
            video.play().catch(err => { });
        }

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || (e.touches ? e.touches[0].clientX : 0)) - rect.left;
        const y = (e.clientY || (e.touches ? e.touches[0].clientY : 0)) - rect.top;

        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 28; // Reduced brush size to make it "longer" as requested

        ctx.beginPath();
        if (lastX !== undefined && lastY !== undefined) {
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(x, y);
        } else {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y);
        }
        ctx.stroke();

        lastX = x;
        lastY = y;

        // Create glitter particles
        if (Math.random() > 0.3) {
            createGlitter(e.clientX || (e.touches ? e.touches[0].clientX : 0),
                e.clientY || (e.touches ? e.touches[0].clientY : 0));
        }

        // Play scratch sound
        if (scratchSfx.paused) {
            scratchSfx.play().catch(err => console.log('SFX blocked:', err));
        }

        // Check reveal percentage occasionally
        if (Math.random() > 0.9) {
            checkReveal();
        }
    }

    function createGlitter(x, y) {
        const particle = document.createElement('div');
        particle.className = 'glitter-particle';

        // Random golden/pinkish colors
        const colors = ['#FFD700', '#FFA500', '#FF69B4', '#FFFFFF'];
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        // Random trajectory
        const tx = (Math.random() - 0.5) * 100;
        const ty = Math.random() * 100 + 50;
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        particle.style.animation = `fall-and-fade ${Math.random() * 1 + 0.5}s forwards`;

        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 1500);
    }

    function checkReveal() {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let alphaPixels = 0;
        for (let i = 3; i < imageData.data.length; i += 4) {
            if (imageData.data[i] === 0) alphaPixels++;
        }

        const percentage = (alphaPixels / (imageData.data.length / 4)) * 100;
        if (percentage > 40 && !revealedMemories[index]) { // Threshold decreased to 40% for easier reveal (60% remaining)
            revealedMemories[index] = true; // Persist revealed state
            canvas.style.transition = 'opacity 1.5s ease-out';
            canvas.style.opacity = '0';
            canvas.style.pointerEvents = 'none'; // Ensure it doesn't block future clicks while fading
            setTimeout(() => canvas.remove(), 1500);
            if (caption) {
                caption.classList.remove('opacity-0');
                caption.classList.add('opacity-100');
            }

            // Add capability
            const container = canvas.parentElement;
            container.classList.add('shadow-inner');
            container.onclick = () => openLightbox(index);

            // Auto-zoom (Lightbox) immediately on finish
            openLightbox(index);

            // Play video if it's a video element
            const video = container.querySelector('video');
            if (video) {
                video.play().catch(err => console.log('Video autoplay prevented:', err));
            }
        }
    }

    // Events
    canvas.addEventListener('mousedown', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.clientX - rect.left;
        lastY = e.clientY - rect.top;
    });

    canvas.addEventListener('touchstart', (e) => {
        isDrawing = true;
        const rect = canvas.getBoundingClientRect();
        lastX = e.touches[0].clientX - rect.left;
        lastY = e.touches[0].clientY - rect.top;
        e.preventDefault();
    }, { passive: false });

    window.addEventListener('mouseup', () => {
        if (isDrawing) {
            isDrawing = false;
            lastX = undefined;
            lastY = undefined;
            scratchSfx.pause();
            scratchSfx.currentTime = 0;
            checkReveal();
        }
    });
    window.addEventListener('touchend', () => {
        if (isDrawing) {
            isDrawing = false;
            lastX = undefined;
            lastY = undefined;
            scratchSfx.pause();
            scratchSfx.currentTime = 0;
            checkReveal();
        }
    });

    canvas.addEventListener('mousemove', scratch);
    canvas.addEventListener('touchmove', (e) => { scratch(e); e.preventDefault(); }, { passive: false });
}

function openLightbox(index) {
    const mem = CONFIG.gallery.memories[index];
    if (!mem) return;

    const lightbox = document.createElement('div');
    lightbox.className = 'fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center animate-fade-in p-4';

    let mediaHTML = "";
    if (mem.type === "video") {
        mediaHTML = `<video src="${mem.src}" class="w-full h-full object-cover" controls autoplay playsinline></video>`;
    } else {
        mediaHTML = `<img src="${mem.src}" class="w-full h-full object-cover shadow-inner" referrerpolicy="no-referrer" onclick="event.stopPropagation()">`;
    }

    lightbox.innerHTML = `
        <div class="relative max-w-[340px] md:max-w-sm w-full bg-white p-4 md:p-5 shadow-2xl animate-scale-up border-b-[35px] md:border-b-[50px] border-white flex flex-col gap-4 mx-4">
             <!-- Tape Decoration -->
            <div class="absolute -top-4 left-1/2 -translate-x-1/2 w-20 h-8 washi-tape shadow-sm backdrop-blur-sm z-10 rotate-1"></div>

            <div class="aspect-[3/4] w-full relative overflow-hidden bg-gray-100">
                ${mediaHTML}
            </div>

            <div class="text-center pt-2 pb-6 px-3">
                <p class="polaroid-caption text-xl md:text-2xl" style="opacity: 1 !important; transform: rotate(-1deg) !important; transition: none !important;">${mem.caption}</p>
            </div>

            <button onclick="this.closest('.fixed').remove()"
                    class="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors">
                <span class="material-symbols-outlined text-4xl">close</span>
            </button>
        </div>
    `;

    lightbox.onclick = () => lightbox.remove();
    document.body.appendChild(lightbox);
}

// FUNCTION: Preload tiles untuk semua marker locations
async function preloadAllLocationTiles(loadingTextElement) {
    if (!CONFIG.map || !CONFIG.map.locations || !mapInstance) return;

    console.log('🗺️ Preloading tiles for all locations...');

    // Calculate bounds that include ALL locations
    const allCoords = CONFIG.map.locations.map(loc => loc.coordinates);
    const bounds = L.latLngBounds(allCoords);

    // Wait for these tiles to load - RESET BEFORE fitBounds
    tilesLoaded = false;
    totalTilesToLoad = 0;
    tilesLoadedCount = 0;

    // Start zooming INTO the first location immediately to avoid overview zoom-out
    if (CONFIG.map.locations.length > 0) {
        mapInstance.setView(CONFIG.map.locations[0].coordinates, 16, { animate: false });
    } else {
        mapInstance.fitBounds(bounds, {
            padding: [50, 50],
            animate: false,
            maxZoom: 16
        });
    }

    if (loadingTextElement) {
        loadingTextElement.textContent = 'Tracing the path of our love...';
    }

    await new Promise(resolve => {
        let checkCount = 0;
        const maxChecks = 40; // 4 seconds

        const checkInterval = setInterval(() => {
            checkCount++;

            // Show progress
            if (loadingTextElement && totalTilesToLoad > 0) {
                const percent = Math.round((tilesLoadedCount / totalTilesToLoad) * 100);
                loadingTextElement.textContent = `Capturing memories... ${percent}%`;
            } else if (loadingTextElement) {
                loadingTextElement.textContent = 'Preparing our world...';
            }

            // Safety: If no tiles requested after 500ms, assume cached
            if (checkCount > 5 && totalTilesToLoad === 0) {
                tilesLoaded = true;
            }

            if (tilesLoaded || checkCount >= maxChecks) {
                clearInterval(checkInterval);
                console.log('✅ Overview tiles ready');
                resolve();
            }
        }, 100);
    });

    // Now load detail tiles for each location individually
    for (let i = 0; i < CONFIG.map.locations.length; i++) {
        const loc = CONFIG.map.locations[i];

        // Reset tile tracking BEFORE moving map to avoid race condition
        tilesLoaded = false;
        totalTilesToLoad = 0;
        tilesLoadedCount = 0;

        // Zoom to each location to load detail tiles
        mapInstance.setView(loc.coordinates, 15, { animate: false });

        if (loadingTextElement) {
            const progress = Math.round(((i + 1) / CONFIG.map.locations.length) * 100);
            loadingTextElement.textContent = `Caching location ${i + 1}/${CONFIG.map.locations.length}... ${progress}%`;
        }

        // Wait for tiles
        await new Promise(resolve => {
            let checkCount = 0;
            const maxChecks = 20; // 2 seconds per location

            const checkInterval = setInterval(() => {
                checkCount++;

                // Safety: If no tiles requested after 500ms, assume cached
                if (checkCount > 5 && totalTilesToLoad === 0) {
                    tilesLoaded = true;
                }

                if (tilesLoaded || checkCount >= maxChecks) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });

        // Small delay between locations
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Return to overview (Reverted to zoom out)
    mapInstance.fitBounds(bounds, {
        padding: [50, 50],
        animate: false,
        maxZoom: 13
    });

    if (loadingTextElement) {
        loadingTextElement.textContent = 'All tiles cached! Starting journey...';
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('✅ All location tiles preloaded and cached!');
}

// --- Map Logic (Atlas of Us) ---
let mapMarkers = [];
let mapPolyline = null;
let markerCluster = null;
let mapInitController = null;
let mapJourneyCompleted = false; // Flag to track if the journey has been shown once

// Tile Loading State
let totalTilesToLoad = 0;
let tilesLoadedCount = 0;
let tilesLoaded = false;

async function initMap() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    console.log("Initializing Map with Journey Animation...");

    // Cancel any previous initialization
    if (mapInitController) {
        mapInitController.cancelled = true;
        console.log("Previous map initialization cancelled");
    }

    // Create new controller for this initialization
    mapInitController = { cancelled: false };
    const controller = mapInitController;

    const loadingOverlay = document.getElementById('map-loading-overlay');
    const loadingText = document.getElementById('map-loading-text');
    const mapElement = document.getElementById('map');

    // If journey already completed, skip loading overlay and animations
    if (mapJourneyCompleted) {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
        if (mapElement) mapElement.classList.add('loaded');
    } else {
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        if (mapElement) {
            mapElement.classList.remove('loaded');
        }
    }

    // ==========================================
    // FASE 1: LOADING SCREEN (Map Setup)
    // ==========================================

    if (!mapJourneyCompleted) {
        if (loadingText) loadingText.textContent = 'Connecting to world map...';
        await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (!window.L) {
        console.error("Leaflet (L) not loaded!");
        if (loadingText) loadingText.textContent = 'Map library failed to load';
        return;
    }

    if (!mapElement) return;

    // Default view center
    let defaultCenter = [0, 0];
    if (CONFIG.map && CONFIG.map.locations && CONFIG.map.locations.length > 0) {
        const first = CONFIG.map.locations[0];
        if (first.coordinates && Array.isArray(first.coordinates) && first.coordinates.length >= 2) {
            defaultCenter = first.coordinates;
        }
    }

    // Initialize Map Instance if not exists
    if (!mapInstance) {
        if (!mapJourneyCompleted && loadingText) loadingText.textContent = 'Setting up map canvas...';
        if (!mapJourneyCompleted) await new Promise(resolve => setTimeout(resolve, 700));

        mapInstance = L.map('map', {
            zoomControl: false,
            attributionControl: false,
            tap: false // Recommended for mobile touch issues in Leaflet
        }).setView(defaultCenter, 13);





        // Use Standard OpenStreetMap for original colors
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            className: 'map-tiles',
            keepBuffer: 5,
            updateWhenIdle: true
        });

        tileLayer.on('tileloadstart', () => {
            totalTilesToLoad++;
            tilesLoaded = false;
        });

        tileLayer.on('tileload', () => {
            tilesLoadedCount++;
            if (tilesLoadedCount >= totalTilesToLoad && totalTilesToLoad > 0) {
                tilesLoaded = true;
                console.log(`✅ All ${totalTilesToLoad} tiles loaded!`);
            }
        });

        tileLayer.on('tileerror', () => {
            tilesLoadedCount++;
            if (tilesLoadedCount >= totalTilesToLoad && totalTilesToLoad > 0) {
                tilesLoaded = true;
                console.log('⚠️ Some tiles failed, but continuing...');
            }
        });

        tileLayer.addTo(mapInstance);

        // WAIT FOR ALL TILES TO LOAD (with better timeout)
        if (!mapJourneyCompleted) {
            if (loadingText) loadingText.textContent = 'Loading map tiles...';

            await new Promise(resolve => {
                let checkCount = 0;
                const maxChecks = 60; // 6 seconds max

                const checkTiles = setInterval(() => {
                    checkCount++;

                    // Show progress
                    if (loadingText && totalTilesToLoad > 0) {
                        const percent = Math.round((tilesLoadedCount / totalTilesToLoad) * 100);
                        loadingText.textContent = `Loading map tiles... ${percent}%`;
                    }

                    // Check if all tiles loaded OR timeout
                    if (tilesLoaded || checkCount >= maxChecks) {
                        clearInterval(checkTiles);
                        if (loadingText) loadingText.textContent = 'Memories ready!';
                        resolve();
                    }
                }, 100);
            });

            // Extra small delay to ensure rendering
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // Zoom out when clicking the background
        mapInstance.on('click', (e) => {
            if (e.originalEvent.target.id === 'map' || e.originalEvent.target.classList.contains('leaflet-container')) {
                if (mapMarkers.length > 0) {
                    const group = new L.featureGroup(mapMarkers);
                    mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], animate: true });
                } else {
                    mapInstance.setView(defaultCenter, 13, { animate: true, duration: 1.0 });
                }
                mapInstance.closePopup();
            }
        });

        mapInstance.on('popupclose', () => {
            if (mapMarkers.length > 0) {
                const group = new L.featureGroup(mapMarkers);
                mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], animate: true });
            }
        });
    } else {
        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 300);
    }

    // Show map with fade
    if (mapElement) {
        mapElement.classList.add('loaded');
    }

    if (!mapJourneyCompleted) {
        if (loadingText) loadingText.textContent = 'Connecting to memories...';
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Clear old elements
    mapMarkers.forEach(m => mapInstance.removeLayer(m));
    mapMarkers = [];
    if (markerCluster) {
        mapInstance.removeLayer(markerCluster);
        markerCluster = null;
    }
    if (mapPolyline) {
        mapInstance.removeLayer(mapPolyline);
        mapPolyline = null;
    }

    // Skip Cluster for classic cleaner look
    markerCluster = null;

    if (!mapJourneyCompleted) {
        // ==========================================
        // PRELOAD ALL TILES FIRST!
        // ==========================================

        await preloadAllLocationTiles(loadingText);

        if (loadingText) loadingText.textContent = 'Everything is ready...';
        await new Promise(resolve => setTimeout(resolve, 500));

        // ==========================================
        // FASE 2: HIDE LOADING SCREEN (tiles already loaded!)
        // ==========================================

        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }

        await new Promise(resolve => setTimeout(resolve, 800));
    } else {
        // FIX: Even if journey is completed, make sure the overlay is hidden 
        // when map is re-initialized (e.g., after admin updates)
        if (loadingOverlay) {
            loadingOverlay.classList.add('hidden');
        }
    }

    // ==========================================
    // FASE 3: PIN ANIMATION DIMULAI
    // ==========================================

    console.log("Starting pin animation...");

    // Prepare journey data
    if (CONFIG.map && CONFIG.map.locations && CONFIG.map.locations.length > 0) {
        const routeCoords = [];

        // Show markers one by one with animation
        for (let i = 0; i < CONFIG.map.locations.length; i++) {
            // CHECK FOR CANCELLATION
            if (controller.cancelled) {
                console.log("Map initialization cancelled during marker addition");
                return;
            }

            const loc = CONFIG.map.locations[i];
            if (!loc.coordinates || !Array.isArray(loc.coordinates) || loc.coordinates.length < 2) continue;

            routeCoords.push(loc.coordinates);

            // Custom Icon per location or default to heart
            const iconName = loc.icon || 'favorite';
            const markerIcon = L.divIcon({
                html: `<span class="material-symbols-outlined heart-marker animate-bounce-short" style="font-variation-settings: 'FILL' 1">${iconName}</span>`,
                className: 'custom-div-icon',
                iconSize: [32, 32],
                iconAnchor: [16, 32]
            });

            // Create popup content
            let popupContent = `
                <div class="font-sans p-2">
                    <h3 class="font-display text-deep-red font-bold text-lg mb-1">${loc.title}</h3>`;

            if (loc.imageSrc && loc.imageSrc.trim() !== '') {
                popupContent += `
                    <div class="mb-3 rounded-lg overflow-hidden shadow-md">
                        <img src="${loc.imageSrc}" alt="${loc.title}" class="w-full h-32 object-cover" referrerpolicy="no-referrer">
                    </div>`;
            }

            popupContent += `
                    <p class="text-rose-900/80 text-sm leading-relaxed italic">"${loc.memory}"</p>
                </div>
            `;

            // DELAY for animation feel
            if (!mapJourneyCompleted) {
                await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 2500));
            }

            const marker = L.marker(loc.coordinates, { icon: markerIcon })
                .bindPopup(popupContent, {
                    className: 'rose-popup',
                    maxWidth: 250
                }).addTo(mapInstance);

            mapMarkers.push(marker);

            // 3. Update Polyline
            if (routeCoords.length > 1) {
                if (mapPolyline) mapInstance.removeLayer(mapPolyline);
                mapPolyline = L.polyline(routeCoords, {
                    color: '#f43f5e',
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '5, 10',
                    lineJoin: 'round'
                }).addTo(mapInstance);
            }

            // Pan to marker (Classic smooth movement)
            if (!mapJourneyCompleted) {
                mapInstance.panTo(loc.coordinates, { animate: true, duration: 2.0 });
            }

            // Interaction
            marker.on('click', function () {
                mapInstance.setView(loc.coordinates, 15, {
                    animate: true,
                    duration: 2.0
                });
            });
        }

        // Final check before zoom out
        if (controller.cancelled) return;

        // Zoom out to show all markers after the journey
        if (mapMarkers.length > 0) {
            if (!mapJourneyCompleted) await new Promise(resolve => setTimeout(resolve, 2000));
            const group = new L.featureGroup(mapMarkers);
            mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], animate: !mapJourneyCompleted, duration: 2.5 });
        }

        // Mark journey as completed after first time
        mapJourneyCompleted = true;

        // NEW: Trigger Discovery Pop-up with stats
        setTimeout(() => showMapDiscoveryPopUp(), 1000);
    }

    // Add Zoom control if missing
    if (!document.querySelector('.leaflet-control-zoom') && mapInstance) {
        L.control.zoom({ position: 'bottomleft' }).addTo(mapInstance);
    }

    // === REFINED MAP MOBILE FIX - v3.0 ===
    setTimeout(() => {
        console.log('[MapFix] Applying refined mobile fixes v3.0...');

        const mapElement = document.getElementById('map');

        if (!mapElement) return;

        // FIX 1: Set map z-index and touch-action explicitly
        mapElement.style.zIndex = '10';
        mapElement.style.touchAction = 'pan-x pan-y pinch-zoom';
        mapElement.style.pointerEvents = 'auto';

        // FIX 2: Disable global blocking overlays
        const globalOverlays = document.querySelectorAll('body > .grain-overlay, body > #particle-container');
        globalOverlays.forEach(el => {
            el.style.pointerEvents = 'none';
            el.style.zIndex = '0';
        });

        // FIX 3: Force enable Leaflet handlers (just in case)
        if (mapInstance) {
            if (mapInstance.dragging) mapInstance.dragging.enable();
            if (mapInstance.touchZoom) mapInstance.touchZoom.enable();
            if (mapInstance.doubleClickZoom) mapInstance.doubleClickZoom.enable();

            // Re-apply invalidated size to fix centering
            mapInstance.invalidateSize();
        }

        // FIX 4: Ensure loading overlay is NUKED
        const loadingOverlay = document.getElementById('map-loading-overlay');
        if (loadingOverlay && loadingOverlay.classList.contains('hidden')) {
            loadingOverlay.style.display = 'none';
            loadingOverlay.style.pointerEvents = 'none';
        }

        console.log('[MapFix] ✅ v3.0 Refined fixes applied');

        // 6. CRITICAL: Jalankan juga fix v4.0 untuk memastikan mobile works
        fixMobileMapInteraction();
    }, 1500);
}

// ==========================================
// CRITICAL FIX: Mobile Map Interaction - v4.0
// Fix spesifik untuk masalah peta tidak bisa 
// di-zoom/di-pan di mobile devices
// ==========================================

/**
 * Fungsi utama untuk memperbaiki interaksi peta di mobile
 * Dipanggil setiap kali page-7 menjadi visible
 */
function fixMobileMapInteraction() {
    console.log('[MapFix v4.0] Applying critical mobile fixes...');

    const mapElement = document.getElementById('map');
    const page7 = document.getElementById('page-7');

    if (!mapElement || !page7) {
        console.warn('[MapFix v4.0] Map or page-7 element not found');
        return;
    }

    // 1. CRITICAL: Reset touch-action di semua parent container
    let parent = mapElement.parentElement;
    while (parent && parent !== document.body) {
        const computedStyle = window.getComputedStyle(parent);

        // Hapus touch-action: none yang bisa memblokir
        if (computedStyle.touchAction === 'none') {
            console.log('[MapFix v4.0] Removing touch-action:none from:', parent.id || parent.className);
            parent.style.touchAction = 'pan-x pan-y pinch-zoom';
        }

        // Pastikan pointer-events tidak none
        if (computedStyle.pointerEvents === 'none') {
            console.log('[MapFix v4.0] Fixing pointer-events on:', parent.id || parent.className);
            parent.style.pointerEvents = 'auto';
        }

        parent = parent.parentElement;
    }

    // 2. CRITICAL: Re-initialize Leaflet interaction handlers
    if (mapInstance) {
        // Enable semua handler secara eksplisit
        if (mapInstance.dragging && !mapInstance.dragging.enabled()) {
            mapInstance.dragging.enable();
            console.log('[MapFix v4.0] Dragging enabled');
        }

        if (mapInstance.touchZoom && !mapInstance.touchZoom.enabled()) {
            mapInstance.touchZoom.enable();
            console.log('[MapFix v4.0] Touch zoom enabled');
        }

        if (mapInstance.doubleClickZoom && !mapInstance.doubleClickZoom.enabled()) {
            mapInstance.doubleClickZoom.enable();
            console.log('[MapFix v4.0] Double click zoom enabled');
        }

        if (mapInstance.scrollWheelZoom && !mapInstance.scrollWheelZoom.enabled()) {
            mapInstance.scrollWheelZoom.enable();
        }

        // 3. CRITICAL: Invalidate size dengan multiple attempts
        // Timing berbeda untuk memastikan DOM settled
        setTimeout(() => mapInstance.invalidateSize(), 100);
        setTimeout(() => mapInstance.invalidateSize(), 500);
        setTimeout(() => mapInstance.invalidateSize(), 1000);
    }

    // 4. CRITICAL: Discovery popup tidak boleh block saat tidak aktif
    const discoveryPopup = document.getElementById('discovery-popup');
    if (discoveryPopup && !discoveryPopup.classList.contains('show')) {
        discoveryPopup.style.pointerEvents = 'none';
        discoveryPopup.style.zIndex = '-1';
    }

    // 5. CRITICAL: Pastikan loading overlay benar-benar hilang
    const loadingOverlay = document.getElementById('map-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('hidden');
        loadingOverlay.style.display = 'none';
        loadingOverlay.style.pointerEvents = 'none';
        loadingOverlay.style.zIndex = '-9999';
    }

    // 6. CRITICAL: Tambahkan event listener untuk touch events
    // Ini memastikan browser tahu elemen ini menerima touch
    mapElement.addEventListener('touchstart', function onTouchStart(e) {
        // Stop propagation untuk mencegah parent menangkap event
        e.stopPropagation();
    }, { passive: true, capture: false });

    console.log('[MapFix v4.0] ✅ Critical mobile fixes applied');
}

/**
 * Observer untuk memantau visibility page-7
 * Setiap kali page-7 muncul, jalankan fix
 */
(function setupPage7Observer() {
    const page7 = document.getElementById('page-7');
    if (!page7) return;

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                const isHidden = page7.classList.contains('hidden');

                if (!isHidden) {
                    // Page-7 baru saja muncul, jalankan fix
                    console.log('[Page7 Observer] Page 7 visible, applying mobile fixes...');

                    // Multiple attempts dengan timing berbeda
                    setTimeout(fixMobileMapInteraction, 100);
                    setTimeout(fixMobileMapInteraction, 500);
                    setTimeout(fixMobileMapInteraction, 1500);
                    setTimeout(fixMobileMapInteraction, 3000);
                }
            }
        });
    });

    observer.observe(page7, {
        attributes: true,
        attributeFilter: ['class']
    });

    console.log('[Page7 Observer] Setup complete');
})();

/**
 * Fix saat orientation change atau resize
 * Penting untuk mobile yang sering rotate
 */
window.addEventListener('resize', () => {
    const page7 = document.getElementById('page-7');
    if (page7 && !page7.classList.contains('hidden')) {
        console.log('[Resize] Page 7 resize detected, reapplying fixes...');
        setTimeout(fixMobileMapInteraction, 300);
    }
});

// Orientation change spesific
window.addEventListener('orientationchange', () => {
    const page7 = document.getElementById('page-7');
    if (page7 && !page7.classList.contains('hidden')) {
        console.log('[Orientation] Change detected, reapplying fixes...');
        setTimeout(fixMobileMapInteraction, 500);
        setTimeout(fixMobileMapInteraction, 1500);
    }
});

/**
 * Fungsi untuk debug touch events
 * Hanya untuk development, bisa dihapus di production
 */
function debugMapTouch() {
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    mapElement.addEventListener('touchstart', (e) => {
        console.log('[Debug] Touch start on map:', e.touches.length, 'fingers');
    }, { passive: true });

    mapElement.addEventListener('touchmove', (e) => {
        console.log('[Debug] Touch move on map');
    }, { passive: true });

    console.log('[Debug] Touch event listeners added to map');
}


// ==========================================
// NEW: Discovery Pop-up & Stats Logic (Cumulative Exploration)
// ==========================================
function calculateMapStats() {
    const CONFIG = safeGetConfig();
    const locations = CONFIG.map?.locations || [];

    if (locations.length < 2) {
        return {
            spots: locations.length,
            distance: 0,
            html: `
                <div class="flex flex-col gap-2">
                    <p class="text-rose-950 font-medium leading-relaxed">
                        Together we've explored <span class="text-rose-600 font-bold">${locations.length} different spots</span>. 
                    </p>
                    <p class="text-xs text-rose-400 italic">Let's keep making beautiful memories together! ❤️</p>
                </div>`
        };
    }

    let totalDistance = 0;

    try {
        for (let i = 0; i < locations.length - 1; i++) {
            const locA = locations[i].coordinates;
            const locB = locations[i + 1].coordinates;

            // Ensure coordinates are numbers (sometimes they come as strings from Admin)
            const pA = [parseFloat(locA[1]), parseFloat(locA[0])]; // [Lon, Lat] for Turf
            const pB = [parseFloat(locB[1]), parseFloat(locB[0])];

            const from = turf.point(pA);
            const to = turf.point(pB);

            totalDistance += turf.distance(from, to, { units: 'kilometers' });
        }

        const finalKm = totalDistance.toFixed(1);

        return {
            spots: locations.length,
            distance: finalKm,
            html: `
                <div class="space-y-4">
                    <p class="text-rose-950/70 text-xs font-bold uppercase tracking-widest">Together we've explored</p>
                    <div class="flex items-end gap-3">
                        <span class="text-5xl stat-badge">${locations.length}</span>
                        <span class="text-rose-900/40 font-display italic text-2xl mb-1">spots</span>
                    </div>
                    <div class="flex flex-col gap-1">
                        <p class="text-rose-950/60 text-[10px] font-bold uppercase tracking-widest">Total journey traveled together</p>
                        <p class="text-4xl font-display shimmer-gold font-bold">${finalKm} KM</p>
                    </div>
                </div>`
        };
    } catch (e) {
        console.error("Distance calculation error:", e);
        return {
            spots: locations.length,
            distance: 0,
            html: `<p class="text-rose-950 font-medium">Together we've explored <span class="text-rose-600 font-bold">${locations.length} different spots</span> in our journey of love. ❤️</p>`
        };
    }
}

function showMapDiscoveryPopUp() {
    const popup = document.getElementById('discovery-popup');
    const messageEl = document.getElementById('discovery-message');
    if (!popup || !messageEl) return;

    const stats = calculateMapStats();

    // Set message with new structure
    messageEl.innerHTML = stats.html;

    // CRITICAL FIX: Reset style sebelum show (hapus style inline yang mungkin block)
    popup.style.pointerEvents = '';
    popup.style.zIndex = '';

    const content = popup.querySelector('.discovery-content');
    if (content) {
        content.style.pointerEvents = '';
    }

    // Show popup
    popup.classList.add('show');

    // Auto-hide after 10 seconds (make it longer for premium feel)
    if (window.discoveryTimeout) clearTimeout(window.discoveryTimeout);
    window.discoveryTimeout = setTimeout(() => {
        hideDiscoveryPopUp();
    }, 10000);

    console.log('[DiscoveryPopup] Shown');
}

function hideDiscoveryPopUp() {
    const popup = document.getElementById('discovery-popup');
    if (popup) {
        popup.classList.remove('show');

        // CRITICAL FIX: Reset pointer-events dan z-index saat popup ditutup
        // Ini memastikan popup tidak memblokir peta saat tidak terlihat
        popup.style.pointerEvents = 'none';
        popup.style.zIndex = '-1';

        // Reset juga untuk content
        const content = popup.querySelector('.discovery-content');
        if (content) {
            content.style.pointerEvents = 'none';
        }

        if (window.discoveryTimeout) clearTimeout(window.discoveryTimeout);

        console.log('[DiscoveryPopup] Hidden and disabled pointer events');
    }
}

// Toggle Map Card Logic for Mobile
let isMapCardCollapsed = false;
function toggleMapCard() {
    const cardWrapper = document.getElementById('map-card');
    const cardInner = cardWrapper ? cardWrapper.querySelector('div') : null;
    const title = document.getElementById('map-title');
    const titleContainer = title ? title.parentElement : null;
    const content = document.getElementById('map-card-content');
    const chevron = document.getElementById('map-card-chevron');

    if (!content || !chevron || !title || !cardInner || !titleContainer) return;

    if (isMapCardCollapsed) {
        // Expand
        content.style.maxHeight = '500px';
        content.style.opacity = '1';
        content.style.marginTop = '1rem';

        titleContainer.style.maxHeight = '100px';
        titleContainer.style.opacity = '1';

        cardInner.style.padding = '1.25rem';
        cardInner.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        cardInner.style.borderRadius = '1.5rem';

        // Revert width
        cardWrapper.style.width = window.innerWidth < 768 ? '90%' : 'auto';

        chevron.style.transform = 'rotate(0deg)';
        isMapCardCollapsed = false;
    } else {
        // Collapse
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.marginTop = '0';

        titleContainer.style.maxHeight = '0px';
        titleContainer.style.opacity = '0';

        cardInner.style.padding = '0.5rem 0.85rem';
        cardInner.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        cardInner.style.borderRadius = '3rem';

        cardWrapper.style.width = 'auto'; // Shrink box to fit logo Row 1 only

        chevron.style.transform = 'rotate(180deg)';
        isMapCardCollapsed = true;
    }
}

// Logic for specific pages initialized via MapsTo

function updatePlayIcon() {
    const playIcon = document.getElementById('play-icon');
    const visualizer = document.getElementById('music-visualizer');

    // Update all page music toggles text if needed
    updateMusicToggleVisibility();

    // UI should show "Pause" if the user has triggered play, even if buffering
    const isPlaying = !bgMusic.paused && !bgMusic.ended;

    if (!playIcon) return;

    if (isPlaying) {
        playIcon.textContent = 'pause';
        if (visualizer) {
            visualizer.classList.add('is-playing');
            visualizer.classList.remove('opacity-0');
        }
    } else {
        playIcon.textContent = 'play_arrow';
        if (visualizer) {
            visualizer.classList.remove('is-playing');
            visualizer.classList.add('opacity-0');
        }
    }
}

async function changeSong(direction) {
    // Show visual loading state if needed
    await loadSong(currentSongIndex + direction);
    playMusic();
}

// ============================================================
// FIX 4: Improved playMusic - Handles autoplay blocks & muting
// ============================================================
function playMusic() {
    if (isMusicLoading) return; // Prevent re-entrant calls
    window.musicStarted = true; // Flag for visibility logic

    // Hide IDM panels
    const idmPanels = document.querySelectorAll('[id^="idm_"], [class^="idm_"]');
    idmPanels.forEach(p => p.style.display = 'none');

    // ✅ FIX: Apply muting based on preview mode
    const shouldMute = shouldMuteAudio();
    if (shouldMute) {
        bgMusic.muted = true;
        console.log('🤫 [Music] Muted (modal preview mode)');
    } else {
        bgMusic.muted = false;
        bgMusic.volume = 0.7; // Ensure volume is up
        console.log('🔊 [Music] Unmuted (normal or side preview mode)');
    }

    // ✅ CRITICAL FIX: Only load if ABSOLUTELY necessary
    // Prefer to play existing source immediately (Claude's Recommendation)
    if (!bgMusic.src && CONFIG.music && CONFIG.music.length > 0) {
        console.warn("[Music] No source found, attempting emergency load (Preload might have failed)");
        isMusicLoading = true;
        loadSong(currentSongIndex).then(() => {
            isMusicLoading = false;
            if (bgMusic.src) {
                // Try to play, but this will likely fail due to lost gesture if async
                const playPromise = bgMusic.play();
                if (playPromise) {
                    playPromise.catch(err => {
                        console.error("[Music] Emergency play failed:", err);
                        updatePlayIcon();
                    });
                }
            }
        }).catch((err) => {
            console.error("[Music] loadSong failed:", err);
            isMusicLoading = false;
        });
        return;
    }

    // Attempt to play (Synchronous branch)
    const playPromise = bgMusic.play();

    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log('✅ [Music] Playback started successfully');
                updatePlayIcon();
            })
            .catch(e => {
                console.warn('[Music] Play failed or blocked:', e.message);
                updatePlayIcon();

                // Detailed blockage guidance
                if (e.name === 'NotAllowedError') {
                    console.error('[Music] ERROR: Browser blocked playback. This usually happens if the audio context wasn\'t primed by a user click.');
                    console.log('[Music] 💡 TIP: Try clicking the play button manually or refresh and click Login carefully.');
                }
            });
    } else {
        updatePlayIcon();
    }
}

function pauseMusic() {
    console.log('[Music] pauseMusic() called');
    bgMusic.pause();
    updatePlayIcon();
}

// ============================================================
// TESTING HELPERS
// ============================================================
function debugAudioState() {
    console.log('=== AUDIO DEBUG INFO ===');
    console.log('Preview Mode:', getPreviewMode());
    console.log('Should Mute:', shouldMuteAudio());
    console.log('bgMusic.src:', bgMusic.src);
    console.log('bgMusic.muted:', bgMusic.muted);
    console.log('bgMusic.paused:', bgMusic.paused);
    console.log('bgMusic.volume:', bgMusic.volume);
    console.log('bgMusic.readyState:', bgMusic.readyState);
    console.log('currentSongIndex:', currentSongIndex);
    console.log('CONFIG.music length:', CONFIG.music ? CONFIG.music.length : 0);
    console.log('=======================');
}

// Expose debug function globally
window.debugAudioState = debugAudioState;

// Page 1: Login Logic
function initLogin() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    const loginInput = document.getElementById('login-input');
    const loginBtn = document.getElementById('login-btn');
    const lockIcon = document.getElementById('login-lock-icon');
    const errorMsg = document.getElementById('error-message');

    function validateLogin() {
        const val = loginInput.value.trim().toLowerCase();

        if (val === CONFIG.login.password) {
            const btn = document.getElementById('login-btn');
            if (btn) {
                createHeartExplosion(btn);
            }

            // ✅ CRITICAL FIX: Start music IMMEDIATELY within user gesture context
            // This ensures autoplay works when navigating to Greeting Card (page 2)
            console.log('[Login] Starting music with user gesture...');
            window.musicStartedFromLogin = true; // Flag to prevent re-triggering on page 2

            if (bgMusic.src) {
                // Apply muting based on preview mode
                const shouldMute = shouldMuteAudio();
                bgMusic.muted = shouldMute;
                bgMusic.volume = shouldMute ? 0 : 0.7;

                const playPromise = bgMusic.play();
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log("[Login] ✅ Music started successfully - will continue to Greeting Card");
                            window.musicStarted = true;
                            updatePlayIcon();
                            updateMusicToggleVisibility();
                        })
                        .catch(err => {
                            console.error("[Login] ❌ Music start blocked:", err);
                            window.musicStartedFromLogin = false; // Reset flag if failed
                            updatePlayIcon();
                            updateMusicToggleVisibility();
                        });
                }
            } else {
                console.warn("[Login] No source preloaded, attempting emergency load...");
                playMusic();
            }

            setTimeout(() => {
                goNextPage();
            }, 800);
        } else {
            if (errorMsg) {
                errorMsg.classList.remove('opacity-0');
                errorMsg.textContent = CONFIG.login.errorMessage;
            }
            loginInput.classList.add('shake');
            setTimeout(() => loginInput.classList.remove('shake'), 500);
        }
    }

    if (loginBtn) loginBtn.addEventListener('click', validateLogin);
    if (loginInput) {
        loginInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') validateLogin();
        });

        // Heartbeat interaction
        loginInput.addEventListener('input', () => {
            if (loginInput.value.length > 0) {
                if (lockIcon) {
                    lockIcon.textContent = 'favorite';
                    lockIcon.classList.add('animate-heartbeat', 'fill-1');
                }
            } else {
                if (lockIcon) {
                    lockIcon.textContent = 'lock_open';
                    lockIcon.classList.remove('animate-heartbeat', 'fill-1');
                }
            }
        });
    }
}

// ===== LETTER PAGE INITIALIZATION =====
let letterTyped = false;
let isDustAnimationActive = false;

function initLetterPage() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    // Initialize floating dust particles
    initFloatingDust();

    // Initialize premium interactions (only if not already set or safe to re-call)
    // Note: These functions have their own checks or are safe to re-run
    initLetterParallax();
    initPremiumCursor();

    // Set Letter Content from CONFIG
    const recipientEl = document.getElementById('letter-recipient');
    if (recipientEl) {
        const name = CONFIG.letter.recipient || 'Dearest Love';
        const greeting = name.toLowerCase().includes('dearest') ? name : `Dearest ${name}`;
        recipientEl.textContent = `${greeting},`;
    }



    // Set Polaroid Content
    const polaroidImg = document.getElementById('letter-polaroid-img');
    const polaroidCaption = document.getElementById('letter-polaroid-caption');
    const polaroidGradient = document.getElementById('letter-polaroid-gradient');
    const polaroidSilhouette = document.getElementById('letter-polaroid-silhouette');

    if (polaroidCaption && CONFIG.letter.polaroidCaption) {
        polaroidCaption.textContent = CONFIG.letter.polaroidCaption;
    }

    if (polaroidImg && CONFIG.letter.polaroidSrc) {
        polaroidImg.src = CONFIG.letter.polaroidSrc;
        polaroidImg.classList.remove('hidden');
        if (polaroidGradient) polaroidGradient.classList.add('hidden');
        if (polaroidSilhouette) polaroidSilhouette.classList.add('hidden');
    } else if (polaroidImg) {
        polaroidImg.classList.add('hidden');
        if (polaroidGradient) polaroidGradient.classList.remove('hidden');
        if (polaroidSilhouette) polaroidSilhouette.classList.remove('hidden');
    }

    console.log('[Letter Page] Premium version initialized with dynamic content');
}

// ===== FLOATING DUST PARTICLES =====
function initFloatingDust() {
    if (isDustAnimationActive) return;
    isDustAnimationActive = true;

    const dustContainer = document.querySelector('.dust-particles-container');
    if (!dustContainer) return;

    // Create 8 dust particles
    for (let i = 0; i < 8; i++) {
        const dust = document.createElement('div');
        dust.className = 'dust-particle';
        dust.style.cssText = `
            position: absolute;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            filter: blur(1px);
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: float-dust ${12 + Math.random() * 8}s linear infinite;
            animation-delay: ${-Math.random() * 10}s;
            opacity: ${0.3 + Math.random() * 0.5};
        `;
        dustContainer.appendChild(dust);
    }
}

// ===== ENVELOPE INTERACTION =====
function handleLetterInteraction() {
    const envelope = document.getElementById('envelope-main');
    if (!envelope) return;

    if (envelope.classList.contains('is-sealed')) {
        // Play subtle seal break sound (if available)
        playSound('seal-break');

        // Unseal and open 3D envelope with premium animation
        envelope.classList.remove('is-sealed');
        envelope.style.pointerEvents = 'none'; // Prevent re-clicking

        // Add smooth camera follow effect
        setTimeout(() => {
            smoothScrollToLetter();
        }, 800);

        // Start typing after cinematic delay
        if (!letterTyped) {
            setTimeout(() => {
                startLetterTyping();
            }, 1800); // Increased for dramatic effect
        }
    }
}

// ===== SMOOTH SCROLL TO LETTER =====
function smoothScrollToLetter() {
    const letterPaper = document.querySelector('.letter-paper-premium');
    if (!letterPaper) return;

    const rect = letterPaper.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const targetPosition = rect.top + scrollTop - (window.innerHeight / 2) + (rect.height / 2);

    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// ===== PREMIUM TYPEWRITER EFFECT =====
async function startLetterTyping() {
    if (letterTyped) {
        // Already typed: ensure button is visible
        const finaleNextBtn = document.getElementById('finale-next-btn');
        if (finaleNextBtn) {
            finaleNextBtn.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
            finaleNextBtn.classList.add('opacity-100', 'pointer-events-auto');
        }
        return;
    }

    letterTyped = true;
    const bodyEl = document.getElementById('letter-body');
    if (!bodyEl || !CONFIG.letter.message) return;

    // Play gentle typing ambient (if available)
    playAmbientTyping(true);

    const fullText = CONFIG.letter.message;
    bodyEl.innerHTML = '';

    // Check if it's Quill HTML (starts with <p>) or legacy plain text
    if (fullText.startsWith('<p>')) {
        // Rich Text mode: Type the whole blob
        await typeTargetPremium(bodyEl, fullText);
    } else {
        // Legacy mode: split by newlines
        const paragraphs = fullText.split('\n\n');
        for (const pText of paragraphs) {
            if (!letterTyped) break;
            const pEl = document.createElement('p');
            bodyEl.appendChild(pEl);
            await typeTargetPremium(pEl, pText);
            await sleep(300);
        }
    }

    // Type closing with elegant pause
    await sleep(500);
    const closingEl = document.getElementById('letter-closing');
    if (closingEl && letterTyped) {
        await typeTargetPremium(closingEl, "With all my love,");
    }

    // Type signature with flourish
    await sleep(400);
    const signatureEl = document.getElementById('letter-signature');
    if (signatureEl && letterTyped && CONFIG.letter.signature) {
        await typeTargetPremium(signatureEl, CONFIG.letter.signature, 60); // Slower for cursive

        // Add ink bleed effect after signature
        setTimeout(() => {
            signatureEl.style.filter = 'blur(0.3px)';
            setTimeout(() => {
                signatureEl.style.filter = '';
            }, 200);
        }, 100);

        // REVEAL HEART ORNAMENT
        setTimeout(() => {
            const heartOrn = document.getElementById('letter-heart-ornament');
            if (heartOrn) {
                heartOrn.classList.remove('opacity-0');
                heartOrn.classList.add('opacity-100', 'animate-heartbeat');
            }
        }, 1000);
    }

    // Stop typing sound
    playAmbientTyping(false);

    // Reveal Polaroid Photo
    await sleep(500);
    const polaroid = document.querySelector('.polaroid-photo');
    if (polaroid) {
        polaroid.style.display = ''; // Reset inline style
        polaroid.classList.remove('pointer-events-none');
        polaroid.classList.add('animate-slap');
    }

    // Reveal next button with elegant fade
    await sleep(800);
    const finaleNextBtn = document.getElementById('finale-next-btn');
    if (finaleNextBtn) {
        finaleNextBtn.style.transition = 'all 1s cubic-bezier(0.23, 1, 0.32, 1)';
        finaleNextBtn.classList.remove('opacity-0', 'pointer-events-none', 'invisible');
        finaleNextBtn.classList.add('opacity-100', 'pointer-events-auto');

        // Add subtle bounce
        finaleNextBtn.style.animation = 'gentle-bounce 0.6s ease-out';
    }

    console.log('[Letter] Typing complete');
}

// ===== ENHANCED TYPEWRITER WITH HTML SUPPORT =====
function typeTargetPremium(element, htmlContent, baseSpeed = 45) {
    return new Promise(resolve => {
        if (!letterTyped) {
            resolve();
            return;
        }

        element.innerHTML = '';

        // Helper to convert HTML to a sequence of typing actions
        function getTypingActions(node) {
            let actions = [];

            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    const characters = [...child.textContent];
                    characters.forEach(char => {
                        actions.push({ type: 'char', char: char });
                    });
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const el = document.createElement(child.tagName);
                    Array.from(child.attributes).forEach(attr => el.setAttribute(attr.name, attr.value));

                    actions.push({ type: 'openTag', element: el });
                    actions.push(...getTypingActions(child));
                    actions.push({ type: 'closeTag' });
                }
            });
            return actions;
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        const actions = getTypingActions(tempDiv);

        let actionIdx = 0;
        let activeElement = element;
        const elementStack = [element];

        function nextAction() {
            if (!letterTyped || actionIdx >= actions.length) {
                resolve();
                return;
            }

            const action = actions[actionIdx];
            actionIdx++;

            if (action.type === 'openTag') {
                activeElement.appendChild(action.element);
                elementStack.push(action.element);
                activeElement = action.element;
                nextAction();
            } else if (action.type === 'closeTag') {
                elementStack.pop();
                activeElement = elementStack[elementStack.length - 1];
                nextAction();
            } else if (action.type === 'char') {
                activeElement.append(action.char);

                let delay = baseSpeed;
                const char = action.char;
                if (char === '.' || char === '!' || char === '?') delay = baseSpeed * 4;
                else if (char === ',' || char === ';') delay = baseSpeed * 2;
                else if (char === ' ') delay = baseSpeed * 0.8;

                setTimeout(nextAction, delay);
            }
        }

        nextAction();
    });
}

// ===== RESET LETTER PAGE =====
function resetLetterPage() {
    const envelope = document.getElementById('envelope-main');
    const bodyEl = document.getElementById('letter-body');
    const closingEl = document.getElementById('letter-closing');
    const signatureEl = document.getElementById('letter-signature');

    letterTyped = false;

    if (bodyEl) bodyEl.innerHTML = '';
    if (closingEl) closingEl.textContent = '';
    if (signatureEl) signatureEl.textContent = '';

    if (envelope) {
        envelope.classList.add('is-sealed');
        envelope.style.pointerEvents = '';
    }

    const polaroid = document.querySelector('.polaroid-photo');
    if (polaroid) {
        polaroid.classList.remove('animate-slap');
        polaroid.classList.add('opacity-0', 'pointer-events-none');
        polaroid.style.display = 'none';
    }

    // Hide next button
    const finaleNextBtn = document.getElementById('finale-next-btn');
    if (finaleNextBtn) {
        finaleNextBtn.classList.add('opacity-0', 'pointer-events-none', 'invisible');
        finaleNextBtn.classList.remove('opacity-100', 'pointer-events-auto');
    }

    playAmbientTyping(false);

    // RE-INIT to update dynamic content (Live Preview)
    initLetterPage();

    console.log('[Letter] Page reset and re-initialized');
}

// ===== UTILITY FUNCTIONS =====
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ===== SOUND EFFECTS (Optional Enhancement) =====
let ambientTypingInterval = null;

function playSound(soundName) {
    // Optional: Add subtle sound effects
    // Example: seal-break, paper-unfold, etc.
    // Implement with Howler.js or Web Audio API
    console.log(`[Sound] ${soundName}`);
}

function playAmbientTyping(enabled) {
    if (enabled && !ambientTypingInterval) {
        // Optional: Very subtle typing rhythm sound
        // clearInterval would be called when typing stops
        console.log('[Sound] Ambient typing started');
    } else if (!enabled && ambientTypingInterval) {
        clearInterval(ambientTypingInterval);
        ambientTypingInterval = null;
        console.log('[Sound] Ambient typing stopped');
    }
}

// ===== PARALLAX EFFECT (Optional Enhancement) =====
let isParallaxInitialized = false;
function initLetterParallax() {
    if (isParallaxInitialized) return;
    const letterPaper = document.querySelector('.letter-paper-premium');
    if (!letterPaper) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * 0.05;

        // Subtle parallax on letter
        letterPaper.style.transform = `translate(-50%, -50%) translateY(${-100 + rate}px) scale(1)`;
    }, { passive: true });
    isParallaxInitialized = true;
}

// ===== CURSOR INTERACTION (Optional Enhancement) =====
let isCursorInitialized = false;
function initPremiumCursor() {
    if (isCursorInitialized) return;
    const envelope = document.getElementById('envelope-main');
    if (!envelope) return;

    envelope.addEventListener('mousemove', (e) => {
        if (!envelope.classList.contains('is-sealed')) return;

        const rect = envelope.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const angleX = (y - centerY) / 30;
        const angleY = -(x - centerX) / 30;

        envelope.style.transform = `translateY(-8px) rotateX(${angleX}deg) rotateY(${angleY}deg)`;
    });

    envelope.addEventListener('mouseleave', () => {
        if (!envelope.classList.contains('is-sealed')) return;
        envelope.style.transform = '';
    });
    isCursorInitialized = true;
}

// Page 9: Invitation Logic
function initInvitationPage() {
    const noBtn = document.getElementById('no-btn');
    if (!noBtn) return;

    // Reset position when entering
    noBtn.style.position = '';
    noBtn.style.left = '';
    noBtn.style.top = '';

    const moveButton = () => {
        const padding = 60;
        const maxX = window.innerWidth - noBtn.offsetWidth - padding;
        const maxY = window.innerHeight - noBtn.offsetHeight - padding;

        const randomX = Math.max(padding, Math.floor(Math.random() * maxX));
        const randomY = Math.max(padding, Math.floor(Math.random() * maxY));

        noBtn.style.position = 'fixed';
        noBtn.style.left = `${randomX}px`;
        noBtn.style.top = `${randomY}px`;
    };

    // Responsive dodging - moves on mouseover
    noBtn.addEventListener('mouseover', moveButton);
    // Touch support for mobile dodging
    noBtn.addEventListener('touchstart', (e) => {
        moveButton();
        e.preventDefault();
    }, { passive: false });
}

// Page 10: Finale Logic (Treasure Hunt)
let heartsFound = 0;
const totalHearts = 5;

function initFinalePage() {
    heartsFound = 0;
    const counter = document.getElementById('hearts-counter');
    const items = document.getElementById('treasure-hunt-items');
    const lockOverlay = document.getElementById('video-lock-overlay');
    const progress = document.getElementById('unlock-progress');
    const videoContainer = document.getElementById('finale-video-container');

    if (counter) counter.textContent = `Hearts Collected: 0/${totalHearts}`;
    if (progress) progress.style.width = '0%';

    if (items) {
        items.classList.remove('hidden');
        items.innerHTML = ''; // Fresh placement

        for (let i = 0; i < totalHearts; i++) {
            const heart = document.createElement('div');
            heart.className = 'treasure-item absolute cursor-pointer z-40';
            heart.innerHTML = '<span class="material-symbols-outlined text-rose-500 text-4xl md:text-5xl fill-1">favorite</span>';

            const padding = 80;
            const top = padding + Math.random() * (window.innerHeight - padding * 2.5);
            const left = padding + Math.random() * (window.innerWidth - padding * 2);

            heart.style.top = `${top}px`;
            heart.style.left = `${left}px`;
            heart.onclick = () => foundHeart(heart);
            items.appendChild(heart);
        }
    }

    // Reset video and overlay
    if (lockOverlay) {
        lockOverlay.style.transform = '';
        lockOverlay.classList.remove('opacity-0', 'pointer-events-none');
    }
    if (videoContainer) videoContainer.innerHTML = '<div class="opacity-10"><span class="material-symbols-outlined text-white text-9xl">play_circle</span></div>';

    createRosePetals();
}

function createRosePetals() {
    const container = document.getElementById('rose-petals-container');
    if (!container) return;
    container.innerHTML = '';

    for (let i = 0; i < 15; i++) {
        const petal = document.createElement('div');
        petal.className = 'rose-petal absolute text-rose-200/40 select-none pointer-events-none';
        petal.style.left = `${Math.random() * 100}%`;
        petal.style.top = `-50px`;
        petal.style.fontSize = `${10 + Math.random() * 20}px`;
        petal.innerHTML = '🌸';

        const duration = 10 + Math.random() * 20;
        const delay = Math.random() * 10;
        petal.style.animation = `fall ${duration}s linear ${delay}s infinite`;

        container.appendChild(petal);
    }
}

function foundHeart(el) {
    if (el.classList.contains('found-animation')) return;

    heartsFound++;
    el.classList.add('found-animation');
    createSparkles(el);

    const counter = document.getElementById('hearts-counter');
    const progress = document.getElementById('unlock-progress');
    if (counter) counter.textContent = `Hearts Collected: ${heartsFound}/${totalHearts}`;
    if (progress) progress.style.width = `${(heartsFound / totalHearts) * 100}%`;

    if (heartsFound === totalHearts) {
        setTimeout(unlockFinale, 800);
    }
}

function createSparkles(el) {
    const rect = el.getBoundingClientRect();
    for (let i = 0; i < 12; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'fixed pointer-events-none text-rose-400 z-50 animate-ping';
        sparkle.innerHTML = '✨';
        sparkle.style.left = `${rect.left + Math.random() * rect.width}px`;
        sparkle.style.top = `${rect.top + Math.random() * rect.height}px`;
        sparkle.style.fontSize = `${Math.random() * 20 + 10}px`;
        sparkle.style.transform = `translate(${(Math.random() - 0.5) * 150}px, ${(Math.random() - 0.5) * 150}px)`;
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
    }
}

function createHeartExplosion(el) {
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    for (let i = 0; i < 24; i++) {
        const p = document.createElement('div');
        p.className = 'heart-particle';
        p.innerHTML = Math.random() > 0.5 ? '❤️' : '🌹';
        p.style.left = centerX + 'px';
        p.style.top = centerY + 'px';
        p.style.fontSize = `${Math.random() * 20 + 10}px`;

        const tx = (Math.random() - 0.5) * 400;
        const ty = (Math.random() - 0.5) * 400;
        const tr = (Math.random() - 0.5) * 720;

        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);
        p.style.setProperty('--tr', `${tr}deg`);

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1200);
    }
}

function unlockFinale() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    const lockOverlay = document.getElementById('video-lock-overlay');
    const items = document.getElementById('treasure-hunt-items');
    const container = document.getElementById('finale-video-container');

    if (items) items.classList.add('hidden');

    if (lockOverlay) {
        lockOverlay.classList.add('opacity-0', 'pointer-events-none');
        lockOverlay.style.transform = 'translateY(-40px) scale(1.1)';
    }

    // Mute Global Background Music
    pauseMusic();
    bgMusic.muted = true;

    // Inject and Play Video
    if (container && CONFIG && CONFIG.finale && CONFIG.finale.videoSrc) {
        const src = CONFIG.finale.videoSrc;
        const isYoutube = src.includes('youtube.com') || src.includes('youtu.be');

        if (isYoutube) {
            let videoId = "";
            if (src.includes('v=')) {
                videoId = src.split('v=')[1].split('&')[0];
            } else {
                videoId = src.split('/').pop();
            }
            container.innerHTML = `
                <iframe class="w-full h-full" 
                        src="https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&loop=1&playlist=${videoId}" 
                        frameborder="0" 
                        allow="autoplay; encrypted-media" 
                        allowfullscreen>
                </iframe>`;

            // Native Video: Use Blob to bypass IDM
            fetch(src)
                .then(response => response.blob())
                .then(blob => {
                    const blobUrl = URL.createObjectURL(blob);

                    container.innerHTML = ''; // Clear container

                    const videoEl = document.createElement('video');
                    videoEl.className = "w-full h-full object-contain";
                    videoEl.autoplay = true;
                    videoEl.controls = false; // Custom controls or none to prevent download button
                    videoEl.loop = true;
                    videoEl.playsInline = true;
                    videoEl.src = blobUrl;

                    container.appendChild(videoEl);

                    // Add Overlay Shield (Prevents IDM hover button)
                    const shield = document.createElement('div');
                    shield.className = "absolute inset-0 z-50 bg-transparent";
                    // Allow clicking through for start/stop if needed, or handle clicks entirely via a parent
                    // For now, we want to block hover. 

                    // Add simple click to toggle play/pause since controls are hidden
                    shield.onclick = () => {
                        if (videoEl.paused) videoEl.play();
                        else videoEl.pause();
                    };

                    container.appendChild(shield);

                })
                .catch(err => {
                    console.error("Video Blob fetch failed:", err);
                    container.innerHTML = `
                        <video class="w-full h-full object-contain" autoplay controls loop playsinline>
                            <source src="${src}" type="video/mp4">
                            Your browser does not support the video tag.
                        </video>`;
                });
        }
    }
}

// --- Countdown Timer Logic ---
let countdownInterval = null; // Global to allow clearing

function initCountdown() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG || !CONFIG.countdown || !CONFIG.countdown.targetDate) {
        console.warn("[Countdown] No target date in CONFIG");
        return;
    }

    console.log("[Countdown] Initializing with:", CONFIG.countdown.targetDate);

    // Clear existing interval if re-initializing
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const counterDiv = document.getElementById('valentine-countdown');
    const labelEl = document.getElementById('countdown-label');

    if (!counterDiv) return;

    function updateTimer() {
        // Re-read target date from CONFIG every time (to support live updates)
        const targetDate = new Date(CONFIG.countdown.targetDate).getTime();
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            // Timer expired
            if (countdownInterval) {
                clearInterval(countdownInterval);
                countdownInterval = null;
            }
            if (counterDiv) counterDiv.innerHTML = `<span class="text-3xl font-display font-bold text-primary dark:text-rose-100 animate-pulse">${CONFIG.countdown.finishMessage}</span>`;
            if (labelEl) labelEl.textContent = CONFIG.countdown.finishLabel;
            return;
        }

        // Calculations
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Update DOM with zero-padding
        if (daysEl) daysEl.textContent = days.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = hours.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = minutes.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = seconds.toString().padStart(2, '0');

        // Update Label if it contains date info
        if (labelEl && CONFIG.countdown.targetDate) {
            const d = new Date(CONFIG.countdown.targetDate);
            const options = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            labelEl.textContent = `Counting down to ${d.toLocaleDateString('en-US', options)}`;
        }
    }

    // Run immediately then interval
    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}

// --- LOVE-LOCK FINALE LOGIC ---
function lockTheHeart() {
    const shackle = document.getElementById('padlock-shackle');
    const container = document.getElementById('padlock-container');
    const instruction = document.getElementById('lock-instruction');
    const finalMsg = document.getElementById('lock-final-message-container');
    const lockDate = document.getElementById('lock-date');
    const key = document.getElementById('padlock-key');
    const screenshotBtn = document.getElementById('lock-screenshot-btn');

    if (!shackle || shackle.classList.contains('shackle-locked')) return;

    // 1. Play Lock Sound
    const lockSfx = new Audio();
    fetchMediaBlob('https://www.soundjay.com/buttons/sounds/button-10.mp3').then(url => {
        lockSfx.src = url;
        lockSfx.volume = 0.6;
        lockSfx.play().catch(e => console.log("Sound blocked"));
    });

    // 1b. Stop Background Music
    if (bgMusic) {
        bgMusic.pause();
        if (typeof updatePlayIcon === 'function') updatePlayIcon();
    }

    // 2. Animate Shackle
    shackle.classList.add('shackle-locked');

    // 3. Stop Floating Animation
    container.classList.remove('lock-float');

    // 4. Vanishing Key Animation
    if (key) {
        key.classList.add('key-vanish');
    }

    // 5. Update UI & Date
    if (lockDate) {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        lockDate.textContent = `Locked on ${now.toLocaleDateString('en-US', options)}`;
    }

    instruction.style.opacity = '0';
    setTimeout(() => {
        instruction.classList.add('hidden');
        finalMsg.classList.remove('pointer-events-none');
        finalMsg.style.opacity = '1';
        if (lockDate) lockDate.style.opacity = '0.4';
        if (screenshotBtn) screenshotBtn.classList.remove('hidden');

        // 6. CINEMATIC SEQUENCES
        startCinematicOutro();
    }, 1000);
}

function startCinematicOutro() {
    setTimeout(() => {
        // Slide in cinematic bars
        document.body.classList.add('cinematic-active');

        // Final Fade to black and Navigate
        setTimeout(() => {
            const finalFade = document.getElementById('final-cinematic-fade');
            if (finalFade) {
                finalFade.classList.add('fade-to-black');
            }

            // Navigate to Infinity Scroll only if enabled, else reset
            setTimeout(() => {
                const infConfig = getPageConfig('page-10');
                if (infConfig && infConfig.enabled) {
                    MapsTo('page-9', 'page-10');
                } else {
                    location.reload();
                }
            }, 3500);
        }, 15000); // FIXED: 15 seconds (was 7) - gives users time to take screenshot
    }, 3500); // Wait 3.5 seconds after lock before starting cinematic bars
}

function captureLockPage() {
    const container = document.querySelector('#page-9 main');
    if (typeof captureElement === 'function') {
        captureElement(container, 'Our-Love-Locked.png');
    }
}

// Ensure Page 8 "Next" logic is visible if it needs to go to Page 9
function checkLetterCompletion() {
    const nextBtnContainer = document.querySelector('#page-8 .nav-bottom-grid div:last-child');
    if (nextBtnContainer) {
        nextBtnContainer.classList.remove('invisible');
        nextBtnContainer.innerHTML = `
            <button onclick="goNextPage()" class="nav-btn-standard">
                <span>Finale</span>
                <span class="material-symbols-outlined text-lg">arrow_forward_ios</span>
            </button>
        `;
    }
}

/**
 * Sync page visibility in DOM based on enabled status
 */
function syncPageVisibility() {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG || !CONFIG.pageConfig || !CONFIG.pageConfig.pages) return;

    const allPageIds = Object.keys(CONFIG.pageConfig.pages);

    allPageIds.forEach(pageId => {
        const pageElement = document.getElementById(pageId);
        if (!pageElement) return;

        const config = getPageConfig(pageId);

        // Don't mess with the currently active page
        const isActive = !pageElement.classList.contains('hidden');
        if (isActive) return;

        // If page is disabled, ensure it stays hidden
        if (config && !config.enabled) {
            pageElement.classList.add('hidden');
            pageElement.style.display = 'none';
        } else if (config && config.enabled) {
            // If page is enabled, allow it to be shown
            pageElement.style.display = '';
        }
    });

    console.log(`📄 Page visibility synced. ${getTotalEnabledPages()} pages enabled.`);
}

/**
 * Get all pages sorted by order, filtered by enabled status
 */
function getPages(onlyEnabled = true) {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();

    if (!CONFIG || !CONFIG.pageConfig || !CONFIG.pageConfig.pages) {
        return [];
    }

    const pages = Object.values(CONFIG.pageConfig.pages);
    let filtered = pages;

    if (onlyEnabled) {
        filtered = pages.filter(p => p.enabled);
    }

    return filtered.sort((a, b) => a.order - b.order);
}

/**
 * Get the next enabled page after current page
 */
function getNextPage(currentPageId) {
    const enabledPages = getPages(true);
    const currentIndex = enabledPages.findIndex(p => p.id === currentPageId);

    if (currentIndex === -1 || currentIndex >= enabledPages.length - 1) {
        return null;
    }

    return enabledPages[currentIndex + 1].id;
}

/**
 * Get the previous enabled page before current page
 */
function getPreviousPage(currentPageId) {
    const enabledPages = getPages(true);
    const currentIndex = enabledPages.findIndex(p => p.id === currentPageId);

    if (currentIndex <= 0) {
        return null;
    }

    return enabledPages[currentIndex - 1].id;
}

/**
 * Get total count of enabled pages
 */
function getTotalEnabledPages() {
    return getPages(true).length;
}

/**
 * Get current page number (1-indexed) among enabled pages
 */
function getCurrentPageNumber(pageId) {
    const enabledPages = getPages(true);
    const index = enabledPages.findIndex(p => p.id === pageId);
    return index === -1 ? 0 : index + 1;
}

/**
 * Check if a page is enabled
 */
function isPageEnabled(pageId) {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG || !CONFIG.pageConfig || !CONFIG.pageConfig.pages) return true;
    const page = CONFIG.pageConfig.pages[pageId];
    return page ? page.enabled : true;
}

/**
 * Get page configuration by ID
 */
function getPageConfig(pageId) {
    // ✅ FIX: Use window.CONFIG explicitly
    const CONFIG = safeGetConfig();
    if (!CONFIG || !CONFIG.pageConfig || !CONFIG.pageConfig.pages) return null;
    return CONFIG.pageConfig.pages[pageId] || null;
}

/**
 * Handle dynamic forward navigation
 */

function goNextPage() {
    if (isNavigating) return;
    const nextId = getNextPage(currentPageId);
    if (nextId) {
        MapsTo(currentPageId, nextId);
    }
}

/**
 * Handle dynamic backward navigation
 */
function goPrevPage() {
    if (isNavigating) return;
    const prevId = getPreviousPage(currentPageId);
    if (prevId) {
        MapsTo(currentPageId, prevId);
    }
}

// ============================================================
// STEP 6: TAMBAHKAN DI AKHIR FILE (DEBUG & EVENT LISTENER)
// ============================================================

// Listen for config updates
if (typeof window !== 'undefined') {
    window.addEventListener('config-updated', function (event) {
        console.log('[Event] Config updated event received:', event.detail);

        // Auto-reload content when config changes
        if (typeof loadDynamicContent === 'function') {
            console.log('[Event] Auto-reloading dynamic content...');
            loadDynamicContent();
        }

        if (typeof applyTheme === 'function') {
            console.log('[Event] Auto-applying theme...');
            applyTheme();
        }
    });
}

// Expose diagnostic function to console
window.diagnosticConfig = function () {
    console.log('=================================');
    console.log('CONFIG DIAGNOSTIC');
    console.log('=================================');
    console.log('window.CONFIG:', window.CONFIG);
    console.log('window._CONFIG_DATA:', window._CONFIG_DATA);
    console.log('Are they same?', window.CONFIG === window._CONFIG_DATA);
    console.log('=================================');
};

console.log('[Script] ✅ All CONFIG fixes applied. Run diagnosticConfig() to check status.');