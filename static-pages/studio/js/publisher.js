/**
 * publisher.js — Final Publish & Success Modal
 * Loves Edition Studio
 */

const Publisher = (() => {
  let _validatedPayload = null;

  function init() {
    document.getElementById('submit-btn')?.addEventListener('click', _handlePreSubmit);
    document.getElementById('btn-confirm-publish')?.addEventListener('click', _handlePublish);
    document.getElementById('btn-cancel-publish')?.addEventListener('click', () => _toggleModal('modal-publish-confirm', false));
    document.getElementById('btn-copy-link')?.addEventListener('click', _handleCopyLink);
    document.getElementById('btn-close-success')?.addEventListener('click', () => _toggleModal('modal-success', false));
  }

  function _toggleModal(id, show) {
    document.getElementById(id)?.classList.toggle('hidden', !show);
  }

  async function _handlePreSubmit() {
    Studio.clearErrors();

    // Validasi minimal
    const password = document.getElementById('input-login-password')?.value.trim();
    if (!password) {
      Studio.showError('input-login-password', 'Password login tidak boleh kosong.');
      return;
    }

    const songArr = Music.getSongArray();
    if (songArr.length === 0) {
      Studio.showToast('Minimal 1 lagu harus diupload.');
      return;
    }

    const photos = Uploader.getPhotos();
    if (AppManager.getActivePages()['gallery'] && photos.length < 1) {
      Studio.showToast('Gallery aktif — minimal 1 foto diperlukan.');
      return;
    }

    const letter = document.getElementById('input-letter-msg')?.value || '';
    if (AppManager.getActivePages()['surat'] && !letter.trim()) {
      Studio.showError('input-letter-msg', 'Isi surat tidak boleh kosong.');
      return;
    }

    if (Uploader.isUploading() || Music.isUploading() || WrappedUploader.isUploading() || LetterUploader.isUploading()) {
      Studio.showToast('Tunggu file selesai diupload terlebih dahulu.');
      return;
    }

    // Build payload
    _validatedPayload = Autosave.buildState();

    // Tampilkan preview link di modal konfirmasi
    const token = Auth.getToken();
    const previewUrl = `${window.location.origin.replace('/studio', '')}/loves/?to=${token}`;
    const urlPreview = document.getElementById('modal-gift-url-preview');
    if (urlPreview) urlPreview.textContent = previewUrl;

    _toggleModal('modal-publish-confirm', true);
  }

  async function _handlePublish() {
    if (!_validatedPayload) return;
    _toggleModal('modal-publish-confirm', false);

    const btn = document.getElementById('submit-btn');
    const textSpan = btn?.querySelector('.submit-text');
    if (textSpan) textSpan.textContent = 'Mempublish...';
    if (btn) btn.disabled = true;

    try {
      const res = await fetch(`${Auth.getWorkerUrl()}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_validatedPayload)
      });
      const data = await res.json();

      if (data.success) {
        Autosave.cancel();
        const giftUrl = data.giftUrl || `https://for-you-always.my.id/loves/?to=${_validatedPayload.id}`;
        _showSuccessModal(giftUrl);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (e) {
      Studio.showToast('Gagal publish: ' + e.message);
    } finally {
      if (textSpan) textSpan.textContent = 'Publikasikan Kado';
      if (btn) btn.disabled = false;
    }
  }

  function _showSuccessModal(giftUrl) {
    const urlEl = document.getElementById('modal-gift-url');
    const waBtn = document.getElementById('btn-share-whatsapp');
    const viewBtn = document.getElementById('btn-view-gift');
    const qrBox = document.getElementById('qr-code-box');

    if (urlEl) urlEl.textContent = giftUrl;
    if (viewBtn) viewBtn.href = giftUrl;
    if (waBtn) {
      const msg = encodeURIComponent(`Untukmu, kenangan yang selalu menemani. ❤️\n\n${giftUrl}`);
      waBtn.href = `https://wa.me/?text=${msg}`;
    }

    // Generate QR Code
    if (qrBox && typeof QRCode !== 'undefined') {
      qrBox.innerHTML = '';
      new QRCode(qrBox, {
        text: giftUrl,
        width: 128,
        height: 128,
        colorDark: '#1a1a1a',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
      setTimeout(() => {
        const img = qrBox.querySelector('img');
        const canvas = qrBox.querySelector('canvas');
        if (img) { img.style.margin = '0 auto'; img.style.display = 'block'; img.style.borderRadius = '4px'; }
        if (canvas) canvas.style.display = 'none';
      }, 100);
    }

    _toggleModal('modal-success', true);
  }

  function _handleCopyLink() {
    const url = document.getElementById('modal-gift-url')?.textContent;
    if (!url) return;
    navigator.clipboard.writeText(url)
      .then(() => {
        const btn = document.getElementById('btn-copy-link');
        if (btn) { btn.textContent = 'TERSALIN ✓'; setTimeout(() => btn.textContent = 'SALIN LINK', 2000); }
      })
      .catch(() => Studio.showToast('Gagal menyalin. Coba manual.'));
  }

  return { init };
})();
