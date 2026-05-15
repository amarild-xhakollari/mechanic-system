(function () {
    const STAFF_ICON_SRC = '../../../assets/images/default-icons/staff-icon.png';
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    ClientPages.bindLogout();
    ClientPages.bindProfileDropdown();

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
        return value ? escapeHTML(value) : '<span class="client-staff-profile__muted">Nuk ka te dhena</span>';
    }

    function getStaffName() {
        return new URLSearchParams(window.location.search).get('staff');
    }

    function getFrom() {
        const requested = new URLSearchParams(window.location.search).get('from');
        if (requested) return requested;

        return window.location.pathname.includes('client-completed-staff-details.html')
            ? 'completed'
            : 'active';
    }

    function getStaffCode(name = '') {
        const source = String(name || 'Staff').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const letters = `${source.slice(0, 2)}ST`.slice(0, 2);
        return `${letters}001`;
    }

    function createField(label, value) {
        return `
            <div>
                <p class="client-staff-profile__label">${escapeHTML(label)}</p>
                <p class="client-staff-profile__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function getSearchText(job) {
        return [job.code, job.client, job.status, job.date, ...job.staff].join(' ').toLowerCase();
    }

    function createJobCard(job) {
        const card = document.createElement('article');
        const staff = job.staff.length ? job.staff : ['Pa staf'];
        const source = job.rawStatus === 'completed' ? 'completed' : 'active';
        const detailsHref = source === 'completed' ? 'client-completed-job-details.html' : 'client-job-details.html';

        card.className = 'client-job-card';
        card.dataset.searchText = getSearchText(job);
        card.innerHTML = `
            <div class="client-job-card__top">
                <div class="client-job-card__identity">
                    <div class="client-job-card__icon" aria-hidden="true">
                        <img src="${JOB_ICON_SRC}" alt="">
                    </div>
                    <div>
                        <h3 class="client-job-card__code">${escapeHTML(job.code)}</h3>
                        <p class="client-job-card__client">${escapeHTML(job.client)}</p>
                    </div>
                </div>
                <div class="client-job-card__status" aria-label="Status: ${escapeHTML(job.status)}">
                    <span class="client-job-card__status-dot"></span>
                    <span>${escapeHTML(job.status)}</span>
                </div>
            </div>
            <div class="client-job-card__content">
                <p class="client-job-card__label">Staff</p>
                <div class="client-job-card__staff">
                    ${staff.map((member) => `<p class="client-job-card__staff-member">${escapeHTML(member)}</p>`).join('')}
                </div>
                <p class="client-job-card__label">Data e Përfundimit</p>
                <p class="client-job-card__date">${escapeHTML(job.date || 'Pa date')}</p>
            </div>
        `;

        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Shiko detajet per ${job.code}`);

        function openJob() {
            window.location.href = `${detailsHref}?job_id=${encodeURIComponent(job.id)}&from=${source}`;
        }

        card.addEventListener('click', openJob);
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            openJob();
        });

        return card;
    }

    function renderJobs(container, jobs) {
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = '<p class="client-staff-details-empty">Nuk ka pune te lidhura me kete staf.</p>';
            return;
        }

        jobs.forEach((job) => {
            container.appendChild(createJobCard(job));
        });
    }

    function setBackLink() {
        const backLink = document.querySelector('[data-back-link]');
        if (!backLink) return;

        backLink.href = getFrom() === 'completed'
            ? 'client-completed-jobs.html'
            : 'client-active-jobs.html';
    }

    function renderStaffDetails(container, staffName, jobs) {
        const linkedJobs = jobs.filter((job) => job.staff.some((member) => member === staffName));
        const activeJobs = linkedJobs.filter((job) => job.rawStatus === 'created' || job.rawStatus === 'in_progress');
        const firstJob = linkedJobs[0] || {};

        container.innerHTML = `
            <article class="client-staff-profile">
                <h2 class="client-staff-profile__title">Stafi</h2>

                <div class="client-staff-profile__topline">
                    <span>Detajet e anëtarit të stafit</span>
                </div>

                <header class="client-staff-profile__header">
                    <div class="client-staff-profile__avatar" aria-hidden="true">
                        <img src="${STAFF_ICON_SRC}" alt="">
                    </div>
                    <div>
                        <h1 class="client-staff-profile__name">${valueOrEmpty(staffName)}</h1>
                        <p class="client-staff-profile__code">Kodi : ${escapeHTML(getStaffCode(staffName))}</p>
                    </div>
                </header>

                <section class="client-staff-profile__section">
                    <h2 class="client-staff-profile__section-title">Detajet e te punesuarit</h2>
                    <div class="client-staff-profile__field-grid">
                        ${createField('Email', '')}
                        ${createField('Nr Telefonit', '')}
                        ${createField('Punet Aktive', activeJobs.length)}
                        ${createField('Punet Totale', linkedJobs.length)}
                    </div>
                </section>

                <section class="client-staff-profile__section">
                    <h2 class="client-staff-profile__section-title">Rolet</h2>
                    <div class="client-staff-profile__roles">
                        <span class="client-staff-profile__role">Mekanik</span>
                        <span class="client-staff-profile__role">${firstJob.type === 'damage_repair' ? 'Riparime' : 'Mekanik'}</span>
                    </div>
                </section>

                <section class="client-staff-profile__section client-staff-profile__section--last">
                    <h2 class="client-staff-profile__section-title">Punet e lidhura me ty</h2>
                    <div class="client-staff-profile__jobs" data-staff-jobs></div>
                </section>
            </article>
        `;

        renderJobs(container.querySelector('[data-staff-jobs]'), linkedJobs);
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="client-staff-details-empty">${escapeHTML(message)}</p>`;
    }

    async function initPage() {
        const mount = document.querySelector('#client-staff-details-panel');
        const staffName = getStaffName();

        if (!mount) return;

        setBackLink();

        if (!staffName) {
            renderEmpty(mount, 'Mungon emri i stafit.');
            return;
        }

        const data = await ClientPages.loadData();
        ClientPages.fillUser(data.user);

        const jobs = data.jobs.filter((job) => job.staff.some((member) => member === staffName));
        if (jobs.length === 0) {
            renderEmpty(mount, 'Stafi nuk u gjet per punet tuaja.');
            return;
        }

        renderStaffDetails(mount, staffName, data.jobs);
    }

    initPage().catch((error) => {
        console.warn('Client staff details could not load:', error);
        const mount = document.querySelector('#client-staff-details-panel');
        if (mount) {
            renderEmpty(mount, 'Detajet e stafit nuk u ngarkuan.');
        }
    });
}());
