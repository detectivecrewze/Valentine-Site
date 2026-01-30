/**
 * Map Picker Module
 * Handles Interactive Map Selection using Leaflet.js
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

        // Close results on outside click
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !document.getElementById('mapSearchResults').contains(e.target)) {
                this.hideResults();
            }
        });
    },

    // Open picker for a specific location index
    open(index) {
        this.currentIndex = index;
        const modal = document.getElementById('mapPickerModal');
        modal.classList.remove('hidden');

        // Clear search
        const searchInput = document.getElementById('mapSearchInput');
        if (searchInput) searchInput.value = '';
        this.hideResults();

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

    // Search for location name with autocomplete results
    async search(isFinal = false) {
        const queryInput = document.getElementById('mapSearchInput');
        const query = queryInput ? queryInput.value.trim() : '';
        if (query.length < 3) {
            this.hideResults();
            return;
        }

        try {
            // Get up to 10 results for suggestions (Locked to Indonesia with countrycodes=id)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&countrycodes=id`, {
                headers: { 'User-Agent': 'ValentineGiftApp/1.0' }
            });
            const data = await response.json();

            if (data && data.length > 0) {
                this.showResults(data);

                // If user pressed ENTER or clicked SEARCH, pick the first one automatically too
                if (isFinal) {
                    this.selectResult(data[0]);
                }
            } else if (isFinal) {
                utils.showNotification('Location not found', 'error');
                this.hideResults();
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    },

    showResults(results) {
        const container = document.getElementById('mapSearchResults');
        container.innerHTML = results.map(res => `
            <div class="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 flex items-start gap-3 transition-colors"
                onclick="mapPicker.selectResult(${JSON.stringify(res).replace(/"/g, '&quot;')})">
                <span class="material-symbols-outlined text-gray-400 text-lg mt-0.5">location_on</span>
                <div>
                    <div class="text-sm font-bold text-gray-900">${this.formatResultTitle(res)}</div>
                    <div class="text-[11px] text-gray-500 line-clamp-1">${res.display_name}</div>
                </div>
            </div>
        `).join('');
        container.classList.remove('hidden');
    },

    hideResults() {
        const container = document.getElementById('mapSearchResults');
        if (container) container.classList.add('hidden');
    },

    formatResultTitle(res) {
        const addr = res.address;
        if (addr.amenity) return addr.amenity;
        if (addr.building) return addr.building;
        if (addr.road) {
            let title = addr.road;
            if (addr.house_number) title = addr.house_number + ' ' + title;
            return title;
        }
        if (addr.village || addr.suburb || addr.city_district) return addr.village || addr.suburb || addr.city_district;
        return res.display_name.split(',')[0];
    },

    selectResult(res) {
        const latlng = { lat: parseFloat(res.lat), lng: parseFloat(res.lon) };
        this.map.setView(latlng, 15);
        this.setMarker(latlng);
        this.hideResults();

        // Update input field text to the name
        const input = document.getElementById('mapSearchInput');
        if (input) input.value = this.formatResultTitle(res);
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
