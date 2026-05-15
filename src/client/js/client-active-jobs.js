(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    ClientPages.bindLogout();
    ClientPages.bindProfileDropdown();

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

    function goToJobDetails(job) {
        window.location.href = `client-job-details.html?job_id=${encodeURIComponent(job.id)}&from=active`;
    }

    function bindJobNavigation(card, job) {
        card.setAttribute('role', 'button');
        card.setAttribute('tabindex', '0');
        card.setAttribute('aria-label', `Shiko detajet per ${job.code}`);
        card.addEventListener('click', () => goToJobDetails(job));
        card.addEventListener('keydown', (event) => {
            if (event.key !== 'Enter' && event.key !== ' ') {
                return;
            }

            event.preventDefault();
            goToJobDetails(job);
        });
    }

    function createClientJobCard(job) {
        const card = document.createElement('article');
        const staff = job.staff.length ? job.staff : ['Pa staf'];

        card.className = 'client-job-card';
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

        bindJobNavigation(card, job);
        return card;
    }

    function renderJobs(jobs) {
        const container = document.querySelector('#jobs-active');
        container.innerHTML = '';

        if (jobs.length === 0) {
            container.innerHTML = '<p class="empty-state">Nuk ka pune ne proces.</p>';
        } else {
            jobs.forEach((job) => {
                container.appendChild(createClientJobCard(job));
            });
        }

        document.querySelector('[data-jobs-count]').textContent = `${jobs.length} pune në total`;
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
        const data = await ClientPages.loadData();
        allJobs = data.activeJobs;

        ClientPages.fillUser(data.user);
        createSearchBar(document.querySelector('#jobs-search'), {
            placeholder: 'Kerko punen me ane te targave ...',
            onSearch: searchJobs
        });
        renderJobs(allJobs);
    }

    initPage().catch((error) => console.warn('Client active jobs could not load:', error));
}());
