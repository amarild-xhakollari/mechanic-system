(function () {
    function goBack(fallbackHref) {
        if (window.history.length > 1) {
            window.history.back();
            return;
        }

        if (fallbackHref) {
            window.location.href = fallbackHref;
        }
    }

    function createGoBackButton(container, options = {}) {
        if (!container) return null;

        const label = options.label || 'Kthehu te lista';
        const fallbackHref = options.fallbackHref || '';

        container.innerHTML = `
            <button class="go-back-button" type="button">
                <svg class="go-back-button__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
                <span>${label}</span>
            </button>
        `;

        const button = container.querySelector('.go-back-button');
        button.addEventListener('click', () => {
            if (typeof options.onBack === 'function') {
                options.onBack();
                return;
            }

            goBack(fallbackHref);
        });

        return button;
    }

    window.createGoBackButton = createGoBackButton;
}());
