(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

    let allJobs = [];
    let selectedJob = null;

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

    function renderJobDetails(job = {}) {
        const panel = document.querySelector('#staff-active-details-panel');
        const details = document.querySelector('[data-active-details]');
        const listPanel = document.querySelector('.jobs-page-panel');
        const clientCode = job.clientCode || getClientCode(job.client);
        const vehicleMake = job.make || job.brand || '';

        if (!panel || !details || !listPanel) return;

        selectedJob = job;
        listPanel.hidden = true;
        details.hidden = false;

        panel.innerHTML = `
            <article class="job-specification-panel staff-active-specification">
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
                    <div class="staff-active-specification__single-field">
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
        `;

        details.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideJobDetails() {
        const details = document.querySelector('[data-active-details]');
        const listPanel = document.querySelector('.jobs-page-panel');
        const panel = document.querySelector('#staff-active-details-panel');

        selectedJob = null;
        if (details) details.hidden = true;
        if (listPanel) listPanel.hidden = false;
        if (panel) panel.innerHTML = '';
    }

    function bindJobNavigation(card, job) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Shiko detajet per ${job.code}`);
        card.addEventListener('click', () => renderJobDetails(job));
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;

            event.preventDefault();
            renderJobDetails(job);
        });
    }

    function renderJobs(jobs) {
        const container = document.querySelector('#jobs-active');
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = '<p class="empty-state">Nuk ka pune ne proces.</p>';
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
        allJobs = data.activeJobs;

        StaffPages.fillUser(data.user);
        document.querySelector('[data-details-back]')?.addEventListener('click', hideJobDetails);
        document.querySelector('[data-add-service]')?.addEventListener('click', () => {
            if (selectedJob) {
                window.location.href = `staff-job-details.html?job_id=${encodeURIComponent(selectedJob.id)}&from=active`;
            }
        });
        document.querySelector('[data-complete-job]')?.addEventListener('click', () => {
            window.alert('Perfundimi i punes nuk eshte lidhur ende pa ndryshime ne PHP.');
        });
        createSearchBar(document.querySelector('#jobs-search'), {
            placeholder: 'Kerko sipas targes ose klientit',
            onSearch: searchJobs
        });
        renderJobs(allJobs);
    }

    initPage().catch((error) => console.warn('Staff active jobs could not load:', error));
}());
