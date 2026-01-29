// ========================================
// SCREENSHOT FUNCTIONALITY - FULL PAGE V3.3
// Fix: Judul teks terpotong di Music Player
// ========================================

function captureElement(selector, filename, returnCanvas = false) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        const isMap = selector.includes('page-7');

        if (!element) {
            const error = 'Content to capture not found: ' + selector;
            console.error(error);
            reject(error);
            return;
        }

        // Identifikasi tombol navigasi
        const navButtons = document.querySelectorAll('.nav-bottom-grid, .nav-camera-btn, .nav-btn-standard');

        // Tampilkan loading
        const loadingDiv = document.createElement('div');
        loadingDiv.style.cssText = `
        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
        background: rgba(255,255,255,0.98); padding: 25px; border-radius: 15px; 
        z-index: 100000; box-shadow: 0 15px 50px rgba(0,0,0,0.3);
        font-family: sans-serif; text-align: center; color: #7e0c23; border: 2px solid #fecdd3;
    `;
        loadingDiv.innerHTML = '<div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">📸 Menyimpan Seluruh Halaman</div><div style="font-size: 13px; color: #666;">Membereskan detail teks...</div>';
        document.body.appendChild(loadingDiv);

        // Sembunyikan tombol agar tidak masuk foto
        navButtons.forEach(btn => btn.style.visibility = 'hidden');

        // Capture dimensions
        const captureHeight = isMap ? window.innerHeight : element.scrollHeight;

        // Determine delay based on content type
        const captureDelay = isMap ? 1500 : 300;

        setTimeout(() => {
            html2canvas(element, {
                backgroundColor: '#fff1f2',
                useCORS: true,
                scale: 2,
                logging: false,
                height: captureHeight,
                windowHeight: captureHeight,
                onclone: (clonedDoc) => {
                    // FIX: Mencegah teks judul terpotong
                    const titles = clonedDoc.querySelectorAll('#song-title, #artist-name, .font-display');
                    titles.forEach(el => {
                        el.style.overflow = 'visible';
                        el.style.whiteSpace = 'normal';
                        el.style.lineHeight = '1.4';
                        el.style.paddingTop = '5px';
                        el.classList.remove('truncate');
                    });

                    // Ensure the Story Card is fully visible if it's currently printing
                    const clonedStoryCard = clonedDoc.querySelector('.story-card');
                    if (clonedStoryCard) {
                        clonedStoryCard.style.transform = 'translateY(0)';
                        clonedStoryCard.style.transition = 'none';
                    }

                    const clonedElement = clonedDoc.querySelector(selector);
                    if (clonedElement) {
                        // For maps, keep the fixed height to avoid blank tiles
                        if (!isMap) {
                            clonedElement.style.height = 'auto';
                        } else {
                            clonedElement.style.height = window.innerHeight + 'px';
                        }
                        clonedElement.style.overflow = 'visible';
                    }

                    // Sembunyi elemen yang tidak perlu
                    const skip = clonedDoc.querySelectorAll('.grain-overlay, #particle-container, #global-music-toggle, .nav-btn-standard');
                    skip.forEach(el => el.style.display = 'none');
                }
            }).then(canvas => {
                navButtons.forEach(btn => btn.style.visibility = 'visible');
                if (loadingDiv.parentNode) document.body.removeChild(loadingDiv);

                if (returnCanvas) {
                    resolve(canvas);
                } else {
                    const link = document.createElement('a');
                    link.download = filename || 'full-memory.png';
                    link.href = canvas.toDataURL('image/png', 1.0);
                    link.click();
                    resolve(true);
                }
            }).catch(err => {
                console.error('Screenshot Error:', err);
                navButtons.forEach(btn => btn.style.visibility = 'visible');
                if (loadingDiv.parentNode) document.body.removeChild(loadingDiv);
                alert('Gagal mengambil gambar.');
                reject(err);
            });
        }, captureDelay);
    });
}

// Share function
// Enhanced Share function for mobile
async function shareWrapped() {
    try {
        const shareTitle = "Our Love Wrapped 2024";
        const shareText = "Check out our beautiful memories! ❤️";

        // Step 1: Capture the card
        const canvas = await captureElement('#page-4 main', 'wrapped.png', true);
        const dataUrl = canvas.toDataURL('image/png', 1.0);

        // Step 2: Prepare the file
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], 'wrapped.png', { type: 'image/png' });

        // Step 3: Use Web Share API
        if (navigator.share) {
            const shareData = {
                title: shareTitle,
                text: shareText
            };

            // Attempt to include the file if supported
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                shareData.files = [file];
            } else {
                console.log("File sharing not supported on this browser context.");
            }

            try {
                await navigator.share(shareData);
                console.log('Share successful!');
            } catch (shareError) {
                // If it was cancelled by the user, don't show an error
                if (shareError.name === 'AbortError') {
                    console.log('Sharing cancelled by user.');
                    return;
                }

                // If activation expired or other error, fallback to download
                console.warn('Navigator.share failed, failing back to download:', shareError);
                downloadBlob(blob, 'wrapped.png');
            }
        } else {
            console.log('Web Share API not supported in this browser, downloading...');
            downloadBlob(blob, 'wrapped.png');
        }
    } catch (err) {
        console.error('Full share flow failed:', err);
        alert('Could not open sharing. The image has been saved to your device instead.');
    }
}

// Utility to handle downloads
function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

// Wrapper functions
function captureWrappedCard() { captureElement('#page-4 main', 'full-wrapped.png'); }
function captureMusicCard() { captureElement('#page-3-container', 'full-playlist.png'); }
function captureGreetingCard() { captureElement('#page-2-container', 'full-greeting.png'); }
function captureQuizCard() { captureElement('#page-5-container', 'full-quiz.png'); }
function captureGallery() { captureElement('#page-6-container', 'full-gallery.png'); }
function captureMap() { captureElement('#page-7-container', 'full-map-journey.png'); }
function captureLetter() { captureElement('#page-8-container', 'full-letter.png'); }
function captureLockPage() { captureElement('#page-9 main', 'full-love-locked.png'); }