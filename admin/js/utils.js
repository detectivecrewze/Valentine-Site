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

                    // Convert to base64
                    canvas.toBlob((blob) => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                            resolve(reader.result);
                        };
                        reader.readAsDataURL(blob);
                    }, 'image/jpeg', quality);
                };

                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
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
                // Compress Image
                const base64 = await this.compressImage(file, 1200, 0.85);

                // Convert Base64 back to Blob for upload
                const res = await fetch(base64);
                const blob = await res.blob();
                fileToUpload = new File([blob], file.name, { type: 'image/jpeg' });
            } else {
                console.log('[Utils] Non-image file detected, skipping compression:', file.type);
            }

            // 2. Upload to Cloudflare Worker
            console.log('[Utils] Uploading to Cloudflare...');
            const formData = new FormData();
            formData.append('file', fileToUpload);

            // Use the same worker domain
            const WORKER_URL = 'https://valentine-upload.aldoramadhan16.workers.dev/upload';

            const response = await fetch(WORKER_URL, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Upload failed');
            }

            // 3. Update Input with Public URL
            if (targetInput) {
                targetInput.value = result.url;
                targetInput.disabled = false;
                targetInput.dispatchEvent(new Event('input'));
            }

            // 4. Update Preview (Images or Audio)
            this.updatePreview('prev_' + targetInputId, result.url, file.type);

            // 5. Sync State
            state.save();
            state.syncToPreview();

            console.log('[Utils] Upload success:', result.url);
            utils.showNotification('File uploaded successfully!', 'success');

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
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-[300] px-6 py-3 rounded-xl shadow-lg transition-all ${type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
                'bg-blue-500 text-white'
            }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
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
    }
};

// Make utils globally available
if (typeof window !== 'undefined') {
    window.utils = utils;
}
