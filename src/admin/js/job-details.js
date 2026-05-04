(function () {
    function getJobId() {
        return new URLSearchParams(window.location.search).get('job_id');
    }

    async function fetchJobDetails(jobId) {
        const response = await fetch(`../api/get_job_details.php?job_id=${encodeURIComponent(jobId)}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error(`Job details API failed with ${response.status}`);
        }

        return response.json();
    }

    AdminPages.loadPage(async () => {
        const mount = document.querySelector('#job-details-panel');
        createGoBackButton(document.querySelector('#job-details-back'), {
            fallbackHref: 'admin-jobs.html'
        });

        const jobId = getJobId();

        if (!jobId) {
            AdminPages.renderEmpty(mount, 'Mungon ID e punes.');
            return;
        }

        mount.innerHTML = '<p class="empty-state">Duke ngarkuar detajet...</p>';

        try {
            const payload = await fetchJobDetails(jobId);

            if (!payload.success) {
                AdminPages.renderEmpty(mount, payload.message || 'Puna nuk u gjet.');
                return;
            }

            createJobSpecificationPanel(mount, payload.job);
        } catch (error) {
            console.warn('Job details could not be loaded:', error);
            AdminPages.renderEmpty(mount, 'Detajet e punes nuk u ngarkuan.');
        }
    });
}());
