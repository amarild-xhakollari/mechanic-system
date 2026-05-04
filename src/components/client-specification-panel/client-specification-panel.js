(function () {
    const CLIENT_ICON_SRC = '../../../assets/images/default-icons/client-icon.png';
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function formatDate(value) {
        if (!value) return '';

        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) return value;

        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('/');
    }

    function statusLabel(status) {
        return {
            created: 'Aktiv',
            in_progress: 'Aktiv',
            completed: 'Perfunduar',
            cancelled: 'Anuluar'
        }[status] ?? status ?? '';
    }

    function valueOrEmpty(value) {
        return value ? escapeHTML(value) : '<span class="client-specification-panel__muted">Nuk ka te dhena</span>';
    }

    function createField(label, value) {
        return `
            <div>
                <p class="client-specification-panel__label">${escapeHTML(label)}</p>
                <p class="client-specification-panel__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function createVehicles(vehicles = []) {
        if (!Array.isArray(vehicles) || vehicles.length === 0) {
            return '<p class="client-specification-panel__empty">Ky klient nuk ka automjete te regjistruara.</p>';
        }

        return `
            <div class="client-specification-panel__vehicles">
                ${vehicles.map((vehicle) => {
                    const model = [vehicle.company_name, vehicle.car_name].filter(Boolean).join(' ');

                    return `
                        <article class="client-specification-panel__vehicle">
                            <h3 class="client-specification-panel__vehicle-title">${valueOrEmpty(vehicle.plate_number)}</h3>
                            <p class="client-specification-panel__vehicle-text">Automjeti: ${valueOrEmpty(model)}</p>
                            <p class="client-specification-panel__vehicle-text">VIN: ${valueOrEmpty(vehicle.vin)}</p>
                            <p class="client-specification-panel__vehicle-text">Karburanti: ${valueOrEmpty(vehicle.fuel_type)}</p>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    function createJobs(jobs = []) {
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return '<p class="client-specification-panel__empty">Ky klient nuk ka pune aktive.</p>';
        }

        return `
            <div class="client-specification-panel__jobs">
                ${jobs.map((job) => `
                    <article class="client-specification-panel__job-card job-card" tabindex="0" role="button" data-job-id="${escapeHTML(job.id)}">
                        <div class="job-card__top">
                            <div class="job-card__identity">
                                <div class="job-card__icon" aria-hidden="true">
                                    <img src="${JOB_ICON_SRC}" alt="">
                                </div>
                                <div class="job-card__heading">
                                    <h2 class="job-card__title">${valueOrEmpty(job.code)}</h2>
                                    <p class="job-card__client">${valueOrEmpty(job.staff)}</p>
                                </div>
                            </div>
                            <div class="job-card__status">
                                <span class="job-card__status-dot"></span>
                                <span>${escapeHTML(statusLabel(job.status))}</span>
                            </div>
                        </div>
                        <div class="job-card__content">
                            <p class="job-card__label">Data</p>
                            <p class="job-card__date">${valueOrEmpty(formatDate(job.date))}</p>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function createClientSpecificationPanel(container, client = {}, options = {}) {
        if (!container) return null;

        container.innerHTML = `
            <article class="client-specification-panel">
                <div class="client-specification-panel__panel-top">
                    <h2 class="client-specification-panel__section-title">Klienti</h2>
                </div>

                <div class="client-specification-panel__topline">
                    <span>Detajet e klientit</span>
                </div>

                <header class="client-specification-panel__header">
                    <div class="client-specification-panel__avatar" aria-hidden="true">
                        <img src="${CLIENT_ICON_SRC}" alt="">
                    </div>
                    <div>
                        <h1 class="client-specification-panel__name">${valueOrEmpty(client.name)}</h1>
                        <p class="client-specification-panel__code">Kodi : ${valueOrEmpty(client.code)}</p>
                    </div>
                </header>

                <section class="client-specification-panel__section">
                    <h2 class="client-specification-panel__section-title">Detajet e klientit</h2>
                    <div class="client-specification-panel__field-grid">
                        ${createField('Email', client.email)}
                        ${createField('Nr Telefonit', client.phone)}
                        ${createField('Automjete', client.vehicle_count)}
                        ${createField('Punet Totale', client.total_jobs)}
                    </div>
                </section>

                <section class="client-specification-panel__section">
                    <h2 class="client-specification-panel__section-title">Automjetet</h2>
                    ${createVehicles(client.vehicles)}
                </section>

                <section class="client-specification-panel__section client-specification-panel__section--last">
                    <div class="client-specification-panel__jobs-header">
                        <h2 class="client-specification-panel__section-title">Punet Aktive</h2>
                    </div>
                    ${createJobs(client.active_jobs)}
                </section>
            </article>
        `;

        container.querySelectorAll('[data-job-id]').forEach((card) => {
            card.addEventListener('click', () => {
                window.location.href = `job-details.html?job_id=${encodeURIComponent(card.dataset.jobId)}`;
            });
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    card.click();
                }
            });
        });

        return container;
    }

    window.createClientSpecificationPanel = createClientSpecificationPanel;
}());
