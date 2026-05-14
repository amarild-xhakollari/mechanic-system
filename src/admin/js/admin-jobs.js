(function () {
    const SEARCH_ENDPOINT = '../api/search_jobs.php';
    let allJobs = [];
    let visibleJobs = [];
    let activeFilter = 'all';
    let searchTimer = null;
    let controller = null;

    function renderJobs(jobs) {
        const activeContainer = document.querySelector('#jobs-active');
        const completedContainer = document.querySelector('#jobs-completed');
        const cancelledContainer = document.querySelector('#jobs-cancelled');
        const normalizedJobs = filterJobs(jobs.map(AdminPages.normalizeJob));
        const activeJobs = normalizedJobs.filter(isActiveJob);
        const completedJobs = normalizedJobs.filter(isCompletedJob);
        const cancelledJobs = normalizedJobs.filter(isCancelledJob);
        const activeSection = activeContainer.closest('.jobs-section');
        const completedSection = completedContainer.closest('.jobs-section');
        const cancelledSection = cancelledContainer.closest('.jobs-section');

        activeSection.hidden = activeFilter !== 'all' && activeFilter !== 'active';
        completedSection.hidden = activeFilter !== 'all' && activeFilter !== 'completed';
        cancelledSection.hidden = activeFilter !== 'all' && activeFilter !== 'cancelled';

        renderJobGroup(activeContainer, activeJobs, 'Nuk ka pune ne proces.');
        renderJobGroup(completedContainer, completedJobs, 'Nuk ka pune te perfunduara.');
        renderJobGroup(cancelledContainer, cancelledJobs, 'Nuk ka pune te anuluara.');
        document.querySelector('[data-jobs-count]').textContent = `${normalizedJobs.length} pune ne total`;
    }

    function isActiveJob(job) {
        return job.rawStatus === 'created' || job.rawStatus === 'in_progress';
    }

    function isCompletedJob(job) {
        return job.rawStatus === 'completed';
    }

    function isCancelledJob(job) {
        return job.rawStatus === 'cancelled';
    }

    function filterJobs(jobs) {
        if (activeFilter === 'active') {
            return jobs.filter(isActiveJob);
        }

        if (activeFilter === 'completed') {
            return jobs.filter(isCompletedJob);
        }

        if (activeFilter === 'cancelled') {
            return jobs.filter(isCancelledJob);
        }

        return jobs;
    }

    function setActiveFilter(nextFilter) {
        activeFilter = nextFilter;

        document.querySelectorAll('[data-job-filter]').forEach((button) => {
            const isActive = button.dataset.jobFilter === activeFilter;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', String(isActive));
        });

        renderJobs(visibleJobs);
    }

    function bindJobFilters() {
        document.querySelectorAll('[data-job-filter]').forEach((button) => {
            button.setAttribute('aria-pressed', String(button.dataset.jobFilter === activeFilter));
            button.addEventListener('click', () => setActiveFilter(button.dataset.jobFilter));
        });
    }

    function renderJobGroup(container, jobs, emptyMessage) {
        container.innerHTML = '';

        if (jobs.length === 0) {
            AdminPages.renderEmpty(container, emptyMessage);
            return;
        }

        jobs.forEach((job) => {
            const card = document.createElement('article');
            card.tabIndex = 0;
            card.setAttribute('role', 'button');
            card.setAttribute('aria-label', `Hap punen ${job.code}`);
            card.addEventListener('click', () => {
                window.location.href = `job-details.html?job_id=${encodeURIComponent(job.id)}`;
            });
            card.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    card.click();
                }
            });
            container.appendChild(card);
            createJobCard(card, job);
        });
    }

    async function searchJobs(query) {
        const value = query.trim();
        clearTimeout(searchTimer);

        if (controller) {
            controller.abort();
        }

        if (value.length < 2) {
            visibleJobs = allJobs;
            renderJobs(visibleJobs);
            return;
        }

        searchTimer = setTimeout(async () => {
            controller = new AbortController();

            try {
                const response = await fetch(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(value)}`, {
                    headers: { Accept: 'application/json' },
                    credentials: 'same-origin',
                    signal: controller.signal
                });

                if (!response.ok) throw new Error(`Search failed with ${response.status}`);
                visibleJobs = await response.json();
                renderJobs(visibleJobs);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.warn('Job search failed:', error);
                    AdminPages.showToast('Kerkimi i puneve deshtoi');
                }
            }
        }, 250);
    }

    AdminPages.loadPage((data) => {
        allJobs = Array.isArray(data.jobs) ? data.jobs : [];
        visibleJobs = allJobs;

        createSearchBar(document.querySelector('#jobs-search'), {
            placeholder: 'Kerko sipas targes, klientit ose stafit',
            onSearch: searchJobs
        });

        bindJobFilters();
        renderJobs(visibleJobs);
    });
}());
