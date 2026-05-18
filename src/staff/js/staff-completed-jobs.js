(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

    let allJobs = [];

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
        return value ? escapeHTML(value) : '<span class="job-specification-panel__muted">Nuk ka te dhena</span>';
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
            maintenance: 'Servisim Periodik',
            damage_repair: 'Riparim demtimi'
        }[type] ?? type ?? 'Sherbim';
    }

    function getClientCode(name = '') {
        const source = String(name || 'KL').replace(/[^a-zA-Z]/g, '').toUpperCase();
        const letters = `${source.slice(0, 2)}KL`.slice(0, 2);
        return `${letters}01`;
    }

    function createField(label, value) {
        return `
            <div class="job-specification-panel__field">
                <p class="job-specification-panel__label">${escapeHTML(label)}</p>
                <p class="job-specification-panel__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function createSection(title, content, extraClass = '') {
        return `
            <section class="job-specification-panel__section ${extraClass}">
                <h2 class="job-specification-panel__section-title">${escapeHTML(title)}</h2>
                ${content}
            </section>
        `;
    }

    async function fetchJson(url) {
        const response = await fetch(url, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });
        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success === false) {
            throw new Error(result.message || 'Te dhenat nuk u ngarkuan.');
        }

        return result;
    }

    function createCompletedServiceCard(service = {}) {
        if (typeof window.createServiceCardMarkup === 'function') {
            return window.createServiceCardMarkup(service);
        }

        const image = service.image || service.image_url || '';
        const note = service.description || service.note || '';

        return `
            <article class="staff-service-card">
                <h3>${escapeHTML(service.title || 'Detajet e Sherbimit')}</h3>
                <p>Ne kete seksion mund te shikoni te gjitha informacionet dhe perditesimet mbi sherbimin e kryer.</p>
                <div class="staff-service-card__image" ${image ? `style="background-image:url('${escapeHTML(image)}')"` : ''}></div>
                <h4>Informacionet mbi sherbimin me poshte</h4>
                <p class="staff-service-card__note">${escapeHTML(note)}</p>
            </article>
        `;
    }

    async function loadCompletedServices(jobId) {
        const list = document.querySelector('[data-completed-services-list]');
        if (!list) return;

        list.innerHTML = '<p class="staff-completed-services__empty">Duke ngarkuar sherbimet...</p>';

        try {
            const result = await fetchJson(`../api/get_job_services.php?job_id=${encodeURIComponent(jobId)}`);
            const services = Array.isArray(result.services) ? result.services : [];

            if (services.length === 0) {
                list.innerHTML = '<p class="staff-completed-services__empty">Nuk ka sherbime te regjistruara per kete pune.</p>';
                return;
            }

            list.innerHTML = services.map(createCompletedServiceCard).join('');
            list.querySelectorAll('[data-service-details]').forEach((card) => {
                card.removeAttribute('role');
                card.removeAttribute('tabindex');
            });
        } catch (error) {
            list.innerHTML = `<p class="staff-completed-services__empty">${escapeHTML(error.message)}</p>`;
        }
    }

    function renderJobDetails(job = {}) {
        const panel = document.querySelector('#staff-completed-details-panel');
        const details = document.querySelector('[data-completed-details]');
        const listPanel = document.querySelector('.jobs-page-panel');
        const clientCode = job.clientCode || getClientCode(job.client);
        const vehicleMake = job.make || job.brand || '';

        if (!panel || !details || !listPanel) return;

        listPanel.hidden = true;
        details.hidden = false;

        panel.innerHTML = `
            <article class="job-specification-panel staff-completed-specification">
                <div class="job-specification-panel__panel-top">
                    <h2 class="job-specification-panel__section-title">Sherbimi</h2>
                </div>

                <div class="job-specification-panel__topline">
                    <span>Detajet e Punes</span>
                </div>

                <header class="job-specification-panel__header">
                    <div class="job-specification-panel__identity">
                        <div class="job-specification-panel__icon" aria-hidden="true">
                            <img src="${JOB_ICON_SRC}" alt="">
                        </div>
                        <div>
                            <h1 class="job-specification-panel__plate">${valueOrEmpty(job.code)}</h1>
                            <p class="job-specification-panel__client-name">${valueOrEmpty(job.client)}</p>
                        </div>
                    </div>
                    <div class="job-specification-panel__status">
                        <span class="job-specification-panel__status-dot"></span>
                        <span>${escapeHTML(getStatusLabel(job.rawStatus))}</span>
                    </div>
                </header>

                ${createSection('Detajet e Punes', `
                    <div class="staff-completed-specification__single-field">
                        ${createField('Titulli i Punes', getJobTypeLabel(job.type))}
                    </div>
                    <div class="job-specification-panel__field-grid">
                        ${createField('Data e Fillimit', job.date)}
                        ${createField('Data e Perfundimit', job.endDate)}
                    </div>
                `)}

                ${createSection('Detajet e Klientit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Emri i Klientit', job.client)}
                        ${createField('Numri i telefonit', job.clientPhone)}
                        ${createField('Kodi i Klientit', clientCode)}
                        ${createField('Email i Klientit', job.clientEmail)}
                    </div>
                `)}

                ${createSection('Detajet e Automjetit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Targa', job.code)}
                        ${createField('Marka', vehicleMake)}
                        ${createField('Modeli', job.model)}
                        ${createField('Ngjyra', job.color)}
                    </div>
                `)}

                ${createSection('Shenime', `
                    <p class="job-specification-panel__note">${escapeHTML(job.description || 'Nuk ka shenime per kete pune.')}</p>
                `, 'job-specification-panel__section--last')}
            </article>

            <section class="staff-completed-services">
                <div class="staff-completed-services__header">
                    <h2>Sherbimet e kryera</h2>
                </div>
                <div class="staff-completed-services__grid" data-completed-services-list></div>
            </section>
        `;

        loadCompletedServices(job.id);
        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideJobDetails() {
        const details = document.querySelector('[data-completed-details]');
        const listPanel = document.querySelector('.jobs-page-panel');
        const panel = document.querySelector('#staff-completed-details-panel');

        if (details) details.hidden = true;
        if (listPanel) listPanel.hidden = false;
        if (panel) panel.innerHTML = '';
    }

    function bindJobNavigation(card, job) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Shiko detajet per ${job.code}`);
        card.addEventListener('click', () => {
            window.location.href = `staff-job-details.html?job_id=${encodeURIComponent(job.id)}&from=completed`;
        });
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            event.preventDefault();
            window.location.href = `staff-job-details.html?job_id=${encodeURIComponent(job.id)}&from=completed`;
        });
    }

    function renderJobs(jobs) {
        const container = document.querySelector('#jobs-completed');
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = '<p class="empty-state">Nuk ka pune te perfunduara.</p>';
        } else {
            jobs.forEach((job) => {
                const card = document.createElement('article');
                container.appendChild(card);
                createJobCard(card, {
                    ...job,
                    mechanics: job.staff,
                    date: job.date
                });
                bindJobNavigation(card, job);
            });
        }

        document.querySelector('[data-jobs-count]').textContent = `${jobs.length} pune ne total`;
    }

    function getSearchText(job) {
        return [job.code, job.client, job.status, job.date, ...job.staff].join(' ').toLowerCase();
    }

    function searchJobs(query = '') {
        const value = query.trim().toLowerCase();
        const jobs = value.length < 2
            ? allJobs
            : allJobs.filter((job) => getSearchText(job).includes(value));

        renderJobs(jobs);
    }

    async function initPage() {
        const data = await StaffPages.loadData();
        allJobs = data.completedJobs;

        StaffPages.fillUser(data.user);
        document.querySelector('[data-details-back]')?.addEventListener('click', hideJobDetails);
        createSearchBar(document.querySelector('#jobs-search'), {
            placeholder: 'Kerko sipas targes ose klientit',
            onSearch: searchJobs
        });
        renderJobs(allJobs);
    }

    initPage().catch((error) => console.warn('Staff completed jobs could not load:', error));
}());
