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

    function createJobRegisterButton(container, options = {}) {
        if (!container) {
            return null;
        }

        const label = options.label ?? 'Regjistro Pun\u00eb';
        const ariaLabel = options.ariaLabel ?? label;
        const disabled = Boolean(options.disabled);

        container.innerHTML = `
            <button
                class="job-register-button${disabled ? ' is-disabled' : ''}"
                type="button"
                aria-label="${escapeHTML(ariaLabel)}"
                ${disabled ? 'disabled' : ''}
            >
                <svg class="job-register-button__icon" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                    <path d="M13.5 11.5V8.8c0-1.7 1.4-3.1 3.1-3.1h6.8c1.7 0 3.1 1.4 3.1 3.1v2.7" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"></path>
                    <path d="M6.6 13.8c0-1.3 1.1-2.3 2.3-2.3h22.2c1.3 0 2.3 1.1 2.3 2.3v16.6c0 1.3-1.1 2.3-2.3 2.3H8.9c-1.3 0-2.3-1.1-2.3-2.3V13.8z" stroke-width="3.2" stroke-linejoin="round"></path>
                    <path d="M6.6 19.6h10.6" stroke-width="3.2" stroke-linecap="round"></path>
                    <path d="M22.8 19.6h10.6" stroke-width="3.2" stroke-linecap="round"></path>
                    <path d="M17.2 17.5h5.6v5.2h-5.6v-5.2z" stroke-width="3.2" stroke-linejoin="round"></path>
                </svg>
                <span class="job-register-button__text">${escapeHTML(label)}</span>
            </button>
        `;

        const button = container.querySelector('.job-register-button');

        if (!disabled) {
            button.addEventListener('click', () => {
                container.dispatchEvent(new CustomEvent('job-register:click', { bubbles: true }));

                if (typeof options.onClick === 'function') {
                    options.onClick();
                }
            });
        }

        return button;
    }

    function setJobRegisterButtonDisabled(container, disabled) {
        const button = container?.querySelector('.job-register-button');
        if (!button) {
            return;
        }

        button.disabled = Boolean(disabled);
        button.classList.toggle('is-disabled', Boolean(disabled));
    }

    function updateJobRegisterButtonLabel(container, label) {
        const text = container?.querySelector('.job-register-button__text');
        const button = container?.querySelector('.job-register-button');
        if (!text || !button) {
            return;
        }

        text.textContent = label ?? '';
        button.setAttribute('aria-label', label ?? '');
    }

    window.createJobRegisterButton = createJobRegisterButton;
    window.setJobRegisterButtonDisabled = setJobRegisterButtonDisabled;
    window.updateJobRegisterButtonLabel = updateJobRegisterButtonLabel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createJobRegisterButton,
            setJobRegisterButtonDisabled,
            updateJobRegisterButtonLabel
        };
    }
}());
