// Utility Functions

const utils = {
    // Compress image before upload
    async compressImage(file, maxWidth = 1200, quality = 0.85) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    // Resolve with the Blob directly
                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('Failed to create blob from canvas'));
                        }
                    }, 'image/jpeg', quality);
                };

                img.onerror = () => reject(new Error('Failed to load image for compression'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Failed to read file for compression'));
            reader.readAsDataURL(file);
        });
    },

    // ============================================================
    // EXIF DATA EXTRACTION
    // Extract GPS coordinates and date from photo metadata
    // ============================================================
    async extractExifData(file) {
        return new Promise((resolve) => {
            // Check if EXIF library is loaded
            if (typeof EXIF === 'undefined') {
                console.warn('[EXIF] EXIF library not loaded');
                resolve(null);
                return;
            }

            // Only process image files
            if (!file.type.startsWith('image/')) {
                resolve(null);
                return;
            }

            EXIF.getData(file, function () {
                try {
                    const exifData = {};

                    // Extract GPS coordinates
                    const latDMS = EXIF.getTag(this, 'GPSLatitude');
                    const latRef = EXIF.getTag(this, 'GPSLatitudeRef');
                    const lngDMS = EXIF.getTag(this, 'GPSLongitude');
                    const lngRef = EXIF.getTag(this, 'GPSLongitudeRef');

                    if (latDMS && lngDMS) {
                        // Convert DMS (Degrees, Minutes, Seconds) to Decimal
                        let lat = utils.dmsToDecimal(latDMS[0], latDMS[1], latDMS[2]);
                        let lng = utils.dmsToDecimal(lngDMS[0], lngDMS[1], lngDMS[2]);

                        // Apply direction (S = negative, W = negative)
                        if (latRef === 'S') lat = -lat;
                        if (lngRef === 'W') lng = -lng;

                        exifData.lat = lat;
                        exifData.lng = lng;
                        console.log('[EXIF] GPS found:', lat, lng);
                    }

                    // Extract date
                    const dateOriginal = EXIF.getTag(this, 'DateTimeOriginal');
                    const dateDigitized = EXIF.getTag(this, 'DateTimeDigitized');
                    const dateString = dateOriginal || dateDigitized;

                    if (dateString) {
                        // EXIF date format: "2024:02:14 15:30:00"
                        // Convert to: "2024-02-14"
                        const parts = dateString.split(' ')[0].split(':');
                        if (parts.length === 3) {
                            exifData.date = `${parts[0]}-${parts[1]}-${parts[2]}`;
                            console.log('[EXIF] Date found:', exifData.date);
                        }
                    }

                    // Return data if we found anything useful
                    if (exifData.lat || exifData.date) {
                        resolve(exifData);
                    } else {
                        console.log('[EXIF] No GPS or date data found in image');
                        resolve(null);
                    }
                } catch (error) {
                    console.error('[EXIF] Error extracting data:', error);
                    resolve(null);
                }
            });
        });
    },

    // Convert Degrees-Minutes-Seconds to Decimal degrees
    dmsToDecimal(degrees, minutes, seconds) {
        return degrees + (minutes / 60) + (seconds / 3600);
    },


    // ============================================================
    // REAL FIX: Apply Theme Preset
    // Problem: setVal() doesn't trigger input events
    // Solution: Manually trigger events AND use requestAnimationFrame
    // ============================================================
    applyThemePreset(presetKey) {
        console.log('[Utils] Applying preset:', presetKey);

        if (!THEME_PRESETS) {
            console.error('[Utils] THEME_PRESETS not defined!');
            return;
        }

        if (!THEME_PRESETS[presetKey]) {
            console.error('[Utils] Preset not found:', presetKey);
            return;
        }

        const preset = THEME_PRESETS[presetKey];
        console.log('[Utils] Found preset details:', preset);

        // ✅ FIX 1: Set values AND trigger events
        const setAndTrigger = (id, value) => {
            const el = document.getElementById(id);
            if (el) {
                el.value = value || '';
                // Trigger both input and change events
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
            }
        };

        // Set all theme inputs with event triggering
        setAndTrigger('theme_bg', preset.bg);
        setAndTrigger('theme_color', preset.color);
        setAndTrigger('theme_font_display', preset.fontDisplay);
        setAndTrigger('theme_font_sans', preset.fontSans);
        setAndTrigger('theme_particles', preset.particles);

        // Update Color Picker (special case - also trigger)
        const picker = document.getElementById('theme_color_picker');
        if (picker) {
            picker.value = preset.color;
            picker.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // ✅ FIX 2: Use requestAnimationFrame for reliable sync
        // This ensures all events have been processed
        requestAnimationFrame(() => {
            state.save();
            state.syncToPreview();
            this.showNotification(`Theme set to ${preset.name}!`, 'success');
        });
    },

    // Handle media upload
    async handleMediaUpload(input, targetInputId) {
        const file = input.files[0];
        if (!file) return;

        const targetInput = document.getElementById(targetInputId);
        const originalValue = targetInput ? targetInput.value : '';

        try {
            // Show loading indicator
            if (targetInput) {
                targetInput.value = 'Uploading...';
                targetInput.disabled = true;
            }

            let fileToUpload = file;

            // 1. Optimize Images (skip for Audio/Video)
            if (file.type.startsWith('image/')) {
                try {
                    console.log('[Utils] Compressing image...');
                    const compressedBlob = await this.compressImage(file, 1200, 0.85);

                    // Create a proper File object from the compressed Blob
                    fileToUpload = new File([compressedBlob], file.name, {
                        type: 'image/jpeg',
                        lastModified: Date.now()
                    });
                    console.log(`[Utils] Compressed: ${(file.size / 1024).toFixed(1)}KB -> ${(fileToUpload.size / 1024).toFixed(1)}KB`);
                } catch (err) {
                    console.warn('[Utils] Compression failed, using original:', err);
                }
            } else {
                console.log('[Utils] Non-image file detected, skipping compression:', file.type);
            }

            // 2. Check File Size (Warning for large files)
            const MAX_SIZE = 25 * 1024 * 1024; // 25MB limit (Cloudflare Worker free limit is usually around here)
            if (fileToUpload.size > MAX_SIZE) {
                throw new Error(`File is too large (${(fileToUpload.size / (1024 * 1024)).toFixed(1)}MB). Max limit is 25MB.`);
            }

            // 3. Prepare Form Data
            const formData = new FormData();
            formData.append('file', fileToUpload);

            // 4. Upload to Cloudflare via Worker with Timeout
            const WORKER_URL = 'https://valentine-upload.aldoramadhan16.workers.dev/upload';
            console.log('[Utils] Uploading to:', WORKER_URL);

            if (targetInput && !file.type.startsWith('image/')) {
                targetInput.value = 'Uploading (Song may take 1-2 mins)...';
            }

            // Create a timeout controller
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout

            try {
                const response = await fetch(WORKER_URL, {
                    method: 'POST',
                    body: formData,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({ error: 'Unknown server error' }));
                    throw new Error(errData.error || `Upload failed (${response.status})`);
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Upload failed');
                }

                // 4. Update Input with Public URL
                if (targetInput) {
                    targetInput.value = result.url;
                    targetInput.disabled = false;

                    // Trigger events to update state and UI
                    targetInput.dispatchEvent(new Event('input', { bubbles: true }));
                    targetInput.dispatchEvent(new Event('change', { bubbles: true }));
                }

                // 5. Update Preview (Images or Audio)
                const previewIds = [
                    'prev_' + targetInputId,
                    targetInputId.replace('-input', '-img'),
                    targetInputId.replace('-input', '-preview'),
                    targetInputId.replace('-input', ''),
                    targetInputId.replace('input-', ''),
                    targetInputId.replace('-src', '-preview'),
                    targetInputId.replace('-src', '-img'),
                    targetInputId.replace('-src', ''),
                    'preview-' + targetInputId
                ];

                for (const pid of previewIds) {
                    const previewEl = document.getElementById(pid);
                    if (previewEl) {
                        this.updatePreview(pid, result.url, file.type);
                        break;
                    }
                }

                // 6. Finalize
                state.save();
                state.syncToPreview();
                console.log('[Utils] Upload successful:', result.url);
                utils.showNotification('File uploaded successfully!', 'success');

            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') {
                    throw new Error('Upload timed out. The file might be too large or your connection is slow.');
                }
                throw error;
            }

        } catch (error) {
            console.error('[Utils] Upload failed:', error);
            alert('Upload failed: ' + error.message);

            // Revert on failure
            if (targetInput) {
                targetInput.value = originalValue;
                targetInput.disabled = false;
            }
        }
    },

    // Update media preview
    updatePreview(previewId, src, type) {
        const preview = document.getElementById(previewId);
        if (!preview || !src) return;

        // Handle Audio Players
        if (preview.tagName === 'AUDIO') {
            preview.src = src;
            preview.classList.remove('hidden');
            preview.load(); // Refresh audio source
        }
        // Handle Images
        else {
            preview.src = src;
            preview.classList.remove('hidden');
        }
    },

    // Get input value helper
    val(id) {
        const el = document.getElementById(id);
        return el ? el.value : '';
    },

    // Set input value helper (IMPROVED - triggers events)
    setVal(id, value) {
        const el = document.getElementById(id);
        if (el) {
            el.value = value || '';
            // Trigger events so listeners know the value changed
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    },

    // Generate random ID
    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Format date for input
    formatDateForInput(isoString) {
        try {
            const date = new Date(isoString);
            const offset = date.getTimezoneOffset() * 60000;
            const localDate = new Date(date.getTime() - offset);
            return localDate.toISOString().slice(0, 16);
        } catch (e) {
            return '';
        }
    },

    // Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Show notification
    showNotification(message, type = 'success', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-[300] px-6 py-3 rounded-xl shadow-lg transition-all max-w-md ${type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
            }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    },

    // Download JSON file
    downloadJSON(data, filename = 'valentine-config.json') {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
    },

    // Copy to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard!', 'success');
            return true;
        } catch (error) {
            console.error('[Utils] Copy failed:', error);
            this.showNotification('Copy failed', 'error');
            return false;
        }
    },

    // Validate URL
    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    },

    // Convert GDrive share link to direct link
    // Convert GDrive or Dropbox share link to direct link
    convertMusicLink(url) {
        if (!url) return '';

        let processedUrl = url.trim();

        // Handle Google Drive
        if (processedUrl.includes('drive.google.com')) {
            const match = processedUrl.match(/\/d\/([^\/]+)/);
            if (match && match[1]) {
                return `https://drive.google.com/uc?export=download&id=${match[1]}`;
            }
        }

        // Handle Dropbox
        if (processedUrl.includes('dropbox.com')) {
            // Replace ?dl=0 with ?raw=1 or ?dl=1
            processedUrl = processedUrl.replace(/\?dl=0$/, '?raw=1');
            if (!processedUrl.includes('?')) {
                processedUrl += '?raw=1';
            }
            return processedUrl.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
        }

        return processedUrl;
    },

    // Kept for backward compatibility
    convertGDriveLink(url) {
        return this.convertMusicLink(url);
    },

    // Debounce function
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // ✅ NEW: Count all photos across the entire configuration (Excluding Theme and Music Player)
    countAllPhotos(config) {
        if (!config) return 0;
        let count = 0;

        // Helper to check if string is a valid image URL (including local assets)
        const isPhoto = (url) => {
            if (!url || typeof url !== 'string' || url.trim() === '') return false;
            // Any string that looks like a path or URL for an image
            const lower = url.toLowerCase();
            return lower.includes('http') ||
                lower.startsWith('assets/') ||
                lower.includes('.jpg') ||
                lower.includes('.jpeg') ||
                lower.includes('.png') ||
                lower.includes('.webp') ||
                lower.includes('.gif');
        };

        // 1. Greeting
        if (isPhoto(config.greeting?.imageSrc)) count++;

        // 2. Wrapped
        if (isPhoto(config.wrapped?.imageSrc)) count++;

        // 3. Memory Gallery
        if (config.gallery?.memories) {
            config.gallery.memories.forEach(m => {
                // Count if it's explicitly type image OR just has a valid src
                if ((m.type === 'image' || !m.type) && isPhoto(m.src)) count++;
            });
        }

        // 4. Map
        if (config.map?.locations) {
            config.map.locations.forEach(l => {
                if (isPhoto(l.imageSrc)) count++;
            });
        }

        // 5. Letter
        if (isPhoto(config.letter?.polaroidSrc)) count++;

        // 6. Infinity Scroll
        if (config.infinityScroll?.photos) {
            config.infinityScroll.photos.forEach(p => {
                if (isPhoto(p.src)) count++;
            });
        }

        return count;
    }
};

// Make utils globally available
if (typeof window !== 'undefined') {
    window.utils = utils;
}
