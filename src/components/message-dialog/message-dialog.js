(function () {
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function ensureDialog() {
        let dialog = document.querySelector('[data-message-dialog]');
        if (dialog) return dialog;

        dialog = document.createElement('div');
        dialog.className = 'message-dialog';
        dialog.dataset.messageDialog = '';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        document.body.appendChild(dialog);
        return dialog;
    }

    function closeDialog(dialog) {
        dialog.classList.remove('is-visible', 'message-dialog--danger');
        dialog.innerHTML = '';
    }

    function showMessageDialog(options = {}) {
        const dialog = ensureDialog();
        const isDanger = options.variant === 'danger';

        dialog.classList.toggle('message-dialog--danger', isDanger);
        dialog.innerHTML = `
            <div class="message-dialog__panel">
                <h2 class="message-dialog__title">${escapeHTML(options.title || 'Mesazh')}</h2>
                <p class="message-dialog__message">${escapeHTML(options.message || '')}</p>
                <div class="message-dialog__actions">
                    <button class="message-dialog__primary" type="button" data-dialog-primary>${escapeHTML(options.primaryText || 'OK')}</button>
                    ${options.secondaryText ? `<button class="message-dialog__secondary" type="button" data-dialog-secondary>${escapeHTML(options.secondaryText)}</button>` : ''}
                </div>
            </div>
        `;
        dialog.classList.add('is-visible');

        dialog.querySelector('[data-dialog-primary]').addEventListener('click', () => {
            closeDialog(dialog);
            if (typeof options.onPrimary === 'function') options.onPrimary();
        });

        const secondary = dialog.querySelector('[data-dialog-secondary]');
        if (secondary) {
            secondary.addEventListener('click', () => {
                closeDialog(dialog);
                if (typeof options.onSecondary === 'function') options.onSecondary();
            });
        }

        dialog.onclick = (event) => {
            if (event.target === dialog) {
                closeDialog(dialog);
                if (typeof options.onSecondary === 'function') options.onSecondary();
            }
        };

        return dialog;
    }

    window.showMessageDialog = showMessageDialog;
}());
