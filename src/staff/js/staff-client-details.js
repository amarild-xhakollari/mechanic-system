(function () {
    const CLIENT_ICON_SRC = '../../../assets/images/default-icons/client-icon.png';
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

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
        return value ? escapeHTML(value) : '<span class="client-specification-panel__muted">Nuk ka te dhena</span>';
    }

    function getClientId() {
        return new URLSearchParams(window.location.search).get('client_id');
    }

    function getStatusLabel(status) {
        return {
            created: 'Aktiv',
            in_progress: 'Aktiv',
            completed: 'Perfunduar',
            cancelled: 'Anuluar'
        }[status] ?? status ?? '';
    }

    function createField(label, value) {
        return `
            <div>
                <p class="client-specification-panel__label">${escapeHTML(label)}</p>
                <p class="client-specification-panel__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function createRelatedJobs(jobs = []) {
        if (jobs.length === 0) {
            return '<p class="client-specification-panel__empty">Ky klient nuk ka pune te lidhura me ju.</p>';
        }

        return `
            <div class="client-specification-panel__jobs staff-client-details__jobs">
                ${jobs.map((job) => {
                    const source = job.rawStatus === 'completed' ? 'completed' : 'active';

                    return `
                        <article class="client-specification-panel__job-card job-card staff-client-details__job-card" tabindex="0" role="button" data-job-id="${escapeHTML(job.id)}" data-source="${escapeHTML(source)}">
                            <div class="job-card__top">
                                <div class="job-card__identity">
                                    <div class="job-card__icon" aria-hidden="true">
                                        <img src="${JOB_ICON_SRC}" alt="">
                                    </div>
                                    <div class="job-card__heading">
                                        <h2 class="job-card__title">${valueOrEmpty(job.code)}</h2>
                                        <p class="job-card__client">${valueOrEmpty(job.client)}</p>
                                    </div>
                                </div>
                                <div class="job-card__status">
                                    <span class="job-card__status-dot"></span>
                                    <span>${escapeHTML(getStatusLabel(job.rawStatus))}</span>
                                </div>
                            </div>
                            <div class="job-card__content">
                                <div class="job-card__mechanics">
                                    <p class="job-card__label">Staff</p>
                                    ${(job.staff || []).map((staffName) => `<p class="job-card__mechanic">${escapeHTML(staffName)}</p>`).join('')}
                                </div>
                                <p class="job-card__label job-card__date-label">Data e Perfundimit</p>
                                <p class="job-card__date">${valueOrEmpty(job.date)}</p>
                            </div>
                        </article>
                    `;
                }).join('')}
            </div>
        `;
    }

    function renderClientDetails(container, client = {}, jobs = []) {
        const relatedJobs = jobs.filter((job) => job.client === client.name);
        const activeJobs = relatedJobs.filter((job) => job.rawStatus === 'created' || job.rawStatus === 'in_progress');

        container.innerHTML = `
            <article class="client-specification-panel staff-client-details">
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
                        ${createField('Punet Aktive', activeJobs.length)}
                        ${createField('Punet Totale', relatedJobs.length)}
                    </div>
                </section>

                <section class="client-specification-panel__section client-specification-panel__section--last">
                    <div class="client-specification-panel__jobs-header">
                        <h2 class="client-specification-panel__section-title">Punet e lidhura me kete klient</h2>
                    </div>
                    ${createRelatedJobs(relatedJobs)}
                </section>
            </article>
        `;

        container.querySelectorAll('[data-job-id]').forEach((card) => {
            function openJob() {
                window.location.href = `staff-job-details.html?job_id=${encodeURIComponent(card.dataset.jobId)}&from=${encodeURIComponent(card.dataset.source)}`;
            }

            card.addEventListener('click', openJob);
            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;

                event.preventDefault();
                openJob();
            });
        });
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="empty-state">${message}</p>`;
    }

    async function initPage() {
        const mount = document.querySelector('#staff-client-details-panel');
        const clientId = getClientId();

        if (!mount) return;

        if (!clientId) {
            renderEmpty(mount, 'Mungon ID e klientit.');
            return;
        }

        mount.innerHTML = '<p class="empty-state">Duke ngarkuar detajet...</p>';

        const data = await StaffPages.loadData();
        StaffPages.fillUser(data.user);

        const client = data.clients.find((item) => String(item.id) === String(clientId));
        if (!client) {
            renderEmpty(mount, 'Klienti nuk u gjet.');
            return;
        }

        renderClientDetails(mount, client, data.jobs);
    }

    initPage().catch((error) => {
        console.warn('Staff client details could not load:', error);
        const mount = document.querySelector('#staff-client-details-panel');
        if (mount) {
            renderEmpty(mount, 'Detajet e klientit nuk u ngarkuan.');
        }
    });
}());
