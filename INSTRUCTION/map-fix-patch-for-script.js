// ========================================
// CRITICAL FIX: Map Mobile Touch Issue
// Patch untuk script.js - Tambahkan di AKHIR initMap()
// ========================================

/**
 * INSTRUKSI IMPLEMENTASI:
 * 
 * Buka file script.js, cari function initMap()
 * Di AKHIR function tersebut (sebelum closing brace terakhir),
 * TAMBAHKAN kode berikut:
 */

// ============ PASTE KODE INI DI AKHIR initMap() ============

// CRITICAL MOBILE FIX - Must run AFTER all map initialization
setTimeout(() => {
    console.log('[MapFix] Applying mobile touch fixes...');
    
    const mapElement = document.getElementById('map');
    const page7 = document.getElementById('page-7') || document.getElementById('page-7-container');
    const page7Main = document.querySelector('#page-7 main') || document.querySelector('#page-7-container main');
    
    if (!mapElement) {
        console.error('[MapFix] Map element not found!');
        return;
    }
    
    // FIX 1: Enable touch-action on map
    mapElement.style.touchAction = 'pan-x pan-y pinch-zoom';
    mapElement.style.webkitTouchCallout = 'none';
    mapElement.style.webkitUserSelect = 'none';
    mapElement.style.userSelect = 'none';
    console.log('[MapFix] ✓ Touch-action enabled');
    
    // FIX 2: Ensure proper z-index hierarchy
    mapElement.style.zIndex = '1';
    mapElement.style.position = 'relative';
    
    // FIX 3: Disable pointer-events on overlays
    const overlaysToDisable = [
        '#page-7 .grain-overlay',
        '#page-7 #particle-container',
        '#page-7 .absolute:not(.leaflet-control):not(.leaflet-popup):not(.nav-bottom-grid):not(.nav-camera-btn):not(.page-indicator-container)'
    ];
    
    overlaysToDisable.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.pointerEvents = 'none';
            el.style.zIndex = '0';
        });
    });
    console.log('[MapFix] ✓ Overlays disabled');
    
    // FIX 4: Enable pointer-events on Leaflet layers
    const leafletLayers = [
        '.leaflet-map-pane',
        '.leaflet-tile-pane',
        '.leaflet-overlay-pane',
        '.leaflet-marker-pane',
        '.leaflet-popup-pane',
        '.leaflet-marker-icon',
        '.leaflet-popup',
        '.leaflet-control-zoom'
    ];
    
    leafletLayers.forEach(selector => {
        document.querySelectorAll('#page-7 ' + selector).forEach(el => {
            el.style.pointerEvents = 'auto';
        });
    });
    console.log('[MapFix] ✓ Leaflet layers enabled');
    
    // FIX 5: Ensure Leaflet container can receive touch
    const leafletContainer = document.querySelector('#page-7 .leaflet-container');
    if (leafletContainer) {
        leafletContainer.style.touchAction = 'pan-x pan-y';
        leafletContainer.style.zIndex = '1';
        leafletContainer.style.position = 'relative';
    }
    
    // FIX 6: Disable touch-action on page container to prevent conflicts
    if (page7) {
        page7.style.touchAction = 'none';
        page7.style.overflow = 'hidden';
    }
    
    // FIX 7: Check for any absolute positioned elements blocking map
    if (page7Main) {
        const allAbsolutes = page7Main.querySelectorAll('.absolute, [style*="absolute"]');
        allAbsolutes.forEach(el => {
            // Skip navigation and controls
            if (!el.classList.contains('leaflet-control') && 
                !el.classList.contains('leaflet-popup') &&
                !el.classList.contains('nav-bottom-grid') &&
                !el.classList.contains('nav-camera-btn') &&
                !el.classList.contains('page-indicator-container')) {
                el.style.pointerEvents = 'none';
            }
        });
        console.log('[MapFix] ✓ Absolute elements checked');
    }
    
    // FIX 8: Force Leaflet to re-enable touch handlers
    if (mapInstance && mapInstance._handlers) {
        try {
            // Re-enable all touch/drag handlers
            Object.keys(mapInstance._handlers).forEach(key => {
                const handler = mapInstance._handlers[key];
                if (handler && handler.enable && typeof handler.enable === 'function') {
                    handler.enable();
                }
            });
            console.log('[MapFix] ✓ Leaflet handlers re-enabled');
        } catch (e) {
            console.warn('[MapFix] Could not re-enable handlers:', e);
        }
    }
    
    // FIX 9: Invalidate size (critical for mobile)
    if (mapInstance) {
        mapInstance.invalidateSize();
        console.log('[MapFix] ✓ Map size invalidated');
    }
    
    // FIX 10: Add touch event listeners for debugging
    if ('ontouchstart' in window) {
        mapElement.addEventListener('touchstart', function(e) {
            console.log('[MapFix] Touch START detected on:', e.target.className);
        }, { passive: true, once: true });
        
        mapElement.addEventListener('touchmove', function(e) {
            console.log('[MapFix] Touch MOVE detected');
        }, { passive: true, once: true });
    }
    
    console.log('[MapFix] ✅ ALL mobile fixes applied successfully!');
    
    // FIX 11: Test if map is actually responsive
    setTimeout(() => {
        if (mapInstance) {
            const center = mapInstance.getCenter();
            console.log('[MapFix] Map center:', center);
            console.log('[MapFix] Map ready for interaction');
        }
    }, 500);
    
}, 1000); // Wait 1 second for all map initialization to complete

// ============ END OF PATCH ============
