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

    function renderJobIcon() {
        return `
            <svg viewBox="0 0 64 64" fill="none" aria-hidden="true">
                <path d="M9 22.5c0-4 3.2-7.2 7.2-7.2h10.4c2 0 3.9.8 5.2 2.3l3 3.2h13c4 0 7.2 3.2 7.2 7.2v19.5H9v-25z" fill="#242424"></path>
                <path d="M9 29.5h46v18H9v-18z" fill="#303030"></path>
                <path d="M9 29.5h46v7H9v-7z" fill="#555555"></path>
                <path d="M9 29.5h46" stroke="#6f6f6f" stroke-width="2"></path>
            </svg>
        `;
    }

    function jobMatchesQuery(job, query) {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) {
            return true;
        }

        const searchable = [
            job.code,
            job.client,
            job.endDate,
            job.date,
            ...normalizeStaff(job)
        ].join(' ').toLowerCase();

        return searchable.includes(normalizedQuery);
    }

    function createCompletedJobCard(container, job = {}, options = {}) {
        if (!container) {
            return null;
        }

        const staff = normalizeStaff(job);
        const code = job.code ?? '';
        const client = job.client ?? '';
        const status = job.status ?? options.status ?? 'Aktiv';
        const endDate = job.endDate ?? job.date ?? '';

        container.classList.add('cj-card');
        container.dataset.jobId = job.id ?? '';
        container.setAttribute('role', 'button');
        container.setAttribute('tabindex', '0');
        container.setAttribute('aria-label', `${code} ${client}`.trim());
        container.innerHTML = `
            <div class="cj-card__top">
                <div class="cj-card__identity">
                    <span class="cj-card__icon" aria-hidden="true">${renderJobIcon()}</span>
                    <div>
                        <h3 class="cj-card__code">${escapeHTML(code)}</h3>
                        <p class="cj-card__client">${escapeHTML(client)}</p>
                    </div>
                </div>
                ${status ? `
                    <span class="cj-card__status" aria-label="Status: ${escapeHTML(status)}">
                        <span class="cj-card__status-dot" aria-hidden="true"></span>
                        <span>${escapeHTML(status)}</span>
                    </span>
                ` : ''}
            </div>
            <div class="cj-card__content">
                <p class="cj-card__label">${escapeHTML(options.staffLabel ?? 'Staff')}</p>
                <div class="cj-card__staff">
                    ${staff.map((member) => `<p class="cj-card__staff-member">${escapeHTML(member)}</p>`).join('')}
                </div>
                <p class="cj-card__label cj-card__date-label">${escapeHTML(options.dateLabel ?? 'Data e Përfundimit')}</p>
                <p class="cj-card__date">${escapeHTML(endDate)}</p>
            </div>
        `;

        function selectJob() {
            container.dispatchEvent(new CustomEvent('completed-jobs:select', {
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

    function createCompletedJobsPanel(container, data = {}) {
        if (!container) {
            return null;
        }

        const jobs = Array.isArray(data.jobs) ? data.jobs : [];
        let query = '';

        container.classList.add('cj');
        container.innerHTML = `
            <div class="cj__header">
                <div class="cj__header-row">
                    <h2 class="cj__title">${escapeHTML(data.title ?? 'Punët e përfunduara të lidhura me ju')}</h2>
                    <label class="cj__search">
                        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="m21 21-4.35-4.35M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6z" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"></path>
                        </svg>
                        <input class="cj__search-input" type="search" placeholder="${escapeHTML(data.searchPlaceholder ?? 'Kërko me targë ose emër klienti...')}" aria-label="${escapeHTML(data.searchLabel ?? 'Kërko punë të përfunduara')}">
                    </label>
                </div>
                <div class="cj__divider" aria-hidden="true"></div>
            </div>
            <div class="cj__scroll">
                <div class="cj__grid"></div>
            </div>
            <p class="cj__footer" aria-live="polite"></p>
        `;

        const grid = container.querySelector('.cj__grid');
        const input = container.querySelector('.cj__search-input');
        const footer = container.querySelector('.cj__footer');

        function render() {
            const filteredJobs = jobs.filter((job) => jobMatchesQuery(job, query));
            grid.innerHTML = '';

            if (filteredJobs.length === 0) {
                grid.innerHTML = `<div class="cj__empty">${escapeHTML(data.emptyText ?? 'Nuk u gjet asnjë punë e përfunduar')}</div>`;
            } else {
                filteredJobs.forEach((job) => {
                    const card = document.createElement('article');
                    grid.appendChild(card);
                    createCompletedJobCard(card, job, {
                        status: data.status,
                        staffLabel: data.staffLabel,
                        dateLabel: data.dateLabel,
                        onJobClick: data.onJobClick
                    });
                });
            }

            footer.textContent = data.totalText ?? `${filteredJobs.length} pune në total`;
            container.dispatchEvent(new CustomEvent('completed-jobs:filter', {
                bubbles: true,
                detail: { query, jobs: filteredJobs }
            }));
        }

        input.addEventListener('input', () => {
            query = input.value;
            render();
        });

        render();

        return {
            render,
            setQuery(value) {
                query = String(value ?? '');
                input.value = query;
                render();
            },
            getQuery() {
                return query;
            },
            getJobs() {
                return jobs.slice();
            }
        };
    }

    window.createCompletedJobCard = createCompletedJobCard;
    window.createCompletedJobsPanel = createCompletedJobsPanel;

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            createCompletedJobCard,
            createCompletedJobsPanel
        };
    }
}());
