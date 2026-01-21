const CONFIG = {
    login: {
        password: "cintaislam1234512345",
        errorMessage: "Incorrect password, try again!",
        // Page 1 Content
        collectionText: "For you, Always",
        title: "Key to My Heart",
        instruction: "Enter the secret password",
        instruction: "Enter the secret password",
        placeholder: "*your secret word...*"
    },
    // Page 1: Countdown
    countdown: {
        targetDate: "2026-02-14T22:00:00+07:00", // ISO format: YYYY-MM-DDTHH:mm:ss+OFFSET
        finishMessage: "It's Time! ❤️",
        finishLabel: "Happy Valentine's Day!"
    },
    // Page 2: Relationship Wrapped
    wrapped: {
        topPlacesLabel: "Top Places",
        topPlaces: ["The Sunset Pier", "Corner Bakery", "Botanical Garden"],
        coreMemoriesLabel: "Core Memories",
        coreMemories: ["The Rainy Hike", "First Road Trip", "Cooking Fail"],
        HoursTogetherLabel: "Minutes Together",
        HoursTogether: "525,600",
        vibeLabel: "Our Vibe",
        vibe: "Bonnie & Clyde",

        imageSrc: "assets/images/photo2.jpg",
        footerLabel: "For you, Always"
    },
    // Page 3 Content
    greeting: {
        title: "Happy Valentine’s Day",
        message: "I made this little archive to celebrate us. A collection of moments, secrets, and reasons why I love you.",
        imageSrc: "https://lh3.googleusercontent.com/aida-public/AB6AXuDjCiPAZpKoZUPKq2k9RMl1HDqkC09tPS1hSbQyiLqcDJ5Deo2xRCOMH0-lL_rTLA_BI35XexOZBr_1e8GLZDu44iwCZ934eWq2N3iCjqZHzdaPLhjuXcqunh7oktZclBX3d25pMvwKQtQmCzC0QGvslEa_eVBJoCec5xjNveFEEPJpBgovtRVKa5rwNI0Hm0qqhUD9IIG-APqVy56MT94vC3rkmVxW5i7Dz4hSMJ7Ra7Ecm6Gw91INYcBw_aU3h6YPmnfKxLbnJnjc",
        footerText: "For you, Always"
    },
    // Page 4: Quiz
    quiz: {
        questions: [
            {
                question: "Where was our very first date?",
                options: ["Starbucks KIP", "Cinema XXI", "Parks & Rec", "Dinner at McD"],
                correctIndex: 0,
                correctMessage: "You remembered! ❤️"
            },
            {
                question: "What is my favorite color on you?",
                options: ["Rose Pink", "Soft Blue", "Sage Green", "Classic Black"],
                correctIndex: 2,
                wrongMessage: "Listen closely to your heart... 🎶"
            },
            {
                question: "Where do I want to travel with you?",
                options: ["Paris", "Tokyo", "Santorini", "Bali"],
                correctIndex: 0,
                correctMessage: "Oui! The city of love 🗼",
                wrongMessage: "Good guess, but not number one! ✈️"
            },
            {
                question: "What do I love most about you?",
                options: ["Your smile", "Your kindness", "Your eyes", "Everything"],
                correctIndex: 3,
                correctMessage: "Correct! I love it all ❤️",
                wrongMessage: "I love that too, but... 😉"
            },
            {
                question: "What is our favorite thing to do together?",
                options: ["Watching Movies", "Going on walks", "Eating out", "Just being together"],
                correctIndex: 3,
                correctMessage: "Being with you is always my favorite! ✨",
                wrongMessage: "That's high on the list, but there's a better answer! ❤️"
            }
        ]
    },
    // Page 2 Content
    music: [
        {
            songTitle: "Selfless",
            artist: "The Strokes",
            audioSrc: "assets/song1.mp3",
            coverSrc: "assets/cover1.jpg",
            lyrics: "Life is too short, But i will live for You"
        },
        {
            songTitle: "Ivy",
            artist: "Frank Ocean.",
            audioSrc: "assets/song2.mp3",
            coverSrc: "assets/cover2.jpg",
            lyrics: "I thought that  was dreaming, When you said you love.."
        },
        {
            songTitle: "L-O-V-E",
            artist: "Nat King Cole",
            audioSrc: "assets/song3.mp3",
            coverSrc: "https://picsum.photos/400/400?random=3",
            lyrics: "L is for the way you look at me..."
        }
    ],
    // Page 5: Gallery
    gallery: {
        title: "Our Memory Gallery",
        subtitle: "Scratch to reveal a piece of my heart",
        memories: [
            // Polaroid 1 (Baris 1 - Kiri)
            {
                type: "video",
                src: "assets/images/video1.mp4", // Masukkan video di sini
                caption: "The day we met...",
                tape: "washi-tape",
                rotation: "-rotate-1"
            },
            // Polaroid 2 (Baris 1 - Tengah / Kanan)
            {
                type: "image",
                src: "assets/images/photo2.jpg", // Masukkan foto di sini
                caption: "Our first coffee",
                tape: "washi-tape-gold",
                rotation: "rotate-2"
            },
            // Polaroid 3 (Baris 1 - Kanan)
            {
                type: "image",
                src: "assets/images/photo3.jpg", // Masukkan foto di sini
                caption: "Golden hour walks",
                tape: "washi-tape",
                rotation: "rotate-1"
            },
            // Polaroid 4 (Baris 2 - Kiri)
            {
                type: "video",
                src: "assets/images/video1.mp4", // Masukkan video di sini
                caption: "Late night talks",
                tape: "washi-tape-gold",
                rotation: "-rotate-2"
            },
            // Polaroid 5 (Baris 2 - Tengah / Kanan)
            {
                type: "image",
                src: "assets/images/photo4.jpg", // Masukkan foto di sini
                caption: "Under the stars",
                tape: "washi-tape",
                rotation: "rotate-1"
            },
            // Polaroid 6 (Baris 2 - Kanan)
            {
                type: "image",
                src: "assets/images/photo5.jpg", // Masukkan foto di sini
                caption: "Forever with you",
                tape: "washi-tape-gold",
                rotation: "-rotate-1"
            }
        ]
    },
    // Page 6: Atlas of Us (Map)
    map: {
        locations: [
            {
                coordinates: [-6.2462588514622155, 106.9913550792795],
                title: "Where we first met",
                memory: "The air was sweet, and your smile was brighter than the sun.",
                date: "Jan 2020",
                imageSrc: "assets/images/photo1.jpg" // Optional: Add image URL here
            },
            {
                coordinates: [-6.268617941810974, 106.97607564606952],
                title: "Our favorite coffee spot",
                memory: "The aroma of roasted beans and the sound of your laughter.",
                date: "Feb 2020",
                imageSrc: "" // Optional: Add image URL here
            },
            {
                coordinates: [-6.268579003998055, 106.98123604300862],
                title: "That midnight walk",
                memory: "City lights, quiet streets, and the feeling of your hand in mine.",
                date: "March 2020",
                imageSrc: "" // Optional: Add image URL here
            }

        ]
    },
    // Page 8: Heartfelt Letter
    letter: {
        recipientName: "Dearest Love",
        message: "I find myself sitting here, trying to put into words everything my heart has been carrying. It's funny how some feelings are so immense that even a thousand words seem too few, yet a single look between us says it all.\n\nThank you for being the quiet in my storm and the laughter in my mundane days. Every moment we share feels like a soft brushstroke on a canvas I never want to finish painting.\n\nYou are the poetry I never knew I needed to write, and the song I find myself humming when the world gets too loud.\n\nI wanted you to know, in this quiet space between us, that you are my favorite chapter. No matter where the story goes next, I am so deeply grateful that I get to walk through it with you by my side.",
        signature: "Your Favorite Person"
    },
    // Page 9: Invitation
    invitation: {
        title: "Will you be my Valentine?",
        subtitle: "One Final Question...",
        yesText: "YES! ",
        noText: "No"
    },
    // Page 10: Finale
    finale: {
        title: "Happy Valentine's Day!",
        message: "Every second with you is a memory I'll cherish forever. This is only the beginning of our story.",
        videoSrc: "assets/images/video2.mp4" // Can be a local MP4 or YouTube link
    }
};
