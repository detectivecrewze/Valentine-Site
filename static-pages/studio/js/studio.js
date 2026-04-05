/**
 * studio.js — Main Controller
 * Loves Edition Studio
 *
 * Urutan init:
 * 1. Auth.init() → fetch config dari KV
 * 2. initPostAuth() → populate semua modul dengan data dari KV
 * 3. Bind global events (autosave triggers)
 */

const Studio = (() => {
  let _studioPassword = null;

  async function init() {
    const isReady = await Auth.init();
    if (isReady) initPostAuth();
    // Kalau false, Auth sudah handle auth-gate — initPostAuth dipanggil dari auth.js setelah unlock
  }

  function initPostAuth() {
    const config = Auth.getInitialConfig();
    _studioPassword = config?.studioPassword || null;

    // Init semua modul dengan data dari KV
    AppManager.init(config?.active_pages || null);
    Uploader.init(config?.gallery?.photos || []);
    Music.init({ playlist: config?.music || [] });
    WrappedUploader.init(config?.wrapped?.imageUrl || null);
    WrappedItems.init(config?.wrapped?.topPlaces || [], config?.wrapped?.coreMemories || []);
    Preview.init();
    Publisher.init();

    // Populate form fields dari config KV
    _populateForm(config || {});

    // Bind autosave ke semua input teks
    _bindGlobalInputs();

    // Tampilkan studio
    document.getElementById('studio-main')?.classList.remove('hidden');
    document.getElementById('loading-screen')?.classList.add('hidden');
  }

  function _populateForm(config) {
    // LOGIN
    _setVal('input-login-password', config.login?.password);
    _setVal('input-login-hint', config.login?.instruction);

    // MUSIC — handled entirely by music.js (arcade-style), no form fields to populate

    // GALLERY
    _setVal('input-gallery-title', config.gallery?.title);
    _setVal('input-gallery-subtitle', config.gallery?.subtitle);

    // WRAPPED
    const dateInput = document.getElementById('input-wrapped-date');
    if (dateInput) {
      dateInput.max = new Date().toISOString().split('T')[0]; // Max today
    }
    _setVal('input-wrapped-date', config.wrapped?.minutesTogether);
    _setVal('input-wrapped-vibe', config.wrapped?.vibe);
    // Places & memories handled by WrappedItems module

    // SURAT
    _setVal('input-letter-to', config.surat?.to);
    _setVal('input-letter-msg', config.surat?.message);
    _setVal('input-letter-from', config.surat?.from);

    // INVITATION
    _setVal('input-inv-question', config.invitation?.question);
    _setVal('input-inv-success', config.invitation?.successMessage);
  }

  function _setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value !== undefined && value !== null) el.value = value;
  }

  function _bindGlobalInputs() {
    // Semua input teks & textarea di editor → trigger autosave
    document.querySelectorAll('#editor-panel input:not([type="file"]):not([type="checkbox"]), #editor-panel textarea').forEach(el => {
      el.addEventListener('input', Autosave.trigger);
    });
  }

  // ── Toast Notification ────────────────────────────────────────────────
  let _toastTimer = null;
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    if (_toastTimer) clearTimeout(_toastTimer);
    t.textContent = msg;
    t.classList.remove('hidden');
    _toastTimer = setTimeout(() => { t.classList.add('hidden'); _toastTimer = null; }, 3000);
  }

  function showError(inputId, msg) {
    const el = document.getElementById(inputId);
    if (el) {
      el.classList.add('border-rose-400');
      el.focus();
      setTimeout(() => el.classList.remove('border-rose-400'), 3000);
    }
    showToast(msg);
  }

  function clearErrors() {
    document.querySelectorAll('.border-rose-400').forEach(el => el.classList.remove('border-rose-400'));
  }

  function getStudioPassword() { return _studioPassword; }

  return { init, initPostAuth, showToast, showError, clearErrors, getStudioPassword };
})();

// ── Entrypoint ────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', Studio.init);
