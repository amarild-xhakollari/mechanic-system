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

    function createSearchBar(container, options = {}) {
        if (!container) {
            return null;
        }

        const placeholder = options.placeholder ?? 'Kerko sherbim me ane te targave ose klientit ...';

        container.innerHTML = `
            <label class="service-search">
                <svg class="service-search__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" stroke-width="2"></circle>
                    <path d="m21 21-4.35-4.35" stroke-width="2" stroke-linecap="round"></path>
                </svg>
                <input
                    class="service-search__input"
                    type="search"
                    placeholder="${escapeHTML(placeholder)}"
                    autocomplete="off"
                    data-search-input
                >
            </label>
        `;

        const input = container.querySelector('[data-search-input]');

        input.addEventListener('input', (event) => {
            if (typeof options.onSearch === 'function') {
                options.onSearch(event.target.value);
            }
        });

        input.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && typeof options.onSubmit === 'function') {
                options.onSubmit(event.target.value);
            }
        });

        return {
            element: container.firstElementChild,
            input,
            setValue(value) {
                input.value = value ?? '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            },
            focus() {
                input.focus();
            }
        };
    }

    window.createSearchBar = createSearchBar;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createSearchBar };
    }
}());
