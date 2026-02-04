// Renderers Module - Contains all wizard step rendering functions

const renderers = {

    // Helper to get value from state instead of DOM
    getStateValue(category, field, defaultValue = '') {
        if (state.configData[category] && state.configData[category][field] !== undefined) {
            return state.configData[category][field];
        }
        return defaultValue;
    },

    // ✅ NEW: Create preview eye button for mobile users
    createPreviewButton(pageId) {
        return `
            <button type="button" 
                    onclick="app.showPreview(); app.sendMessageToPreview({type: 'NAVIGATE_TO_PAGE', pageId: '${pageId}'});"
                    class="flex items-center gap-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl font-semibold text-sm transition-all shadow-sm border border-rose-200"
                    title="Preview this page">
                <span class="material-symbols-outlined text-lg">visibility</span>
                <span class="hidden sm:inline">Preview</span>
            </button>
        `;
    },

    // Create input with state binding
    createStateInput(id, category, field, placeholder = '', type = 'text') {
        const value = this.getStateValue(category, field, '');
        const escaped = value.toString().replace(/"/g, '&quot;');
        return `<input type="${type}" 
                       id="${id}" 
                       class="form-input" 
                       value="${escaped}" 
                       placeholder="${placeholder}"
                       oninput="state.updateField('${category}', '${field}', this.value)">`;
    },

    // Create textarea with state binding
    createStateTextarea(id, category, field, placeholder = '', rows = 4) {
        const value = this.getStateValue(category, field, '');
        return `<textarea 
                    id="${id}" 
                    class="form-textarea" 
                    rows="${rows}" 
                    placeholder="${placeholder}"
                    oninput="state.updateField('${category}', '${field}', this.value)">${value}</textarea>`;
    },

    // Create select with state binding
    createStateSelect(id, category, field, options) {
        const currentValue = this.getStateValue(category, field, options[0].value);
        const optionsHtml = options.map(opt =>
            `<option value="${opt.value}" ${currentValue === opt.value ? 'selected' : ''}>${opt.label}</option>`
        ).join('');

        return `<select id="${id}" 
                        class="form-input" 
                        onchange="state.updateField('${category}', '${field}', this.value)">
                    ${optionsHtml}
                </select>`;
    },

    // ✅ NEW: Helper for collapsible items
    toggleItem(el) {
        const item = el.closest('.dynamic-item');
        if (item) {
            item.classList.toggle('is-collapsed');
        }
    },

    renderCollapsible(idx, title, desc, bodyHtml, onRemove) {
        return `
            <div class="dynamic-item is-collapsed" data-index="${idx}">
                <div class="item-header" onclick="renderers.toggleItem(this)">
                    <div class="item-drag-handle">
                        <span class="material-symbols-outlined">drag_indicator</span>
                    </div>
                    <div class="item-badge">${idx + 1}</div>
                    <div class="item-summary">
                        <div class="item-summary-title">${title || 'New Item'}</div>
                        <div class="item-summary-desc">${desc || 'Click to edit details'}</div>
                    </div>
                    <div class="item-actions">
                        <button type="button" class="remove-btn" onclick="event.stopPropagation(); if(confirm(t('confirm_delete'))) { ${onRemove} }">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                        <span class="material-symbols-outlined expand-icon">expand_more</span>
                    </div>
                </div>
                <div class="item-body">
                    ${bodyHtml}
                </div>
            </div>
        `;
    },

    // ========================================
    // STEP 1: SETUP (Theme & Basic Config)
    // ========================================
    renderSetupStep() {
        return `
            <div class="section-header">
                <div class="section-icon">
                    <span class="material-symbols-outlined">palette</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('theme_header_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('theme_header_desc')}</p>
                </div>
                ${this.createPreviewButton('page-1')}
            </div>

            <!-- Language Selection First -->
            <div class="bg-rose-50 border border-rose-100 rounded-xl p-5 mb-8">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-rose-600">translate</span>
                    </div>
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1.5">${t('theme_label_language')}</label>
                        <div class="relative">
                            <select onchange="state.setLanguage(this.value)" 
                                class="w-full bg-white border border-rose-200 text-gray-900 text-sm font-bold rounded-xl focus:ring-rose-500 focus:border-rose-500 block p-3 appearance-none cursor-pointer shadow-sm transition-all hover:border-rose-300">
                                <option value="en" ${state.configData.adminLang === 'en' ? 'selected' : ''}>🇺🇸 English (US)</option>
                                <option value="id" ${state.configData.adminLang === 'id' ? 'selected' : ''}>🇮🇩 Indonesia (ID)</option>
                            </select>
                            <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-rose-400">
                                <span class="material-symbols-outlined">expand_more</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Import from Live Link -->
            <div class="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-8">
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-gray-600">cloud_download</span>
                    </div>
                    <div class="flex-1">
                        <label class="block text-[10px] font-bold text-gray-400 upper-case tracking-widest mb-1">DATA IMPORT</label>
                        <h3 class="text-sm font-bold text-gray-900 mb-1">Import from Live Website</h3>
                        <p class="text-xs text-gray-500 mb-4">Want to edit an existing Valentine? Enter the ID or link below to pull all images and messages automatically.</p>
                        <div class="flex gap-2">
                            <input type="text" id="importUrlInput" 
                                class="flex-1 bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-rose-500 focus:border-rose-500 block p-2.5 outline-none transition-all focus:shadow-md" 
                                placeholder="e.g. aldoramadhan or website.com/?to=id">
                            <button type="button" 
                                onclick="state.importFromLink(document.getElementById('importUrlInput').value)"
                                class="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95">
                                Import
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Theme Presets -->
            <div class="mb-8">
                <label class="block text-sm font-bold text-gray-700 mb-3">${t('theme_label_presets')}</label>
                <div class="theme-grid">
                    <button type="button" data-theme-preset="vintage" class="theme-card">
                        <div class="theme-preview" style="background: linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)"></div>
                        <div class="theme-name">Vintage Romance</div>
                    </button>
                    <button type="button" data-theme-preset="modern" class="theme-card">
                        <div class="theme-preview" style="background: linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)"></div>
                        <div class="theme-name">Modern Minimal</div>
                    </button>
                    <button type="button" data-theme-preset="romantic" class="theme-card">
                        <div class="theme-preview" style="background: linear-gradient(135deg, #FFE5EC 0%, #FFC2D1 100%)"></div>
                        <div class="theme-name">Romantic Dreams</div>
                    </button>
                    <button type="button" data-theme-preset="elegant" class="theme-card">
                        <div class="theme-preview" style="background: linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)"></div>
                        <div class="theme-name">Elegant Night</div>
                    </button>
                    <button type="button" data-theme-preset="playful" class="theme-card">
                        <div class="theme-preview" style="background: linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%)"></div>
                        <div class="theme-name">Playful & Fun</div>
                    </button>
                    <button type="button" data-theme-preset="coffee" class="theme-card">
                        <div class="theme-preview" style="background: linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%)"></div>
                        <div class="theme-name">Coffee House</div>
                    </button>
                </div>
            </div>

            <!-- Custom Theme Settings -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label class="block text-sm font-bold text-gray-600 mb-2">${t('theme_label_bg_image')}</label>
                    <div class="flex gap-2 items-center">
                        <img id="prev_theme_bg" src="${this.getStateValue('theme', 'backgroundImage', '')}" class="img-preview-mini w-12 h-12 object-cover rounded-lg shadow-sm ${this.getStateValue('theme', 'backgroundImage') ? '' : 'hidden'}">
                        ${this.createStateInput('theme_bg', 'theme', 'backgroundImage', t('theme_placeholder_bg'))}
                        <label class="cursor-pointer bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center hover:bg-gray-50 transition-colors shadow-sm">
                            <span class="material-symbols-outlined text-gray-500">upload_file</span>
                            <input type="file" class="hidden" accept="image/*" onchange="utils.handleMediaUpload(this, 'theme_bg')">
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-600 mb-2">${t('theme_label_bg_color')}</label>
                    <div class="flex gap-2">
                        <input type="color" id="theme_color_picker" class="w-12 h-11 rounded-lg border-gray-200" value="${this.getStateValue('theme', 'backgroundColor', '#F5E6D3')}" oninput="state.updateField('theme', 'backgroundColor', this.value); document.getElementById('theme_color').value = this.value">
                        <input type="text" id="theme_color" class="form-input" value="${this.getStateValue('theme', 'backgroundColor', '#F5E6D3')}" oninput="state.updateField('theme', 'backgroundColor', this.value); document.getElementById('theme_color_picker').value = this.value">
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-600 mb-2">${t('theme_label_font_display')}</label>
                    ${this.createStateSelect('theme_font_display', 'theme', 'fontDisplay', [
            { value: 'Playfair Display, serif', label: 'Playfair Display (Vintage)' },
            { value: 'Great Vibes, cursive', label: 'Great Vibes (Romantic & Flowy)' },
            { value: 'Dancing Script, cursive', label: 'Dancing Script (Elegant Script)' },
            { value: 'Sacramento, cursive', label: 'Sacramento (Thin & Minimalist)' },
            { value: 'Cinzel, serif', label: 'Cinzel (Luxury / Classic)' },
            { value: 'Lobster, cursive', label: 'Lobster (Retro / Fun)' },
            { value: 'Pacifico, cursive', label: 'Pacifico (Playful)' },
            { value: 'Montserrat, sans-serif', label: 'Montserrat (Bold Modern)' },
            { value: 'Inter, sans-serif', label: 'Inter (Clean)' }
        ])}
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-600 mb-2">${t('theme_label_font_sans')}</label>
                    ${this.createStateSelect('theme_font_sans', 'theme', 'fontSans', [
            { value: 'Poppins, sans-serif', label: 'Poppins (Smooth & Modern)' },
            { value: 'Inter, sans-serif', label: 'Inter (Standard)' },
            { value: 'Cormorant Garamond, serif', label: 'Cormorant Garamond (Fine Italic)' },
            { value: 'Roboto, sans-serif', label: 'Roboto (Clean)' },
            { value: 'Courier New, monospace', label: 'Courier New (Old School)' }
        ])}
                </div>
                
                <div class="md:col-span-2">
                    <label class="block text-sm font-bold text-gray-600 mb-2">${t('theme_label_particles')}</label>
                    ${this.createStateSelect('theme_particles', 'theme', 'particles', [
            { value: 'none', label: t('part_none') },
            { value: 'hearts', label: t('part_hearts') },
            { value: 'stars', label: t('part_stars') },
            { value: 'dust', label: t('part_dust') },
            { value: 'snow', label: t('part_snow') }
        ])}
                    <p class="text-xs text-gray-400 mt-2 italic">Note: Keep it subtle. These float gently in the background.</p>
                </div>
            </div>

            <!-- Global Branding (Locked) -->
            <!-- Global Branding (Locked) -->
            <div class="bg-gray-100/50 border border-gray-200 rounded-xl p-6 mb-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-gray-400">lock</span>
                        <h3 class="text-sm font-bold text-gray-500 uppercase tracking-widest">${t('brand_protect')}</h3>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 bg-white/50 border border-dashed border-gray-200 p-4 rounded-lg">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-gray-400 scale-75">${this.getStateValue('metadata', 'brandIcon', 'diamond')}</span>
                        <div class="text-[11px] font-bold text-gray-400 uppercase">Icon</div>
                    </div>
                    <div>
                        <div class="text-[11px] font-bold text-gray-400 uppercase">${t('theme_label_brand')}</div>
                        <div class="text-gray-600 font-medium">${this.getStateValue('metadata', 'brandName', 'For you, Always')}</div>
                    </div>
                </div>
                <p class="text-[10px] text-gray-400 mt-3 italic">${t('brand_note')}</p>
            </div>

            <!-- Login & Countdown Settings -->
            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-6 mb-6">
                <div class="flex items-center gap-3 mb-4">
                    <span class="material-symbols-outlined text-indigo-600">lock_person</span>
                    <h3 class="text-lg font-bold text-gray-900">${t('login_header')}</h3>
                </div>
                
                <div class="bg-white rounded-lg p-4 mb-4">
                    <div class="flex gap-3 mb-4">
                        <span class="material-symbols-outlined text-indigo-400">shield_lock</span>
                        <div class="text-xs text-indigo-900/80 leading-relaxed">
                            <span class="font-bold block text-indigo-900 mb-1">🔑 ${t('login_help_title')}</span>
                            ${t('login_help_desc')}
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1 font-bold">${t('login_password')}</label>
                        ${this.createStateInput('password', 'login', 'password', 'Enter password')}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1 font-bold">${t('login_subtitle')}</label>
                        ${this.createStateInput('collectionText', 'login', 'collectionText', 'Collection text')}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1 font-bold">${t('login_title')}</label>
                        ${this.createStateInput('p1_title', 'login', 'title', 'Login page title')}
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1 font-bold">${t('login_hint')}</label>
                        ${this.createStateInput('p1_instr', 'login', 'instruction', 'Login instruction')}
                    </div>
                    
                    <div class="md:col-span-2 bg-rose-50 rounded-lg p-4 border border-rose-100">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-rose-800 mb-1">${t('count_target')}</label>
                                <input type="datetime-local" 
                                       id="count_date" 
                                       class="form-input border-rose-200" 
                                       value="${this.getStateValue('countdown', 'targetDate', '2026-02-14T22:00').substring(0, 16)}"
                                       oninput="state.updateField('countdown', 'targetDate', new Date(this.value).toISOString())">
                                <p class="text-xs text-rose-400 mt-1">${t('count_note')}</p>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-rose-800 mb-1">${t('count_finish')}</label>
                                ${this.createStateInput('count_finish', 'countdown', 'finishMessage', 'Finish message')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Navigation Settings -->
            <div class="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 class="text-sm font-bold text-gray-900 mb-4">${t('nav_settings')}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                            <label class="block text-sm font-bold text-gray-900">${t('nav_indicator')}</label>
                            <p class="text-xs text-gray-500 font-medium">${t('nav_indicator_desc')}</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   id="show_indicator" 
                                   class="form-checkbox h-5 w-5 text-rose-600 rounded focus:ring-rose-500" 
                                   ${this.getStateValue('navigation', 'showPageIndicator', true) ? 'checked' : ''}
                                   onchange="state.updateField('navigation', 'showPageIndicator', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    
                    <div class="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                        <div>
                            <label class="block text-sm font-bold text-gray-900">${t('nav_swipe')}</label>
                            <p class="text-xs text-gray-500 font-medium">${t('nav_swipe_desc')}</p>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" 
                                   id="enable_swipe" 
                                   class="form-checkbox h-5 w-5 text-rose-600 rounded focus:ring-rose-500" 
                                   ${this.getStateValue('navigation', 'enableSwipe', true) ? 'checked' : ''}
                                   onchange="state.updateField('navigation', 'enableSwipe', this.checked)">
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                </div>
            </div>

            <div class="mt-6">
                <label class="block text-sm font-bold text-gray-600 mb-2">${t('theme_label_recipient')}</label>
                ${this.createStateInput('cust_name', 'metadata', 'customerName', t('identity_placeholder_name'))}
            </div>
        `;
    },

    // ========================================
    // STEP 2: PAGE MANAGER
    // ========================================
    renderPageManagerStep() {
        const pages = state.getPages(false); // Get all pages including disabled
        const lang = state.configData.adminLang || 'en';

        let pagesHtml = pages.map(page => {
            const isDisabled = page.required ? 'disabled' : '';
            const requiredBadge = page.required ? `<span class="page-required">${t('pageman_required')}</span>` : '';

            // Try to translate page name
            const pageIdKey = page.id.replace(/-/g, '_');
            const pageName = translations[lang][`page_${pageIdKey}_title`] || page.name;

            return `
                <div class="page-manager-item" data-id="${page.id}" draggable="${!page.required}">
                    <div class="page-icon">
                        <span class="material-symbols-outlined">${page.icon}</span>
                    </div>
                    <div class="page-info flex-1">
                        <div class="page-name">${pageName}</div>
                        <div class="page-type">${page.type}</div>
                        ${requiredBadge}
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" class="page-toggle" data-page-id="${page.id}" ${page.enabled ? 'checked' : ''} ${isDisabled}>
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            `;
        }).join('');

        return `
            <div class="section-header">
                <div class="section-icon !bg-rose-100 !text-rose-600">
                    <span class="material-symbols-outlined">dashboard_customize</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('pageman_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('pageman_desc')}</p>
                </div>
                ${this.createPreviewButton('page-1')}
            </div>

            <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-8">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-indigo-400">info</span>
                    <p class="text-xs text-indigo-900/80 leading-relaxed">
                        ${t('pageman_hint')}
                    </p>
                </div>
            </div>

            <div id="page-list" class="space-y-3">
                ${pagesHtml}
            </div>
        `;
    },

    // ========================================
    // DYNAMIC PAGE STEPS
    // ========================================
    renderPageStep(step) {
        // Route to specific page renderer based on type
        switch (step.type) {
            case 'greeting':
                return this.renderGreetingStep();
            case 'music':
                return this.renderMusicStep();
            case 'wrapped':
                return this.renderWrappedStep();
            case 'quiz':
                return this.renderQuizStep();
            case 'gallery':
                return this.renderGalleryStep();
            case 'map':
                return this.renderMapStep();
            case 'letter':
                return this.renderLetterStep();
            case 'lock':
                return this.renderLockStep();
            case 'infinity':
                return this.renderInfinityStep();
            default:
                return '<p>Unknown page type</p>';
        }
    },

    // ========================================
    // PAGE 2: GREETING CARD
    // ========================================
    renderGreetingStep() {
        const bodyMsg = `
            <div class="space-y-4 pt-3">
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_greeting_label_hero')}</label>
                    ${this.createStateInput('greet_title', 'greeting', 'title', "Happy Valentine's Day")}
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_greeting_label_msg')}</label>
                    ${this.createStateTextarea('greet_msg', 'greeting', 'message', 'Your heartfelt message', 5)}
                </div>
            </div>
        `;

        const bodyVisual = `
            <div class="space-y-4 pt-3">
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_greeting_label_img')}</label>
                    <div class="flex gap-2 items-center">
                        <img id="prev_greet_img" src="${this.getStateValue('greeting', 'imageSrc', '')}" class="img-preview-mini w-12 h-12 object-cover rounded-lg shadow-sm ${this.getStateValue('greeting', 'imageSrc') ? '' : 'hidden'}">
                        ${this.createStateInput('greet_img', 'greeting', 'imageSrc', 'assets/photo.jpg')}
                        <label class="cursor-pointer bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center hover:bg-gray-50 shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-gray-400">add_photo_alternate</span>
                            <input type="file" class="hidden" accept="image/*" onchange="utils.handleMediaUpload(this, 'greet_img')">
                        </label>
                    </div>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_greeting_label_sig')}</label>
                    ${this.createStateInput('greet_signature', 'greeting', 'signature', 'With Love')}
                </div>
            </div>
        `;

        return `
            <div class="section-header">
                <div class="section-icon">
                    <span class="material-symbols-outlined text-pink-500">favorite</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900 font-display italic">${t('page_greeting_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_greeting_desc')}</p>
                </div>
                ${this.createPreviewButton('page-2')}
            </div>

            <div class="space-y-4">
                ${this.renderCollapsible(0, 'Headline & Message', 'Primary content of your card', bodyMsg)}
                ${this.renderCollapsible(1, 'Media & Signature', 'Photo and closing signature', bodyVisual)}
            </div>
        `;
    },

    // ========================================
    // PAGE 3: MUSIC (Our Playlist)
    // ========================================
    renderMusicStep() {
        const pageData = state.findPageById('page-3') || {
            songTitle: t('page_music_title'),
            music: []
        };

        let songsHtml = '';
        if (pageData.music && pageData.music.length > 0) {
            songsHtml = pageData.music.map((song, idx) => this.renderSongItem(song, idx)).join('');
        }

        return `
            <div class="section-header">
                <div class="section-icon !bg-purple-100 !text-purple-600">
                    <span class="material-symbols-outlined">library_music</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_music_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_music_desc')}</p>
                </div>
                ${this.createPreviewButton('page-3')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-blue-400">info</span>
                    <div class="text-xs text-blue-900/80 leading-relaxed">
                        <span class="font-bold block text-blue-900 mb-1 text-sm">🎵 ${t('page_music_tips')}</span>
                        ${t('page_music_tips_desc')}
                    </div>
                </div>
            </div>


            <div id="music-list" class="space-y-4">
                ${songsHtml}
            </div>

            <button type="button" class="btn-add" onclick="renderers.addSong()">
                <span class="material-symbols-outlined">add</span>
                ${t('page_music_btn_add')}
            </button>
        `;
    },

    renderSongItem(song, idx) {
        const bodyContent = `
            <div class="space-y-3 pt-3">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_music_label_song')}</label>
                        <input type="text" class="form-input text-sm" value="${song.songTitle || ''}" 
                            oninput="renderers.updateSong(${idx}, 'songTitle', this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Song'">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_music_label_artist')}</label>
                        <input type="text" class="form-input text-sm" value="${song.artist || ''}" 
                            oninput="renderers.updateSong(${idx}, 'artist', this.value); this.closest('.dynamic-item').querySelector('.item-summary-desc').textContent = this.value || 'Unknown Artist'">
                    </div>
                </div>
                
                <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_music_label_audio')}</label>
                    <div class="flex gap-2 items-center">
                        <input type="text" id="audio-input-${idx}" class="form-input text-xs font-mono flex-1" value="${song.audioSrc || ''}" 
                            placeholder="assets/song.mp3" 
                            oninput="renderers.updateSong(${idx}, 'audioSrc', this.value)">
                        <label class="cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center hover:bg-gray-50 shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-gray-400 text-base">audiotrack</span>
                            <input type="file" class="hidden" accept="audio/*" 
                                onchange="renderers.handleAudioUpload(${idx}, this)">
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_music_label_cover')}</label>
                    <div class="flex gap-2 items-center">
                        <img src="${song.coverSrc || ''}" class="img-preview-mini w-12 h-12 object-cover rounded-lg shadow-sm ${song.coverSrc ? '' : 'hidden'}" 
                            onerror="this.classList.add('hidden')" id="song-cover-${idx}">
                        <input type="text" class="form-input text-xs font-mono flex-1" value="${song.coverSrc || ''}" 
                            id="song-cover-input-${idx}"
                            placeholder="assets/cover.jpg" 
                            oninput="renderers.updateSong(${idx}, 'coverSrc', this.value); renderers.updateSongPreview(${idx})">
                        <label class="cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center hover:bg-gray-50 shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-gray-400 text-base">image</span>
                            <input type="file" class="hidden" accept="image/*" onchange="utils.handleMediaUpload(this, 'song-cover-input-${idx}')">
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('page_music_label_lyrics')}</label>
                    <textarea class="form-input text-sm" rows="3" 
                        placeholder="Enter lyrics here..." 
                        oninput="renderers.updateSong(${idx}, 'lyrics', this.value)">${song.lyrics || ''}</textarea>
                </div>
            </div>
        `;

        return this.renderCollapsible(idx, song.songTitle || 'Untitled Song', song.artist || 'Unknown Artist', bodyContent, `renderers.removeSong(${idx})`);
    },

    updateMusicTitle(value) {
        state.updatePageData('page-3', { songTitle: value });
    },

    addSong() {
        const pageData = state.findPageById('page-3');
        if (!pageData) {
            state.configData.pages.push({
                pageId: 'page-3',
                type: 'music-section',
                songTitle: 'Our Playlist',
                music: []
            });
        }

        const page = state.findPageById('page-3');
        if (!page.music) page.music = [];

        page.music.push({
            songTitle: '',
            artist: '',
            audioSrc: '',
            coverSrc: '',
            lyrics: ''
        });

        app.renderCurrentStep();
        state.save();
        state.syncToPreview();
    },

    removeSong(idx) {
        const page = state.findPageById('page-3');
        if (page && page.music) {
            page.music.splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateSong(idx, key, value) {
        const page = state.findPageById('page-3');
        if (page && page.music && page.music[idx]) {
            page.music[idx][key] = value;
            state.save();
            state.syncToPreview();
        }
    },

    updateSongPreview(idx) {
        const input = document.getElementById(`song-cover-input-${idx}`);
        const img = document.getElementById(`song-cover-${idx}`);
        if (input && img) {
            img.src = input.value;
            img.classList.toggle('hidden', !input.value);
        }
    },

    async handleAudioUpload(idx, input) {
        // Delegate to main utils upload function
        // This ensures consistent Cloudflare upload logic
        await utils.handleMediaUpload(input, `audio-input-${idx}`);
    },

    // ========================================
    // PAGE 4: WRAPPED (Our Vibe)
    // ========================================
    renderWrappedStep() {
        const pageData = state.findPageById('page-4') || {
            vibeLabel: 'Our Vibe',
            vibe: '',
            HoursTogetherLabel: 'Hours Together',
            HoursTogether: '',
            imageSrc: '',
            topPlacesLabel: 'Top Places We\'ve Been',
            topPlaces: [],
            coreMemoriesLabel: 'Core Memories',
            coreMemories: []
        };

        const placesHtml = (pageData.topPlaces || []).map((item, idx) =>
            this.renderWrappedListItem('topPlaces', item, idx)
        ).join('');

        const memoriesHtml = (pageData.coreMemories || []).map((item, idx) =>
            this.renderWrappedListItem('coreMemories', item, idx)
        ).join('');

        return `
            <div class="section-header">
                <div class="section-icon !bg-gradient-to-br !from-purple-400 !to-pink-400 !text-white">
                    <span class="material-symbols-outlined">auto_awesome</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_wrapped_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_wrapped_desc')}</p>
                </div>
                ${this.createPreviewButton('page-4')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-blue-400">lightbulb</span>
                    <div class="text-xs text-blue-900/80 leading-relaxed">
                        <span class="font-bold block text-blue-900 mb-1 text-sm">💡 ${t('page_wrapped_tips')}</span>
                        ${t('page_wrapped_tips_desc')}
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_wrapped_label_vibe')}</label>
                        <input type="text" class="form-input" value="${pageData.vibeLabel}" 
                            oninput="renderers.updateWrapped('vibeLabel', this.value)">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_wrapped_label_vibe_desc')}</label>
                        <input type="text" class="form-input" value="${pageData.vibe}" 
                            placeholder="e.g., Bonnie & Clyde"
                            oninput="renderers.updateWrapped('vibe', this.value)">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_wrapped_label_minutes')}</label>
                        <input type="text" class="form-input" value="${pageData.HoursTogetherLabel}" 
                            oninput="renderers.updateWrapped('HoursTogetherLabel', this.value)">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_wrapped_label_score')}</label>
                        <input type="text" class="form-input" value="${pageData.HoursTogether}" 
                            placeholder="e.g., 525,600"
                            oninput="renderers.updateWrapped('HoursTogether', this.value)">
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_wrapped_label_top_song')}</label>
                    <div class="flex gap-2 items-center">
                        <img id="wrapped-hero-img" src="${pageData.imageSrc}" 
                            class="img-preview-mini w-16 h-16 object-cover rounded-lg shadow-sm ${pageData.imageSrc ? '' : 'hidden'}" 
                            onerror="this.classList.add('hidden')">
                        <input type="text" id="wrapped-hero-input" class="form-input font-mono text-sm flex-1" 
                            value="${pageData.imageSrc}" 
                            placeholder="assets/photo.jpg"
                            oninput="renderers.updateWrapped('imageSrc', this.value); renderers.updateWrappedPreview()">
                        <label class="cursor-pointer bg-white border border-gray-200 rounded-xl px-4 py-2 flex items-center hover:bg-gray-50 shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-gray-400">image</span>
                            <input type="file" class="hidden" accept="image/*" onchange="utils.handleMediaUpload(this, 'wrapped-hero-input')">
                        </label>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <label class="block text-sm font-bold text-gray-900 mb-2">${pageData.topPlacesLabel || 'Top Places We\'ve Been'}</label>
                    <input type="text" class="form-input mb-4" value="${pageData.topPlacesLabel || 'Top Places We\'ve Been'}" 
                        oninput="renderers.updateWrapped('topPlacesLabel', this.value)">
                    
                    <div id="wrapped-places-list" class="space-y-3 mb-4">
                        ${placesHtml}
                    </div>
                    <button type="button" class="btn-add !mt-0" onclick="renderers.addWrappedPlace()">
                        <span class="material-symbols-outlined">add</span>
                        ${t('map_btn_add')}
                    </button>
                </div>

                <div class="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
                    <label class="block text-sm font-bold text-gray-900 mb-2">${pageData.coreMemoriesLabel || 'Core Memories'}</label>
                    <input type="text" class="form-input mb-4" value="${pageData.coreMemoriesLabel || 'Core Memories'}" 
                        oninput="renderers.updateWrapped('coreMemoriesLabel', this.value)">
                    
                    <div id="wrapped-memories-list" class="space-y-3 mb-4">
                        ${memoriesHtml}
                    </div>
                    <button type="button" class="btn-add !mt-0" onclick="renderers.addWrappedMemory()">
                        <span class="material-symbols-outlined">add</span>
                        ${t('page_music_btn_add')}
                    </button>
                </div>
            </div>
        `;
    },

    renderWrappedListItem(listType, item, idx) {
        const body = `
            <div class="pt-3">
                <input type="text" class="form-input text-sm" value="${item}" 
                    placeholder="Enter details..."
                    oninput="renderers.updateWrappedListItem('${listType}', ${idx}, this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Item'">
            </div>
        `;

        const title = item || (listType === 'topPlaces' ? 'New Place' : 'New Memory');
        const desc = listType === 'topPlaces' ? 'Place in your journey' : 'Special memory';

        return this.renderCollapsible(idx, title, desc, body, `renderers.removeWrappedListItem('${listType}', ${idx})`);
    },

    updateWrapped(key, value) {
        state.updatePageData('page-4', { [key]: value });
    },

    updateWrappedPreview() {
        const input = document.getElementById('wrapped-hero-input');
        const img = document.getElementById('wrapped-hero-img');
        if (input && img) {
            img.src = input.value;
            img.classList.toggle('hidden', !input.value);
        }
    },

    updateWrappedListItem(listType, idx, value) {
        const page = state.findPageById('page-4');
        if (page && page[listType]) {
            page[listType][idx] = value;
            state.save();
            state.syncToPreview();
        }
    },

    removeWrappedListItem(listType, idx) {
        const page = state.findPageById('page-4');
        if (page && page[listType]) {
            page[listType].splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    addWrappedPlace() {
        const page = state.findPageById('page-4');
        if (!page.topPlaces) page.topPlaces = [];
        page.topPlaces.push('');
        app.renderCurrentStep();
        state.save();
    },

    addWrappedMemory() {
        const page = state.findPageById('page-4');
        if (!page.coreMemories) page.coreMemories = [];
        page.coreMemories.push('');
        app.renderCurrentStep();
        state.save();
    },

    // ========================================
    // PAGE 5: QUIZ
    // ========================================
    renderQuizStep() {
        const pageData = state.findPageById('page-5') || {
            title: t('page_quiz_title'),
            resultMessage: 'You know me so well! ❤️',
            questions: []
        };

        let questionsHtml = '';
        if (pageData.questions && pageData.questions.length > 0) {
            questionsHtml = pageData.questions.map((q, idx) => this.renderQuizQuestion(q, idx)).join('');
        }

        return `
            <div class="section-header">
                <div class="section-icon !bg-green-100 !text-green-600">
                    <span class="material-symbols-outlined">quiz</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_quiz_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_quiz_desc')}</p>
                </div>
                ${this.createPreviewButton('page-5')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-blue-400">lightbulb</span>
                    <div class="text-xs text-blue-900/80 leading-relaxed">
                        <span class="font-bold block text-blue-900 mb-1 text-sm">💡 ${t('page_quiz_tips')}</span>
                        ${t('page_quiz_tips_desc')}
                    </div>
                </div>
            </div>

            <div class="space-y-6 mb-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_quiz_label_finish')}</label>
                    <input type="text" class="form-input" value="${pageData.resultMessage}" 
                        oninput="renderers.updateQuiz('resultMessage', this.value)">
                </div>
            </div>

            <div id="quiz-questions-list" class="space-y-6">
                ${questionsHtml}
            </div>

            <button type="button" class="btn-add" onclick="renderers.addQuizQuestion()">
                <span class="material-symbols-outlined">add</span>
                ${t('page_quiz_btn_add')}
            </button>
        `;
    },

    renderQuizQuestion(question, idx) {
        const options = question.options || ['', '', '', ''];
        const bodyContent = `
            <div class="space-y-4 pt-3">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">Question ${idx + 1}</label>
                    <input type="text" class="form-input" value="${question.question || ''}" 
                        placeholder="Enter your question..."
                        oninput="renderers.updateQuizQuestion(${idx}, 'question', this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Question'">
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    ${options.map((opt, optIdx) => `
                        <div class="flex gap-2 items-center">
                            <input type="radio" name="quiz-${idx}-correct" value="${optIdx}" 
                                ${question.correctIndex === optIdx ? 'checked' : ''}
                                onchange="renderers.updateQuizQuestion(${idx}, 'correctIndex', ${optIdx})"
                                class="w-4 h-4 text-green-600">
                            <input type="text" class="form-input text-sm flex-1" 
                                value="${opt}" 
                                placeholder="Option ${optIdx + 1}"
                                oninput="renderers.updateQuizOption(${idx}, ${optIdx}, this.value)">
                        </div>
                    `).join('')}
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-green-700 mb-1">Correct Message</label>
                        <input type="text" class="form-input text-sm" 
                            value="${question.correctMessage || 'Correct! ❤️'}" 
                            placeholder="Correct! ❤️"
                            oninput="renderers.updateQuizQuestion(${idx}, 'correctMessage', this.value)">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-rose-700 mb-1">Wrong Message</label>
                        <input type="text" class="form-input text-sm" 
                            value="${question.wrongMessage || 'Try again!'}" 
                            placeholder="Try again!"
                            oninput="renderers.updateQuizQuestion(${idx}, 'wrongMessage', this.value)">
                    </div>
                </div>
            </div>
        `;

        return this.renderCollapsible(idx, question.question || 'Untitled Question', 'Quiz Question', bodyContent, `renderers.removeQuizQuestion(${idx})`);
    },

    updateQuiz(key, value) {
        state.updatePageData('page-5', { [key]: value });
    },

    addQuizQuestion() {
        const page = state.findPageById('page-5');
        if (!page.questions) page.questions = [];

        page.questions.push({
            question: '',
            options: ['', '', '', ''],
            correctIndex: 0,
            correctMessage: 'Correct! ❤️',
            wrongMessage: 'Try again!'
        });

        app.renderCurrentStep();
        state.save();
    },

    removeQuizQuestion(idx) {
        const page = state.findPageById('page-5');
        if (page && page.questions) {
            page.questions.splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateQuizQuestion(idx, key, value) {
        const page = state.findPageById('page-5');
        if (page && page.questions && page.questions[idx]) {
            page.questions[idx][key] = value;
            state.save();
            state.syncToPreview();
        }
    },

    updateQuizOption(qIdx, optIdx, value) {
        const page = state.findPageById('page-5');
        if (page && page.questions && page.questions[qIdx]) {
            page.questions[qIdx].options[optIdx] = value;
            state.save();
            state.syncToPreview();
        }
    },

    // ========================================
    // PAGE 6: GALLERY
    // ========================================
    renderGalleryStep() {
        const pageData = state.findPageById('page-6') || {
            title: t('page_gallery_title'),
            subtitle: 'Scratch to reveal',
            memories: []
        };

        let memoriesHtml = '';
        if (pageData.memories && pageData.memories.length > 0) {
            memoriesHtml = pageData.memories.map((m, idx) => this.renderGalleryMemory(m, idx)).join('');
        }

        return `
            <div class="section-header">
                <div class="section-icon !bg-yellow-100 !text-yellow-600">
                    <span class="material-symbols-outlined">photo_library</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_gallery_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_gallery_desc')}</p>
                </div>
                ${this.createPreviewButton('page-6')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-blue-400">lightbulb</span>
                    <div class="text-xs text-blue-900/80 leading-relaxed">
                        <span class="font-bold block text-blue-900 mb-1 text-sm">💡 ${t('page_gallery_tips')}</span>
                        ${t('page_gallery_tips_desc')}
                    </div>
                </div>
            </div>

            <div class="space-y-6 mb-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_gallery_label_title')}</label>
                    <input type="text" class="form-input" value="${pageData.title}" 
                        oninput="renderers.updateGallery('title', this.value)">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('theme_subtitle')}</label>
                    <input type="text" class="form-input" value="${pageData.subtitle}" 
                        oninput="renderers.updateGallery('subtitle', this.value)">
                </div>
            </div>

            <div id="gallery-memories-list" class="space-y-4">
                ${memoriesHtml}
            </div>

            <button type="button" class="btn-add" onclick="renderers.addGalleryMemory()">
                <span class="material-symbols-outlined">add</span>
                ${t('page_gallery_btn_add')}
            </button>
        `;
    },

    renderGalleryMemory(memory, idx) {
        const bodyContent = `
            <div class="space-y-3 pt-3">
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-2">Media Type</label>
                    <select class="form-input text-sm" onchange="renderers.updateGalleryMemory(${idx}, 'type', this.value)">
                        <option value="image" ${memory.type === 'image' ? 'selected' : ''}>📷 Image</option>
                        <option value="video" ${memory.type === 'video' ? 'selected' : ''}>🎬 Video</option>
                    </select>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-2">${memory.type === 'video' ? 'Video' : 'Image'} URL</label>
                    <div class="flex gap-2 items-center">
                        <img src="${memory.src || ''}" 
                            id="gallery-mem-${idx}"
                            class="img-preview-mini w-12 h-12 object-cover rounded-lg shadow-sm ${memory.src && memory.type === 'image' ? '' : 'hidden'}" 
                            onerror="this.classList.add('hidden')">
                        <input type="text" id="gallery-mem-input-${idx}" class="form-input text-xs font-mono flex-1" 
                            value="${memory.src || ''}" 
                            placeholder="assets/photo.jpg"
                            oninput="renderers.updateGalleryMemory(${idx}, 'src', this.value); renderers.updateGalleryPreview(${idx})">
                        <label class="cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-2 flex items-center hover:bg-gray-50 shadow-sm transition-colors">
                            <span class="material-symbols-outlined text-gray-400 text-base">upload</span>
                            <input type="file" class="hidden" accept="${memory.type === 'video' ? 'video/*' : 'image/*'}" 
                                onchange="utils.handleMediaUpload(this, 'gallery-mem-input-${idx}')">
                        </label>
                    </div>
                </div>

                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-2">${t('page_gallery_label_caption')}</label>
                        <input type="text" class="form-input text-sm" value="${memory.caption || ''}" 
                            placeholder="A special moment..."
                            oninput="renderers.updateGalleryMemory(${idx}, 'caption', this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Memory'">
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-2">${t('page_gallery_label_date')}</label>
                        <input type="text" class="form-input text-sm" value="${memory.date || ''}" 
                            placeholder="20 Feb 2024"
                            oninput="renderers.updateGalleryMemory(${idx}, 'date', this.value)">
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-2">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-2">Tape Style</label>
                        <select class="form-input text-xs" onchange="renderers.updateGalleryMemory(${idx}, 'tape', this.value)">
                            <option value="washi-tape" ${memory.tape === 'washi-tape' ? 'selected' : ''}>🎀 PINK</option>
                            <option value="washi-tape-gold" ${memory.tape === 'washi-tape-gold' ? 'selected' : ''}>✨ GOLD</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-2">Rotation</label>
                        <select class="form-input text-xs" onchange="renderers.updateGalleryMemory(${idx}, 'rotation', this.value)">
                            <option value="rotate-1" ${memory.rotation === 'rotate-1' ? 'selected' : ''}>Tilt L</option>
                            <option value="rotate-2" ${memory.rotation === 'rotate-2' ? 'selected' : ''}>Tilt R</option>
                            <option value="-rotate-1" ${memory.rotation === '-rotate-1' ? 'selected' : ''}>Tilt B</option>
                        </select>
                    </div>
                </div>
            </div>
        `;

        return this.renderCollapsible(idx, memory.caption || 'Untitled Memory', `Type: ${memory.type}`, bodyContent, `renderers.removeGalleryMemory(${idx})`);
    },

    updateGallery(key, value) {
        state.updatePageData('page-6', { [key]: value });
    },

    addGalleryMemory() {
        const page = state.findPageById('page-6');
        if (!page.memories) page.memories = [];

        page.memories.push({
            type: 'image',
            src: '',
            caption: '',
            tape: 'washi-tape',
            rotation: 'rotate-2'
        });

        app.renderCurrentStep();
        state.save();
    },

    removeGalleryMemory(idx) {
        const page = state.findPageById('page-6');
        if (page && page.memories) {
            page.memories.splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateGalleryMemory(idx, key, value) {
        const page = state.findPageById('page-6');
        if (page && page.memories && page.memories[idx]) {
            page.memories[idx][key] = value;

            // Re-render if type changed
            if (key === 'type') {
                app.renderCurrentStep();
            }

            state.save();
            state.syncToPreview();
        }
    },

    updateGalleryPreview(idx) {
        const input = document.getElementById(`gallery-mem-input-${idx}`);
        const img = document.getElementById(`gallery-mem-${idx}`);
        if (input && img) {
            img.src = input.value;
            img.classList.toggle('hidden', !input.value);
        }
    },

    // ========================================
    // PAGE 7: MAP
    // ========================================
    renderMapStep() {
        const pageData = state.findPageById('page-7') || {
            title: t('page_map_title'),
            description: t('page_map_desc'),
            locations: []
        };

        let locationsHtml = '';
        if (pageData.locations && pageData.locations.length > 0) {
            locationsHtml = pageData.locations.map((loc, idx) => this.renderMapLocation(loc, idx)).join('');
        }

        return `
            <div class="section-header">
                <div class="section-icon !bg-blue-100 !text-blue-600">
                    <span class="material-symbols-outlined">map</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_map_header')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_map_desc')}</p>
                </div>
                ${this.createPreviewButton('page-7')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="text-xs text-blue-900/80 leading-relaxed">
                    <span class="font-bold block text-blue-900 mb-2 text-sm">📍 ${t('map_help_title')}</span>
                    ${t('map_help_desc')}
                </div>
            </div>

            <div class="space-y-6 mb-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('map_label_title')}</label>
                    <input type="text" class="form-input" value="${pageData.title}" 
                        oninput="renderers.updateMap('title', this.value)">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('map_label_desc')}</label>
                    <input type="text" class="form-input" value="${pageData.description}" 
                        oninput="renderers.updateMap('description', this.value)">
                </div>
            </div>

            <div id="map-locations-list" class="space-y-4">
                ${locationsHtml}
            </div>

            <button type="button" class="btn-add" onclick="renderers.addMapLocation()">
                <span class="material-symbols-outlined">add</span>
                ${t('map_btn_add')}
            </button>
        `;
    },

    renderMapLocation(loc, idx) {
        const bodyContent = `
            <div class="space-y-3 pt-3">
                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">${t('map_label_icon')}</label>
                        <select class="form-input text-sm" onchange="renderers.updateMapLocation(${idx}, 'icon', this.value)">
                            <option value="favorite" ${loc.icon === 'favorite' || !loc.icon ? 'selected' : ''}>❤️ Heart</option>
                            <option value="star" ${loc.icon === 'star' ? 'selected' : ''}>⭐ Star</option>
                            <option value="location_on" ${loc.icon === 'location_on' ? 'selected' : ''}>📍 Location</option>
                            <option value="restaurant" ${loc.icon === 'restaurant' ? 'selected' : ''}>🍴 Food</option>
                            <option value="park" ${loc.icon === 'park' ? 'selected' : ''}>🌳 Park</option>
                            <option value="theater_comedy" ${loc.icon === 'theater_comedy' ? 'selected' : ''}>🎬 Cinema</option>
                            <option value="photo_camera" ${loc.icon === 'photo_camera' ? 'selected' : ''}>📸 Photo</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">${t('map_label_date')}</label>
                        <input type="date" class="form-input text-sm" value="${loc.date || ''}" 
                            oninput="renderers.updateMapLocation(${idx}, 'date', this.value); this.closest('.dynamic-item').querySelector('.item-summary-desc').textContent = this.value + ' - ' + (loc.memory || 'No memory')">
                    </div>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('map_label_name')}</label>
                    <input type="text" class="form-input text-sm font-bold" value="${loc.title || ''}" 
                        placeholder="${t('map_placeholder_name')}"
                        oninput="renderers.updateMapLocation(${idx}, 'title', this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Place'">
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">${t('map_coordinates')}</label>
                    <div class="flex gap-2 mb-1">
                        <input type="text" class="form-input text-xs font-mono flex-1" 
                            id="map-coords-${idx}"
                            value="${loc.lat && loc.lng ? loc.lat + ', ' + loc.lng : ''}" 
                            placeholder="-6.200000, 106.816000"
                            oninput="renderers.handleMapCoordinates(${idx}, this.value)">
                        <button type="button" class="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 flex items-center gap-1" onclick="mapPicker.open(${idx})">
                            <span class="material-symbols-outlined text-sm">map</span>
                            ${t('map_pick_btn')}
                        </button>
                    </div>
                    <p class="text-[10px] text-gray-400 italic">${t('map_coords_tip')}</p>
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-1">Memory Description</label>
                    <input type="text" class="form-input text-sm" value="${loc.memory || ''}" 
                        placeholder="What happened here?"
                        oninput="renderers.updateMapLocation(${idx}, 'memory', this.value); this.closest('.dynamic-item').querySelector('.item-summary-desc').textContent = (loc.date || 'No date') + ' - ' + this.value">
                </div>
                
                <div>
                    <label class="block text-xs font-bold text-gray-600 mb-2">Location Photo (Optional)</label>
                    <div class="flex gap-2 items-center">
                        <img src="${loc.imageSrc || ''}" 
                            id="map-loc-${idx}"
                            class="img-preview-mini w-12 h-12 object-cover rounded-lg shadow-sm ${loc.imageSrc ? '' : 'hidden'}" 
                            onerror="this.classList.add('hidden')">
                        <input type="text" id="map-loc-input-${idx}" class="form-input text-xs font-mono flex-1" 
                            value="${loc.imageSrc || ''}" 
                            placeholder="assets/photo.jpg"
                            oninput="renderers.updateMapLocation(${idx}, 'imageSrc', this.value); renderers.updateMapPreview(${idx})">
                        <label class="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-gray-200 rounded-lg px-3 py-2 flex items-center hover:from-blue-600 hover:to-indigo-700 shadow-sm transition-all" title="Upload photo (auto-detect location & date)">
                            <span class="material-symbols-outlined text-white text-base">add_a_photo</span>
                            <input type="file" class="hidden" accept="image/*" 
                                data-target="map-loc-input-${idx}" 
                                data-map-index="${idx}"
                                onchange="renderers.handleMapPhotoUpload(this, ${idx})">
                        </label>
                    </div>
                    <p class="text-[10px] text-gray-400 mt-1 italic">📍 Upload foto dari HP untuk otomatis isi lokasi & tanggal</p>
                </div>
            </div>
        `;

        return this.renderCollapsible(idx, loc.title || 'Untitled Place', `${loc.date || ''} - ${loc.memory || ''}`, bodyContent, `renderers.removeMapLocation(${idx})`);
    },

    updateMap(key, value) {
        state.updatePageData('page-7', { [key]: value });
    },

    addMapLocation() {
        const page = state.findPageById('page-7');
        if (!page.locations) page.locations = [];

        page.locations.push({
            lat: '',
            lng: '',
            title: '',
            memory: '',
            date: '',
            imageSrc: '',
            icon: 'favorite'
        });

        app.renderCurrentStep();
        state.save();
    },

    removeMapLocation(idx) {
        const page = state.findPageById('page-7');
        if (page && page.locations) {
            page.locations.splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateMapLocation(idx, key, value) {
        const page = state.findPageById('page-7');
        if (page && page.locations && page.locations[idx]) {
            page.locations[idx][key] = value;
            state.save();
            state.syncToPreview();
        }
    },

    handleMapCoordinates(idx, value) {
        const parts = value.split(',');
        const lat = parts[0] ? parts[0].trim() : '';
        const lng = parts[1] ? parts[1].trim() : '';

        const page = state.findPageById('page-7');
        if (page && page.locations && page.locations[idx]) {
            page.locations[idx].lat = lat;
            page.locations[idx].lng = lng;
            state.save();
            state.syncToPreview();
        }
    },

    updateMapPreview(idx) {
        const input = document.getElementById(`map-loc-input-${idx}`);
        const img = document.getElementById(`map-loc-${idx}`);
        if (input && img) {
            img.src = input.value;
            img.classList.toggle('hidden', !input.value);
        }
    },

    // Handle photo upload for Map locations with EXIF extraction
    async handleMapPhotoUpload(input, idx) {
        const file = input.files[0];
        if (!file) return;

        // Show loading state
        const targetInput = document.getElementById(`map-loc-input-${idx}`);
        if (targetInput) {
            targetInput.value = '📷 Reading photo data...';
            targetInput.disabled = true;
        }

        try {
            // 1. Extract EXIF data BEFORE compression (this is crucial!)
            console.log('[MapUpload] Extracting EXIF data from photo...');
            const exifData = await utils.extractExifData(file);

            // 2. Upload the image (with compression) - use existing handler
            await utils.handleMediaUpload(input, `map-loc-input-${idx}`);

            // 3. If EXIF data found, prompt user and auto-fill
            if (exifData) {
                console.log('[MapUpload] EXIF data found:', exifData);

                let message = '📍 Data terdeteksi dari foto!\n\n';
                if (exifData.lat && exifData.lng) {
                    message += `📌 Lokasi: ${exifData.lat.toFixed(6)}, ${exifData.lng.toFixed(6)}\n`;
                }
                if (exifData.date) {
                    message += `📅 Tanggal: ${exifData.date}\n`;
                }
                message += '\nGunakan data ini?';

                // Ask user if they want to use the EXIF data
                if (confirm(message)) {
                    const page = state.findPageById('page-7');
                    if (page && page.locations && page.locations[idx]) {
                        // Auto-fill coordinates
                        if (exifData.lat && exifData.lng) {
                            page.locations[idx].lat = exifData.lat.toFixed(6);
                            page.locations[idx].lng = exifData.lng.toFixed(6);

                            // Update coordinate input field
                            const coordInput = document.getElementById(`map-coords-${idx}`);
                            if (coordInput) {
                                coordInput.value = `${exifData.lat.toFixed(6)}, ${exifData.lng.toFixed(6)}`;
                            }
                        }

                        // Auto-fill date
                        if (exifData.date) {
                            page.locations[idx].date = exifData.date;

                            // Find and update date input - it's inside the dynamic-item
                            const locationItems = document.querySelectorAll('.dynamic-item');
                            if (locationItems[idx]) {
                                const dateInput = locationItems[idx].querySelector('input[type="date"]');
                                if (dateInput) {
                                    dateInput.value = exifData.date;
                                }
                            }
                        }

                        state.save();
                        state.syncToPreview();
                        utils.showNotification('📍 Lokasi & tanggal berhasil diisi dari foto!', 'success');
                    }
                }
            } else {
                console.log('[MapUpload] No EXIF data found in photo');
            }

            // Update preview
            this.updateMapPreview(idx);

        } catch (error) {
            console.error('[MapUpload] Error:', error);
            utils.showNotification('Error uploading photo: ' + error.message, 'error');
            if (targetInput) {
                targetInput.value = '';
                targetInput.disabled = false;
            }
        }
    },

    // ========================================
    // PAGE 8: LETTER
    // ========================================
    renderLetterStep() {
        const pageData = state.findPageById('page-8') || {
            recipient: 'Dearest Love',
            message: '',
            signature: 'Your Favorite Person'
        };

        return `
            <div class="section-header">
                <div class="section-icon !bg-red-100 !text-red-600">
                    <span class="material-symbols-outlined">mail</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_letter_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_letter_desc')}</p>
                </div>
                ${this.createPreviewButton('page-8')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-blue-400">lightbulb</span>
                    <div class="text-xs text-blue-900/80 leading-relaxed">
                        <span class="font-bold block text-blue-900 mb-1 text-sm">💡 ${t('page_letter_tips')}</span>
                        ${t('page_letter_tips_desc')}
                    </div>
                </div>
            </div>

            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_letter_label_title')}</label>
                    <input type="text" class="form-input" value="${pageData.recipient}" 
                        placeholder="Dearest Love"
                        oninput="renderers.updateLetter('recipient', this.value)">
                </div>
                
                <div>
                    <div class="flex justify-between items-center mb-2">
                        <label class="block text-sm font-bold text-gray-700">${t('page_letter_label_content')}</label>
                        <div class="emoji-btn-wrapper">
                            <button type="button" onclick="renderers.toggleEmojiPicker(event)" 
                                class="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-colors">
                                <span class="material-symbols-outlined text-base">mood</span>
                                ${t('btn_add_emoji') || 'Add Emoji'}
                            </button>
                            <div id="emoji-picker" class="emoji-picker-mini hidden">
                                ${['❤️', '💖', '😍', '🌹', '✨', '🌸', '🦋', '💍', '💌', '🥰', '🫂', '🎀', '🧸', '🍷', '🕯️', '🌙', '☀️', '🌈', '🍭', '🍓', '🍑', '🍒', '🎈', '🎁', '🔥', '💎', '🕊️', '🧸', '🎹', '🎻'].map(e => `
                                    <span class="emoji-item" onclick="renderers.addEmoji('${e}')">${e}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                    <div id="letter-editor">${pageData.message || ''}</div>
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_letter_label_footer')}</label>
                    <input type="text" class="form-input" value="${pageData.signature}" 
                        placeholder="Your Favorite Person"
                        oninput="renderers.updateLetter('signature', this.value)">
                </div>

                <div class="pt-4 border-t border-gray-100">
                    <h3 class="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span class="material-symbols-outlined text-rose-500 text-lg">auto_awesome</span>
                        Decorations & Branding
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">${t('page_letter_label_polaroid_cap')}</label>
                            <input type="text" class="form-input text-sm" 
                                value="${pageData.polaroidCaption || 'Us, 2024 ♡'}" 
                                placeholder="Us, 2024 ♡"
                                oninput="renderers.updateLetter('polaroidCaption', this.value)">
                        </div>

                        <div class="md:col-span-2">
                            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">${t('page_letter_label_polaroid')}</label>
                            <div class="flex gap-4 items-center">
                                <div class="relative group">
                                    <img src="${pageData.polaroidSrc || ''}" 
                                        id="letter-polaroid-preview"
                                        class="w-24 h-32 object-cover bg-gray-100 rounded-lg shadow-sm ${pageData.polaroidSrc ? '' : 'hidden'}" 
                                        onerror="this.classList.add('hidden'); document.getElementById('letter-polaroid-placeholder').classList.remove('hidden')">
                                    <div id="letter-polaroid-placeholder" class="w-24 h-32 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center ${pageData.polaroidSrc ? 'hidden' : ''}">
                                        <span class="material-symbols-outlined text-gray-300 text-3xl">image</span>
                                        <span class="text-[10px] text-gray-400 mt-1 font-bold">No Photo</span>
                                    </div>
                                </div>
                                <div class="flex-1 space-y-3">
                                    <div class="flex flex-col gap-2">
                                        <div class="flex gap-2">
                                            <input type="text" id="letter-polaroid-input" class="form-input text-xs font-mono flex-1" 
                                                value="${pageData.polaroidSrc || ''}" 
                                                placeholder="assets/us.jpg"
                                                oninput="renderers.updateLetter('polaroidSrc', this.value); renderers.updateLetterPolaroidPreview(this.value)">
                                            
                                            <button type="button" onclick="this.nextElementSibling.click()" class="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm">
                                                <span class="material-symbols-outlined text-sm">cloud_upload</span>
                                                Upload
                                            </button>
                                            <input type="file" class="hidden" accept="image/*" data-target="letter-polaroid-input" onchange="utils.handleMediaUpload(this, 'letter-polaroid-input')">
                                        </div>
                                        <p class="text-[10px] text-gray-400 italic">Recommended: Square or 3:4 aspect ratio. Leave empty to use the romantic silhouette.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    // ✅ NEW: Post-render logic handler
    initStepLogic(stepId) {
        if (stepId === 'page-8') {
            this.initQuill();
        }
    },

    // ✅ NEW: Initialize Quill Editor
    initQuill() {
        const container = document.getElementById('letter-editor');
        if (!container || typeof Quill === 'undefined') return;

        // Prevent double init
        if (container.classList.contains('ql-container')) return;

        this.quill = new Quill('#letter-editor', {
            theme: 'snow',
            placeholder: 'Write your heartfelt message here...',
            modules: {
                toolbar: [
                    ['bold', 'italic'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    ['clean']
                ]
            }
        });

        // Sync with state
        this.quill.on('text-change', () => {
            const html = this.quill.root.innerHTML;
            // Only update if content changed to avoid cursor jumps if re-rendered
            this.updateLetter('message', html);
        });
    },

    // ✅ NEW: Emoji Picker Logic
    toggleEmojiPicker(e) {
        e.stopPropagation();
        const picker = document.getElementById('emoji-picker');
        if (picker) {
            picker.classList.toggle('hidden');

            // Close picker when clicking outside
            const closePicker = (event) => {
                if (!picker.contains(event.target)) {
                    picker.classList.add('hidden');
                    document.removeEventListener('click', closePicker);
                }
            };

            if (!picker.classList.contains('hidden')) {
                document.addEventListener('click', closePicker);
            }
        }
    },

    addEmoji(emoji) {
        if (this.quill) {
            const range = this.quill.getSelection(true);
            this.quill.insertText(range.index, emoji);
            this.quill.setSelection(range.index + emoji.length);
        }
    },

    updateLetter(key, value) {
        state.updatePageData('page-8', { [key]: value });
    },

    updateLetterPolaroidPreview(value) {
        const preview = document.getElementById('letter-polaroid-preview');
        const placeholder = document.getElementById('letter-polaroid-placeholder');
        if (preview && placeholder) {
            if (value) {
                preview.src = value;
                preview.classList.remove('hidden');
                placeholder.classList.add('hidden');
            } else {
                preview.classList.add('hidden');
                placeholder.classList.remove('hidden');
            }
        }
    },

    // ========================================
    // PAGE 9: LOCK
    // ========================================
    renderLockStep() {
        const pageData = state.findPageById('page-9') || {
            initials: 'A + B',
            instruction: 'Click to lock our love forever...',
            finalMessage: 'Safely locked in my heart. Always.'
        };

        return `
            <div class="section-header">
                <div class="section-icon !bg-purple-100 !text-purple-600">
                    <span class="material-symbols-outlined">lock_person</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_lock_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_lock_desc')}</p>
                </div>
                ${this.createPreviewButton('page-9')}
            </div>

            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_lock_label_title')}</label>
                    <input type="text" class="form-input text-center text-2xl" value="${pageData.initials}" 
                        placeholder="A + B"
                        oninput="renderers.updateLock('initials', this.value)">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_lock_label_hint')}</label>
                    <input type="text" class="form-input" value="${pageData.instruction}" 
                        placeholder="Click to lock our love forever..."
                        oninput="renderers.updateLock('instruction', this.value)">
                </div>
                
                <div>
                    <label class="block text-sm font-bold text-gray-700 mb-2">${t('page_lock_label_success')}</label>
                    <textarea class="form-input" rows="4" 
                        placeholder="Safely locked in my heart. Always."
                        oninput="renderers.updateLock('finalMessage', this.value)">${pageData.finalMessage}</textarea>
                </div>
            </div>
        `;
    },

    updateLock(key, value) {
        state.updatePageData('page-9', { [key]: value });
    },

    // ========================================
    // PAGE 10: INFINITY SCROLL
    // ========================================
    renderInfinityStep() {
        const pageData = state.findPageById('page-10') || {
            headerTitle: 'I love you because...',
            headerSubtitle: 'An endless collection of reasons',
            reasons_generic: [],
            reasons_personal: [],
            reasons_poetic: [],
            photos: []
        };

        return `
            <div class="section-header">
                <div class="section-icon !bg-pink-100 !text-pink-600">
                    <span class="material-symbols-outlined">all_inclusive</span>
                </div>
                <div class="flex-1">
                    <h2 class="text-2xl font-bold text-gray-900">${t('page_infinity_title')}</h2>
                    <p class="text-sm text-gray-500 mt-1">${t('page_infinity_desc')}</p>
                </div>
                ${this.createPreviewButton('page-10')}
            </div>

            <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mb-6">
                <div class="flex gap-3">
                    <span class="material-symbols-outlined text-blue-400">lightbulb</span>
                    <div class="text-xs text-blue-900/80 leading-relaxed">
                        <span class="font-bold block text-blue-900 mb-1 text-sm">💡 ${t('page_infinity_tips')}</span>
                        ${t('page_infinity_tips_desc')}
                    </div>
                </div>
            </div>

            <div class="space-y-6">

                <!-- Generic Reasons -->
                <details class="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 group overflow-hidden" open>
                    <summary class="flex justify-between items-center p-4 cursor-pointer hover:bg-white/50 transition-colors list-none">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-blue-500 group-open:rotate-90 transition-transform">chevron_right</span>
                            <label class="block text-sm font-bold text-gray-900 cursor-pointer">${t('page_infinity_label_generic')}</label>
                        </div>
                        <div class="flex gap-2" onclick="event.stopPropagation()">
                             <button type="button" class="text-[10px] bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-colors font-bold"
                                onclick="renderers.fillInfinityPresets('reasons_generic', 'id')">
                                Isi (ID)
                            </button>
                             <button type="button" class="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded-md hover:bg-indigo-600 transition-colors font-bold"
                                onclick="renderers.fillInfinityPresets('reasons_generic', 'en')">
                                Fill (EN)
                            </button>
                        </div>
                    </summary>
                    <div class="p-4 pt-0">
                        <div id="infinity-generic-list" class="space-y-2 mb-3">
                            ${this.renderInfinityReasonsList(pageData.reasons_generic, 'reasons_generic')}
                        </div>
                        <button type="button" class="btn-add !py-2 !text-xs" onclick="renderers.addInfinityReason('reasons_generic')">
                            <span class="material-symbols-outlined text-sm">add</span>
                            ${t('page_infinity_btn_add')}
                        </button>
                    </div>
                </details>

                <!-- Personal Reasons -->
                <details class="bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200 group overflow-hidden">
                    <summary class="flex justify-between items-center p-4 cursor-pointer hover:bg-white/50 transition-colors list-none">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-pink-500 group-open:rotate-90 transition-transform">chevron_right</span>
                            <label class="block text-sm font-bold text-gray-900 cursor-pointer">${t('page_infinity_label_personal')}</label>
                        </div>
                        <div class="flex gap-2" onclick="event.stopPropagation()">
                            <button type="button" class="text-[10px] bg-pink-500 text-white px-2 py-1 rounded-md hover:bg-pink-600 transition-colors font-bold"
                                onclick="renderers.fillInfinityPresets('reasons_personal', 'id')">
                                Isi (ID)
                            </button>
                            <button type="button" class="text-[10px] bg-rose-500 text-white px-2 py-1 rounded-md hover:bg-rose-600 transition-colors font-bold"
                                onclick="renderers.fillInfinityPresets('reasons_personal', 'en')">
                                Fill (EN)
                            </button>
                        </div>
                    </summary>
                    <div class="p-4 pt-0">
                        <div id="infinity-personal-list" class="space-y-2 mb-3">
                            ${this.renderInfinityReasonsList(pageData.reasons_personal, 'reasons_personal')}
                        </div>
                        <button type="button" class="btn-add !py-2 !text-xs" onclick="renderers.addInfinityReason('reasons_personal')">
                            <span class="material-symbols-outlined text-sm">add</span>
                            ${t('page_music_btn_add')}
                        </button>
                    </div>
                </details>

                <!-- Poetic Reasons -->
                <details class="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-200 group overflow-hidden">
                    <summary class="flex justify-between items-center p-4 cursor-pointer hover:bg-white/50 transition-colors list-none">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-purple-500 group-open:rotate-90 transition-transform">chevron_right</span>
                            <label class="block text-sm font-bold text-gray-900 cursor-pointer">${t('page_infinity_label_poetic')}</label>
                        </div>
                        <div class="flex gap-2" onclick="event.stopPropagation()">
                            <button type="button" class="text-[10px] bg-purple-500 text-white px-2 py-1 rounded-md hover:bg-purple-600 transition-colors font-bold"
                                onclick="renderers.fillInfinityPresets('reasons_poetic', 'id')">
                                Isi (ID)
                            </button>
                            <button type="button" class="text-[10px] bg-indigo-500 text-white px-2 py-1 rounded-md hover:bg-indigo-600 transition-colors font-bold"
                                onclick="renderers.fillInfinityPresets('reasons_poetic', 'en')">
                                Fill (EN)
                            </button>
                        </div>
                    </summary>
                    <div class="p-4 pt-0">
                        <div id="infinity-poetic-list" class="space-y-2 mb-3">
                            ${this.renderInfinityReasonsList(pageData.reasons_poetic, 'reasons_poetic')}
                        </div>
                        <button type="button" class="btn-add !py-2 !text-xs" onclick="renderers.addInfinityReason('reasons_poetic')">
                            <span class="material-symbols-outlined text-sm">add</span>
                            ${t('page_infinity_btn_add')}
                        </button>
                    </div>
                </details>

                <!-- Photos Section -->
                <div class="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 border border-amber-200">
                    <div class="mb-3">
                        <label class="block text-sm font-bold text-gray-900 mb-2">${t('page_gallery_title')}</label>
                        <p class="text-xs text-gray-600">${t('page_infinity_desc')}</p>
                    </div>
                    <div id="infinity-photos-list" class="space-y-3">
                        ${this.renderInfinityPhotosList(pageData.photos)}
                    </div>
                    <button type="button" class="btn-add" onclick="renderers.addInfinityPhoto()">
                        <span class="material-symbols-outlined">add</span>
                        ${t('page_gallery_btn_add')}
                    </button>
                </div>

                <!-- Video Memories Section -->
                <div class="bg-gradient-to-r from-rose-50 to-red-50 rounded-xl p-4 border border-rose-200">
                    <div class="mb-3 flex items-center justify-between">
                        <div>
                            <label class="block text-sm font-bold text-gray-900 mb-1">Video Clips</label>
                            <p class="text-xs text-gray-600">Add videos that appear at specific milestones.</p>
                        </div>
                        <span class="material-symbols-outlined text-rose-500">video_library</span>
                    </div>
                    <div id="infinity-videos-list" class="space-y-3">
                        ${this.renderInfinityVideosList(pageData.videoMemories)}
                    </div>
                    <button type="button" class="btn-add" onclick="renderers.addInfinityVideo()">
                        <span class="material-symbols-outlined">add_video_call</span>
                        ${t('page_infinity_btn_add_video')}
                    </button>
                </div>

                <!-- Special Music Section -->
                <div class="bg-gradient-to-r from-violet-50 to-fuchsia-50 rounded-xl p-4 border border-violet-200">
                    <div class="flex gap-3 items-start mb-4">
                        <span class="material-symbols-outlined text-violet-500 text-2xl">music_note</span>
                        <div>
                            <label class="block text-sm font-bold text-gray-900">${t('page_infinity_tips_music')}</label>
                            <div class="mt-1 text-xs text-violet-900/80 bg-white/50 p-2 rounded-lg border border-violet-100">
                                ${t('page_infinity_tips_music_desc')}
                            </div>
                        </div>
                    </div>
                    <div class="space-y-3">
                        <div class="flex gap-2 items-center">
                            <input type="text" id="infinity-music-src" class="form-input text-xs font-mono flex-1" 
                                value="${pageData.music?.audioSrc || ''}" 
                                placeholder="https://example.com/song.mp3"
                                oninput="renderers.updateInfinityMusic('audioSrc', this.value)">
                            <label class="cursor-pointer bg-violet-500 hover:bg-violet-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                                <span class="material-symbols-outlined text-base">audio_file</span>
                                <input type="file" class="hidden" accept="audio/*" data-target="infinity-music-src" onchange="utils.handleMediaUpload(this, 'infinity-music-src')">
                            </label>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <input type="text" class="form-input text-sm" 
                                value="${pageData.music?.songTitle || ''}" 
                                placeholder="${t('page_music_label_song')}"
                                oninput="renderers.updateInfinityMusic('songTitle', this.value)">
                            <input type="text" class="form-input text-sm" 
                                value="${pageData.music?.artist || ''}" 
                                placeholder="${t('page_music_label_artist')}"
                                oninput="renderers.updateInfinityMusic('artist', this.value)">
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    updateInfinity(field, value) {
        const page = state.findPageById('page-10');
        if (page) {
            page[field] = value;
            state.save();
            state.syncToPreview();
        }
    },

    renderInfinityReasonsList(reasons, listType) {
        if (!reasons || reasons.length === 0) return '';

        return reasons.map((reason, idx) => {
            const bodyContent = `
                <div class="pt-3">
                    <input type="text" class="form-input text-sm" value="${reason}" 
                        placeholder="...a reason why"
                        oninput="renderers.updateInfinityReason('${listType}', ${idx}, this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Reason'">
                </div>
            `;
            return this.renderCollapsible(idx, reason || 'Untitled Reason', 'Reason Why', bodyContent, `renderers.removeInfinityReason('${listType}', ${idx})`);
        }).join('');
    },

    renderInfinityPhotosList(photos) {
        if (!photos || photos.length === 0) return '';

        return photos.map((photo, idx) => {
            const bodyContent = `
                <div class="space-y-2 pt-3">
                    <div class="flex gap-2 items-center">
                        <img src="${photo.src || ''}" 
                            id="inf-photo-${idx}"
                            class="img-preview-mini w-16 h-16 object-cover rounded-lg shadow-sm ${photo.src ? '' : 'hidden'}" 
                            onerror="this.classList.add('hidden')">
                        <input type="text" id="inf-photo-input-${idx}" class="form-input text-xs font-mono flex-1" 
                            value="${photo.src || ''}" 
                            placeholder="assets/photo.jpg"
                            oninput="renderers.updateInfinityPhoto(${idx}, 'src', this.value); renderers.updateInfinityPhotoPreview(${idx})">
                        <label class="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg flex items-center gap-1 transition-colors shadow-sm">
                            <span class="material-symbols-outlined text-base">image</span>
                            <input type="file" class="hidden" accept="image/*" data-target="inf-photo-input-${idx}" onchange="utils.handleMediaUpload(this, 'inf-photo-input-${idx}')">
                        </label>
                    </div>
                    <input type="text" class="form-input text-sm" value="${photo.caption || ''}" 
                        placeholder="Short caption..."
                        oninput="renderers.updateInfinityPhoto(${idx}, 'caption', this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Reason'">
                </div>
            `;
            return this.renderCollapsible(idx, photo.caption || 'Untitled Reason', 'Photo with Reason', bodyContent, `renderers.removeInfinityPhoto(${idx})`);
        }).join('');
    },

    updateInfinity(key, value) {
        state.updatePageData('page-10', { [key]: value });
    },

    updateInfinityMusic(key, value) {
        const page = state.findPageById('page-10');
        if (!page.music) page.music = {};
        page.music[key] = value;
        state.save();
        state.syncToPreview();
    },

    addInfinityReason(listType) {
        const page = state.findPageById('page-10');
        if (!page[listType]) page[listType] = [];
        page[listType].push('');
        app.renderCurrentStep();
        state.save();
    },

    removeInfinityReason(listType, idx) {
        const page = state.findPageById('page-10');
        if (page && page[listType]) {
            page[listType].splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateInfinityReason(listType, idx, value) {
        const page = state.findPageById('page-10');
        if (page && page[listType]) {
            page[listType][idx] = value;
            state.save();
            state.syncToPreview();
        }
    },

    fillInfinityPresets(listType, lang = 'en') {
        const PRESETS = {
            en: {
                reasons_generic: [
                    "...Your smile lights up my world", "...You make me laugh like no one else", "...Your kindness inspires me",
                    "...You are my safe space", "...The way you look at me", "...You support my wildest dreams",
                    "...Your hugs heal everything", "...You make the ordinary feel extraordinary", "...You are my best friend",
                    "...I love your passion for life", "...You make me want to be a better person", "...Your voice is my favorite sound",
                    "...You always know how to cheer me up", "...I love our late-night talks", "...You are my home"
                ],
                reasons_personal: [
                    "...of that rainy day when we first met", "...you still remember my coffee order", "...you dance with me in the kitchen",
                    "...of our midnight grocery runs", "...you laugh at all my bad jokes", "...we got lost together on that road trip",
                    "...you cry at the same movies I do", "...of our secret language", "...you let me steal your hoodies",
                    "...of that time we stayed up until sunrise talking", "...you know when I need space and when I need a hug"
                ],
                reasons_poetic: [
                    "...you are the melody to my song", "...my heart skips a beat when you're near", "...you are the answer to questions I never knew I had",
                    "...loving you feels like coming home", "...you are the favorite chapter", "...in your eyes, I see forever",
                    "...you are the reason I believe in magic", "...every moment with you is a treasure", "...you are my yesterday, today, and tomorrow"
                ]
            },
            id: {
                reasons_generic: [
                    "...Senyummu menerangi duniaku", "...Kamu bikin aku ketawa lepas", "...Kebaikanmu menginspirasiku",
                    "...Kamu adalah tempat ternyamanku", "...Cara kamu menatapku", "...Kamu dukung mimpi-mimpiku",
                    "...Pelukanmu menyembuhkan segalanya", "...Kamu bikin hal biasa jadi luar biasa", "...Kamu sahabat terbaikku",
                    "...Aku suka semangat hidupmu", "...Kamu bikin aku ingin jadi lebih baik", "...Suaramu adalah suara favoritku",
                    "...Kamu selalu tau cara ngehibur aku", "...Aku suka obrolan tengah malam kita", "...Kamu adalah rumahku"
                ],
                reasons_personal: [
                    "...ingat hari hujan pas kita pertama ketemu", "...kamu masih ingat pesanan kopiku", "...kamu berdansa denganku di dapur",
                    "...jalan-jalan tengah malam kita cari makan", "...kamu ketawa denger jokes recehku", "...kita nyasar bareng pas road trip",
                    "...kamu nangis nonton film sedih bareng aku", "...bahasa rahasia kita berdua", "...kamu bolehin aku pake jaketmu",
                    "...waktu kita begadang ngobrol sampe pagi", "...kamu tau kapan aku butuh sendiri dan kapan butuh peluk"
                ],
                reasons_poetic: [
                    "...kamu adalah melodi dalam laguku", "...jantungku berdebar saat kamu dekat", "...kamu jawaban dari doa yang tak terucap",
                    "...mencintaimu rasanya seperti pulang ke rumah", "...kamu adalah bab favorit dalam hidupku", "...di matamu, aku melihat keabadian",
                    "...kamu alasanku percaya keajaiban", "...setiap detik bersamamu adalah harta karun", "...kamu adalah kemarin, hari ini, dan esokku"
                ]
            }
        };

        const page = state.findPageById('page-10');
        if (!page[listType]) page[listType] = [];

        // Get presets for requested language, default to EN if not found
        const langPresets = PRESETS[lang] || PRESETS['en'];
        const listPresets = langPresets[listType] || langPresets['reasons_generic'];

        // Filter out existing
        const availablePresets = listPresets.filter(p => !page[listType].includes(p));

        // Add up to 5
        const toAdd = availablePresets.slice(0, 5);

        if (toAdd.length === 0) {
            utils.showNotification('All presets for this language added!', 'info');
            return;
        }

        page[listType].push(...toAdd);
        app.renderCurrentStep();
        state.save();
        state.syncToPreview();

        utils.showNotification(`Added ${toAdd.length} presets (${lang.toUpperCase()})!`, 'success');
    },

    addInfinityPhoto() {
        const page = state.findPageById('page-10');
        if (!page.photos) page.photos = [];
        page.photos.push({ src: '', caption: '' });
        app.renderCurrentStep();
        state.save();
    },

    removeInfinityPhoto(idx) {
        const page = state.findPageById('page-10');
        if (page && page.photos) {
            page.photos.splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateInfinityPhoto(idx, key, value) {
        const page = state.findPageById('page-10');
        if (page && page.photos && page.photos[idx]) {
            page.photos[idx][key] = value;
            state.save();
            state.syncToPreview();
        }
    },

    updateInfinityPhotoPreview(idx) {
        const input = document.getElementById(`inf-photo-input-${idx}`);
        const img = document.getElementById(`inf-photo-${idx}`);
        if (input && img) {
            img.src = input.value;
            img.classList.toggle('hidden', !input.value);
        }
    },

    renderInfinityVideosList(videos) {
        if (!videos || videos.length === 0) return '';

        return videos.map((video, idx) => {
            const bodyContent = `
                <div class="space-y-3 pt-3">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">${t('page_infinity_video_label')}</label>
                        <div class="flex gap-2">
                            <input type="text" id="inf-video-input-${idx}" class="form-input text-xs font-mono flex-1" 
                                value="${video.url || ''}" 
                                placeholder="https://example.com/video.mp4"
                                oninput="renderers.updateInfinityVideo(${idx}, 'url', this.value)">
                            <label class="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white px-3 py-2 rounded-lg flex items-center transition-colors shadow-sm">
                                <span class="material-symbols-outlined text-base">video_file</span>
                                <input type="file" class="hidden" accept="video/*" 
                                    onchange="utils.handleMediaUpload(this, 'inf-video-input-${idx}')">
                            </label>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">${t('page_gallery_label_caption')}</label>
                            <input type="text" class="form-input text-sm" value="${video.caption || ''}" 
                                placeholder="Caption..."
                                oninput="renderers.updateInfinityVideo(${idx}, 'caption', this.value); this.closest('.dynamic-item').querySelector('.item-summary-title').textContent = this.value || 'Untitled Video'">
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1">${t('page_infinity_video_milestone')}</label>
                            <input type="number" class="form-input text-sm" value="${video.milestone || 10}" 
                                oninput="renderers.updateInfinityVideo(${idx}, 'milestone', parseInt(this.value)); this.closest('.dynamic-item').querySelector('.item-summary-desc').textContent = 'Milestone: ' + this.value">
                        </div>
                    </div>
                </div>
            `;
            return this.renderCollapsible(idx, video.caption || 'Untitled Video', `Milestone: ${video.milestone}`, bodyContent, `renderers.removeInfinityVideo(${idx})`);
        }).join('');
    },

    addInfinityVideo() {
        const page = state.findPageById('page-10');
        if (!page.videoMemories) page.videoMemories = [];
        page.videoMemories.push({ url: '', caption: '', milestone: (page.videoMemories.length + 1) * 25 });
        app.renderCurrentStep();
        state.save();
    },

    removeInfinityVideo(idx) {
        const page = state.findPageById('page-10');
        if (page && page.videoMemories) {
            page.videoMemories.splice(idx, 1);
            app.renderCurrentStep();
            state.save();
            state.syncToPreview();
        }
    },

    updateInfinityVideo(idx, key, value) {
        const page = state.findPageById('page-10');
        if (page && page.videoMemories && page.videoMemories[idx]) {
            // Auto-convert GDrive links if the key is 'url'
            if (key === 'url') {
                value = utils.convertGDriveLink(value);
                // Also update the input field if it exists
                const input = document.getElementById(`inf-video-input-${idx}`);
                if (input) input.value = value;
            }

            page.videoMemories[idx][key] = value;
            state.save();
            state.syncToPreview();
        }
    },

    // ✅ NEW: Update Infinity Scroll Music
    updateInfinityMusic(key, value) {
        const page = state.findPageById('page-10');
        if (!page) return;

        // Initialize music object if it doesn't exist
        if (!page.music) {
            page.music = { audioSrc: '', songTitle: '', artist: '' };
        }

        page.music[key] = value;
        console.log(`[Admin] Infinity music ${key} updated:`, value);

        state.save();
        state.syncToPreview();
    }
};

// Make renderers globally available
if (typeof window !== 'undefined') {
    window.renderers = renderers;
}
