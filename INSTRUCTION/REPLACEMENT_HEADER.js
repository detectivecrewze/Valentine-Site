// ============================================================
// 🔧 FIXED: Core Architecture - Reactive CONFIG System
// ============================================================
// This fix prevents "Cannot redefine property: CONFIG" error
// when data.js already declares "const CONFIG = { ... }"

// Store original CONFIG if it exists (from data.js)
const ORIGINAL_CONFIG = typeof CONFIG !== 'undefined' ? { ...CONFIG } : {};

// Create reactive storage for CONFIG updates
if (!window._CONFIG_DATA) {
    window._CONFIG_DATA = null;
}

/**
 * Safe getter for CONFIG - works regardless of property definition
 * Priority: _CONFIG_DATA (from API) > window.CONFIG (from data.js) > ORIGINAL_CONFIG (backup)
 */
function safeGetConfig() {
    return window._CONFIG_DATA || window.CONFIG || ORIGINAL_CONFIG;
}

/**
 * Safe setter for CONFIG - updates internal storage and dispatches events
 */
function safeSetConfig(value) {
    window._CONFIG_DATA = value;
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
}

// Global variables
const bgMusic = new Audio(); // Global Audio Object
window.bgMusic = bgMusic; // ✅ FIX: Expose to window for iframe access (Cross-origin safe)
let currentSongIndex = 0;
let mapInstance = null;
let revealedMemories = []; // Persistent state for gallery
const printerSfx = new Audio(); // Will be initialized with Blob
const scratchSfx = new Audio(); // Will be initialized with Blob
scratchSfx.volume = 0.4;
let transitionTimeout = null;
let currentPageId = 'page-1'; // Track current active page ID
let isNavigating = false; // Lock to prevent rapid click race conditions

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
