# Valentine's Project: Business & Customization Guide

This guide is designed to help you monetize the Valentine's Day interactive website. It covers how to customize the project for different clients, how to handle complex requests, and a template for gathering client requirements.

---

## 📋 Client Intake Form Template
*Copy this into a Google Form or Typeform to send to your clients.*

### **Part 1: The Basics**
*   **Couple's Names**: (e.g., "Romeo & Juliet")
*   **Anniversary Date**: (YYYY-MM-DD format)
*   **Primary Theme Color**: (Choose one: ❤ Classic Red, 💖 Soft Pink, 💜 Deep Purple, 💙 Ocean Blue)
*   **Background Music**: (YouTube Link or "I'll provide an MP3")

### **Part 2: The Content**
*   **Login Password**: (e.g., anniversary date or a special word)
*   **Page 1 - Login Image**: (Upload photo)
*   **Page 2 - Application Title**: (Default: "Relationship Wrapped 2024")
*   **Page 2 - "Our Vibe" Stats**: (Provide 3 short fun facts, e.g., "Coffee Dates: 152", "Movies Watched: 45")
*   **Page 3 - Music Player**: (List 3-5 songs with artist names)
*   **Page 4 - "Messages"**: (Provide 3 short love notes)
*   **Page 5 - Quiz**:
    *   Question 1 & Answer
    *   Question 2 & Answer
    *   Question 3 & Answer
*   **Page 8 - The Letter**: (Paste your full love letter text here)

### **Part 3: The Media**
*   **Gallery Photos**: (Upload 7 vertical photos)
*   **Map Locations**: (List 3 significant locations with coordinates or addresses + a short caption for each)
*   **Finale Video**: (Upload video file or provide YouTube link)

### **Part 4: Customizations (Optional - Extra Fee)**
*   [ ] I want to remove specific pages (Specify which: ________)
*   [ ] I want to change the order of pages
*   [ ] I want a custom feature (e.g., Voice Note instead of Video)

---

## 🛠️ Technical Customization Manual

### **Level 1: Basic Customization (Easy)**
*Target: 90% of clients. Time: 10-15 mins.*
**Action:** Only edit `data.js`.

1.  **Open `data.js`**: This file contains all text, dates, and media links.
2.  **Replace Values**:
    *   **Names/Text**: Replace text inside quotes. `headerText: "Happy Valentine's Day"`
    *   **Images**: Replace filenames. `./assets/photo1.jpg` -> `./assets/client-photo.jpg`
    *   **Music**: Change the `musicBox` array.
    *   **Quiz**: Update the `quizData` array.
3.  **Delivery**: Send the updated folder to the client (or host it).

### **Level 2: Advanced Customization (Moderate)**
*Target: Clients who want pages removed or reordered. Time: 30-60 mins.*
**Action:** Edit `index.html` and `script.js`.

#### **Deleting a Page**
1.  **HTML**: In `index.html`, find the section `<section id="page-X" ...>`. Delete the entire block.
2.  **Navigation**: In `index.html`, find the navigation buttons (usually at the bottom of the *previous* page).
    *   Change the `onclick` event: `onclick="MapsTo('page-prev', 'page-next')"` -> Update `page-next` to the ID of the new page they should go to.
    *   *Example*: If deleting Page 3, go to Page 2's "Next" button and change it to point to Page 4 (`onclick="MapsTo('page-2', 'page-4')" `).

#### **Changing Theme Colors**
*   **Quick Fix**: The site currently uses Tailwind classes like `text-rose-900` or `bg-pink-50`.
*   **Strategy**: Use "Find and Replace" in your code editor.
    *   To change Red/Pink -> Blue: Replace `rose-` with `blue-` and `pink-` with `sky-`.
    *   *Check*: Verify contrast. Dark text (`text-rose-900`) should become dark blue (`text-blue-900`).

### **Level 3: Custom Features (Expert)**
*Target: High-paying clients. Time: 2+ hours.*
**Action:** Significant code refactoring.

#### **Replacing Video with Voice Note (Page 10)**
1.  **HTML**: in `index.html` (Page 10 section), find `<div id="finale-video-container">`.
2.  **Replace**: Remove the `<video>`/`<iframe>` logic in `script.js` (`unlockFinale` function).
3.  **Insert Audio**: Instead of injecting video HTML, inject an `<audio>` tag:
    ```javascript
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full">
            <audio controls autoplay class="w-3/4">
                <source src="${CONFIG.finale.voiceNoteSrc}" type="audio/mpeg">
            </audio>
            <p class="mt-4 text-rose-800 font-cursive text-2xl">Play my message 🎵</p>
        </div>`
    ```
4.  **Data**: Add `voiceNoteSrc` to `CONFIG.finale` in `data.js`.

---

## 💰 Pricing Strategy Advice

| Package Tier | Features | Est. Work | Price Suggestion |
| :--- | :--- | :--- | :--- |
| **Basic** | Standard 10 pages, your content in `data.js`. No layout changes. | 15 mins | $X |
| **Standard** | Basic + Remove up to 2 pages + Custom color theme. | 45 mins | $X + 30% |
| **Premium** | Standard + Custom feature (e.g., Voice Note) + Custom page order. | 2-3 hours | $X + 100% |

> **Pro Tip:** Always charge *extra* for code changes (HTML/CSS). Content changes (`data.js`) should be the base baseline price.
