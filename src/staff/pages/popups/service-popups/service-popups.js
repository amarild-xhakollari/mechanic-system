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

    function closeServiceModal() {
        const modal = document.querySelector('[data-service-modal]');
        const content = document.querySelector('[data-service-modal-content]');

        if (modal) modal.hidden = true;
        if (content) content.innerHTML = '';
    }

    function openServiceModal(markup, size = 'form') {
        const modal = document.querySelector('[data-service-modal]');
        const panel = document.querySelector('.staff-service-modal__panel');
        const content = document.querySelector('[data-service-modal-content]');

        if (!modal || !panel || !content) return;

        panel.dataset.size = size;
        content.innerHTML = markup;
        modal.hidden = false;
    }

    function getUploadLabel(mode) {
        return mode === 'edit'
            ? 'Kliko ketu per te modifikuar imazhin'
            : 'Kliko ketu per te ngarkuar nje imazh';
    }

    function createServiceForm(mode = 'create', service = {}) {
        const isEdit = mode === 'edit';
        const title = isEdit ? 'Modifikoni te dhenat e sherbimit' : 'Shto sherbim te kryer per automjetin';
        const subtitle = isEdit
            ? 'Modifiko te dhenat e duhura e sherbimit te kryer per automjetin'
            : 'Vendos te gjitha te dhenat e sherbimit te kryer per automjetin';
        const buttonLabel = isEdit ? 'Modifiko te dhenat' : 'Regjistro Sherbimin';
        const placeholder = isEdit
            ? 'U krye nderrimi i vajit te motorit dhe zevendesimi i filtrit te vajit per te siguruar funksionim me te mire dhe mbrojtje te motorit.'
            : 'Shkruani ketu ...';

        return `
            <form class="staff-service-form" data-service-form data-mode="${escapeHTML(mode)}" data-service-id="${escapeHTML(service.id || '')}">
                <h2 id="service-modal-title">${escapeHTML(title)}</h2>
                <p class="staff-service-form__subtitle">${escapeHTML(subtitle)}</p>

                <label class="staff-service-form__upload">
                    <input type="file" accept="image/*" data-service-image hidden>
                    <span class="staff-service-form__preview" data-service-preview ${service.image ? `style="background-image:url('${escapeHTML(service.image)}')"` : ''}>
                        ${service.image ? '' : `<img src="${IMAGE_ICON_SRC}" alt="" aria-hidden="true">`}
                    </span>
                    <span>${escapeHTML(getUploadLabel(mode))}</span>
                </label>

                <label class="staff-service-form__field">
                    <span>Titulli i sherbimit</span>
                    <input data-service-title type="text" placeholder="P.sh. Nderrim vaji" value="${escapeHTML(service.title || '')}">
                </label>

                <label class="staff-service-form__field">
                    <span>Pershkrimi i sherbimit</span>
                    <textarea data-service-note placeholder="${escapeHTML(placeholder)}">${escapeHTML(service.note || '')}</textarea>
                </label>

                <div class="staff-service-form__actions">
                    <button class="staff-service-button staff-service-button--primary" type="submit">${escapeHTML(buttonLabel)}</button>
                    <button class="staff-service-button staff-service-button--secondary" type="button" data-service-cancel>Anulo</button>
                </div>
            </form>
        `;
    }

    function createMessageModal() {
        return window.StaffErrorPopup.createErrorPopup();
    }

    function createSuccessModal(message = 'Sherbimi u ruajt me sukses.') {
        return window.StaffSuccessPopup.createSuccessPopup({
            text: message
        });
    }

    function createServiceDetails(service = {}) {
        return `
            <article class="staff-service-card staff-service-card--modal">
                <h3>Detajet e Sherbimit</h3>
                <p>Ne kete seksion mund te shikoni te gjitha informacionet dhe perditesimet mbi sherbimin e kryer.</p>
                <div class="staff-service-card__image" ${service.image ? `style="background-image:url('${escapeHTML(service.image)}')"` : ''}>
                    ${service.image ? '' : `<img src="${IMAGE_ICON_SRC}" alt="" aria-hidden="true">`}
                </div>
                <h4>Informacionet mbi sherbimin me poshte</h4>
                <p class="staff-service-card__note">${escapeHTML(service.note || 'Nuk ka informacion per kete sherbim.')}</p>
            </article>
        `;
    }

    window.StaffServicePopups = {
        closeServiceModal,
        createMessageModal,
        createServiceDetails,
        createServiceForm,
        createSuccessModal,
        openServiceModal
    };
}());
