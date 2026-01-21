// Generic Screenshot functionality
function captureElement(selector, filename) {
    const element = document.querySelector(selector);
    // Hide all navigation and screenshot buttons temporarily
    const buttons = document.querySelectorAll('.screenshot-btn-class');

    if (!element) {
        console.error('Content to capture not found:', selector);
        alert('Content to capture not found!');
        return;
    }

    // Hide buttons temporarily
    buttons.forEach(btn => btn.style.display = 'none');

    // Use html2canvas
    if (typeof html2canvas !== 'undefined') {
        html2canvas(element, {
            backgroundColor: '#ffffff', // Prevent black background on transparency
            scale: 2, // Higher quality
            logging: false,
            useCORS: true,
            allowTaint: true,
            scrollY: -window.scrollY, // Correct for page scroll
            windowWidth: document.documentElement.offsetWidth,
            windowHeight: element.scrollHeight || document.documentElement.offsetHeight
        }).then(canvas => {
            // Show buttons again
            buttons.forEach(btn => btn.style.display = '');

            // Convert to blob and download
            canvas.toBlob(blob => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = filename || 'memory.png';
                link.href = url;
                link.click();
                URL.revokeObjectURL(url);
            });
        }).catch(err => {
            console.error('Screenshot failed:', err);
            buttons.forEach(btn => btn.style.display = '');
            alert('Screenshot failed. Please try again.');
        });
    } else {
        buttons.forEach(btn => btn.style.display = '');
        alert('Screenshot library not loaded. Please refresh the page.');
    }
}

// Specific wrappers
function captureWrappedCard() {
    // Page 2 - Card has its own background color
    captureElement('.story-card', 'wrapped-2024.png');
}

function captureMusicCard() {
    // Page 3 - Capture full container
    captureElement('#page-3-container', 'our-song.png');
}

function captureGreetingCard() {
    // Page 4 - Capture full container
    captureElement('#page-4-container', 'valentine-card.png');
}

function captureQuizCard() {
    // Page 5 - Capture full container with decorations
    captureElement('#page-5-container', 'quiz-result.png');
}

function captureGallery() {
    // Page 6 - Capture full container
    captureElement('#page-6-container', 'memory-gallery.png');
}

function captureLetter() {
    // Page 8 - Capture full container
    captureElement('#page-8-container', 'heartfelt-letter.png');
}
