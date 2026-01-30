# Investigation Report: Admin Data Loss Bug

I have analyzed the "refactored" admin panel (`admin/index.html` and its associated JS files) and identified why your "savings" are being lost or reset.

## Root Causes

### 1. The "Wizard" DOM Erasure (Critical)
The new admin uses a step-by-step wizard. When you move to a new step, the HTML for the previous step is **completely removed** from the page.
- **The Problem:** The `state.getConfig()` function in `admin/js/state.js` tries to read **every single setting** from the page using `document.getElementById()`.
- **The Result:** If you are on Step 3 (Music), the setting for "Password" (from Step 1) is no longer on the page. `getConfig()` returns an empty string for the password, and `state.save()` then saves that empty string to your `data.js`/LocalStorage, effectively **erasing** your work as you move forward.

### 2. Hardcoded Defaults Overwrite
In `admin/js/state.js`, the function `loadDefaultPages()` contains hardcoded placeholder data for every page (Music, Quiz, Gallery, etc.).
- **The Problem:** When the admin starts, if it doesn't find a previous session in your browser's local storage, it ignores your actual `data.js` and forces these hardcoded defaults onto you.
- **The Result:** Your existing `data.js` content is ignored and replaced by placeholders like "Our Playlist", "Bonnie & Clyde", etc.

### 3. One-Way State Management
The system is designed to read from the UI to the State, but it doesn't reliably keep the State alive when the UI is gone. It lacks a "Source of Truth" object that persists independently of what is currently visible on the screen.

---

## Requested Prompt for Claude
*Copy and paste the section below into a new chat with Claude to fix this issue:*

---

**Subject: Fix Data Loss in Wizard-based Admin Panel**

I have a Valentine's Day web app with an admin wizard that is losing data. Only one step of the wizard is rendered at a time, but the saving logic relies on reading all inputs from the DOM. When a step is hidden, its data is being saved as empty/default, erasing my previous work.

**Project Structure:**
- `admin/index.html`: Main wizard UI.
- `admin/js/state.js`: Handles `getConfig()`, `save()`, and `load()`.
- `admin/js/renderers.js`: Renders step HTML.
- `admin/js/app.js`: Orchestrates the wizard.

**Requirements to Fix:**
1. **Persistent State:** Modify `state.js` so that `state.configData` (or a similar persistent object) is the absolute "Source of Truth".
2. **Incremental Updates:** Change the input listeners in `app.js`/`renderers.js` so that they update the persistent state object **immediately** when a user types, rather than waiting for a full DOM scrape.
3. **Smart getConfig:** Update `state.getConfig()` to simply return the current state object instead of trying to find elements that are currently unmounted.
4. **Data Preservation:** Ensure `loadFromStorage` correctly merges the existing `CONFIG` from `data.js` so that user data isn't overwritten by hardcoded defaults in `loadDefaultPages`.
5. **Pre-filling:** Ensure `renderers.js` pulls the current values from the persistent state when rendering each step's HTML.

**Constraint:** Do not change the overall "Wizard" flow, just fix the data persistence layer so I don't lose my settings when clicking "Next" or "Back".

---
