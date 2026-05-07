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

    function createServiceRegistrationBar(container, options = {}) {
        if (!container) {
            return null;
        }

        const backText = options.backText ?? 'Kthehu te lista';
        const addText = options.addText ?? 'Shto Sh\u00ebrbime';
        const closeText = options.closeText ?? 'Mbyll Pun\u00ebn';
        const hintText = options.hintText ?? 'Shkruaj nj\u00eb sh\u00ebrbim q\u00eb kryen n\u00eb k\u00ebt\u00eb pun\u00eb';

        container.innerHTML = `
            <div class="service-registration-bar">
                <button class="service-registration-bar__back" type="button">
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M19 12H5" stroke-width="2.2" stroke-linecap="round"></path>
                        <path d="m11 6-6 6 6 6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <span>${escapeHTML(backText)}</span>
                </button>

                <div>
                    <div class="service-registration-bar__actions">
                        <button class="service-registration-bar__primary" type="button">
                            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d="M12 5v14M5 12h14" stroke-width="2.5" stroke-linecap="round"></path>
                            </svg>
                            <span>${escapeHTML(addText)}</span>
                        </button>
                        <button class="service-registration-bar__secondary" type="button">${escapeHTML(closeText)}</button>
                    </div>
                    <p class="service-registration-bar__hint">${escapeHTML(hintText)}</p>
                </div>
            </div>
        `;

        const bar = container.querySelector('.service-registration-bar');
        const backButton = container.querySelector('.service-registration-bar__back');
        const addButton = container.querySelector('.service-registration-bar__primary');
        const closeButton = container.querySelector('.service-registration-bar__secondary');

        backButton.addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('service-registration:back', { bubbles: true }));
            if (typeof options.onBack === 'function') {
                options.onBack();
            }
        });

        addButton.addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('service-registration:add', { bubbles: true }));
            if (typeof options.onAdd === 'function') {
                options.onAdd();
            }
        });

        closeButton.addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('service-registration:close', { bubbles: true }));
            if (typeof options.onClose === 'function') {
                options.onClose();
            }
        });

        return bar;
    }

    window.createServiceRegistrationBar = createServiceRegistrationBar;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createServiceRegistrationBar };
    }
}());
