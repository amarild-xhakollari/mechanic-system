(function () {
    const SEARCH_ENDPOINT = '../api/search_jobs.php';
    let allJobs = [];
    let searchTimer = null;
    let controller = null;

    function renderJobs(jobs) {
        const activeContainer = document.querySelector('#jobs-active');
        const completedContainer = document.querySelector('#jobs-completed');
        const normalizedJobs = jobs.map(AdminPages.normalizeJob);
        const activeJobs = normalizedJobs.filter((job) => !job.completed);
        const completedJobs = normalizedJobs.filter((job) => job.completed);

        renderJobGroup(activeContainer, activeJobs, 'Nuk ka pune ne proces.');
        renderJobGroup(completedContainer, completedJobs, 'Nuk ka pune te perfunduara.');
        document.querySelector('[data-jobs-count]').textContent = `${normalizedJobs.length} pune ne total`;
    }

    function renderJobGroup(container, jobs, emptyMessage) {
        container.innerHTML = '';

        if (jobs.length === 0) {
            AdminPages.renderEmpty(container, emptyMessage);
            return;
        }

        jobs.forEach((job) => {
            const card = document.createElement('article');
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
            renderJobs(allJobs);
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
                renderJobs(await response.json());
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

        createSearchBar(document.querySelector('#jobs-search'), {
            placeholder: 'Kerko sipas targes, klientit ose stafit',
            onSearch: searchJobs
        });

        renderJobs(allJobs);
    });
}());
