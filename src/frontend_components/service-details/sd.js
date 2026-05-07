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

    function renderJobIcon() {
        return `
            <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M9 22.5c0-4 3.2-7.2 7.2-7.2h10.4c2 0 3.9.8 5.2 2.3l3 3.2h13c4 0 7.2 3.2 7.2 7.2v19.5H9v-25z" fill="#242424"></path>
                <path d="M9 29.5h46v18H9v-18z" fill="#303030"></path>
                <path d="M9 29.5h46v7H9v-7z" fill="#555555"></path>
                <path d="M9 29.5h46" stroke="#6f6f6f" stroke-width="2"></path>
            </svg>
        `;
    }

    function createField(label, value, isWide) {
        return `
            <div class="sd__field${isWide ? ' sd__field--wide' : ''}">
                <p class="sd__label">${escapeHTML(label)}</p>
                <p class="sd__value">${escapeHTML(value)}</p>
            </div>
        `;
    }

    function createServiceDetails(container, data = {}) {
        if (!container) {
            return null;
        }

        const service = {
            title: data.title ?? 'Sh\u00ebrbimi',
            detailsTitle: data.detailsTitle ?? 'Detajet e sh\u00ebrbimit',
            code: data.code ?? 'AB 123 CD',
            clientName: data.clientName ?? 'Emri i Klienti',
            status: data.status ?? 'Aktiv',
            jobTitle: data.jobTitle ?? 'Servisim Periodik',
            startDate: data.startDate ?? '25/09/2026',
            endDate: data.endDate ?? '30/09/2026',
            clientEmailAsName: data.clientEmailAsName ?? 'klient1@email.com',
            clientPhone: data.clientPhone ?? '067 888 8888',
            clientCode: data.clientCode ?? 'C01E',
            clientEmail: data.clientEmail ?? 'klient@email.com',
            plate: data.plate ?? 'AB 123 CD',
            brand: data.brand ?? 'BWM',
            model: data.model ?? 'Sedan',
            color: data.color ?? 'E zeze',
            notes: data.notes ?? ''
        };

        container.classList.add('sd');
        container.innerHTML = `
            <div class="sd__inner">
                <h2 class="sd__title">${escapeHTML(service.title)}</h2>

                <div class="sd__divider-title">
                    <span class="sd__divider-label">${escapeHTML(service.detailsTitle)}</span>
                </div>

                <div class="sd__hero">
                    <div class="sd__identity">
                        <span class="sd__icon" aria-hidden="true">${renderJobIcon()}</span>
                        <div>
                            <h3 class="sd__code">${escapeHTML(service.code)}</h3>
                            <p class="sd__client">${escapeHTML(service.clientName)}</p>
                        </div>
                    </div>
                    <span class="sd__status" aria-label="Status: ${escapeHTML(service.status)}">
                        <span class="sd__status-dot" aria-hidden="true"></span>
                        <span>${escapeHTML(service.status)}</span>
                    </span>
                </div>

                <section class="sd__section">
                    <h3 class="sd__section-title">Detajet e Punes</h3>
                    <div class="sd__fields">
                        ${createField('Titulli i Pun\u00ebs', service.jobTitle, true)}
                        ${createField('Data e Fillimit', service.startDate)}
                        ${createField('Data e P\u00ebrfundimit', service.endDate)}
                    </div>
                </section>

                <section class="sd__section">
                    <h3 class="sd__section-title">Detajet e Klientit</h3>
                    <div class="sd__fields">
                        ${createField('Emri i Klientit', service.clientEmailAsName)}
                        ${createField('Numri i telefonit', service.clientPhone)}
                        ${createField('Kodi i Klientit', service.clientCode)}
                        ${createField('Email i Klientit', service.clientEmail)}
                    </div>
                </section>

                <section class="sd__section">
                    <h3 class="sd__section-title">Detajet e Automjetit</h3>
                    <div class="sd__fields">
                        ${createField('Targa', service.plate)}
                        ${createField('Marka', service.brand)}
                        ${createField('Modeli', service.model)}
                        ${createField('Ngjyra', service.color)}
                    </div>
                </section>

                <section class="sd__section">
                    <h3 class="sd__section-title">Sh\u00ebnime</h3>
                    <p class="sd__notes">${escapeHTML(service.notes)}</p>
                </section>
            </div>
        `;

        return container;
    }

    window.createServiceDetails = createServiceDetails;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = { createServiceDetails };
    }
}());
