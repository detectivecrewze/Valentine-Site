// Core Architecture
const bgMusic = new Audio(); // Global Audio Object
let currentSongIndex = 0;
let mapInstance = null;
let revealedMemories = []; // Persistent state for gallery
const printerSfx = new Audio(); // Will be initialized with Blob
const scratchSfx = new Audio(); // Will be initialized with Blob
scratchSfx.volume = 0.4;

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

document.addEventListener('DOMContentLoaded', () => {
    updateSEO(); // Update SEO/OG tags
    applyTheme(); // Apply theme first
    initParticles(); // Initialize background atmosphere

    // Initialize SFX with Blob Shield
    fetchMediaBlob('assets/sfx1.dat').then(blobUrl => {
        printerSfx.src = blobUrl;
        printerSfx.loop = true;
        scratchSfx.src = blobUrl;
    });

    loadDynamicContent();
    initLogin();
    initCountdown(); // Start the countdown
    initMusicPlayer();
    initLetterPage();

    syncPageVisibility(); // Sync visibility based on config

    // Live Preview Engine: Listen for updates
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_CONFIG') {
            try {
                const newConfig = event.data.config;
                console.log("[Preview] UPDATE_CONFIG received for countdown:",
                    newConfig.countdown ? newConfig.countdown.targetDate : "N/A");

                // Shallow merge for first-level keys
                for (let key in newConfig) {
                    if (typeof newConfig[key] === 'object' && newConfig[key] !== null && !Array.isArray(newConfig[key])) {
                        CONFIG[key] = { ...CONFIG[key], ...newConfig[key] };
                    } else {
                        CONFIG[key] = newConfig[key];
                    }
                }

                // CRITICAL FIX: Clear music loading cache when music data changes
                if (newConfig.music) {
                    musicLoadingPromise = null;
                    loadingTargetIndex = -1;
                }

                // Re-initialize relevant components
                if (typeof applyTheme === 'function') applyTheme();
                if (typeof updateSEO === 'function') updateSEO();
                if (typeof loadDynamicContent === 'function') loadDynamicContent();
                if (typeof initCountdown === 'function') initCountdown();

                syncPageVisibility(); // Update visibility after config change

                // Refresh current page if needed
                const activePage = document.querySelector('.page:not(.hidden)');
                if (activePage) {
                    const pageId = activePage.id;
                    if (pageId === 'page-3' && typeof loadSong === 'function') loadSong(currentSongIndex);
                    if (pageId === 'page-5' && typeof loadQuiz === 'function') loadQuiz();
                    if (pageId === 'page-6' && typeof loadGallery === 'function') loadGallery();
                    if (pageId === 'page-7' && typeof initMap === 'function') initMap();
                    if (pageId === 'page-8' && typeof resetLetterPage === 'function') resetLetterPage();
                }
            } catch (err) {
                console.error("[Preview] Update failed:", err);
            }
        }

        // Handle Manual Navigation from Admin
        if (event.data && event.data.type === 'NAVIGATE_TO_PAGE') {
            const targetId = event.data.pageId;
            if (!targetId) return;

            const activePage = document.querySelector('.page:not(.hidden)');
            const currentId = activePage ? activePage.id : null;

            if (currentId !== targetId && typeof MapsTo === 'function') {
                console.log(`🚀 Manual Sync: Navigating to ${targetId}`);
                MapsTo(currentId, targetId);
            }
        }
    });

    // Notify parent that we are ready
    if (window.self !== window.top) {
        window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    }
});

// Update SEO/OG Settings
function updateSEO() {
    if (CONFIG.seo) {
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
}

// Particle System
function initParticles() {
    const container = document.getElementById('particle-container');
    if (!container || !CONFIG.theme || !CONFIG.theme.particles || CONFIG.theme.particles === 'none') return;

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
    if (CONFIG.theme) {
        // Apply background color
        if (CONFIG.theme.backgroundColor) {
            document.body.style.backgroundColor = CONFIG.theme.backgroundColor;
        }

        // Apply custom background image if specified (overrides CSS default)
        if (CONFIG.theme.backgroundImage && CONFIG.theme.backgroundImage.trim() !== '') {
            document.body.style.backgroundImage = `url('${CONFIG.theme.backgroundImage}')`;
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
    }
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
    // Check if target page is enabled
    if (!isPageEnabled(toId)) {
        console.warn(`⚠️ Page ${toId} is disabled, finding alternative...`);

        const currentConf = getPageConfig(fromId);
        const targetConf = getPageConfig(toId);

        const currentOrder = currentConf ? currentConf.order : 0;
        const targetOrder = targetConf ? targetConf.order : 0;

        // Determine direction based on raw configuration order
        if (targetOrder > currentOrder) {
            toId = getNextPage(fromId);
        } else {
            toId = getPreviousPage(fromId);
        }

        if (!toId) {
            console.warn('❌ No enabled page available');
            return;
        }

        console.log(`✅ Navigating to ${toId} instead`);
    }

    const fromPage = document.getElementById(fromId);
    const toPage = document.getElementById(toId);

    if (fromPage && toPage) {
        // Update Navigation UI
        updateNavigationUI(toId);

        // Start 3D Flip Animation
        fromPage.classList.add('page-flip-exit');
        toPage.classList.remove('hidden');
        toPage.classList.add('page-flip-enter');

        // Cleanup fromPage specific state
        if (fromId === 'page-4') {
            const printerComp = document.getElementById('printer-comp');
            const printerDevice = document.getElementById('printer-device');
            const printerLed = document.getElementById('printer-led');

            if (printerComp) printerComp.classList.remove('is-printing');
            if (printerDevice) printerDevice.classList.remove('printer-vibrating');
            if (printerLed) printerLed.classList.remove('led-printing');

            printerSfx.pause();
            printerSfx.currentTime = 0;
        }

        // Finalize transition after animation duration
        setTimeout(() => {
            fromPage.classList.add('hidden');
            fromPage.classList.remove('page-flip-exit');
            toPage.classList.remove('page-flip-enter');
        }, 2500);
    } else {
        // Fallback for missing elements or initial entry
        if (fromPage) fromPage.classList.add('hidden');
        if (toPage) {
            toPage.classList.remove('hidden');
            toPage.classList.add('animate-fade-in-up');
            updateNavigationUI(toId);
        }
    }

    if (toPage) {
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
                        if (printerLed) printerLed.classList.remove('led-printing');
                    }, 6000);
                }, 300);
            }
        } else if (toId === 'page-3') {
            loadSong(currentSongIndex).then(() => {
                setTimeout(() => {
                    playMusic();
                }, 500);
            });
        } else if (toId === 'page-5') {
            if (typeof loadQuiz === 'function') loadQuiz();
        } else if (toId === 'page-6') {
            if (typeof loadGallery === 'function') loadGallery();
        } else if (toId === 'page-7') {
            if (typeof initMap === 'function') initMap();
        } else if (toId === 'page-8') {
            if (typeof resetLetterPage === 'function') resetLetterPage();
        } else if (toId === 'page-9') {
            if (typeof initInvitationPage === 'function') initInvitationPage();
        } else if (toId === 'page-10') {
            if (typeof initFinalePage === 'function') initFinalePage();
        }
    }
}
// --- Navigation UI & Swipe Support ---

function updatePageIndicator(pageId) {
    const pageIndicator = document.getElementById('global-page-indicator');
    const pageText = document.getElementById('page-indicator-text');

    if (!pageId) return;

    // Respect configuration
    const showIndicator = CONFIG.navigation ? CONFIG.navigation.showPageIndicator !== false : true;

    // Get current page number among enabled pages
    const currentNum = getCurrentPageNumber(pageId);
    const totalNum = getTotalEnabledPages();

    // Hide indicator on first page or if disabled in config
    if (currentNum === 1 || !showIndicator) {
        if (pageIndicator) {
            pageIndicator.classList.remove('opacity-100');
            pageIndicator.classList.add('opacity-0');
        }
    } else {
        if (pageIndicator) {
            pageIndicator.classList.remove('opacity-0');
            pageIndicator.classList.add('opacity-100');
        }
    }

    if (pageText) {
        pageText.textContent = `${currentNum}/${totalNum}`;
    }
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
    // Page 1: Login
    const p1Subtitle = document.getElementById('p1-subtitle');
    const p1Title = document.getElementById('p1-title');
    const p1Instruction = document.getElementById('p1-instruction');
    const loginInput = document.getElementById('login-input');

    if (p1Subtitle) p1Subtitle.textContent = CONFIG.login.collectionText;
    if (p1Title) p1Title.textContent = CONFIG.login.title;
    if (p1Instruction) p1Instruction.textContent = CONFIG.login.instruction;
    if (loginInput) loginInput.placeholder = CONFIG.login.placeholder;

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
        // Lyrics will be handled by loadSong() to ensure typewriter effect works correctly
    }

    // Page 2: Wrapped
    if (CONFIG.wrapped) {
        // Elements for Wrapped Page
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
        if (minutesEl) minutesEl.textContent = CONFIG.wrapped.HoursTogether;
        if (vibeEl) vibeEl.textContent = CONFIG.wrapped.vibe;

        if (wrappedImg) {
            wrappedImg.src = CONFIG.wrapped.imageSrc;
            wrappedImg.onerror = function () {
                // Fallback if Imgur fails or 403s
                this.src = "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=400&auto=format&fit=crop";
                console.warn("Wrapped image failed to load, using fallback.");
            };
        }

        if (topPlacesList && CONFIG.wrapped.topPlaces) {
            topPlacesList.innerHTML = CONFIG.wrapped.topPlaces.map(place => `<li>${place}</li>`).join('');
        }
        if (coreMemoriesList && CONFIG.wrapped.coreMemories) {
            coreMemoriesList.innerHTML = CONFIG.wrapped.coreMemories.map(mem => `<li>${mem}</li>`).join('');
        }

    }

    // Page 3: Greeting Card
    if (CONFIG.greeting) {
        const p3Title = document.getElementById('p3-title');
        const p3Message = document.getElementById('p3-message');
        const p3Image = document.getElementById('p3-image');
        const p3Signature = document.getElementById('p3-signature');
        const p3Footer = document.getElementById('p3-footer');

        if (p3Title) p3Title.textContent = CONFIG.greeting.title;
        if (p3Message) p3Message.textContent = CONFIG.greeting.message;
        if (p3Image) p3Image.src = CONFIG.greeting.imageSrc;
        if (p3Signature) p3Signature.textContent = CONFIG.greeting.signature || "With Love";
        if (p3Footer) p3Footer.textContent = CONFIG.greeting.footerText;
    }

    // Page 7: Map
    if (CONFIG.map) {
        const mapTitle = document.getElementById('map-title');
        const mapDesc = document.getElementById('map-description');

        if (mapTitle && CONFIG.map.title) mapTitle.textContent = CONFIG.map.title;
        if (mapDesc && CONFIG.map.description) mapDesc.textContent = CONFIG.map.description;
    }

    // Page 8: Letter
    if (CONFIG.letter) {
        const recipientEl = document.getElementById('letter-recipient');
        const bodyEl = document.getElementById('letter-body');
        const signatureEl = document.getElementById('letter-signature');

        if (recipientEl) {
            const name = CONFIG.letter.recipientName;
            const greeting = name.toLowerCase().includes('dearest') ? name : `Dearest ${name}`;
            recipientEl.textContent = `${greeting},`;
        }
        if (signatureEl) signatureEl.textContent = ''; // Clear for typewriter

        if (bodyEl) {
            bodyEl.innerHTML = ''; // Keep empty for typewriter effect
        }
    }
    // Page 9: Invitation
    if (CONFIG.invitation) {
        const p9Subtitle = document.getElementById('p9-subtitle');
        const p9Question = document.getElementById('p9-question');
        const yesBtn = document.getElementById('yes-btn');
        const noBtn = document.getElementById('no-btn');

        if (p9Subtitle) p9Subtitle.textContent = CONFIG.invitation.subtitle;
        if (p9Question) p9Question.textContent = CONFIG.invitation.title;
        if (yesBtn) yesBtn.textContent = CONFIG.invitation.yesText;
        if (noBtn) noBtn.textContent = CONFIG.invitation.noText;
    }

    // Page 9: Love-Lock Finale
    if (CONFIG.lock) {
        const lockInitials = document.getElementById('lock-initials');
        const lockInstr = document.getElementById('lock-instruction');
        const lockFinal = document.getElementById('lock-final-message');

        if (lockInitials) lockInitials.textContent = CONFIG.lock.initials || "A + B";
        if (lockInstr) lockInstr.textContent = CONFIG.lock.instruction || "Click to lock our love forever...";
        if (lockFinal) lockFinal.textContent = CONFIG.lock.finalMessage || "Safely locked in my heart. Always.";
    }
}


// --- IDM SHIELD: Fetch Media as Blob ---
async function fetchMediaBlob(url) {
    try {
        // Add a query param to deceive IDM sniffing
        const shieldedUrl = url + (url.includes('?') ? '&' : '?') + 'shield=' + Date.now();
        const response = await fetch(shieldedUrl);
        const blob = await response.blob();

        // Force MIME type to audio/mp3 if it's one of our renamed .dat files
        // This ensures the browser treats the .dat file as valid audio
        const type = url.endsWith('.dat') ? 'audio/mpeg' : blob.type;
        const audioBlob = new Blob([blob], { type: type });

        return URL.createObjectURL(audioBlob);
    } catch (e) {
        console.error("Failed to fetch media blob:", e);
        return url; // Fallback to original URL
    }
}

let musicLoadingPromise = null;
let loadingTargetIndex = -1;

async function loadSong(index, forceReload = false) {
    if (!CONFIG.music || CONFIG.music.length === 0) return;

    // Safety Wrap for playlist boundaries
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

            const songTitle = document.getElementById('song-title');
            const artistName = document.getElementById('artist-name');
            const musicCover = document.getElementById('music-cover');
            const lyrics = document.getElementById('song-lyrics');

            // Update labels and cover immediately (sync)
            if (songTitle) songTitle.textContent = song.songTitle;
            if (artistName) artistName.textContent = song.artist;

            if (musicCover) {
                musicCover.src = song.coverSrc;
                musicCover.onerror = () => {
                    musicCover.src = "https://images.unsplash.com/photo-1518193583867-0ef427db9aa2?q=80&w=400&h=400&auto=format&fit=crop";
                };
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

            // Load audio source as blob - Async part
            const newSrc = song.audioSrc;
            // Ensure we load if src is missing OR if it's a new source
            if (!bgMusic.src || bgMusic.dataset.originalSrc !== newSrc) {
                // If there's an existing blob URL for a DIFFERENT source, revoke it
                if (bgMusic.src && bgMusic.src.startsWith('blob:') && bgMusic.dataset.originalSrc !== newSrc) {
                    URL.revokeObjectURL(bgMusic.src);
                }

                const blobUrl = await fetchMediaBlob(newSrc);

                // RACE CONDITION FIX:
                // Check if the user has changed the song while we were fetching the blob
                if (currentSongIndex !== index) {
                    console.log(`[Music] Ignoring stale blob load for index ${index}. Current is ${currentSongIndex}`);
                    return; // Exit, do not set src
                }

                bgMusic.dataset.originalSrc = newSrc;
                bgMusic.src = blobUrl;
                bgMusic.load(); // Force browser to buffer the new source

                // Wait for enough data to be ready
                await new Promise((resolve) => {
                    const onCanPlay = () => {
                        bgMusic.removeEventListener('canplay', onCanPlay);
                        resolve();
                    };
                    bgMusic.addEventListener('canplay', onCanPlay);
                    // Fallback timeout in case event doesn't fire
                    setTimeout(resolve, 2000);
                });

                if (currentSongIndex === index) {
                    updatePlayIcon();
                }
            }
        } catch (err) {
            console.error("loadSong failed:", err);
        } finally {
            // Keep musicLoadingPromise for a bit to avoid immediate re-triggers
            // but clear it if index changes
        }
    })();

    return musicLoadingPromise;
}

function initMusicPlayer() {
    const toggleBtn = document.getElementById('p2-music-toggle');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const progressBar = document.getElementById('progress-bar');

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

    // Global Music Toggle (Backup for IDM/Autoplay blocks)
    const globalToggle = document.getElementById('global-music-toggle');
    if (globalToggle) {
        globalToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                playMusic();
            } else {
                pauseMusic();
            }
        });
    }

    // SYNC UI with Audio State - The most reliable way for all platforms
    bgMusic.addEventListener('play', () => {
        updatePlayIcon();
        if (globalToggle) globalToggle.classList.remove('hidden'); // Show when playing
    });
    bgMusic.addEventListener('pause', updatePlayIcon);
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
    console.log("Loading Gallery...");
    if (!CONFIG.gallery || !CONFIG.gallery.memories) return;

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
                <div class="pt-5 pb-3 px-2 text-center overflow-hidden">
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
        ctx.lineWidth = 40; // Increased brush size

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

        // Play scratch sound - DISABLED by User Request
        // if (scratchSfx.paused) {
        //     scratchSfx.play().catch(err => console.log('SFX blocked:', err));
        // }

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
        if (percentage > 35) { // Lowered threshold for better feel
            revealedMemories[index] = true; // Persist revealed state
            canvas.style.transition = 'opacity 1.5s ease-out';
            canvas.style.opacity = '0';
            setTimeout(() => canvas.remove(), 1500);
            if (caption) caption.classList.remove('opacity-0');
            if (caption) caption.classList.add('opacity-100');

            // Add capability
            const container = canvas.parentElement;
            container.classList.add('shadow-inner');
            container.onclick = () => openLightbox(index);

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

    window.addEventListener('mouseup', () => { isDrawing = false; lastX = undefined; lastY = undefined; });
    window.addEventListener('touchend', () => { isDrawing = false; lastX = undefined; lastY = undefined; });

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
            
            <div class="text-center pt-2">
                <p class="polaroid-caption text-xl md:text-3xl" style="opacity: 1 !important; transform: rotate(-1deg) !important; transition: none !important;">${mem.caption}</p>
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

// --- Map Logic (Atlas of Us) ---
let mapMarkers = [];
let mapPolyline = null;
let markerCluster = null;

async function initMap() {
    console.log("Initializing Map with Journey Animation...");
    if (!window.L) {
        console.error("Leaflet (L) not loaded!");
        return;
    }

    const mapElement = document.getElementById('map');
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
        mapInstance = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView(defaultCenter, 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            className: 'map-tiles'
        }).addTo(mapInstance);

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

        // Optional: Zoom out when popup is closed via the 'X' button
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

    // Initialize MarkerCluster Group
    markerCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        iconCreateFunction: function (cluster) {
            return L.divIcon({
                html: `<div class="flex items-center justify-center bg-rose-500 text-white rounded-full w-10 h-10 border-2 border-white shadow-lg font-bold">
                        ${cluster.getChildCount()}
                       </div>`,
                className: 'custom-cluster-icon',
                iconSize: [40, 40]
            });
        }
    });
    mapInstance.addLayer(markerCluster);

    // Prepare journey data
    if (CONFIG.map && CONFIG.map.locations && CONFIG.map.locations.length > 0) {
        const routeCoords = [];

        // Show markers one by one with animation
        for (let i = 0; i < CONFIG.map.locations.length; i++) {
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
                    <h3 class="font-display text-deep-red font-bold text-lg mb-1">${loc.title}</h3>
                    <p class="text-xs text-rose-400 font-semibold mb-2 uppercase tracking-wider">${loc.date}</p>`;

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

            // Add marker with a slight delay
            await new Promise(resolve => setTimeout(resolve, i === 0 ? 0 : 800));

            const marker = L.marker(loc.coordinates, { icon: markerIcon })
                .bindPopup(popupContent, {
                    className: 'rose-popup',
                    maxWidth: 250
                });

            markerCluster.addLayer(marker);

            mapMarkers.push(marker);

            // Draw/Update Polyline
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

            // Optional: Pan to marker as it appears
            mapInstance.panTo(loc.coordinates, { animate: true, duration: 1 });

            // Interaction
            marker.on('click', function () {
                mapInstance.setView(loc.coordinates, 18, {
                    animate: true,
                    duration: 1.0
                });
            });
        }

        // Zoom out to show all markers after the journey
        if (mapMarkers.length > 0) {
            setTimeout(() => {
                const group = new L.featureGroup(mapMarkers);
                mapInstance.fitBounds(group.getBounds(), { padding: [50, 50], animate: true });
            }, 1500);
        }
    }

    // Add Zoom control to bottom left if missing
    if (!document.querySelector('.leaflet-control-zoom') && mapInstance) {
        L.control.zoom({
            position: 'bottomleft'
        }).addTo(mapInstance);
    }
}

// Toggle Map Card Logic for Mobile
let isMapCardCollapsed = false;
function toggleMapCard() {
    const content = document.getElementById('map-card-content');
    const chevron = document.getElementById('map-card-chevron');

    if (!content || !chevron) return;

    if (isMapCardCollapsed) {
        // Expand
        content.style.maxHeight = '500px';
        content.style.opacity = '1';
        content.style.marginTop = '0'; // Reset margin
        chevron.style.transform = 'rotate(0deg)';
        isMapCardCollapsed = false;
    } else {
        // Collapse
        content.style.maxHeight = '0px';
        content.style.opacity = '0';
        content.style.marginTop = '-10px'; // Slight pull up for tighter feel
        chevron.style.transform = 'rotate(180deg)';
        isMapCardCollapsed = true;
    }
}

// Logic for specific pages initialized via MapsTo

function updatePlayIcon() {
    const playIcon = document.getElementById('play-icon');
    const visualizer = document.getElementById('music-visualizer');
    const globalToggle = document.getElementById('global-music-toggle');

    // UI should show "Pause" if the user has triggered play, even if buffering
    const isPlaying = !bgMusic.paused && !bgMusic.ended;

    if (globalToggle) {
        globalToggle.textContent = isPlaying ? '🎵' : '🔇';
    }

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

let isMusicLoading = false;

function playMusic() {
    if (isMusicLoading) return; // Prevent re-entrant calls
    // Hide IDM panels
    const idmPanels = document.querySelectorAll('[id^="idm_"], [class^="idm_"]');
    idmPanels.forEach(p => p.style.display = 'none');

    // Ensure it's not muted
    bgMusic.muted = false;

    // If no source yet, wait or load first song
    if (!bgMusic.src && CONFIG.music && CONFIG.music.length > 0) {
        console.log("[Music] Source missing, fetching...");
        isMusicLoading = true;
        loadSong(currentSongIndex).then(() => {
            isMusicLoading = false;
            // Only recurse IF we successfully got a source
            if (bgMusic.src) {
                playMusic();
            } else {
                console.warn("[Music] Failed to set source after loadSong.");
            }
        }).catch((err) => {
            console.error("[Music] loadSong failed:", err);
            isMusicLoading = false;
        });
        return;
    }

    const playPromise = bgMusic.play();

    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                // Playback started successfully
                updatePlayIcon();
            })
            .catch(e => {
                console.log("Auto-play blocked or failed:", e);
                // If blocked, we might need a user gesture, which we have in Login
                updatePlayIcon();
            });
    } else {
        // Fallback for very old browsers
        updatePlayIcon();
    }
}

function pauseMusic() {
    bgMusic.pause();
    updatePlayIcon();
}

// Page 1: Login Logic
function initLogin() {
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

            // Show global toggle (initially hidden in HTML)
            const globalToggle = document.getElementById('global-music-toggle');
            if (globalToggle) globalToggle.classList.remove('hidden');

            playMusic();

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

let letterTyped = false;

function initLetterPage() {
    const letter = document.getElementById('fate-letter');
}

function handleLetterInteraction() {
    const letter = document.getElementById('fate-letter');
    if (letter) {
        if (letter.classList.contains('is-crumpled')) {
            letter.classList.remove('is-crumpled');
            if (!letterTyped) {
                startLetterTyping();
            }
        } else {
            letter.classList.add('is-crumpled');
        }
    }
}

async function startLetterTyping() {
    if (letterTyped) {
        // Already Typed: Ensure content is visible and button is active
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

    const fullText = CONFIG.letter.message;
    const paragraphs = fullText.split('\n\n');

    bodyEl.innerHTML = '';

    for (const pText of paragraphs) {
        if (!letterTyped) break; // Stop if reset
        const pEl = document.createElement('p');
        bodyEl.appendChild(pEl);
        await typeTarget(pEl, pText);
    }

    // Type Closing
    const closingEl = document.getElementById('letter-closing');
    if (closingEl && letterTyped) {
        await typeTarget(closingEl, "With all my love,");
    }

    // Type Signature
    const signatureEl = document.getElementById('letter-signature');
    if (signatureEl && letterTyped && CONFIG.letter.signature) {
        await typeTarget(signatureEl, CONFIG.letter.signature);
    }

    // Finished! Show the Finale button
    const finaleNextBtn = document.getElementById('finale-next-btn');
    if (finaleNextBtn) {
        finaleNextBtn.classList.remove('opacity-0', 'pointer-events-none');
        finaleNextBtn.classList.add('opacity-100', 'pointer-events-auto');
    }
}

function typeTarget(element, text) {
    return new Promise(resolve => {
        let i = 0;
        const speed = 40; // Typing speed in ms
        function type() {
            if (!letterTyped) {
                resolve();
                return;
            }
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                resolve();
            }
        }
        type();
    });
}

function resetLetterPage() {
    const letter = document.getElementById('fate-letter');
    const hint = document.getElementById('open-hint');
    const bodyEl = document.getElementById('letter-body');
    const closingEl = document.getElementById('letter-closing');
    const signatureEl = document.getElementById('letter-signature');

    letterTyped = false; // Reset typewriter state
    if (bodyEl) bodyEl.innerHTML = ''; // Clear typed text
    if (closingEl) closingEl.textContent = '';
    if (signatureEl) signatureEl.textContent = '';

    if (letter) {
        letter.classList.add('is-crumpled');
        if (hint) {
            hint.style.display = '';
            hint.classList.add('pulse-hint-anim');
        }
    }

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
    if (container && CONFIG.finale && CONFIG.finale.videoSrc) {
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
    if (!CONFIG.countdown || !CONFIG.countdown.targetDate) {
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
    if (!CONFIG.pageConfig || !CONFIG.pageConfig.pages) return;

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
    if (!CONFIG.pageConfig || !CONFIG.pageConfig.pages) {
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
    if (!CONFIG.pageConfig || !CONFIG.pageConfig.pages) return true;
    const page = CONFIG.pageConfig.pages[pageId];
    return page ? page.enabled : true;
}

/**
 * Get page configuration by ID
 */
function getPageConfig(pageId) {
    if (!CONFIG.pageConfig || !CONFIG.pageConfig.pages) return null;
    return CONFIG.pageConfig.pages[pageId] || null;
}

/**
 * Handle dynamic forward navigation
 */
/**
 * Capture Music Card (Page 3)
 */
function captureMusicCard() {
    const container = document.querySelector('#page-3-container .min-h-screen > .flex-col');
    if (typeof captureElement === 'function' && container) {
        captureElement(container, 'My-Playlist-Card.png');
    }
}

function goNextPage() {
    const activePage = document.querySelector('.page:not(.hidden)');
    if (!activePage) return;

    const nextId = getNextPage(activePage.id);
    if (nextId) {
        MapsTo(activePage.id, nextId);
    }
}

/**
 * Handle dynamic backward navigation
 */
function goPrevPage() {
    const activePage = document.querySelector('.page:not(.hidden)');
    if (!activePage) return;

    const prevId = getPreviousPage(activePage.id);
    if (prevId) {
        MapsTo(activePage.id, prevId);
    }
}
