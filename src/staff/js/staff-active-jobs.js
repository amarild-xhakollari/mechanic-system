(function () {
    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

    let allJobs = [];
    let lastService = null;

    function showWorkspace() {
        const workspace = document.querySelector('#staff-service-workspace');
        if (!workspace) return;

        workspace.hidden = false;
        workspace.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideWorkspace() {
        const workspace = document.querySelector('#staff-service-workspace');
        const panel = document.querySelector('#staff-service-panel');

        if (workspace) workspace.hidden = true;
        if (panel) panel.innerHTML = '';
    }

    async function parseResponse(response) {
        const payload = await response.json().catch(() => ({
            success: false,
            message: 'Pergjigjja e serverit nuk ishte e vlefshme.'
        }));

        if (!response.ok || !payload.success) {
            throw new Error(payload.message || `Kerkesa deshtoi me ${response.status}`);
        }

        return payload;
    }

    async function submitCreate(job, formData, form) {
        formData.set('job_id', job.id);
        form.querySelector('.service-update-panel__submit').disabled = true;

        const response = await fetch('../api/create_service_update.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const payload = await parseResponse(response);
        lastService = payload.service;
        renderServiceDetails(payload.service);
    }

    async function submitEdit(service, formData, form) {
        formData.set('update_id', service.id);
        form.querySelector('.service-update-panel__submit').disabled = true;

        const response = await fetch('../api/update_service_update.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const payload = await parseResponse(response);
        lastService = payload.service;
        renderServiceDetails(payload.service);
    }

    function renderCreateForm(job) {
        const panel = document.querySelector('#staff-service-panel');
        showWorkspace();

        createServiceUpdatePanel(panel, {
            mode: 'create',
            onCancel: hideWorkspace,
            onSubmit: (formData, form) => {
                submitCreate(job, formData, form).catch((error) => {
                    form.querySelector('.service-update-panel__submit').disabled = false;
                    showMessageDialog({
                        title: 'Mesazh Gabimi',
                        message: error.message || 'Sherbimi nuk u krijua me sukses. Ju lutemi kontrolloni te dhenat dhe provoni perseri.',
                        primaryText: 'Provo perseri',
                        secondaryText: 'Hiq',
                        variant: 'danger'
                    });
                });
            }
        });
    }

    function renderEditForm(service) {
        const panel = document.querySelector('#staff-service-panel');
        showWorkspace();

        createServiceUpdatePanel(panel, {
            mode: 'edit',
            service,
            onCancel: () => renderServiceDetails(service),
            onSubmit: (formData, form) => {
                submitEdit(service, formData, form).catch((error) => {
                    form.querySelector('.service-update-panel__submit').disabled = false;
                    showMessageDialog({
                        title: 'Mesazh Gabimi',
                        message: error.message || 'Sherbimi nuk u modifikua me sukses. Ju lutemi kontrolloni te dhenat dhe provoni perseri.',
                        primaryText: 'Provo perseri',
                        secondaryText: 'Hiq',
                        variant: 'danger'
                    });
                });
            }
        });
    }

    async function deleteService(service) {
        const response = await fetch('../api/delete_service_update.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ update_id: service.id }),
            credentials: 'same-origin'
        });

        await parseResponse(response);
        lastService = null;
        hideWorkspace();
    }

    function confirmDelete(service) {
        showMessageDialog({
            title: 'Konfirmo Heqjen e Sherbimit',
            message: 'Ky veprim do te fshije pergjithmone sherbimin nga puna aktuale',
            primaryText: 'Fshi Sherbimin',
            secondaryText: 'Anulo',
            variant: 'danger',
            onPrimary: () => {
                deleteService(service).catch((error) => {
                    showMessageDialog({
                        title: 'Mesazh Gabimi',
                        message: error.message || 'Sherbimi nuk u fshi me sukses. Ju lutemi provoni perseri.',
                        primaryText: 'Provo perseri',
                        secondaryText: 'Hiq',
                        variant: 'danger'
                    });
                });
            }
        });
    }

    function renderServiceDetails(service) {
        const panel = document.querySelector('#staff-service-panel');
        showWorkspace();

        createServiceDetailPanel(panel, service, {
            onEdit: renderEditForm,
            onDelete: confirmDelete
        });
    }

    async function openLatestService(job) {
        const response = await fetch(`../api/get_service_update.php?job_id=${encodeURIComponent(job.id)}`, {
            headers: { Accept: 'application/json' },
            credentials: 'same-origin'
        });

        const payload = await parseResponse(response);
        lastService = payload.service;
        renderServiceDetails(payload.service);
    }

    function goToJobDetails(job) {
        window.location.href = `staff-job-details.html?job_id=${encodeURIComponent(job.id)}&from=active`;
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
<<<<<<< HEAD
                bindJobNavigation(card, job);
=======

                const actions = document.createElement('div');
                actions.className = 'job-card__service-actions';
                actions.innerHTML = `
                    <button class="job-card__service-action" type="button">Regjistro Sherbim</button>
                    <button class="job-card__service-secondary" type="button">Shiko Sherbimin</button>
                `;
                card.appendChild(actions);

                actions.querySelector('.job-card__service-action').addEventListener('click', () => renderCreateForm(job));
                actions.querySelector('.job-card__service-secondary').addEventListener('click', () => {
                    openLatestService(job).catch((error) => {
                        showMessageDialog({
                            title: 'Mesazh Gabimi',
                            message: error.message || 'Nuk u gjet sherbim per kete pune.',
                            primaryText: 'Provo perseri',
                            secondaryText: 'Hiq',
                            variant: 'danger'
                        });
                    });
                });
>>>>>>> 9736510a05348b1337c771a62a91d4aa0ca66432
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
        document.querySelector('[data-service-workspace-close]').addEventListener('click', hideWorkspace);
        createSearchBar(document.querySelector('#jobs-search'), {
            placeholder: 'Kerko sipas targes ose klientit',
            onSearch: searchJobs
        });
        renderJobs(allJobs);
    }

    initPage().catch((error) => console.warn('Staff active jobs could not load:', error));
}());
