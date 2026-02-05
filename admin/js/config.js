// Configuration for wizard steps and page types

const PAGE_TYPES = {
    'login': {
        id: 'page-1',
        name: 'Login',
        icon: 'lock',
        required: true,
        description: 'Entry & Countdown'
    },
    'greeting': {
        id: 'page-2',
        name: 'Greeting Card',
        icon: 'favorite',
        required: false,
        description: 'Personalized greeting message'
    },
    'music': {
        id: 'page-3',
        name: 'Music Player',
        icon: 'music_note',
        required: false,
        description: 'Curated music collection'
    },
    'wrapped': {
        id: 'page-4',
        name: 'Our Vibe (Wrapped)',
        icon: 'auto_awesome',
        required: false,
        description: 'Wrapped-style highlights'
    },
    'quiz': {
        id: 'page-5',
        name: 'Love Quiz',
        icon: 'quiz',
        required: false,
        description: 'Personalized trivia game'
    },
    'gallery': {
        id: 'page-6',
        name: 'Photo Gallery',
        icon: 'photo_library',
        required: false,
        description: 'Scratch-to-reveal memories'
    },
    'map': {
        id: 'page-7',
        name: 'Memory Map',
        icon: 'map',
        required: false,
        description: 'Interactive location markers'
    },
    'letter': {
        id: 'page-8',
        name: 'Love Letter',
        icon: 'mail',
        required: false,
        description: 'Handwritten-style message'
    },
    'lock': {
        id: 'page-9',
        name: 'The Final Lock',
        icon: 'lock_person',
        required: false,
        description: 'Lock your love forever'
    },
    'infinity': {
        id: 'page-10',
        name: 'Infinity Scroll',
        icon: 'all_inclusive',
        required: false,
        description: 'Endless reasons I love you'
    }
};

// Theme presets
const THEME_PRESETS = {
    vintage: {
        name: 'Vintage Romance',
        bg: '',
        color: '#F5E6D3',
        fontDisplay: 'Playfair Display, serif',
        fontSans: 'Poppins, sans-serif',
        particles: 'dust',
        gradient: 'linear-gradient(135deg, #F5E6D3 0%, #E8D5C4 100%)'
    },
    modern: {
        name: 'Modern Minimal',
        bg: '',
        color: '#FFFFFF',
        fontDisplay: 'Montserrat, sans-serif',
        fontSans: 'Inter, sans-serif',
        particles: 'none',
        gradient: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
    },
    romantic: {
        name: 'Romantic Dreams',
        bg: '',
        color: '#FFE5EC',
        fontDisplay: 'Great Vibes, cursive',
        fontSans: 'Poppins, sans-serif',
        particles: 'hearts',
        gradient: 'linear-gradient(135deg, #FFE5EC 0%, #FFC2D1 100%)'
    },
    elegant: {
        name: 'Elegant Night',
        bg: '',
        color: '#1A1A2E',
        fontDisplay: 'Cinzel, serif',
        fontSans: 'Cormorant Garamond, serif',
        particles: 'stars',
        gradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 100%)'
    },
    playful: {
        name: 'Playful & Fun',
        bg: '',
        color: '#FFF8DC',
        fontDisplay: 'Pacifico, cursive',
        fontSans: 'Poppins, sans-serif',
        particles: 'bubbles',
        gradient: 'linear-gradient(135deg, #FFF8DC 0%, #FFE4B5 100%)'
    },
    coffee: {
        name: 'Coffee House',
        bg: '',
        color: '#D7CCC8',
        fontDisplay: 'Lobster, cursive',
        fontSans: 'Roboto, sans-serif',
        particles: 'none',
        gradient: 'linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%)'
    }
};

// Default page configuration
const DEFAULT_PAGE_CONFIG = {
    pages: {
        'page-1': { id: 'page-1', name: 'Login', type: 'login', enabled: true, required: true, icon: 'lock', order: 1 },
        'page-2': { id: 'page-2', name: 'Greeting Card', type: 'greeting', enabled: true, required: false, icon: 'favorite', order: 2 },
        'page-3': { id: 'page-3', name: 'Music Player', type: 'music', enabled: true, required: false, icon: 'music_note', order: 3 },
        'page-4': { id: 'page-4', name: 'Our Vibe (Wrapped)', type: 'wrapped', enabled: true, required: false, icon: 'auto_awesome', order: 4 },
        'page-5': { id: 'page-5', name: 'Love Quiz', type: 'quiz', enabled: true, required: false, icon: 'quiz', order: 5 },
        'page-6': { id: 'page-6', name: 'Photo Gallery', type: 'gallery', enabled: true, required: false, icon: 'photo_library', order: 6 },
        'page-7': { id: 'page-7', name: 'Memory Map', type: 'map', enabled: true, required: false, icon: 'map', order: 7 },
        'page-8': { id: 'page-8', name: 'Love Letter', type: 'letter', enabled: true, required: false, icon: 'mail', order: 8 },
        'page-9': { id: 'page-9', name: 'The Final Lock', type: 'lock', enabled: true, required: false, icon: 'lock_person', order: 9 },
        'page-10': { id: 'page-10', name: 'Infinity Scroll', type: 'infinity', enabled: true, required: false, icon: 'all_inclusive', order: 10 }
    }
};

// Wizard step configuration
const WIZARD_STEPS = {
    SETUP: 'setup',
    PAGE_MANAGER: 'page-manager',
    // Dynamic steps for each enabled page
};

// Storage key
const LS_KEY = 'valentine_admin_v2';
