(function () {
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
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('/');
    }

    function getStatusLabel(status) {
        return {
            created: 'Aktiv',
            in_progress: 'Aktiv',
            completed: 'Perfunduar',
            cancelled: 'Anuluar'
        }[status] ?? status ?? '';
    }

    function getJobTypeLabel(type) {
        return {
            maintenance: 'Mirembajtje',
            damage_repair: 'Riparim demtimi'
        }[type] ?? type ?? '';
    }

    function valueOrEmpty(value) {
        return value ? escapeHTML(value) : '<span class="job-specification-panel__muted">Nuk ka te dhena</span>';
    }

    function createField(label, value) {
        return `
            <div class="job-specification-panel__field">
                <p class="job-specification-panel__label">${escapeHTML(label)}</p>
                <p class="job-specification-panel__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function createSection(title, content) {
        return `
            <section class="job-specification-panel__section">
                <h2 class="job-specification-panel__section-title">${escapeHTML(title)}</h2>
                ${content}
            </section>
        `;
    }

    function createUpdates(updates = []) {
        if (!Array.isArray(updates) || updates.length === 0) {
            return '<p class="job-specification-panel__empty">Nuk ka historik per kete pune.</p>';
        }

        return `
            <div class="job-specification-panel__updates">
                ${updates.map((update) => `
                    <article class="job-specification-panel__update">
                        <p class="job-specification-panel__update-title">
                            ${escapeHTML(getStatusLabel(update.old_status) || 'Status')} -> ${escapeHTML(getStatusLabel(update.new_status) || 'Status')}
                            ${update.updated_at ? ` | ${escapeHTML(formatDate(update.updated_at))}` : ''}
                        </p>
                        <p class="job-specification-panel__update-note">${escapeHTML(update.note || 'Pa shenim.')}</p>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function createJobSpecificationPanel(container, job = {}, options = {}) {
        if (!container) return null;

        const client = job.client ?? {};
        const staff = job.staff ?? {};
        const vehicle = job.vehicle ?? {};
        const carModel = job.car_model ?? {};
        const staffName = staff.name || '';
        const vehicleTitle = [carModel.company_name, carModel.car_name].filter(Boolean).join(' ');

        container.innerHTML = `
            <article class="job-specification-panel">
                <div class="job-specification-panel__panel-top">
                    <h2 class="job-specification-panel__section-title">Sherbimi</h2>
                </div>
                <div class="job-specification-panel__topline">
                    <span>Detajet e sherbimit</span>
                </div>

                <header class="job-specification-panel__header">
                    <div class="job-specification-panel__identity">
                        <div class="job-specification-panel__icon" aria-hidden="true">
                            <img src="${JOB_ICON_SRC}" alt="">
                        </div>
                        <div>
                            <h1 class="job-specification-panel__plate">${valueOrEmpty(vehicle.plate_number)}</h1>
                            <p class="job-specification-panel__client-name">${valueOrEmpty(client.name)}</p>
                        </div>
                    </div>
                    <div class="job-specification-panel__status">
                        <span class="job-specification-panel__status-dot"></span>
                        <span>${escapeHTML(getStatusLabel(job.status))}</span>
                    </div>
                </header>

                ${createSection('Titulli i Punes', `
                    <p class="job-specification-panel__value">${escapeHTML(getJobTypeLabel(job.job_type) || 'Sherbim')}</p>
                `)}

                ${createSection('Detajet e Klientit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Email i Klientit', client.email)}
                        ${createField('Telefoni', client.phone)}
                        ${createField('Data e Fillimit', formatDate(job.created_at))}
                        ${createField('Data e Perfundimit', job.status === 'completed' ? formatDate(job.updated_at) : '')}
                    </div>
                `)}

                ${createSection('Detajet e Automjetit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Automjeti', vehicleTitle)}
                        ${createField('VIN', vehicle.vin)}
                        ${createField('Motorri', carModel.engines)}
                        ${createField('Karburanti', carModel.fuel_type)}
                    </div>
                `)}

                ${createSection('Shenime', `
                    <p class="job-specification-panel__note">${escapeHTML(job.description || 'Nuk ka shenime per kete pune.')}</p>
                `)}

                ${createSection('Stafi i caktuar', staffName ? `
                    <div class="job-specification-panel__chips">
                        <span class="job-specification-panel__chip">${escapeHTML(staffName)}</span>
                    </div>
                ` : '<p class="job-specification-panel__empty">Nuk ka staf te caktuar.</p>')}

                ${createSection('Sherbimet e kryera deri me tani', createUpdates(job.updates))}
            </article>
        `;

        return container;
    }

    window.createJobSpecificationPanel = createJobSpecificationPanel;
}());
