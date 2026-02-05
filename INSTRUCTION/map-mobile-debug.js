// ========================================
// MAP MOBILE DEBUG SCRIPT
// Jalankan di Browser Console (Mobile)
// ========================================

/**
 * CARA MENGGUNAKAN:
 * 
 * 1. Buka website di mobile browser (Chrome/Safari)
 * 2. Navigasi ke page-7 (Map page)
 * 3. Buka browser console:
 *    - Chrome Android: chrome://inspect atau Remote Debugging via PC
 *    - Safari iOS: Connect to Mac > Safari > Develop > [Device]
 * 4. Copy-paste SEMUA kode ini ke console
 * 5. Tekan Enter
 * 6. Lihat hasil diagnosis
 */

(function() {
    console.log('========================================');
    console.log('🔍 MAP MOBILE DIAGNOSTIC TOOL');
    console.log('========================================');
    
    const results = {
        errors: [],
        warnings: [],
        info: [],
        fixes: []
    };
    
    // Test 1: Check if map element exists
    console.log('\n📍 Test 1: Checking map element...');
    const mapEl = document.getElementById('map');
    if (!mapEl) {
        results.errors.push('Map element (#map) NOT FOUND!');
    } else {
        results.info.push('✓ Map element found');
        
        // Get computed styles
        const mapStyles = window.getComputedStyle(mapEl);
        console.log('  Touch-action:', mapStyles.touchAction);
        console.log('  Pointer-events:', mapStyles.pointerEvents);
        console.log('  Z-index:', mapStyles.zIndex);
        console.log('  Position:', mapStyles.position);
        console.log('  Width:', mapStyles.width);
        console.log('  Height:', mapStyles.height);
        
        if (mapStyles.pointerEvents === 'none') {
            results.errors.push('Map has pointer-events: none!');
            results.fixes.push('mapEl.style.pointerEvents = "auto"');
        }
        
        if (mapStyles.touchAction === 'none') {
            results.warnings.push('Map has touch-action: none');
            results.fixes.push('mapEl.style.touchAction = "pan-x pan-y"');
        }
    }
    
    // Test 2: Check Leaflet container
    console.log('\n🗺️  Test 2: Checking Leaflet container...');
    const leafletContainer = document.querySelector('.leaflet-container');
    if (!leafletContainer) {
        results.errors.push('Leaflet container NOT FOUND!');
    } else {
        results.info.push('✓ Leaflet container found');
        
        const leafletStyles = window.getComputedStyle(leafletContainer);
        console.log('  Touch-action:', leafletStyles.touchAction);
        console.log('  Pointer-events:', leafletStyles.pointerEvents);
        console.log('  Cursor:', leafletStyles.cursor);
        
        if (leafletStyles.pointerEvents === 'none') {
            results.errors.push('Leaflet container has pointer-events: none!');
            results.fixes.push('leafletContainer.style.pointerEvents = "auto"');
        }
    }
    
    // Test 3: Check for blocking overlays
    console.log('\n🚫 Test 3: Checking for blocking overlays...');
    const blockingSelectors = [
        '.grain-overlay',
        '#particle-container',
        '.map-loading-overlay'
    ];
    
    blockingSelectors.forEach(selector => {
        const elements = document.querySelectorAll('#page-7 ' + selector);
        elements.forEach((el, idx) => {
            const styles = window.getComputedStyle(el);
            const isBlocking = styles.pointerEvents !== 'none' && styles.display !== 'none';
            
            if (isBlocking) {
                results.warnings.push(`${selector} [${idx}] is BLOCKING (pointer-events: ${styles.pointerEvents})`);
                results.fixes.push(`document.querySelector('${selector}').style.pointerEvents = 'none'`);
            } else {
                results.info.push(`✓ ${selector} [${idx}] is not blocking`);
            }
        });
    });
    
    // Test 4: Check absolute positioned elements
    console.log('\n📦 Test 4: Checking absolute positioned elements...');
    const page7 = document.getElementById('page-7') || document.getElementById('page-7-container');
    if (page7) {
        const absolutes = page7.querySelectorAll('.absolute, [style*="position: absolute"], [style*="position:absolute"]');
        console.log('  Found', absolutes.length, 'absolute elements');
        
        absolutes.forEach((el, idx) => {
            const styles = window.getComputedStyle(el);
            const isBlocking = styles.pointerEvents !== 'none' && 
                               !el.classList.contains('leaflet-control') &&
                               !el.classList.contains('leaflet-popup') &&
                               !el.classList.contains('nav-bottom-grid');
            
            if (isBlocking) {
                const zIndex = styles.zIndex;
                const mapZIndex = mapEl ? window.getComputedStyle(mapEl).zIndex : '0';
                
                if (parseInt(zIndex) > parseInt(mapZIndex)) {
                    results.warnings.push(`Absolute element [${idx}] (class: ${el.className}) has higher z-index (${zIndex}) than map (${mapZIndex})`);
                }
            }
        });
    }
    
    // Test 5: Check map instance
    console.log('\n🌍 Test 5: Checking map instance...');
    if (typeof window.mapInstance !== 'undefined' && window.mapInstance) {
        results.info.push('✓ Map instance exists');
        console.log('  Map center:', window.mapInstance.getCenter());
        console.log('  Map zoom:', window.mapInstance.getZoom());
        
        // Check handlers
        if (window.mapInstance._handlers) {
            const handlers = Object.keys(window.mapInstance._handlers);
            console.log('  Handlers:', handlers.join(', '));
            
            handlers.forEach(key => {
                const handler = window.mapInstance._handlers[key];
                if (handler && handler.enabled) {
                    console.log(`    ${key}: ${handler.enabled() ? 'ENABLED' : 'DISABLED'}`);
                }
            });
        }
    } else {
        results.errors.push('Map instance NOT FOUND!');
    }
    
    // Test 6: Touch capability
    console.log('\n👆 Test 6: Checking touch capability...');
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        results.info.push('✓ Touch events supported');
        console.log('  Max touch points:', navigator.maxTouchPoints);
    } else {
        results.warnings.push('Touch events not detected (might be desktop)');
    }
    
    // Test 7: Check z-index hierarchy
    console.log('\n📊 Test 7: Z-index hierarchy...');
    const elementsToCheck = [
        { selector: '#map', name: 'Map' },
        { selector: '.leaflet-container', name: 'Leaflet Container' },
        { selector: '.grain-overlay', name: 'Grain Overlay' },
        { selector: '#particle-container', name: 'Particles' },
        { selector: '.nav-bottom-grid', name: 'Navigation' }
    ];
    
    elementsToCheck.forEach(({ selector, name }) => {
        const el = document.querySelector('#page-7 ' + selector) || document.querySelector(selector);
        if (el) {
            const zIndex = window.getComputedStyle(el).zIndex;
            console.log(`  ${name}: z-index ${zIndex}`);
        }
    });
    
    // PRINT RESULTS
    console.log('\n========================================');
    console.log('📋 DIAGNOSTIC RESULTS');
    console.log('========================================');
    
    if (results.errors.length > 0) {
        console.log('\n❌ ERRORS:', results.errors.length);
        results.errors.forEach((err, idx) => {
            console.log(`  ${idx + 1}. ${err}`);
        });
    }
    
    if (results.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:', results.warnings.length);
        results.warnings.forEach((warn, idx) => {
            console.log(`  ${idx + 1}. ${warn}`);
        });
    }
    
    if (results.info.length > 0) {
        console.log('\n✓ INFO:', results.info.length);
        results.info.forEach((info, idx) => {
            console.log(`  ${idx + 1}. ${info}`);
        });
    }
    
    // AUTO-FIX SUGGESTIONS
    if (results.fixes.length > 0) {
        console.log('\n========================================');
        console.log('🔧 AUTO-FIX COMMANDS');
        console.log('========================================');
        console.log('Copy and run these commands to fix issues:\n');
        
        results.fixes.forEach((fix, idx) => {
            console.log(`${idx + 1}. ${fix};`);
        });
        
        console.log('\n--- OR RUN ALL FIXES AT ONCE ---');
        console.log('Copy and paste this:');
        console.log(results.fixes.join('; ') + ';');
    }
    
    // GENERATE AUTO-FIX FUNCTION
    window.autoFixMap = function() {
        console.log('🔧 Running auto-fix...');
        
        const mapEl = document.getElementById('map');
        const leafletContainer = document.querySelector('.leaflet-container');
        
        if (mapEl) {
            mapEl.style.pointerEvents = 'auto';
            mapEl.style.touchAction = 'pan-x pan-y';
            mapEl.style.zIndex = '1';
            mapEl.style.position = 'relative';
        }
        
        if (leafletContainer) {
            leafletContainer.style.pointerEvents = 'auto';
            leafletContainer.style.touchAction = 'pan-x pan-y';
        }
        
        // Disable overlays
        document.querySelectorAll('#page-7 .grain-overlay, #page-7 #particle-container').forEach(el => {
            el.style.pointerEvents = 'none';
            el.style.zIndex = '0';
        });
        
        // Disable blocking absolutes
        const page7 = document.getElementById('page-7') || document.getElementById('page-7-container');
        if (page7) {
            const absolutes = page7.querySelectorAll('.absolute');
            absolutes.forEach(el => {
                if (!el.classList.contains('leaflet-control') &&
                    !el.classList.contains('leaflet-popup') &&
                    !el.classList.contains('nav-bottom-grid') &&
                    !el.classList.contains('nav-camera-btn')) {
                    el.style.pointerEvents = 'none';
                }
            });
        }
        
        // Re-enable Leaflet handlers
        if (window.mapInstance && window.mapInstance._handlers) {
            Object.keys(window.mapInstance._handlers).forEach(key => {
                const handler = window.mapInstance._handlers[key];
                if (handler && handler.enable) {
                    handler.enable();
                }
            });
        }
        
        // Invalidate size
        if (window.mapInstance) {
            window.mapInstance.invalidateSize();
        }
        
        console.log('✅ Auto-fix complete! Try interacting with the map now.');
    };
    
    console.log('\n========================================');
    console.log('💡 QUICK FIX');
    console.log('========================================');
    console.log('To auto-fix all issues, run:');
    console.log('  autoFixMap()');
    console.log('\nThen try touching the map!');
    console.log('========================================\n');
    
})();
