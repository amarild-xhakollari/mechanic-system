(function () {
    const JOB_ICON_SRC = '../../../assets/images/default-icons/job-icon.png';
    const IMAGE_ICON_SRC = '../../../assets/images/default-icons/insert%20image.png';

    StaffPages.bindLogout();
    StaffPages.bindProfileDropdown();

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

    function getSourcePage(job = {}) {
        const requestedSource = new URLSearchParams(window.location.search).get('from');

        if (requestedSource === 'completed' || job.rawStatus === 'completed') {
            return {
                href: 'staff-completed-jobs.html',
                linkSelector: '[data-completed-link]'
            };
        }

        return {
            href: 'staff-active-jobs.html',
            linkSelector: '[data-active-link]'
        };
    }

    function setBackLink(job = {}) {
        const source = getSourcePage(job);
        const backLink = document.querySelector('[data-back-link]');
        const navLink = document.querySelector(source.linkSelector);
        const activeActions = document.querySelector('[data-active-actions]');

        if (backLink) {
            backLink.href = source.href;
        }

        if (activeActions) {
            activeActions.hidden = source.href !== 'staff-active-jobs.html';
        }

        if (navLink) {
            navLink.classList.add('is-active');
            navLink.setAttribute('aria-current', 'page');
        }
    }

    function renderEmpty(container, message) {
        container.innerHTML = `<p class="empty-state">${message}</p>`;
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

    function renderJobDetails(container, job = {}) {
        const isCompleted = job.rawStatus === 'completed';
        const clientEmail = job.clientEmail || '';
        const clientCode = job.clientCode || getClientCode(job.client);
        const vehicleMake = job.make || job.brand || '';
        const vehicleModel = job.model || '';
        const vehicleColor = job.color || '';

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
                        ${createField('Data e Perfundimit', isCompleted ? job.date : '')}
                    </div>
                `)}

                ${createSection('Detajet e Klientit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Emri i Klientit', job.client)}
                        ${createField('Numri i telefonit', job.clientPhone)}
                        ${createField('Kodi i Klientit', clientCode)}
                        ${createField('Email i Klientit', clientEmail)}
                    </div>
                `)}

                ${createSection('Detajet e Automjetit', `
                    <div class="job-specification-panel__field-grid">
                        ${createField('Targa', job.code)}
                        ${createField('Marka', vehicleMake)}
                        ${createField('Modeli', vehicleModel)}
                        ${createField('Ngjyra', vehicleColor)}
                    </div>
                `)}

                ${createSection('Shenime', `
                    <p class="job-specification-panel__note">${escapeHTML(job.description || 'Nuk ka shenime per kete pune.')}</p>
                `, 'job-specification-panel__section--last')}
            </article>
        `;
    }

    function bindServiceForm() {
        const form = document.querySelector('[data-service-form]');
        if (!form) return;

        const imageInput = form.querySelector('[data-service-image]');
        const preview = form.querySelector('[data-service-preview]');
        let selectedImage = '';

        imageInput?.addEventListener('change', () => {
            const file = imageInput.files && imageInput.files[0];
            if (!file) return;

            selectedImage = URL.createObjectURL(file);
            preview.style.backgroundImage = `url('${selectedImage}')`;
            preview.innerHTML = '';
        });

        form.querySelector('[data-service-cancel]')?.addEventListener('click', StaffServicePopups.closeServiceModal);
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const serviceTitle = form.querySelector('[data-service-title]')?.value.trim() || '';
            const note = form.querySelector('[data-service-note]')?.value.trim() || '';

            if (!serviceTitle || !note) {
                openErrorModal();
                return;
            }

            const serviceId = form.dataset.serviceId;
            const isEdit = form.dataset.mode === 'edit' && serviceId;
            if (form.dataset.mode === 'edit' && serviceId) {
                const service = services.find((item) => String(item.id) === String(serviceId));
                if (service) {
                    service.title = serviceTitle;
                    service.note = note;
                    if (selectedImage) service.image = selectedImage;
                }
            } else {
                services.unshift({
                    id: Date.now(),
                    title: serviceTitle,
                    note,
                    image: selectedImage
                });
            }

            renderServices();
            openSuccessModal(isEdit ? 'Sherbimi u modifikua me sukses.' : 'Sherbimi u krijua me sukses.');
        });
    }

    function openAddServiceForm() {
        StaffServicePopups.openServiceModal(StaffServicePopups.createServiceForm('create'), 'form');
        bindServiceForm();
    }

    function openErrorModal() {
        StaffServicePopups.openServiceModal(StaffServicePopups.createMessageModal('error'), 'message');
        document.querySelector('[data-message-action]')?.addEventListener('click', openAddServiceForm);
        document.querySelector('[data-service-cancel]')?.addEventListener('click', StaffServicePopups.closeServiceModal);
    }

    function openSuccessModal(message) {
        StaffServicePopups.openServiceModal(StaffServicePopups.createSuccessModal(message), 'message');
        document.querySelector('[data-success-close]')?.addEventListener('click', StaffServicePopups.closeServiceModal);
    }

    function openServiceDetails(serviceId) {
        const service = services.find((item) => String(item.id) === String(serviceId));
        if (!service) return;

        StaffServicePopups.openServiceModal(StaffServicePopups.createServiceDetails(service), 'details');
    }

    function createServiceCard(service) {
        return `
            <article class="staff-service-card" role="button" tabindex="0" data-service-details="${escapeHTML(service.id)}">
                <h3>${escapeHTML(service.title || 'Detajet e Sherbimit')}</h3>
                <p>Ne kete seksion mund te shikoni te gjitha informacionet dhe perditesimet mbi sherbimin e kryer.</p>
                <div class="staff-service-card__image" ${service.image ? `style="background-image:url('${escapeHTML(service.image)}')"` : ''}>
                    ${service.image ? '' : `<img src="${IMAGE_ICON_SRC}" alt="" aria-hidden="true">`}
                </div>
                <h4>Informacionet mbi sherbimin me poshte</h4>
                <p class="staff-service-card__note">${escapeHTML(service.note)}</p>
            </article>
        `;
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

        list.innerHTML = services.map(createServiceCard).join('');

        list.querySelectorAll('[data-service-details]').forEach((card) => {
            card.addEventListener('click', () => {
                openServiceDetails(card.dataset.serviceDetails);
            });

            card.addEventListener('keydown', (event) => {
                if (event.key !== 'Enter' && event.key !== ' ') {
                    return;
                }

                event.preventDefault();
                openServiceDetails(card.dataset.serviceDetails);
            });
        });

    }

    async function initPage() {
        const mount = document.querySelector('#staff-job-details-panel');
        const jobId = getJobId();

        if (!mount) return;

        if (!jobId) {
            setBackLink();
            renderEmpty(mount, 'Mungon ID e punes.');
            return;
        }

        mount.innerHTML = '<p class="empty-state">Duke ngarkuar detajet...</p>';

        const data = await StaffPages.loadData();
        StaffPages.fillUser(data.user);

        const job = data.jobs.find((item) => String(item.id) === String(jobId));
        setBackLink(job);

        if (!job) {
            renderEmpty(mount, 'Puna nuk u gjet.');
            return;
        }

        renderJobDetails(mount, job);
        renderServices();

        document.querySelector('[data-add-service]')?.addEventListener('click', openAddServiceForm);
        document.querySelector('[data-service-modal-close]')?.addEventListener('click', StaffServicePopups.closeServiceModal);

        document.querySelector('[data-complete-job]')?.addEventListener('click', () => {
            window.alert('Perfundimi i punes nuk eshte lidhur ende pa ndryshime ne PHP.');
        });
    }

    initPage().catch((error) => {
        console.warn('Staff job details could not load:', error);
        const mount = document.querySelector('#staff-job-details-panel');
        if (mount) {
            renderEmpty(mount, 'Detajet e punes nuk u ngarkuan.');
        }
    });
}());
