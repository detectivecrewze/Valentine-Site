// Core Architecture
const bgMusic = new Audio(); // Global Audio Object
let currentSongIndex = 0;
let mapInstance = null;
let revealedMemories = []; // Persistent state for gallery

document.addEventListener('DOMContentLoaded', () => {
    loadDynamicContent();
    initLogin();
    initCountdown(); // Start the countdown
    initMusicPlayer();
    initLetterPage();
});

// Helper Function: MapsTo
function MapsTo(fromId, toId) {
    const fromPage = document.getElementById(fromId);
    const toPage = document.getElementById(toId);

    if (fromPage) fromPage.classList.add('hidden');

    if (toPage) {
        toPage.classList.remove('hidden');
        toPage.classList.add('animate-fade-in-up');

        // Logic for specific pages
        if (toId === 'page-2') {
            // Wrapped Page - No specific init needed unless dynamic data loading
            // Ensure music continues if playing, or starts if configured
        } else if (toId === 'page-3') {
            loadSong(currentSongIndex);
            playMusic();
        } else if (toId === 'page-5') {
            if (typeof loadQuiz === 'function') loadQuiz();
        } else if (toId === 'page-6') {
            if (typeof loadGallery === 'function') loadGallery();
        } else if (toId === 'page-7') {
            // Automatically mark all gallery items as revealed when reaching the map
            if (CONFIG.gallery && CONFIG.gallery.memories) {
                CONFIG.gallery.memories.forEach((_, idx) => {
                    revealedMemories[idx] = true;
                });
            }
            if (typeof initMap === 'function') initMap();
        } else if (toId === 'page-8') {
            if (typeof resetLetterPage === 'function') resetLetterPage();
        } else if (toId === 'page-9') {
            initInvitationPage();
        } else if (toId === 'page-10') {
            initFinalePage();
        }
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

    // Initial Load for Music Player (Preload)
    if (CONFIG.music && CONFIG.music.length > 0) {
        loadSong(0);
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

        if (wrappedImg) wrappedImg.style.backgroundImage = `url('${CONFIG.wrapped.imageSrc}')`;

        if (topPlacesList && CONFIG.wrapped.topPlaces) {
            topPlacesList.innerHTML = CONFIG.wrapped.topPlaces.map(place => `<li>${place}</li>`).join('');
        }
        if (coreMemoriesList && CONFIG.wrapped.coreMemories) {
            coreMemoriesList.innerHTML = CONFIG.wrapped.coreMemories.map(mem => `<li>${mem}</li>`).join('');
        }

        // Footer label
        const footerLabel = document.getElementById('wrapped-footer-label');
        if (footerLabel && CONFIG.wrapped.footerLabel) {
            footerLabel.textContent = CONFIG.wrapped.footerLabel;
        }
    }

    // Page 3: Greeting Card
    if (CONFIG.greeting) {
        const p3Title = document.getElementById('p3-title');
        const p3Message = document.getElementById('p3-message');
        const p3Image = document.getElementById('p3-image');
        const p3Footer = document.getElementById('p3-footer');

        if (p3Title) p3Title.textContent = CONFIG.greeting.title;
        if (p3Message) p3Message.textContent = CONFIG.greeting.message;
        if (p3Image) p3Image.src = CONFIG.greeting.imageSrc;
        if (p3Footer) p3Footer.textContent = CONFIG.greeting.footerText;
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
        if (signatureEl) signatureEl.textContent = CONFIG.letter.signature;

        if (bodyEl) {
            bodyEl.innerHTML = ''; // Clear
            const paragraphs = CONFIG.letter.message.split('\n\n');
            paragraphs.forEach(p => {
                const pEl = document.createElement('p');
                pEl.textContent = p;
                bodyEl.appendChild(pEl);
            });
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

    // Page 10: Finale
    if (CONFIG.finale) {
        const finaleTitle = document.getElementById('finale-title');
        const finaleMessage = document.getElementById('finale-message');

        if (finaleTitle) finaleTitle.textContent = CONFIG.finale.title;
        if (finaleMessage) finaleMessage.textContent = CONFIG.finale.message;
    }
}

function loadSong(index) {
    if (!CONFIG.music || CONFIG.music.length === 0) return;

    // Safety Wrap for playlist boundaries
    if (index < 0) index = CONFIG.music.length - 1;
    if (index >= CONFIG.music.length) index = 0;
    currentSongIndex = index;

    const song = CONFIG.music[currentSongIndex];

    const songTitle = document.getElementById('song-title');
    const artistName = document.getElementById('artist-name');
    const musicCover = document.getElementById('music-cover');
    const lyrics = document.getElementById('song-lyrics');

    // Update labels and cover
    if (songTitle) songTitle.textContent = song.songTitle;
    if (artistName) artistName.textContent = song.artist;

    if (musicCover) {
        musicCover.src = song.coverSrc;
        // Fallback for broken images (avoids "box" icons)
        musicCover.onerror = () => {
            musicCover.src = "https://images.unsplash.com/photo-1518193583867-0ef427db9aa2?q=80&w=400&h=400&auto=format&fit=crop";
        };
    }

    if (lyrics) {
        lyrics.textContent = song.lyrics || "";
        // Reset opacity for a subtle fade-in effect when song changes
        lyrics.style.opacity = 0;
        setTimeout(() => lyrics.style.opacity = 0.8, 100);
    }

    // Load audio source directly (Fastest performance, avoids Blob download delay)
    const newSrc = song.audioSrc;
    if (bgMusic.dataset.originalSrc !== newSrc) {

        // Clean up any old blob URLs if they exist from previous sessions
        if (bgMusic.src && bgMusic.src.startsWith('blob:')) {
            URL.revokeObjectURL(bgMusic.src);
        }

        bgMusic.dataset.originalSrc = newSrc;
        bgMusic.src = newSrc;

        // Removed .load() to prevent iOS playback reset issues. 
        // Setting .src already triggers the necessary resource selection.
    }
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

    // SYNC UI with Audio State (Most reliable way)
    bgMusic.addEventListener('play', updatePlayIcon);
    bgMusic.addEventListener('pause', updatePlayIcon);
}

// --- Quiz Logic ---
let currentQuestionIndex = 0;

function loadQuiz() {
    if (!CONFIG.quiz || !CONFIG.quiz.questions) return;

    if (currentQuestionIndex >= CONFIG.quiz.questions.length) {
        // Quiz Finished - Show navigation button
        const p4NextBtn = document.getElementById('p4-next-container');
        if (p4NextBtn) p4NextBtn.classList.remove('hidden');
        return;
    }

    const questionData = CONFIG.quiz.questions[currentQuestionIndex];
    if (!questionData) return;

    const questionEl = document.getElementById('quiz-question');
    const optionsEl = document.getElementById('quiz-options');
    const progressText = document.getElementById('quiz-progress-text');
    const dotsContainer = document.getElementById('quiz-dots');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('quiz-next-btn');

    if (questionEl) questionEl.textContent = questionData.question;
    if (progressText) progressText.textContent = `QUESTION ${currentQuestionIndex + 1}/${CONFIG.quiz.questions.length}`;

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

    // Update Dots
    if (dotsContainer) {
        dotsContainer.innerHTML = '';
        CONFIG.quiz.questions.forEach((_, idx) => {
            const dot = document.createElement('div');
            // Active dot is wider
            if (idx === currentQuestionIndex) {
                dot.className = "w-8 h-1.5 rounded-full bg-rose-900/40 transition-all duration-300";
            } else if (idx < currentQuestionIndex) {
                dot.className = "w-2 h-1.5 rounded-full bg-rose-900/20 transition-all duration-300"; // Completed
            } else {
                dot.className = "w-2 h-1.5 rounded-full bg-rose-900/10 transition-all duration-300"; // Future
            }
            dotsContainer.appendChild(dot);
        });
    }
}

function checkAnswer(selectedIndex, btnElement, data) {
    const feedbackEl = document.getElementById('quiz-feedback');
    const feedbackMsg = document.getElementById('quiz-feedback-message');
    const optionsEl = document.getElementById('quiz-options');

    // Disable all buttons to prevent double clicking
    const allBtns = optionsEl.querySelectorAll('button');
    allBtns.forEach(b => {
        b.disabled = true;
        b.classList.add('cursor-not-allowed', 'opacity-60');
    });

    if (selectedIndex === data.correctIndex) {
        // Correct Answer
        // Safely remove/add classes instead of replace
        btnElement.classList.remove('bg-white/70', 'border-transparent');
        btnElement.classList.add('bg-rose-100', 'border-rose-400');

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

            // On the last question, show the main page navigation button
            if (currentQuestionIndex === CONFIG.quiz.questions.length - 1) {
                const p4NextBtn = document.getElementById('p4-next-container');
                if (p4NextBtn) p4NextBtn.classList.remove('hidden');
            } else {
                // Auto-advance to next question after 1.5 seconds (not on last question)
                setTimeout(() => {
                    currentQuestionIndex++;
                    loadQuiz();
                }, 1500);
            }
        }
    } else {
        // Wrong Answer
        btnElement.classList.remove('bg-white/70');
        btnElement.classList.add('bg-red-50', 'shake');

        // Remove shake after animation (500ms) and re-enable
        setTimeout(() => {
            btnElement.classList.remove('shake');
            btnElement.classList.remove('bg-red-50');
            btnElement.classList.add('bg-white/70'); // Restore background

            // Re-enable all buttons for retry
            allBtns.forEach(b => {
                b.disabled = false;
                b.classList.remove('cursor-not-allowed', 'opacity-60');
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
        CONFIG.gallery.memories.forEach((mem, index) => {
            const card = document.createElement('div');
            card.className = `polaroid-frame bg-white p-3 shadow-2xl relative ${mem.rotation} group`;

            // Determine media HTML based on type
            let mediaHTML = "";
            if (mem.type === "video") {
                mediaHTML = `
                    <video class="w-full h-full object-cover" autoplay muted loop playsinline preload="auto">
                        <source src="${mem.src}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>`;
            } else {
                // handles "image" and default
                mediaHTML = `<img alt="Memory" class="w-full h-full object-cover" src="${mem.src}" />`;
            }

            card.innerHTML = `
                <div class="${mem.tape} absolute -top-3 ${mem.rotation.includes('-') ? '-left-4' : '-right-3'} w-14 h-6 z-10"></div>
                <div class="aspect-[3/4] w-full relative overflow-hidden bg-gray-100">
                    ${mediaHTML}
                    ${revealedMemories[index] ? '' : `<canvas id="scratch-canvas-${index}" class="absolute inset-0 w-full h-full cursor-crosshair z-20"></canvas>`}
                </div>
                <div class="pt-4 pb-2 text-center">
                    <p id="caption-${index}" class="font-display italic text-xl leading-snug text-rose-900 ${revealedMemories[index] ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000">${mem.caption}</p>
                </div>
            `;
            gridEl.appendChild(card);

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
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

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

        // Check reveal percentage occasionally
        if (Math.random() > 0.9) {
            checkReveal();
        }
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

            // Play video if it's a video element
            const container = canvas.parentElement;
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

// --- Map Logic (Atlas of Us) ---
function initMap() {
    console.log("Initializing Map...");
    if (!window.L) {
        console.error("Leaflet (L) not loaded!");
        return;
    }

    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    // If map already exists, just invalidate size and return
    if (mapInstance) {
        setTimeout(() => {
            mapInstance.invalidateSize();
        }, 100);
        return;
    }

    // Default view: Center on the first location if available
    const defaultCenter = (CONFIG.map && CONFIG.map.locations && CONFIG.map.locations.length > 0)
        ? CONFIG.map.locations[0].coordinates
        : [0, 0];

    mapInstance = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView(defaultCenter, 13);

    // Add Tile Layer with Class Name for Filter
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        className: 'map-tiles'
    }).addTo(mapInstance);

    // Custom Heart Marker Icon
    const heartIcon = L.divIcon({
        html: '<span class="material-symbols-outlined heart-marker">favorite</span>',
        className: 'custom-div-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    // Add markers from CONFIG
    if (CONFIG.map && CONFIG.map.locations) {
        CONFIG.map.locations.forEach(loc => {
            // Create popup content with optional image
            let popupContent = `
                <div class="font-sans p-2">
                    <h3 class="font-display text-deep-red font-bold text-lg mb-1">${loc.title}</h3>
                    <p class="text-xs text-rose-400 font-semibold mb-2 uppercase tracking-wider">${loc.date}</p>`;

            // Add image if provided
            if (loc.imageSrc && loc.imageSrc.trim() !== '') {
                popupContent += `
                    <div class="mb-3 rounded-lg overflow-hidden shadow-md">
                        <img src="${loc.imageSrc}" alt="${loc.title}" class="w-full h-32 object-cover">
                    </div>`;
            }

            popupContent += `
                    <p class="text-rose-900/80 text-sm leading-relaxed italic">"${loc.memory}"</p>
                </div>
            `;

            const marker = L.marker(loc.coordinates, { icon: heartIcon })
                .addTo(mapInstance)
                .bindPopup(popupContent, {
                    className: 'rose-popup',
                    maxWidth: 250
                });

            // Auto-zoom and open popup when marker is clicked
            marker.on('click', function () {
                // Store original view before zooming
                const originalCenter = mapInstance.getCenter();
                const originalZoom = mapInstance.getZoom();

                // Zoom in to the marker location
                mapInstance.setView(loc.coordinates, 16, {
                    animate: true,
                    duration: 1.0 // 1 second - smooth but not slow
                });

                // Zoom out when popup is closed
                marker.on('popupclose', function () {
                    mapInstance.setView(originalCenter, originalZoom, {
                        animate: true,
                        duration: 1.0 // 1 second - smooth but not slow
                    });
                }, { once: true }); // Only trigger once per popup open
            });
        });
    }

    // Add Zoom control to bottom left
    L.control.zoom({
        position: 'bottomleft'
    }).addTo(mapInstance);

    // Ensure map renders correctly after initial load
    setTimeout(() => {
        mapInstance.invalidateSize();
    }, 500);
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
    if (playIcon) {
        playIcon.textContent = bgMusic.paused ? 'play_arrow' : 'pause';
    }
}

function changeSong(direction) {
    loadSong(currentSongIndex + direction);
    playMusic();
}

function playMusic() {
    // Aggressive protection: try to hide IDM panels if they inject anything
    const idmPanels = document.querySelectorAll('[id^="idm_"], [class^="idm_"]');
    idmPanels.forEach(p => p.style.display = 'none');

    bgMusic.play().catch(e => {
        console.log("Audio play failed (interaction required or invalid source):", e);
        // Explicitly ensuring the icon reflects the failed state
        updatePlayIcon();
    });
}

function pauseMusic() {
    bgMusic.pause();
    // Icon updates via the 'pause' event listener
}

// Page 1: Login Logic (unchanged but re-included for completeness)
function initLogin() {
    const loginInput = document.getElementById('login-input');
    const loginBtn = document.getElementById('login-btn');
    const errorMsg = document.getElementById('error-message');

    function validateLogin() {
        const val = loginInput.value.trim().toLowerCase();

        if (val === CONFIG.login.password) {
            MapsTo('page-1', 'page-4');
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
    }
}

// Page 8: Heartfelt Letter Interaction
function initLetterPage() {
    const letter = document.getElementById('fate-letter');
    // Logic is now handled via inline onclick toggle for better responsiveness
    // and CSS for hint visibility.
}

function resetLetterPage() {
    const letter = document.getElementById('fate-letter');
    const hint = document.getElementById('open-hint');

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
    for (let i = 0; i < 8; i++) {
        const sparkle = document.createElement('div');
        sparkle.className = 'fixed pointer-events-none text-rose-300 z-50 animate-ping';
        sparkle.innerHTML = '✨';
        sparkle.style.left = `${rect.left + rect.width / 2}px`;
        sparkle.style.top = `${rect.top + rect.height / 2}px`;
        sparkle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${(Math.random() - 0.5) * 100}px)`;
        document.body.appendChild(sparkle);
        setTimeout(() => sparkle.remove(), 1000);
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
function initCountdown() {
    if (!CONFIG.countdown || !CONFIG.countdown.targetDate) return;

    // Target Date from CONFIG
    const targetDate = new Date(CONFIG.countdown.targetDate).getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');
    const counterDiv = document.getElementById('valentine-countdown');
    const labelEl = document.getElementById('countdown-label');

    if (!counterDiv) return;

    function updateTimer() {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            // Timer expired
            clearInterval(timerInterval);
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
    }

    // Run immediately then interval
    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
}

