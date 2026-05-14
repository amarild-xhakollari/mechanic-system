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

    function createConfirmPopup(options = {}) {
        const title = options.title ?? 'Konfirmo veprimin';
        const text = options.text ?? 'A jeni te sigurt qe doni te vazhdoni?';
        const action = options.action ?? 'Konfirmo';
        const cancel = options.cancel ?? 'Anulo';

        return `
            <div class="staff-service-message staff-service-message--confirm">
                <h2 id="service-modal-title">${escapeHTML(title)}</h2>
                <p>${escapeHTML(text)}</p>
                <div class="staff-service-message__actions">
                    <button class="staff-service-button staff-service-button--primary" type="button" data-message-action>${escapeHTML(action)}</button>
                    <button class="staff-service-button staff-service-button--secondary" type="button" data-service-cancel>${escapeHTML(cancel)}</button>
                </div>
            </div>
        `;
    }

    window.StaffConfirmPopup = {
        createConfirmPopup
    };
}());
