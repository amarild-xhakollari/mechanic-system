(function () {
    const FALLBACK_IMAGE = '../../../assets/images/screenshots/staff-page.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function createServiceDetailPanel(container, service = {}, callbacks = {}) {
        if (!container) return null;

        container.innerHTML = `
            <article class="service-detail-panel">
                <header>
                    <h1 class="service-detail-panel__title">Detajet e Sherbimit</h1>
                    <p class="service-detail-panel__subtitle">Ne kete seksion mund te shikoni te gjitha informacionet dhe perditesimet mbi sherbimin e kryer.</p>
                </header>

                <img class="service-detail-panel__image" src="${escapeHTML(service.image_url || FALLBACK_IMAGE)}" alt="">

                <section>
                    <h2 class="service-detail-panel__section-title">Informacionet mbi sherbimin me poshte</h2>
                    <p class="service-detail-panel__note">${escapeHTML(service.note || 'Nuk ka informacion per kete sherbim.')}</p>
                </section>

                <div class="service-detail-panel__actions">
                    <button class="service-detail-panel__edit" type="button" data-service-edit>Modifiko Sherbimin</button>
                    <button class="service-detail-panel__delete" type="button" data-service-delete>Fshi Sherbimin</button>
                </div>
            </article>
        `;

        container.querySelector('[data-service-edit]').addEventListener('click', () => {
            if (typeof callbacks.onEdit === 'function') callbacks.onEdit(service);
        });

        container.querySelector('[data-service-delete]').addEventListener('click', () => {
            if (typeof callbacks.onDelete === 'function') callbacks.onDelete(service);
        });

        return container;
    }

    window.createServiceDetailPanel = createServiceDetailPanel;
}());
