(function () {
    function renderJobList(container, jobs) {
        container.innerHTML = '';

        if (jobs.length === 0) {
            AdminPages.renderEmpty(container, 'Nuk ka pune aktive.');
            return;
        }

        jobs.slice(0, 6).forEach((job) => {
            const card = document.createElement('article');
            container.appendChild(card);
            createJobCard(card, job);
        });
    }

    function renderStaffList(container, staff) {
        container.innerHTML = '';

        if (staff.length === 0) {
            AdminPages.renderEmpty(container, 'Nuk ka staf te regjistruar.');
            return;
        }

        staff.slice(0, 6).forEach((member) => {
            const card = document.createElement('article');
            container.appendChild(card);
            createStaffCard(card, member, () => AdminPages.showToast(`Staff: ${member.name}`));
        });
    }

    AdminPages.loadPage((data) => {
        document.querySelector('[data-active-jobs-count]').textContent = data.stats?.activeJobs ?? 0;
        document.querySelector('[data-staff-count]').textContent = data.stats?.staff ?? 0;
        document.querySelector('[data-clients-count]').textContent = data.stats?.clients ?? 0;

        const activeJobs = Array.isArray(data.activeJobs) ? data.activeJobs.map(AdminPages.normalizeJob) : [];
        const staff = Array.isArray(data.staff) ? data.staff.map(AdminPages.normalizeStaff) : [];

        renderJobList(document.querySelector('#home-active-jobs'), activeJobs);
        renderStaffList(document.querySelector('#home-staff'), staff);
    });
}());
