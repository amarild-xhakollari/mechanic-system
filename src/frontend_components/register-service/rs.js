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

    function createRegisterServiceButton(container, options = {}) {
        if (!container) {
            return null;
        }

        const label = options.label ?? 'Regjistro Sherbimin';
        const ariaLabel = options.ariaLabel ?? label;
        const disabled = Boolean(options.disabled);

        container.innerHTML = `
            <button
                class="register-service-button${disabled ? ' is-disabled' : ''}"
                type="button"
                aria-label="${escapeHTML(ariaLabel)}"
                ${disabled ? 'disabled' : ''}
            >
                <span class="register-service-button__text">${escapeHTML(label)}</span>
            </button>
        `;

        const button = container.querySelector('.register-service-button');

        if (!disabled) {
            button.addEventListener('click', () => {
                container.dispatchEvent(new CustomEvent('register-service:click', { bubbles: true }));

                if (typeof options.onClick === 'function') {
                    options.onClick();
                }
            });
        }

        return button;
    }

    function setRegisterServiceButtonDisabled(container, disabled) {
        const button = container?.querySelector('.register-service-button');
        if (!button) {
            return;
        }

        button.disabled = Boolean(disabled);
        button.classList.toggle('is-disabled', Boolean(disabled));
    }

    function updateRegisterServiceButtonLabel(container, label) {
        const text = container?.querySelector('.register-service-button__text');
        const button = container?.querySelector('.register-service-button');
        if (!text || !button) {
            return;
        }

        text.textContent = label ?? '';
        button.setAttribute('aria-label', label ?? '');
    }

    function createRegisterServiceForm(container, options = {}) {
        if (!container) {
            return null;
        }

        const title = options.title ?? 'Shto sh\u00ebrbim t\u00eb kryer p\u00ebr automjetin';
        const subtitle = options.subtitle ?? 'Vendos t\u00eb gjitha t\u00eb dh\u00ebnat e sh\u00ebrbimit t\u00eb kryer p\u00ebr automjetin';
        const uploadText = options.uploadText ?? 'Kliko k\u00ebtu p\u00ebr t\u00eb ngarkuar nj\u00eb imazh';
        const fieldLabel = options.fieldLabel ?? 'Shkruani n\u00eb fush\u00ebn m\u00eb posht\u00eb informacionet mbi sh\u00ebrbimin.';
        const placeholder = options.placeholder ?? 'Shkruani ketu ...';
        const submitLabel = options.submitLabel ?? 'Regjistro Sherbimin';
        const cancelLabel = options.cancelLabel ?? 'Anulo';

        container.classList.add('register-service-form');
        container.innerHTML = `
            <h2 class="register-service-form__title">${escapeHTML(title)}</h2>
            <p class="register-service-form__subtitle">${escapeHTML(subtitle)}</p>

            <label class="register-service-form__upload" tabindex="0">
                <input class="register-service-form__file" type="file" accept="image/*">
                <span class="register-service-form__upload-inner">
                    <img class="register-service-form__preview" alt="">
                    <svg viewBox="0 0 160 120" fill="none" aria-hidden="true">
                        <path d="M79 94c-14 0-26-8-34-21-7-13-6-31 3-43 10-13 26-18 41-12 19 7 32 27 31 47-1 13-11 22-23 21-5 0-10-2-14-5-5-4-12-2-15 3-3 5-8 10-14 10z" fill="#e9e9e9"></path>
                        <path d="M79 94c-14 0-26-8-34-21-7-13-6-31 3-43 10-13 26-18 41-12 19 7 32 27 31 47-1 13-11 22-23 21-5 0-10-2-14-5-5-4-12-2-15 3-3 5-8 10-14 10z" stroke="#d5d5d5" stroke-width="5"></path>
                        <circle cx="59" cy="42" r="13" fill="#f4f4f4" stroke="#d8d8d8" stroke-width="3"></circle>
                        <circle cx="91" cy="38" r="11" fill="#f4f4f4" stroke="#d8d8d8" stroke-width="3"></circle>
                        <circle cx="62" cy="67" r="12" fill="#f4f4f4" stroke="#d8d8d8" stroke-width="3"></circle>
                        <circle cx="95" cy="65" r="12" fill="#f4f4f4" stroke="#d8d8d8" stroke-width="3"></circle>
                    </svg>
                    <p class="register-service-form__upload-text">${escapeHTML(uploadText)}</p>
                </span>
            </label>

            <label>
                <p class="register-service-form__label">${escapeHTML(fieldLabel)}</p>
                <textarea class="register-service-form__textarea" placeholder="${escapeHTML(placeholder)}">${escapeHTML(options.value ?? '')}</textarea>
            </label>

            <div class="register-service-form__actions">
                <div class="register-service-form__submit"></div>
                <button class="register-service-form__cancel" type="button">${escapeHTML(cancelLabel)}</button>
            </div>
        `;

        const submitContainer = container.querySelector('.register-service-form__submit');
        const cancelButton = container.querySelector('.register-service-form__cancel');
        const textarea = container.querySelector('.register-service-form__textarea');
        const fileInput = container.querySelector('.register-service-form__file');
        const upload = container.querySelector('.register-service-form__upload');
        const preview = container.querySelector('.register-service-form__preview');

        createRegisterServiceButton(submitContainer, {
            label: submitLabel,
            onClick: () => {
                const detail = {
                    description: textarea.value,
                    file: fileInput.files?.[0] ?? null
                };
                container.dispatchEvent(new CustomEvent('register-service:submit', {
                    bubbles: true,
                    detail
                }));

                if (typeof options.onSubmit === 'function') {
                    options.onSubmit(detail);
                }
            }
        });

        cancelButton.addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('register-service:cancel', { bubbles: true }));

            if (typeof options.onCancel === 'function') {
                options.onCancel();
            }
        });

        upload.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInput.click();
            }
        });

        fileInput.addEventListener('change', () => {
            const file = fileInput.files?.[0];
            if (!file) {
                upload.classList.remove('has-preview');
                preview.removeAttribute('src');
                return;
            }

            preview.src = URL.createObjectURL(file);
            upload.classList.add('has-preview');
        });

        return container;
    }

    window.createRegisterServiceButton = createRegisterServiceButton;
    window.createRegisterServiceForm = createRegisterServiceForm;
    window.setRegisterServiceButtonDisabled = setRegisterServiceButtonDisabled;
    window.updateRegisterServiceButtonLabel = updateRegisterServiceButtonLabel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createRegisterServiceButton,
            createRegisterServiceForm,
            setRegisterServiceButtonDisabled,
            updateRegisterServiceButtonLabel
        };
    }
}());
