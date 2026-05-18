(function () {
    const STAFF_ICON_SRC = '../../../assets/images/default-icons/staff-icon.png';

    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function valueOrEmpty(value) {
        return value ? escapeHTML(value) : '<span class="staff-specification-panel__muted">Nuk ka te dhena</span>';
    }

    function createField(label, value) {
        return `
            <div class="staff-specification-panel__field">
                <p class="staff-specification-panel__label">${escapeHTML(label)}</p>
                <p class="staff-specification-panel__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function createJobCards(jobs = []) {
        if (!Array.isArray(jobs) || jobs.length === 0) {
            return '<p class="staff-specification-panel__empty">Nuk ka pune aktive per kete staf.</p>';
        }

        return `
            <div class="staff-specification-panel__jobs">
                ${jobs.map((job) => `
                    <article class="staff-specification-panel__job-card job-card" tabindex="0" role="button" data-job-id="${escapeHTML(job.id)}">
                        <div class="job-card__top">
                            <div class="job-card__identity">
                                <div class="job-card__icon" aria-hidden="true">
                                    <img src="../../../assets/images/default-icons/job-icon.png" alt="">
                                </div>
                                <div class="job-card__heading">
                                    <h2 class="job-card__title">${valueOrEmpty(job.code)}</h2>
                                    <p class="job-card__client">${valueOrEmpty(job.client)}</p>
                                </div>
                            </div>
                            <div class="job-card__status">
                                <span class="job-card__status-dot"></span>
                                <span>${escapeHTML(job.status_label || 'Aktiv')}</span>
                            </div>
                        </div>
                        <div class="job-card__content">
                            <p class="job-card__label">Data</p>
                            <p class="job-card__date">${valueOrEmpty(job.date)}</p>
                        </div>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function createStaffSpecificationPanel(container, staff = {}, options = {}) {
        if (!container) return null;

        const roles = Array.isArray(staff.roles) && staff.roles.length ? staff.roles : ['staff'];

        container.innerHTML = `
            <article class="staff-specification-panel">
                <div class="staff-specification-panel__panel-top">
                    <h2 class="staff-specification-panel__section-title">Stafi</h2>
                </div>

                <div class="staff-specification-panel__topline">
                    <span>Detajet e anetarit te stafit</span>
                </div>

                <header class="staff-specification-panel__header">
                    <div class="staff-specification-panel__avatar" aria-hidden="true">
                        <img src="${STAFF_ICON_SRC}" alt="">
                    </div>
                    <div>
                        <h1 class="staff-specification-panel__name">${valueOrEmpty(staff.name)}</h1>
                        <p class="staff-specification-panel__code">Kodi : ${valueOrEmpty(staff.code)}</p>
                    </div>
                </header>

                <section class="staff-specification-panel__section">
                    <h2 class="staff-specification-panel__section-title">Detajet e te punesuarit</h2>
                    <div class="staff-specification-panel__field-grid">
                        ${createField('Email', staff.email)}
                        ${createField('Nr Telefonit', staff.phone)}
                        ${createField('Punet Aktive', staff.active_jobs)}
                        ${createField('Punet Totale', staff.total_jobs)}
                    </div>
                </section>

                <section class="staff-specification-panel__section">
                    <h2 class="staff-specification-panel__section-title">Rolet</h2>
                    <div class="staff-specification-panel__roles">
                        ${roles.map((role) => `<span class="staff-specification-panel__role">${escapeHTML(role)}</span>`).join('')}
                    </div>
                </section>

                <section class="staff-specification-panel__section staff-specification-panel__section--last">
                    <div class="staff-specification-panel__jobs-header">
                        <h2 class="staff-specification-panel__section-title">Punet Aktive</h2>
                    </div>
                    ${createJobCards(staff.active_jobs_list)}
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

    window.createStaffSpecificationPanel = createStaffSpecificationPanel;
}());
