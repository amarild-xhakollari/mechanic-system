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

    function getCopy(mode) {
        const isEdit = mode === 'edit';

        return {
            title: isEdit ? 'Modifikoni te dhenat e sherbimit' : 'Shto sherbim te kryer per automjetin',
            subtitle: isEdit
                ? 'Modifiko te dhenat e duhura e sherbimit te kryer per automjetin'
                : 'Vendos te gjitha te dhenat e sherbimit te kryer per automjetin',
            upload: isEdit ? 'Kliko ketu per te modifikuar imazhin' : 'Kliko ketu per te ngarkuar nje imazh',
            placeholder: isEdit
                ? 'U krye nderrimi i vajit te motorit dhe zevendesimi i filtrit te vajit per te siguruar funksionim me te mire dhe mbrojtje te motorit.'
                : 'Shkruani ketu ...',
            submit: isEdit ? 'Modifiko Sherbimin' : 'Regjistro Sherbimin'
        };
    }

    function createServiceUpdatePanel(container, options = {}) {
        if (!container) return null;

        const mode = options.mode === 'edit' ? 'edit' : 'create';
        const copy = getCopy(mode);
        const service = options.service ?? {};

        container.innerHTML = `
            <form class="service-update-panel" data-service-update-form>
                <header>
                    <h1 class="service-update-panel__title">${escapeHTML(copy.title)}</h1>
                    <p class="service-update-panel__subtitle">${escapeHTML(copy.subtitle)}</p>
                </header>

                <label class="service-update-panel__upload ${service.image_url ? 'has-preview' : ''}">
                    <input class="service-update-panel__file" type="file" accept="image/*" name="image" data-service-image>
                    <img class="service-update-panel__preview" src="${escapeHTML(service.image_url || '')}" alt="">
                    <span class="service-update-panel__upload-content">
                        <svg class="service-update-panel__upload-icon" viewBox="0 0 128 96" fill="none" aria-hidden="true">
                            <path d="M76.2 78.6c13.2 8.6 34 3.4 38.8-14.2 4.9-17.9-7.8-38.3-27-49.1C68.9 4.5 42.9 5.7 26.2 18.1 9.5 30.6 2.1 54.3 11.8 70.2c9.8 15.9 36.5 21 50.1 9.7 5.1-4.2 8.4-5 14.3-1.3Z" fill="currentColor"/>
                            <circle cx="42" cy="36" r="12" fill="#f3f3f3"/>
                            <circle cx="65" cy="29" r="11" fill="#f3f3f3"/>
                            <circle cx="43" cy="58" r="12" fill="#f3f3f3"/>
                            <circle cx="82" cy="47" r="12" fill="#f3f3f3"/>
                        </svg>
                        <span class="service-update-panel__upload-text">${escapeHTML(copy.upload)}</span>
                    </span>
                </label>

                <div>
                    <label class="service-update-panel__label" for="service-note">Shkruani ne fushen me poshte informacionet mbi sherbimin.</label>
                    <textarea class="service-update-panel__textarea" id="service-note" name="note" placeholder="${escapeHTML(copy.placeholder)}" required>${escapeHTML(service.note || '')}</textarea>
                </div>

                <div class="service-update-panel__actions">
                    <button class="service-update-panel__submit" type="submit">${escapeHTML(copy.submit)}</button>
                    <button class="service-update-panel__cancel" type="button" data-service-cancel>Anulo</button>
                </div>
            </form>
        `;

        const form = container.querySelector('[data-service-update-form]');
        const fileInput = container.querySelector('[data-service-image]');
        const upload = container.querySelector('.service-update-panel__upload');
        const preview = container.querySelector('.service-update-panel__preview');

        fileInput.addEventListener('change', () => {
            const file = fileInput.files && fileInput.files[0];
            if (!file) return;

            preview.src = URL.createObjectURL(file);
            upload.classList.add('has-preview');
        });

        container.querySelector('[data-service-cancel]').addEventListener('click', () => {
            if (typeof options.onCancel === 'function') {
                options.onCancel();
            }
        });

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            if (typeof options.onSubmit === 'function') {
                options.onSubmit(new FormData(form), form);
            }
        });

        return form;
    }

    window.createServiceUpdatePanel = createServiceUpdatePanel;
}());
