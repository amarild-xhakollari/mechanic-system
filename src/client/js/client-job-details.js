(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';
    const STAFF_ICON_SRC = '../../../assets/images/default-icons/staff-icon.png';

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

    function getJobId() {
        return new URLSearchParams(window.location.search).get('job_id');
    }

    function getSourcePage(job = {}) {
        const requestedSource = new URLSearchParams(window.location.search).get('from');
        const isCompletedDetailsPage = window.location.pathname.includes('client-completed-job-details.html');

        if (isCompletedDetailsPage || requestedSource === 'completed' || job.rawStatus === 'completed') {
            return {
                href: 'client-completed-jobs.html',
                linkSelector: '[data-completed-link]'
            };
        }

        return {
            href: 'client-active-jobs.html',
            linkSelector: '[data-active-link]'
        };
    }

    function setBackLink(job = {}) {
        const source = getSourcePage(job);
        const backLink = document.querySelector('[data-back-link]');
        const navLink = document.querySelector(source.linkSelector);

        if (backLink) backLink.href = source.href;
        if (navLink) {
            navLink.classList.add('is-active');
            navLink.setAttribute('aria-current', 'page');
        }
    }

    function valueOrEmpty(value) {
        return value ? escapeHTML(value) : '<span class="client-job-specification__muted">Nuk ka te dhena</span>';
    }

    function getJobTypeLabel(type) {
        return {
            maintenance: 'Servisim Periodik',
            damage_repair: 'Riparim demtimi'
        }[type] ?? type ?? 'Sherbim';
    }

    function createField(label, value) {
        return `
            <div class="client-job-specification__field">
                <p class="client-job-specification__label">${escapeHTML(label)}</p>
                <p class="client-job-specification__value">${valueOrEmpty(value)}</p>
            </div>
        `;
    }

    function createSection(title, content, extraClass = '') {
        return `
            <section class="client-job-specification__section ${extraClass}">
                <h2 class="client-job-specification__section-title">${escapeHTML(title)}</h2>
                ${content}
            </section>
        `;
    }

    function createServiceSummary(job = {}) {
        const title = getJobTypeLabel(job.type);
        const description = job.description || 'Nuk ka ende informacion te detajuar per kete sherbim.';

        return `
            <section class="client-service-detail">
                <div class="client-service-detail__copy">
                    <h2>Detajet e Sherbimit</h2>
                    <p>Ne kete seksion mund te shikoni te gjitha informacionet dhe perditesimet mbi sherbimin e kryer.</p>
                </div>
                <div class="client-service-detail__visual" aria-hidden="true">
                    <div class="client-service-detail__car"></div>
                    <div class="client-service-detail__mechanic"></div>
                    <div class="client-service-detail__clipboard"></div>
                </div>
                <div class="client-service-detail__body">
                    <h3>Informacionet mbi sherbimin me poshte</h3>
                    <p>${escapeHTML(title)}: ${escapeHTML(description)}</p>
                </div>
            </section>
        `;
    }

    function createStaffCards(staff = []) {
        const staffList = staff.length ? staff : ['Pa staf'];

        return `
            <div class="client-job-specification__staff-grid">
                ${staffList.map((staffName) => `
                    <article class="client-job-specification__staff-card" role="button" tabindex="0" data-staff-name="${escapeHTML(staffName)}">
                        <div class="client-job-specification__staff-avatar" aria-hidden="true">
                            <img src="${STAFF_ICON_SRC}" alt="">
                        </div>
                        <p class="client-job-specification__staff-name">${escapeHTML(staffName)}</p>
                        <span class="client-job-specification__staff-divider" aria-hidden="true"></span>
                        <span class="client-job-specification__staff-role">Mekanik</span>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function bindStaffNavigation(container, job = {}) {
        container.querySelectorAll('[data-staff-name]').forEach((card) => {
            function openStaff() {
                const staffName = card.dataset.staffName;
                if (!staffName || staffName === 'Pa staf') return;

                const source = job.rawStatus === 'completed' ? 'completed' : 'active';
                const staffDetailsPage = source === 'completed'
                    ? 'client-completed-staff-details.html'
                    : 'client-staff-details.html';
                window.location.href = `${staffDetailsPage}?staff=${encodeURIComponent(staffName)}&from=${source}`;
            }

            card.addEventListener('click', openStaff);
            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openStaff();
            });
        });
    }

    function renderJobDetails(container, job = {}) {
        const vehicle = job.vehicle || {};

        container.innerHTML = `
            <article class="client-job-specification">
                <h2 class="client-job-specification__title">Puna</h2>

                <div class="client-job-specification__topline">
                    <span>Detajet e Punës</span>
                </div>

                <header class="client-job-specification__header">
                    <div class="client-job-specification__identity">
                        <div class="client-job-specification__icon" aria-hidden="true">
                            <img src="${JOB_ICON_SRC}" alt="">
                        </div>
                        <h1 class="client-job-specification__plate">${valueOrEmpty(job.code)}</h1>
                    </div>
                    <div class="client-job-specification__status">
                        <span class="client-job-specification__status-dot"></span>
                        <span>${escapeHTML(job.status)}</span>
                    </div>
                </header>

                ${createSection('Detajet e Punes', `
                    <div class="client-job-specification__single-field">
                        ${createField('Titulli i Punës', getJobTypeLabel(job.type))}
                    </div>
                    <div class="client-job-specification__field-grid">
                        ${createField('Data e Fillimit', job.createdDate || job.date)}
                        ${createField('Data e Përfundimit', job.date)}
                    </div>
                `)}

                ${createSection('Stafi i Caktuar për Punën', createStaffCards(job.staff))}

                ${createSection('Detajet e Automjetit', `
                    <div class="client-job-specification__field-grid">
                        ${createField('Targa', vehicle.plate || job.code)}
                        ${createField('Marka', vehicle.company)}
                        ${createField('Modeli', vehicle.model)}
                        ${createField('Ngjyra', vehicle.color)}
                    </div>
                `)}

                ${createSection('Shënime', `
                    <p class="client-job-specification__note">${escapeHTML(job.description || 'Nuk ka shenime per kete pune.')}</p>
                `)}

                ${createServiceSummary(job)}
            </article>
        `;
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="client-job-details-empty">${escapeHTML(message)}</p>`;
    }

    async function initPage() {
        const mount = document.querySelector('#client-job-details-panel');
        const jobId = getJobId();

        if (!mount) return;

        if (!jobId) {
            setBackLink();
            renderEmpty(mount, 'Mungon ID e punes.');
            return;
        }

        const data = await ClientPages.loadData();
        ClientPages.fillUser(data.user);

        const job = data.jobs.find((item) => String(item.id) === String(jobId));
        setBackLink(job);

        if (!job) {
            renderEmpty(mount, 'Puna nuk u gjet.');
            return;
        }

        renderJobDetails(mount, job);
        bindStaffNavigation(mount, job);
    }

    initPage().catch((error) => {
        console.warn('Client job details could not load:', error);
        const mount = document.querySelector('#client-job-details-panel');
        if (mount) {
            renderEmpty(mount, 'Detajet e punes nuk u ngarkuan.');
        }
    });
}());
