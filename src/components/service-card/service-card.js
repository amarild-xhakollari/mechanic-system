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

    function getImageSource(service = {}) {
        return service.image || service.image_url || service.image_path || '';
    }

    function getDescription(service = {}) {
        return service.description || service.note || 'Nuk ka informacion per kete sherbim.';
    }

    function createServiceCardMarkup(service = {}) {
        const serviceId = service.id || service.service_id || '';
        const imageSource = getImageSource(service);
        const description = getDescription(service);

        return `
            <article class="staff-service-card service-card" role="button" tabindex="0" data-service-details="${escapeHTML(serviceId)}">
                <h3>${escapeHTML(service.title || 'Detajet e Sherbimit')}</h3>
                <p>Ne kete seksion mund te shikoni te gjitha informacionet dhe perditesimet mbi sherbimin e kryer.</p>
                <div class="staff-service-card__image service-card__image" ${imageSource ? `style="background-image:url('${escapeHTML(imageSource)}')"` : ''}>
                    ${imageSource ? '' : `<img src="${IMAGE_ICON_SRC}" alt="" aria-hidden="true">`}
                </div>
                <h4>Informacionet mbi sherbimin me poshte</h4>
                <p class="staff-service-card__note service-card__note">${escapeHTML(description)}</p>
            </article>
        `;
    }

    function createServiceCard(container, service = {}, callbacks = {}) {
        if (!container) return null;

        container.innerHTML = createServiceCardMarkup(service);

        const card = container.querySelector('[data-service-details]');
        if (!card) return container;

        card.addEventListener('click', () => {
            if (typeof callbacks.onSelect === 'function') callbacks.onSelect(service);
        });

        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            if (typeof callbacks.onSelect === 'function') callbacks.onSelect(service);
        });

        return card;
    }

    window.createServiceCard = createServiceCard;
    window.createServiceCardMarkup = createServiceCardMarkup;
}());
