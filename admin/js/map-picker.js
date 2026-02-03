/**
 * Map Picker Module
 * Handles Interactive Map Selection using Leaflet.js
 * Features:
 * 1. Photon API Search (Better than Nominatim)
 * 2. Paste Google Maps Link Support
 * 3. Click on Map & Manual Coordinates
 */

const mapPicker = {
    map: null,
    marker: null,
    currentIndex: -1,
    selectedLatLng: null,
    searchDebounce: null,

    // Initialize map
    init() {
        if (this.map) return;

        // Create map instance
        this.map = L.map('leafletPickerContainer').setView([-6.2088, 106.8456], 13);

        // Add OSM tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(this.map);

        // Map click handler
        this.map.on('click', (e) => {
            this.setMarker(e.latlng);
            this.hideResults();
        });

        // Initialize search events
        const searchInput = document.getElementById('mapSearchInput');
        const gmapsInput = document.getElementById('gmapsLinkInput');

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.search(true); // Force search immediately
                }
            });

            // Live searching as you type
            searchInput.addEventListener('input', () => {
                if (this.searchDebounce) clearTimeout(this.searchDebounce);
                this.searchDebounce = setTimeout(() => this.search(false), 500);
            });
        }

        // Google Maps Link paste handler
        if (gmapsInput) {
            gmapsInput.addEventListener('input', () => {
                this.handleGoogleMapsLink(gmapsInput.value);
            });

            gmapsInput.addEventListener('paste', (e) => {
                setTimeout(() => {
                    this.handleGoogleMapsLink(gmapsInput.value);
                }, 100);
            });
        }

        // Close results on outside click
        document.addEventListener('click', (e) => {
            const searchInput = document.getElementById('mapSearchInput');
            const resultsContainer = document.getElementById('mapSearchResults');
            if (searchInput && resultsContainer) {
                if (!searchInput.contains(e.target) && !resultsContainer.contains(e.target)) {
                    this.hideResults();
                }
            }
        });
    },

    // Open picker for a specific location index
    open(index) {
        this.currentIndex = index;
        const modal = document.getElementById('mapPickerModal');
        modal.classList.remove('hidden');

        // Reset to Search tab
        this.switchTab('search');

        // Clear search inputs
        const searchInput = document.getElementById('mapSearchInput');
        const gmapsInput = document.getElementById('gmapsLinkInput');
        if (searchInput) searchInput.value = '';
        if (gmapsInput) {
            gmapsInput.value = '';
            gmapsInput.placeholder = 'Paste Google Maps link here (e.g., https://maps.app.goo.gl/...)';
        }
        this.hideResults();

        // Attach Google Maps link handler (fresh each time)
        this.attachGmapsHandler();

        // Initial map setup
        setTimeout(() => {
            this.init();
            this.map.invalidateSize();

            // If coordinates already exist, move to them
            const coordsInput = document.getElementById(`map-coords-${index}`);
            if (coordsInput && coordsInput.value.includes(',')) {
                const [lat, lng] = coordsInput.value.split(',').map(v => parseFloat(v.trim()));
                if (!isNaN(lat) && !isNaN(lng)) {
                    this.setMarker({ lat, lng });
                    this.map.setView([lat, lng], 15);
                } else {
                    this.resetMarker();
                }
            } else {
                this.resetMarker();
            }
        }, 100);
    },

    // Attach Google Maps link handler
    attachGmapsHandler() {
        const gmapsInput = document.getElementById('gmapsLinkInput');
        if (!gmapsInput) return;

        // Remove old listeners by cloning
        const newInput = gmapsInput.cloneNode(true);
        gmapsInput.parentNode.replaceChild(newInput, gmapsInput);

        // Add fresh event listeners
        newInput.addEventListener('input', (e) => {
            console.log('[MapPicker] GMaps input changed:', e.target.value);
            this.handleGoogleMapsLink(e.target.value);
        });

        newInput.addEventListener('paste', (e) => {
            setTimeout(() => {
                console.log('[MapPicker] GMaps paste detected:', newInput.value);
                this.handleGoogleMapsLink(newInput.value);
            }, 100);
        });
    },

    // Close picker
    close() {
        const modal = document.getElementById('mapPickerModal');
        modal.classList.add('hidden');
        this.currentIndex = -1;
    },

    // Set pin on map
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

    resetMarker() {
        if (this.marker) {
            this.map.removeLayer(this.marker);
            this.marker = null;
        }
        this.selectedLatLng = null;
        this.updateUI();
    },

    // Update Modal UI text/buttons
    async updateUI() {
        const text = document.getElementById('selectedLocationText');
        const btn = document.getElementById('confirmLocationBtn');

        if (this.selectedLatLng) {
            const { lat, lng } = this.selectedLatLng;
            text.textContent = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            text.classList.remove('italic', 'text-gray-400');
            btn.disabled = false;

            // Optional: Get Address from Nominatim (Reverse Geocoding)
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
                    headers: { 'User-Agent': 'ValentineGiftApp/1.0' }
                });
                const data = await response.json();
                if (data.display_name) {
                    text.textContent = data.display_name;
                }
            } catch (e) {
                console.warn('Reverse geocoding failed');
            }
        } else {
            text.textContent = 'Click on map to pick...';
            text.classList.add('italic', 'text-gray-400');
            btn.disabled = true;
        }
    },

    // =============================================
    // PHOTON API SEARCH (Upgraded from Nominatim)
    // =============================================
    async search(isFinal = false) {
        const queryInput = document.getElementById('mapSearchInput');
        const query = queryInput ? queryInput.value.trim() : '';
        if (query.length < 3) {
            this.hideResults();
            return;
        }

        try {
            // Use Photon API - much faster and smarter than Nominatim
            // Bias search towards Indonesia (Jakarta coordinates)
            const response = await fetch(
                `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=10&lat=-6.2&lon=106.8&lang=en`,
                { headers: { 'Accept': 'application/json' } }
            );
            const data = await response.json();

            if (data && data.features && data.features.length > 0) {
                this.showResults(data.features);

                // If user pressed ENTER or clicked SEARCH, pick the first one automatically
                if (isFinal) {
                    this.selectPhotonResult(data.features[0]);
                }
            } else if (isFinal) {
                utils.showNotification('Location not found', 'error');
                this.hideResults();
            }
        } catch (error) {
            console.error('Search failed:', error);
            // Fallback to Nominatim if Photon fails
            this.searchNominatim(query, isFinal);
        }
    },

    // Fallback search using Nominatim
    async searchNominatim(query, isFinal) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1`,
                { headers: { 'User-Agent': 'ValentineGiftApp/1.0' } }
            );
            const data = await response.json();

            if (data && data.length > 0) {
                // Convert to Photon-like format for consistency
                const features = data.map(item => ({
                    geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
                    properties: {
                        name: item.display_name.split(',')[0],
                        city: item.address?.city || item.address?.town || '',
                        country: item.address?.country || '',
                        osm_value: item.type
                    }
                }));
                this.showResults(features);

                if (isFinal) {
                    this.selectPhotonResult(features[0]);
                }
            } else if (isFinal) {
                utils.showNotification('Location not found', 'error');
                this.hideResults();
            }
        } catch (error) {
            console.error('Nominatim fallback failed:', error);
        }
    },

    showResults(results) {
        const container = document.getElementById('mapSearchResults');
        container.innerHTML = results.map((res, idx) => `
            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                onclick='mapPicker.selectPhotonResult(${JSON.stringify(res).replace(/'/g, "&#39;")})'>
                <span class="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                <div>
                    <div class="text-sm font-bold text-gray-900">${this.formatPhotonTitle(res)}</div>
                    <div class="text-[11px] text-gray-500 line-clamp-1">${this.formatPhotonSubtitle(res)}</div>
                </div>
            </div>
        `).join('');
        container.classList.remove('hidden');
    },

    hideResults() {
        const container = document.getElementById('mapSearchResults');
        if (container) container.classList.add('hidden');
    },

    formatPhotonTitle(res) {
        const props = res.properties || {};
        return props.name || props.street || props.city || 'Unknown Location';
    },

    formatPhotonSubtitle(res) {
        const props = res.properties || {};
        const parts = [];
        if (props.street) parts.push(props.street);
        if (props.city) parts.push(props.city);
        if (props.state) parts.push(props.state);
        if (props.country) parts.push(props.country);
        return parts.join(', ') || props.osm_value || '';
    },

    selectPhotonResult(res) {
        const coords = res.geometry.coordinates;
        const latlng = { lat: coords[1], lng: coords[0] }; // Photon uses [lng, lat]
        this.map.setView(latlng, 16);
        this.setMarker(latlng);
        this.hideResults();

        // Update input field text to the name
        const input = document.getElementById('mapSearchInput');
        if (input) input.value = this.formatPhotonTitle(res);
    },

    // =============================================
    // GOOGLE MAPS LINK PARSER
    // =============================================
    handleGoogleMapsLink(url) {
        console.log('[MapPicker] handleGoogleMapsLink called with:', url);

        if (!url || url.length < 5) {
            console.log('[MapPicker] Input too short, ignoring');
            return;
        }

        // First, try to parse as raw coordinates (e.g., "-6.175, 106.824")
        const rawCoords = this.parseRawCoordinates(url);
        if (rawCoords) {
            console.log('[MapPicker] Raw coordinates detected:', rawCoords);
            this.applyCoordinates(rawCoords);
            return;
        }

        // Check if it's a short link that needs expansion
        if (url.includes('maps.app.goo.gl') || url.includes('goo.gl/maps')) {
            console.log('[MapPicker] Short link detected, showing instructions');
            this.showShortLinkHelp();
            return;
        }

        const coords = this.extractCoordsFromGoogleMapsLink(url);
        console.log('[MapPicker] Extracted coordinates:', coords);

        if (coords) {
            const latlng = { lat: coords.lat, lng: coords.lng };
            console.log('[MapPicker] Setting map view to:', latlng);

            // Make sure map exists
            if (!this.map) {
                console.error('[MapPicker] Map not initialized!');
                utils.showNotification('Map not ready, please try again', 'error');
                return;
            }

            this.map.setView(latlng, 16);
            this.setMarker(latlng);
            utils.showNotification('📍 Location detected from link!', 'success');

            // Clear the link input after success
            const gmapsInput = document.getElementById('gmapsLinkInput');
            if (gmapsInput) {
                gmapsInput.value = '';
                gmapsInput.placeholder = '✓ Location set! Paste another link...';
            }
        } else {
            console.log('[MapPicker] Could not extract coordinates from URL');
            // Show help message
            if (url.includes('google.com/maps') || url.includes('google.co')) {
                utils.showNotification('Could not extract location. Make sure the URL contains coordinates.', 'error');
            }
        }
    },

    // Show help modal for short links
    showShortLinkHelp() {
        const helpMessage = `
            <div style="text-align:left; font-size: 13px; line-height: 1.6;">
                <p style="margin-bottom: 12px;"><strong>⚠️ Short links tidak mengandung koordinat.</strong></p>
                <p style="margin-bottom: 8px;">Untuk mendapatkan link yang benar, ikuti langkah ini:</p>
                <ol style="margin-left: 20px; margin-bottom: 12px;">
                    <li>Buka <strong>Google Maps</strong> di browser (bukan app)</li>
                    <li>Cari lokasi yang diinginkan</li>
                    <li>Copy URL dari <strong>address bar browser</strong></li>
                    <li>Paste URL tersebut di sini</li>
                </ol>
                <p style="font-size: 11px; color: #666;">Contoh URL yang benar:<br>
                <code style="background:#f0f0f0; padding:2px 6px; border-radius:4px; font-size:10px;">https://www.google.com/maps/@-6.2088,106.8456,15z</code></p>
            </div>
        `;

        // Create a simple modal/tooltip
        let helpModal = document.getElementById('shortLinkHelpModal');
        if (!helpModal) {
            helpModal = document.createElement('div');
            helpModal.id = 'shortLinkHelpModal';
            helpModal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 24px;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
                z-index: 500;
                max-width: 400px;
                border: 1px solid #e5e7eb;
            `;
            document.body.appendChild(helpModal);
        }

        helpModal.innerHTML = `
            ${helpMessage}
            <button onclick="document.getElementById('shortLinkHelpModal').remove()" 
                style="margin-top: 16px; width: 100%; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; border: none; cursor: pointer;">
                Mengerti
            </button>
        `;
        helpModal.classList.remove('hidden');

        // Also clear the input
        const gmapsInput = document.getElementById('gmapsLinkInput');
        if (gmapsInput) {
            gmapsInput.value = '';
        }
    },

    // Parse raw coordinates like "-6.175, 106.824" or "-6.175392, 106.8249587"
    parseRawCoordinates(input) {
        // Clean up input
        const cleaned = input.trim();

        // Pattern: lat, lng (with optional spaces)
        // Examples: "-6.175, 106.824", "-6.175,106.824", "-6.175 106.824"
        const pattern = /^(-?\d{1,3}\.\d+)[,\s]+(-?\d{1,3}\.\d+)$/;
        const match = cleaned.match(pattern);

        if (match) {
            const lat = parseFloat(match[1]);
            const lng = parseFloat(match[2]);

            // Validate coordinates are in valid range
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                return { lat, lng };
            }
        }

        return null;
    },

    // Apply coordinates to the map
    applyCoordinates(coords) {
        const latlng = { lat: coords.lat, lng: coords.lng };

        // Make sure map exists
        if (!this.map) {
            console.error('[MapPicker] Map not initialized!');
            utils.showNotification('Map not ready, please try again', 'error');
            return;
        }

        this.map.setView(latlng, 16);
        this.setMarker(latlng);
        utils.showNotification('📍 Koordinat berhasil diterapkan!', 'success');

        // Clear the link input after success
        const gmapsInput = document.getElementById('gmapsLinkInput');
        if (gmapsInput) {
            gmapsInput.value = '';
            gmapsInput.placeholder = '✓ Lokasi sudah diset!';
        }
    },

    extractCoordsFromGoogleMapsLink(url) {
        // Pattern 1: https://www.google.com/maps/place/.../@-6.1234,106.5678,17z/...
        // Pattern 2: https://www.google.com/maps?q=-6.1234,106.5678
        // Pattern 3: https://maps.app.goo.gl/... (short link - harder to parse)
        // Pattern 4: https://goo.gl/maps/... (old short link)
        // Pattern 5: geo:-6.1234,106.5678 (geo URI)

        let lat, lng;

        // Try Pattern 1: /@lat,lng format
        const pattern1 = /@(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        const match1 = url.match(pattern1);
        if (match1) {
            lat = parseFloat(match1[1]);
            lng = parseFloat(match1[2]);
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }

        // Try Pattern 2: ?q=lat,lng or &q=lat,lng
        const pattern2 = /[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        const match2 = url.match(pattern2);
        if (match2) {
            lat = parseFloat(match2[1]);
            lng = parseFloat(match2[2]);
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }

        // Try Pattern 3: ll=lat,lng
        const pattern3 = /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        const match3 = url.match(pattern3);
        if (match3) {
            lat = parseFloat(match3[1]);
            lng = parseFloat(match3[2]);
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }

        // Try Pattern 4: /place/lat,lng or just lat,lng anywhere
        const pattern4 = /(-?\d{1,3}\.\d{4,}),\s*(-?\d{1,3}\.\d{4,})/;
        const match4 = url.match(pattern4);
        if (match4) {
            lat = parseFloat(match4[1]);
            lng = parseFloat(match4[2]);
            // Validate it looks like real coordinates
            if (!isNaN(lat) && !isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
                return { lat, lng };
            }
        }

        // Try Pattern 5: geo: URI
        const pattern5 = /geo:(-?\d+\.?\d*),(-?\d+\.?\d*)/;
        const match5 = url.match(pattern5);
        if (match5) {
            lat = parseFloat(match5[1]);
            lng = parseFloat(match5[2]);
            if (!isNaN(lat) && !isNaN(lng)) return { lat, lng };
        }

        return null; // Could not extract
    },

    // =============================================
    // TAB SWITCHING
    // =============================================
    switchTab(tab) {
        const searchTab = document.getElementById('tabSearch');
        const pasteTab = document.getElementById('tabPasteLink');
        const searchContent = document.getElementById('searchTabContent');
        const pasteContent = document.getElementById('pasteTabContent');

        // Safety check
        if (!searchTab || !pasteTab || !searchContent || !pasteContent) return;

        if (tab === 'search') {
            // Activate Search tab
            searchTab.className = 'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white border-2 border-blue-500 text-blue-600 shadow-sm';
            pasteTab.className = 'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white border border-gray-200 text-gray-500 hover:border-gray-300';
            searchContent.classList.remove('hidden');
            pasteContent.classList.add('hidden');
        } else {
            // Activate Paste Link tab
            pasteTab.className = 'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white border-2 border-green-500 text-green-600 shadow-sm';
            searchTab.className = 'flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all bg-white border border-gray-200 text-gray-500 hover:border-gray-300';
            pasteContent.classList.remove('hidden');
            searchContent.classList.add('hidden');

            // Re-attach handler when switching to paste tab
            this.attachGmapsHandler();
        }
    },

    // Confirm selection and update state
    confirm() {
        if (!this.selectedLatLng || this.currentIndex === -1) return;

        const { lat, lng } = this.selectedLatLng;
        const coordsStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

        // Update DOM
        const input = document.getElementById(`map-coords-${this.currentIndex}`);
        if (input) {
            input.value = coordsStr;
            input.dispatchEvent(new Event('input'));
        }

        // Update State
        renderers.handleMapCoordinates(this.currentIndex, coordsStr);

        this.close();
        utils.showNotification('Location updated!', 'success');
    }
};

window.mapPicker = mapPicker;
