(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';

    let services = [];

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

    function formatDate(value) {
        if (!value) return '';

        const date = new Date(String(value).replace(' ', 'T'));
        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return [
            String(date.getDate()).padStart(2, '0'),
            String(date.getMonth() + 1).padStart(2, '0'),
            date.getFullYear()
        ].join('/');
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

    function valueOrEmpty(value) {
        return value ? escapeHTML(value) : '<span class="job-specification-panel__muted">Nuk ka te dhena</span>';
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

    function normalizeJob(job = {}) {
        const client = job.client ?? {};
        const staff = job.staff ?? {};
        const vehicle = job.vehicle ?? {};
        const carModel = job.car_model ?? {};
        const make = carModel.company_name || '';
        const model = carModel.car_name || '';

        return {
            id: job.id,
            rawStatus: job.status,
            code: vehicle.plate_number || 'Pa targe',
            client: client.name || '',
            clientPhone: client.phone || '',
            clientEmail: client.email || '',
            clientCode: getClientCode(client.name || ''),
            type: job.job_type,
            date: formatDate(job.created_at),
            completedDate: formatDate(job.updated_at),
            make,
            model,
            color: '',
            description: job.description || '',
            staffName: staff.name || ''
        };
    }

    function renderJobDetails(container, rawJob = {}) {
        const job = normalizeJob(rawJob);
        const isCompleted = job.rawStatus === 'completed';

        container.innerHTML = `
            <article class="job-specification-panel staff-job-specification">
                <div class="job-specification-panel__panel-top">
                    <h2 class="job-specification-panel__section-title">Detajet e punes se zgjedhur</h2>
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
                    <div class="staff-job-specification__single-field">
                        ${createField('Titulli i Punes', getJobTypeLabel(job.type))}
                    </div>
                    <div class="job-specification-panel__field-grid">
                        ${createField('Data e Fillimit', job.date)}
                        ${createField('Data e Perfundimit', isCompleted ? job.completedDate : '')}
                    </div>
                `)}

                ${createSection('Detajet e Klientit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Emri i Klientit', job.client)}
                        ${createField('Numri i telefonit', job.clientPhone)}
                        ${createField('Kodi i Klientit', job.clientCode)}
                        ${createField('Email i Klientit', job.clientEmail)}
                    </div>
                `)}

                ${createSection('Detajet e Automjetit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Targa', job.code)}
                        ${createField('Marka', job.make)}
                        ${createField('Modeli', job.model)}
                        ${createField('Ngjyra', job.color)}
                    </div>
                `)}

                ${createSection('Shenime', `
                    <p class="job-specification-panel__note">${escapeHTML(job.description || 'Nuk ka shenime per kete pune.')}</p>
                `, 'job-specification-panel__section--last')}
            </article>
        `;
    }

    function closeServiceModal() {
        const modal = document.querySelector('[data-service-modal]');
        const content = document.querySelector('[data-service-modal-content]');
        if (!modal || !content) return;

        modal.hidden = true;
        content.innerHTML = '';
        document.body.classList.remove('has-staff-service-modal');
    }

    function openServiceDetails(serviceId) {
        const service = services.find((item) => String(item.id) === String(serviceId));
        const modal = document.querySelector('[data-service-modal]');
        const content = document.querySelector('[data-service-modal-content]');
        if (!service || !modal || !content || typeof window.createServiceDetailPanel !== 'function') return;

        createServiceDetailPanel(content, service);
        content.querySelector('.service-detail-panel__actions')?.remove();
        modal.hidden = false;
        document.body.classList.add('has-staff-service-modal');
    }

    function renderServices() {
        const panel = document.querySelector('[data-service-list-panel]');
        const list = document.querySelector('[data-service-list]');
        if (!panel || !list) return;

        panel.hidden = false;

        if (services.length === 0) {
            list.innerHTML = '<p class="staff-service-list-panel__empty">Nuk ka sherbime te regjistruara ende.</p>';
            return;
        }

        list.innerHTML = services.map((service) => {
            if (typeof window.createServiceCardMarkup === 'function') {
                return window.createServiceCardMarkup(service);
            }

            return `<article class="staff-service-card" role="button" tabindex="0" data-service-details="${escapeHTML(service.id)}">${escapeHTML(service.title || 'Detajet e Sherbimit')}</article>`;
        }).join('');

        list.querySelectorAll('[data-service-details]').forEach((card) => {
            card.addEventListener('click', () => openServiceDetails(card.dataset.serviceDetails));
            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return;
                event.preventDefault();
                openServiceDetails(card.dataset.serviceDetails);
            });
        });
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
        const back = document.querySelector('[data-admin-job-back]');
        const jobId = getJobId();

        if (back) {
            back.href = 'admin-jobs.html';
        }

        document.querySelectorAll('[data-service-modal-close]').forEach((button) => {
            button.addEventListener('click', closeServiceModal);
        });

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

            services = Array.isArray(payload.job.services) ? payload.job.services : [];
            renderJobDetails(mount, payload.job);
            renderServices();
        } catch (error) {
            console.warn('Job details could not be loaded:', error);
            AdminPages.renderEmpty(mount, 'Detajet e punes nuk u ngarkuan.');
        }
    });
}());
