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

    function createErrorPopup(options = {}) {
        const title = options.title ?? 'Mesazh Gabimi';
        const text = options.text ?? 'Sherbimi nuk u krijua me sukses. Ju lutemi kontrolloni te dhenat dhe provoni perseri.';
        const action = options.action ?? 'Provo perseri';
        const cancel = options.cancel ?? 'Hiq';

        return `
            <div class="staff-service-message staff-service-message--error">
                <h2 id="service-modal-title">${escapeHTML(title)}</h2>
                <p>${escapeHTML(text)}</p>
                <div class="staff-service-message__actions">
                    <button class="staff-service-button staff-service-button--primary" type="button" data-message-action>${escapeHTML(action)}</button>
                    <button class="staff-service-button staff-service-button--secondary" type="button" data-service-cancel>${escapeHTML(cancel)}</button>
                </div>
            </div>
        `;
    }

    window.StaffErrorPopup = {
        createErrorPopup
    };
}());
