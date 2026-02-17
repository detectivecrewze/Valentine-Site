/**
 * Valentine Design Studio - Core Logic
 */

const Editor = window.Editor = Object.assign(window.Editor || {}, {
    state: null,
    previewFrame: null,
    selectedElement: null,
    previewPlayer: new Audio(),
    currentPreviewIdx: -1,

    async init() {
        console.log('[Studio] Initializing...');
        this.previewFrame = document.getElementById('preview-frame');

        // 🔒 AUTHENTICATION GATE: Check if password is required
        const urlParams = new URLSearchParams(window.location.search);
        const projectId = urlParams.get('id');

        if (projectId) {
            // Update the preview frame to include the ID immediately
            if (this.previewFrame) {
                this.previewFrame.src = `../index.html?preview=studio&id=${projectId}`;
                console.log(`[Studio] Preview frame updated to project ID: ${projectId}`);
            }

            // Check if already authenticated in this session
            const sessionKey = `studio_auth_${projectId}`;
            const isAuthenticated = sessionStorage.getItem(sessionKey);

            if (!isAuthenticated) {
                // Fetch password from cloud to verify
                const projectPassword = await this.fetchProjectPassword(projectId);

                if (projectPassword) {
                    // Password exists — show login gate and STOP init
                    this.showLoginGate(projectId, projectPassword);
                    return; // Don't initialize editor until authenticated
                }
                // No password set — allow access freely
                console.log('[Studio] No password set for project, granting access');
            } else {
                console.log('[Studio] Session authenticated for:', projectId);
            }
        }

        // Continue with normal initialization
        await this.initializeEditor();
    },

    async fetchProjectPassword(projectId) {
        try {
            const API_URL = window.StudioState ? window.StudioState.API_BASE_URL : 'https://valentine-upload.aldoramadhan16.workers.dev';
            const res = await fetch(`${API_URL}/get-config?id=${encodeURIComponent(projectId)}&t=${Date.now()}`, {
                cache: 'no-store',
                mode: 'cors'
            });
            if (res.ok) {
                const config = await res.json();
                return config?.login?.password || null;
            }
        } catch (e) {
            console.warn('[Studio] Failed to fetch project password:', e);
        }
        return null;
    },

    showLoginGate(projectId, correctPassword) {
        const overlay = document.getElementById('studioLoginOverlay');
        const studioApp = document.querySelector('.studio-app');
        if (!overlay) return;

        // Show overlay, hide editor
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
        if (studioApp) studioApp.style.display = 'none';

        // Focus password input
        const pwdInput = document.getElementById('studioPasswordInput');
        if (pwdInput) setTimeout(() => pwdInput.focus(), 300);

        // Toggle password visibility
        const toggleBtn = document.getElementById('studioTogglePwd');
        if (toggleBtn && pwdInput) {
            toggleBtn.onclick = () => {
                const isPwd = pwdInput.type === 'password';
                pwdInput.type = isPwd ? 'text' : 'password';
                toggleBtn.querySelector('.material-symbols-outlined').textContent = isPwd ? 'visibility_off' : 'visibility';
            };
        }

        // Handle form submission
        const form = document.getElementById('studioLoginForm');
        const loginBtn = document.getElementById('studioLoginBtn');
        const errorMsg = document.getElementById('studioLoginError');

        const handleSubmit = async () => {
            const inputPwd = pwdInput.value.trim();
            if (!inputPwd) return;

            // Disable button
            loginBtn.disabled = true;
            loginBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;animation:spin 1s linear infinite;">progress_activity</span> Verifying...';

            // Small delay for UX feel
            await new Promise(r => setTimeout(r, 500));

            const isMatch = (inputPwd.toLowerCase() === correctPassword.toLowerCase());

            if (!isMatch) {
                console.warn(`[Studio] Login failed. Input: "${inputPwd}", Expected: "${correctPassword}" (Hidden for security)`);
            }

            if (isMatch) {
                // ✅ Correct password!
                sessionStorage.setItem(`studio_auth_${projectId}`, 'true');

                // Animate success
                loginBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;">check_circle</span> Access Granted!';
                loginBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';

                await new Promise(r => setTimeout(r, 600));

                // Hide overlay, show editor
                overlay.style.display = 'none';
                if (studioApp) studioApp.style.display = '';

                // NOW initialize the editor
                await this.initializeEditor();
            } else {
                // ❌ Wrong password
                errorMsg.style.display = 'block';
                pwdInput.style.borderColor = '#ef4444';
                pwdInput.value = '';
                pwdInput.focus();

                // Shake animation
                overlay.querySelector('div').style.animation = 'shake 0.5s ease';
                setTimeout(() => overlay.querySelector('div').style.animation = '', 500);

                // Reset button
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;vertical-align:middle;margin-right:6px;">lock_open</span> Unlock Editor';
            }
        };

        if (form) form.onsubmit = (e) => { e.preventDefault(); handleSubmit(); };
        if (loginBtn) loginBtn.onclick = handleSubmit;
        if (pwdInput) pwdInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } });
    },

    async initializeEditor() {
        // Load State (Critical Fix: Await the cloud load)
        try {
            if (window.StudioState) {
                await window.StudioState.init();

                // 🛠️ GLOBAL HEALER: Automatically update old local paths to Dropbox links
                if (window.StudioState.config?.music) {
                    const dropboxMap = {
                        "Always With Me - Spirited Away": "https://www.dropbox.com/scl/fi/3uzwqdycyb6952lq3gui6/Always-With-Me-Spirited-Away.mp3?rlkey=anrzxikooe5b3zntghe6wtihk&st=urapanyk&dl=0",
                        "Daniel Caesar - Who Knows": "https://www.dropbox.com/scl/fi/nqpvliyw9r780t3wk4636/Daniel-Caesar-Who-Knows.mp3?rlkey=vnfwwhsmuwdyt2lrgwuhjyf9u&st=5n9y60l9&dl=0",
                        "Elvis Prasley - Can't Help Falling In Love with You": "https://www.dropbox.com/scl/fi/qvpmw73ob28mrhb4mq81e/Elvis-Prasley-Can-t-Help-Falling-In-Love-with-You.mp3?rlkey=jycw1l6ktfrcelvlnjlqm2mpm&st=bit2i8p3&dl=0",
                        "Frank Ocean - Ivy": "https://www.dropbox.com/scl/fi/dpigzk2rhhvr4lfsxti47/Frank-Ocean-Ivy.mp3?rlkey=9opgczft19mbg6weviwg12wdz&st=qzr1pf93&dl=0",
                        "Gigi Perez - Sailor Song": "https://www.dropbox.com/scl/fi/cwucmfzv2pli58t3mg5im/Gigi-Perez-Sailor-Song.mp3?rlkey=y18ihrykfxt8b0pjc204xwnoc&st=5u41iz22&dl=0",
                        "Hindia - everything u are": "https://www.dropbox.com/scl/fi/eta02fedtrjp04q1ax0u4/Hindia-everything-u-are.mp3?rlkey=jvuvoeud3tveq87bluqdgobd1&st=eo7n58q9&dl=0",
                        "Kodaline - High Hopes": "https://www.dropbox.com/scl/fi/6h4i5ezb00to62f1x54px/Kodaline-High-Hopes.mp3?rlkey=7m8dt1g8ynuensacwqjmbj2mr&st=p6n5xfqa&dl=0",
                        "Mitski - My Love Mine All Mine": "https://www.dropbox.com/scl/fi/71ib9m69dm2ed9squj191/Mitski-My-Love-Mine-All-Mine.mp3?rlkey=i43d8ng7tbndbuflm1yw3j3r9&st=5ziowz09&dl=0"
                    };

                    let wasHealed = false;
                    window.StudioState.config.music.forEach(s => {
                        if (!s.audioSrc) return;

                        // Check if it's a local filename we know
                        for (const fileName in dropboxMap) {
                            if (s.audioSrc.includes(fileName)) {
                                if (s.audioSrc !== dropboxMap[fileName]) {
                                    s.audioSrc = dropboxMap[fileName];
                                    wasHealed = true;
                                }
                            }
                        }

                        // Also catch any remaining .mp3/.dat that weren't in the map
                        if (s.audioSrc.includes('assets/music/') && (s.audioSrc.endsWith('.mp3') || s.audioSrc.endsWith('.dat'))) {
                            // If it's a local file we DON'T have a dropbox link for, at least force .dat
                            if (s.audioSrc.endsWith('.mp3')) {
                                s.audioSrc = s.audioSrc.replace('.mp3', '.dat');
                                wasHealed = true;
                            }
                        }
                    });

                    if (wasHealed) {
                        console.log('[Studio] 💖 Existing music paths healed and moved to Dropbox.');
                        window.StudioState.save();
                        window.StudioState.sync();
                    }
                }

                // 🛠️ PAGE CONFIG HEALER: Fix scrambled orders and incorrect names
                if (window.StudioState.config?.pageConfig?.pages) {
                    const factoryConfig = window.CONFIG || (typeof CONFIG !== 'undefined' ? CONFIG : null);
                    if (factoryConfig && factoryConfig.pageConfig && factoryConfig.pageConfig.pages) {
                        let pageHealCount = 0;
                        const studioPages = window.StudioState.config.pageConfig.pages;
                        const factoryPages = factoryConfig.pageConfig.pages;

                        Object.keys(studioPages).forEach(pId => {
                            if (factoryPages[pId]) {
                                // If name or order differs, restore them to default
                                if (studioPages[pId].name !== factoryPages[pId].name) {
                                    console.log(`[Studio] 🛠️ Healing page name: ${studioPages[pId].name} -> ${factoryPages[pId].name}`);
                                    studioPages[pId].name = factoryPages[pId].name;
                                    pageHealCount++;
                                }
                                if (studioPages[pId].order !== factoryPages[pId].order) {
                                    console.log(`[Studio] 🛠️ Healing page order: ${studioPages[pId].order} -> ${factoryPages[pId].order}`);
                                    studioPages[pId].order = factoryPages[pId].order;
                                    pageHealCount++;
                                }
                            }
                        });

                        if (pageHealCount > 0) {
                            console.log(`[Studio] ✨ Healed ${pageHealCount} page properties to restore correct order.`);
                            window.StudioState.save();
                            window.StudioState.sync();
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[Studio] StudioState.init() failed:', e);
        }

        window.addEventListener('message', (e) => this.handleMessage(e));

        // Setup Sidebar & Events — each wrapped so one failure doesn't kill the rest
        const steps = [
            ['renderPageList', () => this.renderPageList()],
            ['setupEventListeners', () => this.setupEventListeners()],
            ['setupImageTools', () => this.setupImageTools()],
            ['setupGalleryTools', () => this.GalleryEditor.init()],
            ['setupMapTools', () => this.setupMapTools()],
            ['setupSidebarMedia', () => this.setupSidebarMedia()],
            ['setupUploadTools', () => this.setupUploadTools()],
            ['setupThemeTools', () => this.setupThemeTools()],
            ['setupMusicTools', () => this.setupMusicTools()],
            ['setupQuizTools', () => this.QuizEditor.init()],
            ['setupWrappedTools', () => this.WrappedEditor.init()],
            ['setupPasswordTools', () => this.PasswordEditor.init()],
            ['setupInfinityTools', () => this.InfinityEditor.init()],
            ['setupLetterTools', () => this.LetterEditor.init()],
            ['setupInvitationTools', () => this.InvitationEditor.init()],
            ['setupSettingsTools', () => this.setupSettingsTools()],
            ['setupStudioUI', () => this.setupStudioUI()],
            ['renderMediaGallery', () => this.renderMediaGallery()],
        ];

        for (const [name, fn] of steps) {
            try {
                fn();
            } catch (e) {
                console.error(`[Studio] ${name} failed:`, e);
            }
        }

        console.log('[Studio] Initialization complete.');

        // 🎨 Load UX Enhancements (tooltips, wizard, save status, undo/redo)
        if (window.EditorUX) {
            try { EditorUX.init(); } catch (e) { console.warn('[Studio] EditorUX init warning:', e); }
        }
    },

    setupStudioUI() {
        console.log('[Studio] Setting up UI interactions...');

        // 1. Project Name Persistence
        const projectName = document.querySelector('.project-name');
        if (projectName && window.StudioState?.config) {
            // Load existing name if any
            if (window.StudioState.config.metadata?.projectName) {
                projectName.textContent = window.StudioState.config.metadata.projectName;
            }

            projectName.oninput = () => {
                const val = projectName.textContent.trim();
                const nameInput = document.getElementById('setting-project-name');
                if (!window.StudioState.config.metadata) window.StudioState.config.metadata = {};
                window.StudioState.config.metadata.projectName = val;

                // Keep settings panel in sync
                if (nameInput) nameInput.value = val;

                window.StudioState.save();
                window.StudioState.sync();
                window.StudioState.requestSave();
            };
        }

        // 2. Zoom & Device Controls
        const viewport = document.querySelector('.viewport-wrapper');
        const bezel = document.querySelector('.device-bezel');
        const sensors = document.querySelector('.device-sensors');
        const zoomValue = document.querySelector('.zoom-value');

        this.currentZoom = 0.7; // Default 70%

        const applyZoom = () => {
            if (!viewport) return;
            viewport.style.transform = `scale(${this.currentZoom})`;
            if (zoomValue) zoomValue.textContent = Math.round(this.currentZoom * 100) + '%';
        };

        // Initial Zoom Apply
        applyZoom();

        // 3. Zoom Logic (Fixed with IDs)
        const zoomInBtn = document.getElementById('btn-zoom-in');
        const zoomOutBtn = document.getElementById('btn-zoom-out');

        if (zoomInBtn) zoomInBtn.onclick = () => {
            this.currentZoom = Math.min(this.currentZoom + 0.1, 1.2);
            applyZoom();
            console.log('[Studio] Zoom In:', this.currentZoom);
        };

        if (zoomOutBtn) zoomOutBtn.onclick = () => {
            this.currentZoom = Math.max(this.currentZoom - 0.1, 0.3);
            applyZoom();
            console.log('[Studio] Zoom Out:', this.currentZoom);
        };

        // 4. Device View Toggle (Fixed with IDs)
        const mobileBtn = document.getElementById('btn-device-mobile');
        const desktopBtn = document.getElementById('btn-device-desktop');

        if (mobileBtn) {
            mobileBtn.onclick = () => {
                mobileBtn.classList.add('active');
                if (desktopBtn) desktopBtn.classList.remove('active');

                // Switch to Phone Frame
                viewport.style.width = '375px';
                viewport.style.height = '780px';
                viewport.style.borderRadius = '54px';
                viewport.style.borderWidth = '12px';

                if (bezel) bezel.style.borderRadius = '53px';
                if (sensors) sensors.style.display = 'flex';

                this.currentZoom = 0.7;
                applyZoom();
            };
        }

        if (desktopBtn) {
            desktopBtn.onclick = () => {
                desktopBtn.classList.add('active');
                if (mobileBtn) mobileBtn.classList.remove('active');

                // Switch to Laptop Frame
                viewport.style.width = '90%';
                viewport.style.maxWidth = '1000px';
                viewport.style.height = '600px';
                viewport.style.borderRadius = '24px';
                viewport.style.borderWidth = '8px';

                if (bezel) bezel.style.borderRadius = '22px';
                if (sensors) sensors.style.display = 'none';

                this.currentZoom = 0.6;
                applyZoom();
            };
        }
    },

    resolveMediaPath(path) {
        if (!path || typeof path !== 'string') return path;

        // 🚀 DROPBOX AUTO-FIXER: Convert share links to direct stream links
        if (path.includes('dropbox.com')) {
            return path.replace('www.dropbox.com', 'dl.dropboxusercontent.com')
                .replace(/\?dl=[01]$/, '')
                .replace(/&dl=[01]$/, '');
        }

        if (path.startsWith('http') || path.startsWith('data:')) return path;
        if (path.startsWith('assets/')) return '../' + path;
        return path;
    },

    setupThemeTools() {
        const swatches = document.querySelectorAll('.theme-swatch');
        swatches.forEach(s => {
            s.onclick = () => {
                const color = s.style.backgroundColor;
                if (window.StudioState) {
                    window.StudioState.updateValue('theme.backgroundColor', color);
                }
            };
        });

        const particleSelect = document.getElementById('particle-select');
        if (particleSelect) {
            particleSelect.onchange = (e) => {
                window.StudioState.updateValue('theme.particles', e.target.value);
            };
            // Set initial value
            setTimeout(() => {
                if (window.StudioState.config.theme?.particles) {
                    particleSelect.value = window.StudioState.config.theme.particles;
                }
            }, 100);
        }
    },

    setupMusicTools() {
        if (window.Editor.MusicEditor) {
            window.Editor.MusicEditor.init();
        }
    },

    setupSettingsTools() {
        const pwdInput = document.getElementById('setting-login-password');
        const nameInput = document.getElementById('setting-project-name');
        const projectNameHeader = document.querySelector('.project-name');

        if (!window.StudioState?.config) return;

        // 1. Initial Load
        if (pwdInput) {
            pwdInput.value = window.StudioState.config.login?.password || "";
            pwdInput.oninput = (e) => {
                const newVal = e.target.value.trim();
                window.StudioState.updateValue('login.password', newVal, false);

                // IMPORTANT: Also update internal config reference immediately
                if (window.StudioState.config.login) {
                    window.StudioState.config.login.password = newVal;
                }
            };
        }

        if (nameInput) {
            nameInput.value = window.StudioState.config.metadata?.projectName || "";
            nameInput.oninput = (e) => {
                const val = e.target.value;
                if (!window.StudioState.config.metadata) window.StudioState.config.metadata = {};
                window.StudioState.config.metadata.projectName = val;

                // Keep header in sync
                if (projectNameHeader) projectNameHeader.textContent = val;

                window.StudioState.save();
                window.StudioState.sync();
            };
        }

        const settingsSaveBtn = document.getElementById('settings-save-btn');
        if (settingsSaveBtn) {
            settingsSaveBtn.onclick = async () => {
                if (window.StudioState.currentId) {
                    // 1. Force save the password ensuring no spaces
                    if (pwdInput) {
                        const finalPwd = pwdInput.value.trim();
                        window.StudioState.config.login.password = finalPwd;
                        console.log('[Studio] 🔑 Password updated to:', finalPwd);
                    }

                    // 2. Visual Feedback Button
                    const originalText = settingsSaveBtn.innerHTML;
                    settingsSaveBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span> Saving...';
                    settingsSaveBtn.disabled = true;

                    // 3. True Cloud Sync
                    await window.StudioState.saveToCloud(window.StudioState.currentId);

                    // 4. Force Live Preview Update
                    window.StudioState.sync();

                    // 5. Restore Button
                    setTimeout(() => {
                        settingsSaveBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span> Saved!';
                        settingsSaveBtn.classList.replace('bg-rose-500', 'bg-green-500');

                        setTimeout(() => {
                            settingsSaveBtn.innerHTML = originalText;
                            settingsSaveBtn.disabled = false;
                            settingsSaveBtn.classList.replace('bg-green-500', 'bg-rose-500');
                        }, 2000);
                    }, 500);

                    if (typeof EditorUX !== 'undefined') EditorUX.showNotification('Password updated successfully! 🔒');
                } else {
                    alert('Please publish your project first to save to cloud.');
                }
            };
        }
    },

    setupSidebarMedia() {
        const grid = document.getElementById('sidebar-media-grid');
        if (grid) {
            grid.addEventListener('click', (e) => {
                // Check if delete button was clicked
                const deleteBtn = e.target.closest('.delete-media-btn');
                if (deleteBtn) {
                    const rawSrc = deleteBtn.dataset.rawSrc;
                    if (rawSrc && confirm('Remove this photo from your gallery?')) {
                        this.removeFromMediaGallery(rawSrc);
                    }
                    return;
                }

                const item = e.target.closest('.media-item');
                if (item && !item.classList.contains('add-btn')) {
                    const img = item.querySelector('img');
                    if (img) {
                        if (this.selectedElement) {
                            // Robust search for image in detached or current DOM
                            let targetId = this.selectedElement.id;
                            let targetImg = this.selectedElement.tagName === 'IMG' ? this.selectedElement : null;

                            // If it's a zombie (detached), try to find it again in the iframe by ID
                            if (targetId && (!targetImg || !this.previewFrame.contentDocument.getElementById(targetId))) {
                                const fresh = this.previewFrame.contentDocument.getElementById(targetId);
                                if (fresh) targetImg = fresh;
                            }

                            if (!targetImg) {
                                const polaroid = this.selectedElement.closest('.polaroid-frame');
                                if (polaroid) {
                                    const index = polaroid.dataset.index;
                                    // Re-seek by index if detached
                                    const freshFrame = this.previewFrame.contentDocument.querySelector(`.polaroid-frame[data-index="${index}"]`);
                                    if (freshFrame) targetImg = freshFrame.querySelector('img');
                                    else targetImg = polaroid.querySelector('img');
                                }

                                const mapPopup = this.selectedElement.closest('.map-popup-premium');
                                if (mapPopup) {
                                    const index = mapPopup.dataset.index;
                                    const freshPopup = this.previewFrame.contentDocument.querySelector(`.map-popup-premium[data-index="${index}"]`);
                                    if (freshPopup) targetImg = freshPopup.querySelector('img');
                                    else targetImg = mapPopup.querySelector('img');
                                }
                            }

                            if (targetImg) {
                                console.log('[Editor] Updating image:', targetImg.id || 'dynamic');
                                this.updateImage(targetImg, img.src);
                                // Also ensure it's in the gallery (redundant but safe)
                                this.addToMediaGallery(img.src);
                            } else {
                                alert('Could not find the target image. It might have been re-rendered. Try selecting it again.');
                            }
                        } else {
                            alert('Please select a photo in the preview first!');
                        }
                    }
                }
            });
        }
    },

    renderMediaGallery() {
        const grid = document.getElementById('sidebar-media-grid');
        if (!grid) return;

        // Clear existing except add button
        const addBtn = document.getElementById('sidebar-add-btn');
        grid.innerHTML = '';
        if (addBtn) grid.appendChild(addBtn);

        if (!window.StudioState?.config) return;

        // Ensure config has media array
        if (!window.StudioState.config.media) {
            window.StudioState.config.media = [];
        }

        // 🛠️ FILTER: Robust check for valid image URLs and skip blank/corrupted ones
        const media = window.StudioState.config.media.filter(src => {
            if (!src || typeof src !== 'string' || src.trim().length < 10) return false;

            // Skip non-image media like audio files
            const isImage = src.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|tiff|heic)/i) ||
                src.includes('avatar') ||
                src.includes('dicebear') ||
                src.startsWith('data:image/');

            if (!isImage) return false;

            // Skip common "blank" or broken patterns
            if (src.includes('undefined') || src.includes('null') || src.includes('[object')) return false;

            return true;
        });

        if (media.length === 0) {
            // Optional: add a placeholder if empty
        }

        media.forEach(src => {
            const newItem = document.createElement('div');
            newItem.className = 'media-item group';
            newItem.innerHTML = `
                <img src="${src}" loading="lazy" onerror="this.src='https://api.dicebear.com/7.x/initials/svg?seed=Error&backgroundColor=ef4444'" class="w-full h-full object-cover rounded-xl transition-all group-hover:scale-110">
                <button class="delete-media-btn material-symbols-outlined opacity-0 group-hover:opacity-100 transition-opacity" 
                        data-raw-src="${src}" title="Remove Photo">close</button>
            `;
            grid.insertBefore(newItem, addBtn);
        });
    },

    removeFromMediaGallery(src) {
        if (!window.StudioState?.config?.media) return;

        window.StudioState.config.media = window.StudioState.config.media.filter(s => s !== src);
        window.StudioState.save();
        window.StudioState.sync();

        // Auto-save to cloud so gallery persistence is guaranteed
        if (window.StudioState.currentId) {
            window.StudioState.saveToCloud(window.StudioState.currentId);
        }

        this.renderMediaGallery();
    },

    setupUploadTools() {
        const fileInput = document.getElementById('studio-file-input');
        const uploadBtn = document.getElementById('upload-image-btn');
        const sidebarUploadArea = document.getElementById('sidebar-upload-area');
        const sidebarAddBtn = document.getElementById('sidebar-add-btn');

        if (!fileInput) return;

        const triggerUpload = () => fileInput.click();

        if (uploadBtn) uploadBtn.onclick = triggerUpload;
        if (sidebarUploadArea) sidebarUploadArea.onclick = triggerUpload;
        if (sidebarAddBtn) sidebarAddBtn.onclick = triggerUpload;

        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // 1. Show Loading State
            const uploadBtn = document.getElementById('upload-image-btn');
            const originalText = uploadBtn ? uploadBtn.innerHTML : '';
            if (uploadBtn) {
                uploadBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span><span>Uploading...</span>';
                uploadBtn.disabled = true;
            }

            try {
                // 2. Prepare FormData
                const formData = new FormData();
                formData.append('file', file);

                // 3. Upload to Server
                const apiUrl = window.StudioState ? window.StudioState.API_BASE_URL : '';
                console.log('[Studio] Uploading file to:', `${apiUrl}/upload`);

                const res = await fetch(`${apiUrl}/upload`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) throw new Error('Upload failed');
                const result = await res.json();
                const publicUrl = result.url;

                console.log('[Studio] Upload success:', publicUrl);

                // 4. Update Gallery & Selected Element
                this.addToMediaGallery(publicUrl);

                if (this.selectedElement) {
                    let targetImg = this.selectedElement.tagName === 'IMG' ? this.selectedElement : null;
                    if (!targetImg) {
                        const polaroid = this.selectedElement.closest('.polaroid-frame');
                        if (polaroid) {
                            const index = polaroid.dataset.index;
                            const fresh = this.previewFrame.contentDocument.querySelector(`.polaroid-frame[data-index="${index}"]`);
                            if (fresh) targetImg = fresh.querySelector('img');
                        }
                        const mapPopup = this.selectedElement.closest('.map-popup-premium');
                        if (mapPopup) {
                            const index = mapPopup.dataset.index;
                            const fresh = this.previewFrame.contentDocument.querySelector(`.map-popup-premium[data-index="${index}"]`);
                            if (fresh) targetImg = fresh.querySelector('img');
                        }
                    }
                    if (targetImg) {
                        this.updateImage(targetImg, publicUrl);
                    }
                }
            } catch (err) {
                console.error('[Studio] Upload error:', err);
                alert('Upload failed: ' + err.message);
            } finally {
                // Restore button
                if (uploadBtn) {
                    uploadBtn.innerHTML = originalText;
                    uploadBtn.disabled = false;
                }
                fileInput.value = ''; // Reset input
            }
        };
    },

    addToMediaGallery(src) {
        if (!window.StudioState?.config) return;

        if (!window.StudioState.config.media) {
            window.StudioState.config.media = [];
        }

        // Avoid duplicates
        if (!window.StudioState.config.media.includes(src)) {
            window.StudioState.config.media.push(src);
            window.StudioState.save();
            window.StudioState.sync();

            // Auto-save to cloud so gallery persistence is guaranteed
            if (window.StudioState.currentId) {
                window.StudioState.saveToCloud(window.StudioState.currentId);
            }
        }

        this.renderMediaGallery();
    },

    setupImageTools() {
        const replaceBtn = document.getElementById('replace-image-btn');
        if (replaceBtn) {
            replaceBtn.addEventListener('click', () => {
                if (!this.selectedElement) return;

                // Robust search for the image
                let targetImg = this.selectedElement.tagName === 'IMG' ? this.selectedElement : null;
                if (!targetImg) {
                    const polaroid = this.selectedElement.closest('.polaroid-frame');
                    if (polaroid) targetImg = polaroid.querySelector('img');
                }

                if (targetImg) {
                    const newUrl = prompt('Enter image URL or choose from gallery:', targetImg.src);
                    if (newUrl) {
                        this.updateImage(targetImg, newUrl);
                        // Add to gallery so it stays in the sidebar
                        this.addToMediaGallery(newUrl);
                    }
                }
            });
        }

        const flipBtn = document.getElementById('flip-card-btn');
        if (flipBtn) {
            flipBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                if (this.selectedElement) {
                    const card = this.selectedElement.closest('.polaroid-frame');
                    if (card) {
                        console.log('[Editor] Flipping card:', card.dataset.index);
                        card.classList.toggle('is-flipped');

                        // Small hack: if we flipped, and we were editing text, stop editing for half a second
                        // to prevent accidental edits while the card is moving
                        const previousSelection = this.selectedElement;

                        // Force overlay update
                        setTimeout(() => this.updateSelectionOverlay(previousSelection), 600);
                    } else {
                        console.warn('[Editor] Flip requested but no polaroid-frame found in parents');
                    }
                }
            });
        }
    },

    updateImage(imgEl, url) {
        imgEl.src = url;

        // Find config path
        const idMap = {
            'p1-image': 'login.imageSrc',
            'p3-image': 'greeting.imageSrc',
            'wrapped-image': 'wrapped.imageSrc',
            'letter-polaroid-img': 'letter.polaroidSrc',
            'music-cover': 'music[0].coverSrc'
        };
        let configPath = idMap[imgEl.id];

        // Handle dynamic images (Gallery & Map)
        if (!configPath) {
            const frame = imgEl.closest('.polaroid-frame');
            const mapPopup = imgEl.closest('.map-popup-premium');

            if (frame && frame.dataset.index !== undefined) {
                configPath = `gallery.memories[${frame.dataset.index}].src`;
            } else if (mapPopup && mapPopup.dataset.index !== undefined) {
                configPath = `map.locations[${mapPopup.dataset.index}].imageSrc`;
            }
        }

        if (configPath && window.StudioState) {
            window.StudioState.updateValue(configPath, url);
        }

        // Refresh overlay
        setTimeout(() => this.updateSelectionOverlay(imgEl), 100);
    },

    setupMapTools() {
        const addBtn = document.getElementById('map-add-btn');
        if (addBtn) {
            addBtn.onclick = () => {
                console.log('[Studio] Opening Map Picker');
                this.MapPicker.open();
            };
        }
    },

    switchTab(tabName) {
        const tabs = document.querySelectorAll('.tab-item');
        const panes = document.querySelectorAll('.tab-pane');

        tabs.forEach(t => {
            if (t.dataset.tab === tabName) t.classList.add('active');
            else t.classList.remove('active');
        });

        panes.forEach(p => {
            if (p.id === `pane-${tabName}`) p.classList.remove('hidden');
            else p.classList.add('hidden');
        });

        console.log('[Studio] Switched tab to:', tabName);
    },

    setupEventListeners() {
        // Tab switching logic (Unified)
        const tabs = document.querySelectorAll('.tab-item');
        tabs.forEach(tab => {
            tab.onclick = () => {
                this.switchTab(tab.dataset.tab);
            };
        });

        // Publish Button
        // Publish Button (Cloud Sync Logic)
        const publishBtn = document.getElementById('publish-btn');
        if (publishBtn) {
            publishBtn.onclick = async () => {
                // 1. Determine ID
                let targetId = window.StudioState.currentId;

                if (!targetId) {
                    targetId = prompt("Enter a unique ID for this page (e.g. 'lisa-bday', 'john-anniv'):");
                    if (!targetId) return; // Cancelled

                    // Simple cleanup of ID
                    targetId = targetId.toLowerCase().replace(/[^a-z0-9-]/g, '-');
                }

                if (!targetId) return;

                // 2. UI Loading State
                const originalContent = publishBtn.innerHTML;
                publishBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">sync</span><span>Saving...</span>';
                publishBtn.disabled = true;

                // 3. Save to Cloud
                const success = await window.StudioState.saveToCloud(targetId);

                if (success) {
                    publishBtn.innerHTML = '<span class="material-symbols-outlined">check_circle</span><span>Saved!</span>';
                    publishBtn.style.background = '#10b981';

                    // Generate Live Link
                    // Generate Live Link (Dynamic based on current host)
                    const liveLink = `${window.location.origin}/?to=${targetId}`;

                    setTimeout(() => {
                        // Restore Button
                        publishBtn.innerHTML = originalContent;
                        publishBtn.style.background = '';
                        publishBtn.disabled = false;

                        // Show Success / Share Dialog
                        if (confirm(`Successfully Published!\n\nYour Link: ${liveLink}\n\nClick OK to open it, or Cancel to stay here.`)) {
                            window.open(liveLink, '_blank');
                        }
                    }, 1000);
                } else {
                    // Error State
                    publishBtn.innerHTML = '<span class="material-symbols-outlined">error</span><span>Failed</span>';
                    publishBtn.style.background = '#ef4444';
                    setTimeout(() => {
                        publishBtn.innerHTML = originalContent;
                        publishBtn.style.background = '';
                        publishBtn.disabled = false;
                    }, 2000);
                }
            };
        }

        // Reset to Defaults
        const resetBtn = document.getElementById('reset-defaults-btn');
        if (resetBtn) {
            resetBtn.onclick = () => {
                if (confirm('This will reset your story flow and page visibility to the original defaults. Your text and photos will be kept. Continue?')) {
                    window.StudioState.resetToDefaults();
                    this.renderPageList();
                }
            };
        }

        // Frame selection logic
        this.previewFrame.onload = () => {
            console.log('[Studio] Preview frame loaded');
            this.injectEditorStyles();
            this.setupFrameInteraction();
        };

        // 🔧 FIX: If iframe already loaded before we got here (e.g. auth gate delay),
        // run setup immediately so the canvas is interactive
        try {
            const doc = this.previewFrame.contentDocument || this.previewFrame.contentWindow?.document;
            if (doc && doc.readyState === 'complete' && doc.body && doc.body.children.length > 0) {
                console.log('[Studio] Preview frame already loaded, running setup now');
                this.injectEditorStyles();
                this.setupFrameInteraction();
            }
        } catch (e) {
            // Cross-origin or not ready yet — onload handler will catch it
        }
    },

    renderPageList() {
        console.log('[Studio] Rendering page list...');
        if (!window.StudioState || !window.StudioState.config || !window.StudioState.config.pageConfig) {
            console.warn('[Studio] pageConfig missing, retrying in 500ms...');
            setTimeout(() => this.renderPageList(), 500);
            return;
        }

        const pagesObj = window.StudioState.config.pageConfig.pages;
        if (!pagesObj || Object.keys(pagesObj).length === 0) {
            console.warn('[Studio] No pages found in pageConfig');
            return;
        }

        // Bulletproof fallback: If no cloud permissions, SHOW ALL PAGES from config
        let allowedPageIds = window.StudioState.allowedIds;
        if (!allowedPageIds || allowedPageIds.length === 0) {
            // Fallback: Allow all pages defined in the config
            allowedPageIds = Object.keys(pagesObj);
            console.log('[Studio] No cloud permissions found, enabling all pages from config:', allowedPageIds);
        }

        const pages = Object.values(pagesObj)
            .filter(page => allowedPageIds.includes(page.id))
            .sort((a, b) => a.order - b.order);

        const container = document.getElementById('story-pages');
        container.innerHTML = pages.map(page => {
            const isEnabled = page.enabled;
            const isMandatory = page.id === 'page-1' || page.required || page.locked;

            return `
                <div class="page-card ${isEnabled ? '' : 'is-disabled'} ${page.id === 'page-1' ? 'is-mandatory' : ''}" data-page-id="${page.id}">
                    <div class="page-card-main" onclick="${isEnabled ? `Editor.navigateToPage('${page.id}')` : ''}" style="${isEnabled ? '' : 'cursor: not-allowed;'}">
                        <div class="page-thumb">
                            <span class="material-symbols-outlined">${page.icon}</span>
                        </div>
                        <div class="page-info">
                            <span class="page-title">${page.name}</span>
                            <span class="page-type">${page.type || 'Standard'}</span>
                        </div>
                    </div>
                    <div class="page-controls">
                        <button class="page-toggle-btn ${isEnabled ? 'active' : ''}" 
                                onclick="Editor.togglePage('${page.id}', event)" 
                                title="${isMandatory ? 'This page is required' : (isEnabled ? 'Disable Page' : 'Enable Page')}"
                                ${isMandatory ? 'disabled' : ''}>
                            <span class="material-symbols-outlined !text-[32px] ${isEnabled ? 'text-green-500' : 'text-gray-300'}">
                                ${isEnabled ? 'toggle_on' : 'toggle_off'}
                            </span>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    togglePage(pageId, event) {
        if (event) event.stopPropagation();
        const config = window.StudioState.config;
        const page = config.pageConfig.pages[pageId];

        // Mandatory pages (Intro and Endings)
        const isMandatory = pageId === 'page-1' || pageId === 'page-11' || page.required || page.locked;
        if (!page || isMandatory) return;

        const newState = !page.enabled;

        // Handle mutual exclusivity for Endings (only Page 9 and 10 are exclusive)
        if (newState) {
            const exclusivePairs = [['page-9', 'page-10']];
            exclusivePairs.forEach(pair => {
                if (pair.includes(pageId)) {
                    pair.forEach(id => {
                        if (id !== pageId && config.pageConfig.pages[id]) {
                            config.pageConfig.pages[id].enabled = false;
                        }
                    });
                }
            });
        }

        window.StudioState.updateValue(`pageConfig.pages.${pageId}.enabled`, newState);
        this.renderPageList();

        // If we enabled it, jump to it
        if (newState) this.navigateToPage(pageId);
    },

    navigateToPage(pageId) {
        console.log('[Studio] Navigating to:', pageId);
        this.previewFrame.contentWindow.postMessage({
            type: 'NAVIGATE_TO_PAGE',
            pageId: pageId
        }, '*');

        // 🎯 LDR_AUTH_SYNC: If navigating to Login page, auto-switch to Settings tab
        // This makes it easy for customers to find where to change the password
        if (pageId === 'page-1') {
            const settingsTab = document.querySelector('[data-tab="settings"]');
            if (settingsTab) settingsTab.click();

            // Highlight the password input for UX
            setTimeout(() => {
                const pwdInput = document.getElementById('setting-login-password');
                if (pwdInput) {
                    pwdInput.classList.add('ring-2', 'ring-rose-500', 'ring-offset-2');
                    pwdInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => pwdInput.classList.remove('ring-2', 'ring-rose-500', 'ring-offset-2'), 2000);
                }
            }, 500);
        }

        // Highlight active card
        document.querySelectorAll('.page-card').forEach(c => {
            if (c.dataset.pageId === pageId) c.classList.add('active');
            else c.classList.remove('active');
        });

        // Toggle Buttons globally
        const musicAddBtn = document.getElementById('music-add-btn');
        if (musicAddBtn) musicAddBtn.classList.toggle('hidden', pageId !== 'page-3');

        const galleryAddBtn = document.getElementById('gallery-add-btn');
        if (galleryAddBtn) galleryAddBtn.classList.toggle('hidden', pageId !== 'page-6');

        const mapAddBtn = document.getElementById('map-add-btn');
        if (mapAddBtn) mapAddBtn.classList.toggle('hidden', pageId !== 'page-7');

        const quizAddBtn = document.getElementById('quiz-add-btn');
        if (quizAddBtn) quizAddBtn.classList.toggle('hidden', pageId !== 'page-5');

        const wrappedAddBtn = document.getElementById('wrapped-add-btn');
        if (wrappedAddBtn) wrappedAddBtn.classList.toggle('hidden', pageId !== 'page-4');

        // NEW: Toggle Password Editor button (Only on Login page)
        const passwordAddBtn = document.getElementById('password-add-btn');
        if (passwordAddBtn) passwordAddBtn.classList.toggle('hidden', pageId !== 'page-1');
    },

    setupFrameInteraction() {
        const injectIntoDocument = (doc) => {
            if (!doc || doc.body.dataset.editorInjected) return;
            doc.body.dataset.editorInjected = "true";

            // Inject script to fix the cursor bug (typing backwards) and set editor mode
            const injectedScript = doc.createElement('script');
            injectedScript.textContent = `
                window.isEditorMode = true;
                window.safeUpdateText = (el, text) => {
                    if (!el) return;
                    const active = document.activeElement;
                    if (active && (active === el || el.contains(active))) {
                        return;
                    }
                    if (el.textContent !== text) {
                        el.textContent = text;
                    }
                };

                function addControlBadges() {
                    const polaroids = document.querySelectorAll('.polaroid-frame');
                    polaroids.forEach(p => {
                        if (p.querySelector('.editor-delete-badge')) return;
                        
                        const idx = p.dataset.index;
                        const isGallery = idx !== undefined;
                        const hasBack = p.querySelector('.polaroid-back') !== null;

                        // 🔄 Flip Badge: ONLY show if it has a back side (Gallery)
                        if (hasBack) {
                            const badge = document.createElement('div');
                            badge.className = 'editor-flip-badge';
                            badge.innerHTML = '<span class="material-symbols-outlined">sync</span>';
                            badge.title = 'Click to Flip';
                            badge.onclick = (e) => {
                                e.preventDefault(); e.stopPropagation();
                                p.classList.toggle('is-flipped');
                                p.dispatchEvent(new CustomEvent('editor-flip', { bubbles: true }));
                            };
                            p.appendChild(badge);
                        }

                        // ➖ Delete Badge: Always show to allow "removing" the photo
                        const deleteBtn = document.createElement('div');
                        deleteBtn.className = 'editor-delete-badge';
                        deleteBtn.innerHTML = '<span class="material-symbols-outlined">remove</span>';
                        deleteBtn.title = 'Remove Photo';
                        deleteBtn.onclick = (e) => {
                            e.preventDefault(); e.stopPropagation();
                            if(confirm('Are you sure you want to remove this photo?')) {
                                if (isGallery) {
                                    window.top.postMessage({ type: 'GALLERY_REMOVE', index: idx }, '*');
                                } else {
                                    const img = p.querySelector('img');
                                    if (img && img.id) {
                                        window.top.postMessage({ type: 'PHOTO_REMOVE', id: img.id }, '*');
                                    } else {
                                        const parentImage = p.id === 'letter-polaroid-img' ? p : p.querySelector('img');
                                        if(parentImage && parentImage.id) window.top.postMessage({ type: 'PHOTO_REMOVE', id: parentImage.id }, '*');
                                    }
                                }
                            }
                        };
                        p.appendChild(deleteBtn);

                        // ➕ Add Badge: Show if image is empty
                        function checkImage() {
                            const img = p.querySelector('img');
                            // Use accurate check for empty/placeholder images
                            const isEmpty = !img || !img.src || img.src === window.location.href || img.src.includes('undefined') || img.classList.contains('hidden');
                            
                            let addBtn = p.querySelector('.editor-add-badge');
                            let delBtn = p.querySelector('.editor-delete-badge');
                            let flipBtn = p.querySelector('.editor-flip-badge');

                            if (isEmpty) {
                                // 💎 EMPTY STATE: Show Plus, Hide Minus/Flip
                                if (!addBtn) {
                                    addBtn = document.createElement('div');
                                    addBtn.className = 'editor-add-badge';
                                    addBtn.innerHTML = '<span class="material-symbols-outlined">add_a_photo</span>';
                                    addBtn.title = 'Add Photo';
                                    addBtn.onclick = (e) => {
                                        e.preventDefault(); e.stopPropagation();
                                        const targetImg = img || p;
                                        window.top.postMessage({ type: 'SELECT_ELEMENT_BY_ID', id: targetImg.id }, '*');
                                        setTimeout(() => {
                                            window.top.document.getElementById('upload-image-btn').click();
                                        }, 100);
                                    };
                                    p.appendChild(addBtn);
                                }
                                if (delBtn) delBtn.style.display = 'none';
                                if (flipBtn) flipBtn.style.display = 'none';
                            } else {
                                // 🖼️ IMAGE STATE: Show Minus/Flip, Hide Plus
                                if (addBtn) addBtn.remove();
                                if (delBtn) delBtn.style.display = '';
                                if (flipBtn) flipBtn.style.display = '';
                            }
                        }
                        
                        checkImage();
                        const imgObserver = new MutationObserver(checkImage);
                        const targetImg = p.querySelector('img');
                        if(targetImg) imgObserver.observe(targetImg, { attributes: true, attributeFilter: ['src', 'class'] });
                    });

                    // Support for bear images (they aren't polaroids but need add/remove buttons)
                    const bears = document.querySelectorAll('#bear-img, #success-bear-img');
                    bears.forEach(b => {
                        if (b.dataset.badgeAdded) return;
                        b.dataset.badgeAdded = "true";
                        
                        const wrapper = b.parentElement;
                        wrapper.style.position = 'relative';

                        function checkBear() {
                            const isEmpty = !b.src || b.src.includes('undefined') || b.classList.contains('hidden');
                            let addBtn = wrapper.querySelector('.editor-add-badge');
                            if (isEmpty) {
                                if (!addBtn) {
                                    addBtn = document.createElement('div');
                                    addBtn.className = 'editor-add-badge';
                                    addBtn.innerHTML = '<span class="material-symbols-outlined">add_a_photo</span>';
                                    addBtn.onclick = (e) => {
                                        e.preventDefault(); e.stopPropagation();
                                        window.top.postMessage({ type: 'SELECT_ELEMENT_BY_ID', id: b.id }, '*');
                                        setTimeout(() => window.top.document.getElementById('upload-image-btn').click(), 100);
                                    };
                                    wrapper.appendChild(addBtn);
                                }
                            } else if (addBtn) {
                                addBtn.remove();
                            }
                        }
                        checkBear();
                        new MutationObserver(checkBear).observe(b, { attributes: true });
                    });

                    // 🗺️ Invitation Page Toggle Badge
                    const invitation = document.getElementById('invitation-card');
                    const celebration = document.getElementById('celebration');
                    if (invitation && celebration && !document.getElementById('invitation-toggle')) {
                        const toggle = document.createElement('div');
                        toggle.id = 'invitation-toggle';
                        toggle.className = 'editor-flip-badge';
                        toggle.style.bottom = '10px';
                        toggle.style.top = 'auto';
                        toggle.style.right = '10px';
                        toggle.innerHTML = '<span class="material-symbols-outlined">visibility</span>';
                        toggle.title = 'Switch View (Question/Success)';
                        toggle.onclick = (e) => {
                            e.preventDefault(); e.stopPropagation();
                            const isSucc = invitation.classList.contains('hidden');
                            invitation.classList.toggle('hidden', !isSucc);
                            celebration.classList.toggle('hidden', isSucc);
                            // Deselect current element as it might now be hidden
                            window.top.postMessage({ type: 'DESELECT' }, '*');
                        };
                        // Attach to container
                        const container = document.querySelector('.container');
                        if (container) {
                            container.style.position = 'relative';
                            container.appendChild(toggle);
                        }
                    }
                }

                // Add Google Fonts for Material Symbols if missing
                if (!document.querySelector('link[href*="Material+Symbols"]')) {
                    const link = document.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0';
                    document.head.appendChild(link);
                }


                addControlBadges();
                const observer = new MutationObserver(addControlBadges);
                const grid = document.getElementById('gallery-grid');
                if (grid) observer.observe(grid, { childList: true, subtree: true });
            `;
            doc.head.appendChild(injectedScript);

            const style = doc.createElement('style');
            style.textContent = `
                .polaroid-caption, .secret-note-text, .brand-name, .letter-body-text, 
                .letter-recipient-name, .letter-body-text *, .letter-closing-text, .letter-signature-text,
                #p1-title, #p1-instruction, #p3-title, #p3-message, #p3-signature,
                #song-title, #artist-name, #song-lyrics, #music-section-title,
                #map-title, #map-description, .map-popup-premium *,
                .heart-marker, .leaflet-marker-icon, .leaflet-interactive,
                .flip-hint, img, .polaroid-frame,
                #music-cover, #p3-image, #wrapped-image, #letter-polaroid-img, #bear-img, #success-bear-img,
                #question, #success-message {
                    pointer-events: auto !important;
                    position: relative;
                }

                @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0');

                /* Force visibility for editing */
                .polaroid-caption, .flip-hint, .secret-note-text, 
                [id^="caption-"], [id^="flip-hint-"] {
                    opacity: 1 !important; visibility: visible !important; display: block !important;
                }
                
                .success-message { opacity: 1 !important; visibility: visible !important; }
                
                #celebration.hidden, #invitation-card.hidden { display: none !important; }

                canvas[id^="scratch-canvas"], .grain-overlay {
                    display: none !important; pointer-events: none !important;
                }

                #p1-title, #p1-instruction, #p3-title, #p3-message, #p3-signature,
                #song-title, #artist-name, #song-lyrics, #music-section-title,
                #map-title, #map-description, #question, #success-message {
                    min-height: 20px; z-index: 99 !important; width: 100% !important;
                    max-width: 100% !important; overflow-wrap: break-word !important;
                    word-break: break-word !important; display: block !important;
                    white-space: normal !important;
                }

                /* 🎯 BETTER HOVER CUES - Works in middle of photos too */
                .polaroid-front, .polaroid-back {
                    pointer-events: none !important;
                }
                
                /* Hover effect for all editable elements */
                img:hover, .polaroid-frame:hover, 
                [id^="p1-"]:hover, [id^="p3-"]:hover, [id^="map-"]:hover, 
                [id^="letter-"]:hover, [id="question"]:hover, [id="success-message"]:hover,
                .polaroid-caption:hover, .secret-note-text:hover,
                .map-popup-premium h3:hover, .map-popup-premium p:hover, .map-popup-premium img:hover,
                .brand-name:hover, .letter-body-text:hover, .letter-recipient-name:hover,
                .letter-closing-text:hover, .letter-signature-text:hover {
                    outline: 2px dashed #ff4d6d !important;
                    outline-offset: -2px !important;
                    cursor: pointer !important;
                }

                /* 📝 Edit Tooltip on Hover */
                .polaroid-caption:hover::after, .map-popup-premium h3:hover::after,
                .map-popup-premium p:hover::after, .letter-recipient-name:hover::after,
                .letter-body-text:hover::after, .letter-closing-text:hover::after,
                .letter-signature-text:hover::after, .brand-name:hover::after,
                [id^="p1-"]:hover::after, [id^="p3-"]:hover::after,
                [id="question"]:hover::after, [id="success-message"]:hover::after,
                [id="quiz-question"]:hover::after, [id="quiz-result-title"]:hover::after,
                [id="quiz-result-message"]:hover::after, .option-button:hover::after {
                    content: "✏️ Klik untuk edit";
                    position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%);
                    background: #ff4d6d; color: white; font-size: 10px; padding: 2px 8px;
                    border-radius: 4px; white-space: nowrap; z-index: 10000;
                    pointer-events: none; font-family: sans-serif;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                }

                .polaroid-frame:hover::after {
                    content: "📸 Klik untuk ganti foto";
                    position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
                    background: #ff4d6d; color: white; font-size: 10px; padding: 2px 8px;
                    border-radius: 4px; white-space: nowrap; z-index: 10000;
                    pointer-events: none; font-family: sans-serif;
                }

                /* 📝 Studio-specific stabilization for Letter Page */
                .envelope-scene-wrapper { perspective: none !important; }
                .envelope-premium-wrapper { transform: none !important; margin-top: 20px !important; }
                .letter-paper-premium { 
                    transform: translateX(-50%) !important; 
                    top: 0 !important; 
                    position: relative !important;
                    margin-bottom: 50px !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                }
                .envelope-premium-flap, .envelope-premium-front, .envelope-premium-back, .wax-seal-premium {
                    display: none !important;
                }
                .letter-content-wrapper { animation: none !important; opacity: 1 !important; }
                .letter-header, .letter-body-text, .letter-footer, .polaroid-photo { 
                    animation: none !important; opacity: 1 !important; 
                }

                .leaflet-container { cursor: default !important; }
                [contenteditable="true"]:focus { 
                    outline: 2px solid #ff4d6d !important; outline-offset: 2px;
                    background: rgba(255, 77, 109, 0.05) !important; 
                }
                
                /* Badges and Overlays */
                .handle.nw { top: -6px; left: -6px; cursor: nw-resize; }
                .handle.ne { top: -6px; right: -6px; cursor: ne-resize; }
                .handle.sw { bottom: -6px; left: -6px; cursor: sw-resize; }
                .handle.se { bottom: -6px; right: -6px; cursor: se-resize; }

                .leaflet-marker-icon, .leaflet-interactive { cursor: pointer !important; }
                .polaroid-back { overflow: visible !important; }
                .polaroid-frame.is-flipped .polaroid-front { pointer-events: none !important; }
                .polaroid-frame:not(.is-flipped) .polaroid-back { pointer-events: none !important; }

                .editor-flip-badge, .editor-delete-badge {
                    position: absolute; z-index: 1000; cursor: pointer; border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.2); transition: all 0.3s;
                    pointer-events: auto !important; overflow: hidden; text-align: center;
                }
                .editor-flip-badge { top: 10px; right: 10px; width: 32px; height: 32px; background: #ff4d6d; color: white; }
                .editor-delete-badge { top: 10px; left: 10px; width: 32px; height: 32px; background: #ff4d4d; color: white; }
                .editor-add-badge {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 44px; height: 44px; background: #ff4d6d; color: white;
                    border-radius: 50%; display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 4px 15px rgba(255, 77, 109, 0.4);
                    cursor: pointer; z-index: 1001; pointer-events: auto !important;
                    border: 2px solid white;
                }
                .editor-add-badge span { font-size: 24px; }
                .editor-flip-badge span { animation: badge-spin 4s linear infinite; font-size: 18px; }
                @keyframes badge-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `;
            doc.head.appendChild(style);

            doc.addEventListener('click', (e) => {
                const target = e.target;

                // 1. Identify controls vs content
                // Controls are UI elements (buttons, links) that should perform their app logic
                const isControl = target.closest('button, a, .editor-flip-badge, .editor-delete-badge, .editor-add-badge');
                const isMap = target.closest('.leaflet-marker-icon, .leaflet-popup, .leaflet-container, .leaflet-control, .leaflet-interactive');

                // EXCEPTIONS: Some buttons are actually editable in our editor (like yes/no btns)
                const isEditableBtn = target.id === 'yes-btn' || target.id === 'no-btn';

                if ((isControl && !isEditableBtn) || isMap) {
                    // Logic for specific editor badges/map popups
                    const editableInMap = target.closest('.map-popup-premium');
                    if (editableInMap && this.isEditable(target)) {
                        this.handleElementSelection(target);
                    }

                    if (isControl) {
                        const badge = target.closest('.editor-flip-badge, .editor-delete-badge, .editor-add-badge');
                        if (badge) {
                            const polaroid = badge.closest('.polaroid-frame');
                            if (polaroid) {
                                this.handleElementSelection(polaroid);
                                setTimeout(() => this.updateSelectionOverlay(this.selectedElement), 600);
                            }
                        }
                    }

                    // 🛑 CRITICAL: Do NOT preventDefault here. 
                    // This allows buttons (like "Open Envelope" or "Next") to continue working.
                    return;
                }

                // 2. Element Selection logic
                const editable = this.findEditableElement(target);

                if (editable) {
                    // It's an editable element: Intercept the click to select it instead of triggering app logic
                    e.preventDefault();
                    e.stopPropagation();

                    this.handleElementSelection(editable);
                    if (this.selectedElement) {
                        this.updateSelectionOverlay(this.selectedElement);
                    }
                } else {
                    // Not editable: Deselect the editor selection and let the event pass through to the app
                    // This is VITAL for things like the 3D Envelope opening.
                    if (this.selectedElement) {
                        this.handleElementSelection(null);
                    }
                }
            }, true);

            doc.addEventListener('mouseover', (e) => {
                const editable = this.findEditableElement(e.target);
                if (editable && !editable.dataset.selected) {
                    editable.style.outline = '2px dashed #ff4d6d';
                    editable.style.outlineOffset = '-2px';
                    editable.style.cursor = 'pointer';
                }
            }, true);

            doc.addEventListener('mouseout', (e) => {
                const editable = this.findEditableElement(e.target);
                if (editable && !editable.dataset.selected) {
                    editable.style.outline = '';
                    editable.style.outlineOffset = '';
                    editable.style.cursor = '';
                }
            }, true);

            doc.addEventListener('scroll', () => {
                if (this.selectedElement) this.updateSelectionOverlay(this.selectedElement);
            }, true);

            console.log('[Studio] Injected editor scripts into:', doc.title || 'frame');
        };

        const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
        injectIntoDocument(frameDoc);

        // 🔗 Also inject into nested iframes (Invitation, Infinity Scroll)
        const checkForNestedFrames = () => {
            const nestedFrames = frameDoc.querySelectorAll('iframe');
            nestedFrames.forEach(frame => {
                try {
                    const nestedDoc = frame.contentDocument || frame.contentWindow.document;
                    if (nestedDoc && nestedDoc.readyState === 'complete' && nestedDoc.body) {
                        injectIntoDocument(nestedDoc);
                    } else {
                        frame.onload = () => {
                            try {
                                injectIntoDocument(frame.contentDocument || frame.contentWindow.document);
                            } catch (e) { console.warn('Frame load inject failed', e); }
                        };
                    }
                } catch (e) { }
            });
        };

        // Observer for dynamically added iframes
        const frameObserver = new MutationObserver((mutations) => {
            mutations.forEach(m => {
                if (m.type === 'childList') checkForNestedFrames();
            });
        });
        frameObserver.observe(frameDoc.body, { childList: true, subtree: true });

        // Initial check
        checkForNestedFrames();

        // 🔄 Polling check to ensure late-loading or re-loading iframes are caught
        // This is more reliable than just MutationObserver for iframes switching src
        if (this._iframeCheckInterval) clearInterval(this._iframeCheckInterval);
        this._iframeCheckInterval = setInterval(checkForNestedFrames, 2000);
    },

    findEditableElement(el) {
        if (!el) return null;
        let current = el;
        while (current && current !== current.ownerDocument.body && current !== null) {
            if (this.isEditable(current)) return current;
            if (current.classList && (
                current.classList.contains('polaroid-frame') ||
                current.classList.contains('polaroid-caption') ||
                current.classList.contains('secret-note-text') ||
                current.classList.contains('secret-note-wrapper') ||
                current.classList.contains('letter-body-text') ||
                current.classList.contains('flip-hint')
            )) return current;
            current = current.parentElement;
        }
        return null;
    },

    isEditable(el) {
        if (!el) return false;
        if (el.classList && (
            el.classList.contains('brand-name') ||
            el.classList.contains('polaroid-caption') ||
            el.classList.contains('secret-note-text') ||
            el.classList.contains('secret-note-wrapper') ||
            el.classList.contains('letter-recipient-name') ||
            el.classList.contains('letter-body-text') ||
            el.classList.contains('letter-closing-text') ||
            el.classList.contains('letter-signature-text') ||
            el.classList.contains('letter-polaroid-caption') ||
            el.classList.contains('flip-hint') ||
            el.closest('.map-popup-premium') !== null
        )) return true;

        const editableIds = [
            'p1-title', 'p1-instruction', 'p1-text-group',
            'p3-title', 'p3-message', 'p3-signature', 'p3-image',
            'brand-name-top', 'brand-name-greeting', 'brand-name-receipt',
            'music-section-title', 'song-lyrics', 'song-title', 'artist-name', 'music-cover',
            'wrapped-image', 'letter-polaroid-img',
            'minutes-together', 'vibe-text', 'top-places-label', 'core-memories-label',
            'minutes-together-label', 'vibe-label',
            'top-places-list', 'core-memories-list',
            'wrapped-places-group', 'wrapped-memories-group', 'wrapped-stats-group',
            'letter-recipient', 'letter-body', 'letter-signature',
            'map-title', 'map-description',
            'question', 'success-message', 'bear-img', 'success-bear-img', 'yes-btn', 'no-btn'
        ];

        return el.tagName === 'IMG' || (el.id && editableIds.includes(el.id));
    },

    handleElementSelection(el) {
        if (!this.isEditable(el)) {
            if (this.selectedElement) {
                this.selectedElement.dataset.selected = "false";
                this.selectedElement.style.outline = "";
                if (this.selectedElement.tagName !== 'IMG') {
                    this.selectedElement.contentEditable = "false";
                }
            }
            document.getElementById('selection-overlay').classList.add('hidden');
            document.getElementById('text-tools').classList.add('hidden');
            document.getElementById('image-tools').classList.add('hidden');
            this.selectedElement = null;
            return;
        }

        if (this.selectedElement && this.selectedElement !== el) {
            this.selectedElement.dataset.selected = "false";
            this.selectedElement.style.outline = "";
            if (this.selectedElement.tagName !== 'IMG') {
                this.selectedElement.contentEditable = "false";
            }
        }

        this.selectedElement = el;
        if (el) el.dataset.selected = "true";
        const frame = el.closest('.polaroid-frame');
        const isPolaroidPart = frame !== null && frame.querySelector('.polaroid-back') !== null;
        const isImage = el.tagName === 'IMG' || el.classList.contains('polaroid-frame');

        if (isImage) {
            document.getElementById('text-tools').classList.add('hidden');
            document.getElementById('image-tools').classList.remove('hidden');
        } else {
            document.getElementById('image-tools').classList.add('hidden');
            document.getElementById('text-tools').classList.remove('hidden');
            el.contentEditable = "true";
            el.focus();
        }

        const isMusic = el.id === 'music-cover' || el.id === 'song-title' || el.id === 'artist-name' || el.id === 'song-lyrics' || el.id === 'music-section-title' || el.closest('#music-player-container');
        if (isMusic) {
            this.switchTab('music');
        }

        const isQuiz = el.id === 'quiz-question' || el.id === 'quiz-result-title' || el.id === 'quiz-result-message' || el.classList.contains('option-button') || el.closest('#quiz-gameplay') || el.closest('#quiz-result');
        if (isQuiz) {
            this.QuizEditor.open();
            return;
        }

        const flip = document.getElementById('flip-card-btn');
        if (flip) {
            flip.classList.toggle('hidden', !isPolaroidPart);
            if (isPolaroidPart) document.getElementById('image-tools').classList.remove('hidden');
        }

        // Toggle Celebration view for Invitation page
        const isInvitation = el.id === 'question' || el.id === 'bear-img' || el.id === 'success-message' || el.id === 'success-bear-img';
        if (isInvitation) {
            const showSuccess = el.id === 'success-message' || el.id === 'success-bear-img';
            // FIX: Use the element's own document to find related elements (supports nested iframes)
            const frameDoc = el.ownerDocument;
            const card = frameDoc.getElementById('invitation-card');
            const celebration = frameDoc.getElementById('celebration');
            if (card && celebration) {
                card.classList.toggle('hidden', showSuccess);
                celebration.classList.toggle('hidden', !showSuccess);
            }
        }

        const idMap = {
            'p1-title': 'login.title', 'p1-instruction': 'login.instruction',
            'p3-title': 'greeting.title', 'p3-message': 'greeting.message', 'p3-signature': 'greeting.signature', 'p3-image': 'greeting.imageSrc',
            'wrapped-image': 'wrapped.imageSrc', 'letter-polaroid-img': 'letter.polaroidSrc',
            'brand-name-top': 'metadata.brandName', 'brand-name-greeting': 'metadata.brandName', 'brand-name-receipt': 'metadata.brandName',
            'music-section-title': 'musicSectionTitle', 'song-lyrics': 'music[0].lyrics', 'song-title': 'music[0].songTitle', 'artist-name': 'music[0].artist', 'music-cover': 'music[0].coverSrc',
            'minutes-together': 'wrapped.HoursTogether', 'vibe-text': 'wrapped.vibe', 'top-places-label': 'wrapped.topPlacesLabel', 'core-memories-label': 'wrapped.coreMemoriesLabel',
            'minutes-together-label': 'wrapped.HoursTogetherLabel', 'vibe-label': 'wrapped.vibeLabel', 'top-places-list': 'wrapped.topPlaces', 'core-memories-list': 'wrapped.coreMemories',
            'letter-recipient': 'letter.recipient', 'letter-body': 'letter.message', 'letter-signature': 'letter.signature',
            'map-title': 'map.title', 'map-description': 'map.description',
            'question': 'invitation.question', 'success-message': 'invitation.successMessage',
            'bear-img': 'invitation.bearDefault', 'success-bear-img': 'invitation.bearSuccess',
            'yes-btn': 'invitation.yesText',
            'no-btn': 'invitation.noText'
        };

        let configPath = idMap[el.id];
        if (!configPath) {
            const frame = el.closest('.polaroid-frame');
            if (frame && frame.dataset.index !== undefined) {
                const idx = frame.dataset.index;
                if (el.classList.contains('polaroid-caption')) configPath = `gallery.memories[${idx}].caption`;
                else if (el.classList.contains('secret-note-text') || el.closest('.secret-note-wrapper')) configPath = `gallery.memories[${idx}].secretNote`;
                else configPath = `gallery.memories[${idx}].src`;
            } else if (el.classList.contains('letter-body-text')) {
                configPath = 'letter.message';
            } else if (el.classList.contains('letter-recipient-name')) {
                configPath = 'letter.recipient';
            } else if (el.classList.contains('letter-signature-text')) {
                configPath = 'letter.signature';
            } else if (el.classList.contains('letter-closing-text')) {
                configPath = 'letter.closing';
            } else if (el.classList.contains('letter-polaroid-caption')) {
                configPath = 'letter.polaroidCaption';
            }

            const popup = el.closest('.map-popup-premium');
            if (popup && popup.dataset.index !== undefined) {
                const idx = popup.dataset.index;
                if (el.tagName === 'H3') configPath = `map.locations[${idx}].title`;
                else if (el.tagName === 'P') configPath = `map.locations[${idx}].memory`;
                else if (el.tagName === 'IMG') configPath = `map.locations[${idx}].imageSrc`;
            }
        }

        if (el.tagName !== 'IMG' && !el.dataset.editorInitialized) {
            el.dataset.editorInitialized = "true";

            // 🛑 REMOVING 'input' SYNC to fix the "One word -> Done" bug
            // REASON: Syncing on every character forces a re-render in the preview app,
            // which kills the cursor position and focus.

            // Instead, we sync on BLUR (when user is done typing)
            el.addEventListener('blur', () => {
                const state = window.StudioState || (window.top && window.top.StudioState);
                if (configPath && state) {
                    let value = (el.tagName === 'OL' || el.tagName === 'UL') ?
                        Array.from(el.querySelectorAll('li')).map(li => li.innerText.trim()) : el.textContent;
                    state.updateValue(configPath, value, true); // True = Force Sync
                }
            });

            // Optional: Debounced sync for "live" feel without breaking cursor
            let timeout;
            el.addEventListener('input', () => {
                if (el.id.includes('brand-name')) {
                    const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
                    frameDoc.querySelectorAll('[id*="brand-name"]').forEach(b => { if (b !== el) b.innerText = el.innerText; });
                }

                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    const state = window.StudioState || (window.top && window.top.StudioState);
                    if (configPath && state) {
                        let value = (el.tagName === 'OL' || el.tagName === 'UL') ?
                            Array.from(el.querySelectorAll('li')).map(li => li.innerText.trim()) : el.textContent;

                        // Soft update: Update state but DON'T force full iframe reload
                        state.updateValue(configPath, value, false);
                    }
                }, 800);
            });
        }
        this.updateSelectionOverlay(el);
    },

    updateSelectionOverlay(el) {
        if (!el) {
            const overlay = document.getElementById('selection-overlay');
            if (overlay) overlay.classList.add('hidden');
            return;
        }

        // Use requestAnimationFrame to prevent layout thrashing and ghosting
        if (this._overlayRAF) cancelAnimationFrame(this._overlayRAF);

        this._overlayRAF = requestAnimationFrame(() => {
            if (!el || !this.previewFrame) return;

            // Handle Nested Iframes (e.g. Invitation Page)
            let offsetTop = 0;
            let offsetLeft = 0;
            let targetRect = el.getBoundingClientRect();
            let isNested = false;

            try {
                // If element is in a different document (nested iframe)
                if (el.ownerDocument !== this.previewFrame.contentDocument) {
                    const frames = this.previewFrame.contentDocument.querySelectorAll('iframe');
                    for (const frame of frames) {
                        try {
                            if (frame.contentDocument === el.ownerDocument) {
                                const frameRect = frame.getBoundingClientRect();
                                offsetTop = frameRect.top;
                                offsetLeft = frameRect.left;
                                isNested = true;
                                break;
                            }
                        } catch (accessErr) { }
                    }
                }
            } catch (e) {
                console.warn('[Studio] Frame offset warning:', e);
            }

            const viewportWrapper = this.previewFrame.parentElement;
            if (!viewportWrapper) return;

            const viewportRect = viewportWrapper.getBoundingClientRect();
            const style = window.getComputedStyle(viewportWrapper);
            const matrix = new WebKitCSSMatrix(style.transform);
            const scale = matrix.a || 1;

            // Coordinate construction:
            // targetRect is relative to browser viewport.
            // viewportRect is relative to browser viewport.
            // We need coords relative to viewportWrapper, adjusted by its scale.

            let finalTop, finalLeft, finalWidth, finalHeight;

            if (isNested) {
                // Nested frames are tricky. offsetTop/Left are relative to main preview iframe.
                // targetRect is relative to nested iframe viewport.
                // For simplicity, let's use the screen-based approach for all.
                const elRect = el.getBoundingClientRect();
                finalTop = (elRect.top - viewportRect.top) / scale;
                finalLeft = (elRect.left - viewportRect.left) / scale;
                finalWidth = elRect.width / scale;
                finalHeight = elRect.height / scale;
            } else {
                finalTop = (targetRect.top - viewportRect.top) / scale;
                finalLeft = (targetRect.left - viewportRect.left) / scale;
                finalWidth = targetRect.width / scale;
                finalHeight = targetRect.height / scale;
            }

            const overlay = document.getElementById('selection-overlay');
            if (!overlay) return;

            // Check if element is hidden or outside iframe viewport
            // We use the scaled dimensions for visibility check
            const iframeRect = this.previewFrame.getBoundingClientRect();

            // Check if element is effectively visible in the DOM
            const isDetached = !el.ownerDocument.contains(el);
            const isHidden = targetRect.width === 0 || targetRect.height === 0;

            const isOutOfIframe = (
                targetRect.bottom < iframeRect.top ||
                targetRect.top > iframeRect.bottom ||
                targetRect.right < iframeRect.left ||
                targetRect.left > iframeRect.right
            );

            if (isDetached || isHidden || isOutOfIframe) {
                overlay.classList.add('hidden');
                return;
            }

            const padding = 4;
            overlay.style.top = (finalTop - padding) + 'px';
            overlay.style.left = (finalLeft - padding) + 'px';
            overlay.style.width = (finalWidth + padding * 2) + 'px';
            overlay.style.height = (finalHeight + padding * 2) + 'px';
            overlay.classList.remove('hidden');

            const overlayBorder = overlay.querySelector('.selection-border');
            if (overlayBorder) {
                overlayBorder.style.width = '100%';
                overlayBorder.style.height = '100%';
            }

            // Ensure overlay is visible
            overlay.classList.remove('hidden');
        });
    },

    injectEditorStyles() {
        const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
        const style = frameDoc.createElement('style');
        style.innerHTML = `[contenteditable = "true"]:focus { outline: none; background: rgba(255, 77, 109, 0.05); } `;
        frameDoc.head.appendChild(style);
    },

    handleMessage(event) {
        const data = event.data;
        if (!data || !window.StudioState) return;

        // When preview is ready, sync the initial config
        if (data.type === 'PREVIEW_READY') {
            console.log('[Studio] Preview app is ready, syncing initial config...');
            window.StudioState.sync();
            return;
        }

        const config = window.StudioState.config;

        if (data.type === 'GALLERY_REMOVE') {
            const idx = parseInt(data.index);
            if (!isNaN(idx) && config.gallery.memories[idx]) {
                config.gallery.memories.splice(idx, 1);
                window.StudioState.save(); window.StudioState.sync();
            }
        }
        if (data.type === 'GALLERY_ADD') {
            const idx = parseInt(data.index);
            const newMemory = { type: "image", src: "https://images.unsplash.com/photo-1518193583867-0ef427db9aa2?q=80&w=800", caption: "New Memory", secretNote: "Secret note...", tape: "washi-tape", rotation: "rotate-2" };
            if (!isNaN(idx)) config.gallery.memories.splice(idx + 1, 0, newMemory);
            else config.gallery.memories.push(newMemory);
            window.StudioState.save(); window.StudioState.sync();
        }
        if (data.type === 'PHOTO_REMOVE') {
            const idMap = {
                'p1-image': 'login.imageSrc',
                'p3-image': 'greeting.imageSrc',
                'wrapped-image': 'wrapped.imageSrc',
                'letter-polaroid-img': 'letter.polaroidSrc',
                'music-cover': 'music[0].coverSrc',
                'bear-img': 'invitation.bearDefault',
                'success-bear-img': 'invitation.bearSuccess'
            };
            const path = idMap[data.id];
            if (path) {
                window.StudioState.updateValue(path, "");
            }
        }

        if (data.type === 'DESELECT') {
            document.getElementById('selection-overlay').classList.add('hidden');
            document.getElementById('text-tools').classList.add('hidden');
            document.getElementById('image-tools').classList.add('hidden');
            this.selectedElement = null;
        }

        if (data.type === 'MAP_MOVE') {
            if (this.selectedElement) {
                this.updateSelectionOverlay(this.selectedElement);
            }
        }

        if (data.type === 'MAP_POPUP_CLOSED') {
            document.getElementById('selection-overlay').classList.add('hidden');
            document.getElementById('text-tools').classList.add('hidden');
            document.getElementById('image-tools').classList.add('hidden');
            if (this.selectedElement && this.selectedElement.tagName !== 'IMG') {
                this.selectedElement.contentEditable = "false";
            }
            this.selectedElement = null;
        }

        if (data.type === 'SELECT_ELEMENT_BY_ID') {
            const frameDoc = this.previewFrame.contentDocument || this.previewFrame.contentWindow.document;
            const el = frameDoc.getElementById(data.id);
            if (el) this.handleElementSelection(el);
        }

        if (data.type === 'PAGE_CHANGED') {
            const pageId = data.pageId;
            const musicAdd = document.getElementById('music-add-btn');
            const galleryAdd = document.getElementById('gallery-add-btn');
            const mapAdd = document.getElementById('map-add-btn');
            const quizAdd = document.getElementById('quiz-add-btn');
            const wrappedAdd = document.getElementById('wrapped-add-btn');
            const infinityAdd = document.getElementById('infinity-add-btn');
            const letterAdd = document.getElementById('letter-add-btn');
            const invitationAdd = document.getElementById('invitation-add-btn');

            if (musicAdd) musicAdd.classList.toggle('hidden', pageId !== 'page-3');
            if (galleryAdd) galleryAdd.classList.toggle('hidden', pageId !== 'page-6');
            if (mapAdd) mapAdd.classList.toggle('hidden', pageId !== 'page-7');
            if (quizAdd) quizAdd.classList.toggle('hidden', pageId !== 'page-5');
            if (wrappedAdd) wrappedAdd.classList.toggle('hidden', pageId !== 'page-4');
            if (infinityAdd) infinityAdd.classList.toggle('hidden', pageId !== 'page-10');
            if (letterAdd) letterAdd.classList.toggle('hidden', pageId !== 'page-8');
            if (invitationAdd) invitationAdd.classList.toggle('hidden', pageId !== 'page-11' && pageId !== 'page-invitation');

            // Auto close tools when changing page
            document.getElementById('selection-overlay').classList.add('hidden');
            document.getElementById('text-tools').classList.add('hidden');
            document.getElementById('image-tools').classList.add('hidden');
            this.selectedElement = null;
        }
    },

    MapPicker: {
        map: null,
        marker: null,
        selectedLatLng: null,

        init() {
            if (this.map) return;
            console.log('[MapPicker] Initializing Leaflet...');
            this.map = L.map('leafletPickerContainer').setView([-6.2088, 106.8456], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

            this.map.on('click', (e) => {
                console.log('[MapPicker] Map clicked at:', e.latlng);
                this.setMarker(e.latlng);
            });

            document.getElementById('tabSearch').onclick = () => this.switchTab('search');
            document.getElementById('tabPaste').onclick = () => this.switchTab('paste');
            document.getElementById('btnDoSearch').onclick = () => this.search();
            document.getElementById('mapSearchInput').onkeypress = (e) => { if (e.key === 'Enter') this.search(); };
            document.getElementById('mapSearchInput').oninput = () => { if (document.getElementById('mapSearchInput').value.length > 2) this.search(); };
            document.getElementById('confirmLocationBtn').onclick = () => this.confirm();

            const gmapsInput = document.getElementById('gmapsLinkInput');
            if (gmapsInput) {
                gmapsInput.oninput = (e) => this.handleLink(e.target.value);
                gmapsInput.addEventListener('paste', (e) => {
                    setTimeout(() => this.handleLink(gmapsInput.value), 100);
                });
            }
        },

        open() {
            document.getElementById('mapPickerModal').classList.remove('hidden');
            const addBtn = document.getElementById('map-add-btn');
            if (addBtn) addBtn.classList.add('hidden');
            setTimeout(() => {
                this.init();
                this.map.invalidateSize();
                setTimeout(() => this.map.invalidateSize(), 300);
                setTimeout(() => this.map.invalidateSize(), 800);
                if (this.marker) {
                    this.map.removeLayer(this.marker);
                    this.marker = null;
                }
                this.selectedLatLng = null;
                document.getElementById('selectedLocationText').textContent = 'Click on map to pick...';
                document.getElementById('confirmLocationBtn').disabled = true;
                this.hideResults();
                this.renderLocationList(); // Show existing pins
            }, 100);
        },

        close() {
            document.getElementById('mapPickerModal').classList.add('hidden');
            const addBtn = document.getElementById('map-add-btn');
            if (addBtn) addBtn.classList.remove('hidden');
        },

        setMarker(latlng) {
            this.selectedLatLng = latlng;
            if (this.marker) {
                this.marker.setLatLng(latlng);
            } else {
                this.marker = L.marker(latlng, { draggable: true }).addTo(this.map);
                this.marker.on('dragend', () => {
                    this.selectedLatLng = this.marker.getLatLng();
                    this.updateUI();
                });
            }
            this.updateUI();
        },

        async updateUI() {
            if (this.selectedLatLng) {
                const { lat, lng } = this.selectedLatLng;
                const text = document.getElementById('selectedLocationText');
                text.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)} `;
                document.getElementById('confirmLocationBtn').disabled = false;

                // Reverse Geocoding for better feedback
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                        headers: { 'User-Agent': 'ValentineStudio/1.0' }
                    });
                    const data = await res.json();
                    if (data.display_name) {
                        text.textContent = data.display_name;
                    }
                } catch (e) { }
            }
        },

        switchTab(tab) {
            const isSearch = tab === 'search';
            document.getElementById('tabSearch').className = `flex-1 px-4 py-2 rounded-lg text-sm font-bold ${isSearch ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500'}`;
            document.getElementById('tabPaste').className = `flex-1 px-4 py-2 rounded-lg text-sm font-bold ${!isSearch ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-500'}`;
            document.getElementById('searchTabContent').classList.toggle('hidden', !isSearch);
            document.getElementById('pasteTabContent').classList.toggle('hidden', isSearch);
        },

        async search() {
            const input = document.getElementById('mapSearchInput');
            const query = input.value.trim();
            if (query.length < 3) {
                this.hideResults();
                return;
            }

            try {
                // Focus search on Indonesia using Jakarta as center bias
                // Photon search - Bias towards Indonesia but allow global results
                const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lang=en`);
                const data = await res.json();
                if (data.features) {
                    this.showResults(data.features);
                }
            } catch (err) {
                console.error('Search error:', err);
            }
        },

        showResults(results) {
            this._lastResults = results;
            const container = document.getElementById('mapSearchResults');
            if (results.length === 0) {
                this.hideResults();
                return;
            }
            container.innerHTML = results.map((res, idx) => `
                <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                     onclick="Editor.MapPicker.selectPhotonResult(${idx})">
                    <span class="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                    <div>
                        <div class="text-sm font-bold text-gray-900">${res.properties.name || res.properties.city || 'Unknown Location'}</div>
                        <div class="text-[11px] text-gray-500 line-clamp-1">${[res.properties.street, res.properties.city, res.properties.country].filter(Boolean).join(', ')}</div>
                    </div>
                </div>
            `).join('');
            container.classList.remove('hidden');
        },

        selectPhotonResult(idx) {
            const res = this._lastResults ? this._lastResults[idx] : null;
            if (!res) return;
            const [lng, lat] = res.geometry.coordinates;
            const latlng = { lat, lng };
            this.map.setView(latlng, 16);
            this.setMarker(latlng);
            this.hideResults();
            const input = document.getElementById('mapSearchInput');
            if (input) input.value = res.properties.name || res.properties.city || '';
        },

        hideResults() {
            const container = document.getElementById('mapSearchResults');
            if (container) container.classList.add('hidden');
        },

        handleLink(url) {
            if (!url || url.length < 5) return;
            console.log('[MapPicker] Parsing URL:', url);

            // 1. Short link check
            if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
                console.log('[MapPicker] Short link detected');
                const gmapsInput = document.getElementById('gmapsLinkInput');
                if (gmapsInput) {
                    gmapsInput.value = '';
                    gmapsInput.placeholder = '⚠️ Please use FULL browser URL';
                }
                alert('Short links (maps.app.goo.gl) don\'t contain coordinates. Please open the link in your browser first and copy the FULL URL from the address bar (the one with the @ symbol).');
                return;
            }

            // 2. Extract and Apply
            const coords = this.extractCoords(url);
            if (coords) {
                console.log('[MapPicker] Extracted coordinates:', coords);
                this.applyCoords(coords.lat, coords.lng);
            } else {
                console.log('[MapPicker] No coordinates found in URL yet. Checking for raw Lat/Lng...');
                // Try raw lat,lng pattern (clean)
                const rawMatch = url.trim().match(/^(-?\d+\.?\d+)[,\s]+(-?\d+\.?\d+)$/);
                if (rawMatch) {
                    console.log('[MapPicker] Raw coordinates detected');
                    this.applyCoords(parseFloat(rawMatch[1]), parseFloat(rawMatch[2]));
                }
            }
        },

        extractCoords(url) {
            let lat, lng;

            // Pattern 1: !3d lat !4d lng (Common in internal data strings, usually the precise PIN)
            const p1 = /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/;
            const m1 = url.match(p1);
            if (m1) {
                console.log('[MapPicker] Match Pattern 1 (!3d - PIN)');
                return { lat: parseFloat(m1[1]), lng: parseFloat(m1[2]) };
            }

            // Pattern 2: ?q=lat,lng (Search Query PIN)
            const p2 = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
            const m2 = url.match(p2);
            if (m2) {
                console.log('[MapPicker] Match Pattern 2 (q= - PIN)');
                return { lat: parseFloat(m2[1]), lng: parseFloat(m2[2]) };
            }

            // Pattern 3: /@lat,lng (Standard Browser Center)
            const p3 = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
            const m3 = url.match(p3);
            if (m3) {
                console.log('[MapPicker] Match Pattern 3 (@ - Map Center)');
                return { lat: parseFloat(m3[1]), lng: parseFloat(m3[2]) };
            }

            // Pattern 4: ll=lat,lng
            const p4 = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
            const m4 = url.match(p4);
            if (m4) {
                console.log('[MapPicker] Match Pattern 4 (ll=)');
                return { lat: parseFloat(m4[1]), lng: parseFloat(m4[2]) };
            }

            // Pattern 5: geo: URI
            const p5 = /geo:(-?\d+\.?\d*),(-?\d+\.?\d*)/;
            const m5 = url.match(p5);
            if (m5) {
                console.log('[MapPicker] Match Pattern 5 (geo:)');
                return { lat: parseFloat(m5[1]), lng: parseFloat(m5[2]) };
            }

            // Pattern 6: Broad scan for comma separated decimals (at least 4 decimals to avoid fake matches)
            const p6 = /(-?\d{1,3}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/;
            const m6 = url.match(p6);
            if (m6) {
                lat = parseFloat(m6[1]); lng = parseFloat(m6[2]);
                if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                    console.log('[MapPicker] Match Pattern 6 (Broad Scan)');
                    return { lat, lng };
                }
            }
            return null;
        },

        applyCoords(lat, lng) {
            if (isNaN(lat) || isNaN(lng)) return;
            const latlng = { lat, lng };
            console.log('[MapPicker] Applying coordinates to map:', latlng);
            this.map.setView(latlng, 16);
            this.setMarker(latlng);
            const input = document.getElementById('gmapsLinkInput');
            if (input) {
                input.value = '';
                input.placeholder = '✓ Location set from link!';
            }
        },

        // ═══════════════════════════════════════
        // MEMORY DETAIL FLOW
        // ═══════════════════════════════════════
        _pendingLocation: null,  // Temporary storage while user fills in details
        _editingIndex: -1,       // -1 = new, >=0 = editing existing
        _memoryPhotoSetup: false,

        confirm() {
            if (!this.selectedLatLng) return;

            // Get the location name from the UI (reverse-geocoded or coordinates)
            const locationText = document.getElementById('selectedLocationText').textContent || '';

            // Store pending location data (coordinates only, user will fill the rest)
            this._pendingLocation = {
                coordinates: [this.selectedLatLng.lat.toString(), this.selectedLatLng.lng.toString()],
                _locationName: locationText // temporary, used as default title
            };
            this._editingIndex = -1; // new location

            // Hide map picker, show Memory Detail modal
            document.getElementById('mapPickerModal').classList.add('hidden');
            this.openMemoryDetailModal();
        },

        openMemoryDetailModal() {
            this.resetMemoryDetailForm();
            this.setupMemoryPhotoUpload();

            const modal = document.getElementById('memoryDetailModal');
            modal.classList.remove('hidden');

            // Pre-fill with smart defaults
            const titleInput = document.getElementById('memoryTitle');
            const dateInput = document.getElementById('memoryDate');

            if (this._editingIndex >= 0) {
                // Editing existing: load its data
                const config = window.StudioState.config;
                const loc = config.map.locations[this._editingIndex];
                if (loc) {
                    titleInput.value = loc.title || '';
                    document.getElementById('memoryStory').value = loc.memory || '';
                    dateInput.value = loc.date || '';
                    // Show existing photo
                    if (loc.imageSrc && !loc.imageSrc.includes('unsplash.com/photo-1526772662000')) {
                        const preview = document.getElementById('memoryPhotoPreview');
                        preview.src = loc.imageSrc;
                        preview.classList.remove('hidden');
                        document.getElementById('memoryPhotoPlaceholder').classList.add('hidden');
                    }
                }
            } else {
                // New location: leave title EMPTY so user writes their own
                titleInput.value = '';
                dateInput.value = new Date().toISOString().split('T')[0];
            }

            // Focus the title input after animation
            setTimeout(() => titleInput.focus(), 400);
        },

        resetMemoryDetailForm() {
            document.getElementById('memoryTitle').value = '';
            document.getElementById('memoryStory').value = '';
            document.getElementById('memoryDate').value = '';
            const preview = document.getElementById('memoryPhotoPreview');
            preview.src = '';
            preview.dataset.cloudUrl = '';  // ✅ Clear cloud URL from previous session
            preview.classList.add('hidden');
            document.getElementById('memoryPhotoPlaceholder').classList.remove('hidden');
        },

        setupMemoryPhotoUpload() {
            if (this._memoryPhotoSetup) return;
            this._memoryPhotoSetup = true;

            const area = document.getElementById('memoryPhotoArea');
            const input = document.getElementById('memoryPhotoInput');
            const preview = document.getElementById('memoryPhotoPreview');
            const placeholder = document.getElementById('memoryPhotoPlaceholder');

            area.onclick = () => input.click();

            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                // Show local preview immediately
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.src = ev.target.result;
                    preview.classList.remove('hidden');
                    placeholder.classList.add('hidden');
                };
                reader.readAsDataURL(file);

                // Upload to cloud
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    const apiUrl = window.StudioState ? window.StudioState.API_BASE_URL : '';
                    const res = await fetch(`${apiUrl}/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    if (res.ok) {
                        const result = await res.json();
                        // Store the cloud URL on the preview element
                        preview.dataset.cloudUrl = result.url;

                        // 🛠️ FIX: Add to global sidebar gallery
                        this.addToMediaGallery(result.url);

                        console.log('[MemoryDetail] Photo uploaded:', result.url);
                    }
                } catch (err) {
                    console.error('[MemoryDetail] Photo upload failed:', err);
                    // Local preview still works, we'll use a fallback
                }
                input.value = '';
            };
        },

        saveMemoryDetail() {
            const title = document.getElementById('memoryTitle').value.trim() || 'Our Memory Spot';
            const story = document.getElementById('memoryStory').value.trim() || '';
            const date = document.getElementById('memoryDate').value || new Date().toISOString().split('T')[0];
            const preview = document.getElementById('memoryPhotoPreview');

            // ✅ FIX: Prioritize cloud URL, but also accept data: URL as valid photo
            let imageSrc = '';
            if (preview.dataset.cloudUrl && preview.dataset.cloudUrl.trim() !== '') {
                imageSrc = preview.dataset.cloudUrl;
            } else if (preview.src && preview.src.startsWith('data:')) {
                imageSrc = preview.src;
            } else if (preview.src && preview.src !== '' && !preview.src.endsWith('/')) {
                imageSrc = preview.src;
            }
            if (!imageSrc) imageSrc = 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=800';

            let targetIndex = -1;
            if (window.StudioState) {
                const config = window.StudioState.config;
                if (!config.map) config.map = { locations: [] };

                if (this._editingIndex >= 0) {
                    targetIndex = this._editingIndex;
                    const existing = config.map.locations[this._editingIndex];
                    existing.title = title;
                    existing.memory = story;
                    existing.date = date;
                    existing.imageSrc = imageSrc;
                } else {
                    const newLoc = {
                        title: title,
                        coordinates: this._pendingLocation.coordinates,
                        date: date,
                        memory: story,
                        imageSrc: imageSrc,
                        icon: 'favorite'
                    };
                    config.map.locations.push(newLoc);
                    targetIndex = config.map.locations.length - 1;
                }

                window.StudioState.sync();
                if (window.StudioState.currentId) {
                    window.StudioState.saveToCloud(window.StudioState.currentId);
                }
            }

            const wasEditing = this._editingIndex >= 0;
            document.getElementById('memoryDetailModal').classList.add('hidden');
            this._pendingLocation = null;
            this._editingIndex = -1;

            if (wasEditing) {
                // ✅ Editing: show list again in editor
                document.getElementById('mapPickerModal').classList.remove('hidden');
                setTimeout(() => {
                    if (this.map) this.map.invalidateSize();
                    this.renderLocationList();
                }, 200);
            } else {
                // ✅ New pin: close picker
                document.getElementById('mapPickerModal').classList.add('hidden');
                const addBtn = document.getElementById('map-add-btn');
                if (addBtn) addBtn.classList.remove('hidden');

                // Navigate to map page in preview
                setTimeout(() => {
                    Editor.navigateToPage('page-7');
                }, 300);
            }

            // ✅ ALWAYS trigger auto-focus in the preview frame for the saved index
            if (targetIndex >= 0) {
                setTimeout(() => {
                    const iframe = document.getElementById('preview-frame');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'REINIT_MAP',
                            index: targetIndex
                        }, '*');
                    }
                }, 800);
            }
        },

        skipMemoryDetail() {
            if (this._editingIndex >= 0) {
                document.getElementById('memoryDetailModal').classList.add('hidden');
                document.getElementById('mapPickerModal').classList.remove('hidden');
                setTimeout(() => {
                    if (this.map) this.map.invalidateSize();
                }, 200);
                this._editingIndex = -1;
                return;
            }

            let targetIndex = -1;
            if (this._pendingLocation && window.StudioState) {
                const config = window.StudioState.config;
                if (!config.map) config.map = { locations: [] };

                const locName = this._pendingLocation._locationName || '';
                const shortName = locName.split(',').slice(0, 2).join(',').trim();

                config.map.locations.push({
                    title: shortName || 'Our Memory Spot',
                    coordinates: this._pendingLocation.coordinates,
                    date: new Date().toISOString().split('T')[0],
                    memory: '',
                    imageSrc: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?q=80&w=800',
                    icon: 'favorite'
                });
                targetIndex = config.map.locations.length - 1;

                window.StudioState.sync();
                if (window.StudioState.currentId) {
                    window.StudioState.saveToCloud(window.StudioState.currentId);
                }
            }

            document.getElementById('memoryDetailModal').classList.add('hidden');
            document.getElementById('mapPickerModal').classList.add('hidden');
            const addBtn = document.getElementById('map-add-btn');
            if (addBtn) addBtn.classList.remove('hidden');

            this._pendingLocation = null;

            setTimeout(() => {
                Editor.navigateToPage('page-7');
                setTimeout(() => {
                    const iframe = document.getElementById('preview-frame');
                    if (iframe && iframe.contentWindow) {
                        iframe.contentWindow.postMessage({
                            type: 'REINIT_MAP',
                            index: targetIndex
                        }, '*');
                    }
                }, 500);
            }, 300);
        },

        editLocationDetail(index) {
            // Load existing location for editing
            this._editingIndex = index;
            this._pendingLocation = null; // not a new location
            // Hide map picker, show detail modal
            document.getElementById('mapPickerModal').classList.add('hidden');
            this.openMemoryDetailModal();
        },

        // ═══════════════════════════════════════
        // LOCATION LIST (Enhanced with thumbnails)
        // ═══════════════════════════════════════
        renderLocationList() {
            const container = document.getElementById('mapLocationsList');
            if (!container) return;

            const config = window.StudioState ? window.StudioState.config : null;
            const locations = config?.map?.locations || [];

            if (locations.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <span class="material-symbols-outlined text-3xl text-gray-200 mb-2 block">add_location_alt</span>
                        <p class="text-[11px] text-gray-400 italic">Belum ada pin.</p>
                        <p class="text-[10px] text-gray-300">Klik di peta untuk menambah</p>
                    </div>`;
                return;
            }

            container.innerHTML = locations.map((loc, idx) => {
                const hasPhoto = loc.imageSrc && !loc.imageSrc.includes('unsplash.com/photo-1526772662000');
                const hasStory = loc.memory && loc.memory.trim().length > 0;
                const dateStr = loc.date ? new Date(loc.date + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

                return `
                <div class="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:border-rose-200 hover:shadow-md transition-all group">
                    ${hasPhoto ? `
                    <div class="w-full h-20 overflow-hidden">
                        <img src="${loc.imageSrc}" class="w-full h-full object-cover" alt="">
                    </div>` : ''}
                    <div class="p-2.5">
                        <div class="flex items-start justify-between gap-1">
                            <div class="flex-1 min-w-0">
                                <div class="text-[11px] font-bold text-gray-900 truncate">${loc.title}</div>
                                ${dateStr ? `<div class="text-[9px] text-gray-400 mt-0.5">${dateStr}</div>` : ''}
                                ${hasStory ? `<div class="text-[9px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">${loc.memory}</div>` : `<div class="text-[9px] text-rose-300 italic mt-1">Belum ada cerita</div>`}
                            </div>
                        </div>
                        <div class="flex items-center gap-1 mt-2 pt-2 border-t border-gray-50">
                            <button onclick="Editor.MapPicker.editLocationDetail(${idx})" 
                                    class="flex-1 text-[9px] font-bold text-blue-500 hover:bg-blue-50 rounded-lg py-1 transition-all flex items-center justify-center gap-1">
                                <span class="material-symbols-outlined text-xs">edit</span>
                                Edit
                            </button>
                            <button onclick="Editor.MapPicker.removeLocation(${idx})" 
                                    class="flex-1 text-[9px] font-bold text-red-400 hover:bg-red-50 rounded-lg py-1 transition-all flex items-center justify-center gap-1">
                                <span class="material-symbols-outlined text-xs">delete</span>
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
                `;
            }).join('');
        },

        removeLocation(index) {
            if (!confirm('Hapus pin ini dari peta?')) return;
            const config = window.StudioState.config;
            config.map.locations.splice(index, 1);
            window.StudioState.sync();
            if (window.StudioState.currentId) {
                window.StudioState.saveToCloud(window.StudioState.currentId);
            }
            this.renderLocationList();
        }
    },

});

document.addEventListener('DOMContentLoaded', () => Editor.init());
