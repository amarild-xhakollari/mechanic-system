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

    function getJobs(staff) {
        const jobs = Array.isArray(staff.jobs) ? staff.jobs : [];

        return jobs.map((job, index) => ({
            id: job.id ?? index + 1,
            plate: job.plate ?? job.code ?? 'AB 123 CD',
            client: job.client ?? job.clientName ?? 'Emri i Klientit',
            mechanics: Array.isArray(job.mechanics)
                ? job.mechanics
                : [staff.name ?? 'Emri Mekanikut 1', 'Emri Mekanikut 2'].filter(Boolean),
            date: job.date ?? job.endDate ?? '30/09/2025',
            status: job.status ?? 'Aktiv'
        }));
    }

    function getRoles(staff) {
        const roles = Array.isArray(staff.positions) ? staff.positions : [];
        return roles.length > 0 ? roles : ['Mekanik', 'Mekanik'];
    }

    function createJobCard(job) {
        return `
            <article class="staff-details-job-card" data-job-id="${escapeHTML(job.id)}">
                <div class="staff-details-job-card__top">
                    <div class="staff-details-job-card__icon" aria-hidden="true">&#128193;</div>
                    <div>
                        <p class="staff-details-job-card__plate">${escapeHTML(job.plate)}</p>
                        <p class="staff-details-job-card__client">${escapeHTML(job.client)}</p>
                    </div>
                    <div class="staff-details-job-card__status">&#8226; ${escapeHTML(job.status)}</div>
                </div>
                <hr />
                <div class="staff-details-job-card__body">
                    <p class="staff-details-job-card__muted">Staff</p>
                    <p>${job.mechanics.map(escapeHTML).join('<br>')}</p>
                    <p class="staff-details-job-card__muted">Data e P&euml;rfundimit</p>
                    <p>${escapeHTML(job.date)}</p>
                </div>
            </article>
        `;
    }

    function createStaffDetailsPage(container, staff = {}, callbacks = {}) {
        if (!container) return null;

        const jobs = getJobs(staff);
        const roles = getRoles(staff);
        const totalJobs = staff.totalJobs ?? staff.jobsTotal ?? Math.max(jobs.length, staff.jobsInProcess?.count ?? jobs.length);

        container.innerHTML = `
            <section class="staff-details-view">
                <div class="staff-details-back" data-staff-details-back></div>

                <section class="staff-details-panel">
                    <h1>Stafi</h1>

                    <div class="staff-details-section-title">
                        <span></span>
                        <p>Detajet e an&euml;tarit t&euml; stafit</p>
                        <span></span>
                    </div>

                    <div class="staff-details-person">
                        <div class="staff-details-avatar" style="background-color: ${escapeHTML(staff.avatarBg ?? '#f6a6a6')};">
                            <span></span>
                            <span></span>
                        </div>
                        <div>
                            <h2>${escapeHTML(staff.name ?? 'Arben Hoxha')}</h2>
                            <p>Kodi : ${escapeHTML(staff.code ?? 'AH001')}</p>
                        </div>
                    </div>

                    <hr />

                    <h3>Detajet e te punesuarit</h3>
                    <div class="staff-details-grid">
                        <div>
                            <label>Email</label>
                            <p>${escapeHTML(staff.email ?? 'arbenhoxha@email.com')}</p>
                        </div>
                        <div>
                            <label>Nr Telefonit</label>
                            <p>${escapeHTML(staff.phone ?? staff.phoneNumber ?? '0676572237')}</p>
                        </div>
                        <div>
                            <label>Punet Aktive</label>
                            <p>${jobs.length}</p>
                        </div>
                        <div>
                            <label>Punet Totale</label>
                            <p>${escapeHTML(totalJobs)}</p>
                        </div>
                    </div>

                    <hr />

                    <div class="staff-details-roles-wrap">
                        <h3>Rolet</h3>
                        <div class="staff-details-roles">
                            ${roles.map((role) => `<button type="button">${escapeHTML(role)}</button>`).join('')}
                        </div>
                    </div>

                    <hr />

                    <div class="staff-details-jobs-header">
                        <h3>Punet Aktive</h3>
                        <button class="staff-details-add-btn" type="button" data-staff-details-add><span>&plus;</span> Cakto pun&euml; t&euml; re</button>
                    </div>

                    <div class="staff-details-jobs-grid">
                        ${jobs.length > 0 ? jobs.map(createJobCard).join('') : '<p class="staff-details-empty">Nuk ka pune aktive.</p>'}
                    </div>
                </section>
            </section>
        `;

        const backSlot = container.querySelector('[data-staff-details-back]');
        if (typeof window.createBackButton === 'function') {
            window.createBackButton(backSlot, {
                text: 'Kthehu te lista',
                ariaLabel: 'Kthehu te lista',
                onClick: () => {
                    if (typeof callbacks.onBack === 'function') {
                        callbacks.onBack();
                    }
                }
            });
        }

        container.querySelector('[data-staff-details-add]')?.addEventListener('click', () => {
            if (typeof callbacks.onAssignJob === 'function') {
                callbacks.onAssignJob(staff);
            }
        });

        container.querySelectorAll('.staff-details-job-card').forEach((card) => {
            card.addEventListener('click', () => {
                const job = jobs.find((item) => String(item.id) === String(card.dataset.jobId));
                if (job && typeof callbacks.onJobClick === 'function') {
                    callbacks.onJobClick(job, staff);
                }
            });
        });

        return container;
    }

    window.createStaffDetailsPage = createStaffDetailsPage;
}());
