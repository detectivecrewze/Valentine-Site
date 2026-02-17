/**
 * Deep merge two objects - ensures partial configs get defaults for missing sub-keys
 */
const deepMerge = (target, source) => {
    if (!source) return target;
    if (target === source) return target;

    const output = Array.isArray(target) ? [...target] : { ...target };

    if (source && typeof source === 'object') {
        Object.keys(source).forEach(key => {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!(key in target) || !target[key] || typeof target[key] !== 'object') {
                    output[key] = source[key];
                } else {
                    output[key] = deepMerge(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
};

const StudioState = {
    config: null,
    LS_KEY: 'valentine_admin_v2', // Local Backup
    API_BASE_URL: 'https://valentine-upload.aldoramadhan16.workers.dev', // Backend Worker
    currentId: null, // The active Customer ID (e.g. "lisa")
    _saveController: null, // To cancel previous saves (race condition fix)

    async init() {
        console.log('[Studio] Initializing State...');

        // 1. Get ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        this.currentId = urlParams.get('id');
        const accessId = this.currentId ? `access-${this.currentId}` : 'system-page-access';

        // 🟢 2. Fetch Master Page Access (Admin global control)
        try {
            const masterRes = await fetch(`${this.API_BASE_URL}/get-config?id=${accessId}&t=${Date.now()}`, {
                cache: 'no-store',
                mode: 'cors'
            });

            if (masterRes.ok) {
                const masterData = await masterRes.json();
                if (masterData && masterData.allowedIds) {
                    this.allowedIds = masterData.allowedIds;
                    localStorage.setItem(`cache_${accessId}`, JSON.stringify(this.allowedIds));
                }
            }
        } catch (e) {
            console.warn('[Studio] Cloud Access Sync Failed', e);
        }

        // 🟢 3. Load Project Config (Cloud or Factory)
        if (this.currentId) {
            let cloudData = await this.loadFromCloud(this.currentId);
            if (cloudData) {
                this._rawCloudData = cloudData; // 🛠️ Store for thorough media collection

                // 🛠️ FIX: Handle nested config structure if coming from Admin Wizard
                this.config = cloudData.config || cloudData;
                this._isConfigFromCloud = true;

                console.log(`[Studio] 📥 Cloud Data Keys:`, Object.keys(cloudData));
                if (cloudData.pages) console.log(`[Studio] 📥 Pages found: ${cloudData.pages.length}`);

                // 🛠️ ANALYZE & RECOVER: If music is missing/empty, hunt it down everywhere
                if (!this.config.music || this.config.music.length === 0) {
                    console.log('[Studio] 🔍 Searching for misplaced music data...');
                    const recovered = this.deepSearchMusic(cloudData);
                    if (recovered && recovered.length > 0) {
                        this.config.music = recovered;
                        console.log(`[Studio] 🎵 Successfully recovered ${recovered.length} songs from cloud storage.`);
                    }
                }
            }
        }

        // 🛡️ DEEP REPAIR: Base merge with Factory Defaults
        const factoryConfig = window.CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : null);
        const base = factoryConfig ? JSON.parse(JSON.stringify(factoryConfig)) : this.getEmergencyConfig();

        // ⚠️ PRESERVE: Keep cloud music/media if they exist
        const cloudMusic = (this.config && this.config.music && this.config.music.length > 0) ? JSON.parse(JSON.stringify(this.config.music)) : null;
        const cloudMedia = (this.config && this.config.media && this.config.media.length > 0) ? JSON.parse(JSON.stringify(this.config.media)) : null;

        this.config = deepMerge(base, this.config || {});

        // Restore music/media priority (Cloud ALWAYS wins)
        if (cloudMusic) {
            this.config.music = cloudMusic;
            console.log(`[Studio] 🛡️ Restored Cloud Music (${cloudMusic.length} tracks)`);
        }
        if (cloudMedia) this.config.media = cloudMedia;

        // 🟢 4. MEDIA COLLECTION: Auto-scan for all uploaded assets
        this.collectAllMedia();

        // 🛡️ SANITIZE MEDIA: Remove any blank/corrupted strings from the persistent gallery
        if (this.config.media && Array.isArray(this.config.media)) {
            const originalCount = this.config.media.length;
            this.config.media = this.config.media.filter(src =>
                src && typeof src === 'string' && src.trim().length > 10 &&
                !src.includes('undefined') && !src.includes('null') && !src.includes('[object')
            );
            if (this.config.media.length !== originalCount) {
                console.log(`[Studio] 🛡️ Sanitized media gallery: removed ${originalCount - this.config.media.length} invalid entries.`);
            }
        }

        console.log('[Studio] Config Deep-Repaired & Merged');

        // 🟢 5. FINAL SYNC: Mandatory Force Toggles for New Projects
        if (!this._isConfigFromCloud) {
            const pages = this.config?.pageConfig?.pages;
            if (pages && Array.isArray(this.allowedIds) && this.allowedIds.length > 0) {
                Object.keys(pages).forEach(pId => {
                    pages[pId].enabled = this.allowedIds.includes(pId);
                });
            }
        }

        this.sync();
    },

    /**
     * Deeply searches for any music arrays or music-like structures
     */
    deepSearchMusic(obj) {
        if (!obj || typeof obj !== 'object') return null;

        // Pattern 1: Admin Wizard pages array (page-3, type music)
        if (Array.isArray(obj.pages)) {
            const musicPage = obj.pages.find(p => p.type === 'music' || p.pageId === 'page-3' || (p.music && Array.isArray(p.music)));
            if (musicPage && musicPage.music && musicPage.music.length > 0) return musicPage.music;
        }

        // Pattern 2: Recursive search for keys that look like music collections
        let found = null;
        const aliases = ['music', 'playlist', 'songs', 'audioList', 'soundtrack'];

        const find = (o, depth = 0) => {
            if (found || depth > 10) return;
            if (!o || typeof o !== 'object') return;

            for (const key of aliases) {
                if (Array.isArray(o[key]) && o[key].length > 0) {
                    // Peek inside to see if it's music
                    const first = o[key][0];
                    if (first && (first.audioSrc || first.songTitle || first.src)) {
                        found = o[key];
                        return;
                    }
                }
            }

            Object.values(o).forEach(val => {
                if (val && typeof val === 'object') find(val, depth + 1);
            });
        };

        find(obj);
        return found;
    },

    /**
     * Scans the entire config for upload URLs and populates config.media
     */
    collectAllMedia() {
        if (!this.config) return;

        // Start with existing media or empty set
        const mediaSet = new Set(this.config.media || []);

        const scan = (obj, depth = 0) => {
            if (!obj || typeof obj !== 'object' || depth > 15) return;

            Object.values(obj).forEach(val => {
                if (typeof val === 'string') {
                    const str = val.trim();
                    if (str.length < 5) return;

                    // Support Worker Uploads, Dropbox Direct, and standard extensions
                    const isCloud = str.includes('valentine-upload') ||
                        str.includes('dropboxusercontent.com') ||
                        str.includes('dl.dropbox.com');

                    const isMedia = str.match(/\.(jpg|jpeg|png|gif|webp|svg|mp3|wav|dat|ogg|mp4)$/i);

                    if (isCloud || isMedia) {
                        mediaSet.add(str);
                    }
                } else if (typeof val === 'object') {
                    scan(val, depth + 1);
                }
            });
        };

        scan(this.config);

        // Also scan the original cloudData (raw from server) to catch things not merged
        if (this._rawCloudData) {
            scan(this._rawCloudData);
        }

        this.config.media = Array.from(mediaSet);
        console.log(`[Studio] 🖼️ Media scan complete. ${this.config.media.length} items collected.`);
    },

    getEmergencyConfig() {
        return {
            login: { password: "123", title: 'Valentine Login' },
            theme: { backgroundColor: '#ffe5ec', particles: 'hearts' },
            music: [],
            pageConfig: {
                pages: {
                    "page-1": { id: "page-1", name: "Login", type: "login", enabled: true, order: 1, icon: "lock" }
                }
            }
        };
    },

    updateValue(path, value, forceSync = true) {
        const parts = path.split('.');
        let current = this.config;

        for (let i = 0; i < parts.length - 1; i++) {
            let key = parts[i];
            const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
            if (arrayMatch) {
                const arrayKey = arrayMatch[1];
                const index = parseInt(arrayMatch[2]);
                if (!Array.isArray(current[arrayKey])) current[arrayKey] = [];
                if (!current[arrayKey][index]) current[arrayKey][index] = {};
                current = current[arrayKey][index];
            } else {
                if (!current[key]) current[key] = {};
                current = current[key];
            }
        }

        const lastKey = parts[parts.length - 1];
        const arrayMatch = lastKey.match(/^(.+)\[(\d+)\]$/);

        if (arrayMatch) {
            current[arrayMatch[1]][parseInt(arrayMatch[2])] = value;
        } else {
            current[lastKey] = value;
        }

        if (forceSync) this.sync();
        this.requestSave();
    },

    requestSave() {
        if (!this.currentId) return;
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => this.saveToCloud(this.currentId), 2000);
    },

    save() { console.log('[Studio] Config updated in memory'); },

    async loadFromCloud(id) {
        try {
            // ✅ Added cache buster to ensure we get the latest music data
            const res = await fetch(`${this.API_BASE_URL}/get-config?id=${encodeURIComponent(id)}&_t=${Date.now()}`, { cache: 'no-store' });
            if (!res.ok) throw new Error('Not found');
            return await res.json();
        } catch (e) {
            return null;
        }
    },

    async saveToCloud(id) {
        if (!id) return false;

        // 🛡️ SAFETY VALVE: Prevent saving corrupted configs
        if (!this.config || !this.config.theme || !this.config.login) {
            console.error('[Studio] ❌ REFUSAL TO SAVE: Config corrupted.');
            alert('CRITICAL: Studio detected a corrupted configuration. Please refresh.');
            return false;
        }

        try {
            if (!this.config.metadata) this.config.metadata = {};
            this.config.metadata.lastUpdated = new Date().toISOString();
            this.config.metadata.customerId = id;

            if (this._saveController) this._saveController.abort();
            this._saveController = new AbortController();

            const res = await fetch(`${this.API_BASE_URL}/save-config?id=${encodeURIComponent(id)}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.config),
                signal: this._saveController.signal
            });

            if (res.ok) {
                console.log('[Studio] Cloud save success');
                return true;
            }
            throw new Error('Save failed');
        } catch (e) {
            return false;
        }
    },

    sync() {
        const iframe = document.getElementById('preview-frame');
        if (iframe && iframe.contentWindow) {
            // Send to main frame
            iframe.contentWindow.postMessage({ type: 'UPDATE_CONFIG', config: this.config }, '*');

            // Send to nested frames (Invitation, Page 10, etc.)
            try {
                const doc = iframe.contentDocument || iframe.contentWindow.document;
                if (doc) {
                    const nestedFrames = doc.querySelectorAll('iframe');
                    nestedFrames.forEach(frame => {
                        if (frame.contentWindow) {
                            frame.contentWindow.postMessage({ type: 'UPDATE_CONFIG', config: this.config }, '*');
                        }
                    });
                }
            } catch (e) {
                // Ignore cross-origin access errors
            }
        }
    },

    resetToDefaults() {
        const factoryConfig = window.CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : null);
        if (!factoryConfig) return;
        this.config = JSON.parse(JSON.stringify(factoryConfig));
        this.save();
        this.sync();
    },

    async importFromID(sourceId) {
        if (!sourceId) {
            sourceId = prompt("Enter the Project ID (Customer Name) to import from:");
        }
        if (!sourceId) return;

        try {
            console.log(`[Studio] 📥 Attempting to import data from: ${sourceId}`);
            const res = await fetch(`${this.API_BASE_URL}/get-config?id=${encodeURIComponent(sourceId)}&_t=${Date.now()}`);

            if (!res.ok) {
                throw new Error("Project not found or server error.");
            }

            const sourceConfig = await res.json();

            if (confirm(`Heads up! Importing from "${sourceId}" will overwrite your current settings. Continue?`)) {
                // Keep some critical local state
                const currentMetadata = this.config.metadata || {};

                // Deep merge source into current base
                const factoryConfig = window.CONFIG || {};
                this.config = deepMerge(factoryConfig, sourceConfig);

                // Restore/Update metadata
                this.config.metadata = {
                    ...this.config.metadata,
                    customerId: this.currentId,
                    importedFrom: sourceId,
                    lastUpdated: new Date().toISOString()
                };

                // Save & Sync
                await this.saveToCloud(this.currentId);
                this.sync();

                // Refresh all editors
                if (window.Editor && window.Editor.MusicEditor) {
                    window.Editor.MusicEditor.refreshPlaylistFromState();
                }

                // Reload Page (safest way to ensure all modules update)
                if (confirm("Import Successful! Reload the editor to see all changes?")) {
                    window.location.reload();
                } else {
                    alert("Imported! Some tools might need a manual refresh to show the new data.");
                }
            }
        } catch (e) {
            console.error("[Studio] ❌ Import failed:", e);
            alert(`Failed to import: ${e.message}`);
        }
    },

    copyDataJS() {
        const dataJS = `const CONFIG = ${JSON.stringify(this.config, null, 4)};`;
        navigator.clipboard.writeText(dataJS).then(() => {
            alert('data.js content copied to clipboard! You can use this to manually update your data.js file.');
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy to clipboard.');
        });
    },

    downloadDataJS() {
        const dataJS = `const CONFIG = ${JSON.stringify(this.config, null, 4)};`;
        const blob = new Blob([dataJS], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'data.js';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    openFullPreview() {
        const id = this.currentId;
        // The main site handles cloud loading via ?to= or ?id=
        // We open in new tab to see full experience
        const url = id ? `../index.html?to=${encodeURIComponent(id)}&preview=full` : `../index.html?preview=full`;
        window.open(url, '_blank');
    }
};

window.StudioState = StudioState;
