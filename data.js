const CONFIG = {
    "theme": {
        "backgroundColor": "#ffe5ec",
        "fontDisplay": "Cinzel, serif",
        "fontSans": "Poppins, sans-serif",
        "particles": "hearts",
        "backgroundImage": ""
    },
    "navigation": {
        "showPageIndicator": true,
        "enableSwipe": true
    },
    "login": {
        "password": "123",
        "errorMessage": "Incorrect password, try again!",
        "collectionText": "For you, Always",
        "title": "Key to My Heart",
        "instruction": "Enter the secret password",
        "placeholder": "*your secret word...*"
    },
    "countdown": {
        "targetDate": "2026-02-14T22:00:00Z",
        "finishMessage": "It's Time! ❤️",
        "finishLabel": "Happy Valentine's Day!"
    },
    "greeting": {
        "title": "Happy Valentine's Day",
        "message": "I make tihs for you, since i really like you..",
        "imageSrc": "https://valentine-upload.aldoramadhan16.workers.dev/1769774982083-5s8pwm.jpg",
        "signature": "With all my love",
        "footerText": "♥"
    },
    "wrapped": {
        "vibeLabel": "Our Vibe",
        "vibe": "Bonnie & Clyde",
        "HoursTogetherLabel": "Minutes Together",
        "HoursTogether": "525,600",
        "imageSrc": "https://valentine-upload.aldoramadhan16.workers.dev/1769734795217-t4uwbr.jpg",
        "topPlacesLabel": "Top Places We've Been",
        "topPlaces": [
            "The Sunset Pier ",
            "Corner Bakery",
            "Botanical Garden"
        ],
        "coreMemoriesLabel": "Core Memories",
        "coreMemories": [
            "The Rainy Hike",
            "First Road Trip",
            "Cooking Fail"
        ]
    },
    "quiz": {
        "title": "How Well Do You Know Me?",
        "questions": [
            {
                "question": "Where was our very first date?",
                "options": [
                    "Starbucks",
                    "Cinema",
                    "Park",
                    "Restaurant"
                ],
                "correctIndex": 0,
                "correctMessage": "You remembered! ❤️",
                "wrongMessage": "Try again!"
            }
        ],
        "resultMessage": "You know me so well! ❤️"
    },
    "music": [
        {
            "songTitle": "Selfless",
            "artist": "The Strokes",
            "audioSrc": "https://valentine-upload.aldoramadhan16.workers.dev/1769735240679-4bfqv9.mp3",
            "coverSrc": "assets/cover1.jpg",
            "lyrics": "Life is too short..."
        },
        {
            "songTitle": "Ivy",
            "artist": "Frank Ocean",
            "audioSrc": "https://valentine-upload.aldoramadhan16.workers.dev/1769773133105-34968d.mp3",
            "coverSrc": "assets/cover2.jpg",
            "lyrics": "I thought that I was dreaming when you said that you loves me.."
        }
    ],
    "musicSectionTitle": "Our Playlist",
    "gallery": {
        "title": "Our Memories",
        "subtitle": "Scratch to reveal",
        "memories": [
            {
                "type": "image",
                "src": "https://valentine-upload.aldoramadhan16.workers.dev/1769735546102-he5o65.jpg",
                "caption": "Our first coffee",
                "tape": "washi-tape-gold",
                "rotation": "rotate-2"
            },
            {
                "type": "image",
                "src": "https://valentine-upload.aldoramadhan16.workers.dev/1769775028037-lwf5q.jpg",
                "caption": "",
                "tape": "washi-tape",
                "rotation": "rotate-2"
            }
        ]
    },
    "map": {
        "title": "The Atlas of Us",
        "description": "Every pin is a heartbeat, every line a path we walked together.",
        "locations": [
            {
                "coordinates": [
                    -6.24625885,
                    106.991355
                ],
                "title": "Where we first met",
                "memory": "The air was sweet...",
                "date": "2020-01-20",
                "imageSrc": "https://valentine-upload.aldoramadhan16.workers.dev/1769735563998-z1hev.jpg",
                "icon": "favorite"
            }
        ]
    },
    "letter": {
        "recipientName": "Dearest Love",
        "message": "I find myself sitting here, thinking about all the moments we've shared...",
        "signature": "Your Favorite Person",
        "finaleChoice": "choice"
    },
    "lock": {
        "initials": "A + B",
        "instruction": "Click to lock our love forever...",
        "finalMessage": "Safely locked in my heart. Always."
    },
    "infinityScroll": {
        "headerTitle": "I love you because...",
        "headerSubtitle": "An endless collection of reasons",
        "reasons": {
            "generic": [
                "...your smile lights up the room",
                "...you make me a better person"
            ],
            "personal": [
                "...of how we met that one rainy day"
            ],
            "poetic": [
                "...you are the melody to my song"
            ]
        },
        "photos": [
            {
                "src": "https://valentine-upload.aldoramadhan16.workers.dev/1769789202159-7uqa2b.png",
                "caption": ""
            },
            {
                "src": "https://valentine-upload.aldoramadhan16.workers.dev/1769789221789-206zr.jpg",
                "caption": ""
            }
        ]
    },
    "metadata": {
        "brandName": "For you, Always",
        "brandIcon": "diamond",
        "customerName": "",
        "generatedAt": "2026-01-30T20:24:42.868Z"
    },
    "adminLang": "en",
    "currentStep": 9,
    "pageConfig": {
        "pages": {
            "page-1": {
                "id": "page-1",
                "name": "Login",
                "type": "login",
                "enabled": true,
                "required": true,
                "icon": "lock",
                "order": 1
            },
            "page-2": {
                "id": "page-2",
                "name": "Greeting Card",
                "type": "greeting",
                "enabled": true,
                "required": false,
                "icon": "favorite",
                "order": 2
            },
            "page-3": {
                "id": "page-3",
                "name": "Music Player",
                "type": "music",
                "enabled": true,
                "required": false,
                "icon": "music_note",
                "order": 3
            },
            "page-4": {
                "id": "page-4",
                "name": "Our Wrapped",
                "type": "wrapped",
                "enabled": true,
                "required": false,
                "icon": "auto_awesome",
                "order": 4
            },
            "page-5": {
                "id": "page-5",
                "name": "Love Quiz",
                "type": "quiz",
                "enabled": true,
                "required": false,
                "icon": "quiz",
                "order": 5
            },
            "page-6": {
                "id": "page-6",
                "name": "Photo Gallery",
                "type": "gallery",
                "enabled": true,
                "required": false,
                "icon": "photo_library",
                "order": 6
            },
            "page-7": {
                "id": "page-7",
                "name": "Memory Map",
                "type": "map",
                "enabled": true,
                "required": false,
                "icon": "map",
                "order": 7
            },
            "page-8": {
                "id": "page-8",
                "name": "Love Letter",
                "type": "letter",
                "enabled": true,
                "required": false,
                "icon": "mail",
                "order": 8
            },
            "page-9": {
                "id": "page-9",
                "name": "Love Lock",
                "type": "lock",
                "enabled": false,
                "required": false,
                "icon": "lock_person",
                "order": 9
            },
            "page-10": {
                "id": "page-10",
                "name": "Infinity Scroll",
                "type": "infinity",
                "enabled": true,
                "required": false,
                "icon": "all_inclusive",
                "order": 10
            }
        }
    }
};