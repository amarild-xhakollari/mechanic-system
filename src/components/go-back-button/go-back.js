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
                <span class="go-back-button__icon" aria-hidden="true"></span>
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
