(function () {
    function ensurePopup() {
        let popup = document.querySelector('[data-export-logs-popup]');
        if (popup) return popup;

        popup = document.createElement('div');
        popup.className = 'export-logs-popup';
        popup.dataset.exportLogsPopup = '';
        popup.hidden = true;
        popup.innerHTML = `
            <div class="export-logs-popup__scrim" data-export-logs-close></div>
            <section class="export-logs-popup__panel" role="dialog" aria-modal="true" aria-labelledby="export-logs-popup-title">
                <h2 class="export-logs-popup__title" id="export-logs-popup-title">Eksporto Log-et</h2>
                <p class="export-logs-popup__message">N&euml; k&euml;t&euml; seksion mund t&euml; eksportoni log-et e sistemit. <strong>Momentalisht, log-et mund t&euml; eksportohen vet&euml;m n&euml; format spreadsheet.</strong></p>
                <div class="export-logs-popup__actions">
                    <button class="export-logs-popup__primary" type="button" data-export-logs-confirm>Eksporto</button>
                    <button class="export-logs-popup__secondary" type="button" data-export-logs-close>Hiq</button>
                </div>
            </section>
        `;
        document.body.appendChild(popup);
        return popup;
    }

    function close() {
        const popup = document.querySelector('[data-export-logs-popup]');
        if (popup) popup.hidden = true;
    }

    function open(options = {}) {
        const popup = ensurePopup();
        popup.hidden = false;

        popup.querySelectorAll('[data-export-logs-close]').forEach((button) => {
            button.onclick = close;
        });

        popup.querySelector('[data-export-logs-confirm]').onclick = () => {
            close();
            if (typeof options.onExport === 'function') {
                options.onExport();
            }
        };
    }

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            close();
        }
    });

    window.ExportLogsPopup = {
        open,
        close
    };
}());
