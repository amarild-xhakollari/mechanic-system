(function () {
    const IMAGE_ICON_SRC = '../../../assets/images/default-icons/insert%20image.png';

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
            submit: isEdit ? 'Modifiko te dhenat' : 'Regjistro Sherbimin'
        };
    }

    function getImageSource(service = {}) {
        return service.image || service.image_url || service.image_path || '';
    }

    function createServiceFormPopup(mode = 'create', service = {}) {
        const copy = getCopy(mode);
        const imageSource = getImageSource(service);

        return `
            <form class="staff-service-form service-form-popup" data-service-form data-mode="${escapeHTML(mode)}" data-service-id="${escapeHTML(service.id || service.service_id || '')}">
                <h2 id="service-modal-title">${escapeHTML(copy.title)}</h2>
                <p class="staff-service-form__subtitle service-form-popup__subtitle">${escapeHTML(copy.subtitle)}</p>

                <label class="staff-service-form__upload service-form-popup__upload">
                    <input type="file" accept="image/*" data-service-image hidden>
                    <span class="staff-service-form__preview service-form-popup__preview" data-service-preview ${imageSource ? `style="background-image:url('${escapeHTML(imageSource)}')"` : ''}>
                        ${imageSource ? '' : `<img src="${IMAGE_ICON_SRC}" alt="" aria-hidden="true">`}
                    </span>
                    <span>${escapeHTML(copy.upload)}</span>
                </label>

                <label class="staff-service-form__field service-form-popup__field">
                    <span>Titulli i sherbimit</span>
                    <input data-service-title type="text" placeholder="P.sh. Nderrim vaji" value="${escapeHTML(service.title || '')}">
                </label>

                <label class="staff-service-form__field service-form-popup__field">
                    <span>Pershkrimi i sherbimit</span>
                    <textarea data-service-note placeholder="${escapeHTML(copy.placeholder)}">${escapeHTML(service.description || service.note || '')}</textarea>
                </label>

                <div class="staff-service-form__actions service-form-popup__actions">
                    <button class="staff-service-button staff-service-button--primary" type="submit">${escapeHTML(copy.submit)}</button>
                    <button class="staff-service-button staff-service-button--secondary" type="button" data-service-cancel>Anulo</button>
                </div>
            </form>
        `;
    }

    window.createServiceFormPopup = createServiceFormPopup;
}());
