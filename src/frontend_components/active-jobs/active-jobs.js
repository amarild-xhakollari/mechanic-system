(function () {
    function escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[character]));
    }

    function normalizeStaff(job) {
        if (Array.isArray(job.staff)) {
            return job.staff;
        }

        if (Array.isArray(job.mechanics)) {
            return job.mechanics;
        }

        return [job.staff1, job.staff2, job.mechanic1, job.mechanic2].filter(Boolean);
    }

    function renderJobIcon(job) {
        if (job.iconSrc) {
            return `<img src="${escapeHTML(job.iconSrc)}" alt="">`;
        }

        return `
            <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M9 22.5c0-4 3.2-7.2 7.2-7.2h10.4c2 0 3.9.8 5.2 2.3l3 3.2h13c4 0 7.2 3.2 7.2 7.2v19.5H9v-25z" fill="#242424"></path>
                <path d="M9 29.5h46v18H9v-18z" fill="#303030"></path>
                <path d="M9 29.5h46v7H9v-7z" fill="#555555"></path>
                <path d="M9 29.5h46" stroke="#6f6f6f" stroke-width="2"></path>
            </svg>
        `;
    }

    function createActiveJobCard(container, job = {}, options = {}) {
        if (!container) {
            return null;
        }

        const staff = normalizeStaff(job);
        const status = job.status ?? options.status ?? 'Aktiv';
        const code = job.code ?? '';
        const client = job.client ?? '';
        const endDate = job.endDate ?? job.date ?? '';

        container.classList.add('active-job-card');
        container.dataset.jobId = job.id ?? '';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `${code} ${client}`.trim());
        container.innerHTML = `
            <div class="active-job-card__top">
                <div class="active-job-card__identity">
                    <span class="active-job-card__icon" aria-hidden="true">
                        ${renderJobIcon(job)}
                    </span>
                    <div class="active-job-card__heading">
                        <h3 class="active-job-card__code">${escapeHTML(code)}</h3>
                        <p class="active-job-card__client">${escapeHTML(client)}</p>
                    </div>
                </div>
                ${status ? `
                    <span class="active-job-card__status" aria-label="Status: ${escapeHTML(status)}">
                        <span class="active-job-card__status-dot" aria-hidden="true"></span>
                        <span>${escapeHTML(status)}</span>
                    </span>
                ` : ''}
            </div>

            <div class="active-job-card__content">
                <p class="active-job-card__label">${escapeHTML(options.staffLabel ?? job.staffLabel ?? 'Staff')}</p>
                <div class="active-job-card__staff">
                    ${staff.map((member) => `<p class="active-job-card__staff-member">${escapeHTML(member)}</p>`).join('')}
                </div>
                <p class="active-job-card__label active-job-card__date-label">${escapeHTML(options.dateLabel ?? job.dateLabel ?? 'Data e Përfundimit')}</p>
                <p class="active-job-card__date">${escapeHTML(endDate)}</p>
            </div>
        `;

        function selectJob() {
            container.dispatchEvent(new CustomEvent('active-job-card:select', {
                bubbles: true,
                detail: { job }
            }));

            if (typeof options.onJobClick === 'function') {
                options.onJobClick(job);
            }
        }

        container.onclick = selectJob;
        container.onkeydown = (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                selectJob();
            }
        };

        return container;
    }

    function createActiveJobsPanel(container, data = {}) {
        if (!container) {
            return null;
        }

        const jobs = Array.isArray(data.jobs) ? data.jobs : [];

        container.classList.add('active-jobs-panel');
        container.innerHTML = `
            <div class="active-jobs-panel__header">
                <div>
                    <h2 class="active-jobs-panel__title">${escapeHTML(data.title ?? 'Punë Aktive')}</h2>
                    <p class="active-jobs-panel__subtitle">${escapeHTML(data.subtitle ?? 'Në këtë panel mund të shikosh të gjitha punët aktive')}</p>
                </div>
                <button class="active-jobs-panel__action" type="button">
                    <span>${escapeHTML(data.actionText ?? 'Shiko të gjitha punët')}</span>
                    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true">
                        <path d="M15 8H32V25" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"></path>
                        <path d="M31 9 11 29" stroke-width="3.3" stroke-linecap="round"></path>
                        <path d="M28 30H8V10" stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                </button>
            </div>
            ${jobs.length > 0
                ? '<div class="active-jobs-panel__grid"></div>'
                : `<div class="active-jobs-panel__empty">${escapeHTML(data.emptyText ?? 'Nuk ka punë aktive')}</div>`}
        `;

        const grid = container.querySelector('.active-jobs-panel__grid');
        if (grid) {
            jobs.forEach((job) => {
                const card = document.createElement('article');
                grid.appendChild(card);
                createActiveJobCard(card, job, {
                    status: data.status,
                    staffLabel: data.staffLabel,
                    dateLabel: data.dateLabel,
                    onJobClick: data.onJobClick
                });
            });
        }

        container.querySelector('.active-jobs-panel__action').addEventListener('click', () => {
            container.dispatchEvent(new CustomEvent('active-jobs-panel:action', { bubbles: true }));

            if (typeof data.onAction === 'function') {
                data.onAction();
            }
        });

        return container;
    }

    window.createActiveJobCard = createActiveJobCard;
    window.createActiveJobsPanel = createActiveJobsPanel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createActiveJobCard,
            createActiveJobsPanel
        };
    }
}());