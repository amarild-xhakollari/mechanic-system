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

    function createSuccessPopup(options = {}) {
        const title = options.title ?? 'U krye me sukses';
        const text = options.text ?? 'Te dhenat u ruajten me sukses.';
        const action = options.action ?? 'Ne rregull';

        return `
            <div class="staff-service-message staff-service-message--success">
                <h2 id="service-modal-title">${escapeHTML(title)}</h2>
                <p>${escapeHTML(text)}</p>
                <div class="staff-service-message__actions">
                    <button class="staff-service-button staff-service-button--primary" type="button" data-success-close>${escapeHTML(action)}</button>
                </div>
            </div>
        `;
    }

    window.StaffSuccessPopup = {
        createSuccessPopup
    };
}());
